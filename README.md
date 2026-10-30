# Smack the Pingu

A modern, no-build-step 3D take on the classic “Smack the Pingu” distance game. Drop a penguin off the ledge, swing the yeti's club, and launch the pingu as far as the tundra allows.

![Smack the Pingu](https://img.shields.io/badge/three.js-r170-8fe8ff?style=flat-square) ![No build step](https://img.shields.io/badge/build-none-7dffc4?style=flat-square)

## Play

1. **Drop** — press Space, click, or tap to make the penguin jump down while the yeti's club swings.
2. **Hit** — if the moving penguin is still airborne when the club strikes, it launches at the angle of the strike; distance is calculated from that angle.
3. **Fly** — bounces, lands, and the result card tracks the distance.

Your best distance is saved in `localStorage`. Press **M** to toggle sound. One swing per round; if the penguin reaches the floor before the swing connects, the round is over.

## Run locally

The game is static and uses native ES modules, so it needs to be served over HTTP (not opened directly as a file).

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Any static server works: `npx serve`, GitHub Pages, Netlify, etc.

## Deploy

Push the repo to GitHub and enable Pages for the `main` branch (root). There is no build step. The only remote request is the optional Google Fonts stylesheet; the game falls back to system fonts if it is unavailable.

## Tech

- **Three.js r170**, vendored in `vendor/three.module.js`
- Vanilla ES modules, no bundler
- Procedural low-poly arctic scene, characters, particles, and Web Audio effects
- Glassmorphism UI with responsive portrait/landscape layouts
- Projectile physics with spin, bounces, distance markers, and a persistent best flag
- Local high score via `localStorage`

## Files

```
index.html          page shell and UI
style.css           responsive glass UI
game.js             state machine, input wiring, game loop
src/                scene, characters, physics, camera, particles, audio, UI
vendor/             local Three.js module
```
