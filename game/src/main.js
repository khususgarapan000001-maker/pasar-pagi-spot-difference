// main.js — the game itself: state machine, loop, timer, scoring, combo,
// scene flow and mode select. Rendering lives in render.js, input in
// input.js; this file is the rules.
import {
  VIEW_W, VIEW_H, PANEL_W, PANEL_H, SCENE_TIMERS, DIFFS_PER_SCENE,
  FIND_BASE_POINTS, COMBO_STEP, COMBO_MAX, TIME_BONUS_PER_SECOND,
  WRONG_CLICK_TIME_PENALTY, SHAKE_MS, HINTS_PER_SCENE, HINT_COOLDOWN_MS,
  HINT_GLOW_MS,
} from "./config.js";
import { defineScenes, pickRandomDifferences, mulberry32 } from "./scenes.js";
import {
  createPanelCanvases, drawScenePanel, drawPlayScreen, drawTitleScreen,
  drawMapScreen, drawPauseOverlay, drawCelebrateOverlay, drawEndScreen,
  spawnFoundBurst, spawnConfetti, updateParticles,
} from "./render.js";
import { PANEL_LEFT_X, PANEL_RIGHT_X, PANEL_Y } from "./config.js";
import { attachInput } from "./input.js";
import {
  unlockAudio, playFoundChime, playComboUp, playWrongBuzz, playHintSound,
  playClick, playSceneComplete, playTimeUp, setMuted, isMuted,
} from "./audio.js";
import {
  loadSave, awardStars, recordSceneComplete, recordGameTotal,
} from "./progress.js";
import { stageShot } from "./shots.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const panels = createPanelCanvases();

const game = {
  screen: "title",
  mode: "waktu",
  scenes: defineScenes(),
  sceneIndex: 0,
  scene: null,
  picked: [],
  found: new Set(),
  foundAt: {},
  score: 0,
  sceneScore: 0,
  combo: 1,
  streak: 0,
  sceneClicks: 0,
  sceneFound: 0,
  totalClicks: 0,
  totalFound: 0,
  totalElapsed: 0,
  scenesCompleted: 0,
  completedScenes: new Set(),
  timeLeft: 0,
  timeLimit: 0,
  sceneElapsed: 0,
  lastTimeBonus: 0,
  lastStars: 0,
  failed: false,
  celebrateAt: 0,
  hintsLeft: HINTS_PER_SCENE,
  hintReadyAt: 0,
  hintTarget: null,
  hintGlowUntil: 0,
  particles: [],
  cursor: { panel: "left", x: 300, y: 270 },
  cursorVisible: false,
  magnifier: false,
  mouseInPanel: null,
  muted: false,
  shakeUntil: 0,
  save: loadSave(),
  thumbs: [],
  frozen: false,
  frozenNow: 0,

  accuracyText() {
    if (this.sceneClicks === 0) return "100%";
    return `${Math.round((this.sceneFound / this.sceneClicks) * 100)}%`;
  },
  totalAccuracy() {
    if (this.totalClicks === 0) return 1;
    return this.totalFound / this.totalClicks;
  },

  showTitle() {
    playClick();
    this.screen = "title";
  },

  buildThumbs() {
    this.thumbs = this.scenes.map((scene) => {
      const c = document.createElement("canvas");
      c.width = PANEL_W;
      c.height = PANEL_H;
      drawScenePanel(c.getContext("2d"), scene, new Set());
      return c;
    });
  },

  showMap() {
    playClick();
    this.buildThumbs();
    this.screen = "map";
  },

  startMode(mode) {
    playClick();
    this.mode = mode;
    this.score = 0;
    this.totalClicks = 0;
    this.totalFound = 0;
    this.totalElapsed = 0;
    this.scenesCompleted = 0;
    this.completedScenes = new Set();
    this.showMap();
  },

  startScene(index) {
    this.startSceneSeeded(index, null);
  },

  startSceneSeeded(index, seed) {
    this.sceneIndex = index;
    this.scene = this.scenes[index];
    const rng = seed === null ? Math.random : mulberry32(seed);
    this.picked = pickRandomDifferences(this.scene, rng);
    this.found = new Set();
    this.foundAt = {};
    this.hintsLeft = HINTS_PER_SCENE;
    this.hintReadyAt = 0;
    this.hintTarget = null;
    this.hintGlowUntil = 0;
    this.timeLimit = SCENE_TIMERS[index];
    this.timeLeft = this.timeLimit;
    this.sceneElapsed = 0;
    this.sceneClicks = 0;
    this.sceneFound = 0;
    this.sceneScore = 0;
    this.streak = 0;
    this.combo = 1;
    this.particles = [];
    this.cursor = { panel: "left", x: 300, y: 270 };
    this.cursorVisible = false;
    this.magnifier = false;
    this.failed = false;
    this.screen = "play";
  },

  restartScene() {
    playClick();
    this.startScene(this.sceneIndex);
  },

  nextScene() {
    playClick();
    const next = Math.min(this.sceneIndex + 1, this.scenes.length - 1);
    this.startScene(next);
  },

  finishToEnd() {
    recordGameTotal(this.save, this.score, this.totalAccuracy());
    this.screen = "end";
  },

  playAgain() {
    playClick();
    this.score = 0;
    this.totalClicks = 0;
    this.totalFound = 0;
    this.totalElapsed = 0;
    this.scenesCompleted = 0;
    this.completedScenes = new Set();
    this.screen = "title";
  },

  togglePause() {
    if (this.screen === "play") {
      this.screen = "paused";
      playClick();
    } else if (this.screen === "paused") {
      this.screen = "play";
      playClick();
    }
  },

  toggleMagnifier() {
    this.magnifier = !this.magnifier;
    playClick();
  },

  toggleMute() {
    this.muted = !this.muted;
    setMuted(this.muted);
    playClick();
  },

  useHint() {
    const now = this.frozen ? this.frozenNow : performance.now();
    if (this.screen !== "play") return;
    if (this.hintsLeft <= 0 || now < this.hintReadyAt) return;
    const unfound = this.picked.filter((d) => !this.found.has(d.id));
    if (unfound.length === 0) return;
    this.hintsLeft -= 1;
    this.hintReadyAt = now + HINT_COOLDOWN_MS;
    this.hintTarget = unfound[Math.floor(Math.random() * unfound.length)];
    this.hintGlowUntil = now + HINT_GLOW_MS;
    playHintSound();
  },

  clickAtPanel(panel, x, y) {
    if (this.screen !== "play") return;
    const now = this.frozen ? this.frozenNow : performance.now();
    this.sceneClicks += 1;
    this.totalClicks += 1;
    for (const diff of this.picked) {
      if (this.found.has(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      const hitR = diff.r + 10; // a little generous: fair, not fiddly
      if (dx * dx + dy * dy <= hitR * hitR) {
        this.registerFound(diff, now);
        return;
      }
    }
    // a miss: time penalty (timed mode), shake, combo reset
    this.streak = 0;
    this.combo = 1;
    if (this.mode === "waktu") {
      this.timeLeft = Math.max(0, this.timeLeft - WRONG_CLICK_TIME_PENALTY);
    }
    this.shakeUntil = now + SHAKE_MS;
    playWrongBuzz();
  },

  registerFound(diff, now) {
    this.found.add(diff.id);
    this.foundAt[diff.id] = now;
    this.sceneFound += 1;
    this.totalFound += 1;
    this.streak += 1;
    const newCombo = this.streak >= COMBO_STEP * 2 ? COMBO_MAX : this.streak >= COMBO_STEP ? 2 : 1;
    const comboUp = newCombo > this.combo;
    this.combo = newCombo;
    const points = FIND_BASE_POINTS * this.combo;
    this.sceneScore += points;
    this.score += points;
    // a burst on BOTH panels, at the same spot
    spawnFoundBurst(this.particles, PANEL_LEFT_X + diff.x, PANEL_Y + diff.y, this.combo);
    spawnFoundBurst(this.particles, PANEL_RIGHT_X + diff.x, PANEL_Y + diff.y, this.combo);
    playFoundChime(this.combo);
    if (comboUp) playComboUp(this.combo);
    if (this.found.size >= DIFFS_PER_SCENE) this.endScene(now, false);
  },

  endScene(now, timedOut) {
    const accuracy = this.sceneClicks > 0 ? this.sceneFound / this.sceneClicks : 1;
    if (timedOut) {
      this.failed = true;
      this.lastStars = 0;
      this.lastTimeBonus = 0;
      this.celebrateAt = now;
      this.screen = "celebrate";
      playTimeUp();
      return;
    }
    this.failed = false;
    this.lastTimeBonus = this.mode === "waktu"
      ? Math.floor(this.timeLeft) * TIME_BONUS_PER_SECOND
      : 0;
    this.sceneScore += this.lastTimeBonus;
    this.score += this.lastTimeBonus;
    this.lastStars = awardStars({
      timed: this.mode === "waktu",
      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      accuracy,
    });
    recordSceneComplete(this.save, this.sceneIndex, this.lastStars, this.sceneScore, this.scenes.length);
    if (!this.completedScenes.has(this.sceneIndex)) {
      this.completedScenes.add(this.sceneIndex);
      this.scenesCompleted = this.completedScenes.size;
    }
    this.celebrateAt = now;
    this.screen = "celebrate";
    spawnConfetti(this.particles, 90);
    playSceneComplete();
  },
};

attachInput(canvas, game);

// Test hook: lets an automated play-test read the live state (screen,
// picked differences, score, timer) without touching the game itself.
window.__game = game;

// --- main loop -----------------------------------------------------------
let last = performance.now();
function loop(frameNow) {
  const now = game.frozen ? game.frozenNow : frameNow;
  const dt = game.frozen ? 0 : Math.min(0.05, (frameNow - last) / 1000);
  last = frameNow;

  if (game.screen === "play" && !game.frozen) {
    if (game.mode === "waktu") {
      game.timeLeft -= dt;
      if (game.timeLeft <= 0) {
        game.timeLeft = 0;
        game.endScene(now, true);
      }
    }
    game.sceneElapsed += dt;
    game.totalElapsed += dt;
  }
  updateParticles(game.particles, dt);

  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === "title") {
    drawTitleScreen(ctx, game);
  } else if (game.screen === "map") {
    drawMapScreen(ctx, game, game.thumbs);
  } else if (game.screen === "end") {
    drawEndScreen(ctx, game);
  } else {
    // play, paused and celebrate all show the game board underneath
    drawPlayScreen(ctx, game, now, panels);
    if (game.screen === "paused") drawPauseOverlay(ctx, game);
    if (game.screen === "celebrate") drawCelebrateOverlay(ctx, game, now);
  }
  requestAnimationFrame(loop);
}

// --- screenshot staging --------------------------------------------------
// ?shot=cover|map|celebration|end stages a deterministic frame for the
// screenshot tool, then signals readiness.
const shotName = new URLSearchParams(window.location.search).get("shot");
if (shotName) {
  // stage after the first frame so fonts/canvas are warm
  requestAnimationFrame((t0) => {
    stageShot(game, shotName, t0);
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

requestAnimationFrame(loop);
unlockAudio();
