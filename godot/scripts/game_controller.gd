extends Node2D

# --- Constants ---
enum State { INTRO, DROPPING, LAND_WOBBLE, READY, SWING, FLYING, LANDED }

const GRAVITY = 900
const BOUNCE_DAMPING = 0.35
const HORIZONTAL_DAMPING = 0.6
const MAX_POWER = 1400
const GROUND_BASE = 520
const LEDGE_Y = 390  # GROUND_BASE - 130
const LEDGE_X = 30
const PENGUIN_START = Vector2(55, LEDGE_Y + 32)
const YETI_POS = Vector2(170, 30)
const LAND_X = 120

const DROP_PAUSE = 0.5
const DROP_HOP_VY = -400
const DROP_STRETCH_RATE = 0.0003
const TIMING_OSCILLATION_SPEED = 2.8
const SWING_WINDBACK = -1.2
const SWING_FORWARD = 1.0
const SWING_DURATION = 0.25
const WOBBLE_DURATION = 0.8
const PENGUIN_SPIN_SPEED = 6.0
const PENGUIN_SETTLE_BOUNCES = 4
const PENGUIN_SETTLE_VY = 80
const SQUASH_RECOVERY_FAST = 10.0
const SQUASH_RECOVERY_SLOW = 5.0
const CAMERA_FLY_LERP_X = 6.0
const CAMERA_FLY_LERP_Y = 4.0
const CAMERA_LANDED_LERP = 1.5

# --- Node References ---
@onready var penguin = $Penguin
@onready var yeti = $Yeti
@onready var club_arm = $Yeti/ClubArm
@onready var club = $Yeti/ClubArm/Club
@onready var mountains = $Mountains
@onready var snow_particles = $SnowParticles
@onready var intro_overlay = $UI/IntroOverlay
@onready var result_panel = $UI/ResultPanel
@onready var distance_label = $UI/ResultPanel/Margin/VBox/DistanceLabel
@onready var best_label = $UI/ResultPanel/Margin/VBox/BestLabel
@onready var again_button = $UI/ResultPanel/Margin/VBox/AgainButton
@onready var timing_bar = $UI/TimingBar
@onready var bar_indicator = $UI/TimingBar/BarIndicator

# --- Game State ---
var state = State.INTRO
var best_distance = 0.0

# Penguin physics
var penguin_vx = 0.0
var penguin_vy = 0.0
var squash = 1.0
var bounce_count = 0

# Timers
var swing_timer = 0.0
var wobble_timer = 0.0
var drop_timer = 0.0

# Timing bar
var timing_value = 0.0

# Swing animation
var swing_angle = 0.0

# Camera
var camera_target = Vector2(80, 280)

# Flags for particle effects
var just_launched = false
var just_bounced = false

# --- Terrain Height ---
func get_terrain_y(x: float) -> float:
	return sin(x * 0.005) * 18 + sin(x * 0.021) * 6

# --- _ready ---
func _ready():
	# Load best distance
	var config = ConfigFile.load("user://save.cfg")
	if config.has_section_key("game", "best"):
		best_distance = config.get_value("game", "best", 0.0)
	best_label.text = "Best: %dm" % int(best_distance)

	# Connect again button
	again_button.pressed.connect(_on_again_pressed)

	# Set nearest filtering on all sprites for pixel art
	_set_nearest(penguin)
	_set_nearest(yeti)
	_set_nearest(club)
	_set_nearest($Sky)
	_set_nearest($Cliff)
	_set_nearest($Terrain/TerrainStrip)
	_set_nearest(snow_particles)

	# Also set on mountain sprites
	for child in mountains.get_children():
		for sprite in child.get_children():
			_set_nearest(sprite)

	# Initial positions
	penguin.position = PENGUIN_START
	yeti.position = YETI_POS

	# Camera
	get_viewport().size_changed.connect(_on_resize)
	_on_resize()

	# Initial camera position
	$CanvasLayer.position = Vector2.ZERO

func _set_nearest(sprite):
	if sprite is Sprite2D:
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	elif sprite is GPUParticles2D:
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST

func _on_resize():
	# Keep game centered with letterbox/pillarbox
	pass

# --- _process ---
func _process(delta):
	match state:
		State.INTRO:
			_update_yeti_idle(delta)

		State.DROPPING:
			_update_dropping(delta)

		State.LAND_WOBBLE:
			_update_wobble(delta)

		State.READY:
			_update_ready(delta)
			_update_yeti_idle(delta)

		State.SWING:
			_update_swing(delta)

		State.FLYING:
			_update_flying(delta)

		State.LANDED:
			squash = lerp(squash, 1.0, delta * SQUASH_RECOVERY_SLOW)

	_update_camera(delta)
	_update_penguin_animation(delta)
	_update_club_swing()
	_update_particles(delta)

# --- State Updates ---
func _update_dropping(delta):
	drop_timer += delta

	if drop_timer < DROP_PAUSE:
		return  # dramatic pause

	var fall_time = drop_timer - DROP_PAUSE

	# Small hop at start
	if fall_time < 0.016:
		penguin_vy = DROP_HOP_VY

	# Horizontal interpolation
	var hop_time = max(0.0, fall_time - 0.016)
	var hop_duration = 0.28
	var t = min(1.0, hop_time / hop_duration)
	penguin.position.x = PENGUIN_START.x + (LAND_X - PENGUIN_START.x) * t

	# Gravity (negative Y = up in Godot)
	penguin_vy -= GRAVITY * delta
	penguin.position.y += penguin_vy * delta

	# Stretch during fall
	squash = min(1.3, 1.0 + abs(penguin_vy) * DROP_STRETCH_RATE)

	# Ground collision
	var terrain_y = get_terrain_y(penguin.position.x)
	if penguin.position.y <= terrain_y:
		penguin.position.y = terrain_y
		state = State.LAND_WOBBLE
		wobble_timer = 0.0
		squash = 1.35
		penguin_vy = 0.0

func _update_wobble(delta):
	wobble_timer += delta
	squash = lerp(squash, 1.0, delta * SQUASH_RECOVERY_FAST)

	if wobble_timer >= WOBBLE_DURATION:
		state = State.READY
		squash = 1.0
		timing_bar.visible = true

func _update_ready(_delta):
	timing_value = sin(Time.get_ticks_msec() * 0.001 * TIMING_OSCILLATION_SPEED)

	# Position timing bar above yeti
	var screen_pos = yeti.global_position
	screen_pos.y -= 80
	timing_bar.position = screen_pos
	bar_indicator.position.x = ((timing_value + 1.0) / 2.0) * (timing_bar.size.x - 4) - 2

	# Wind back yeti arm slightly
	swing_angle = SWING_WINDBACK + (timing_value + 1.0) * (SWING_FORWARD - SWING_WINDBACK) * 0.15

func _update_swing(delta):
	swing_timer += delta
	swing_angle = lerp(swing_angle, SWING_FORWARD, delta * 14.0)

	if swing_timer >= SWING_DURATION:
		_launch_penguin()

func _launch_penguin():
	var power = cos(timing_value * PI / 2.0)
	var angle_deg = 35.0 - timing_value * 55.0
	var angle_rad = deg_to_rad(angle_deg)
	var speed = power * MAX_POWER + 200.0

	# In Godot, positive Y is UP (opposite of the 2D canvas)
	penguin_vx = cos(angle_rad) * speed
	penguin_vy = sin(angle_rad) * speed  # positive = up in Godot

	squash = 0.6
	state = State.FLYING
	bounce_count = 0
	just_launched = true

	# Spawn hit particles
	_spawn_burst(penguin.global_position, 15, [
		Color(1, 0.84, 0),    # gold
		Color(0.9, 0.5, 0.1), # orange
		Color(0.9, 0.3, 0.2), # red
		Color(1, 1, 1),       # white
	], 1.5, 180.0)

func _update_flying(delta):
	penguin.position.x += penguin_vx * delta
	penguin.position.y += penguin_vy * delta
	penguin_vy -= GRAVITY * delta

	# Squash recovery
	squash = lerp(squash, 1.0, delta * SQUASH_RECOVERY_FAST)

	# Ground collision
	var terrain_y = get_terrain_y(penguin.position.x)
	if penguin.position.y <= terrain_y and penguin_vy < 0:
		penguin.position.y = terrain_y
		bounce_count += 1

		penguin_vy = abs(penguin_vy) * BOUNCE_DAMPING
		penguin_vx *= HORIZONTAL_DAMPING
		squash = 1.3
		just_bounced = true

		# Spawn snow burst
		_spawn_burst(Vector2(penguin.position.x, penguin.position.y + 5), 12, [
			Color(0.96, 0.96, 0.96),
			Color(0.82, 0.85, 0.88),
			Color(0.82, 0.91, 0.94),
			Color(1, 1, 1),
		], 1.0, 120.0)

		if bounce_count >= PENGUIN_SETTLE_BOUNCES or abs(penguin_vy) < PENGUIN_SETTLE_VY:
			penguin_vy = 0.0
			penguin_vx = 0.0
			state = State.LANDED

			var distance = max(0.0, penguin.position.x - LAND_X)
			if distance > best_distance:
				best_distance = distance
				_save_best()

			distance_label.text = "%dm" % int(distance)
			best_label.text = "Best: %dm" % int(best_distance)
			result_panel.visible = true

# --- Animation ---
func _update_penguin_animation(delta):
	# Squash and stretch (volume-preserving)
	var sx = 1.0 / sqrt(squash)
	penguin.scale = Vector2(sx * 8, squash * 8)

	# Rotation
	if state == State.FLYING:
		penguin.rotation += delta * deg_to_rad(PENGUIN_SPIN_SPEED * 180)
	elif state == State.LAND_WOBBLE:
		var wobble = sin(wobble_timer * 25) * exp(-wobble_timer * 8) * 0.15
		penguin.rotation = wobble
	else:
		penguin.rotation = 0

	# Yeti eye tracking (rotate yeti head toward penguin)
	var dx = penguin.position.x - yeti.position.x
	yeti.scale.x = 8.0 if dx > 0 else -8.0  # flip yeti to face penguin

func _update_club_swing():
	club_arm.rotation = swing_angle

func _update_yeti_idle(delta):
	# Subtle breathing bob
	yeti.position.y = YETI_POS.y + sin(Time.get_ticks_msec() * 0.003) * 1.5

# --- Camera ---
func _update_camera(delta):
	var target = Vector2.ZERO

	match state:
		State.INTRO:
			target = Vector2(80, 250)
		State.DROPPING, State.LAND_WOBBLE, State.READY, State.SWING:
			target = Vector2(120, 150)
		State.FLYING:
			target.x = penguin.position.x - 100
			target.y = max(penguin.position.y + 50, 80)
		State.LANDED:
			target.x = penguin.position.x - 50
			target.y = max(penguin.position.y + 60, 80)

	var speed_x = CAMERA_FLY_LERP_X if state == State.FLYING else CAMERA_LANDED_LERP
	var speed_y = CAMERA_FLY_LERP_Y if state == State.FLYING else CAMERA_LANDED_LERP

	camera_target.x = lerp(camera_target.x, target.x, delta * speed_x)
	camera_target.y = lerp(camera_target.y, target.y, delta * speed_y)

	# Parallax mountains
	for child in mountains.get_children():
		var factor = 0.3 if "Back" in child.name else 0.5
		child.position.x = -camera_target.x * factor

# --- Particles ---
func _spawn_burst(origin, count, colors, spread, speed):
	for i in range(count):
		var particle = Sprite2D.new()
		var size = 1 + randf() * 2
		particle.texture = snow_particles.texture
		particle.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		particle.scale = Vector2(size, size)
		particle.position = origin
		particle.modulate = colors[randi() % colors.size()]

		var angle = randf() * TAU
		var y_angle = (randf() - 0.5) * PI
		var spd = speed * (0.5 + randf() * 0.5)

		particle.set_meta("vx", cos(angle) * cos(y_angle) * spread * spd)
		particle.set_meta("vy", abs(sin(y_angle)) * spread * spd + speed * 0.5)
		particle.set_meta("life", 1.0)

		add_child(particle)


# Update burst particles
func _update_particles(delta):
	for child in get_children():
		if child is Sprite2D and child.has_meta("life"):
			child.set_meta("life", child.get_meta("life") - delta * 1.5)
			child.modulate.a = max(0, child.get_meta("life"))
			child.get_meta("vy") -= GRAVITY * delta
			child.position.x += child.get_meta("vx") * delta
			child.position.y += child.get_meta("vy") * delta

			if child.get_meta("life") <= 0:
				child.queue_free()

# --- Input ---
func _unhandled_input(event):
	if not event.is_action_pressed("confirm"):
		return

	match state:
		State.INTRO:
			_start_game()
		State.READY:
			_start_swing()
		State.LANDED:
			_reset_game()

# --- State Transitions ---
func _start_game():
	state = State.DROPPING
	drop_timer = 0.0
	intro_overlay.visible = false

func _start_swing():
	state = State.SWING
	swing_timer = 0.0
	timing_bar.visible = false

func _reset_game():
	state = State.INTRO
	penguin.position = PENGUIN_START
	penguin.rotation = 0
	penguin_vx = 0.0
	penguin_vy = 0.0
	squash = 1.0
	bounce_count = 0
	drop_timer = 0.0
	swing_timer = 0.0
	wobble_timer = 0.0
	timing_value = 0.0
	swing_angle = 0.0
	intro_overlay.visible = true
	result_panel.visible = false
	timing_bar.visible = false
	camera_target = Vector2(80, 280)

func _on_again_pressed():
	_reset_game()

# --- Save ---
func _save_best():
	var config = ConfigFile.new()
	config.set_value("game", "best", best_distance)
	config.save("user://save.cfg")
