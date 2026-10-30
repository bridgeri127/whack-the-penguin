# Smack the Pingu — Design & Tech Notes

A stylized 3D recreation of the classic distance-launch game. The player starts with the penguin on the ledge, taps to make it drop while the yeti swings, and launches the penguin at the angle of the strike.

## Goals

- Keep the original one-more-try loop: tap → swing → watch it fly → beat the best.
- Make the launch timing-based: the penguin jumps straight down just in front of the yeti, and distance is derived from the angle of the strike.

## Game flow

| State        | What happens                                                               |
| ------------ | -------------------------------------------------------------------------- |
| `title`      | Penguin waits on the ledge; title card is shown.                           |
| `drop_ready` | Penguin waits on the ledge above the yeti; first tap starts the swing.     |
| `swinging`   | Penguin jumps down just in front of the yeti; club strikes moving penguin. |
| `flying`     | Penguin launches at the strike angle, spins, bounces, and camera follows.  |
| `landed`     | Short settle; result card is prepared.                                     |
| `result`     | Distance, rank, best, share, and replay.                                   |

## Mechanics

- **Launch** is derived from the angle of the club strike at impact (`getLaunchVelocity(angleDeg)`).
- **Flight** integrates gravity, applies up to two energy-losing bounces, and tracks distance from the launch point.

## Visual system

- Stylized low-poly arctic scene: ice cliff, snow field, pine trees, layered mountains, aurora, stars, moon, and snowfall.
- Procedural characters: penguin with squash/stretch, blink, scarf, and flipper animation; yeti with fur tufts, expressions, club wind-up, swing, follow-through, and celebration.
- Camera modes for title, ready, swing, flight, landing, and result, with portrait-specific framing.
- Particles: snow puffs, impact sparks, shockwave rings, launch trails, and celebration confetti.
- UI: glass cards, gradient display type, live distance HUD, sound toggle, share/copy result.

## File map

```
index.html          page shell and UI
style.css           responsive glass UI and animations
game.js             state machine, loop, input, scoring
src/constants.js    tuning constants, ranks, storage keys
src/utils.js        math, easing, formatting helpers
src/scene.js        renderer, lights, sky, stars, moon
src/environment.js  terrain, cliff, trees, mountains, aurora, snowfall, markers, spectators
src/penguin.js      penguin model + animation
src/yeti.js         yeti/club model + swing animation
src/physics.js      launch velocity and flight integration
src/camera.js       mode-based camera rig with portrait framing
src/particles.js    pooled GPU particles, rings, flashes
src/audio.js        procedural Web Audio effects
src/ui.js           DOM UI state and animations
src/input.js        pointer/keyboard handling
vendor/             local Three.js r170 module
```

## Tuning notes

Most feel changes live in `src/constants.js`:

- `LAUNCH.baseSpeed`, `LAUNCH.minAngle`, `LAUNCH.maxAngle` — strike-angle launch tuning
- `SWING_DURATION`, `SWING_IMPACT_T` — swing timing
- `BOUNCE_DAMPING`, `BOUNCE_FRICTION`, `SETTLE_BOUNCES` — bounce feel
- `RANKS` — result titles and thresholds
