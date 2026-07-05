# Whack the Penguin — 3D Remake

A modern 3D remake of the classic Flash game. A penguin jumps from a snowy ledge and the player controls a yeti who must time a club swing to whack the penguin as far as possible. Built with Three.js and a stylized low-poly aesthetic.

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

- **Engine**: Three.js via CDN (ES module import)
- **Stack**: WebGL + Vanilla JS + CSS, no build tools
- **Art**: Procedural low-poly geometry (BoxGeometry, ConeGeometry, SphereGeometry), flat-shaded
- **Models**: All built in code from Three.js primitives — zero external assets
- **Physics**: Custom projectile motion (gravity, air friction, bounce damping)
- **States**: 7-state game machine (INTRO → DROPPING → LAND_WOBBLE → READY → SWING → FLYING → LANDED)
- **Rendering**: Perspective camera, three-point lighting, fog, procedural terrain

## File Structure

```
penguin/
├── index.html          -- Three.js import, renderer div, UI overlays
├── style.css           -- Full-screen layout, overlay styling
├── game.js             -- Entry point, game loop orchestrator
└── src/
    ├── constants.js    -- Shared constants (gravity, positions, colors)
    ├── scene.js        -- Renderer, camera, lights, fog, sky
    ├── environment.js  -- Terrain, cliff, mountains, distance markers
    ├── penguin.js      -- Penguin character model (Group hierarchy)
    ├── yeti.js         -- Yeti character model (Group hierarchy + club arm)
    ├── physics.js      -- State machine, projectile motion, bounce logic
    ├── camera.js       -- Camera positioning per state, lerp follow
    ├── particles.js    -- Ambient snow, hit burst, bounce dust
    └── animations.js   -- Squash/stretch, swing, wobble, eye tracking
```

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
