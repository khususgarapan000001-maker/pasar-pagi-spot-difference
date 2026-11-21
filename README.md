# PASAR PAGI — Cari Bedanya

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/khususgarapan000001-maker/pasar-pagi-spot-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/khususgarapan000001-maker/pasar-pagi-spot-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

A spot-the-difference game set in an Indonesian morning market, built for the
[make.fun bounty "Make the best spot the difference game"](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).
Two near-identical market scenes side by side — find the 7 differences in
each of the 7 stalls before the clock runs out.

## What is in the game

- **7 scenes, 49 differences** — Lapau Buah, Kain Batik, Becak & Kucing,
  Warung Kopi, Pasar Malam, Penjual Jamu, Tukang Sayur Keliling. Each scene
  hides 7 differences picked at random from a pool of 10, so no two runs
  play the same.
- **Two modes** — Mode Waktu (a per-scene timer with a pressure bar) and
  Mode Santai (no timer).
- **Peta Pasar** — a market map of 7 stalls that unlock one by one as you
  finish each scene.
- **Stars, combo & best scores** — 1–3 stars per scene from time + accuracy,
  a combo multiplier (x1 → x3) for streaks without a miss, and local best
  scores kept in localStorage.
- **Hints, magnifier, pause** — 3 hints per scene (cooldown, rough-area
  glow), a 2x magnifier lens (right-click or M), full keyboard play
  (arrows + Enter, H, M, P/Esc, N), and pause with P or Esc.
- **Feel** — gold rings on both panels for every find, particle bursts,
  a rising chime for hot streaks, screen shake + time penalty on a miss,
  and synthesized WebAudio sounds (no audio files).
- **All art procedural** — every scene is drawn in canvas from vector
  shapes; the game loads nothing over the network and needs no build step.

## How to play

Serve `game/` with any static HTTP server and open `game/index.html` in
desktop Chrome, for example:

```
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080 — click the differences in panel A or B,
or steer the crosshair with the arrow keys and press Enter.

## Layout

- `main.ts` — entrypoint: copies `game/` + `screenshots/` to the output
  directory and writes `dossier.json` via the kit's `buildDossier`.
- `game/index.html` — page shell + canvas.
- `game/src/config.js` — all balance numbers (timers, scoring, combo).
- `game/src/scenes.js` — the 7 scenes and their 10-difference pools.
- `game/src/render.js` — panels, markers, particles, HUD, map and screens.
- `game/src/input.js` — mouse + keyboard.
- `game/src/audio.js` — synthesized WebAudio sounds.
- `game/src/progress.js` — stars, unlocks and best scores (localStorage).
- `game/src/shots.js` — deterministic staging for the screenshots.
- `game/src/main.js` — state machine, loop, timer, scoring, scene flow.
- `screenshots/` — 4 screenshots, real renders of the game's own code.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
