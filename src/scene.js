import * as THREE from 'three';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants.js';

export function createScene(container) {
  const scene = new THREE.Scene();

  // Sky gradient via background color
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.FogExp2(COLORS.fog, 0.0008);

  // Camera — perspective, side-view with depth
  const camera = new THREE.PerspectiveCamera(
    50,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    3000
  );
  camera.position.set(150, 280, 500);
  camera.lookAt(150, 150, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // --- Lighting ---

  // Ambient — cool blue wash for winter
  const ambient = new THREE.AmbientLight(0x6688aa, 0.6);
  scene.add(ambient);

  // Hemisphere — sky to ground color gradient
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0xf4f4f4, 0.4);
  scene.add(hemi);

  // Sun — warm directional from upper-right
  const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
  sun.position.set(200, 300, 100);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 2000;
  sun.shadow.camera.top = 500;
  sun.shadow.camera.bottom = -100;
  sun.shadow.camera.far = 1000;
  sun.shadow.camera.near = 1;
  scene.add(sun);

  // Fill — cool from the left
  const fill = new THREE.DirectionalLight(0x88aacc, 0.3);
  fill.position.set(-100, 100, -50);
  scene.add(fill);

  return { scene, camera, renderer };
}
