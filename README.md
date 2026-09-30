# Metropolis Legacy — Prototype

Playable browser prototype for "Superman: Metropolis Legacy".

This repo contains a minimal Three.js-based prototype demonstrating the core mechanics:
- Momentum-based flight (hover, cruise, dash)
- Restraint Gauge (Precision Mode)
- Simple city block with one destructible building
- Civilians that can be rescued
- One enemy drone that creates a threat
- District integrity (the city-as-health-bar)

Run locally
1. Install a simple static server (any will do). Examples:
   - Python 3: `python -m http.server 8080`
   - Node (http-server): `npx http-server . -p 8080`
2. Open http://localhost:8080 in your browser.

Notes
- This is an early prototype focusing on feel and core systems. Art is placeholder geometry.
- Controls are customizable in `src/main.js`.

Files
- index.html — main entry
- src/main.js — game loop, flight, input, mission logic
- src/scene.js — scene setup and simple world objects
- src/ui.js — minimal HUD overlay
- css/styles.css — UI styles

License: MIT
