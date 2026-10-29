import * as THREE from "three";
import { rand } from "./utils.js";

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (320.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float distanceToCenter = length(uv);
    float alpha = smoothstep(0.5, 0.04, distanceToCenter) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

class ParticlePool {
  constructor(scene, capacity, blending) {
    this.capacity = capacity;
    this.cursor = 0;
    this.particles = [];

    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    this.alphas = new Float32Array(capacity);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.geometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(this.colors, 3),
    );
    this.geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(this.sizes, 1),
    );
    this.geometry.setAttribute(
      "aAlpha",
      new THREE.BufferAttribute(this.alphas, 1),
    );
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5000);

    this.material = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    for (let i = 0; i < capacity; i += 1) {
      this.particles.push({
        life: 0,
        maxLife: 1,
        vx: 0,
        vy: 0,
        vz: 0,
        gravity: 0,
        drag: 0,
        size: 0,
        sizeGrowth: 0,
        color: new THREE.Color(),
        x: 0,
        y: 0,
        z: 0,
      });
    }
  }

  spawn(options) {
    const {
      x,
      y,
      z,
      count = 10,
      colors = [0xffffff],
      speedMin = 1,
      speedMax = 4,
      upward = 0.5,
      spread = 1,
      gravity = -4,
      drag = 1.4,
      lifeMin = 0.5,
      lifeMax = 1.1,
      sizeMin = 0.35,
      sizeMax = 0.85,
      sizeGrowth = 0,
    } = options;

    for (let i = 0; i < count; i += 1) {
      const index = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;
      const particle = this.particles[index];

      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const directionX = Math.sin(phi) * Math.cos(theta);
      const directionZ = Math.sin(phi) * Math.sin(theta);
      const directionY = Math.cos(phi);

      const speed = rand(speedMin, speedMax);
      particle.life = rand(lifeMin, lifeMax);
      particle.maxLife = particle.life;
      particle.x = x + rand(-0.1, 0.1);
      particle.y = y + rand(-0.05, 0.15);
      particle.z = z + rand(-0.1, 0.1);
      particle.vx = directionX * speed * spread;
      particle.vy = directionY * speed + upward;
      particle.vz = directionZ * speed * spread * 0.55;
      particle.gravity = gravity;
      particle.drag = drag;
      particle.size = rand(sizeMin, sizeMax);
      particle.sizeGrowth = sizeGrowth;
      particle.color.set(colors[Math.floor(Math.random() * colors.length)]);
    }
  }

  update(dt) {
    for (let i = 0; i < this.capacity; i += 1) {
      const particle = this.particles[i];
      const index = i * 3;

      if (particle.life <= 0) {
        this.alphas[i] = 0;
        continue;
      }

      particle.life -= dt;
      if (particle.life <= 0) {
        this.alphas[i] = 0;
        continue;
      }

      const damping = Math.exp(-particle.drag * dt);
      particle.vx *= damping;
      particle.vz *= damping;
      particle.vy = particle.vy * damping + particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.z += particle.vz * dt;
      particle.size += particle.sizeGrowth * dt;

      const t = particle.life / particle.maxLife;
      this.positions[index] = particle.x;
      this.positions[index + 1] = particle.y;
      this.positions[index + 2] = particle.z;
      this.colors[index] = particle.color.r;
      this.colors[index + 1] = particle.color.g;
      this.colors[index + 2] = particle.color.b;
      this.sizes[i] = particle.size;
      this.alphas[i] = Math.pow(t, 0.7);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }
}

function createFlashTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.22, "rgba(255, 246, 200, 0.9)");
  gradient.addColorStop(0.55, "rgba(255, 210, 100, 0.24)");
  gradient.addColorStop(1, "rgba(255, 210, 100, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createParticles(scene) {
  const snowPool = new ParticlePool(scene, 320, THREE.NormalBlending);
  const sparkPool = new ParticlePool(scene, 260, THREE.AdditiveBlending);

  const flashTexture = createFlashTexture();
  const flashes = [];
  for (let i = 0; i < 4; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flashTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    sprite.visible = false;
    scene.add(sprite);
    flashes.push({ sprite, life: 0, maxLife: 0.3 });
  }

  const rings = [];
  const ringGeometry = new THREE.RingGeometry(0.55, 0.68, 48);
  for (let i = 0; i < 5; i += 1) {
    const mesh = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    mesh.visible = false;
    scene.add(mesh);
    rings.push({ mesh, life: 0, maxLife: 0.5, strength: 1 });
  }

  let flashCursor = 0;
  let ringCursor = 0;

  const flash = (position, color = 0xffe2a1) => {
    const entry = flashes[flashCursor];
    flashCursor = (flashCursor + 1) % flashes.length;
    entry.sprite.position.copy(position);
    entry.sprite.material.color.set(color);
    entry.sprite.scale.setScalar(4);
    entry.sprite.material.opacity = 0.9;
    entry.sprite.visible = true;
    entry.life = entry.maxLife;
  };

  const ring = (position, color = 0xa8ecff, strength = 1) => {
    const entry = rings[ringCursor];
    ringCursor = (ringCursor + 1) % rings.length;
    entry.mesh.position.copy(position);
    entry.mesh.position.z += 0.7;
    entry.mesh.material.color.set(color);
    entry.mesh.material.opacity = 0.7;
    entry.mesh.scale.setScalar(0.5);
    entry.mesh.visible = true;
    entry.life = entry.maxLife;
    entry.strength = strength;
  };

  const puff = (position, count = 14, scale = 1) => {
    snowPool.spawn({
      x: position.x,
      y: position.y + 0.1,
      z: position.z,
      count,
      colors: [0xffffff, 0xe6f7ff, 0xc8ecff],
      speedMin: 1.5 * scale,
      speedMax: 5.5 * scale,
      upward: 1.4 * scale,
      spread: 1,
      gravity: -5,
      drag: 2.2,
      lifeMin: 0.45,
      lifeMax: 1.0,
      sizeMin: 0.35,
      sizeMax: 0.9,
      sizeGrowth: 0.25,
    });
  };

  const impact = (position, power = 0.5) => {
    const strength = 0.5 + power * 0.8;
    sparkPool.spawn({
      x: position.x,
      y: position.y,
      z: position.z,
      count: 34,
      colors: [0xfff5d6, 0xffd166, 0x8fe8ff, 0xffffff],
      speedMin: 4,
      speedMax: 15 * strength,
      upward: 2.2,
      spread: 1.25,
      gravity: -10,
      drag: 0.9,
      lifeMin: 0.35,
      lifeMax: 0.9,
      sizeMin: 0.25,
      sizeMax: 0.72,
    });
    snowPool.spawn({
      x: position.x,
      y: position.y,
      z: position.z,
      count: 22,
      colors: [0xffffff, 0xdff6ff],
      speedMin: 2,
      speedMax: 9,
      upward: 2,
      spread: 1.2,
      gravity: -6,
      drag: 1.7,
      lifeMin: 0.5,
      lifeMax: 1.2,
      sizeMin: 0.45,
      sizeMax: 1.1,
      sizeGrowth: 0.3,
    });
    flash(position, 0xffe2a1);
    ring(position, 0xffe2a1, strength);
    ring(position, 0x8fe8ff, strength * 0.7);
  };

  const trail = (position, velocity) => {
    snowPool.spawn({
      x: position.x,
      y: position.y,
      z: position.z,
      count: 2,
      colors: [0xffffff, 0xc8f4ff],
      speedMin: 0.2,
      speedMax: 1.4,
      upward: 0.2,
      spread: 1,
      gravity: -1,
      drag: 2,
      lifeMin: 0.3,
      lifeMax: 0.6,
      sizeMin: 0.25,
      sizeMax: 0.5,
      sizeGrowth: 0.1,
    });
  };

  const celebrate = (position) => {
    sparkPool.spawn({
      x: position.x,
      y: position.y + 1,
      z: position.z,
      count: 48,
      colors: [0xffd166, 0x8fe8ff, 0xffffff, 0x7dffc4, 0xff8fab],
      speedMin: 3,
      speedMax: 11,
      upward: 5,
      spread: 1,
      gravity: -5,
      drag: 1.1,
      lifeMin: 0.9,
      lifeMax: 2.1,
      sizeMin: 0.3,
      sizeMax: 0.8,
    });
    ring(position, 0xffd166, 0.9);
    flash(position, 0xfff1bd);
  };

  const update = (dt) => {
    snowPool.update(dt);
    sparkPool.update(dt);

    for (const entry of flashes) {
      if (entry.life <= 0) continue;
      entry.life -= dt;
      const t = Math.max(0, entry.life / entry.maxLife);
      entry.sprite.material.opacity = t * t * 0.9;
      entry.sprite.scale.setScalar(3 + (1 - t) * 5);
      if (entry.life <= 0) entry.sprite.visible = false;
    }

    for (const entry of rings) {
      if (entry.life <= 0) continue;
      entry.life -= dt;
      const t = 1 - Math.max(0, entry.life / entry.maxLife);
      entry.mesh.scale.setScalar(0.5 + t * (2.5 + entry.strength * 2.5));
      entry.mesh.material.opacity = (1 - t) * 0.4;
      entry.mesh.rotation.z += dt * 0.4;
      if (entry.life <= 0) entry.mesh.visible = false;
    }
  };

  return {
    puff,
    impact,
    trail,
    celebrate,
    ring,
    flash,
    update,
  };
}
