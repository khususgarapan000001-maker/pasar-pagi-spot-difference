// scenes.js — the seven market scenes and their difference pools.
// Every scene is drawn procedurally on canvas (no image assets at all).
// A scene's draw() takes `on`, the set of difference ids applied to THIS
// panel: the left panel always draws the base scene (empty set), the right
// panel draws it with the 7 chosen differences applied. Each difference is
// a small, fair change — present/absent, a colour swap, a count, a move, a
// rotation or a shadow — never a whole object redrawn differently.
//
// Coordinates are panel-local: the panel is 600 x 540.
import { PALETTE } from "./config.js";

// --- tiny drawing helpers shared by all scenes -------------------------
function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function rrect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
function line(ctx, x1, y1, x2, y2, w, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px 'Trebuchet MS', Verdana, sans-serif`;
  ctx.textAlign = align || "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}
function sky(ctx, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
function sun(ctx, x, y, r, rays) {
  ctx.strokeStyle = "#F2B705";
  ctx.lineWidth = 4;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    line(ctx, x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6),
      x + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16), 4, "#F2B705");
  }
  circle(ctx, x, y, r, "#FFD93D");
}
function cloud(ctx, x, y, s, color) {
  ctx.fillStyle = color || "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 22 * s, y - 8 * s, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 44 * s, y, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 22 * s, y + 8 * s, 18 * s, 0, Math.PI * 2);
  ctx.fill();
}
// A striped market awning across the top of the scene.
function awning(ctx, w, y, h, colorA, colorB) {
  const stripes = 10;
  const sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.beginPath();
    ctx.moveTo(i * sw, y);
    ctx.lineTo((i + 1) * sw, y);
    ctx.lineTo((i + 1) * sw, y + h);
    ctx.quadraticCurveTo((i + 0.5) * sw, y + h + 14, i * sw, y + h);
    ctx.closePath();
    ctx.fill();
  }
  rect(ctx, 0, y - 6, w, 8, "#6B4226");
}
function ground(ctx, w, h, y, color) {
  rect(ctx, 0, y, w, h - y, color);
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 2;
  for (let gy = y + 26; gy < h; gy += 26) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }
}
function fruitPile(ctx, cx, cy, r, color, count, dark) {
  const spots = [
    [0, 0], [-r * 1.1, r * 0.5], [r * 1.1, r * 0.5], [-r * 0.55, -r * 0.9],
    [r * 0.55, -r * 0.9], [0, -r * 1.7], [-r * 1.6, -r * 0.4], [r * 1.6, -r * 0.4],
  ];
  for (let i = 0; i < Math.min(count, spots.length); i++) {
    const [dx, dy] = spots[i];
    circle(ctx, cx + dx, cy + dy, r, i === 0 && dark ? dark : color);
    circle(ctx, cx + dx - r * 0.3, cy + dy - r * 0.3, r * 0.28, "rgba(255,255,255,0.5)");
  }
}

// --- Scene 1: Lapau Buah (fruit stall) ----------------------------------
function drawFruitStall(ctx, W, H, on) {
  sky(ctx, W, H, "#BFE6F2", "#FFE9B8");
  sun(ctx, 525, 62, 26, 8);
  if (!on.has("awan-hilang")) cloud(ctx, 105, 70, 1.1);
  cloud(ctx, 330, 45, 0.8);
  ground(ctx, W, H, 430, "#D9B98A");
  // stall posts + awning
  rect(ctx, 36, 108, 14, 330, "#6B4226");
  rect(ctx, 550, 108, 14, 330, "#6B4226");
  awning(ctx, W, 66, 44, on.has("awning-warna") ? "#0E7C6B" : "#C8552B", "#FFF6E5");
  // wooden counter
  rrect(ctx, 60, 330, 480, 110, 10, "#8A5A33");
  rrect(ctx, 60, 330, 480, 18, 8, "#A9743F");
  // fruit piles on the counter
  fruitPile(ctx, 150, 305, 17, "#D64541", on.has("apel-hilang") ? 4 : 5);
  if (on.has("daun-apel")) {
    ellipse(ctx, 186, 262, 10, 5, "#4C9A2A");
    line(ctx, 182, 266, 176, 276, 3, "#3E7A22");
  }
  fruitPile(ctx, 300, 305, 17, "#F08A24", 5);
  if (on.has("jeruk-hijau")) circle(ctx, 300, 305, 17, "#7CB342");
  // bananas
  ctx.strokeStyle = "#F2C230";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  const bananaCount = on.has("pisang-tambah") ? 4 : 3;
  for (let i = 0; i < bananaCount; i++) {
    ctx.beginPath();
    ctx.arc(450 + i * 8, 295 - i * 6, 26, 0.25 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  // price board
  rrect(ctx, 252, 210, 96, 52, 6, "#3B2416");
  text(ctx, "MANGGA", 300, 226, 13, "#FFF6E5", "center", 800);
  text(ctx, on.has("harga-ubah") ? "8rb" : "5rb", 300, 246, 18, "#F2B705", "center", 800);
  // hanging scale
  if (!on.has("timbangan-hilang")) {
    line(ctx, 520, 110, 520, 160, 3, "#3B2416");
    circle(ctx, 520, 178, 16, "#E8D8B0");
    ctx.strokeStyle = "#3B2416";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(520, 178, 16, 0, Math.PI * 2);
    ctx.stroke();
    line(ctx, 520, 178, 528, 168, 2, "#D64541");
    line(ctx, 520, 194, 505, 214, 2, "#3B2416");
    line(ctx, 520, 194, 535, 214, 2, "#3B2416");
    ellipse(ctx, 520, 218, 20, 6, "#C8552B");
  }
  // basket on the ground
  if (!on.has("keranjang-hilang")) {
    rrect(ctx, 62, 452, 62, 40, 8, "#B07A3F");
    ctx.strokeStyle = "#8A5A33";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) line(ctx, 62, 462 + i * 10, 124, 462 + i * 10, 3, "#8A5A33");
    circle(ctx, 80, 450, 10, "#7CB342");
    circle(ctx, 104, 448, 11, "#D64541");
  }
  // little hand cart, right side
  rect(ctx, 470, 452, 100, 10, "#6B4226");
  rect(ctx, 478, 424, 84, 30, "#C8552B");
  if (!on.has("roda-hilang")) {
    circle(ctx, 540, 472, 14, "#3B2416");
    circle(ctx, 540, 472, 6, "#E8D8B0");
  }
  circle(ctx, 486, 472, 14, "#3B2416");
  circle(ctx, 486, 472, 6, "#E8D8B0");
}

const FRUIT_DIFFS = [
  { id: "apel-hilang", x: 150, y: 300, r: 30, label: "Satu apel hilang" },
  { id: "awning-warna", x: 300, y: 88, r: 32, label: "Warna tenda berubah" },
  { id: "pisang-tambah", x: 462, y: 292, r: 26, label: "Pisang bertambah" },
  { id: "harga-ubah", x: 300, y: 236, r: 26, label: "Harga di papan berubah" },
  { id: "timbangan-hilang", x: 520, y: 186, r: 30, label: "Timbangan gantung hilang" },
  { id: "jeruk-hijau", x: 300, y: 305, r: 26, label: "Satu jeruk jadi hijau" },
  { id: "keranjang-hilang", x: 93, y: 468, r: 32, label: "Keranjang di lantai hilang" },
  { id: "awan-hilang", x: 115, y: 70, r: 32, label: "Awan hilang" },
  { id: "daun-apel", x: 184, y: 266, r: 18, label: "Daun muncul di tumpukan apel" },
  { id: "roda-hilang", x: 540, y: 472, r: 22, label: "Roda gerobak hilang" },
];

// --- Scene 2: Kain Batik (batik cloth stall) ----------------------------
function kawung(ctx, cx, cy, r, color, missing) {
  const pts = [[0, 0], [-r, -r], [r, -r], [-r, r], [r, r], [0, -r * 2], [0, r * 2]];
  pts.forEach(([dx, dy], i) => {
    if (missing && i === 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  });
}
function parang(ctx, x, y, w, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  for (let i = -2; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 28, y + h);
    ctx.quadraticCurveTo(x + i * 28 + 26, y + h * 0.5, x + i * 28 + 10, y);
    ctx.stroke();
  }
}
function megaMendung(ctx, cx, cy, r, color, flipped) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  const dir = flipped ? -1 : 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = cx + (col - 1) * r * 1.4;
      const y = cy + (row - 1) * r * 1.1;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.5, dir > 0 ? Math.PI : 0, dir > 0 ? 0 : Math.PI);
      ctx.stroke();
    }
  }
}
function drawBatik(ctx, W, H, on) {
  sky(ctx, W, H, "#F7E7C3", "#EFD9A7");
  ground(ctx, W, H, 470, "#C9A06B");
  // wooden rod with hanging cloths
  rect(ctx, 30, 96, 540, 10, "#6B4226");
  if (!on.has("kancing-hilang")) circle(ctx, 300, 88, 7, "#F2B705");
  // cloth 1: kawung brown
  rrect(ctx, 70, 106, 130, 210, 6, "#F3E2C7");
  kawung(ctx, 135, 210, 24, "#8A5A33", on.has("motif-hilang"));
  // cloth 2: parang teal (or purple)
  rrect(ctx, 235, 106, 130, 210, 6, on.has("kain-warna") ? "#7E57C2" : "#0E7C6B");
  parang(ctx, 235, 120, 130, 180, "rgba(255,246,229,0.85)");
  // cloth 3: mega mendung blue
  rrect(ctx, 400, 106, 130, 210, 6, "#2E5E8C");
  megaMendung(ctx, 465, 210, 22, "#BFE6F2", on.has("pola-putar"));
  // table with folded cloth stacks
  rrect(ctx, 60, 360, 480, 110, 10, "#8A5A33");
  const folds = on.has("lipatan-tambah") ? 4 : 3;
  for (let i = 0; i < folds; i++) {
    rrect(ctx, 400 + i * 2, 340 - i * 14, 110, 14, 4, ["#C8552B", "#0E7C6B", "#F2B705", "#7E57C2"][i]);
  }
  rrect(ctx, 90, 340, 120, 16, 4, "#D64541");
  rrect(ctx, 90, 356, 120, 16, 4, "#2E5E8C");
  // price tag on the table
  rrect(ctx, 170, 330, 64, 26, 5, "#FFFDF6");
  text(ctx, on.has("label-harga") ? "45rb" : "35rb", 202, 344, 14, "#3B2416", "center", 800);
  // thread spools
  const spoolColors = ["#D64541", "#F2B705", "#0E7C6B"];
  spoolColors.forEach((c, i) => {
    const sx = 110 + i * 34;
    rrect(ctx, sx, 408, 22, 34, 4, on.has("benang-warna") && i === 1 ? "#7E57C2" : c);
    rect(ctx, sx - 3, 404, 28, 6, "#E8D8B0");
    rect(ctx, sx - 3, 440, 28, 6, "#E8D8B0");
  });
  // scissors on the table
  if (!on.has("gunting-hilang")) {
    circle(ctx, 512, 300, 8, "#B9C4CC");
    circle(ctx, 532, 300, 8, "#B9C4CC");
    line(ctx, 518, 296, 542, 268, 4, "#8A97A3");
    line(ctx, 526, 296, 502, 268, 4, "#8A97A3");
  }
  // woven bag on the floor
  if (!on.has("tas-hilang")) {
    rrect(ctx, 66, 478, 52, 42, 8, "#B07A3F");
    ctx.strokeStyle = "#8A5A33";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(92, 478, 18, Math.PI, 0);
    ctx.stroke();
  }
  // potted plant
  rrect(ctx, 512, 478, 44, 36, 6, "#C8552B");
  ellipse(ctx, 524, 462, 8, 18, "#4C9A2A");
  ellipse(ctx, 544, 466, 8, 16, "#4C9A2A");
  if (!on.has("daun-tanaman")) ellipse(ctx, 534, 452, 8, 18, "#5CB531");
}
const BATIK_DIFFS = [
  { id: "motif-hilang", x: 159, y: 186, r: 26, label: "Satu motif kawung hilang" },
  { id: "kain-warna", x: 300, y: 210, r: 32, label: "Kain tengah berubah warna" },
  { id: "lipatan-tambah", x: 455, y: 306, r: 24, label: "Lipatan kain bertambah" },
  { id: "gunting-hilang", x: 522, y: 288, r: 24, label: "Gunting hilang" },
  { id: "kancing-hilang", x: 300, y: 88, r: 16, label: "Peniti di batang hilang" },
  { id: "benang-warna", x: 144, y: 424, r: 22, label: "Benang berubah warna" },
  { id: "daun-tanaman", x: 534, y: 452, r: 20, label: "Daun tanaman hilang" },
  { id: "pola-putar", x: 465, y: 210, r: 28, label: "Motif mega mendung terbalik" },
  { id: "tas-hilang", x: 92, y: 498, r: 28, label: "Tas anyaman hilang" },
  { id: "label-harga", x: 202, y: 343, r: 22, label: "Harga di label berubah" },
];

// --- Scene 3: Becak & Kucing (the cover scene) --------------------------
function drawCat(ctx, x, y, s, tailUp) {
  ctx.fillStyle = "#E8A33D";
  ctx.beginPath();
  ctx.ellipse(x, y, 22 * s, 16 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, x + 20 * s, y - 14 * s, 12 * s, "#E8A33D");
  // ears
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y - 22 * s);
  ctx.lineTo(x + 16 * s, y - 32 * s);
  ctx.lineTo(x + 22 * s, y - 23 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 22 * s, y - 24 * s);
  ctx.lineTo(x + 30 * s, y - 32 * s);
  ctx.lineTo(x + 31 * s, y - 21 * s);
  ctx.closePath();
  ctx.fill();
  // tail: up-curl or down-curl
  ctx.strokeStyle = "#E8A33D";
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.moveTo(x - 20 * s, y - 2 * s);
  if (tailUp) ctx.quadraticCurveTo(x - 34 * s, y - 22 * s, x - 26 * s, y - 34 * s);
  else ctx.quadraticCurveTo(x - 34 * s, y + 14 * s, x - 24 * s, y + 18 * s);
  ctx.stroke();
  circle(ctx, x + 24 * s, y - 16 * s, 2 * s, "#3B2416");
  // stripes
  ctx.strokeStyle = "#C77F1F";
  ctx.lineWidth = 2.5 * s;
  line(ctx, x - 6 * s, y - 14 * s, x - 6 * s, y - 6 * s, 2.5 * s, "#C77F1F");
  line(ctx, x + 2 * s, y - 15 * s, x + 2 * s, y - 7 * s, 2.5 * s, "#C77F1F");
}
function drawWheel(ctx, x, y, r, spokes) {
  ctx.strokeStyle = "#3B2416";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    line(ctx, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, 3, "#8A97A3");
  }
  circle(ctx, x, y, 7, "#C8552B");
}
function drawBecak(ctx, W, H, on) {
  sky(ctx, W, H, "#BFE6F2", "#FFE9B8");
  sun(ctx, 70, 60, 24, 8);
  cloud(ctx, 420, 55, 0.9);
  ground(ctx, W, H, 440, "#CBB28A");
  // shopfront behind
  rrect(ctx, 40, 60, 300, 200, 8, "#F3E2C7");
  rrect(ctx, 60, 84, 120, 44, 6, "#0E7C6B");
  text(ctx, on.has("papan-huruf") ? "TOKA" : "TOKO", 120, 107, 24, "#FFF6E5", "center", 800);
  rrect(ctx, 60, 150, 90, 80, 6, "#7FB3C8");
  line(ctx, 105, 150, 105, 230, 4, "#6B4226");
  line(ctx, 60, 190, 150, 190, 4, "#6B4226");
  // becak shadow (shifts when the diff is on)
  ellipse(ctx, on.has("bayangan") ? 330 : 290, 462, 190, 16, "rgba(59,36,22,0.25)");
  // becak body
  const canopy = on.has("kanopi-warna") ? "#F2B705" : "#C8552B";
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.moveTo(180, 210);
  ctx.quadraticCurveTo(280, 120, 380, 210);
  ctx.closePath();
  ctx.fill();
  line(ctx, 190, 212, 190, 300, 5, "#6B4226");
  line(ctx, 372, 212, 372, 300, 5, "#6B4226");
  // passenger seat + backrest
  rrect(ctx, 200, 300, 170, 60, 10, "#8A5A33");
  rrect(ctx, 200, 280, 170, 26, 8, "#A9743F");
  rrect(ctx, 350, 240, 20, 70, 8, "#8A5A33");
  // cat: on the seat, or on the ground when the diff is on
  if (on.has("kucing-pindah")) drawCat(ctx, 470, 428, 0.9, on.has("ekor-kucing"));
  else drawCat(ctx, 285, 272, 1, on.has("ekor-kucing"));
  // front: handlebar, bell, front wheel, pedals
  line(ctx, 380, 300, 430, 250, 6, "#3B2416");
  line(ctx, 418, 244, 448, 258, 6, "#3B2416");
  if (!on.has("bel-hilang")) circle(ctx, 432, 244, 7, "#F2B705");
  drawWheel(ctx, 448, 400, 52, 8);
  drawWheel(ctx, 180, 410, 46, on.has("roda-jeruji") ? 5 : 8);
  line(ctx, 380, 360, 448, 400, 6, "#3B2416");
  line(ctx, 200, 360, 180, 410, 6, "#3B2416");
  circle(ctx, 395, 380, 10, "#3B2416");
  // basket behind the seat
  if (!on.has("keranjang-hilang")) {
    rrect(ctx, 130, 320, 54, 40, 8, "#B07A3F");
    circle(ctx, 146, 318, 9, "#D64541");
    circle(ctx, 166, 316, 9, "#F08A24");
  }
  // lamp post
  rect(ctx, 516, 130, 10, 310, "#3B2416");
  circle(ctx, 521, 122, 20, "#3B2416");
  circle(ctx, 521, 122, 13, on.has("lampu-mati") ? "#8A97A3" : "#FFD93D");
  if (!on.has("lampu-mati")) {
    ctx.fillStyle = "rgba(255,217,61,0.25)";
    ctx.beginPath();
    ctx.arc(521, 122, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  // flower pot
  rrect(ctx, 548, 448, 40, 34, 6, "#C8552B");
  circle(ctx, 556, 440, 8, "#D64541");
  circle(ctx, 580, 438, 8, "#F2B705");
  if (!on.has("pot-bunga")) circle(ctx, 568, 428, 8, "#E86BA8");
  line(ctx, 556, 448, 556, 440, 3, "#4C9A2A");
  line(ctx, 580, 448, 580, 438, 3, "#4C9A2A");
}
const BECAK_DIFFS = [
  { id: "kucing-pindah", x: 285, y: 272, r: 32, label: "Kucing pindah tempat" },
  { id: "roda-jeruji", x: 180, y: 410, r: 30, label: "Jeruji roda berkurang" },
  { id: "kanopi-warna", x: 280, y: 168, r: 32, label: "Kanopi becak berubah warna" },
  { id: "lampu-mati", x: 521, y: 122, r: 26, label: "Lampu jalan padam" },
  { id: "papan-huruf", x: 120, y: 106, r: 26, label: "Satu huruf di papan toko berubah" },
  { id: "ekor-kucing", x: 258, y: 250, r: 22, label: "Ekor kucing berubah arah" },
  { id: "keranjang-hilang", x: 157, y: 338, r: 26, label: "Keranjang di becak hilang" },
  { id: "bel-hilang", x: 432, y: 244, r: 16, label: "Bel setang hilang" },
  { id: "bayangan", x: 330, y: 462, r: 30, label: "Bayangan becak bergeser" },
  { id: "pot-bunga", x: 568, y: 428, r: 20, label: "Satu bunga di pot hilang" },
];

// --- Scene 4: Warung Kopi (coffee stall) --------------------------------
function steam(ctx, x, y, curls) {
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (let i = 0; i < curls; i++) {
    const sx = x + (i - 1) * 16;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.quadraticCurveTo(sx + 8, y - 16, sx - 2, y - 30);
    ctx.quadraticCurveTo(sx - 10, y - 44, sx + 2, y - 56);
    ctx.stroke();
  }
}
function drawWarungKopi(ctx, W, H, on) {
  sky(ctx, W, H, "#F7E7C3", "#EFD9A7");
  ground(ctx, W, H, 470, "#B08D5E");
  // window with morning light
  rrect(ctx, 470, 90, 100, 130, 8, "#BFE6F2");
  line(ctx, 520, 90, 520, 220, 4, "#6B4226");
  line(ctx, 470, 155, 570, 155, 4, "#6B4226");
  if (!on.has("jendela")) {
    ctx.fillStyle = "#C8552B";
    ctx.beginPath();
    ctx.moveTo(470, 90);
    ctx.lineTo(505, 90);
    ctx.lineTo(470, 160);
    ctx.closePath();
    ctx.fill();
  }
  // poster on the wall
  if (!on.has("poster-hilang")) {
    rrect(ctx, 56, 120, 76, 104, 6, "#0E7C6B");
    circle(ctx, 94, 160, 20, "#F2B705");
    text(ctx, "KOPI", 94, 200, 15, "#FFF6E5", "center", 800);
  }
  // menu board
  rrect(ctx, 150, 96, 130, 110, 8, "#3B2416");
  text(ctx, "MENU", 215, 114, 15, "#F2B705", "center", 800);
  text(ctx, "Kopi Tubruk", 215, 140, 13, "#FFF6E5", "center", 700);
  text(ctx, on.has("menu-harga") ? "12rb" : "10rb", 215, 160, 14, "#F2B705", "center", 800);
  text(ctx, "Teh Manis  5rb", 215, 184, 13, "#FFF6E5", "center", 700);
  // wall clock
  circle(ctx, 470, 120, 34, "#FFFDF6");
  ctx.strokeStyle = "#3B2416";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(470, 120, 34, 0, Math.PI * 2);
  ctx.stroke();
  const hourAngle = on.has("jam-waktu") ? -0.9 : 0.5;
  line(ctx, 470, 120, 470 + Math.cos(hourAngle - Math.PI / 2) * 18, 120 + Math.sin(hourAngle - Math.PI / 2) * 18, 4, "#3B2416");
  line(ctx, 470, 120, 470 + 22, 120 - 12, 3, "#D64541");
  // hanging lamp
  line(ctx, 300, 0, 300, 70, 3, "#3B2416");
  ctx.fillStyle = on.has("lampu-warna") ? "#0E7C6B" : "#C8552B";
  ctx.beginPath();
  ctx.moveTo(268, 96);
  ctx.lineTo(332, 96);
  ctx.lineTo(314, 66);
  ctx.lineTo(286, 66);
  ctx.closePath();
  ctx.fill();
  circle(ctx, 300, 100, 8, "#FFD93D");
  // counter
  rrect(ctx, 60, 330, 480, 120, 10, "#8A5A33");
  rrect(ctx, 60, 330, 480, 18, 8, "#A9743F");
  // kettle with steam
  rrect(ctx, 330, 250, 70, 84, 10, "#8A97A3");
  circle(ctx, 365, 248, 10, "#6B767F");
  line(ctx, 330, 280, 306, 262, 6, "#8A97A3");
  if (!on.has("asap-hilang")) steam(ctx, 365, 238, 3);
  // cups row
  const cupCount = on.has("cangkir-tambah") ? 4 : 3;
  for (let i = 0; i < cupCount; i++) {
    const cx = 150 + i * 46;
    rrect(ctx, cx, 296, 32, 34, 6, ["#FFFDF6", "#F2B705", "#0E7C6B", "#D64541"][i]);
    ctx.strokeStyle = "#3B2416";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx + 34, 312, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }
  // spoon appears on the counter
  if (on.has("sendok-tambah")) {
    ellipse(ctx, 252, 336, 5, 10, "#B9C4CC");
    line(ctx, 252, 344, 252, 362, 3, "#B9C4CC");
  }
  // sugar jar
  if (!on.has("gula-hilang")) {
    rrect(ctx, 420, 286, 36, 48, 8, "rgba(255,253,246,0.9)");
    rect(ctx, 420, 312, 36, 22, "#FFF6E5");
    rrect(ctx, 418, 280, 40, 10, 4, "#C8552B");
  }
  // stools
  const stoolXs = [140, 300, 470];
  stoolXs.forEach((sx, i) => {
    if (on.has("bangku-hilang") && i === 2) return;
    rrect(ctx, sx - 26, 452, 52, 12, 6, "#6B4226");
    line(ctx, sx - 18, 464, sx - 22, 512, 5, "#6B4226");
    line(ctx, sx + 18, 464, sx + 22, 512, 5, "#6B4226");
  });
}
const KOPI_DIFFS = [
  { id: "cangkir-tambah", x: 288, y: 312, r: 22, label: "Cangkir bertambah" },
  { id: "asap-hilang", x: 365, y: 210, r: 28, label: "Uap ketel hilang" },
  { id: "jam-waktu", x: 470, y: 120, r: 28, label: "Jarum jam berubah" },
  { id: "menu-harga", x: 215, y: 160, r: 24, label: "Harga di menu berubah" },
  { id: "bangku-hilang", x: 470, y: 472, r: 28, label: "Satu bangku hilang" },
  { id: "lampu-warna", x: 300, y: 82, r: 24, label: "Lampu gantung berubah warna" },
  { id: "gula-hilang", x: 438, y: 310, r: 22, label: "Toples gula hilang" },
  { id: "sendok-tambah", x: 252, y: 348, r: 16, label: "Sendok muncul di meja" },
  { id: "poster-hilang", x: 94, y: 172, r: 28, label: "Poster di dinding hilang" },
  { id: "jendela", x: 488, y: 125, r: 24, label: "Gorden jendela hilang" },
];

// --- Scene 5: Pasar Malam (night market) --------------------------------
function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
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
function drawPasarMalam(ctx, W, H, on) {
  sky(ctx, W, H, "#1E2A4A", "#3A4A7A");
  ground(ctx, W, H, 440, "#2A3358");
  // stars
  const stars = [[80, 60], [180, 40], [300, 70], [420, 45], [480, 60], [90, 130], [250, 110]];
  stars.forEach(([sx, sy], i) => {
    if (on.has("bintang-hilang") && i === 4) return;
    star(ctx, sx, sy, 6, "#FFF6E5");
  });
  // moon (crescent flips when the diff is on)
  circle(ctx, 530, 80, 26, "#FFE9B8");
  circle(ctx, on.has("bulan") ? 518 : 542, 74, 22, "#1E2A4A");
  // string lights
  ctx.strokeStyle = "#3B2416";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.quadraticCurveTo(300, 130, 600, 60);
  ctx.stroke();
  const bulbXs = [60, 140, 220, 300, 380, 460, 540];
  bulbXs.forEach((bx, i) => {
    const by = 60 + Math.sin((bx / 600) * Math.PI) * 62 + 8;
    if (on.has("lampu-mati") && i === 2) {
      circle(ctx, bx, by, 8, "#5A6480");
      return;
    }
    const col = on.has("bola-lampu-warna") && i === 4 ? "#4C9A2A" : "#FFD93D";
    circle(ctx, bx, by, 8, col);
    ctx.fillStyle = "rgba(255,217,61,0.18)";
    ctx.beginPath();
    ctx.arc(bx, by, 18, 0, Math.PI * 2);
    ctx.fill();
  });
  // banner
  rrect(ctx, 200, 150, 200, 40, 6, "#C8552B");
  text(ctx, on.has("spanduk-huruf") ? "PASAR MALAM" : "PASAR MALAM", 300, 171, 18, "#FFF6E5", "center", 800);
  if (on.has("spanduk-huruf")) text(ctx, "!", 392, 171, 18, "#F2B705", "center", 800);
  // flag on a pole
  line(ctx, 430, 90, 430, 150, 4, "#8A97A3");
  if (!on.has("bendera-hilang")) {
    ctx.fillStyle = "#0E7C6B";
    ctx.beginPath();
    ctx.moveTo(430, 92);
    ctx.lineTo(468, 102);
    ctx.lineTo(430, 114);
    ctx.closePath();
    ctx.fill();
  }
  // stalls with lanterns
  rrect(ctx, 60, 260, 170, 150, 8, "#6B4226");
  // a local striped roof over the stall (the full-width awning helper is
  // for stalls that span the whole scene, not this one)
  ctx.fillStyle = "#C8552B";
  ctx.beginPath();
  ctx.moveTo(50, 260);
  ctx.lineTo(240, 260);
  ctx.lineTo(230, 230);
  ctx.lineTo(60, 230);
  ctx.closePath();
  ctx.fill();
  const lanternColor = on.has("lampion-warna") ? "#4C9A2A" : "#D64541";
  circle(ctx, 145, 300, 18, lanternColor);
  line(ctx, 145, 282, 145, 272, 3, "#3B2416");
  text(ctx, "SATE", 145, 350, 20, "#FFF6E5", "center", 800);
  // food cart
  rrect(ctx, 330, 300, 170, 110, 10, "#8A5A33");
  rrect(ctx, 330, 300, 170, 20, 8, "#A9743F");
  circle(ctx, 380, 280, 16, "#F2B705");
  circle(ctx, 450, 280, 16, "#F2B705");
  if (!on.has("asap-gerobak")) steam(ctx, 415, 272, 2);
  drawWheel(ctx, 380, 428, 22, on.has("roda-gerobak") ? 4 : 6);
  drawWheel(ctx, 460, 428, 22, 6);
  // wet-ground reflections
  if (!on.has("pantulan")) {
    ctx.fillStyle = "rgba(255,217,61,0.35)";
    ctx.beginPath();
    ctx.ellipse(145, 500, 40, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(415, 500, 50, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // little crowd silhouettes
  ctx.fillStyle = "#141B33";
  [[90, 470], [250, 480], [520, 470]].forEach(([px, py]) => {
    circle(ctx, px, py - 26, 12, "#141B33");
    ctx.beginPath();
    ctx.moveTo(px - 14, py + 30);
    ctx.quadraticCurveTo(px, py - 22, px + 14, py + 30);
    ctx.closePath();
    ctx.fill();
  });
}
const MALAM_DIFFS = [
  { id: "lampu-mati", x: 220, y: 128, r: 20, label: "Satu lampu gantung padam" },
  { id: "bintang-hilang", x: 480, y: 60, r: 18, label: "Satu bintang hilang" },
  { id: "bulan", x: 530, y: 80, r: 28, label: "Bulan sabit terbalik" },
  { id: "lampion-warna", x: 145, y: 300, r: 24, label: "Lampion berubah warna" },
  { id: "pantulan", x: 415, y: 500, r: 30, label: "Pantulan di lantai hilang" },
  { id: "bendera-hilang", x: 449, y: 103, r: 22, label: "Bendera kecil hilang" },
  { id: "roda-gerobak", x: 380, y: 428, r: 24, label: "Jeruji roda gerobak berkurang" },
  { id: "spanduk-huruf", x: 392, y: 171, r: 18, label: "Tanda seru muncul di spanduk" },
  { id: "bola-lampu-warna", x: 460, y: 118, r: 18, label: "Satu bola lampu jadi hijau" },
  { id: "asap-gerobak", x: 415, y: 250, r: 24, label: "Uap gerobak hilang" },
];

// --- Scene 6: Penjual Jamu (herbal tonic seller) -------------------------
function bottle(ctx, x, y, w, h, color, withLabel) {
  rrect(ctx, x, y, w, h, 8, color);
  rrect(ctx, x + w * 0.3, y - 14, w * 0.4, 16, 4, color);
  rrect(ctx, x + w * 0.25, y - 20, w * 0.5, 8, 3, "#3B2416");
  if (withLabel) {
    rrect(ctx, x + 4, y + h * 0.4, w - 8, 18, 3, "#FFFDF6");
    text(ctx, "JAMU", x + w / 2, y + h * 0.4 + 10, 9, "#C8552B", "center", 800);
  }
}
function drawJamu(ctx, W, H, on) {
  sky(ctx, W, H, "#BFE6F2", "#FFE9B8");
  sun(ctx, 540, 56, 22, 8);
  ground(ctx, W, H, 440, "#D9B98A");
  // big umbrella
  line(ctx, 300, 60, 300, 330, 6, "#6B4226");
  const panelColor = on.has("payung-warna") ? "#0E7C6B" : "#C8552B";
  ctx.fillStyle = panelColor;
  ctx.beginPath();
  ctx.moveTo(300, 40);
  ctx.quadraticCurveTo(420, 80, 460, 170);
  ctx.quadraticCurveTo(300, 130, 140, 170);
  ctx.quadraticCurveTo(180, 80, 300, 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FFF6E5";
  ctx.beginPath();
  ctx.moveTo(300, 40);
  ctx.quadraticCurveTo(360, 80, 380, 150);
  ctx.quadraticCurveTo(300, 130, 300, 40);
  ctx.closePath();
  ctx.fill();
  // umbrella shadow on the ground (shifts with the diff)
  ellipse(ctx, on.has("bayangan-payung") ? 340 : 300, 480, 150, 14, "rgba(59,36,22,0.2)");
  // shelf with jamu bottles
  rrect(ctx, 120, 250, 360, 14, 5, "#6B4226");
  bottle(ctx, 150, 180, 34, 72, on.has("botol-warna") ? "#7E57C2" : "#F2B705", true);
  bottle(ctx, 200, 170, 34, 82, "#4C9A2A", !on.has("label-hilang"));
  bottle(ctx, 250, 186, 34, 66, "#C8552B", true);
  bottle(ctx, 300, 176, 34, 76, "#D64541", true);
  bottle(ctx, 350, 184, 34, 68, "#F08A24", true);
  bottle(ctx, 400, 172, 34, 80, "#0E7C6B", true);
  // bottle cap colour on the green bottle
  rrect(ctx, 208, 150, 18, 8, 3, on.has("tutup-botol") ? "#F2B705" : "#3B2416");
  // counter + glasses
  rrect(ctx, 100, 330, 400, 110, 10, "#8A5A33");
  rrect(ctx, 100, 330, 400, 18, 8, "#A9743F");
  const glassCount = on.has("gelas-tambah") ? 4 : 3;
  for (let i = 0; i < glassCount; i++) {
    const gx = 380 + i * 30;
    rrect(ctx, gx, 300, 20, 32, 5, "rgba(255,253,246,0.85)");
    rect(ctx, gx + 2, 314, 16, 16, "#F2B705");
  }
  // tray of herbs
  ellipse(ctx, 180, 350, 46, 14, "#B07A3F");
  ellipse(ctx, 165, 338, 12, 8, "#4C9A2A");
  ellipse(ctx, 185, 334, 12, 8, "#5CB531");
  if (!on.has("daun-jamu")) ellipse(ctx, 200, 340, 12, 8, "#4C9A2A");
  // coin on the counter
  if (!on.has("koin-hilang")) circle(ctx, 350, 360, 9, "#F2B705");
  // basket with handle
  rrect(ctx, 80, 452, 70, 42, 8, "#B07A3F");
  if (!on.has("keranjang-gagang")) {
    ctx.strokeStyle = "#8A5A33";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(115, 452, 24, Math.PI, 0);
    ctx.stroke();
  }
  circle(ctx, 100, 448, 10, "#F2B705");
  circle(ctx, 128, 446, 10, "#D64541");
  // stool
  if (!on.has("bangku-hilang")) {
    rrect(ctx, 494, 452, 52, 12, 6, "#6B4226");
    line(ctx, 502, 464, 498, 512, 5, "#6B4226");
    line(ctx, 538, 464, 542, 512, 5, "#6B4226");
  }
  // herb bunch hanging
  line(ctx, 520, 170, 520, 200, 3, "#3B2416");
  ellipse(ctx, 520, 218, 14, 22, "#4C9A2A");
}
const JAMU_DIFFS = [
  { id: "botol-warna", x: 167, y: 216, r: 24, label: "Botol jamu berubah warna" },
  { id: "gelas-tambah", x: 470, y: 316, r: 20, label: "Gelas bertambah" },
  { id: "label-hilang", x: 217, y: 212, r: 20, label: "Label botol hilang" },
  { id: "payung-warna", x: 300, y: 100, r: 30, label: "Payung berubah warna" },
  { id: "keranjang-gagang", x: 115, y: 434, r: 24, label: "Gagang keranjang hilang" },
  { id: "daun-jamu", x: 200, y: 340, r: 18, label: "Satu ikat daun hilang" },
  { id: "koin-hilang", x: 350, y: 360, r: 14, label: "Koin di meja hilang" },
  { id: "bangku-hilang", x: 520, y: 472, r: 26, label: "Bangku hilang" },
  { id: "tutup-botol", x: 217, y: 154, r: 14, label: "Tutup botol berubah warna" },
  { id: "bayangan-payung", x: 340, y: 480, r: 30, label: "Bayangan payung bergeser" },
];

// --- Scene 7: Tukang Sayur Keliling (mobile veggie cart) -----------------
function drawSayur(ctx, W, H, on) {
  sky(ctx, W, H, "#BFE6F2", "#FFE9B8");
  sun(ctx, 90, 60, 24, 8);
  cloud(ctx, 430, 60, 1);
  ground(ctx, W, H, 440, "#CBB28A");
  // sign
  rrect(ctx, 210, 60, 180, 44, 8, "#0E7C6B");
  text(ctx, on.has("papan-huruf") ? "SAYUR SEGAR!" : "SAYUR SEGAR", 300, 83, 20, "#FFF6E5", "center", 800);
  // tarp over the cart (fold changes with the diff)
  ctx.fillStyle = "#F2B705";
  ctx.beginPath();
  ctx.moveTo(120, 170);
  ctx.lineTo(480, 170);
  ctx.lineTo(460, 130);
  ctx.lineTo(140, 130);
  ctx.closePath();
  ctx.fill();
  if (on.has("terpal-lipat")) {
    ctx.fillStyle = "#D19400";
    ctx.beginPath();
    ctx.moveTo(300, 170);
    ctx.lineTo(340, 170);
    ctx.lineTo(330, 130);
    ctx.lineTo(305, 130);
    ctx.closePath();
    ctx.fill();
  }
  line(ctx, 130, 170, 130, 330, 5, "#6B4226");
  line(ctx, 470, 170, 470, 330, 5, "#6B4226");
  // cart body
  rrect(ctx, 110, 330, 380, 90, 10, "#8A5A33");
  rrect(ctx, 110, 330, 380, 16, 8, "#A9743F");
  // veggies on the cart
  fruitPile(ctx, 180, 305, 16, "#7CB342", 5); // cabbages
  if (on.has("kubis-warna")) circle(ctx, 180, 305, 16, "#7E57C2");
  // carrots
  const carrotCount = on.has("wortel-tambah") ? 4 : 3;
  for (let i = 0; i < carrotCount; i++) {
    const cx = 250 + i * 22;
    ctx.fillStyle = "#F08A24";
    ctx.beginPath();
    ctx.moveTo(cx - 8, 292);
    ctx.lineTo(cx + 8, 292);
    ctx.lineTo(cx, 322);
    ctx.closePath();
    ctx.fill();
    line(ctx, cx, 292, cx, 282, 3, "#4C9A2A");
  }
  // eggplants
  ellipse(ctx, 350, 300, 12, 20, "#5B2C6F");
  ellipse(ctx, 378, 302, 12, 20, "#5B2C6F");
  // chili bunch
  if (!on.has("cabai-hilang")) {
    ctx.strokeStyle = "#D64541";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(430, 296, 14, 0.2 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(446, 300, 12, 0.2 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
  // scale on the cart
  circle(ctx, 505, 240, 24, "#FFFDF6");
  ctx.strokeStyle = "#3B2416";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(505, 240, 24, 0, Math.PI * 2);
  ctx.stroke();
  const needle = on.has("jarum-timbangan") ? 0.9 : -0.5;
  line(ctx, 505, 240, 505 + Math.cos(needle - Math.PI / 2) * 18, 240 + Math.sin(needle - Math.PI / 2) * 18, 3, "#D64541");
  line(ctx, 505, 264, 505, 330, 4, "#3B2416");
  // vendor hat hanging on the cart
  if (!on.has("topi-hilang")) {
    ellipse(ctx, 540, 130, 26, 8, "#E8D8B0");
    ctx.fillStyle = "#E8D8B0";
    ctx.beginPath();
    ctx.arc(540, 128, 14, Math.PI, 0);
    ctx.fill();
  }
  // wheels
  drawWheel(ctx, 180, 442, 30, on.has("roda-hilang") ? 4 : 6);
  drawWheel(ctx, 420, 442, 30, 6);
  // basket + sack on the ground
  if (!on.has("keranjang-hilang")) {
    rrect(ctx, 62, 452, 58, 38, 8, "#B07A3F");
    circle(ctx, 80, 450, 9, "#7CB342");
    circle(ctx, 102, 448, 9, "#F08A24");
  }
  if (!on.has("karung-hilang")) {
    ellipse(ctx, 540, 480, 30, 26, "#C9B18A");
    line(ctx, 528, 458, 552, 458, 5, "#8A5A33");
  }
}
const SAYUR_DIFFS = [
  { id: "wortel-tambah", x: 316, y: 302, r: 20, label: "Wortel bertambah" },
  { id: "kubis-warna", x: 180, y: 305, r: 26, label: "Satu kubis jadi ungu" },
  { id: "terpal-lipat", x: 320, y: 150, r: 26, label: "Lipatan terpal muncul" },
  { id: "jarum-timbangan", x: 505, y: 240, r: 22, label: "Jarum timbangan berubah" },
  { id: "roda-hilang", x: 180, y: 442, r: 28, label: "Jeruji roda berkurang" },
  { id: "cabai-hilang", x: 438, y: 298, r: 22, label: "Cabai hilang" },
  { id: "keranjang-hilang", x: 91, y: 470, r: 26, label: "Keranjang di lantai hilang" },
  { id: "topi-hilang", x: 540, y: 130, r: 24, label: "Topi petani hilang" },
  { id: "papan-huruf", x: 372, y: 83, r: 18, label: "Tanda seru muncul di papan" },
  { id: "karung-hilang", x: 540, y: 480, r: 26, label: "Karung di lantai hilang" },
];

// --- scene registry ------------------------------------------------------
export function defineScenes() {
  return [
    { id: "buah", name: "Lapau Buah", subtitle: "Buah segar & timbangan", difficulty: "Mudah", draw: drawFruitStall, diffs: FRUIT_DIFFS },
    { id: "batik", name: "Kain Batik", subtitle: "Motif kawung & parang", difficulty: "Mudah", draw: drawBatik, diffs: BATIK_DIFFS },
    { id: "becak", name: "Becak & Kucing", subtitle: "Si oren suka pindah", difficulty: "Sedang", draw: drawBecak, diffs: BECAK_DIFFS },
    { id: "kopi", name: "Warung Kopi", subtitle: "Uap, jam & cangkir", difficulty: "Sedang", draw: drawWarungKopi, diffs: KOPI_DIFFS },
    { id: "malam", name: "Pasar Malam", subtitle: "Lampu & bayangan", difficulty: "Sulit", draw: drawPasarMalam, diffs: MALAM_DIFFS },
    { id: "jamu", name: "Penjual Jamu", subtitle: "Botol warna-warni", difficulty: "Sulit", draw: drawJamu, diffs: JAMU_DIFFS },
    { id: "sayur", name: "Tukang Sayur", subtitle: "Gerobak keliling", difficulty: "Ahli", draw: drawSayur, diffs: SAYUR_DIFFS },
  ];
}

export function sceneDifferences(scene) {
  return scene.diffs;
}

// Small seeded RNG (mulberry32) so screenshot staging is deterministic.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick 7 of the scene's 10 differences, shuffled, so no two runs are alike.
export function pickRandomDifferences(scene, rng) {
  const pool = [...scene.diffs];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 7);
}

export { PALETTE };
