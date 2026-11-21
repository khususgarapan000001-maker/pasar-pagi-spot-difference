// shots.js — deterministic staging for the four screenshots.
// The game is opened with ?shot=<name>; this module puts it into the exact
// state the shot needs (seeded differences, fixed timer, staged progress)
// and freezes the clock so the frame is stable. Every screenshot is a real
// render of the game's own code — nothing here draws a fake picture.
import { mulberry32, pickRandomDifferences } from "./scenes.js";
import { spawnFoundBurst } from "./render.js";
import { PANEL_LEFT_X, PANEL_RIGHT_X, PANEL_Y } from "./config.js";

// Particles placed by hand for the celebration shot: a burst frozen
// mid-explosion over both panels plus confetti caught mid-fall.
function stageCelebrationParticles(game) {
  const rng = mulberry32(777);
  const colors = ["#F2B705", "#FFD93D", "#C8552B", "#0E7C6B", "#D64541"];
  for (const px of [PANEL_LEFT_X, PANEL_RIGHT_X]) {
    for (let i = 0; i < 22; i++) {
      const a = rng() * Math.PI * 2;
      const d = 30 + rng() * 110;
      game.particles.push({
        x: px + 300 + Math.cos(a) * d,
        y: PANEL_Y + 270 + Math.sin(a) * d,
        vx: 0, vy: 0, life: 0.3, maxLife: 1,
        size: 3 + rng() * 5, color: colors[i % colors.length],
        shape: i % 3 === 0 ? "star" : "circle",
      });
    }
    game.particles.push({ x: px + 300, y: PANEL_Y + 270, vx: 0, vy: 0, life: 0.2, maxLife: 0.45, size: 10, color: "#F2B705", shape: "ring" });
  }
  for (let i = 0; i < 40; i++) {
    game.particles.push({
      x: rng() * 1280, y: 40 + rng() * 480,
      vx: 0, vy: 0, life: 0.5, maxLife: 3,
      size: 4 + rng() * 6, color: colors[i % colors.length],
      shape: "rect", rot: rng() * Math.PI, vrot: 0,
    });
  }
}

export function stageShot(game, name, now) {
  if (name === "cover") {
    // Mid-play, scene 3 (Becak & Kucing): 3 found, 4 still hidden, with a
    // live timer, a score and a combo on show.
    game.mode = "waktu";
    game.startSceneSeeded(2, 20261121);
    const [d1, d2, d3] = game.picked;
    for (const d of [d1, d2, d3]) {
      game.found.add(d.id);
      game.foundAt[d.id] = now - 1500;
    }
    game.sceneFound = 3;
    game.sceneClicks = 4;
    game.score = 1200;
    game.sceneScore = 1200;
    game.streak = 3;
    game.combo = 2;
    game.timeLeft = 74;
    game.timeLimit = 100;
    game.hintsLeft = 2;
    game.cursorVisible = false;
    game.magnifier = false;
    // a small burst still visible on the newest find, both panels
    spawnFoundBurst(game.particles, PANEL_LEFT_X + d3.x, PANEL_Y + d3.y, 2);
    spawnFoundBurst(game.particles, PANEL_RIGHT_X + d3.x, PANEL_Y + d3.y, 2);
    game.particles.forEach((p) => { p.life = 0.25; });
  } else if (name === "map") {
    // The market map: four stalls starred, one still locked.
    game.save = {
      stars: { 0: 3, 1: 2, 2: 3, 3: 1 },
      best: { 0: 2450, 1: 1980, 2: 2310, 3: 1540 },
      bestTotal: 12450,
      bestAccuracy: 0.86,
      unlocked: 6,
      gamesPlayed: 3,
    };
    game.showMap();
  } else if (name === "celebration") {
    // The 7th find of scene 1: confetti + rings + the "Scene Selesai!"
    // panel with three stars.
    game.mode = "waktu";
    game.startSceneSeeded(0, 4242);
    for (const d of game.picked) {
      game.found.add(d.id);
      game.foundAt[d.id] = now - 2000;
    }
    game.sceneFound = 7;
    game.sceneClicks = 8;
    game.sceneScore = 2400;
    game.score = 2400;
    game.streak = 7;
    game.combo = 3;
    game.lastTimeBonus = 350;
    game.lastStars = 3;
    game.failed = false;
    game.sceneElapsed = 85;
    game.timeLeft = 35;
    game.celebrateAt = now - 1600; // stars already popped in
    game.screen = "celebrate";
    stageCelebrationParticles(game);
  } else if (name === "end") {
    // The final screen after a full run: totals + best-scores table.
    game.mode = "waktu";
    game.score = 18750;
    game.scenesCompleted = 7;
    game.totalElapsed = 542;
    game.totalClicks = 58;
    game.totalFound = 49;
    game.save = {
      stars: { 0: 3, 1: 3, 2: 2, 3: 3, 4: 2, 5: 1, 6: 3 },
      best: { 0: 2450, 1: 2680, 2: 2310, 3: 2740, 4: 2190, 5: 1980, 6: 3400 },
      bestTotal: 18750,
      bestAccuracy: 0.86,
      unlocked: 7,
      gamesPlayed: 4,
    };
    game.screen = "end";
  } else {
    return false;
  }
  // Freeze the clock: the staged frame must not drift between renders.
  game.frozen = true;
  game.frozenNow = now;
  return true;
}

export { pickRandomDifferences, mulberry32 };
