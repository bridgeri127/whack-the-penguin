// Phase 3 stub — replaced when penguin model is built
import * as THREE from 'three';

export function createPenguin(scene, x, y) {
  const group = new THREE.Group();
  group.position.set(x, y, 0);
  // Temporary placeholder
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  scene.add(group);
  return group;
}
