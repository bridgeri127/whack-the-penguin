// ============================================================
// Whack the Penguin — HTML5 Remake
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

// --- Constants ---
const STATES = {
  INTRO: 0,
  DROPPING: 1,   // Penguin jumps from ledge, falls to ground in front of yeti
  LAND_WOBBLE: 2, // Penguin bounces/wobbles after landing
  READY: 3,      // Timing bar active, player can swing
  SWING: 4,      // Yeti is swinging (club animation)
  FLYING: 5,     // Penguin flying through air
  LANDED: 6,     // Result shown
};

const GRAVITY = 900;
const BOUNCE_DAMPING = 0.35;
const MAX_POWER = 1400;
const GROUND_BASE = 520;

// Scene layout
const LEDGE_X = 30;
const LEDGE_Y = 130;
const PENGUIN_START = { x: LEDGE_X + 25, y: LEDGE_Y - 32 };
const YETI_X = 170;
const YETI_Y = 490;
// Penguin lands here (in front of yeti)
const LAND_X = 120;
const LAND_Y = GROUND_BASE - 32 - Math.sin(LAND_X * 0.005) * 18 - Math.sin(LAND_X * 0.021) * 6;

// --- Game State ---
let state = STATES.INTRO;
let cameraX = 0;
let penguin = {};
let yeti = {};
let timing = { value: 0, phase: 0 };
let particles = [];
let snowflakes = [];
let swingTimer = 0;
let wobbleTimer = 0;
let dropTimer = 0;

// --- Init ---
function resetPenguin() {
  return {
    x: PENGUIN_START.x,
    y: PENGUIN_START.y,
    targetX: LAND_X,
    targetY: LAND_Y,
    vx: 0,
    vy: 0,
    rotation: 0,
    bounceCount: 0,
    hurt: false,
    wobble: 0,
    squash: 1,
    launchX: 0,
  };
}

function resetGame() {
  state = STATES.INTRO;
  cameraX = 0;
  penguin = resetPenguin();
  yeti = { swingAngle: -1.2, swingTarget: -1.2, prepared: false };
  timing = { value: 0, phase: 0 };
  particles = [];
  swingTimer = 0;
  wobbleTimer = 0;
  dropTimer = 0;

  overlay.classList.remove('hidden');
  document.getElementById('title').textContent = 'Whack the Penguin';
  document.getElementById('subtitle').textContent = 'Press Space or Click to start';
  document.getElementById('result-panel').classList.add('hidden');
}

// --- Terrain ---
function getTerrainY(x) {
  return GROUND_BASE + Math.sin(x * 0.005) * 18 + Math.sin(x * 0.021) * 6;
}

// --- Drawing ---
function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, 600);
  grad.addColorStop(0, '#5ba3d9');
  grad.addColorStop(0.5, '#87ceeb');
  grad.addColorStop(1, '#e8f4f8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 600);
}

function drawMountains() {
  ctx.fillStyle = '#c8dce8';
  ctx.beginPath();
  ctx.moveTo(0, 420);
  for (let sx = 0; sx <= 1200; sx += 3) {
    const wx = sx + cameraX * 0.2;
    const h = Math.sin(wx * 0.003) * 60 + Math.sin(wx * 0.008) * 30;
    ctx.lineTo(sx, 360 + h);
  }
  ctx.lineTo(1200, 520);
  ctx.lineTo(0, 520);
  ctx.fill();

  ctx.fillStyle = '#d8e8f0';
  ctx.beginPath();
  ctx.moveTo(0, 440);
  for (let sx = 0; sx <= 1200; sx += 3) {
    const wx = sx + cameraX * 0.4;
    const h = Math.sin(wx * 0.006) * 40 + Math.sin(wx * 0.015) * 20;
    ctx.lineTo(sx, 400 + h);
  }
  ctx.lineTo(1200, 520);
  ctx.lineTo(0, 520);
  ctx.fill();
}

function drawGround() {
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.moveTo(-10, 600);
  for (let sx = -10; sx <= 1210; sx += 4) {
    const wx = sx + cameraX;
    if (wx < 0) continue;
    ctx.lineTo(sx, getTerrainY(wx));
  }
  ctx.lineTo(1210, 600);
  ctx.fill();

  ctx.strokeStyle = '#d0d8e0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let started = false;
  for (let sx = -10; sx <= 1210; sx += 4) {
    const wx = sx + cameraX;
    if (wx < 0) continue;
    const ty = getTerrainY(wx);
    if (!started) { ctx.moveTo(sx, ty); started = true; }
    else ctx.lineTo(sx, ty);
  }
  ctx.stroke();
}

function drawCliff() {
  const cx = LEDGE_X - 25 - cameraX;

  // Rock face
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(cx, 0, 75, GROUND_BASE + 10);

  // Rocky texture
  ctx.fillStyle = '#7a6348';
  for (let i = 0; i < 12; i++) {
    const rx = cx + 5 + ((i * 31) % 55);
    const ry = 40 + ((i * 53) % (GROUND_BASE - 40));
    ctx.fillRect(rx, ry, 10 + (i % 5) * 3, 6);
  }

  // Snow cap
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx, 0, 75, 24);

  // Ledge platform
  ctx.fillStyle = '#6b5b45';
  ctx.fillRect(cx, LEDGE_Y, 100, 16);

  // Snow on ledge
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(cx, LEDGE_Y, 100, 6);

  // Icicles
  ctx.fillStyle = '#c8e8f8';
  for (let i = 0; i < 4; i++) {
    const ix = cx + 10 + i * 22;
    const ih = 6 + (i % 3) * 4;
    ctx.fillRect(ix, LEDGE_Y + 16, 4, ih);
  }
}

function drawPenguin(x, y, rotation, squash, wobble) {
  const sx = x - cameraX;
  ctx.save();
  ctx.translate(sx + 16, y + 20);
  ctx.rotate(rotation + wobble * 0.15);
  ctx.scale(2 - squash, squash); // squash and stretch
  ctx.translate(-(sx + 16), -(y + 20));

  // Body
  ctx.fillStyle = '#1a1a2e';
  drawBlock(sx + 6, y + 6, 20, 18);
  drawBlock(sx + 2, y + 12, 28, 12);

  // Belly
  ctx.fillStyle = '#f0f0f0';
  drawBlock(sx + 10, y + 14, 12, 10);

  // Eyes
  if (penguin.hurt) {
    // X eyes
    ctx.fillStyle = '#fff';
    drawBlock(sx + 8, y + 8, 6, 6);
    drawBlock(sx + 18, y + 8, 6, 6);
    ctx.fillStyle = '#ff0000';
    drawBlock(sx + 9, y + 9, 2, 2);
    drawBlock(sx + 13, y + 9, 2, 2);
    drawBlock(sx + 19, y + 9, 2, 2);
    drawBlock(sx + 23, y + 9, 2, 2);
  } else {
    ctx.fillStyle = '#fff';
    drawBlock(sx + 8, y + 8, 6, 6);
    drawBlock(sx + 18, y + 8, 6, 6);
    ctx.fillStyle = '#000';
    drawBlock(sx + 10, y + 10, 3, 3);
    drawBlock(sx + 20, y + 10, 3, 3);
  }

  // Beak
  ctx.fillStyle = '#ff8c00';
  drawBlock(sx + 13, y + 13, 6, 4);

  // Flippers
  ctx.fillStyle = '#1a1a2e';
  if (state === STATES.DROPPING) {
    // Flippers out during fall
    drawBlock(sx - 4, y + 10, 8, 10);
    drawBlock(sx + 28, y + 10, 8, 10);
  } else {
    drawBlock(sx - 2, y + 14, 8, 12);
    drawBlock(sx + 26, y + 14, 8, 12);
  }

  // Feet
  ctx.fillStyle = '#ff8c00';
  drawBlock(sx + 8, y + 26, 6, 5);
  drawBlock(sx + 18, y + 26, 6, 5);

  ctx.restore();
}

function drawBlock(x, y, w, h) {
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawYeti(x, y, swingAngle) {
  const sx = x - cameraX;

  // Body
  ctx.fillStyle = '#d0d0d0';
  drawBlock(sx + 6, y - 32, 30, 38);
  drawBlock(sx + 2, y - 20, 38, 22);

  // Head
  ctx.fillStyle = '#e0e0e0';
  drawBlock(sx + 10, y - 52, 22, 22);
  drawBlock(sx + 8, y - 48, 26, 14);

  // Hair tuft
  ctx.fillStyle = '#c8c8c8';
  drawBlock(sx + 14, y - 56, 4, 6);
  drawBlock(sx + 20, y - 58, 4, 8);
  drawBlock(sx + 26, y - 56, 4, 6);

  // Eyes (look at penguin)
  ctx.fillStyle = '#fff';
  drawBlock(sx + 14, y - 46, 6, 6);
  drawBlock(sx + 22, y - 46, 6, 6);
  ctx.fillStyle = '#222';
  // Pupils track penguin
  const penguinDir = penguin.x > x ? 0 : -2;
  drawBlock(sx + 16 + penguinDir, y - 44, 3, 3);
  drawBlock(sx + 24 + penguinDir, y - 44, 3, 3);

  // Angry brows
  ctx.fillStyle = '#888';
  drawBlock(sx + 14, y - 48, 6, 2);
  drawBlock(sx + 22, y - 48, 6, 2);

  // Mouth
  ctx.fillStyle = '#333';
  if (state === STATES.FLYING) {
    // Excited open mouth
    drawBlock(sx + 16, y - 38, 10, 5);
    ctx.fillStyle = '#ff4444';
    drawBlock(sx + 18, y - 36, 6, 3);
  } else if (state === STATES.SWING) {
    // Straining
    drawBlock(sx + 16, y - 38, 10, 6);
    ctx.fillStyle = '#ff4444';
    drawBlock(sx + 18, y - 36, 6, 4);
  } else {
    drawBlock(sx + 17, y - 36, 8, 3);
  }

  // Legs
  ctx.fillStyle = '#b8b8b8';
  drawBlock(sx + 8, y + 6, 10, 18);
  drawBlock(sx + 22, y + 6, 10, 18);

  // Feet
  ctx.fillStyle = '#888';
  drawBlock(sx + 6, y + 22, 12, 5);
  drawBlock(sx + 22, y + 22, 12, 5);

  // Fur detail
  ctx.fillStyle = '#c0c0c0';
  drawBlock(sx, y - 16, 6, 10);
  drawBlock(sx + 34, y - 16, 6, 10);

  // Club arm (swings) — drawn LAST so it's on top
  ctx.save();
  ctx.translate(sx + 2, y - 24); // pivot on left side of yeti (reaches toward penguin)
  ctx.rotate(swingAngle);

  // Arm
  ctx.fillStyle = '#b8b8b8';
  drawBlock(-2, -3, 18, 7);

  // Club handle
  ctx.fillStyle = '#8b4513';
  drawBlock(14, -4, 18, 8);

  // Club head
  ctx.fillStyle = '#6b3410';
  drawBlock(28, -7, 14, 14);

  // Club detail
  ctx.fillStyle = '#5a2d0c';
  drawBlock(32, -5, 3, 10);
  drawBlock(38, -5, 3, 10);

  ctx.restore();
}

function drawTimingBar() {
  const sx = YETI_X - cameraX;
  const barY = YETI_Y - 90;
  const w = 130;
  const h = 14;

  // BG
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(sx - w/2, barY, w, h);

  // Left zone (early)
  const lg = ctx.createLinearGradient(sx - w/2, 0, sx - 8, 0);
  lg.addColorStop(0, '#cc3333');
  lg.addColorStop(1, '#dd8833');
  ctx.fillStyle = lg;
  ctx.fillRect(sx - w/2, barY, w/2 - 8, h);

  // Center (perfect)
  ctx.fillStyle = '#44dd66';
  ctx.fillRect(sx - 10, barY, 20, h);

  // Right zone (late)
  const rg = ctx.createLinearGradient(sx + 10, 0, sx + w/2, 0);
  rg.addColorStop(0, '#dd8833');
  rg.addColorStop(1, '#cc3333');
  ctx.fillStyle = rg;
  ctx.fillRect(sx + 10, barY, w/2 - 10, h);

  // Indicator
  const ix = sx + timing.value * (w/2 - 4);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fillRect(ix - 2, barY - 3, 5, h + 6);
  ctx.shadowBlur = 0;

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx - w/2, barY, w, h);

  // Labels
  ctx.fillStyle = '#fff';
  ctx.font = '10px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('WHACK!', sx, barY + h + 14);
}

function drawDistanceMarkers() {
  ctx.font = '10px Courier New';
  ctx.textAlign = 'center';
  for (let d = 100; d < 2500; d += 100) {
    const sx = d - cameraX;
    if (sx < 30 || sx > 1180) continue;
    const ty = getTerrainY(d);
    ctx.fillStyle = '#999';
    ctx.fillRect(sx, ty, 2, 10);
    if (d % 200 === 0) {
      ctx.fillText(`${d}`, sx, ty + 20);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function drawSnow() {
  ctx.fillStyle = '#fff';
  snowflakes.forEach(s => {
    const sx = ((s.x - cameraX * 0.5) % 1200 + 1200) % 1200;
    ctx.globalAlpha = s.alpha;
    ctx.fillRect(sx, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 1;
}

// --- Particles ---
function spawnHitParticles(x, y) {
  // Impact stars
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 / 15) * i;
    const speed = 150 + Math.random() * 200;
    particles.push({
      x: x + 12,
      y: y + 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color: ['#ffd700', '#ff8c00', '#ff4444', '#fff'][Math.floor(Math.random() * 4)],
      life: 1,
    });
  }
  // Snow burst
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x + Math.random() * 24,
      y: y + Math.random() * 20,
      vx: (Math.random() - 0.3) * 250,
      vy: -Math.random() * 250,
      size: 2 + Math.random() * 3,
      color: '#fff',
      life: 1,
    });
  }
}

function spawnLandParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x + Math.random() * 24,
      y: y + 28,
      vx: (Math.random() - 0.5) * 120,
      vy: -Math.random() * 80,
      size: 2 + Math.random() * 3,
      color: '#e8f0f8',
      life: 0.8,
    });
  }
}

function spawnBounceParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x + Math.random() * 24,
      y: y,
      vx: (Math.random() - 0.5) * 150,
      vy: -Math.random() * 100,
      size: 2 + Math.random() * 3,
      color: '#e8f0f8',
      life: 1,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt;
    p.life -= dt * 1.5;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// --- Snow ---
function initSnow() {
  snowflakes = [];
  for (let i = 0; i < 50; i++) {
    snowflakes.push({
      x: Math.random() * 1200,
      y: Math.random() * 600,
      size: 2 + Math.random() * 2,
      speed: 30 + Math.random() * 40,
      alpha: 0.3 + Math.random() * 0.5,
    });
  }
}

function updateSnow(dt) {
  snowflakes.forEach(s => {
    s.y += s.speed * dt;
    s.x += Math.sin(s.y * 0.02) * 20 * dt;
    if (s.y > 600) {
        s.y = -5;
        s.x = Math.random() * 1200;
    }
  });
}

// --- Game Logic ---
function startGame() {
  state = STATES.DROPPING;
  overlay.classList.add('hidden');
  penguin.vx = 0;
  penguin.vy = 0;
  penguin.squash = 1;
  penguin.wobble = 0;
  penguin.hurt = false;
  dropTimer = 0;
  yeti.swingTarget = -1.2; // wind back
  timing.phase = 0;
}

function triggerSwing() {
  state = STATES.SWING;
  swingTimer = 0;
  yeti.swingTarget = 1.0; // swing forward
}

function launchPenguin() {
  const t = timing.value; // -1 to 1

  // Power: cosine falloff from center
  const power = Math.cos(t * Math.PI / 2);

  // Angle: varies with timing
  const angleDeg = 35 - t * 55;
  const angle = (angleDeg * Math.PI) / 180;

  const speed = power * MAX_POWER + 200;
  penguin.vx = Math.cos(angle) * speed;
  penguin.vy = -Math.sin(angle) * speed;
  penguin.hurt = true;
  penguin.squash = 0.6; // squish on impact
  penguin.rotation = 0;
  penguin.launchX = penguin.x;

  spawnHitParticles(penguin.x, penguin.y);

  state = STATES.FLYING;
  penguin.bounceCount = 0;
}

// --- Update ---
function update(dt) {
  // Smooth yeti swing
  const swingSpeed = state === STATES.SWING ? 14 : 6;
  yeti.swingAngle += (yeti.swingTarget - yeti.swingAngle) * dt * swingSpeed;

  // ---- DROPPING ----
  if (state === STATES.DROPPING) {
    dropTimer += dt;

    // Delayed start (dramatic pause on ledge)
    if (dropTimer < 0.5) {
      // Standing on ledge, doing nothing
    } else {
      // Jump off and arc toward landing spot
      const fallT = (dropTimer - 0.5);

      // Horizontal: move toward landing spot
      penguin.x = PENGUIN_START.x + (LAND_X - PENGUIN_START.x) * Math.min(fallT * 1.2, 1);

      // Vertical: free fall with slight jump
      if (fallT < 0.15) {
        // Small hop up
        penguin.vy = -200;
        penguin.vy += GRAVITY * dt;
        penguin.y += penguin.vy * dt;
      } else {
        penguin.vy += GRAVITY * dt;
        penguin.y += penguin.vy * dt;

        // Squash on landing
        if (penguin.y + 32 >= LAND_Y) {
          penguin.y = LAND_Y;
          penguin.vy = 0;
          penguin.vx = 0;
          penguin.squash = 1.35; // squished flat
          spawnLandParticles(penguin.x, penguin.y);
          state = STATES.LAND_WOBBLE;
          wobbleTimer = 0;
        }
      }

      // Stretch during fall
      if (penguin.vy > 100) {
        penguin.squash = Math.min(1.3, 1 + penguin.vy * 0.0003);
      }
    }
  }

  // ---- LAND WOBBLE ----
  if (state === STATES.LAND_WOBBLE) {
    wobbleTimer += dt;

    // Recover squash
    penguin.squash += (1 - penguin.squash) * dt * 10;

    // Wobble back and forth
    penguin.wobble = Math.sin(wobbleTimer * 20) * Math.exp(-wobbleTimer * 5);

    if (wobbleTimer > 0.8) {
      state = STATES.READY;
      penguin.squash = 1;
      penguin.wobble = 0;
    }
  }

  // ---- READY ----
  if (state === STATES.READY) {
    timing.phase += 2.8 * dt;
    timing.value = Math.sin(timing.phase);
  }

  // ---- SWING ----
  if (state === STATES.SWING) {
    swingTimer += dt;

    // Check if club reached penguin (swing is about 0.25s to forward position)
    if (swingTimer > 0.25) {
      launchPenguin();
    }
  }

  // ---- FLYING ----
  if (state === STATES.FLYING) {
    penguin.vy += GRAVITY * dt;
    penguin.x += penguin.vx * dt;
    penguin.y += penguin.vy * dt;
    penguin.rotation += dt * 6;

    // Recover squash
    penguin.squash += (1 - penguin.squash) * dt * 8;

    // Ground collision
    const terrainY = getTerrainY(penguin.x);
    if (penguin.y + 32 >= terrainY) {
      penguin.y = terrainY - 32;
      penguin.bounceCount++;
      spawnBounceParticles(penguin.x, terrainY);

      if (penguin.bounceCount >= 4 || Math.abs(penguin.vy) < 80) {
        state = STATES.LANDED;
        penguin.vx = 0;
        penguin.vy = 0;
        penguin.hurt = false;
        penguin.rotation = 0;
        penguin.squash = 1.2; // final squash
        showResult();
        return;
      }

      penguin.vy = -Math.abs(penguin.vy) * BOUNCE_DAMPING;
      penguin.vx *= 0.6;
      penguin.squash = 1.3; // squash on bounce
    }

    // Camera follows
    const targetCam = penguin.x - 350;
    cameraX += (targetCam - cameraX) * dt * 6;
    if (cameraX < 0) cameraX = 0;
  }

  // ---- LANDED ----
  if (state === STATES.LANDED) {
    penguin.squash += (1 - penguin.squash) * dt * 5;
    const targetCam = penguin.x - 300;
    cameraX += (targetCam - cameraX) * dt * 1.5;
    if (cameraX < 0) cameraX = 0;
  }

  updateParticles(dt);
  updateSnow(dt);
}

function showResult() {
  const distance = Math.max(0, Math.floor(penguin.x - LAND_X));
  const best = parseInt(localStorage.getItem('whackPenguinBest') || '0');

  if (distance > best) {
    localStorage.setItem('whackPenguinBest', distance);
  }

  const currentBest = Math.max(distance, best);

  document.getElementById('distance-display').textContent = `${distance} steps!`;
  document.getElementById('best-display').textContent = `Best: ${currentBest} steps`;
  document.getElementById('result-panel').classList.remove('hidden');
}

// --- Input ---
function handleInput() {
  if (state === STATES.INTRO) {
    startGame();
  } else if (state === STATES.READY) {
    triggerSwing();
  } else if (state === STATES.LANDED) {
    resetGame();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    handleInput();
  }
});

canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleInput();
});

document.getElementById('again-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  resetGame();
});

// --- Render ---
function render() {
  ctx.clearRect(0, 0, 1200, 600);

  drawSky();
  drawMountains();
  drawGround();
  drawCliff();
  drawDistanceMarkers();
  drawSnow();
  drawYeti(YETI_X, YETI_Y, yeti.swingAngle);
  drawPenguin(penguin.x, penguin.y, penguin.rotation, penguin.squash, penguin.wobble);
  drawParticles();

  if (state === STATES.READY) {
    drawTimingBar();
  }

  // State-specific hints
  if (state === STATES.INTRO) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Time your swing to whack the penguin as far as possible!', 600, 560);
  }
}

// --- Game Loop ---
let lastTime = performance.now();

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// --- Start ---
initSnow();
resetGame();
requestAnimationFrame(gameLoop);
