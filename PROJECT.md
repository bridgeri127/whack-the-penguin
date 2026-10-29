# Smack the Pingu — Design & Tech Notes

A stylized 3D recreation of the classic distance-launch game. The player drops a penguin from a cliff, charges a yeti's club swing, and times the release to launch the penguin as far as possible.

## Goals

- Keep the original one-more-try loop: drop → charge → release → watch it fly → beat the best.
- Make the timing readable and satisfying with a hold-to-charge meter that oscillates through a gold perfect zone.
- Replace the old flat presentation with a low-poly arctic diorama, cinematic follow camera, particles, and procedural audio.
- Run as static files with no build step and no runtime CDN dependency for Three.js.

## Game flow

| State        | What happens                                                          |
| ------------ | --------------------------------------------------------------------- |
| `title`      | Penguin waits on the ledge; title card is shown.                      |
| `drop_ready` | Short beat before the penguin hops off.                               |
| `dropping`   | Projectile drop from the ledge to the landing spot.                   |
| `ready`      | Penguin lands; charge meter appears.                                  |
| `charging`   | Meter rises to 100% then falls; yeti winds up; release to lock power. |
| `swinging`   | Club sweeps through the impact frame.                                 |
| `flying`     | Penguin launches, spins, bounces, and the camera follows.             |
| `landed`     | Short settle; result card is prepared.                                |
| `result`     | Distance, rank, best, share, and replay.                              |

## Mechanics

- **Power** is sampled from a triangle wave: 0 → 1 over `CHARGE_UP_TIME`, then back down over `CHARGE_DOWN_TIME`.
- **Perfect zone** starts at `PERFECT_MIN` (85% of the meter). A perfect hit gets a small speed bonus and a badge.
- **Launch velocity** is derived from power:
  - speed: `18 → 64` units/s
  - angle: `40° → 48°`
  - gravity: `20` units/s²
- **Flight** integrates gravity, applies up to two energy-losing bounces, and tracks distance from the landing spot.
- **Best distance** is persisted as `pinguSmashBest`; sound preference as `pinguSmashMuted`.

## Visual system

- Stylized low-poly arctic scene: ice cliff, snow field, pine trees, layered mountains, aurora, stars, moon, and snowfall.
- Procedural characters: penguin with squash/stretch, blink, scarf, and flipper animation; yeti with fur tufts, expressions, club wind-up, swing, follow-through, and celebration.
- Camera modes for title, ready, charge, swing, flight, landing, and result, with portrait-specific framing.
- Particles: snow puffs, impact sparks, shockwave rings, launch trails, and celebration confetti.
- UI: glass cards, gradient display type, live distance HUD, charge meter with perfect zone, sound toggle, share/copy result.

## Audio

All sounds are synthesized with the Web Audio API: UI ticks, drop whoosh, landing thuds, swing whoosh, impact crack, bounce, celebration arpeggio, best-score chime, and a rising charge tone. Audio unlocks on the first gesture and respects the mute toggle.

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

- `CHARGE_UP_TIME`, `CHARGE_DOWN_TIME` — charge meter cadence
- `PERFECT_MIN` — perfect timing window
- `LAUNCH.minSpeed`, `LAUNCH.maxSpeed`, `LAUNCH.minAngle`, `LAUNCH.maxAngle` — distance range
- `BOUNCE_DAMPING`, `BOUNCE_FRICTION`, `SETTLE_BOUNCES` — bounce feel
- `RANKS` — result titles and thresholds
