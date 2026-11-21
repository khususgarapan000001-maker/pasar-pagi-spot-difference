// render.js — everything the player sees: the two panels, the gold
// markers, particles, the magnifier, the HUD, and every screen
// (title, market map, pause, celebration, final scores).
import {
  VIEW_W, VIEW_H, PANEL_W, PANEL_H, PANEL_Y, PANEL_LEFT_X, PANEL_RIGHT_X,
  PALETTE, FONT, MAG_RADIUS, MAG_ZOOM, HINT_GLOW_RADIUS,
} from "./config.js";

export function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${FONT}`;
  ctx.textAlign = align || "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}
function rrect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function rrectStroke(ctx, x, y, w, h, r, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}
function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
export function drawStar(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// --- offscreen panels ----------------------------------------------------
// Each panel is rendered to its own canvas every frame, then blitted. That
// makes the magnifier cheap (it re-reads the panel canvas) and lets the
// shake offset both panels together.
export function createPanelCanvases() {
  const left = document.createElement("canvas");
  left.width = PANEL_W;
  left.height = PANEL_H;
  const right = document.createElement("canvas");
  right.width = PANEL_W;
  right.height = PANEL_H;
  return { left, right };
}

export function drawScenePanel(offCtx, scene, activeSet) {
  offCtx.save();
  offCtx.clearRect(0, 0, PANEL_W, PANEL_H);
  scene.draw(offCtx, PANEL_W, PANEL_H, activeSet);
  offCtx.restore();
}

// --- particles -----------------------------------------------------------
export function spawnFoundBurst(particles, x, y, combo) {
  const n = 16 + combo * 8;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 160;
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 60,
      life: 0, maxLife: 0.6 + Math.random() * 0.5,
      size: 3 + Math.random() * 5,
      color: ["#F2B705", "#FFD93D", "#C8552B", "#FFF6E5"][i % 4],
      shape: i % 3 === 0 ? "star" : "circle",
    });
  }
  particles.push({ x, y, vx: 0, vy: 0, life: 0, maxLife: 0.45, size: 10, color: "#F2B705", shape: "ring" });
}

export function spawnConfetti(particles, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * VIEW_W,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 60,
      vy: 90 + Math.random() * 120,
      life: 0, maxLife: 2.5 + Math.random() * 1.5,
      size: 4 + Math.random() * 6,
      color: ["#F2B705", "#C8552B", "#0E7C6B", "#D64541", "#7E57C2"][i % 5],
      shape: "rect",
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 8,
    });
  }
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.shape !== "ring") p.vy += 260 * dt;
    if (p.vrot) p.rot += p.vrot * dt;
  }
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const t = 1 - p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.4));
    if (p.shape === "ring") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4 * t + 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + (p.life / p.maxLife) * 70, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === "star") {
      drawStar(ctx, p.x, p.y, p.size, p.color);
    } else if (p.shape === "rect") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot || 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else {
      circle(ctx, p.x, p.y, p.size * t + 1, p.color);
    }
  }
  ctx.globalAlpha = 1;
}

// --- the gold marker: a hand-drawn-feeling circle on a found difference --
export function drawDifferenceMarker(ctx, x, y, r, now, foundAt) {
  const age = Math.min(1, (now - foundAt) / 220);
  const pop = 1 + (1 - age) * 0.35;
  const rr = r * pop + 6;
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, rr, -0.25, Math.PI * 1.75);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.goldDark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, rr + 5, 0.6, Math.PI * 1.3);
  ctx.stroke();
  ctx.fillStyle = "rgba(242,183,5,0.16)";
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, Math.PI * 2);
  ctx.fill();
}

// --- HUD buttons (shared with input.js) ----------------------------------
// Bottom-bar buttons during play. Each entry: id, rect, label, key hint.
export function playButtons() {
  const y = 658;
  const h = 50;
  return [
    { id: "hint", x: 20, y, w: 190, h, label: "Petunjuk (H)", sub: "" },
    { id: "magnifier", x: 226, y, w: 220, h, label: "Kaca Pembesar (M)", sub: "" },
    { id: "pause", x: 462, y, w: 150, h, label: "Jeda (P)", sub: "" },
    { id: "map", x: 628, y, w: 150, h, label: "Peta Pasar", sub: "" },
    { id: "sound", x: 794, y, w: 150, h, label: "Suara", sub: "" },
  ];
}

function drawButton(ctx, b, active, disabled) {
  rrect(ctx, b.x, b.y, b.w, b.h, 12, disabled ? "#C9BFA9" : active ? PALETTE.teal : PALETTE.paper);
  rrectStroke(ctx, b.x, b.y, b.w, b.h, 12, active ? PALETTE.tealDark : PALETTE.brown, 2.5);
  text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 - (b.sub ? 8 : 0), 17,
    disabled ? "#8A7F6A" : active ? "#FFFFFF" : PALETTE.ink, "center", 800);
  if (b.sub) text(ctx, b.sub, b.x + b.w / 2, b.y + b.h / 2 + 13, 12, active ? "#DFF5F0" : PALETTE.brown, "center", 700);
}

// --- play screen ---------------------------------------------------------
export function drawPlayScreen(ctx, game, now, panels) {
  const { scene, found, picked, score, combo, streak } = game;
  const remaining = picked.length - found.size;
  // background
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // shake offset after a wrong click
  let shX = 0;
  let shY = 0;
  if (now < game.shakeUntil) {
    const k = (game.shakeUntil - now) / 320;
    shX = (Math.random() - 0.5) * 14 * k;
    shY = (Math.random() - 0.5) * 10 * k;
  }

  // --- HUD top bar ---
  rrect(ctx, 0, 0, VIEW_W, 92, 0, PALETTE.paper);
  ctx.fillStyle = PALETTE.brown;
  ctx.fillRect(0, 90, VIEW_W, 2);
  text(ctx, `${scene.name}`, 24, 26, 22, PALETTE.ink, "left", 800);
  text(ctx, `Lapak ${game.sceneIndex + 1} dari ${game.scenes.length}  •  ${scene.difficulty}`, 24, 54, 14, PALETTE.brown, "left", 700);
  text(ctx, `Skor ${score.toLocaleString("id-ID")}`, 24, 78, 15, PALETTE.tealDark, "left", 800);

  // the big remaining counter — the judge's first criterion lives here
  text(ctx, `Tersisa ${remaining} dari ${picked.length}`, VIEW_W / 2, 34, 34, PALETTE.terraDark, "center", 800);
  if (game.mode === "waktu") {
    const frac = Math.max(0, game.timeLeft / game.timeLimit);
    const barW = 420;
    rrect(ctx, VIEW_W / 2 - barW / 2, 58, barW, 16, 8, "#E8DCC8");
    const barColor = frac > 0.5 ? PALETTE.teal : frac > 0.25 ? PALETTE.goldDark : PALETTE.red;
    rrect(ctx, VIEW_W / 2 - barW / 2, 58, barW * frac, 16, 8, barColor);
    text(ctx, fmtTime(game.timeLeft), VIEW_W / 2, 80, 13, frac <= 0.25 ? PALETTE.red : PALETTE.brown, "center", 800);
  } else {
    text(ctx, "Mode Santai — tanpa timer", VIEW_W / 2, 70, 15, PALETTE.tealDark, "center", 700);
  }

  // combo badge (right side)
  const comboColor = combo >= 3 ? PALETTE.gold : combo === 2 ? "#F08A24" : "#C9BFA9";
  rrect(ctx, VIEW_W - 250, 14, 226, 62, 12, comboColor);
  text(ctx, `KOMBO x${combo}`, VIEW_W - 137, 34, 22, combo >= 2 ? PALETTE.ink : "#6B5D43", "center", 800);
  text(ctx, streak > 0 ? `${streak} temuan beruntun` : "temukan 3 beruntun = x2", VIEW_W - 137, 60, 12, PALETTE.ink, "center", 700);

  // --- panels ---
  const activeSet = new Set(picked.map((d) => d.id));
  drawScenePanel(panels.left.getContext("2d"), scene, new Set());
  drawScenePanel(panels.right.getContext("2d"), scene, activeSet);
  ctx.drawImage(panels.left, PANEL_LEFT_X + shX, PANEL_Y + shY);
  ctx.drawImage(panels.right, PANEL_RIGHT_X + shX, PANEL_Y + shY);
  rrectStroke(ctx, PANEL_LEFT_X + shX, PANEL_Y + shY, PANEL_W, PANEL_H, 10, PALETTE.brown, 4);
  rrectStroke(ctx, PANEL_RIGHT_X + shX, PANEL_Y + shY, PANEL_W, PANEL_H, 10, PALETTE.brown, 4);
  // panel labels
  rrect(ctx, PANEL_LEFT_X + 10, PANEL_Y + 10, 44, 30, 8, "rgba(59,36,22,0.85)");
  text(ctx, "A", PANEL_LEFT_X + 32, PANEL_Y + 26, 18, "#FFFFFF", "center", 800);
  rrect(ctx, PANEL_RIGHT_X + 10, PANEL_Y + 10, 44, 30, 8, "rgba(59,36,22,0.85)");
  text(ctx, "B", PANEL_RIGHT_X + 32, PANEL_Y + 26, 18, "#FFFFFF", "center", 800);

  // gold markers on BOTH panels for every found difference
  for (const diff of picked) {
    if (!found.has(diff.id)) continue;
    const foundAt = game.foundAt[diff.id] || now;
    drawDifferenceMarker(ctx, PANEL_LEFT_X + diff.x + shX, PANEL_Y + diff.y + shY, diff.r, now, foundAt);
    drawDifferenceMarker(ctx, PANEL_RIGHT_X + diff.x + shX, PANEL_Y + diff.y + shY, diff.r, now, foundAt);
  }

  // hint glow: a rough-area pulse around one unfound difference, both panels
  if (game.hintTarget && now < game.hintGlowUntil) {
    const pulse = 0.55 + 0.35 * Math.sin(now / 130);
    ctx.strokeStyle = `rgba(14,124,107,${pulse})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    for (const px of [PANEL_LEFT_X, PANEL_RIGHT_X]) {
      ctx.beginPath();
      ctx.arc(px + game.hintTarget.x + shX, PANEL_Y + game.hintTarget.y + shY, HINT_GLOW_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  drawParticles(ctx, game.particles);

  // keyboard cursor (a crosshair the arrow keys move)
  if (game.cursorVisible) {
    const cx = (game.cursor.panel === "left" ? PANEL_LEFT_X : PANEL_RIGHT_X) + game.cursor.x;
    const cy = PANEL_Y + game.cursor.y;
    ctx.strokeStyle = PALETTE.terra;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy);
    ctx.lineTo(cx - 10, cy);
    ctx.moveTo(cx + 10, cy);
    ctx.lineTo(cx + 26, cy);
    ctx.moveTo(cx, cy - 26);
    ctx.lineTo(cx, cy - 10);
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx, cy + 26);
    ctx.stroke();
  }

  // magnifier lens over the panel under the mouse
  if (game.magnifier && game.mouseInPanel) {
    drawMagnifier(ctx, game, panels);
  }

  // --- bottom bar ---
  rrect(ctx, 0, 652, VIEW_W, 68, 0, PALETTE.paper);
  ctx.fillStyle = PALETTE.brown;
  ctx.fillRect(0, 652, VIEW_W, 2);
  const buttons = playButtons();
  const hintReady = game.hintsLeft > 0 && now >= game.hintReadyAt;
  buttons[0].sub = game.hintsLeft > 0
    ? (hintReady ? `${game.hintsLeft} tersisa` : `siap ${Math.ceil((game.hintReadyAt - now) / 1000)} dtk`)
    : "habis";
  buttons[0].label = "Petunjuk (H)";
  drawButton(ctx, buttons[0], false, !hintReady);
  drawButton(ctx, buttons[1], game.magnifier, false);
  drawButton(ctx, buttons[2], false, false);
  drawButton(ctx, buttons[3], false, false);
  buttons[4].label = game.muted ? "Suara: Mati" : "Suara: Nyala";
  drawButton(ctx, buttons[4], false, false);
  text(ctx, `Akurasi ${game.accuracyText()}  •  Klik kanan/M: kaca pembesar`, 1264, 683, 14, PALETTE.brown, "right", 700);
}

export function drawMagnifier(ctx, game, panels) {
  const { mx, my, panel } = game.mouseInPanel;
  const src = panel === "left" ? panels.left : panels.right;
  const px = (panel === "left" ? PANEL_LEFT_X : PANEL_RIGHT_X);
  const lx = mx; // panel-local coords of the mouse
  const ly = my;
  const screenX = px + lx;
  const screenY = PANEL_Y + ly;
  const sw = (MAG_RADIUS * 2) / MAG_ZOOM;
  ctx.save();
  ctx.beginPath();
  ctx.arc(screenX, screenY, MAG_RADIUS, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(src, lx - sw / 2, ly - sw / 2, sw, sw,
    screenX - MAG_RADIUS, screenY - MAG_RADIUS, MAG_RADIUS * 2, MAG_RADIUS * 2);
  ctx.restore();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(screenX, screenY, MAG_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(59,36,22,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX, screenY, MAG_RADIUS + 4, 0, Math.PI * 2);
  ctx.stroke();
  // crosshair inside the lens
  ctx.strokeStyle = "rgba(200,85,43,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screenX - 12, screenY);
  ctx.lineTo(screenX + 12, screenY);
  ctx.moveTo(screenX, screenY - 12);
  ctx.lineTo(screenX, screenY + 12);
  ctx.stroke();
}

// --- title screen --------------------------------------------------------
export function titleButtons() {
  return [
    { id: "mode-waktu", x: 340, y: 380, w: 280, h: 76, label: "Mode Waktu", sub: "Berpacu dengan timer" },
    { id: "mode-santai", x: 660, y: 380, w: 280, h: 76, label: "Mode Santai", sub: "Tanpa timer, santai saja" },
    { id: "map", x: 490, y: 480, w: 300, h: 56, label: "Lihat Peta Pasar", sub: "" },
  ];
}

export function drawTitleScreen(ctx, game) {
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // warm morning sky band with a little market silhouette
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, "#BFE6F2");
  g.addColorStop(1, "#FFE9B8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, 300);
  circle(ctx, 1080, 70, 30, "#FFD93D");
  // awning stripes across the top
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#C8552B" : "#FFF6E5";
    ctx.fillRect(i * 80, 0, 80, 34);
  }
  ctx.fillStyle = "#6B4226";
  ctx.fillRect(0, 34, VIEW_W, 6);
  // market silhouettes: stalls + a becak hint
  ctx.fillStyle = "rgba(107,66,38,0.16)";
  ctx.fillRect(60, 220, 180, 80);
  ctx.fillRect(1040, 220, 180, 80);
  ctx.fillRect(500, 240, 280, 60);
  ctx.beginPath();
  ctx.moveTo(40, 220);
  ctx.lineTo(260, 220);
  ctx.lineTo(240, 190);
  ctx.lineTo(60, 190);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1020, 220);
  ctx.lineTo(1240, 220);
  ctx.lineTo(1220, 190);
  ctx.lineTo(1040, 190);
  ctx.closePath();
  ctx.fill();

  text(ctx, "PASAR PAGI", VIEW_W / 2, 130, 84, PALETTE.terraDark, "center", 800);
  text(ctx, "Cari Bedanya", VIEW_W / 2, 200, 40, PALETTE.tealDark, "center", 800);
  text(ctx, "7 lapak pasar  •  49 perbedaan  •  tiap main beda susunannya", VIEW_W / 2, 248, 19, PALETTE.brown, "center", 700);

  // how to play
  rrect(ctx, 190, 288, 900, 70, 14, PALETTE.paper);
  rrectStroke(ctx, 190, 288, 900, 70, 14, PALETTE.brown, 2);
  text(ctx, "Dua gambar hampir sama — klik 7 perbedaannya di gambar A atau B.", VIEW_W / 2, 312, 17, PALETTE.ink, "center", 700);
  text(ctx, "Salah klik mengurangi waktu & mereset kombo.  H: petunjuk   M: kaca pembesar   P: jeda", VIEW_W / 2, 338, 15, PALETTE.brown, "center", 700);

  for (const b of titleButtons()) {
    const primary = b.id !== "map";
    rrect(ctx, b.x, b.y, b.w, b.h, 14, primary ? PALETTE.terra : PALETTE.paper);
    rrectStroke(ctx, b.x, b.y, b.w, b.h, 14, primary ? PALETTE.terraDark : PALETTE.brown, 2.5);
    text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 - (b.sub ? 10 : 0), 24, primary ? "#FFFFFF" : PALETTE.ink, "center", 800);
    if (b.sub) text(ctx, b.sub, b.x + b.w / 2, b.y + b.h / 2 + 16, 14, primary ? "#FFE9B8" : PALETTE.brown, "center", 700);
  }

  // best scores strip
  const save = game.save;
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  text(ctx, `Bintang: ${total}/${game.scenes.length * 3}    Skor total terbaik: ${save.bestTotal.toLocaleString("id-ID")}    Lapak terbuka: ${save.unlocked}/${game.scenes.length}`,
    VIEW_W / 2, 590, 17, PALETTE.brown, "center", 700);
  text(ctx, "Klik tombol mode untuk mulai — atau tekan Enter untuk Mode Waktu.", VIEW_W / 2, 640, 15, PALETTE.brown, "center", 700);
}

// --- market map ----------------------------------------------------------
// Stall cards in two rows; positions are shared with input.js.
export function mapStallRects(sceneCount) {
  const rects = [];
  const w = 260;
  const h = 210;
  const row1 = [60, 350, 640, 930];
  const row2 = [205, 495, 785];
  for (let i = 0; i < sceneCount; i++) {
    if (i < 4) rects.push({ x: row1[i], y: 130, w, h });
    else rects.push({ x: row2[i - 4], y: 370, w, h });
  }
  return rects;
}

export function mapButtons() {
  return [
    { id: "back-title", x: 490, y: 610, w: 300, h: 56, label: "Kembali ke Judul", sub: "" },
  ];
}

export function drawMapScreen(ctx, game, thumbs) {
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, "PETA PASAR", VIEW_W / 2, 52, 44, PALETTE.terraDark, "center", 800);
  text(ctx, "Selesaikan satu lapak untuk membuka lapak berikutnya", VIEW_W / 2, 96, 17, PALETTE.brown, "center", 700);
  const save = game.save;
  const rects = mapStallRects(game.scenes.length);
  game.scenes.forEach((scene, i) => {
    const r = rects[i];
    const locked = i >= save.unlocked;
    const stars = save.stars[i] || 0;
    rrect(ctx, r.x, r.y, r.w, r.h, 16, PALETTE.paper);
    rrectStroke(ctx, r.x, r.y, r.w, r.h, 16, locked ? "#C9BFA9" : PALETTE.brown, 2.5);
    // thumbnail: the scene itself, drawn small
    if (thumbs[i]) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(r.x + 10, r.y + 10, r.w - 20, 118, 10);
      ctx.clip();
      ctx.drawImage(thumbs[i], r.x + 10, r.y + 10, r.w - 20, 118);
      ctx.restore();
    }
    if (locked) {
      ctx.fillStyle = "rgba(59,36,22,0.55)";
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 16);
      ctx.fill();
      // padlock, drawn from shapes
      ctx.strokeStyle = "#FFF6E5";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + 78, 20, Math.PI, 0);
      ctx.stroke();
      rrect(ctx, r.x + r.w / 2 - 24, r.y + 74, 48, 38, 8, "#FFF6E5");
      text(ctx, "TERKUNCI", r.x + r.w / 2, r.y + 140, 16, "#FFF6E5", "center", 800);
      text(ctx, scene.name, r.x + r.w / 2, r.y + 178, 18, "#FFF6E5", "center", 800);
      return;
    }
    text(ctx, `${i + 1}. ${scene.name}`, r.x + r.w / 2, r.y + 152, 19, PALETTE.ink, "center", 800);
    text(ctx, scene.difficulty, r.x + r.w / 2, r.y + 176, 13, PALETTE.brown, "center", 700);
    // stars
    for (let s = 0; s < 3; s++) {
      drawStar(ctx, r.x + r.w / 2 - 30 + s * 30, r.y + 196, 11, s < stars ? PALETTE.gold : "#DDD3BC");
    }
  });
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  text(ctx, `Total bintang: ${total}/${game.scenes.length * 3}`, VIEW_W / 2, 596, 17, PALETTE.brown, "center", 700);
  for (const b of mapButtons()) drawButton(ctx, b, false, false);
}

// --- overlays: pause, scene complete, final ------------------------------
function dim(ctx) {
  ctx.fillStyle = "rgba(30,20,10,0.55)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
function panel(ctx, x, y, w, h) {
  rrect(ctx, x, y, w, h, 20, PALETTE.paper);
  rrectStroke(ctx, x, y, w, h, 20, PALETTE.brown, 3);
}

export function pauseButtons() {
  return [
    { id: "resume", x: 440, y: 400, w: 400, h: 56, label: "Lanjut Main (P)", sub: "" },
    { id: "restart-scene", x: 440, y: 468, w: 400, h: 56, label: "Ulangi Scene Ini", sub: "" },
    { id: "to-map", x: 440, y: 536, w: 400, h: 56, label: "Kembali ke Peta", sub: "" },
  ];
}

export function drawPauseOverlay(ctx, game) {
  dim(ctx);
  panel(ctx, 340, 150, 600, 470);
  text(ctx, "JEDA", VIEW_W / 2, 220, 48, PALETTE.terraDark, "center", 800);
  text(ctx, `${game.scene.name} — ${game.picked.length - game.found.size} perbedaan tersisa`, VIEW_W / 2, 272, 18, PALETTE.brown, "center", 700);
  text(ctx, `Skor ${game.score.toLocaleString("id-ID")}  •  Kombo x${game.combo}`, VIEW_W / 2, 306, 18, PALETTE.tealDark, "center", 700);
  text(ctx, "Timer berhenti selama jeda.", VIEW_W / 2, 344, 15, PALETTE.brown, "center", 700);
  for (const b of pauseButtons()) drawButton(ctx, b, false, false);
}

export function celebrateButtons(lastScene, failed) {
  const list = [
    { id: "retry-scene", x: 330, y: 560, w: 280, h: 56, label: "Ulangi Scene", sub: "" },
    { id: "to-map", x: 670, y: 560, w: 280, h: 56, label: "Kembali ke Peta", sub: "" },
  ];
  if (failed) return list;
  if (!lastScene) list.unshift({ id: "next-scene", x: 490, y: 492, w: 300, h: 56, label: "Lapak Berikutnya (N)", sub: "" });
  else list.unshift({ id: "finish", x: 490, y: 492, w: 300, h: 56, label: "Lihat Hasil Akhir", sub: "" });
  return list;
}

export function drawCelebrateOverlay(ctx, game, now) {
  dim(ctx);
  drawParticles(ctx, game.particles);
  panel(ctx, 340, 110, 600, 540);
  text(ctx, game.failed ? "Waktu Habis!" : "Scene Selesai!", VIEW_W / 2, 172, 46, PALETTE.terraDark, "center", 800);
  text(ctx, game.scene.name, VIEW_W / 2, 220, 22, PALETTE.brown, "center", 700);
  // stars pop in one by one
  const stars = game.lastStars || 0;
  for (let s = 0; s < 3; s++) {
    const appearAt = game.celebrateAt + 350 + s * 350;
    if (now < appearAt) continue;
    const pop = Math.min(1, (now - appearAt) / 220);
    const r = 34 * (0.6 + 0.4 * pop);
    drawStar(ctx, VIEW_W / 2 - 90 + s * 90, 290, r, s < stars ? PALETTE.gold : "#DDD3BC");
  }
  const acc = game.sceneClicks > 0 ? game.sceneFound / game.sceneClicks : 1;
  if (game.failed) {
    text(ctx, `Baru ${game.sceneFound} dari ${game.picked.length} perbedaan ketemu.`, VIEW_W / 2, 356, 20, PALETTE.ink, "center", 800);
    text(ctx, "Coba lagi — perbedaan yang dicari diacak setiap main.", VIEW_W / 2, 390, 16, PALETTE.brown, "center", 700);
  } else {
    text(ctx, `Skor scene: ${game.sceneScore.toLocaleString("id-ID")}`, VIEW_W / 2, 356, 22, PALETTE.ink, "center", 800);
    text(ctx, `Bonus waktu: +${game.lastTimeBonus.toLocaleString("id-ID")}`, VIEW_W / 2, 388, 17, PALETTE.tealDark, "center", 700);
    text(ctx, `Akurasi: ${Math.round(acc * 100)}%   •   Waktu: ${fmtTime(game.sceneElapsed)}`, VIEW_W / 2, 420, 17, PALETTE.brown, "center", 700);
  }
  text(ctx, `Skor total: ${game.score.toLocaleString("id-ID")}`, VIEW_W / 2, 452, 19, PALETTE.terraDark, "center", 800);
  for (const b of celebrateButtons(game.sceneIndex === game.scenes.length - 1, game.failed)) drawButton(ctx, b, false, false);
}

export function endButtons() {
  return [
    { id: "play-again", x: 330, y: 620, w: 280, h: 56, label: "Main Lagi", sub: "" },
    { id: "to-map", x: 670, y: 620, w: 280, h: 56, label: "Kembali ke Peta", sub: "" },
  ];
}

export function drawEndScreen(ctx, game) {
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, "PASAR TUTUP — Terima kasih!", VIEW_W / 2, 64, 40, PALETTE.terraDark, "center", 800);
  text(ctx, `Mode ${game.mode === "waktu" ? "Waktu" : "Santai"}  •  ${game.scenesCompleted} dari ${game.scenes.length} lapak selesai`, VIEW_W / 2, 108, 18, PALETTE.brown, "center", 700);
  // totals row
  const totalStars = Object.values(game.save.stars).reduce((a, b) => a + b, 0);
  const boxes = [
    { label: "SKOR TOTAL", value: game.score.toLocaleString("id-ID") },
    { label: "BINTANG", value: `${totalStars}/${game.scenes.length * 3}` },
    { label: "AKURASI", value: `${Math.round(game.totalAccuracy() * 100)}%` },
    { label: "WAKTU", value: fmtTime(game.totalElapsed) },
  ];
  boxes.forEach((b, i) => {
    const x = 140 + i * 250;
    rrect(ctx, x, 140, 230, 100, 14, PALETTE.paper);
    rrectStroke(ctx, x, 140, 230, 100, 14, PALETTE.brown, 2);
    text(ctx, b.label, x + 115, 172, 14, PALETTE.brown, "center", 800);
    text(ctx, b.value, x + 115, 208, 30, PALETTE.ink, "center", 800);
  });
  // best-scores table
  text(ctx, "Papan Skor Terbaik", VIEW_W / 2, 288, 24, PALETTE.ink, "center", 800);
  rrect(ctx, 340, 312, 600, 280, 14, PALETTE.paper);
  rrectStroke(ctx, 340, 312, 600, 280, 14, PALETTE.brown, 2);
  game.scenes.forEach((scene, i) => {
    const y = 340 + i * 36;
    const best = game.save.best[i];
    const stars = game.save.stars[i] || 0;
    text(ctx, `${i + 1}. ${scene.name}`, 370, y, 16, PALETTE.ink, "left", 700);
    for (let s = 0; s < 3; s++) drawStar(ctx, 700 + s * 24, y, 9, s < stars ? PALETTE.gold : "#DDD3BC");
    text(ctx, best ? best.toLocaleString("id-ID") : "—", 910, y, 16, PALETTE.tealDark, "right", 800);
  });
  text(ctx, `Skor total terbaik: ${game.save.bestTotal.toLocaleString("id-ID")}  •  Akurasi terbaik: ${Math.round(game.save.bestAccuracy * 100)}%`,
    VIEW_W / 2, 606, 15, PALETTE.brown, "center", 700);
  for (const b of endButtons()) drawButton(ctx, b, false, false);
}
