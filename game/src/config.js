// config.js — all tunable numbers for PASAR PAGI, in one place.
// The game reads these constants everywhere; nothing else hard-codes a
// balance number, so a retune is a one-line change here.
export const GAME_TITLE = "PASAR PAGI";
export const GAME_SUBTITLE = "Cari Bedanya — 7 lapak pasar, 49 perbedaan";

// Canvas size (logical pixels). The page scales the canvas with CSS.
export const VIEW_W = 1280;
export const VIEW_H = 720;

// Play panels: two side-by-side pictures of the same scene.
export const PANEL_W = 600;
export const PANEL_H = 540;
export const PANEL_Y = 108;
export const PANEL_LEFT_X = 20;
export const PANEL_RIGHT_X = 660;
export const PANEL_GAP = 40;

// How many differences each scene hides, and how big the pool is.
export const DIFFS_PER_SCENE = 7;
export const DIFF_POOL_SIZE = 10;

// Timer (seconds) per scene in Mode Waktu — difficulty climbs with the scene.
export const SCENE_TIMERS = [120, 110, 100, 95, 90, 85, 80];

// Scoring.
export const FIND_BASE_POINTS = 100; // times the combo multiplier
export const COMBO_STEP = 3; // streak of 3 -> x2, streak of 6 -> x3
export const COMBO_MAX = 3;
export const TIME_BONUS_PER_SECOND = 10; // timed mode, scene-end bonus
export const WRONG_CLICK_TIME_PENALTY = 5; // seconds lost on a miss (timed)
export const SHAKE_MS = 320; // screen-shake length after a miss

// Hints: per scene attempt, with a cooldown between uses.
export const HINTS_PER_SCENE = 3;
export const HINT_COOLDOWN_MS = 15000;
export const HINT_GLOW_MS = 2600;
export const HINT_GLOW_RADIUS = 95;

// Magnifier lens.
export const MAG_RADIUS = 95;
export const MAG_ZOOM = 2.0;

// Star thresholds. Timed mode weighs time left + accuracy; Santai weighs
// accuracy only (there is no clock to beat).
export const STAR_TIME_FRAC_3 = 0.4;
export const STAR_ACC_3 = 0.8;
export const STAR_ACC_2 = 0.6;
export const STAR_ACC_SANTAI_3 = 0.9;
export const STAR_ACC_SANTAI_2 = 0.7;

// Warm market palette, shared by every scene and screen.
export const PALETTE = {
  cream: "#FFF6E5",
  paper: "#FFFDF6",
  ink: "#3B2416",
  brown: "#6B4226",
  terra: "#C8552B",
  terraDark: "#9E3D1E",
  teal: "#0E7C6B",
  tealDark: "#095E51",
  gold: "#F2B705",
  goldDark: "#D19400",
  sky: "#BFE6F2",
  skyWarm: "#FFE9B8",
  night: "#1E2A4A",
  red: "#D64541",
  green: "#4C9A2A",
};

export const FONT = "'Trebuchet MS', Verdana, sans-serif";
