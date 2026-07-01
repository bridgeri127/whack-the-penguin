// ============================================================
// Whack the Penguin — HTML5 Remake
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

// --- Constants ---
const STATES = { INTRO: 0, FALLING: 1, FLYING: 2, LANDED: 3 };
const GRAVITY = 900;
const BOUNCE_DAMPING = 0.4;
const MAX_POWER = 1300;
const GROUND_BASE = 520;
const PLEdge_X = 60;
const PLEdge_Y = 130;
const YETI_X = 150;
const YETI_Y = 470;

// --- Game State ---
let state = STATES.INTRO;
let cameraX = 0;
let penguin = {};
let yeti = {};
let timing = { value: 0, phase: 0 };
let particles = [];
let snowflakes = [];

// --- Init ---
function resetPenguin() {
  return {
    x: PLEdge_X + 20,
    y: PLEdge_Y - 32,
    vx: 0,
    vy: 0,
    rotation: 0,
    bounceCount: 0,
    hurt: false,
    stunned: 0,
  };
}

function resetGame() {
  state = STATES.INTRO;
  cameraX = 0;
  penguin = resetPenguin();
  yeti = { swingAngle: -0.5, swingTarget: -0.5 };
  timing = { value: 0, phase: 0 };
  particles = [];

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
  // Far mountains (parallax)
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

  // Near mountains
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
  // Main ground
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.moveTo(-10, 600);
  for (let sx = -10; sx <= 1210; sx += 4) {
    const wx = sx + cameraX;
    if (wx < 0) continue;
    const ty = getTerrainY(wx);
    ctx.lineTo(sx, ty);
  }
  ctx.lineTo(1210, 600);
  ctx.fill();

  // Snow surface line
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
  const cx = PLEdge_X - 30 - cameraX;

  // Rock face
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(cx, 0, 80, GROUND_BASE + 10);

  // Rocky texture
  ctx.fillStyle = '#7a6348';
  for (let i = 0; i < 12; i++) {
    const rx = cx + 5 + ((i * 31) % 60);
    const ry = 40 + ((i * 53) % (GROUND_BASE - 40));
    ctx.fillRect(rx, ry, 10 + (i % 5) * 3, 6);
  }

  // Snow cap
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx, 0, 80, 24);

  // Ledge platform
  ctx.fillStyle = '#6b5b45';
  ctx.fillRect(cx, PLEdge_Y, 120, 16);

  // Snow on ledge
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(cx, PLEdge_Y, 120, 6);

  // Icicles under ledge
  ctx.fillStyle = '#c8e8f8';
  for (let i = 0; i < 5; i++) {
    const ix = cx + 10 + i * 22;
    const ih = 6 + (i % 3) * 4;
    ctx.fillRect(ix, PLEdge_Y + 16, 4, ih);
  }
}

function drawPenguin(x, y, rotation) {
  const sx = x - cameraX;
  ctx.save();
  ctx.translate(sx + 16, y + 20);
  ctx.rotate(rotation);
  ctx.translate(-(sx + 16), -(y + 20));

  // Body
  ctx.fillStyle = '#1a1a2e';
  drawBlock(sx + 6, y + 6, 20, 18);
  drawBlock(sx + 2, y + 12, 28, 12);

  // Belly
  ctx.fillStyle = '#f0f0f0';
  drawBlock(sx + 10, y + 14, 12, 10);

  // Eyes
  ctx.fillStyle = '#fff';
  drawBlock(sx + 8, y + 8, 6, 6);
  drawBlock(sx + 18, y + 8, 6, 6);
  ctx.fillStyle = '#000';
  drawBlock(sx + 10, y + 10, 3, 3);
  drawBlock(sx + 20, y + 10, 3, 3);

  // Beak
  ctx.fillStyle = '#ff8c00';
  drawBlock(sx + 13, y + 13, 6, 4);

  // Flippers
  ctx.fillStyle = '#1a1a2e';
  drawBlock(sx - 2, y + 14, 8, 12);
  drawBlock(sx + 26, y + 14, 8, 12);

  // Feet
  ctx.fillStyle = '#ff8c00';
  drawBlock(sx + 8, y + 26, 6, 5);
  drawBlock(sx + 18, y + 26, 6, 5);

  // Hurt expression
  if (penguin.hurt) {
    ctx.fillStyle = '#ff4444';
    drawBlock(sx + 10, y + 18, 4, 3);
    drawBlock(sx + 18, y + 18, 4, 3);
    // X eyes
    ctx.fillStyle = '#ff0000';
    drawBlock(sx + 9, y + 9, 2, 2);
    drawBlock(sx + 13, y + 9, 2, 2);
    drawBlock(sx + 19, y + 9, 2, 2);
    drawBlock(sx + 23, y + 9, 2, 2);
  }

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

  // Eyes
  ctx.fillStyle = '#fff';
  drawBlock(sx + 14, y - 46, 6, 6);
  drawBlock(sx + 22, y - 46, 6, 6);
  ctx.fillStyle = '#222';
  drawBlock(sx + 16, y - 44, 3, 3);
  drawBlock(sx + 24, y - 44, 3, 3);

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

  // Club arm (swings)
  ctx.save();
  ctx.translate(sx + 36, y - 28);
  ctx.rotate(swingAngle);

  // Arm
  ctx.fillStyle = '#b8b8b8';
  drawBlock(0, -3, 18, 7);

  // Club
  ctx.fillStyle = '#8b4513';
  drawBlock(16, -5, 22, 10);

  // Club head
  ctx.fillStyle = '#6b3410';
  drawBlock(32, -7, 12, 14);

  // Club detail
  ctx.fillStyle = '#5a2d0c';
  drawBlock(34, -5, 3, 10);
  drawBlock(40, -5, 3, 10);

  ctx.restore();
}

function drawTimingBar() {
  const sx = YETI_X - cameraX;
  const barY = YETI_Y - 80;
  const w = 130;
  const h = 14;

  // BG
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(sx - w/2, barY, w, h);

  // Zones
  // Left (early - red)
  const lg = ctx.createLinearGradient(sx - w/2, 0, sx - 8, 0);
  lg.addColorStop(0, '#cc3333');
  lg.addColorStop(1, '#dd8833');
  ctx.fillStyle = lg;
  ctx.fillRect(sx - w/2, barY, w/2 - 8, h);

  // Center (perfect - green)
  ctx.fillStyle = '#44dd66';
  ctx.fillRect(sx - 10, barY, 20, h);

  // Right (late - red)
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
  ctx.fillText('EARLY', sx - w/2 + 28, barY + h + 12);
  ctx.fillText('PERFECT', sx, barY + h + 12);
  ctx.fillText('LATE', sx + w/2 - 26, barY + h + 12);
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
    ctx.fillText(`${d}`, sx, ty + 20);
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

function drawTip() {
  if (state === STATES.FLYING || state === STATES.LANDED) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('Space/Click to play again', 20, 30);
  }
}

// --- Particles ---
function spawnHitParticles(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x + Math.random() * 20 - 10,
      y: y + Math.random() * 20 - 10,
      vx: (Math.random() - 0.5) * 300,
      vy: (Math.random() - 0.5) * 300 - 100,
      size: 2 + Math.random() * 4,
      color: ['#fff', '#ff8c00', '#ff4444', '#ffd700'][Math.floor(Math.random() * 4)],
      life: 1,
    });
  }
  // Snow burst
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: x + Math.random() * 30,
      y: y + 20,
      vx: (Math.random() - 0.3) * 200,
      vy: -Math.random() * 200,
      size: 2 + Math.random() * 3,
      color: '#fff',
      life: 1,
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
function startFalling() {
  state = STATES.FALLING;
  overlay.classList.add('hidden');
  penguin.vy = 0;
  timing.phase = 0;
  yeti.swingTarget = -Math.PI / 3;
}

function triggerSwing() {
  const t = timing.value; // -1 to 1

  // Power curve: cosine falloff from center
  const power = Math.cos(t * Math.PI / 2);

  // Angle: -25° (up) at left edge, ~40° at center, +35° (down) at right
  const angleDeg = 40 - t * 65;
  const angle = (angleDeg * Math.PI) / 180;

  const speed = power * MAX_POWER + 150;
  penguin.vx = Math.cos(angle) * speed;
  penguin.vy = -Math.sin(angle) * speed;
  penguin.hurt = true;
  penguin.rotation = 0;

  spawnHitParticles(penguin.x, penguin.y);

  state = STATES.FLYING;
  yeti.swingTarget = Math.PI / 4;
}

// --- Update ---
function update(dt) {
  // Smooth yeti swing animation
  yeti.swingAngle += (yeti.swingTarget - yeti.swingAngle) * dt * 10;

  if (state === STATES.FALLING) {
    // Penguin falls
    penguin.vy += GRAVITY * dt;
    penguin.y += penguin.vy * dt;

    // Timing bar oscillation
    timing.phase += 2.8 * dt;
    timing.value = Math.sin(timing.phase);

    // Safety net: auto-hit if penguin falls past
    if (penguin.y > 560) {
      triggerSwing();
    }
  }

  if (state === STATES.FLYING) {
    // Physics
    penguin.vy += GRAVITY * dt;
    penguin.x += penguin.vx * dt;
    penguin.y += penguin.vy * dt;
    penguin.rotation += dt * 6;

    // Ground collision
    const terrainY = getTerrainY(penguin.x);
    if (penguin.y + 32 >= terrainY) {
      penguin.y = terrainY - 32;
      penguin.bounceCount++;
      spawnBounceParticles(penguin.x, terrainY);

      if (penguin.bounceCount >= 4 || Math.abs(penguin.vy) < 80) {
        // Landed!
        state = STATES.LANDED;
        penguin.vx = 0;
        penguin.vy = 0;
        penguin.hurt = false;
        showResult();
        return;
      }

      penguin.vy = -Math.abs(penguin.vy) * BOUNCE_DAMPING;
      penguin.vx *= 0.65;
    }

    // Camera follows
    const targetCam = penguin.x - 350;
    cameraX += (targetCam - cameraX) * dt * 6;
    if (cameraX < 0) cameraX = 0;
  }

  if (state === STATES.LANDED) {
    // Gentle camera pan to show landing spot
    const targetCam = penguin.x - 300;
    cameraX += (targetCam - cameraX) * dt * 1.5;
    if (cameraX < 0) cameraX = 0;
  }

  // Reset hurt expression after a bit
  if (penguin.hurt && state === STATES.FLYING) {
    penguin.stunned += dt;
    if (penguin.stunned > 2) penguin.hurt = false;
  }

  updateParticles(dt);
  updateSnow(dt);
}

function showResult() {
  const distance = Math.max(0, Math.floor(penguin.x - (PLEdge_X + 20)));
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
    startFalling();
  } else if (state === STATES.FALLING) {
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

canvas.addEventListener('click', (e) => {
  handleInput();
});

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
  drawPenguin(penguin.x, penguin.y, penguin.rotation);
  drawParticles();

  if (state === STATES.FALLING) {
    drawTimingBar();
  }

  drawTip();
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
