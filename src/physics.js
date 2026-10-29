import {
  BOUNCE_DAMPING,
  BOUNCE_FRICTION,
  GRAVITY,
  LAUNCH,
  PENGUIN_LAND,
  SETTLE_BOUNCES,
  SETTLE_SPEED,
} from "./constants.js";
import { clamp, lerp } from "./utils.js";

export function getLaunchVelocity(power, perfect = false) {
  const p = clamp(power, 0, 1);
  const bonus = perfect ? 1.04 : 1;
  const speed = lerp(LAUNCH.minSpeed, LAUNCH.maxSpeed, p) * bonus;
  const angle = (lerp(LAUNCH.minAngle, LAUNCH.maxAngle, p) * Math.PI) / 180;

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    angle,
    spinSpeed: -(7 + p * 22) * (perfect ? 1.08 : 1),
  };
}

export function createFlight(onEvent = () => {}) {
  const state = {
    active: false,
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

  const launch = (power, perfect = false) => {
    const velocity = getLaunchVelocity(power, perfect);
    state.active = true;
    state.x = PENGUIN_LAND.x;
    state.y = 0.72;
    state.vx = velocity.vx;
    state.vy = velocity.vy;
    state.spin = 0;
    state.spinSpeed = velocity.spinSpeed;
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
    state.distance = Math.max(0, state.x - PENGUIN_LAND.x);

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
