// audio.js — every sound is synthesized with WebAudio. No audio files,
// no network, no assets: a few oscillators and envelopes do the whole job.
let ctx = null;
let muted = false;

function audioCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

// Unlock audio on the first user gesture (browsers block sound before one).
export function unlockAudio() {
  const ac = audioCtx();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
}

export function setMuted(m) {
  muted = m;
}

export function isMuted() {
  return muted;
}

function tone(freq, startAt, dur, type, vol, slideTo) {
  const ac = audioCtx();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, startAt + dur);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(vol, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.05);
}

// A bright two-note "ting" when a difference is found. Higher combos climb
// the scale so a hot streak sounds like one.
export function playFoundChime(combo) {
  const ac = audioCtx();
  if (!ac || muted) return;
  const now = ac.currentTime;
  const base = 660 * Math.pow(1.122, Math.min(combo, 3) - 1);
  tone(base, now, 0.16, "sine", 0.22);
  tone(base * 1.5, now + 0.07, 0.24, "sine", 0.2);
  tone(base * 2, now + 0.14, 0.3, "triangle", 0.08);
}

export function playComboUp(combo) {
  const ac = audioCtx();
  if (!ac || muted) return;
  const now = ac.currentTime;
  const base = 520 + combo * 110;
  tone(base, now, 0.12, "triangle", 0.18);
  tone(base * 1.25, now + 0.08, 0.12, "triangle", 0.18);
  tone(base * 1.5, now + 0.16, 0.2, "triangle", 0.18);
}

// A low buzz for a wrong click: unmistakable, never harsh.
export function playWrongBuzz() {
  const ac = audioCtx();
  if (!ac || muted) return;
  const now = ac.currentTime;
  tone(180, now, 0.22, "sawtooth", 0.1, 120);
  tone(90, now, 0.22, "square", 0.05, 70);
}

export function playHintSound() {
  const ac = audioCtx();
  if (!ac || muted) return;
  const now = ac.currentTime;
  tone(880, now, 0.1, "sine", 0.14);
  tone(1174, now + 0.09, 0.18, "sine", 0.14);
}

export function playClick() {
  const ac = audioCtx();
  if (!ac || muted) return;
  tone(440, ac.currentTime, 0.06, "triangle", 0.1);
}

// A rising arpeggio when a scene is completed.
export function playSceneComplete() {
  const ac = audioCtx();
  if (!ac || muted) return;
  const now = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, now + i * 0.11, 0.32, "triangle", 0.16));
}

// A soft low chime when the clock runs out.
export function playTimeUp() {
  const ac = audioCtx();
  if (!ac || muted) return;
  const now = ac.currentTime;
  tone(392, now, 0.3, "sine", 0.16);
  tone(311, now + 0.25, 0.45, "sine", 0.16);
}
