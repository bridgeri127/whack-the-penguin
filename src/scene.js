import * as THREE from "three";
import { COLORS } from "./constants.js";

const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uBottomColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunDirection;
  varying vec3 vWorldPosition;

  void main() {
    vec3 direction = normalize(vWorldPosition);
    float height = direction.y;

    vec3 color = mix(uHorizonColor, uTopColor, smoothstep(0.0, 0.62, height));
    color = mix(uBottomColor, color, smoothstep(-0.24, 0.04, height));

    float sunAmount = max(dot(direction, normalize(uSunDirection)), 0.0);
    color += uSunColor * pow(sunAmount, 420.0) * 1.8;
    color += uSunColor * pow(sunAmount, 9.0) * 0.12;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createMoonTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(96, 86, 8, 128, 128, 128);
  gradient.addColorStop(0, "#fffdf2");
  gradient.addColorStop(0.55, "#f5e8c8");
  gradient.addColorStop(0.82, "#d9c7a3");
  gradient.addColorStop(1, "#b8a582");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const craters = [
    [86, 76, 18, 0.08],
    [168, 104, 13, 0.07],
    [118, 174, 21, 0.06],
    [188, 176, 9, 0.06],
    [64, 158, 11, 0.05],
  ];
  for (const [x, y, radius, alpha] of craters) {
    const crater = ctx.createRadialGradient(x, y, 1, x, y, radius);
    crater.addColorStop(0, `rgba(120, 102, 74, ${alpha})`);
    crater.addColorStop(0.7, `rgba(120, 102, 74, ${alpha * 0.55})`);
    crater.addColorStop(1, "rgba(120, 102, 74, 0)");
    ctx.fillStyle = crater;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGlowTexture(
  inner = "rgba(255, 246, 214, 0.95)",
  outer = "rgba(255, 246, 214, 0)",
) {
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
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, inner.replace(/[\d.]+\)$/, "0.35)"));
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSky(scene) {
  const skyGroup = new THREE.Group();
  skyGroup.renderOrder = -10;

  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTopColor: { value: new THREE.Color(0x030b16) },
      uHorizonColor: { value: new THREE.Color(0x12344c) },
      uBottomColor: { value: new THREE.Color(0x081521) },
      uSunColor: { value: new THREE.Color(0xffe8b0) },
      uSunDirection: {
        value: new THREE.Vector3(0.48, 0.38, -0.79).normalize(),
      },
    },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 20),
    skyMaterial,
  );
  sky.frustumCulled = false;
  skyGroup.add(sky);

  const starCount = 700;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.9 + 0.05);
    const radius = 420 + Math.random() * 60;
    starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    starPositions[i * 3 + 1] = Math.cos(phi) * radius;
    starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3),
  );
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xcfeaff,
      size: 1.35,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }),
  );
  skyGroup.add(stars);

  const moonGroup = new THREE.Group();
  moonGroup.position.set(150, 150, -320);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(22, 32, 24),
    new THREE.MeshBasicMaterial({ map: createMoonTexture(), fog: false }),
  );
  moonGroup.add(moon);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: 0xffe8b0,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }),
  );
  glow.scale.set(160, 160, 1);
  moonGroup.add(glow);
  skyGroup.add(moonGroup);

  scene.add(skyGroup);
  return { skyGroup, sky, stars, moonGroup, glow };
}

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1c2b, 0.0032);

  const initialAspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(
    initialAspect < 0.85 ? 50 : 42,
    initialAspect,
    0.1,
    900,
  );
  camera.position.set(-3, 6, 20);

  const sky = createSky(scene);

  const hemi = new THREE.HemisphereLight(0x9fd8ff, 0x172536, 1.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe9c7, 2.35);
  sun.position.set(-24, 38, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 130;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  const rim = new THREE.DirectionalLight(0x78e7ff, 1.15);
  rim.position.set(26, 18, -18);
  scene.add(rim);

  const bounce = new THREE.PointLight(0x5bb7d9, 18, 40, 2);
  bounce.position.set(-2, 2, 8);
  scene.add(bounce);

  const state = {
    renderer,
    scene,
    camera,
    sky,
    sun,
    rim,
    bounce,
    targetX: 0,
  };

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.85 ? 50 : 42;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  };

  const update = (dt, time, focusX = 0) => {
    state.targetX += (focusX - state.targetX) * (1 - Math.exp(-2.5 * dt));

    const sunX = state.targetX - 24;
    sun.position.set(sunX, 38, 24);
    sun.target.position.set(state.targetX, 0, 0);
    sun.target.updateMatrixWorld();

    rim.position.set(state.targetX + 26, 18, -18);
    bounce.position.set(state.targetX - 1, 2.5, 8);

    sky.skyGroup.position.x = camera.position.x;
    sky.skyGroup.position.z = camera.position.z;
    sky.moonGroup.rotation.y = time * 0.002;
    sky.glow.material.opacity = 0.5 + Math.sin(time * 0.35) * 0.06;
  };

  window.addEventListener("resize", resize);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    state.resizeObserver = observer;
  }

  return { ...state, update, resize };
}
