import * as THREE from "three";
import { COLORS, MAX_DISTANCE, MARKER_STEP } from "./constants.js";
import {
  clamp,
  formatWhole,
  lerp,
  rand,
  randInt,
  seeded,
  smoothstep,
} from "./utils.js";

const AURORA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float x = vUv.x;
    float y = vUv.y;

    float drift = sin(x * 8.0 + uTime * 0.22 + sin(x * 3.1) * 1.7) * 0.5 + 0.5;
    float drift2 = sin(x * 15.0 - uTime * 0.16 + 1.8) * 0.5 + 0.5;
    float ribbon = smoothstep(0.28, 0.82, drift * 0.75 + drift2 * 0.25);

    float band = smoothstep(0.02, 0.28, y) * smoothstep(0.98, 0.48, y);
    float edge = smoothstep(0.0, 0.12, x) * smoothstep(1.0, 0.88, x);
    float alpha = ribbon * band * edge * uOpacity;

    vec3 color = mix(uColorA, uColorB, clamp(y + sin(x * 5.0 + uTime * 0.12) * 0.12, 0.0, 1.0));
    color += vec3(0.15, 0.25, 0.2) * ribbon * band;

    gl_FragColor = vec4(color, alpha);
  }
`;

function createSnowTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#e8f6ff");
  base.addColorStop(0.45, "#dcefff");
  base.addColorStop(1, "#c9e4f8");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 900; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = rand(0.4, 1.8);
    ctx.fillStyle = `rgba(255, 255, 255, ${rand(0.08, 0.4)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 80; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = rand(3, 12);
    const shade = ctx.createRadialGradient(x, y, 0, x, y, radius);
    shade.addColorStop(0, "rgba(126, 180, 220, 0.08)");
    shade.addColorStop(1, "rgba(126, 180, 220, 0)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(46, 24);
  texture.anisotropy = 4;
  return texture;
}

function createSoftCircleTexture() {
  const size = 64;
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
  gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function createSignTexture(text, { accent = "#8fe8ff", best = false } = {}) {
  const width = 256;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, width, height);

  if (best) {
    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      10,
      width / 2,
      height / 2,
      120,
    );
    glow.addColorStop(0, "rgba(255, 209, 102, 0.22)");
    glow.addColorStop(1, "rgba(255, 209, 102, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  roundRect(ctx, 14, 22, width - 28, height - 44, 22);
  ctx.fillStyle = best ? "rgba(38, 27, 8, 0.8)" : "rgba(5, 19, 31, 0.74)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = best
    ? "rgba(255, 209, 102, 0.8)"
    : "rgba(143, 232, 255, 0.35)";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = best
    ? "800 42px Outfit, system-ui, sans-serif"
    : "800 46px Outfit, system-ui, sans-serif";
  ctx.fillStyle = best ? "#ffd166" : "#f4fbff";
  ctx.fillText(text, width / 2, best ? height / 2 + 16 : height / 2 + 2);

  if (best) {
    ctx.font = "700 13px Outfit, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 209, 102, 0.82)";
    ctx.fillText("PERSONAL BEST", width / 2, 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createGround(scene) {
  const geometry = new THREE.PlaneGeometry(920, 400, 184, 60);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const noise = seeded(9182);
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const distance = Math.max(0, Math.abs(z) - 8);
    if (distance > 0) {
      const falloff = smoothstep(0, 24, distance);
      const ridge =
        Math.sin(x * 0.045 + noise() * 2.2) * 0.6 +
        Math.cos(z * 0.11 + noise() * 1.4) * 0.35 +
        Math.sin((x + z) * 0.02) * 0.5;
      positions.setY(i, ridge * falloff * 1.4);
    }
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: createSnowTexture(),
    color: 0xf6fcff,
    roughness: 0.9,
    metalness: 0.02,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;
  scene.add(ground);

  const sheen = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 11, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x9fe8ff,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.set(150, 0.015, 0);
  scene.add(sheen);

  return ground;
}

function createCliff(scene) {
  const group = new THREE.Group();
  group.position.x = -13;

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x79a7c7,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  });
  const darkRockMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c7797,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true,
  });
  const snowMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2fbff,
    roughness: 0.82,
    metalness: 0.0,
    flatShading: true,
  });

  const rocks = [
    { position: [0, 3.2, 0], scale: [4.5, 3.25, 4.1], material: rockMaterial },
    {
      position: [2.8, 2.1, -1.4],
      scale: [2.6, 2.2, 2.7],
      material: darkRockMaterial,
    },
    {
      position: [-3.2, 2.7, -1.1],
      scale: [3.0, 2.7, 2.9],
      material: darkRockMaterial,
    },
    {
      position: [1.2, 4.7, -2.4],
      scale: [2.6, 2.1, 2.4],
      material: rockMaterial,
    },
  ];

  for (const rock of rocks) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      rock.material,
    );
    mesh.position.set(...rock.position);
    mesh.scale.set(...rock.scale);
    mesh.rotation.set(rand(-0.2, 0.2), rand(-0.4, 0.4), rand(-0.2, 0.2));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(4.6, 5.1, 0.55, 8),
    snowMaterial,
  );
  cap.position.set(0.3, 6.15, 0);
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  const iceMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9e9ff,
    roughness: 0.16,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
    flatShading: true,
  });

  for (let i = 0; i < 7; i += 1) {
    const icicle = new THREE.Mesh(
      new THREE.ConeGeometry(rand(0.08, 0.18), rand(0.5, 1.4), 5),
      iceMaterial,
    );
    icicle.position.set(rand(1.6, 4.2), rand(4.6, 5.5), rand(-3.2, 2.6));
    icicle.rotation.z = Math.PI;
    icicle.castShadow = true;
    group.add(icicle);
  }

  const smallRockMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d99b8,
    roughness: 0.9,
    flatShading: true,
  });
  for (let i = 0; i < 5; i += 1) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.3, 0.7), 0),
      smallRockMaterial,
    );
    rock.position.set(rand(-2.2, 4.5), rand(0.1, 0.35), rand(-3.6, 3.2));
    rock.scale.y = rand(0.5, 1);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  scene.add(group);
  return group;
}

function createYetiMound(scene) {
  const group = new THREE.Group();
  group.position.set(-4.2, 0, 0);

  const mound = new THREE.Mesh(
    new THREE.SphereGeometry(1, 28, 16),
    new THREE.MeshStandardMaterial({ color: 0xeaf8ff, roughness: 0.85 }),
  );
  mound.scale.set(3.0, 0.42, 3.2);
  mound.position.y = 0.02;
  mound.castShadow = true;
  mound.receiveShadow = true;
  group.add(mound);

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x5d89a8,
    roughness: 0.9,
    flatShading: true,
  });
  for (let i = 0; i < 6; i += 1) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.2, 0.5), 0),
      rockMaterial,
    );
    rock.position.set(rand(-2.6, 2.6), rand(0.02, 0.15), rand(-2.6, 2.6));
    rock.scale.y = rand(0.4, 0.8);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  scene.add(group);
  return group;
}

function createPineTree(scale = 1) {
  const group = new THREE.Group();

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b3a26,
    roughness: 0.95,
    flatShading: true,
  });
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d4a46,
    roughness: 0.88,
    flatShading: true,
  });
  const snowMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9f8ff,
    roughness: 0.8,
    flatShading: true,
  });

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.18, 1.6, 6),
    trunkMaterial,
  );
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  group.add(trunk);

  const tiers = [
    { y: 1.25, radius: 1.2, height: 1.8, snow: 0.46 },
    { y: 2.15, radius: 0.92, height: 1.5, snow: 0.42 },
    { y: 2.9, radius: 0.62, height: 1.15, snow: 0.38 },
  ];

  for (const tier of tiers) {
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(tier.radius, tier.height, 7),
      leafMaterial,
    );
    leaves.position.y = tier.y;
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    group.add(leaves);

    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(tier.radius * 0.82, tier.height * 0.38, 7),
      snowMaterial,
    );
    snow.position.y = tier.y + tier.height * 0.24;
    snow.castShadow = true;
    group.add(snow);
  }

  group.scale.setScalar(scale);
  group.rotation.y = rand(0, Math.PI * 2);
  return group;
}

function createTrees(scene) {
  const group = new THREE.Group();
  const random = seeded(4417);

  for (let i = 0; i < 24; i += 1) {
    const x = -26 + random() * 390;
    const z = -12 - random() * 38;
    const scale = 0.7 + random() * 1.05;
    const tree = createPineTree(scale);
    tree.position.set(x, 0, z);
    group.add(tree);
  }

  for (let i = 0; i < 5; i += 1) {
    const tree = createPineTree(0.55 + random() * 0.3);
    tree.position.set(-22 + random() * 18, 0, 7 + random() * 4);
    group.add(tree);
  }

  scene.add(group);
  return group;
}

function createMountains(scene) {
  const group = new THREE.Group();
  const random = seeded(8123);

  const layers = [
    {
      z: -78,
      color: 0x214560,
      snow: 0xd3ecff,
      count: 16,
      minH: 24,
      maxH: 50,
      opacity: 1,
    },
    {
      z: -130,
      color: 0x19374f,
      snow: 0xb9daf1,
      count: 18,
      minH: 34,
      maxH: 70,
      opacity: 1,
    },
    {
      z: -195,
      color: 0x122b40,
      snow: 0x9fc3dd,
      count: 16,
      minH: 42,
      maxH: 88,
      opacity: 1,
    },
  ];

  for (const layer of layers) {
    const rockColor = new THREE.Color(layer.color);
    const snowColor = new THREE.Color(layer.snow);

    for (let i = 0; i < layer.count; i += 1) {
      const radius = 18 + random() * 34;
      const height = layer.minH + random() * (layer.maxH - layer.minH);
      const geometry = new THREE.ConeGeometry(radius, height, 6, 4);
      geometry.translate(0, height / 2, 0);

      const position = geometry.attributes.position;
      const colors = new Float32Array(position.count * 3);
      const color = new THREE.Color();

      for (let v = 0; v < position.count; v += 1) {
        const y = position.getY(v);
        const x = position.getX(v);
        const z = position.getZ(v);
        const t = clamp(y / height, 0, 1);
        const noise = Math.sin(x * 0.22 + z * 0.17) * 0.08 + random() * 0.05;
        const snowMix = smoothstep(0.52, 0.78, t + noise);
        color.copy(rockColor).lerp(snowColor, snowMix);
        color.multiplyScalar(0.82 + t * 0.24);
        colors[v * 3] = color.r;
        colors[v * 3 + 1] = color.g;
        colors[v * 3 + 2] = color.b;
      }

      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.96,
        metalness: 0.0,
        flatShading: true,
        fog: true,
      });
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.set(
        -170 + (i / layer.count) * 620 + random() * 26,
        0,
        layer.z + random() * 12,
      );
      mountain.rotation.y = random() * Math.PI * 2;
      mountain.castShadow = false;
      mountain.receiveShadow = false;
      group.add(mountain);
    }
  }

  scene.add(group);
  return group;
}

function createAurora(scene) {
  const group = new THREE.Group();
  const layers = [
    {
      position: [120, 62, -150],
      scale: [260, 58, 1],
      colorA: 0x2bffb1,
      colorB: 0x3f8cff,
      opacity: 0.3,
    },
    {
      position: [70, 78, -170],
      scale: [220, 48, 1],
      colorA: 0x7dffd4,
      colorB: 0xb06bff,
      opacity: 0.2,
    },
    {
      position: [190, 48, -132],
      scale: [190, 38, 1],
      colorA: 0x2bd9ff,
      colorB: 0x6d5bff,
      opacity: 0.16,
    },
  ];

  const materials = [];
  for (const layer of layers) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(layer.colorA) },
        uColorB: { value: new THREE.Color(layer.colorB) },
        uOpacity: { value: layer.opacity },
      },
      vertexShader: AURORA_VERTEX,
      fragmentShader: AURORA_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.position.set(...layer.position);
    mesh.scale.set(...layer.scale);
    mesh.rotation.z = rand(-0.05, 0.05);
    group.add(mesh);
    materials.push(material);
  }

  scene.add(group);
  return { group, materials };
}

function createSnowfall(scene) {
  const count = 950;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = rand(-62, 62);
    positions[i * 3 + 1] = rand(0, 48);
    positions[i * 3 + 2] = rand(-32, 32);
    speeds[i] = rand(1.2, 4.2);
    phases[i] = rand(0, Math.PI * 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    map: createSoftCircleTexture(),
    color: 0xffffff,
    size: 0.52,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    alphaTest: 0.01,
    fog: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  return { points, geometry, positions, speeds, phases, count };
}

function createMarkers(scene) {
  const group = new THREE.Group();
  const markers = [];

  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x243b4e,
    roughness: 0.7,
    metalness: 0.25,
  });
  const flagMaterial = new THREE.MeshStandardMaterial({
    color: 0x7ee8fa,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const goldFlagMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    roughness: 0.45,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(0, 0.62);
  flagShape.lineTo(0.52, 0.31);
  flagShape.closePath();
  const flagGeometry = new THREE.ShapeGeometry(flagShape);

  for (
    let distance = MARKER_STEP;
    distance <= MAX_DISTANCE;
    distance += MARKER_STEP
  ) {
    const marker = new THREE.Group();
    marker.position.set(distance, 0, -6);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.08, 2.45, 6),
      poleMaterial,
    );
    pole.position.y = 1.225;
    pole.castShadow = true;
    marker.add(pole);

    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(0.06, 2.45, 0);
    flag.castShadow = true;
    marker.add(flag);

    const sign = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createSignTexture(`${distance}m`),
        transparent: true,
        depthWrite: false,
        fog: true,
      }),
    );
    sign.scale.set(3.2, 1.6, 1);
    sign.position.set(0, 3.15, 0);
    marker.add(sign);

    group.add(marker);
    markers.push({ group: marker, flag, sign, distance });
  }

  const bestGroup = new THREE.Group();
  bestGroup.visible = false;

  const bestPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, 3.1, 6),
    poleMaterial,
  );
  bestPole.position.y = 1.55;
  bestPole.castShadow = true;
  bestGroup.add(bestPole);

  const bestFlag = new THREE.Mesh(flagGeometry, goldFlagMaterial);
  bestFlag.scale.setScalar(1.25);
  bestFlag.position.set(0.08, 3.05, 0);
  bestFlag.castShadow = true;
  bestGroup.add(bestFlag);

  const bestSign = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createSignTexture("BEST", { best: true }),
      transparent: true,
      depthWrite: false,
      fog: true,
    }),
  );
  bestSign.scale.set(3.8, 1.9, 1);
  bestSign.position.set(0, 4.0, 0);
  bestGroup.add(bestSign);

  const bestGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createSoftCircleTexture(),
      color: 0xffd166,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }),
  );
  bestGlow.scale.set(7, 7, 1);
  bestGlow.position.set(0, 3.2, 0.2);
  bestGroup.add(bestGlow);

  group.add(bestGroup);
  scene.add(group);

  return { group, markers, bestGroup, bestFlag, bestGlow, bestSign };
}

function createSpectators(scene) {
  const group = new THREE.Group();
  const spectators = [];
  const positions = [
    { x: 18, z: -10, scale: 0.82 },
    { x: 44, z: -12, scale: 0.92 },
    { x: 74, z: -9, scale: 0.76 },
    { x: 112, z: -11, scale: 0.88 },
    { x: 156, z: -10, scale: 0.9 },
  ];

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2c3d,
    roughness: 0.6,
  });
  const bellyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4fbff,
    roughness: 0.8,
  });
  const orangeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff9f43,
    roughness: 0.6,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x080d12,
    roughness: 0.3,
  });

  for (const spec of positions) {
    const penguin = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.36, 0.42, 5, 12),
      bodyMaterial,
    );
    body.position.y = 0.7;
    body.scale.z = 0.85;
    body.castShadow = true;
    penguin.add(body);

    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(0.31, 14, 10),
      bellyMaterial,
    );
    belly.position.set(0, 0.72, 0.24);
    belly.scale.set(0.9, 1.1, 0.55);
    penguin.add(belly);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 14, 10),
      bodyMaterial,
    );
    head.position.y = 1.28;
    head.castShadow = true;
    penguin.add(head);

    const face = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      bellyMaterial,
    );
    face.position.set(0, 1.31, 0.16);
    face.scale.set(1, 0.8, 0.5);
    penguin.add(face);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 6),
        eyeMaterial,
      );
      eye.position.set(side * 0.09, 1.34, 0.33);
      penguin.add(eye);
    }

    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 6),
      orangeMaterial,
    );
    beak.position.set(0, 1.25, 0.42);
    beak.rotation.x = Math.PI / 2;
    penguin.add(beak);

    for (const side of [-1, 1]) {
      const flipper = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.06, 0.28, 3, 6),
        bodyMaterial,
      );
      flipper.position.set(side * 0.34, 0.78, 0);
      flipper.rotation.z = side * 0.25;
      penguin.add(flipper);
    }

    penguin.position.set(spec.x, 0, spec.z);
    penguin.scale.setScalar(spec.scale);
    penguin.rotation.y = 0;
    group.add(penguin);
    spectators.push({
      group: penguin,
      baseY: 0,
      phase: rand(0, Math.PI * 2),
      x: spec.x,
    });
  }

  scene.add(group);
  return { group, spectators };
}

export function createEnvironment(scene) {
  createGround(scene);
  createCliff(scene);
  createYetiMound(scene);
  createTrees(scene);
  createMountains(scene);
  const aurora = createAurora(scene);
  const snowfall = createSnowfall(scene);
  const markers = createMarkers(scene);
  const spectators = createSpectators(scene);

  let best = 0;
  let bestPulse = 0;

  const setBest = (distance) => {
    best = clamp(distance, 0, MAX_DISTANCE);
    markers.bestGroup.visible = best > 3;
    markers.bestGroup.position.set(best, 0, -5.2);

    if (best > 3) {
      const texture = createSignTexture(formatWhole(best), { best: true });
      const previous = markers.bestSign.material.map;
      markers.bestSign.material.map = texture;
      markers.bestSign.material.needsUpdate = true;
      if (previous) previous.dispose();
    }

    for (const marker of markers.markers) {
      marker.group.visible = best <= 3 || Math.abs(marker.distance - best) > 6;
    }
  };

  const celebrate = () => {
    bestPulse = 1;
  };

  const update = (dt, time, camera, penguinX = 0) => {
    for (const material of aurora.materials) {
      material.uniforms.uTime.value = time;
    }

    const snow = snowfall;
    const positions = snow.positions;
    const cameraX = camera.position.x;
    snow.points.position.x = cameraX;
    for (let i = 0; i < snow.count; i += 1) {
      const index = i * 3;
      positions[index + 1] -= snow.speeds[i] * dt;
      positions[index] += Math.sin(time * 0.9 + snow.phases[i]) * dt * 0.35;
      if (positions[index + 1] < -1) {
        positions[index + 1] = 48;
        positions[index] = rand(-62, 62);
        positions[index + 2] = rand(-32, 32);
      }
      if (positions[index] > 62) positions[index] = -62;
      if (positions[index] < -62) positions[index] = 62;
    }
    snow.geometry.attributes.position.needsUpdate = true;

    for (const marker of markers.markers) {
      marker.flag.rotation.y =
        Math.sin(time * 1.4 + marker.distance * 0.12) * 0.12;
    }

    if (markers.bestGroup.visible) {
      bestPulse = Math.max(0, bestPulse - dt * 1.8);
      const pulse = 1 + Math.sin(time * 2.2) * 0.04 + bestPulse * 0.25;
      markers.bestFlag.scale.setScalar(1.25 * pulse);
      markers.bestGlow.material.opacity =
        0.18 + Math.sin(time * 2.2) * 0.04 + bestPulse * 0.35;
      markers.bestGlow.scale.setScalar(7 + bestPulse * 5);
    }

    for (const spectator of spectators.spectators) {
      const distance = Math.abs(penguinX - spectator.x);
      const excited = distance < 18;
      const bob =
        Math.sin(time * (excited ? 9 : 2.4) + spectator.phase) *
        (excited ? 0.12 : 0.03);
      spectator.group.position.y = bob;
      spectator.group.rotation.z = excited
        ? Math.sin(time * 8 + spectator.phase) * 0.06
        : 0;
    }
  };

  return {
    update,
    setBest,
    celebrate,
    getBest: () => best,
    markers,
  };
}
