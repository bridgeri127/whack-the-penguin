import * as THREE from 'three';
import { COLORS } from './constants.js';

export function createYeti(scene, x, y) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiBody,
    flatShading: true,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiHead,
    flatShading: true,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiHair,
    flatShading: true,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiEye,
    flatShading: true,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiPupil,
    flatShading: true,
  });
  const browMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiBrow,
    flatShading: true,
  });
  const mouthMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiMouth,
    flatShading: true,
  });
  const tongueMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiTongue,
    flatShading: true,
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: COLORS.yetiFoot,
    flatShading: true,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: COLORS.clubHandle,
    flatShading: true,
  });
  const clubHeadMat = new THREE.MeshStandardMaterial({
    color: COLORS.clubHead,
    flatShading: true,
  });
  const clubDetailMat = new THREE.MeshStandardMaterial({
    color: COLORS.clubDetail,
    flatShading: true,
  });

  // Body — large torso
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'body';

  const torsoGeo = new THREE.BoxGeometry(36, 48, 30);
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Fur details — small boxes scattered on torso
  const furPositions = [
    [-10, 15, 15.1], [10, 10, 15.1], [-5, -5, 15.1],
    [8, -12, 15.1], [-12, 5, 15.1], [5, 20, 15.1],
    [-8, -18, 15.1], [12, -3, 15.1],
  ];
  for (const [fx, fy, fz] of furPositions) {
    const fGeo = new THREE.BoxGeometry(6 + Math.random() * 4, 3, 1);
    const fur = new THREE.Mesh(fGeo, hairMat);
    fur.position.set(fx, fy, fz);
    bodyGroup.add(fur);
  }

  group.add(bodyGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(12, 20, 12);

  const legL = new THREE.Mesh(legGeo, bodyMat);
  legL.position.set(-6, -34, 5);
  legL.castShadow = true;
  bodyGroup.add(legL);

  const legR = new THREE.Mesh(legGeo, bodyMat);
  legR.position.set(-6, -34, -5);
  legR.castShadow = true;
  bodyGroup.add(legR);

  // Feet
  const footGeo = new THREE.BoxGeometry(14, 6, 16);

  const footL = new THREE.Mesh(footGeo, footMat);
  footL.position.set(-2, -44, 6);
  bodyGroup.add(footL);

  const footR = new THREE.Mesh(footGeo, footMat);
  footR.position.set(-2, -44, -6);
  bodyGroup.add(footR);

  // Head group
  const headGroup = new THREE.Group();
  headGroup.name = 'head';

  // Head box
  const headGeo = new THREE.BoxGeometry(30, 26, 26);
  const head = new THREE.Mesh(headGeo, headMat);
  head.castShadow = true;
  headGroup.add(head);

  // Hair tufts on top
  const hairTuftPositions = [
    [-5, 14, 0], [5, 15, 4], [0, 15, -4], [8, 13, -2], [-8, 13, 2],
  ];
  for (const [hx, hy, hz] of hairTuftPositions) {
    const hGeo = new THREE.BoxGeometry(5, 6 + Math.random() * 4, 3);
    const tuft = new THREE.Mesh(hGeo, hairMat);
    tuft.position.set(hx, hy, hz);
    headGroup.add(tuft);
  }

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(5, 5, 4);
  const pupilGeo = new THREE.SphereGeometry(2.8, 4, 3);

  const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeL.position.set(8, 4, 8);
  headGroup.add(eyeL);

  const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
  pupilL.name = 'pupilL';
  pupilL.position.set(11, 5, 8);
  headGroup.add(pupilL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeR.position.set(8, 4, -8);
  headGroup.add(eyeR);

  const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
  pupilR.name = 'pupilR';
  pupilR.position.set(11, 5, -8);
  headGroup.add(pupilR);

  // Brows — thick boxes above eyes
  const browGeo = new THREE.BoxGeometry(8, 2.5, 2);

  const browL = new THREE.Mesh(browGeo, browMat);
  browL.name = 'browL';
  browL.position.set(8, 10, 8);
  headGroup.add(browL);

  const browR = new THREE.Mesh(browGeo, browMat);
  browR.name = 'browR';
  browR.position.set(8, 10, -8);
  headGroup.add(browR);

  // Mouth — open box
  const mouthGeo = new THREE.BoxGeometry(6, 5, 10);
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.name = 'mouth';
  mouth.position.set(11, -5, 0);
  headGroup.add(mouth);

  // Tongue
  const tongueGeo = new THREE.BoxGeometry(3, 3, 6);
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);
  tongue.position.set(10, -6, 0);
  headGroup.add(tongue);

  headGroup.position.y = 38;
  bodyGroup.add(headGroup);

  // Club arm — pivot group for swinging
  // The pivot is at the shoulder (back of yeti, away from penguin)
  const clubArmGroup = new THREE.Group();
  clubArmGroup.name = 'clubArm';
  clubArmGroup.position.set(-14, 16, 0); // shoulder pivot

  // Upper arm
  const upperArmGeo = new THREE.BoxGeometry(20, 6, 6);
  const upperArm = new THREE.Mesh(upperArmGeo, bodyMat);
  upperArm.position.set(-8, 0, 0);
  clubArmGroup.add(upperArm);

  // Forearm
  const forearmGeo = new THREE.BoxGeometry(16, 5, 5);
  const forearm = new THREE.Mesh(forearmGeo, bodyMat);
  forearm.position.set(-18, 0, 0);
  clubArmGroup.add(forearm);

  // Club handle
  const handleGeo = new THREE.BoxGeometry(24, 4, 4);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(-28, 0, 0);
  clubArmGroup.add(handle);

  // Club head — larger block at the end
  const clubHeadGeo = new THREE.BoxGeometry(14, 12, 10);
  const clubHead = new THREE.Mesh(clubHeadGeo, clubHeadMat);
  clubHead.position.set(-38, 2, 0);
  clubHead.castShadow = true;
  clubArmGroup.add(clubHead);

  // Club detail — bands on the club head
  const bandGeo = new THREE.BoxGeometry(1, 13, 11);
  const band1 = new THREE.Mesh(bandGeo, clubDetailMat);
  band1.position.set(-34, 2, 0);
  clubArmGroup.add(band1);

  const band2 = new THREE.Mesh(bandGeo, clubDetailMat);
  band2.position.set(-42, 2, 0);
  clubArmGroup.add(band2);

  group.add(clubArmGroup);

  group.position.set(x, y, 0);
  scene.add(group);

  return group;
}
