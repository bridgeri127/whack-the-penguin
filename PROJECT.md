# Whack the Penguin — HTML5 Remake

A modern HTML5 remake of the classic Flash game. A penguin jumps from a snowy ledge and the player controls a yeti who must time a club swing to whack the penguin as far as possible.

## Game Flow

1. **Intro** — Penguin stands on a cliff ledge above the yeti. Prompt to start.
2. **Drop** — Penguin jumps from the ledge, falls to the ground in front of the yeti (squash-and-stretch animation).
3. **Land wobble** — Penguin bounces and wobbles to recover from the landing.
4. **Ready** — Timing bar oscillates above the yeti. Player presses to swing.
5. **Swing** — Yeti swings club forward. Club makes contact with the penguin.
6. **Launch** — Penguin flies through the air with projectile physics, spinning.
7. **Bounce** — Penguin bounces up to 4 times with energy loss per bounce.
8. **Landed** — Distance displayed. High score tracked in localStorage.

## Tech

- **Stack**: HTML5 Canvas + Vanilla JS + CSS, zero dependencies
- **Files**: `index.html`, `style.css`, `game.js`
- **Art**: Pixel art drawn via canvas primitives (no sprite sheets)
- **Physics**: Custom projectile motion (gravity, air friction, bounce damping)
- **States**: 6-state game machine (INTRO → DROPPING → LAND_WOBBLE → READY → SWING → FLYING → LANDED)

## Controls

- **Space / Click / Tap**: Advance game state (start → swing → retry)
- **Again button**: Reset and play again

## Mechanics

- Timing bar oscillates sinuously from -1 to 1
- Center (green) = max power, ~35° launch angle
- Edges (red) = weak hits, suboptimal angles
- Power curve: cosine falloff from center
- Launch speed: `power * 1400 + 200` px/s
- Bounce damping: 35% energy retained
- Horizontal friction on bounce: 60% retained

## Repo

https://github.com/bridgeri127/whack-the-penguin
