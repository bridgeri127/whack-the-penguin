import * as THREE from "three";
import { damp } from "./utils.js";

export function createCameraRig(camera) {
  const position = new THREE.Vector3(-1.8, 7.2, 25);
  const lookAt = new THREE.Vector3(-2.4, 2.6, 0);
  const desiredPosition = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();
  const shakeOffset = new THREE.Vector3();

  let mode = "title";
  let shake = 0;
  let initialized = false;

  const setMode = (nextMode) => {
    mode = nextMode;
  };

  const kick = (amount) => {
    shake = Math.max(shake, amount);
  };

  const update = (dt, time, info = {}) => {
    const penguin = info.penguin ?? { x: -0.9, y: 0 };
    const charge = info.charge ?? 0;
    const portrait = camera.aspect < 0.85;
    let positionLambda = 3.2;
    let lookLambda = 4;

    if (mode === "title") {
      if (portrait) {
        desiredPosition.set(-3.4, 8.4, 36);
        desiredLook.set(-4.3, 1.35, 0);
      } else {
        desiredPosition.set(-1.6, 7.2, 25);
        desiredLook.set(-2.6, 2.5, 0);
      }
    } else if (mode === "ready") {
      if (portrait) {
        desiredPosition.set(0.4, 5.9, 24);
        desiredLook.set(-1.7, 1.3, 0);
      } else {
        desiredPosition.set(0.8, 5.45, 18.2);
        desiredLook.set(-1.65, 2.3, 0);
      }
      positionLambda = 4.4;
      lookLambda = 5.2;
    } else if (mode === "charge") {
      if (portrait) {
        desiredPosition.set(0.6, 5.8, 23.5);
        desiredLook.set(-1.6, 1.25, 0);
      } else {
        desiredPosition.set(1.0, 5.3, 17.6);
        desiredLook.set(-1.55, 2.2, 0);
      }
      positionLambda = 5.2;
      lookLambda = 6.2;
    } else if (mode === "swing") {
      if (portrait) {
        desiredPosition.set(0.2, 5.6, 23);
        desiredLook.set(-1.0, 1.3, 0);
      } else {
        desiredPosition.set(0.15, 5.15, 17.4);
        desiredLook.set(-0.8, 2.0, 0);
      }
      positionLambda = 9;
      lookLambda = 10;
    } else if (mode === "flight") {
      const height = Math.max(0, penguin.y);
      if (portrait) {
        desiredPosition.set(
          penguin.x - 5,
          5.6 + height * 0.62,
          27 + height * 0.2,
        );
        desiredLook.set(penguin.x + 4, 1.2 + height * 0.95, 0);
      } else {
        desiredPosition.set(
          penguin.x - 3.6,
          5.2 + height * 0.58,
          21 + height * 0.16,
        );
        desiredLook.set(penguin.x + 5.2, 1.4 + height * 0.92, 0);
      }
      positionLambda = 5.6;
      lookLambda = 7.2;
    } else if (mode === "landed") {
      if (portrait) {
        desiredPosition.set(penguin.x - 8, 8.0, 29);
        desiredLook.set(penguin.x + 1.2, -0.8, 0);
      } else {
        desiredPosition.set(penguin.x - 6.5, 7.2, 22.5);
        desiredLook.set(penguin.x + 1.8, 2.1, 0);
      }
      positionLambda = 2.7;
      lookLambda = 3.4;
    } else if (mode === "result") {
      if (portrait) {
        desiredPosition.set(
          penguin.x - 8.5,
          8.2 + Math.sin(time * 0.3) * 0.15,
          30,
        );
        desiredLook.set(penguin.x + 1.5, -0.8, 0);
      } else {
        desiredPosition.set(
          penguin.x - 7.2,
          7.4 + Math.sin(time * 0.3) * 0.15,
          23.5,
        );
        desiredLook.set(penguin.x + 2.0, 2.0, 0);
      }
      positionLambda = 1.8;
      lookLambda = 2.2;
    }

    if (!initialized) {
      position.copy(desiredPosition);
      lookAt.copy(desiredLook);
      initialized = true;
    }

    position.x = damp(position.x, desiredPosition.x, positionLambda, dt);
    position.y = damp(position.y, desiredPosition.y, positionLambda, dt);
    position.z = damp(position.z, desiredPosition.z, positionLambda, dt);

    lookAt.x = damp(lookAt.x, desiredLook.x, lookLambda, dt);
    lookAt.y = damp(lookAt.y, desiredLook.y, lookLambda, dt);
    lookAt.z = damp(lookAt.z, desiredLook.z, lookLambda, dt);

    shake = Math.max(0, shake - dt * 2.4);
    const shakeAmount = shake * 0.2 + charge * charge * 0.014;
    shakeOffset.set(
      Math.sin(time * 63) * shakeAmount,
      Math.cos(time * 47) * shakeAmount * 0.7,
      Math.sin(time * 39) * shakeAmount * 0.35,
    );

    camera.position.copy(position).add(shakeOffset);
    camera.lookAt(lookAt);
  };

  return {
    update,
    setMode,
    kick,
    getMode: () => mode,
    getPosition: () => camera.position,
  };
}
