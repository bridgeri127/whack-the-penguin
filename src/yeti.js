import * as THREE from "three";
import { clamp, damp, easeInCubic, easeOutCubic, lerp, rand } from "./utils.js";

function makeMaterials() {
  return {
    fur: new THREE.MeshStandardMaterial({
      color: 0xe9f5ff,
      roughness: 0.92,
      metalness: 0.0,
    }),
    furShade: new THREE.MeshStandardMaterial({
      color: 0xc9e2f2,
      roughness: 0.95,
    }),
    belly: new THREE.MeshStandardMaterial({ color: 0xf7fcff, roughness: 0.9 }),
    face: new THREE.MeshStandardMaterial({ color: 0x94d6e8, roughness: 0.72 }),
    faceDark: new THREE.MeshStandardMaterial({
      color: 0x315a6b,
      roughness: 0.6,
    }),
    eye: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }),
    pupil: new THREE.MeshStandardMaterial({ color: 0x070c12, roughness: 0.2 }),
    horn: new THREE.MeshStandardMaterial({ color: 0xd8c6a4, roughness: 0.7 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.78 }),
    woodDark: new THREE.MeshStandardMaterial({
      color: 0x5e3a24,
      roughness: 0.85,
    }),
    ice: new THREE.MeshStandardMaterial({
      color: 0xaee8ff,
      roughness: 0.2,
      metalness: 0.1,
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

export function createYeti() {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);

  const materials = makeMaterials();

  const body = addMesh(
    rig,
    new THREE.SphereGeometry(1.05, 22, 18),
    materials.fur,
    [0, 1.95, 0],
    [0.96, 1.2, 0.82],
  );
  body.receiveShadow = true;

  const belly = addMesh(
    rig,
    new THREE.SphereGeometry(0.78, 18, 14),
    materials.belly,
    [0, 1.92, 0.46],
    [0.8, 1.0, 0.46],
  );
  belly.castShadow = false;

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 3.25, 0.05);
  rig.add(headGroup);

  const head = addMesh(
    headGroup,
    new THREE.SphereGeometry(0.82, 22, 18),
    materials.fur,
    [0, 0, 0],
    [1, 0.95, 0.9],
  );
  head.receiveShadow = true;

  const muzzle = addMesh(
    headGroup,
    new THREE.SphereGeometry(0.55, 18, 14),
    materials.face,
    [0, -0.12, 0.52],
    [1.0, 0.7, 0.46],
  );
  muzzle.castShadow = false;

  const mouth = addMesh(
    headGroup,
    new THREE.SphereGeometry(0.28, 14, 10),
    materials.faceDark,
    [0, -0.2, 0.78],
    [0.92, 0.34, 0.18],
  );
  mouth.castShadow = false;

  for (const side of [-1, 1]) {
    addMesh(headGroup, new THREE.BoxGeometry(0.11, 0.13, 0.06), materials.eye, [
      side * 0.12,
      -0.17,
      0.82,
    ]);
    addMesh(
      headGroup,
      new THREE.SphereGeometry(0.035, 8, 6),
      materials.faceDark,
      [side * 0.1, 0.02, 0.79],
    );
  }

  const eyeGroups = [];
  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.27, 0.12, 0.66);
    headGroup.add(eyeGroup);

    addMesh(
      eyeGroup,
      new THREE.SphereGeometry(0.135, 14, 12),
      materials.eye,
      [0, 0, 0],
      [1, 1, 0.55],
    );
    addMesh(
      eyeGroup,
      new THREE.SphereGeometry(0.07, 12, 10),
      materials.pupil,
      [0, 0, 0.07],
      [1, 1, 0.6],
    );
    addMesh(eyeGroup, new THREE.SphereGeometry(0.022, 8, 6), materials.eye, [
      side * -0.018,
      0.03,
      0.13,
    ]);
    eyeGroups.push(eyeGroup);
  }

  const brows = [];
  for (const side of [-1, 1]) {
    const brow = addMesh(
      headGroup,
      new THREE.SphereGeometry(0.14, 10, 8),
      materials.furShade,
      [side * 0.27, 0.32, 0.68],
      [1.4, 0.28, 0.3],
      [0, 0, side * -0.16],
    );
    brows.push(brow);
  }

  for (const side of [-1, 1]) {
    addMesh(
      headGroup,
      new THREE.ConeGeometry(0.11, 0.36, 7),
      materials.horn,
      [side * 0.56, 0.68, -0.02],
      [1, 1, 1],
      [0.12, 0, side * -0.28],
    );
  }

  const tuftPositions = [
    [-0.4, 0.78, -0.05, 0.24],
    [0.12, 0.9, -0.02, 0.3],
    [0.48, 0.72, -0.1, 0.22],
    [-0.12, 0.82, 0.18, 0.18],
  ];
  for (const [x, y, z, height] of tuftPositions) {
    addMesh(
      headGroup,
      new THREE.ConeGeometry(0.13, height, 6),
      materials.fur,
      [x, y, z],
      [1, 1, 1],
      [rand(-0.2, 0.2), rand(-0.3, 0.3), rand(-0.2, 0.2)],
    );
  }

  const shoulderR = new THREE.Group();
  shoulderR.position.set(0.85, 3.1, 0.45);
  rig.add(shoulderR);

  addMesh(
    shoulderR,
    new THREE.CapsuleGeometry(0.24, 1.1, 5, 10),
    materials.fur,
    [0, -0.7, 0],
  );
  addMesh(
    shoulderR,
    new THREE.SphereGeometry(0.29, 12, 10),
    materials.fur,
    [0, -1.3, 0],
  );

  const club = new THREE.Group();
  club.position.set(0, -1.3, 0);
  shoulderR.add(club);

  addMesh(
    club,
    new THREE.CylinderGeometry(0.075, 0.09, 1.0, 8),
    materials.woodDark,
    [0, -0.5, 0],
  );
  addMesh(
    club,
    new THREE.CylinderGeometry(0.11, 0.11, 0.1, 8),
    materials.ice,
    [0, -0.98, 0],
  );
  addMesh(
    club,
    new THREE.CapsuleGeometry(0.26, 0.45, 5, 12),
    materials.wood,
    [0, -1.45, 0],
    [1, 1, 0.9],
  );
  addMesh(
    club,
    new THREE.SphereGeometry(0.26, 12, 10),
    materials.woodDark,
    [0, -1.98, 0],
    [1, 0.55, 0.9],
  );
  addMesh(
    club,
    new THREE.TorusGeometry(0.27, 0.035, 6, 14),
    materials.ice,
    [0, -1.72, 0],
    [1, 1, 1],
    [Math.PI / 2, 0, 0],
  );

  const clubTip = new THREE.Object3D();
  clubTip.position.set(0, -2.02, 0);
  club.add(clubTip);

  const shoulderL = new THREE.Group();
  shoulderL.position.set(-0.95, 3.05, -0.12);
  rig.add(shoulderL);
  addMesh(
    shoulderL,
    new THREE.CapsuleGeometry(0.22, 1.05, 5, 10),
    materials.fur,
    [0, -0.68, 0],
  );
  addMesh(
    shoulderL,
    new THREE.SphereGeometry(0.27, 12, 10),
    materials.fur,
    [0, -1.25, 0],
  );

  for (const side of [-1, 1]) {
    addMesh(
      rig,
      new THREE.CapsuleGeometry(0.3, 0.35, 5, 10),
      materials.furShade,
      [side * 0.45, 0.55, 0.08],
    );
    addMesh(
      rig,
      new THREE.SphereGeometry(0.3, 12, 10),
      materials.fur,
      [side * 0.45, 0.13, 0.24],
      [1.1, 0.42, 1.45],
    );
  }

  const furTufts = [];
  const tuftMaterial = materials.furShade;
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 0.92 + rand(-0.08, 0.1);
    const tuft = addMesh(
      rig,
      new THREE.ConeGeometry(rand(0.1, 0.18), rand(0.28, 0.5), 5),
      tuftMaterial,
      [
        Math.cos(angle) * radius,
        2.0 + rand(-0.55, 0.55),
        Math.sin(angle) * radius * 0.72,
      ],
      [1, 1, 1],
      [rand(-0.4, 0.4), angle, rand(-0.4, 0.4)],
    );
    tuft.castShadow = true;
    furTufts.push(tuft);
  }

  const state = {
    root,
    rig,
    headGroup,
    shoulderR,
    shoulderL,
    club,
    clubTip,
    eyeGroups,
    brows,
    mouth,
    muzzle,
    materials,
    restAngle: -1.86,
    windupAngle: -2.32,
    impactAngle: 0.58,
    followAngle: 1.26,
    blinkTimer: rand(1.8, 4.4),
    blinkTime: 0,
    impactTimer: 0,
    lean: 0,
    bob: 0,
    lastState: "",
  };

  const reset = () => {
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, 0, 0);
    headGroup.rotation.set(0, 0, 0);
    shoulderR.rotation.set(0, 0, state.restAngle);
    shoulderL.rotation.set(0, 0, 0.08);
    for (const eye of eyeGroups) eye.scale.set(1, 1, 1);
    for (const brow of brows)
      brow.rotation.z = Math.sign(brow.position.x) * -0.16;
    mouth.scale.set(0.92, 0.34, 0.18);
    state.blinkTimer = rand(1.8, 4.4);
    state.blinkTime = 0;
    state.impactTimer = 0;
    state.lean = 0;
    state.bob = 0;
  };

  const swingAngle = (t) => {
    const clamped = clamp(t, 0, 1);
    if (clamped < 0.5) {
      return lerp(
        state.windupAngle,
        state.impactAngle,
        easeInCubic(clamped * 2),
      );
    }
    return lerp(
      state.impactAngle,
      state.followAngle,
      easeOutCubic((clamped - 0.5) * 2),
    );
  };

  const update = (dt, time, currentState, params = {}) => {
    const charge = params.charge ?? 0;
    const swingT = params.swingT ?? 0;
    const lookAngle = params.lookAngle ?? Math.PI / 2;

    state.blinkTimer -= dt;
    if (state.blinkTimer <= 0) {
      state.blinkTime = 0.12;
      state.blinkTimer = rand(2.4, 5.4);
    }
    if (state.blinkTime > 0) {
      state.blinkTime -= dt;
      const blink = state.blinkTime > 0 ? 0.12 : 1;
      for (const eye of eyeGroups) eye.scale.y = blink;
    } else {
      for (const eye of eyeGroups) eye.scale.y = damp(eye.scale.y, 1, 18, dt);
    }

    let targetBob = Math.sin(time * 1.5) * 0.022;
    let targetLean = 0;
    let armAngle = state.restAngle;
    let leftArmAngle = 0.08;
    let headX = 0.02;
    let headY = 0.24;
    let headZ = 0;
    let browAngle = -0.16;
    let mouthScale = [0.92, 0.34, 0.18];

    if (currentState === "idle" || currentState === "title") {
      armAngle = state.restAngle + Math.sin(time * 0.8) * 0.015;
      leftArmAngle = 0.08 + Math.sin(time * 1.1) * 0.03;
      headY = 0.28 + Math.sin(time * 0.45) * 0.08;
      headZ = Math.sin(time * 0.8) * 0.02;
    } else if (currentState === "windup") {
      armAngle = lerp(state.restAngle, state.windupAngle, easeOutCubic(charge));
      leftArmAngle = 0.08 + charge * 0.35;
      targetLean = -0.02 - charge * 0.07;
      headX = 0.08;
      headY = 0.34;
      browAngle = -0.3;
      mouthScale = [0.92, 0.3, 0.18];
      targetBob = Math.sin(time * 30) * charge * 0.008;
    } else if (currentState === "swing") {
      armAngle = swingAngle(swingT);
      leftArmAngle = lerp(0.35, -0.45, clamp(swingT * 1.4, 0, 1));
      targetLean = lerp(-0.08, 0.1, clamp(swingT * 1.5, 0, 1));
      headX = 0.12;
      headY = 0.4;
      browAngle = -0.35;
      mouthScale =
        swingT > 0.42 && swingT < 0.7 ? [1.1, 0.55, 0.24] : [0.92, 0.3, 0.18];
    } else if (currentState === "follow") {
      armAngle = damp(state.shoulderR.rotation.z, state.followAngle, 6, dt);
      leftArmAngle = -0.3;
      targetLean = 0.08;
      headX = 0.15;
      headY = 0.38;
      mouthScale = [1.0, 0.42, 0.2];
    } else if (currentState === "celebrate") {
      armAngle = -2.7 + Math.sin(time * 5) * 0.08;
      leftArmAngle = 2.5 + Math.sin(time * 5 + 0.6) * 0.08;
      targetBob = Math.abs(Math.sin(time * 5.5)) * 0.12;
      targetLean = -0.04;
      headX = -0.12;
      headY = 0;
      browAngle = 0.05;
      mouthScale = [1.0, 0.5, 0.22];
    } else if (currentState === "slump") {
      armAngle = state.restAngle + 0.35;
      leftArmAngle = 0.3;
      targetLean = 0.06;
      headX = 0.35;
      headY = 0.1;
      browAngle = 0.2;
      mouthScale = [0.8, 0.22, 0.18];
    }

    state.bob = damp(state.bob, targetBob, 6, dt);
    state.lean = damp(state.lean, targetLean, 7, dt);
    rig.position.y = state.bob;
    rig.rotation.z = state.lean;

    shoulderR.rotation.z = damp(
      shoulderR.rotation.z,
      armAngle,
      currentState === "swing" ? 30 : 10,
      dt,
    );
    shoulderL.rotation.z = damp(shoulderL.rotation.z, leftArmAngle, 10, dt);

    headGroup.rotation.x = damp(headGroup.rotation.x, headX, 8, dt);
    headGroup.rotation.y = damp(headGroup.rotation.y, lookAngle + headY, 6, dt);
    headGroup.rotation.z = damp(headGroup.rotation.z, headZ, 6, dt);

    for (const brow of brows) {
      const side = Math.sign(brow.position.x) || 1;
      brow.rotation.z = damp(brow.rotation.z, side * browAngle, 9, dt);
    }
    mouth.scale.x = damp(mouth.scale.x, mouthScale[0], 10, dt);
    mouth.scale.y = damp(mouth.scale.y, mouthScale[1], 10, dt);
    mouth.scale.z = damp(mouth.scale.z, mouthScale[2], 10, dt);

    if (state.impactTimer > 0) {
      state.impactTimer -= dt;
      const impact = clamp(state.impactTimer / 0.35, 0, 1);
      for (const eye of eyeGroups)
        eye.scale.set(1 + impact * 0.25, 1 + impact * 0.25, 1);
    } else {
      for (const eye of eyeGroups) eye.scale.x = damp(eye.scale.x, 1, 12, dt);
      for (const eye of eyeGroups) eye.scale.z = damp(eye.scale.z, 1, 12, dt);
    }

    state.lastState = currentState;
  };

  const impact = () => {
    state.impactTimer = 0.35;
  };

  const celebrate = () => {
    state.impactTimer = 0;
  };

  reset();

  return {
    root,
    rig,
    parts: state,
    update,
    reset,
    impact,
    celebrate,
    getClubTip: () => {
      clubTip.updateWorldMatrix(true, false);
      return clubTip.getWorldPosition(new THREE.Vector3());
    },
  };
}
