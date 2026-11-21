// progress.js — stars, unlocks and best scores, kept in localStorage.
// Everything is guarded: in a sandbox without storage the game just plays
// without remembering, never crashes.
import { STAR_TIME_FRAC_3, STAR_ACC_3, STAR_ACC_2, STAR_ACC_SANTAI_3, STAR_ACC_SANTAI_2 } from "./config.js";

const KEY = "pasarPagi.v1";

function blankSave() {
  return {
    stars: {}, // sceneIndex -> 1..3
    best: {}, // sceneIndex -> best score
    bestTotal: 0,
    bestAccuracy: 0,
    unlocked: 1, // how many scenes are open on the map (scene 0 always open)
    gamesPlayed: 0,
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return blankSave();
    const parsed = JSON.parse(raw);
    return { ...blankSave(), ...parsed };
  } catch {
    return blankSave();
  }
}

export function saveSave(save) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage unavailable (private mode, sandbox): play on without saving.
  }
}

export function loadBestScores() {
  return loadSave();
}

export function saveBestScores(save) {
  saveSave(save);
}

// Stars for a finished scene: 1 for finishing, up to 3 for speed + accuracy.
export function awardStars({ timed, timeLeft, timeLimit, accuracy }) {
  if (timed) {
    const timeFrac = timeLimit > 0 ? timeLeft / timeLimit : 0;
    if (timeFrac >= STAR_TIME_FRAC_3 && accuracy >= STAR_ACC_3) return 3;
    if (accuracy >= STAR_ACC_2) return 2;
    return 1;
  }
  if (accuracy >= STAR_ACC_SANTAI_3) return 3;
  if (accuracy >= STAR_ACC_SANTAI_2) return 2;
  return 1;
}

// Record a finished scene: keep the best star count and best score, and
// open the next stall on the map.
export function recordSceneComplete(save, sceneIndex, stars, score, sceneCount) {
  save.stars[sceneIndex] = Math.max(save.stars[sceneIndex] || 0, stars);
  save.best[sceneIndex] = Math.max(save.best[sceneIndex] || 0, score);
  save.unlocked = Math.max(save.unlocked, Math.min(sceneIndex + 2, sceneCount));
  saveSave(save);
  return save;
}

export function recordGameTotal(save, totalScore, accuracy) {
  save.bestTotal = Math.max(save.bestTotal, totalScore);
  save.bestAccuracy = Math.max(save.bestAccuracy, accuracy);
  save.gamesPlayed += 1;
  saveSave(save);
  return save;
}

export function totalStars(save) {
  return Object.values(save.stars).reduce((a, b) => a + b, 0);
}

export function maxStars(sceneCount) {
  return sceneCount * 3;
}
