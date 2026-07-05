import * as THREE from 'three';
import { COLORS } from './constants.js';

export function createPenguin(scene, x, y) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: COLORS.penguinBody,
    flatShading: true,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: COLORS.penguinBelly,
    flatShading: true,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: COLORS.penguinBeak,
    flatShading: true,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: COLORS.penguinEye,
    flatShading: true,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: COLORS.penguinPupil,
    flatShading: true,
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: COLORS.penguinBeak,
    flatShading: true,
  });

  // Body — main dark shape (squash/stretch target via group scale)
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'body';

  // Torso
  const torsoGeo = new THREE.BoxGeometry(28, 40, 28);
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Belly — lighter front panel
  const bellyGeo = new THREE.BoxGeometry(18, 34, 2);
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.position.set(8, -2, 0);
  bodyGroup.add(belly);

  group.add(bodyGroup);

  // Head group — sits on top of body
  const headGroup = new THREE.Group();
  headGroup.name = 'head';

  // Head sphere
  const headGeo = new THREE.SphereGeometry(14, 6, 5);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.castShadow = true;
  headGroup.add(head);

  // Beak — cone pointing right (flight direction)
  const beakGeo = new THREE.ConeGeometry(4, 12, 4);
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(14, -2, 0);
  headGroup.add(beak);

  // Eyes — on the front face of the head
  const eyeGeo = new THREE.SphereGeometry(4.5, 5, 4);
  const pupilGeo = new THREE.SphereGeometry(2.2, 4, 3);

  // Left eye (closer to camera / toward viewer)
  const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeL.position.set(8, 5, 9);
  headGroup.add(eyeL);

  const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
  pupilL.name = 'pupilL';
  pupilL.position.set(10, 6, 9);
  headGroup.add(pupilL);

  // Right eye (farther from camera)
  const eyeR = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeR.position.set(8, 5, -9);
  headGroup.add(eyeR);

  const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
  pupilR.name = 'pupilR';
  pupilR.position.set(10, 6, -9);
  headGroup.add(pupilR);

  headGroup.position.y = 30;
  bodyGroup.add(headGroup);

  // Flippers — thin boxes on each side of the body
  const flipperGeo = new THREE.BoxGeometry(14, 6, 2);

  const flipperL = new THREE.Mesh(flipperGeo, bodyMat);
  flipperL.name = 'flipperL';
  flipperL.position.set(-4, 2, 16);
  flipperL.castShadow = true;
  bodyGroup.add(flipperL);

  const flipperR = new THREE.Mesh(flipperGeo, bodyMat);
  flipperR.name = 'flipperR';
  flipperR.position.set(-4, 2, -16);
  flipperR.castShadow = true;
  bodyGroup.add(flipperR);

  // Feet — small flat boxes at the bottom
  const footGeo = new THREE.BoxGeometry(10, 4, 8);

  const footL = new THREE.Mesh(footGeo, footMat);
  footL.name = 'footL';
  footL.position.set(4, -22, 6);
  bodyGroup.add(footL);

  const footR = new THREE.Mesh(footGeo, footMat);
  footR.name = 'footR';
  footR.position.set(4, -22, -6);
  bodyGroup.add(footR);

  group.position.set(x, y, 0);
  scene.add(group);

  return group;
}
