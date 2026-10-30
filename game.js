import * as THREE from "three";
import { createScene } from "./src/scene.js";
import { createEnvironment } from "./src/environment.js";
import { createPenguin } from "./src/penguin.js";
import { createYeti } from "./src/yeti.js";
import { createCameraRig } from "./src/camera.js";
import { createParticles } from "./src/particles.js";
import { createAudio } from "./src/audio.js";
import { createUI } from "./src/ui.js";
import { initInput } from "./src/input.js";
import { createFlight, getLaunchVelocity } from "./src/physics.js";
import {
  DROP_GRAVITY,
  PENGUIN_JUMP,
  PENGUIN_LEDGE,
  STATE,
  STORAGE_BEST,
  SWING_DURATION,
  SWING_IMPACT_T,
  YETI_POS,
  getRank,
} from "./src/constants.js";
import { clamp, formatMeters } from "./src/utils.js";

const LOOK_RIGHT = 1.12;
const container = document.getElementById("stage");
const game = createScene(container);
const environment = createEnvironment(game.scene);
const penguin = createPenguin();
const yeti = createYeti();
const particles = createParticles(game.scene);
const audio = createAudio();
const cameraRig = createCameraRig(game.camera);

game.scene.add(penguin.root);
game.scene.add(yeti.root);
yeti.root.position.set(YETI_POS.x, YETI_POS.y, YETI_POS.z);

const flight = createFlight((event) => handleFlightEvent(event));

const state = {
  mode: STATE.TITLE,
  modeTime: 0,
  swingT: 0,
  impactDone: false,
  landT: 0,
  resultT: 0,
  distance: 0,
  best: loadBest(),
  newBest: false,
  dropVx: 0,
  dropVy: 0,
  trailTimer: 0,
  sparkleTimer: 0,
  round: 0,
};

let ui = null;
let firstFrame = true;

function loadBest() {
  try {
    const value = Number(localStorage.getItem(STORAGE_BEST));
    return Number.isFinite(value) ? clamp(value, 0, 9999) : 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(STORAGE_BEST, String(value));
  } catch {
    // Storage is optional.
  }
}

function setMode(mode) {
  state.mode = mode;
  state.modeTime = 0;
}

function resetPenguinToLedge() {
  penguin.reset();
  penguin.root.visible = true;
  penguin.root.position.set(PENGUIN_LEDGE.x, PENGUIN_LEDGE.y, PENGUIN_LEDGE.z);
  penguin.root.rotation.set(0, 0, 0);
}

function beginRound() {
  audio.unlock();
  audio.play("ui");
  ui.hideTitle();
  ui.hideResult();
  ui.showLive(false);
  ui.setHint("", false);

  state.round += 1;
  state.swingT = 0;
  state.impactDone = false;
  state.landT = 0;
  state.resultT = 0;
  state.distance = 0;
  state.newBest = false;
  state.trailTimer = 0;
  state.sparkleTimer = 0;
  state.dropVx = 0;
  state.dropVy = 0;

  flight.reset();
  resetPenguinToLedge();
  yeti.reset();
  yeti.root.position.set(YETI_POS.x, YETI_POS.y, YETI_POS.z);
  cameraRig.setMode("title");
  setMode(STATE.DROP_READY);
}

function startSwing() {
  if (state.mode !== STATE.DROP_READY) return;
  setMode(STATE.SWINGING);
  state.swingT = 0;
  state.impactDone = false;
  // The yeti swings while the penguin is moving; the club strike launches it away.
  penguin.root.position.set(PENGUIN_JUMP.x, PENGUIN_JUMP.y, 0);
  penguin.root.rotation.set(0, 0, 0);
  state.dropVx = 0;
  state.dropVy = -1.2;
  audio.play("swing", { power: 1 });
  ui.setHint("Tap to swing the yeti");
  cameraRig.setMode("swing");
}

function doImpact() {
  if (state.impactDone) return;
  state.impactDone = true;

  const clubTip = yeti.getClubTip();
  particles.impact(clubTip, 0.85);
  cameraRig.kick(0.6);
  audio.play("hit", { power: 0.8 });

  const strikeAngle = (yeti.getStrikeAngle() * 180) / Math.PI;
  penguin.impact();

  flight.launch(strikeAngle, penguin.root.position.x, penguin.root.position.y);

  state.distance = 0;
  state.trailTimer = 0;
  setMode(STATE.FLYING);
  cameraRig.setMode("flight");
  ui.updateLive(0, penguin.root.position.y, "AIRBORNE");
  ui.showLive(true);
}

function handleFlightEvent(event) {
  if (event.type === "bounce") {
    const position = new THREE.Vector3(event.x, 0.18, 0);
    particles.puff(position, 10 + event.bounces * 4, 0.8);
    particles.ring(position, 0xffffff, 0.35);
    penguin.bounce();
    audio.play("bounce");
    cameraRig.kick(0.1 + event.bounces * 0.04);
  } else if (event.type === "land") {
    state.distance = event.distance;
    penguin.root.position.x = event.x;
    penguin.root.position.y = 0;
    penguin.landed();
    particles.puff(new THREE.Vector3(event.x, 0.1, 0), 28, 1.15);
    particles.ring(new THREE.Vector3(event.x, 0.22, 0), 0xa8ecff, 0.7);
    audio.play("land");
    cameraRig.setMode("landed");
    cameraRig.kick(0.24);
    ui.updateLive(event.distance, 0, "LANDED");
    ui.setHint("", false);
    state.landT = 0;
    setMode(STATE.LANDED);
  }
}

function finishRound() {
  if (state.mode === STATE.RESULT) return;
  const distance = state.distance;
  const isNewBest = distance > state.best + 0.05;
  const rank = getRank(distance);

  if (isNewBest) {
    state.best = distance;
    state.newBest = true;
    saveBest(distance);
    environment.setBest(distance);
    environment.celebrate();
    audio.play("best");
    particles.celebrate(new THREE.Vector3(penguin.root.position.x, 0.4, 0));
    ui.flash();
  } else if (distance >= 60) {
    audio.play("celebrate");
  }

  ui.setBest(state.best);
  ui.showLive(false);
  ui.showResult({
    distance,
    bestDistance: state.best,
    isNewBest,
    rank,
  });
  ui.setHint("", false);
  cameraRig.setMode("result");
  setMode(STATE.RESULT);
  state.resultT = 0;
  state.sparkleTimer = 0;
}

function toggleSound() {
  audio.unlock();
  const muted = audio.toggleMuted();
  ui.setSoundMuted(muted);
  if (!muted) audio.play("ui");
}

async function shareResult() {
  const distance = formatMeters(state.distance);
  const text = `I smacked the pingu ${distance} in Smack the Pingu! 🐧💥 Can you beat it?`;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(
        `${text} ${window.location.href.split("#")[0]}`,
      );
    } else {
      const area = document.createElement("textarea");
      area.value = `${text} ${window.location.href.split("#")[0]}`;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    audio.play("copy");
    ui.toast("Result copied — go brag.");
  } catch {
    ui.toast("Could not copy. Screenshot it instead.");
  }
}

function handlePrimary() {
  audio.unlock();
  if (state.mode === STATE.TITLE) {
    beginRound();
  } else if (state.mode === STATE.DROP_READY) {
    startSwing();
  } else if (state.mode === STATE.RESULT) {
    beginRound();
  } else if (state.mode === STATE.LANDED && state.landT > 0.65) {
    beginRound();
  }
}

function updateSwing(dt) {
  state.swingT = Math.min(1, state.swingT + dt / SWING_DURATION);
  const swingState = state.swingT < 1 ? "swing" : "follow";
  yeti.update(dt, clockTime, swingState, {
    swingT: state.swingT,
    lookAngle: LOOK_RIGHT,
  });
  if (!state.impactDone && state.swingT >= SWING_IMPACT_T) {
    doImpact();
  }
}

function updateGame(dt) {
  state.modeTime += dt;

  if (state.mode === STATE.TITLE) {
    penguin.root.position.set(
      PENGUIN_LEDGE.x,
      PENGUIN_LEDGE.y,
      PENGUIN_LEDGE.z,
    );
    penguin.update(dt, clockTime, "ledge", {});
    yeti.update(dt, clockTime, "title", { lookAngle: 0.15 });
    cameraRig.setMode("title");
    return;
  }

  if (state.mode === STATE.DROP_READY) {
    penguin.root.position.set(
      PENGUIN_LEDGE.x,
      PENGUIN_LEDGE.y,
      PENGUIN_LEDGE.z,
    );
    penguin.update(dt, clockTime, "ledge", {});
    yeti.update(dt, clockTime, "idle", { lookAngle: 0.4 });
    cameraRig.setMode("ready");
    return;
  }

  if (state.mode === STATE.SWINGING) {
    updateSwing(dt);
    if (state.mode === STATE.FLYING) return;
    if (!state.impactDone) {
      // Timing-based jump: penguin drops straight down just in front of the yeti.
      state.dropVy -= DROP_GRAVITY * dt;
      penguin.root.position.y += state.dropVy * dt;
      penguin.root.position.x = PENGUIN_JUMP.x;
      penguin.root.position.z = 0;
      penguin.update(dt, clockTime, "fall", {});
      if (penguin.root.position.y <= 0) {
        // Too late: the penguin reached the floor before the swing connected.
        penguin.landed();
        particles.puff(
          new THREE.Vector3(penguin.root.position.x, 0.08, 0),
          22,
          1,
        );
        audio.play("land");
        cameraRig.kick(0.18);
        cameraRig.setMode("landed");
        state.landT = 0;
        setMode(STATE.LANDED);
        return;
      }
    }
    cameraRig.setMode("swing");
    return;
  }

  if (state.mode === STATE.FLYING) {
    state.swingT = Math.min(1, state.swingT + dt / SWING_DURATION);
    if (state.swingT < 1) {
      yeti.update(dt, clockTime, "swing", {
        swingT: state.swingT,
        lookAngle: LOOK_RIGHT,
      });
    } else {
      yeti.update(dt, clockTime, "follow", { lookAngle: LOOK_RIGHT });
    }

    flight.update(dt);
    if (state.mode !== STATE.FLYING) return;

    const body = flight.state;
    penguin.root.position.set(body.x, body.y, 0);
    penguin.update(dt, clockTime, "fly", { spin: body.spin });
    cameraRig.setMode("flight");
    ui.updateLive(body.distance, body.y, "AIRBORNE");

    state.trailTimer += dt;
    if (body.y > 0.7 && state.trailTimer > 0.055) {
      state.trailTimer = 0;
      particles.trail(new THREE.Vector3(body.x, body.y + 0.45, 0), {
        x: body.vx,
        y: body.vy,
      });
    }
    return;
  }

  if (state.mode === STATE.LANDED) {
    state.landT += dt;
    penguin.update(dt, clockTime, "landed", {});
    yeti.update(dt, clockTime, state.distance >= 60 ? "celebrate" : "slump", {
      lookAngle: LOOK_RIGHT,
    });
    cameraRig.setMode("landed");
    if (state.landT > 1.05) finishRound();
    return;
  }

  if (state.mode === STATE.RESULT) {
    state.resultT += dt;
    state.sparkleTimer += dt;
    const happy = state.newBest || state.distance >= 100;
    penguin.update(dt, clockTime, happy ? "celebrate" : "landed", {});
    yeti.update(dt, clockTime, state.distance >= 60 ? "celebrate" : "slump", {
      lookAngle: LOOK_RIGHT,
    });
    cameraRig.setMode("result");

    if (state.newBest && state.sparkleTimer > 0.85) {
      state.sparkleTimer = 0;
      particles.celebrate(
        new THREE.Vector3(
          penguin.root.position.x + (Math.random() - 0.5) * 3,
          0.4,
          0,
        ),
      );
    }
  }
}

const clock = new THREE.Clock();
let clockTime = 0;
let lastRendered = false;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  clockTime = clock.elapsedTime;

  updateGame(dt);
  const focusX =
    state.mode === STATE.FLYING ||
    state.mode === STATE.LANDED ||
    state.mode === STATE.RESULT
      ? penguin.root.position.x
      : -1.8;
  cameraRig.update(dt, clockTime, {
    penguin: penguin.root.position,
    charge: 0,
  });
  game.update(dt, clockTime, focusX);
  environment.update(dt, clockTime, game.camera, penguin.root.position.x);
  particles.update(dt);
  game.renderer.render(game.scene, game.camera);

  if (!lastRendered) {
    lastRendered = true;
    ui.ready();
  }
}

ui = createUI({
  onStart: handlePrimary,
  onAgain: beginRound,
  onShare: shareResult,
  onSound: toggleSound,
});

initInput({
  onPrimary: handlePrimary,
  onSoundToggle: toggleSound,
});

penguin.root.position.set(PENGUIN_LEDGE.x, PENGUIN_LEDGE.y, PENGUIN_LEDGE.z);
yeti.root.position.set(YETI_POS.x, YETI_POS.y, YETI_POS.z);
environment.setBest(state.best);
ui.setBest(state.best);
ui.setSoundMuted(audio.isMuted());
ui.showTitle();
ui.setHint("Tap to swing the yeti");
cameraRig.setMode("title");

window.__PINGU__ = {
  getState: () => state.mode,
  getDistance: () =>
    state.mode === STATE.FLYING ? flight.state.distance : state.distance,
  getBest: () => state.best,
  start: () => handlePrimary(),
  reset: () => beginRound(),
  getPosition: () => ({
    x: penguin.root.position.x,
    y: penguin.root.position.y,
  }),
};

animate();
