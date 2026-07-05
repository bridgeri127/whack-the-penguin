// --- Game States ---
export const STATES = {
  INTRO: 0,
  DROPPING: 1,
  LAND_WOBBLE: 2,
  READY: 3,
  SWING: 4,
  FLYING: 5,
  LANDED: 6,
};

// --- Physics ---
export const GRAVITY = 900;           // px/s² (downward in 2D, negated in 3D)
export const BOUNCE_DAMPING = 0.35;    // energy retained per bounce (vertical)
export const HORIZONTAL_DAMPING = 0.6; // energy retained per bounce (horizontal)
export const MAX_POWER = 1400;         // max launch speed component
export const GROUND_BASE = 520;        // 2D canvas y for ground level

// --- Scene Layout (2D → 3D mapping: y_3d = GROUND_BASE - y_2d) ---
export const LEDGE_X = 30;
export const LEDGE_Y = LEDGE_Y_3D;     // computed below
export const PENGUIN_START = { x: LEDGE_X + 25, y: LEDGE_Y_3D + 32 };
export const YETI_X = 170;
export const YETI_Y = 30;              // 520 - 490 = 30 above ground
export const LAND_X = 120;
export const LAND_Y = getTerrainY_3D(LAND_X);

// Ledge height in 3D: 520 - 130 = 390
export const LEDGE_Y_3D = GROUND_BASE - 130; // 390

// --- 3D Coordinate Helpers ---
export function getTerrainY_3D(x) {
  return Math.sin(x * 0.005) * 18 + Math.sin(x * 0.021) * 6;
}

// --- Timing Bar ---
export const TIMING_OSCILLATION_SPEED = 2.8; // radians per second for sin wave

// --- Swing ---
export const SWING_WINDBACK = -1.2;  // radians (arm raised behind)
export const SWING_FORWARD = 1.0;    // radians (arm swung forward)
export const SWING_SPEED_READY = 6;  // lerp rate when idle
export const SWING_SPEED_SWING = 14; // lerp rate during SWING state
export const SWING_DURATION = 0.25;  // seconds to reach impact

// --- Wobble ---
export const WOBBLE_DURATION = 0.8; // seconds

// --- Drop ---
export const DROP_PAUSE = 0.5;      // seconds on ledge before jumping
export const DROP_HOP_VY = -200;    // initial small hop velocity (2D)
export const DROP_STRETCH_RATE = 0.0003;

// --- Camera ---
export const CAMERA_FLY_LERP_X = 6;
export const CAMERA_FLY_LERP_Y = 4;
export const CAMERA_LANDED_LERP = 1.5;

// --- Penguin Flight ---
export const PENGUIN_SPIN_SPEED = 6; // radians per second
export const PENGUIN_SETTLE_BOUNCES = 4;
export const PENGUIN_SETTLE_VY = 80;

// --- Squash/Stretch Recovery ---
export const SQUASH_RECOVERY_FAST = 10;
export const SQUASH_RECOVERY_SLOW = 5;

// --- Canvas ---
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;

// --- Colors ---
export const COLORS = {
  sky: 0x87ceeb,
  skyTop: 0x5b9bd5,
  fog: 0xc8dce8,
  snow: 0xf4f4f4,
  snowDark: 0xd0d8e0,
  penguinBody: 0x1a1a2e,
  penguinBelly: 0xf0f0f0,
  penguinBeak: 0xff8c00,
  penguinEye: 0xffffff,
  penguinPupil: 0x000000,
  penguinPupilHurt: 0xcc0000,
  yetiBody: 0xd0d0d0,
  yetiHead: 0xe0e0e0,
  yetiHair: 0xc8c8c8,
  yetiEye: 0xffffff,
  yetiPupil: 0x222222,
  yetiBrow: 0x888888,
  yetiMouth: 0x333333,
  yetiTongue: 0xff4444,
  yetiFoot: 0x888888,
  clubHandle: 0x8b4513,
  clubHead: 0x6b3410,
  clubDetail: 0x5a2d0c,
  cliffRock: 0x8b7355,
  cliffRockDark: 0x7a6348,
  cliffSnow: 0xffffff,
  cliffLedge: 0x6b5b45,
  cliffLedgeSnow: 0xf0f0f0,
  icicle: 0xc8e8f8,
  mountainBack: 0xc8dce8,
  mountainFront: 0xd8e8f0,
  mountainSnow: 0xffffff,
  gold: 0xffd700,
  orange: 0xe67e22,
  red: 0xe74c3c,
  white: 0xffffff,
  paleBlue: 0xd0e8f0,
};

// --- Particles ---
export const PARTICLE_GRAVITY = 400;
export const PARTICLE_LIFE_DECAY = 1.5;
export const SNOWFLAKE_COUNT = 50;
