export const COLORS = {
  ice: 0x8fe8ff,
  iceDeep: 0x2f7ea8,
  mint: 0x7dffc4,
  gold: 0xffd166,
  coral: 0xff6b6b,
  snow: 0xeaf6ff,
  deep: 0x06111c,
  navy: 0x0b1e30,
  wood: 0x8a5a3b,
  woodDark: 0x5e3a24,
};

export const STATE = {
  TITLE: "title",
  DROP_READY: "drop_ready",
  DROPPING: "dropping",
  READY: "ready",
  CHARGING: "charging",
  SWINGING: "swinging",
  FLYING: "flying",
  LANDED: "landed",
  RESULT: "result",
};

export const PENGUIN_LEDGE = { x: -10.5, y: 6.43, z: 0 };
export const PENGUIN_LAND = { x: -0.9, y: 0, z: 0 };
export const YETI_POS = { x: -3.6, y: 0.4, z: 0 };
export const HIT_X = PENGUIN_LAND.x;

export const GRAVITY = 20;
export const LAUNCH = {
  minSpeed: 18,
  maxSpeed: 64,
  minAngle: 40,
  maxAngle: 48,
};

export const PERFECT_MIN = 0.85;
export const CHARGE_UP_TIME = 0.9;
export const CHARGE_DOWN_TIME = 0.62;
export const SWING_DURATION = 0.34;
export const SWING_IMPACT_T = 0.5;

export const DROP_VX = 10.5;
export const DROP_VY = 2.2;
export const DROP_GRAVITY = 20;

export const BOUNCE_DAMPING = 0.34;
export const BOUNCE_FRICTION = 0.64;
export const SETTLE_BOUNCES = 2;
export const SETTLE_SPEED = 2.1;

export const MAX_DISTANCE = 400;
export const MARKER_STEP = 25;

export const STORAGE_BEST = "pinguSmashBest";
export const STORAGE_MUTE = "pinguSmashMuted";

export const RANKS = [
  {
    min: 0,
    title: "SNOW ANGEL",
    message: "The penguin has questions. So do we.",
  },
  {
    min: 25,
    title: "NICE WHACK",
    message: "A respectable launch. The yeti nods approvingly.",
  },
  {
    min: 60,
    title: "GREAT SHOT",
    message: "That penguin is officially airborne.",
  },
  {
    min: 100,
    title: "PENGUIN MISSILE",
    message: "Somewhere, a flight controller just fainted.",
  },
  {
    min: 150,
    title: "ARCTIC LEGEND",
    message: "The snow will tell stories about this one.",
  },
  {
    min: 200,
    title: "PINGU SUPREMACY",
    message: "Physics has left the chat.",
  },
];

export function getRank(distance) {
  let rank = RANKS[0];
  for (const item of RANKS) {
    if (distance >= item.min) rank = item;
  }
  return rank;
}
