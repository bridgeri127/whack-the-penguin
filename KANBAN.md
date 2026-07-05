# Kanban Board — Whack the Penguin

> **v1 (Three.js)**: Complete and committed.
> **v2 (Godot)**: Complete, needs testing in Godot editor.

---

## Done (2D Canvas Version)

- [x] Core game loop and 7-state machine
- [x] Pixel art: penguin, yeti, cliff, terrain, mountains
- [x] Penguin drop animation with squash-and-stretch
- [x] Landing wobble, timing bar, yeti club swing
- [x] Launch physics, particle effects, camera follow
- [x] Distance tracking with localStorage high score
- [x] Space/click/touch input

## Done (3D Three.js v1)

- [x] Full scene: terrain, cliff, mountains, markers
- [x] Characters: penguin, yeti, club arm (all low-poly procedural)
- [x] 7-state game machine ported and tested
- [x] Camera system with flight follow and settle
- [x] Animations: squash/stretch, spin, club swing, eye tracking, yeti expressions
- [x] Particles: ambient snow, hit burst, snow burst, bounce dust
- [x] UI: intro overlay, result panel, timing bar, Again button
- [x] localStorage high score persistence
- [x] Bug fix: LEdge_Y_3D temporal dead zone forward reference

## Done (Godot v2)

- [x] Godot 4 project file (1200x600, canvas_items stretch, nearest filtering)
- [x] Sprite generation script (gen_sprites.py — 10 pixel art sprites via Pillow)
- [x] Scene file (main.tscn — full node hierarchy with UI)
- [x] Game controller script (game_controller.gd — complete 7-state machine port)
- [x] Physics port (gravity, launch, bounce, coordinate system conversion)
- [x] Camera system (state-driven targets, lerp follow during flight)
- [x] Animations (squash/stretch, flight spin, club swing, wobble, yeti idle)
- [x] Particles (ambient snow via GPUParticles2D, burst particles as Sprite2D children)
- [x] Save system (ConfigFile persistence for best distance)
- [x] Input handling (space/click for state transitions)

---

## Backlog (Godot v2 — Polish)

### Testing & Bugs
- [ ] Test in Godot editor — verify scene loads, game runs end-to-end
- [ ] Fix any scene loading errors
- [ ] Tune terrain collision (single stretched sprite vs proper tile-based)
- [ ] Distance markers (empty node in scene, not yet populated)

### Polish
- [ ] Yeti expressions (mouth/brow animation on swing)
- [ ] Screen shake on impact
- [ ] Sound effects (windup, whoosh, thwack, bounce, landing)
- [ ] Trail/sparkle effect on penguin during flight
- [ ] Score callouts ("Nice!", "Great shot!", "Incredible!", "New record!")

### Features
- [ ] Multiple rounds tracking (top 3 distances, average)
- [ ] Share result button (copy text to clipboard)
- [ ] Title screen animation (penguin silhouette on ledge, snow)
