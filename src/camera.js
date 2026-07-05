import * as THREE from 'three';
import { STATES, CAMERA_FLY_LERP_X, CAMERA_FLY_LERP_Y, CAMERA_LANDED_LERP } from './constants.js';

const tempVec = new THREE.Vector3();

export function updateCamera(camera, penguin, state, dt, cameraTarget) {
  let targetX, targetY, targetZ;

  switch (state) {
    case STATES.INTRO:
      targetX = 80;
      targetY = 250;
      targetZ = 500;
      break;

    case STATES.DROPPING:
    case STATES.LAND_WOBBLE:
    case STATES.READY:
    case STATES.SWING:
      targetX = 120;
      targetY = 150;
      targetZ = 500;
      break;

    case STATES.FLYING:
      // Follow penguin with offset
      targetX = penguin.position.x - 100;
      targetY = Math.max(penguin.position.y + 50, 80);
      targetZ = 500;
      break;

    case STATES.LANDED:
      targetX = penguin.position.x - 50;
      targetY = Math.max(penguin.position.y + 60, 80);
      targetZ = 500;
      break;
  }

  // Lerp camera target
  const speed = (state === STATES.FLYING)
    ? CAMERA_FLY_LERP_X
    : CAMERA_LANDED_LERP;
  const speedY = (state === STATES.FLYING)
    ? CAMERA_FLY_LERP_Y
    : CAMERA_LANDED_LERP;

  cameraTarget.x += (targetX - cameraTarget.x) * Math.min(1, dt * speed);
  cameraTarget.y += (targetY - cameraTarget.y) * Math.min(1, dt * speedY);
  cameraTarget.z += (targetZ - cameraTarget.z) * Math.min(1, dt * speed);

  // Move camera and look at target
  camera.position.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
  tempVec.set(cameraTarget.x, cameraTarget.y, 0);
  camera.lookAt(tempVec);
}
