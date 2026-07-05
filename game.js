import * as THREE from 'three';
import { createScene } from './src/scene.js';
import { createEnvironment } from './src/environment.js';
import { createPenguin } from './src/penguin.js';
import { createYeti } from './src/yeti.js';
import { initParticles, updateParticles } from './src/particles.js';
import { initInput } from './src/input.js';
import {
  STATES, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_BASE,
  PENGUIN_START, YETI_X, YETI_Y, LAND_X, LAND_Y,
  DROP_PAUSE, DROP_HOP_VY, DROP_STRETCH_RATE,
  TIMING_OSCILLATION_SPEED, SWING_WINDBACK, SWING_FORWARD,
  SWING_SPEED_READY, SWING_SPEED_SWING, SWING_DURATION,
  WOBBLE_DURATION, GRAVITY, BOUNCE_DAMPING, HORIZONTAL_DAMPING,
  MAX_POWER, getTerrainY_3D, PENGUIN_SPIN_SPEED,
  PENGUIN_SETTLE_BOUNCES, PENGUIN_SETTLE_VY,
  SQUASH_RECOVERY_FAST, SQUASH_RECOVERY_SLOW,
  CAMERA_FLY_LERP_X, CAMERA_FLY_LERP_Y, CAMERA_LANDED_LERP,
} from './src/constants.js';
import { updateCamera } from './src/camera.js';
import { updateAnimations } from './src/animations.js';

// --- DOM Elements ---
const container = document.getElementById('renderer');
const overlay = document.getElementById('overlay');
const resultPanel = document.getElementById('result-panel');
const distanceDisplay = document.getElementById('distance-display');
const bestDisplay = document.getElementById('best-display');
const againBtn = document.getElementById('again-btn');
const timingBarContainer = document.getElementById('timing-bar-container');
const timingIndicator = document.getElementById('timing-indicator');

// --- Initialize Three.js Scene ---
const { scene, camera, renderer } = createScene(container);

// --- Build Environment ---
const environment = createEnvironment(scene);

// --- Build Characters ---
const penguin = createPenguin(scene, PENGUIN_START.x, PENGUIN_START.y);
const yeti = createYeti(scene, YETI_X, YETI_Y);

// --- Particles ---
const particles = initParticles(scene);

// --- Game State ---
let state = STATES.INTRO;
let bestDistance = parseFloat(localStorage.getItem('penguinBest') || '0');

// Penguin physics state
let penguinVx = 0;
let penguinVy = 0;
let squash = 1;
let bounceCount = 0;

// Timers
let swingTimer = 0;
let wobbleTimer = 0;
let dropTimer = 0;

// Timing bar
let timing = { value: 0 };

// Swing animation
let swingAngle = 0;

// Camera
let cameraTarget = { x: 0, y: 280, z: 500 };

// --- State Helpers ---

function resetPenguin() {
  penguin.position.set(PENGUIN_START.x, PENGUIN_START.y, 0);
  penguin.rotation.set(0, 0, 0);
  penguinVx = 0;
  penguinVy = 0;
  squash = 1;
  bounceCount = 0;
  dropTimer = 0;
  swingTimer = 0;
  wobbleTimer = 0;
  timing = { value: 0 };
  swingAngle = 0;
}

function resetGame() {
  state = STATES.INTRO;
  resetPenguin();
  overlay.classList.remove('hidden');
  overlay.classList.add('screen');
  resultPanel.classList.add('hidden');
  timingBarContainer.classList.add('hidden');
  cameraTarget = { x: 0, y: 280, z: 500 };
}

function startGame() {
  state = STATES.DROPPING;
  dropTimer = 0;
  overlay.classList.add('hidden');
  overlay.classList.remove('screen');
  resultPanel.classList.add('hidden');
}

function triggerSwing() {
  state = STATES.SWING;
  swingTimer = 0;
  timingBarContainer.classList.add('hidden');
}

function launchPenguin() {
  const power = Math.cos(timing.value * Math.PI / 2);
  const angleDeg = 35 - timing.value * 55;
  const angleRad = (angleDeg * Math.PI) / 180;
  const speed = power * MAX_POWER + 200;

  penguinVx = Math.cos(angleRad) * speed;
  penguinVy = Math.sin(angleRad) * speed;

  // Squash on impact
  squash = 0.6;

  state = STATES.FLYING;
  bounceCount = 0;
  penguin.userData.justLaunched = true;
}

// --- Input ---
initInput({
  onIntro: () => { startGame(); },
  onReady: () => { triggerSwing(); },
  onLanded: () => { resetGame(); },
}, () => state);

againBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetGame();
});

// --- High Score ---
bestDisplay.textContent = `Best: ${Math.round(bestDistance)}m`;

function updateBestDistance(dist) {
  if (dist > bestDistance) {
    bestDistance = dist;
    localStorage.setItem('penguinBest', bestDistance.toFixed(2));
  }
}

// --- Timing Bar UI ---
function updateTimingBarUI() {
  // Map timing value [-1, 1] to percentage [0%, 100%]
  const pct = ((timing.value + 1) / 2) * 100;
  timingIndicator.style.left = `calc(${pct}% - 2px)`;
}

// --- Main Update ---
function update(dt) {
  switch (state) {
    case STATES.INTRO:
      break;

    case STATES.DROPPING: {
      dropTimer += dt;
      if (dropTimer < DROP_PAUSE) {
        // Dramatic pause on ledge
        break;
      }

      // Hop forward and fall
      const fallTime = dropTimer - DROP_PAUSE;
      if (fallTime < 0.016) {
        // Small hop — set once at the start
        penguinVy = DROP_HOP_VY;
      }

      // Move toward land position horizontally
      const hopTime = Math.max(0, fallTime - 0.016);
      const hopDuration = 0.28;
      const t = Math.min(1, hopTime / hopDuration);
      penguin.position.x = PENGUIN_START.x + (LAND_X - PENGUIN_START.x) * t;

      // Gravity (in 3D: positive vy goes up, gravity pulls down)
      penguinVy -= GRAVITY * dt;
      penguin.position.y += penguinVy * dt;

      // Stretch during fall
      squash = Math.min(1.3, 1 + Math.abs(penguinVy) * DROP_STRETCH_RATE);

      // Ground collision
      const terrainY = getTerrainY_3D(penguin.position.x);
      if (penguin.position.y <= terrainY) {
        penguin.position.y = terrainY;
        state = STATES.LAND_WOBBLE;
        wobbleTimer = 0;
        squash = 1.35; // squish flat on landing
        penguinVy = 0;
      }
      break;
    }

    case STATES.LAND_WOBBLE: {
      wobbleTimer += dt;
      squash += (1 - squash) * dt * SQUASH_RECOVERY_FAST;
      if (wobbleTimer >= WOBBLE_DURATION) {
        state = STATES.READY;
        squash = 1;
        // Show timing bar
        timingBarContainer.classList.remove('hidden');
      }
      break;
    }

    case STATES.READY: {
      // Oscillate timing value
      timing.value = Math.sin(performance.now() * 0.001 * TIMING_OSCILLATION_SPEED);
      updateTimingBarUI();

      // Position timing bar above yeti in screen space
      const yetiScreenPos = new THREE.Vector3(YETI_X, YETI_Y + 80, 0);
      yetiScreenPos.project(camera);
      const x = (yetiScreenPos.x + 1) / 2 * CANVAS_WIDTH;
      const y = (-yetiScreenPos.y + 1) / 2 * CANVAS_HEIGHT;
      timingBarContainer.style.left = `${x - 65}px`;
      timingBarContainer.style.top = `${y}px`;

      // Wind back yeti arm slightly, following timing
      swingAngle = SWING_WINDBACK + (timing.value + 1) * (SWING_FORWARD - SWING_WINDBACK) * 0.15;
      break;
    }

    case STATES.SWING: {
      swingTimer += dt;
      swingAngle += (SWING_FORWARD - swingAngle) * dt * SWING_SPEED_SWING;
      if (swingTimer >= SWING_DURATION) {
        launchPenguin();
      }
      break;
    }

    case STATES.FLYING: {
      penguin.position.x += penguinVx * dt;
      penguin.position.y += penguinVy * dt;
      penguinVy -= GRAVITY * dt;

      // Squash recovery
      squash += (1 - squash) * dt * SQUASH_RECOVERY_FAST;

      // Ground collision
      const terrainY = getTerrainY_3D(penguin.position.x);
      if (penguin.position.y <= terrainY && penguinVy < 0) {
        penguin.position.y = terrainY;
        bounceCount++;

        // Bounce
        penguinVy = Math.abs(penguinVy) * BOUNCE_DAMPING;
        penguinVx *= HORIZONTAL_DAMPING;
        squash = 1.3;
        penguin.userData.justBounced = true;

        if (bounceCount >= PENGUIN_SETTLE_BOUNCES || Math.abs(penguinVy) < PENGUIN_SETTLE_VY) {
          // Landed
          penguinVy = 0;
          penguinVx = 0;
          state = STATES.LANDED;

          const distance = Math.max(0, penguin.position.x - LAND_X);
          updateBestDistance(distance);

          distanceDisplay.textContent = `${Math.round(distance)}m`;
          bestDisplay.textContent = `Best: ${Math.round(bestDistance)}m`;

          resultPanel.classList.remove('hidden');
        }
      }
      break;
    }

    case STATES.LANDED:
      squash += (1 - squash) * dt * SQUASH_RECOVERY_SLOW;
      break;
  }
}

// --- Main Loop ---
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  update(dt);
  updateCamera(camera, penguin, state, dt, cameraTarget);
  updateAnimations(penguin, yeti, state, dt, squash, swingAngle, timing, wobbleTimer);
  updateParticles(particles, penguin, state, dt);

  renderer.render(scene, camera);
}

animate(performance.now());
