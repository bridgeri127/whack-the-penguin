import * as THREE from 'three';
import {
  STATES, PENGUIN_SPIN_SPEED, SWING_WINDBACK,
  SQUASH_RECOVERY_FAST, SQUASH_RECOVERY_SLOW,
} from './constants.js';

export function updateAnimations(penguin, yeti, state, dt, squash, swingAngle, timing, wobbleTimer) {
  // --- Penguin ---
  const pBody = penguin.getObjectByName('body');
  const pHead = penguin.getObjectByName('head');
  const pFlipperL = penguin.getObjectByName('flipperL');
  const pFlipperR = penguin.getObjectByName('flipperR');
  const pPupilL = penguin.getObjectByName('pupilL');
  const pPupilR = penguin.getObjectByName('pupilR');

  if (pBody) {
    // Squash and stretch — volume-preserving on Y axis
    const sx = 1 / Math.sqrt(squash);
    const sy = squash;
    pBody.scale.set(sx, sy, sx);
  }

  // Flight spin
  if (state === STATES.FLYING) {
    penguin.rotation.z += dt * PENGUIN_SPIN_SPEED;

    // Flippers tucked during flight
    if (pFlipperL) pFlipperL.rotation.z = 0.5;
    if (pFlipperR) pFlipperR.rotation.z = -0.5;
  } else if (state === STATES.DROPPING) {
    penguin.rotation.z = 0;
    // Flippers raised during fall
    if (pFlipperL) pFlipperL.rotation.z = -0.8;
    if (pFlipperR) pFlipperR.rotation.z = 0.8;
  } else if (state === STATES.LAND_WOBBLE) {
    // Wobble on landing — damped sine rotation
    const wobbleAmount = Math.sin(wobbleTimer * 25) * Math.exp(-wobbleTimer * 8) * 0.15;
    penguin.rotation.z = wobbleAmount;

    // Flippers spread during wobble
    if (pFlipperL) pFlipperL.rotation.z = -0.4;
    if (pFlipperR) pFlipperR.rotation.z = 0.4;
  } else {
    penguin.rotation.z = 0;
    // Idle flipper bob
    const bob = Math.sin(performance.now() * 0.002) * 0.05;
    if (pFlipperL) pFlipperL.rotation.z = bob;
    if (pFlipperR) pFlipperR.rotation.z = -bob;
  }

  // Penguin pupil tracking — look toward yeti
  if (pPupilL && pPupilR) {
    const dx = yeti.position.x - penguin.position.x;
    const px = Math.sign(dx) * Math.min(1.5, Math.abs(dx) * 0.01);
    const py = Math.max(0, (yeti.position.y - penguin.position.y) * 0.008);
    pPupilL.position.x = 10 + px;
    pPupilL.position.y = 6 + py;
    pPupilR.position.x = 10 + px;
    pPupilR.position.y = 6 + py;
  }

  // --- Yeti ---
  const yHead = yeti.getObjectByName('head');
  const yClubArm = yeti.getObjectByName('clubArm');
  const yPupilL = yeti.getObjectByName('pupilL');
  const yPupilR = yeti.getObjectByName('pupilR');
  const yBrowL = yeti.getObjectByName('browL');
  const yBrowR = yeti.getObjectByName('browR');
  const yMouth = yeti.getObjectByName('mouth');

  // Club arm swing
  if (yClubArm) {
    yClubArm.rotation.z = swingAngle;
  }

  // Idle yeti — slight body bob
  if (state === STATES.READY || state === STATES.INTRO) {
    if (yHead) {
      yHead.position.y = 38 + Math.sin(performance.now() * 0.003) * 1.5;
    }
  }

  // Swing state — yeti strains forward
  if (state === STATES.SWING && yHead) {
    yHead.position.y = 38 - 3;
    // Furrow brows
    if (yBrowL) yBrowL.rotation.z = 0.2;
    if (yBrowR) yBrowR.rotation.z = 0.2;
    // Open mouth wide
    if (yMouth) yMouth.scale.y = 2;
  } else if (yHead) {
    // Reset brows and mouth
    if (yBrowL) yBrowL.rotation.z = 0;
    if (yBrowR) yBrowR.rotation.z = 0;
    if (yMouth) yMouth.scale.y = 1;
  }

  // Yeti pupil tracking — look at penguin
  if (yPupilL && yPupilR) {
    const dx = penguin.position.x - yeti.position.x;
    const px = Math.sign(dx) * Math.min(1.5, Math.abs(dx) * 0.008);
    const py = Math.max(0, (penguin.position.y - yeti.position.y) * 0.005);
    yPupilL.position.x = 11 + px;
    yPupilL.position.y = 5 + py;
    yPupilR.position.x = 11 + px;
    yPupilR.position.y = 5 + py;
  }

  // Flying state — yeti watches, arm follows through then returns
  if (state === STATES.FLYING && yClubArm) {
    // Follow-through: arm stays forward then slowly returns
    swingAngle += (SWING_WINDBACK - swingAngle) * dt * 2;
    yClubArm.rotation.z = swingAngle;
  }
}
