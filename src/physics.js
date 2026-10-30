import {
  BOUNCE_DAMPING,
  BOUNCE_FRICTION,
  GRAVITY,
  LAUNCH,
  PENGUIN_LAND,
  SETTLE_BOUNCES,
  SETTLE_SPEED,
} from "./constants.js";
import { clamp } from "./utils.js";

export function getLaunchVelocity(angleDeg, speed = LAUNCH.baseSpeed) {
  const angle =
    (clamp(angleDeg, LAUNCH.minAngle, LAUNCH.maxAngle) * Math.PI) / 180;
  const magnitude = speed;
  const rad = angle;
  return {
    vx: Math.cos(rad) * magnitude,
    vy: Math.sin(rad) * magnitude,
    speed: magnitude,
    angle: (rad * 180) / Math.PI,
  };
}

export function createFlight(onEvent = () => {}) {
  const state = {
    active: false,
    originX: PENGUIN_LAND.x,
    x: PENGUIN_LAND.x,
    y: 0.7,
    vx: 0,
    vy: 0,
    spin: 0,
    spinSpeed: 0,
    bounces: 0,
    airTime: 0,
    peakY: 0.7,
    distance: 0,
  };

  const reset = () => {
    state.active = false;
    state.originX = PENGUIN_LAND.x;
    state.x = PENGUIN_LAND.x;
    state.y = 0.7;
    state.vx = 0;
    state.vy = 0;
    state.spin = 0;
    state.spinSpeed = 0;
    state.bounces = 0;
    state.airTime = 0;
    state.peakY = 0.7;
    state.distance = 0;
  };

  const launch = (angleDeg, startX = PENGUIN_LAND.x, startY = 0.72) => {
    const velocity = getLaunchVelocity(angleDeg);
    state.active = true;
    state.originX = startX;
    state.x = startX;
    state.y = startY;
    state.vx = velocity.vx;
    state.vy = velocity.vy;
    state.spin = 0;
    state.spinSpeed = -(7 + velocity.speed * 0.35) * 1.6;
    state.bounces = 0;
    state.airTime = 0;
    state.peakY = state.y;
    state.distance = 0;
    return velocity;
  };

  const update = (dt) => {
    if (!state.active) return state;

    state.vy -= GRAVITY * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    state.spin += state.spinSpeed * dt;
    state.airTime += dt;
    state.peakY = Math.max(state.peakY, state.y);
    state.distance = Math.max(0, state.x - state.originX);

    if (state.y <= 0) {
      state.y = 0;
      const impactSpeed = -state.vy;

      if (state.bounces < SETTLE_BOUNCES && impactSpeed > SETTLE_SPEED) {
        state.bounces += 1;
        state.vy = impactSpeed * BOUNCE_DAMPING;
        state.vx *= BOUNCE_FRICTION;
        state.spinSpeed *= 0.72;
        onEvent({
          type: "bounce",
          x: state.x,
          y: state.y,
          impactSpeed,
          bounces: state.bounces,
        });
      } else {
        state.active = false;
        state.vy = 0;
        state.vx = 0;
        state.spinSpeed = 0;
        onEvent({
          type: "land",
          x: state.x,
          y: state.y,
          distance: state.distance,
          airTime: state.airTime,
          bounces: state.bounces,
        });
      }
    }

    return state;
  };

  reset();

  return {
    state,
    launch,
    update,
    reset,
    getDistance: () => state.distance,
  };
}
