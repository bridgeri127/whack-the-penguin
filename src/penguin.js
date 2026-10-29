import * as THREE from "three";
import { clamp, damp, lerp, rand } from "./utils.js";

function makeMaterials() {
  return {
    body: new THREE.MeshStandardMaterial({
      color: 0x182a3a,
      roughness: 0.52,
      metalness: 0.06,
    }),
    belly: new THREE.MeshStandardMaterial({ color: 0xf4fbff, roughness: 0.78 }),
    orange: new THREE.MeshStandardMaterial({
      color: 0xff9f43,
      roughness: 0.58,
    }),
    white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }),
    black: new THREE.MeshStandardMaterial({ color: 0x070c12, roughness: 0.3 }),
    pink: new THREE.MeshStandardMaterial({ color: 0xff9eb5, roughness: 0.8 }),
    scarf: new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.7 }),
    scarfDark: new THREE.MeshStandardMaterial({
      color: 0xd94b5b,
      roughness: 0.75,
    }),
  };
}

function addMesh(parent, geometry, material, position, scale, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createPenguin({ scale = 0.85 } = {}) {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);
  root.scale.setScalar(scale);

  const materials = makeMaterials();

  const body = addMesh(
    rig,
    new THREE.CapsuleGeometry(0.42, 0.5, 7, 18),
    materials.body,
    [0, 0.74, 0],
    [1, 1, 0.86],
  );
  body.receiveShadow = true;

  const belly = addMesh(
    rig,
    new THREE.SphereGeometry(0.36, 18, 14),
    materials.belly,
    [0, 0.76, 0.26],
    [0.92, 1.18, 0.56],
  );
  belly.castShadow = false;

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.4, 0.02);
  rig.add(headGroup);

  const head = addMesh(
    headGroup,
    new THREE.SphereGeometry(0.36, 20, 16),
    materials.body,
    [0, 0, 0],
    [1, 0.96, 0.95],
  );
  head.receiveShadow = true;

  const face = addMesh(
    headGroup,
    new THREE.SphereGeometry(0.27, 18, 14),
    materials.belly,
    [0, 0.04, 0.2],
    [1.06, 0.8, 0.52],
  );
  face.castShadow = false;

  const eyeGroups = [];
  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.12, 0.08, 0.42);
    headGroup.add(eyeGroup);

    addMesh(
      eyeGroup,
      new THREE.SphereGeometry(0.105, 14, 12),
      materials.white,
      [0, 0, 0],
      [1, 1, 0.55],
    );
    addMesh(
      eyeGroup,
      new THREE.SphereGeometry(0.055, 12, 10),
      materials.black,
      [0, 0, 0.055],
      [1, 1, 0.7],
    );
    addMesh(eyeGroup, new THREE.SphereGeometry(0.018, 8, 6), materials.white, [
      side * -0.015,
      0.025,
      0.1,
    ]);
    eyeGroups.push(eyeGroup);
  }

  const beak = addMesh(
    headGroup,
    new THREE.ConeGeometry(0.085, 0.23, 8),
    materials.orange,
    [0, -0.05, 0.56],
    [1, 1, 1],
    [Math.PI / 2, 0, 0],
  );
  beak.castShadow = true;

  addMesh(
    headGroup,
    new THREE.ConeGeometry(0.06, 0.14, 7),
    materials.orange,
    [0, -0.13, 0.54],
    [1, 1, 0.8],
    [Math.PI / 2, 0, 0],
  );

  for (const side of [-1, 1]) {
    addMesh(
      headGroup,
      new THREE.SphereGeometry(0.065, 10, 8),
      materials.pink,
      [side * 0.215, -0.04, 0.37],
      [1, 0.72, 0.35],
    );
  }

  addMesh(
    headGroup,
    new THREE.ConeGeometry(0.055, 0.18, 6),
    materials.body,
    [0, 0.37, -0.02],
    [1, 1, 1],
    [0.18, 0, -0.16],
  );

  const scarf = new THREE.Group();
  scarf.position.set(0, 1.18, 0);
  rig.add(scarf);

  addMesh(
    scarf,
    new THREE.TorusGeometry(0.31, 0.075, 8, 18),
    materials.scarf,
    [0, 0, 0],
    [1, 0.92, 1],
    [Math.PI / 2, 0, 0],
  );

  const scarfTail = addMesh(
    scarf,
    new THREE.BoxGeometry(0.16, 0.42, 0.05),
    materials.scarfDark,
    [0.24, -0.22, 0.17],
    [1, 1, 1],
    [0.15, -0.25, 0.18],
  );
  scarfTail.castShadow = true;

  const flipperPivots = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.39, 0.98, 0);
    rig.add(pivot);

    const flipper = addMesh(
      pivot,
      new THREE.CapsuleGeometry(0.075, 0.34, 4, 8),
      materials.body,
      [0, -0.23, 0],
      [1, 1, 0.62],
    );
    flipper.castShadow = true;
    pivot.rotation.z = side * 0.16;
    flipperPivots.push({ pivot, side });
  }

  for (const side of [-1, 1]) {
    addMesh(
      rig,
      new THREE.SphereGeometry(0.16, 12, 8),
      materials.orange,
      [side * 0.16, 0.06, 0.13],
      [1.05, 0.4, 1.65],
      [0, side * 0.18, 0],
    );
  }

  addMesh(
    rig,
    new THREE.ConeGeometry(0.11, 0.3, 6),
    materials.body,
    [0, 0.48, -0.4],
    [1, 1, 1],
    [-Math.PI / 2, 0, 0],
  );

  const state = {
    root,
    rig,
    headGroup,
    eyeGroups,
    flippers: flipperPivots,
    scarf,
    scarfTail,
    materials,
    squash: 1,
    lean: 0,
    spin: 0,
    blinkTimer: rand(1.5, 4),
    blinkTime: 0,
    dizzyTime: 0,
    lastState: "",
  };

  const reset = () => {
    state.squash = 1;
    state.lean = 0;
    state.spin = 0;
    state.blinkTimer = rand(1.5, 4);
    state.blinkTime = 0;
    state.dizzyTime = 0;
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, 0, 0);
    rig.scale.set(1, 1, 1);
    headGroup.rotation.set(0, 0, 0);
    for (const { pivot, side } of flipperPivots) {
      pivot.rotation.set(0, 0, side * 0.16);
    }
    for (const eye of eyeGroups) eye.scale.set(1, 1, 1);
  };

  const update = (dt, time, currentState, params = {}) => {
    const charge = params.charge ?? 0;
    const spin = params.spin ?? 0;

    state.blinkTimer -= dt;
    if (state.blinkTimer <= 0) {
      state.blinkTime = 0.12;
      state.blinkTimer = rand(2.2, 5.2);
    }
    if (state.blinkTime > 0) {
      state.blinkTime -= dt;
      const blink = state.blinkTime > 0 ? 0.12 : 1;
      for (const eye of eyeGroups) eye.scale.y = blink;
    } else {
      for (const eye of eyeGroups) eye.scale.y = damp(eye.scale.y, 1, 20, dt);
    }

    let targetSquash = 1;
    let targetLean = 0;
    let headX = 0;
    let headY = 0;
    let headZ = 0;
    let leftFlipper = 0.16;
    let rightFlipper = -0.16;
    let bob = 0;
    let tremble = 0;

    if (currentState === "idle" || currentState === "title") {
      bob = Math.sin(time * 2.1) * 0.018;
      headY = Math.sin(time * 0.55) * 0.1;
      headZ = Math.sin(time * 1.3) * 0.025;
      leftFlipper = 0.16 + Math.sin(time * 1.7) * 0.05;
      rightFlipper = -0.16 - Math.sin(time * 1.7 + 0.4) * 0.05;
    } else if (currentState === "ledge") {
      targetLean = 0.04;
      headX = 0.3;
      headY = Math.sin(time * 0.8) * 0.08;
      leftFlipper = 0.45;
      rightFlipper = -0.45;
      rig.rotation.z = Math.sin(time * 6.2) * 0.035;
    } else if (currentState === "fall") {
      targetSquash = 1.12;
      targetLean = -0.22;
      headX = -0.22;
      leftFlipper = 1.05;
      rightFlipper = -1.05;
      for (const eye of eyeGroups) eye.scale.set(1.15, 1.15, 1);
    } else if (currentState === "land") {
      targetSquash = 0.72;
      targetLean = 0.06;
      headX = 0.18;
      leftFlipper = 0.65;
      rightFlipper = -0.65;
    } else if (currentState === "charge") {
      targetSquash = 0.93;
      targetLean = 0.1;
      headX = 0.12;
      headY = -0.12;
      leftFlipper = 0.85;
      rightFlipper = -0.85;
      tremble = charge * charge * 0.012;
    } else if (currentState === "fly") {
      targetSquash = 1.06;
      targetLean = 0;
      headX = -0.16;
      leftFlipper = 0.85 + Math.sin(time * 20) * 0.35;
      rightFlipper = -0.85 - Math.sin(time * 20 + 1.4) * 0.35;
      state.spin = spin;
      for (const eye of eyeGroups) eye.scale.set(1.2, 1.2, 1);
    } else if (currentState === "landed") {
      targetSquash = 0.96;
      targetLean = 0;
      headX = 0.15;
      leftFlipper = 0.5;
      rightFlipper = -0.5;
      if (state.dizzyTime > 0) {
        state.dizzyTime -= dt;
        headZ = Math.sin(time * 8) * 0.18 * clamp(state.dizzyTime, 0, 1);
        for (const eye of eyeGroups) eye.rotation.z = Math.sin(time * 10) * 0.5;
      }
    } else if (currentState === "celebrate") {
      targetSquash = 1;
      bob = Math.abs(Math.sin(time * 6.5)) * 0.16;
      headX = -0.15;
      leftFlipper = 2.5;
      rightFlipper = -2.5;
    }

    state.squash = damp(
      state.squash,
      targetSquash,
      currentState === "land" ? 18 : 8,
      dt,
    );
    state.lean = damp(state.lean, targetLean, 8, dt);

    const sx = 1 / Math.sqrt(state.squash);
    const sy = state.squash;
    rig.scale.set(sx, sy, sx);

    if (currentState === "fly") {
      rig.rotation.z = state.spin;
      rig.position.x = Math.sin(state.spin) * 0.82;
      rig.position.y = 0.82 * (1 - Math.cos(state.spin)) + bob;
    } else {
      const dizzy = currentState === "landed" && state.dizzyTime > 0;
      const targetRotation = dizzy
        ? Math.sin(time * 10) * 0.1 * clamp(state.dizzyTime, 0, 1)
        : 0;
      const delta = Math.atan2(
        Math.sin(targetRotation - rig.rotation.z),
        Math.cos(targetRotation - rig.rotation.z),
      );
      rig.rotation.z += delta * (1 - Math.exp(-10 * dt));
      rig.position.y = damp(rig.position.y, bob, 12, dt);
      rig.position.x = damp(rig.position.x, 0, 10, dt);
      if (currentState === "charge") {
        rig.position.x += Math.sin(time * 42) * tremble;
      }
      if (state.spin !== 0) state.spin = 0;
    }

    headGroup.rotation.x = damp(headGroup.rotation.x, headX, 9, dt);
    headGroup.rotation.y = damp(headGroup.rotation.y, headY, 7, dt);
    headGroup.rotation.z = damp(headGroup.rotation.z, headZ, 7, dt);

    const [left, right] = flipperPivots;
    left.pivot.rotation.z = damp(left.pivot.rotation.z, leftFlipper, 12, dt);
    right.pivot.rotation.z = damp(right.pivot.rotation.z, rightFlipper, 12, dt);

    scarf.rotation.z = damp(
      scarf.rotation.z,
      currentState === "fly" ? 0.4 : 0,
      5,
      dt,
    );
    scarfTail.rotation.x = damp(
      scarfTail.rotation.x,
      currentState === "fly" ? -0.6 : 0.15,
      5,
      dt,
    );

    state.lastState = currentState;
  };

  const impact = () => {
    state.squash = 0.5;
  };

  const bounce = () => {
    state.squash = 0.72;
  };

  const landed = () => {
    state.dizzyTime = 1.6;
  };

  const launch = () => {
    state.squash = 1.18;
  };

  reset();

  return {
    root,
    rig,
    parts: state,
    update,
    reset,
    impact,
    bounce,
    landed,
    launch,
    setVisible: (visible) => {
      root.visible = visible;
    },
  };
}
