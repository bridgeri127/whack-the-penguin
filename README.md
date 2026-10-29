# Smack the Pingu

A modern, no-build-step 3D take on the classic “Smack the Pingu” distance game. Drop a penguin off the ledge, charge the yeti's club, release in the perfect zone, and send it as far as the tundra allows.

![Smack the Pingu](https://img.shields.io/badge/three.js-r170-8fe8ff?style=flat-square) ![No build step](https://img.shields.io/badge/build-none-7dffc4?style=flat-square)

## Play

1. **Drop** — press Space, click, or tap to send the penguin off the cliff.
2. **Charge** — hold anywhere (or hold Space) to wind up the yeti's club.
3. **Release** — let go while the meter is in the gold perfect zone. The penguin flies, bounces, and lands.

Your best distance is saved in `localStorage`. Press **M** to toggle sound.

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
