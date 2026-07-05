# Kanban Board — 3D Remake

> **Current focus**: Rebuild the complete game in Three.js with low-poly aesthetic.
> 2D version is complete and committed.

---

## Done (2D Version)

- [x] Core game loop and 7-state machine
- [x] HTML/CSS/JS scaffold (zero dependencies)
- [x] Pixel art: penguin, yeti, cliff, terrain, mountains
- [x] Penguin drop animation with squash-and-stretch
- [x] Landing wobble recovery
- [x] Timing bar with gradient zones
- [x] Yeti club swing animation
- [x] Launch physics (projectile motion, gravity, bounces)
- [x] Particle effects (hit burst, snow burst, bounce dust)
- [x] Falling snow particles and parallax mountains
- [x] Camera follow during flight
- [x] Distance tracking with localStorage high score
- [x] Space/click/touch input
- [x] Git repo + GitHub push
- [x] PROJECT.md documentation and Kanban board

---

## Done (3D Remake)

### Phase 1: Foundation
- [x] 1.1 Update `index.html` — remove canvas, add `#renderer` div, ES module imports
- [x] 1.2 Update `style.css` — full-screen WebGL renderer, preserve UI overlay styles
- [x] 1.3 Create `src/constants.js` — port all constants with 3D coordinate mappings
- [x] 1.4 Create `src/scene.js` — renderer, perspective camera, lights, fog, sky
- [x] 1.5 Wire `game.js` as entry point — init scene, render loop, verify display

### Phase 2: Environment
- [x] 2.1 Terrain mesh — PlaneGeometry with sine-wave vertex displacement
- [x] 2.2 Cliff — Group: rock face, snow cap, ledge platform, icicle cones
- [x] 2.3 Mountains — two layers of ConeGeometry peaks with snow caps
- [x] 2.4 Distance markers — posts every 100 units, labeled every 200

### Phase 3: Characters
- [x] 3.1 Penguin model — Group: body, belly, head, eyes/pupils, beak, flippers, feet
- [x] 3.2 Yeti model — Group: torso, head (eyes, brows, mouth), legs, fur details
- [x] 3.3 Club arm — pivot group: arm segment, handle, club head, grip details

### Phase 4: Gameplay Loop
- [x] 4.1 Port state machine — 7 states with transitions (already in game.js)
- [x] 4.2 Port input handling — space/click/touch per state (state-aware routing)

### Phase 5: Camera & Animations
- [x] 5.1 Static camera framing for INTRO/READY states
- [x] 5.2 Flight camera — lerp follow with smooth settling
- [x] 5.3 Penguin squash/stretch — volume-preserving scale on body group
- [x] 5.4 Penguin flight spin — rotation.z during flight
- [x] 5.5 Yeti club arm swing — lerp-driven rotation
- [x] 5.6 Yeti eye tracking — pupils translate toward penguin
- [x] 5.7 Yeti expression states — brow furrow, mouth open on swing
- [x] 5.8 Yeti idle breathing — subtle head bob

### Phase 6: Particles & Effects
- [x] 6.1 Ambient snow — Points system, 50 particles, drift/sway/wrap
- [x] 6.2 Hit burst — 15 radial particles (gold/orange/red/white) at impact
- [x] 6.3 Snow burst — 12 upward particles on bounce
- [x] 6.4 Bounce dust — pale particles at ground contact

---

## In Progress

### Phase 7: UI & Polish
- Intro overlay, result panel, Again button already wired (carried from foundation)
- Timing bar projection to screen space
- Mobile responsiveness, final polish

## Backlog (3D Remake — In Order)

### Phase 1: Foundation
- [ ] 1.1 Update `index.html` — remove canvas, add `#renderer` div, ES module imports
- [ ] 1.2 Update `style.css` — full-screen WebGL renderer, preserve UI overlay styles
- [ ] 1.3 Create `src/constants.js` — port all constants with 3D coordinate mappings
- [ ] 1.4 Create `src/scene.js` — renderer, perspective camera, lights, fog, sky
- [ ] 1.5 Wire `game.js` as entry point — init scene, render loop, verify display

### Phase 2: Environment
- [ ] 2.1 Terrain mesh — PlaneGeometry with sine-wave vertex displacement
- [ ] 2.2 Cliff — Group: rock face, snow cap, ledge platform, icicle cones
- [ ] 2.3 Mountains — two layers of ConeGeometry peaks with snow caps
- [ ] 2.4 Distance markers — posts every 100 units, labeled every 200
- [ ] 2.5 Light/fog pass — tune warm sun, cool fill, ambient until scene reads well

### Phase 3: Characters
- [ ] 3.1 Penguin model — Group: body, belly, head, eyes/pupils, beak, flippers, feet
- [ ] 3.2 Yeti model — Group: torso, head (eyes, brows, mouth), legs, fur details
- [ ] 3.3 Club arm — pivot group: arm segment, handle, club head, grip details
- [ ] 3.4 Position both characters and verify from camera angle

### Phase 4: Gameplay Loop
- [ ] 4.1 Port state machine — 7 states with transitions
- [ ] 4.2 Port input handling — space/click/touch per state
- [ ] 4.3 Port drop animation — pause on ledge, hop, gravity fall, stretch
- [ ] 4.4 Port landing wobble — damped sine rotation
- [ ] 4.5 Port timing bar — oscillating value, gradient zones
- [ ] 4.6 Port swing animation — club arm rotation lerp
- [ ] 4.7 Port launch physics — power curve, angle mapping, projectile motion
- [ ] 4.8 Port bounce logic — ground collision, energy damping, settle condition
- [ ] 4.9 End-to-end test — full loop from INTRO to LANDED and reset

### Phase 5: Camera & Animations
- [ ] 5.1 Static camera framing for INTRO/READY states
- [ ] 5.2 Flight camera — lerp follow (6/s x, 4/s y) with look-ahead
- [ ] 5.3 Landed camera — slow settle (1.5/s) on final position
- [ ] 5.4 Penguin squash/stretch — volume-preserving scale on body group
- [ ] 5.5 Penguin flight spin — rotation.z during flight
- [ ] 5.6 Yeti eye tracking — pupils translate toward penguin
- [ ] 5.7 Yeti mouth states — neutral/strain/excitement visibility toggles
- [ ] 5.8 Yeti idle breathing — subtle body bob

### Phase 6: Particles & Effects
- [ ] 6.1 Ambient snow — Points system, 50 particles, drift/sway/wrap
- [ ] 6.2 Hit burst — 15 radial particles (gold/orange/red/white) at impact
- [ ] 6.3 Snow burst — 12 upward particles on initial landing
- [ ] 6.4 Bounce dust — 8 pale particles at each ground bounce
- [ ] 6.5 Particle texture — radial gradient canvas texture for sprites

### Phase 7: UI & Polish
- [ ] 7.1 Intro overlay — title, prompt text, state-driven visibility
- [ ] 7.2 Result panel — distance display, best score, Again button
- [ ] 7.3 localStorage high score persistence
- [ ] 7.4 Timing bar as HTML overlay projected to screen space
- [ ] 7.5 Screen shake on impact — brief camera offset
- [ ] 7.6 Mobile responsiveness — resize handler, touch input, canvas scaling

---

## Backlog (Post-Launch Polish)

### Motion & Feel
- [ ] Club-to-penguin contact tuning — verify club head overlaps penguin in 3D
- [ ] Swing timing tuning — adjust oscillation speed and swing duration
- [ ] Launch trajectory tuning — verify angles and power curve feel satisfying
- [ ] Slow-mo effect during the whack moment

### Visual Polish
- [ ] Trail/sparkle effect on penguin during flight
- [ ] Impact flash frame at contact point
- [ ] Penguin idle animation on ledge (looking down, shivering)
- [ ] Landing crater / snow imprint where penguin stops
- [ ] Better distance markers with flagposts on terrain

### Audio
- [ ] Sound effects: windup, swing whoosh, impact thwack, bounce boings, landing thud
- [ ] Background ambience (wind)

### Scoring & Feedback
- [ ] Floating distance number during flight
- [ ] Score callouts ("Nice!", "Great shot!", "Incredible!", "New record!")
- [ ] Replay best distance arrow on terrain during flight

### Features
- [ ] Multiple rounds tracking (top 3 distances, average)
- [ ] Share result button (copy text to clipboard)
- [ ] Title screen animation (penguin silhouette on ledge, snow)
