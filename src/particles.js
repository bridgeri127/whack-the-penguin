import * as THREE from 'three';
import { STATES, COLORS, SNOWFLAKE_COUNT, PARTICLE_GRAVITY, PARTICLE_LIFE_DECAY } from './constants.js';

// --- Ambient Snow ---
function createSnowParticles(scene) {
  const count = SNOWFLAKE_COUNT;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = Math.random() * 800 - 200;
    positions[i * 3 + 1] = Math.random() * 400 + 50;
    positions[i * 3 + 2] = Math.random() * 200 - 100;
    velocities.push({
      x: (Math.random() - 0.5) * 15,
      y: -(20 + Math.random() * 25),
      z: (Math.random() - 0.5) * 8,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 1 + Math.random() * 2,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: COLORS.white,
    size: 2.5,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return { points, velocities, geo };
}

// --- Burst Particles ---
function createBurst(scene, origin, count, colors, spread, speed) {
  const particles = [];

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      transparent: true,
      opacity: 1,
    });
    const size = 1 + Math.random() * 2;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);

    const angle = Math.random() * Math.PI * 2;
    const yAngle = (Math.random() - 0.5) * Math.PI;
    const spd = speed * (0.5 + Math.random() * 0.5);

    mesh.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * Math.cos(yAngle) * spread * spd,
      Math.abs(Math.sin(yAngle)) * spread * spd + speed * 0.5,
      Math.sin(angle) * Math.cos(yAngle) * spread * spd * 0.3
    );
    mesh.userData.life = 1.0;

    scene.add(mesh);
    particles.push(mesh);
  }

  return particles;
}

export function initParticles(scene) {
  const snow = createSnowParticles(scene);
  const bursts = [];

  return { snow, bursts, scene };
}

export function updateParticles(particles, penguin, state, dt) {
  const { snow, bursts, scene } = particles;

  // Update ambient snow
  const sPos = snow.geo.attributes.position;
  for (let i = 0; i < snow.velocities.length; i++) {
    const v = snow.velocities[i];
    sPos.setX(i, sPos.getX(i) + v.x * dt + Math.sin(v.sway + performance.now() * 0.001 * v.swaySpeed) * 8 * dt);
    sPos.setY(i, sPos.getY(i) + v.y * dt);
    sPos.setZ(i, sPos.getZ(i) + v.z * dt);

    // Wrap around
    if (sPos.getY(i) < -10) {
      sPos.setY(i, 400 + Math.random() * 50);
      sPos.setX(i, sPos.getX(i) + (Math.random() - 0.5) * 100);
    }
  }
  sPos.needsUpdate = true;

  // Update burst particles
  for (let b = bursts.length - 1; b >= 0; b--) {
    const group = bursts[b];
    let allDead = true;

    for (let i = 0; i < group.length; i++) {
      const p = group[i];
      if (p.userData.life <= 0) continue;

      allDead = false;
      p.userData.life -= dt * PARTICLE_LIFE_DECAY;
      p.material.opacity = Math.max(0, p.userData.life);

      p.userData.velocity.y -= PARTICLE_GRAVITY * dt;
      p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
      p.rotation.x += dt * 3;
      p.rotation.z += dt * 2;
    }

    if (allDead) {
      // Clean up
      for (const p of group) {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
      }
      bursts.splice(b, 1);
    }
  }

  // Spawn hit burst when swinging
  if (state === STATES.SWING) {
    // Already handled in game.js via state transition
  }

  // Spawn snow burst on landing bounce
  if (state === STATES.FLYING && penguin.userData && penguin.userData.justBounced) {
    const origin = new THREE.Vector3(penguin.position.x, penguin.position.y + 5, 0);
    const colors = [COLORS.snow, COLORS.snowDark, COLORS.paleBlue, 0xffffff];
    bursts.push(createBurst(scene, origin, 12, colors, 1, 120));
    penguin.userData.justBounced = false;
  }

  // Spawn hit burst on launch
  if (state === STATES.FLYING && penguin.userData && penguin.userData.justLaunched) {
    const origin = new THREE.Vector3(penguin.position.x, penguin.position.y + 10, 0);
    const colors = [COLORS.gold, COLORS.orange, COLORS.red, COLORS.white];
    bursts.push(createBurst(scene, origin, 15, colors, 1.5, 180));
    penguin.userData.justLaunched = false;
  }
}
