// Phase 3 stub — replaced when yeti model is built
import * as THREE from 'three';

export function createYeti(scene, x, y) {
  const group = new THREE.Group();
  group.position.set(x, y, 0);
  // Temporary placeholder
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  scene.add(group);
  return group;
}
