/* ==========================================================================
   Podcast-Intro „Bea" — Text-/Grafik-Overlay, 100 s, 1920×1080
   - Bea sitzt LINKS im Bild: alle Texte liegen in der freien Zone rechts
     (x 1090–1830, über der Holzwand, oberhalb der Mikrofonarme).
   - Nur während Vollbild-B-Roll (SLOTS) dürfen drei Punchlines zentriert stehen.
   - Schrift: Montserrat Bold mit leichtem Schatten.
   - Datenkarten nur mit geprüften Quellen; Beas eigene Zahlen erscheinen
     als ihre Aussage (ohne Quellenzeile).
   ?mode=overlay  transparenter Hintergrund (Standard, für den Schnitt)
   ?mode=preview  mit Platzhalter-Hintergrund (Bea-Standbild / B-Roll-Slots)
   ?fps=25        Bildrate
   Alle Zeitpunkte sind absolute Sekunden auf der Intro-Timeline.
   ========================================================================== */
'use strict';
(() => {

const Q = new URLSearchParams(location.search);
const W = 1920, H = 1080, DUR = 100;
const FPS = +(Q.get('fps') || 25);
const MODE = Q.get('mode') || 'overlay';
const RENDER = /[?&]render/.test(location.search);
if (RENDER) document.documentElement.classList.add('render');
const TAU = Math.PI * 2;
const C = { white: '#FFFFFF', red: '#E63946', green: '#3DDC97', amber: '#FFC94A', soft: 'rgba(255,255,255,0.86)', alarm: '#FF3B30' };

// ------------------------------------------------------------- B-Roll-Slots (Vollbild-Zwischenschnitte, siehe README)
const SLOTS = [
  ['BR01', 0.00, 2.23, 'Notaufnahme-Flur, überfüllt'],
  ['BR02', 6.60, 9.10, 'Wartezimmer, tickende Uhr'],
  ['BR03', 10.50, 13.00, 'Ältere Frau, außer Atem, Pulsoximeter'],
  ['BR04', 15.10, 17.30, 'Hausarzt schreibt Überweisung'],
  ['BR05', 21.10, 24.10, 'Sanduhr, Makro'],
  ['BR06a', 27.20, 30.00, 'Notizen per Hand auf dem Klemmbrett'],
  ['BR06b', 30.00, 33.00, 'Abtippen am alten PC, Faxgerät'],
  ['BR07', 33.00, 37.00, 'KI-Daten im Klinik-Kontrollraum'],
  ['BR08', 47.00, 49.50, 'Roter Stift streicht Budget'],
  ['BR09a', 49.50, 52.00, 'Augenuntersuchung, Spaltlampe'],
  ['BR09b', 52.00, 54.40, 'Leerer Therapieraum'],
  ['BR09c', 54.40, 57.00, 'Kinderarzt mit Kind'],
  ['BR10', 57.00, 58.60, 'Sense schneidet Gras, Zeitlupe'],
  ['BR11', 64.00, 67.50, 'Junges Paar, Rechnungen, Nacht'],
  ['BR12', 67.50, 71.00, 'Zug durch die Schweizer Alpen'],
  ['BR13', 78.00, 83.00, 'TV-Studio vor dem Interview'],
  ['BR14', 92.00, 96.00, 'Kind mit Hörgerät'],
];

// ------------------------------------------------------------- math kit
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const fract = x => x - Math.floor(x);
const E = {
  inCubic: t => t * t * t, outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
const hump = (u, k = 0.05) => u <= 0 ? 0 : (u / k) * Math.exp(1 - u / k);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h, read = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: read })]; }
const de = (v, d = 0) => v.toFixed(d).replace('.', ',');

// ------------------------------------------------------------- type kit (Montserrat Bold + leichter Schatten)
const MS = (s, w = 700) => `${w} ${s}px "Montserrat"`;
const ZX = 1090, ZR = 1830;                       // freie Zone rechts von Bea
function shadow(ctx, size) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = Math.max(10, size * 0.2); ctx.shadowOffsetX = 0; ctx.shadowOffsetY = Math.max(2, size * 0.045); }
function noShadow(ctx) { ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
function txt(ctx, s, x, y, size, o = {}) {
  ctx.font = MS(size, o.w || 700); ctx.letterSpacing = (o.track || 0) + 'px'; ctx.textAlign = o.align || 'left';
  ctx.fillStyle = o.col || C.white; if (o.shadow !== false) shadow(ctx, size);
  ctx.fillText(s, x, y); noShadow(ctx); ctx.letterSpacing = '0px'; ctx.textAlign = 'left';
}
const _m = new Map();
function tw(ctx, s, size, w = 700, track = 0) {
  const k = s + '|' + size + '|' + w + '|' + track; let v = _m.get(k);
  if (v === undefined) { ctx.font = MS(size, w); ctx.letterSpacing = track + 'px'; v = ctx.measureText(s).width; ctx.letterSpacing = '0px'; _m.set(k, v); }
  return v;
}
const left = (ctx, s, x, size, o) => o.align === 'center' ? x - tw(ctx, s, size, o.w || 700, o.track || 0) / 2 : x;
// Zeile gleitet aus einer Maske nach oben
function rise(ctx, s, x, y, size, t, t0, o = {}) {
  const p = E.outExpo(prog(t, t0, t0 + (o.dur || 0.45))); if (p <= 0) return 0;
  const w = tw(ctx, s, size, o.w || 700, o.track || 0), x0 = left(ctx, s, x, size, o);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 60, y - size * 1.2, w + 120, size * 1.65); ctx.clip();
  txt(ctx, s, x, y + (1 - p) * size * 1.25, size, o); ctx.restore(); return p;
}
// weißer Text auf rotem Balken, der sich auffährt
function boxText(ctx, s, x, y, size, t, t0, o = {}) {
  const p = E.outExpo(prog(t, t0, t0 + (o.dur || 0.38))); if (p <= 0) return;
  const w = tw(ctx, s, size, 700, o.track || 0), padX = size * 0.26, top = size * 0.98, bot = size * 0.3;
  const x0 = left(ctx, s, x, size, o), bw = (w + padX * 2) * p;
  ctx.save();
  shadow(ctx, size); ctx.fillStyle = o.box || C.red; ctx.fillRect(x0 - padX, y - top, bw, top + bot); noShadow(ctx);
  ctx.beginPath(); ctx.rect(x0 - padX, y - top, bw, top + bot); ctx.clip();
  txt(ctx, s, x0, y, size, { track: o.track || 0, shadow: false, col: o.col || C.white });
  ctx.restore();
}
// Aufprall: kommt groß rein und rastet ein
function slam(ctx, t, t0, cx, cy, fn, o = {}) {
  const u = t - t0; if (u < 0) return;
  const d = o.dur || 0.17, p = clamp(u / d);
  const s = lerp(o.from || 1.5, 1, E.inCubic(p)) * (1 - 0.035 * hump(u - d, 0.05));
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
function kicker(ctx, s, x, y, t, t0) {
  const p = E.outCubic(prog(t, t0, t0 + 0.35)); if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= p; shadow(ctx, 22); ctx.fillStyle = C.red; ctx.fillRect(x, y - 20, 7, 26); noShadow(ctx);
  txt(ctx, s, x + 20 - (1 - p) * 12, y, 24, { track: 3.5, col: C.soft }); ctx.restore();
}
function source(ctx, s, x, y, t, t0) {
  const p = E.outCubic(prog(t, t0, t0 + 0.4)); if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= p * 0.85; txt(ctx, s, x, y, 20, { w: 500 }); ctx.restore();
}
function bar(ctx, x, y, w, h, p, col, track = 'rgba(255,255,255,0.22)') {
  ctx.save(); shadow(ctx, 20); ctx.fillStyle = track; ctx.fillRect(x, y, w, h); noShadow(ctx);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(p), h); ctx.restore();
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// ------------------------------------------------------------- widgets
function heart(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(0, 10); ctx.bezierCurveTo(-26, -8, -14, -30, 0, -16); ctx.bezierCurveTo(14, -30, 26, -8, 0, 10); ctx.fill(); ctx.restore();
}
function ppg(p) {                                 // Pulskurve (Plethysmogramm)
  p = fract(p);
  if (p < 0.16) return Math.sin(p / 0.16 * Math.PI / 2);
  return Math.exp(-(p - 0.16) * 3.6) * (1 + 0.22 * Math.exp(-Math.pow((p - 0.46) / 0.05, 2)));
}
function oximeter(ctx, t, x, y) {
  const w = 600, h = 300;
  const drop = E.inOutCubic(prog(t, 11.6, 12.4));
  const v = Math.round(lerp(98, 85, drop) - (drop <= 0 && hash(Math.floor(t * 1.5)) > 0.65 ? 1 : 0));
  const col = v >= 95 ? C.green : v >= 90 ? C.amber : C.alarm;
  const alarm = v < 90 ? 0.5 + 0.5 * Math.sin(t * TAU * 2.2) : 0;
  shadow(ctx, 70); ctx.fillStyle = '#1B1D24'; rrect(ctx, x, y, w, h, 46); ctx.fill(); noShadow(ctx);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; rrect(ctx, x, y, w, h, 46); ctx.fill();
  ctx.fillStyle = '#06080B'; rrect(ctx, x + 24, y + 24, w - 48, h - 48, 26); ctx.fill();
  if (alarm > 0) { ctx.strokeStyle = `rgba(255,59,48,${0.25 + 0.75 * alarm})`; ctx.lineWidth = 6; rrect(ctx, x + 24, y + 24, w - 48, h - 48, 26); ctx.stroke(); }
  txt(ctx, 'SpO', x + 62, y + 92, 34, { col: 'rgba(255,255,255,0.75)', shadow: false });
  txt(ctx, '2', x + 62 + tw(ctx, 'SpO', 34), y + 100, 22, { col: 'rgba(255,255,255,0.75)', shadow: false });
  ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 28; txt(ctx, String(v), x + 56, y + 236, 150, { col, shadow: false });
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  txt(ctx, '%', x + 56 + tw(ctx, String(v), 150) + 10, y + 236, 50, { col, shadow: false }); ctx.restore();
  const beat = t * 1.6, hb = Math.exp(-fract(beat) * 7);
  heart(ctx, x + w - 96, y + 92, 1 + 0.18 * hb, col);
  const x0 = x + 360, x1 = x + w - 52, by = y + 232;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y + 120, x1 - x0, 130); ctx.clip();
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let px = x0; px <= x1; px += 3) { const yy = by - 86 * ppg((px - x0) / 120 - beat); px === x0 ? ctx.moveTo(px, yy) : ctx.lineTo(px, yy); }
  ctx.stroke(); ctx.restore();
  if (alarm > 0) { ctx.fillStyle = `rgba(255,59,48,${alarm})`; ctx.beginPath(); ctx.moveTo(x + w - 96, y + 140); ctx.lineTo(x + w - 116, y + 176); ctx.lineTo(x + w - 76, y + 176); ctx.closePath(); ctx.fill(); }
  return v;
}
// Skala 80–100 % mit Normalbereich und Marker
function spo2Scale(ctx, t, x, y, w, t0) {
  const p = E.outCubic(prog(t, t0, t0 + 0.5)); if (p <= 0) return;
  const X = v => x + (v - 80) / 20 * w;
  ctx.save(); ctx.globalAlpha *= p;
  bar(ctx, x, y, w, 14, 0, C.white);
  ctx.fillStyle = C.green; ctx.fillRect(X(95), y, X(100) - X(95), 14);
  ctx.fillStyle = 'rgba(255,59,48,0.85)'; ctx.fillRect(x, y, X(88) - x, 14);
  for (const v of [80, 85, 90, 95, 100]) txt(ctx, String(v), X(v), y + 44, 18, { align: 'center', w: 500, col: 'rgba(255,255,255,0.8)' });
  const m = E.outBack(prog(t, t0 + 0.25, t0 + 0.6), 2);
  ctx.fillStyle = C.alarm; ctx.beginPath(); ctx.moveTo(X(85), y - 4); ctx.lineTo(X(85) - 13 * m, y - 26 * m); ctx.lineTo(X(85) + 13 * m, y - 26 * m); ctx.closePath(); ctx.fill();
  ctx.restore();
}
const MONTHS = ['DEZEMBER', 'JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI'];
function calendarPage(ctx, x, y, w, h, month, big) {
  shadow(ctx, 60); ctx.fillStyle = '#FAFAF7'; ctx.fillRect(x, y, w, h); noShadow(ctx);
  ctx.fillStyle = C.red; ctx.fillRect(x, y, w, 104);
  txt(ctx, 'NÄCHSTES JAHR', x + w / 2, y + 66, 30, { align: 'center', track: 5, shadow: false });
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#C9C9C2'; ctx.beginPath(); ctx.arc(x + 70 + i * (w - 140) / 5, y + 12, 7, 0, TAU); ctx.fill(); }
  const size = big ? 128 : 110;
  txt(ctx, month, x + w / 2, y + 270, month.length > 6 ? size * 0.72 : size, { align: 'center', col: '#16171C', shadow: false });
  ctx.fillStyle = 'rgba(22,23,28,0.14)';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) ctx.fillRect(x + 48 + c * (w - 96) / 7, y + 318 + r * 34, (w - 96) / 7 - 14, 18);
}
function calendar(ctx, t, x, y, t0) {
  const w = 500, h = 440, u = t - t0;
  const n = Math.min(MONTHS.length - 1, Math.floor(u / 0.062)), f = clamp(u / 0.062 - n);
  const landed = n >= MONTHS.length - 1;
  const s = landed ? 1 - 0.05 * hump(u - 0.062 * (MONTHS.length - 1), 0.05) : 1;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s); ctx.translate(-x - w / 2, -y - h / 2);
  calendarPage(ctx, x, y, w, h, MONTHS[Math.min(MONTHS.length - 1, n + (landed ? 0 : 1))], true);
  if (!landed) {                                   // aktuelle Seite klappt nach oben weg
    ctx.save(); ctx.translate(0, y + 104); ctx.scale(1, 1 - E.inCubic(f)); ctx.translate(0, -(y + 104));
    ctx.beginPath(); ctx.rect(x, y + 104, w, h - 104); ctx.clip(); calendarPage(ctx, x, y, w, h, MONTHS[n], true); ctx.restore();
  }
  ctx.restore();
}
function lockIcon(ctx, x, y, s, p) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * p, s * p); shadow(ctx, 30);
  ctx.strokeStyle = C.white; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, -18, 17, Math.PI, 0); ctx.lineTo(17, -4); ctx.moveTo(-17, -18); ctx.lineTo(-17, -4); ctx.stroke();
  ctx.fillStyle = C.white; rrect(ctx, -28, -6, 56, 44, 7); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 12, 6, 0, TAU); ctx.fill(); ctx.fillRect(-2.5, 12, 5, 13); ctx.restore();
}
function clockIcon(ctx, x, y, r, t) {
  ctx.save(); shadow(ctx, 30); ctx.strokeStyle = C.white; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); noShadow(ctx);
  const step = Math.floor(t * 2) + E.outBack(clamp(fract(t * 2) / 0.25), 3);
  const a = step / 12 * TAU - Math.PI / 2;
  ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75); ctx.stroke();
  ctx.strokeStyle = C.white; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.5); ctx.stroke();
  ctx.restore();
}
function flagCH(ctx, x, y, s) {
  shadow(ctx, 20); ctx.fillStyle = '#DA291C'; ctx.fillRect(x, y, s, s); noShadow(ctx);
  ctx.fillStyle = '#FFF'; const a = s * 0.2, b = s * 0.6;
  ctx.fillRect(x + (s - a) / 2, y + (s - b) / 2, a, b); ctx.fillRect(x + (s - b) / 2, y + (s - a) / 2, b, a);
}
function flagDE(ctx, x, y, w, h) {
  shadow(ctx, 20); ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h / 3); noShadow(ctx);
  ctx.fillStyle = '#DD0000'; ctx.fillRect(x, y + h / 3, w, h / 3); ctx.fillStyle = '#FFCE00'; ctx.fillRect(x, y + 2 * h / 3, w, h / 3 + 0.5);
}
function wave(ctx, t, t0, x, y, w, amp, col, noisy) {
  const p = E.inOutCubic(prog(t, t0, t0 + 0.7)); if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - amp * 2, (w + 20) * p, amp * 4); ctx.clip();
  shadow(ctx, 26); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let px = 0; px <= w; px += noisy ? 4 : 3) {
    let v = Math.sin(px / w * TAU * 3.2 - t * 5) * Math.sin(px / w * Math.PI);
    if (noisy) v = v * 0.5 + (hash(Math.floor(px / 4) + Math.floor(t * 18) * 131) - 0.5) * 1.5 * Math.sin(px / w * Math.PI + 0.2);
    const yy = y - amp * v; px ? ctx.lineTo(x + px, yy) : ctx.moveTo(x + px, yy);
  }
  ctx.stroke(); ctx.restore();
}

// ------------------------------------------------------------- die drei Kürzungs-Zeilen + Sensenschnitt
const [cutC, cutX] = mk(W, H);
const CUT_ROWS = [['AUGENHEILKUNDE', '−25 %', 50.30], ['PSYCHIATRIE', '−20 %', 52.60], ['KINDER- UND JUGENDMEDIZIN', '−15–16 %', 55.00]];
const SL1 = [[1860, 120], [1000, 700]], SL2 = [[1080, 140], [1880, 660]];
function drawCutRows(ctx, t) {
  CUT_ROWS.forEach(([label, num, t0], i) => {
    const y = 210 + i * 165;
    kicker(ctx, label, ZX, y, t, t0);
    slam(ctx, t, t0 + 0.08, ZX + 160, y + 80, () => txt(ctx, num, ZX - 4, y + 112, 108, { col: C.white }), { from: 1.35 });
    const p = E.outCubic(prog(t, t0 + 0.1, t0 + 0.6));
    if (p > 0) { ctx.save(); shadow(ctx, 20); ctx.fillStyle = C.red; ctx.fillRect(ZX, y + 128, 520 * p, 8); ctx.restore(); }
  });
}
function halfPlane(ctx, L, side) {                // Klipp-Polygon: eine Seite der Geraden L
  const [[ax, ay], [bx, by]] = L, dx = bx - ax, dy = by - ay, nx = -dy * side, ny = dx * side, k = 4000;
  ctx.moveTo(ax - dx * 3, ay - dy * 3); ctx.lineTo(bx + dx * 3, by + dy * 3);
  ctx.lineTo(bx + dx * 3 + nx * k / Math.hypot(dx, dy), by + dy * 3 + ny * k / Math.hypot(dx, dy));
  ctx.lineTo(ax - dx * 3 + nx * k / Math.hypot(dx, dy), ay - dy * 3 + ny * k / Math.hypot(dx, dy)); ctx.closePath();
}
function slashLine(ctx, L, u) {
  if (u < 0 || u > 0.35) return;
  const p = E.outCubic(clamp(u / 0.1)), fade = 1 - prog(u, 0.12, 0.35);
  const [[ax, ay], [bx, by]] = L;
  ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${fade})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, bx, p), lerp(ay, by, p)); ctx.stroke(); ctx.restore();
}
function cutsElement(ctx, t) {
  const s1 = 58.55, s2 = 59.25;
  if (t < s1) { drawCutRows(ctx, t); return; }
  cutX.setTransform(1, 0, 0, 1, 0, 0); cutX.clearRect(0, 0, W, H); drawCutRows(cutX, Math.min(t, 57.5));
  const q1 = E.outCubic(prog(t, s1, s1 + 0.3)), q2 = E.outCubic(prog(t, s2, s2 + 0.3)), fall = Math.max(0, t - s2 - 0.05);
  const pieces = t < s2 ? [[1, 0], [-1, 0]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [a, b] of pieces) {
    ctx.save(); ctx.beginPath(); halfPlane(ctx, SL1, a); ctx.clip();
    if (b) { ctx.beginPath(); halfPlane(ctx, SL2, b); ctx.clip(); }
    const ox = a * 26 * q1 + b * 22 * q2 + (a + b) * 40 * fall, oy = -a * 18 * q1 + b * 16 * q2 + 900 * fall * fall;
    ctx.globalAlpha *= 1 - prog(t, s2 + 0.15, s2 + 0.45);
    ctx.translate(ox, oy); ctx.rotate((a * 0.02 + b * 0.015) * q2); ctx.drawImage(cutC, 0, 0); ctx.restore();
  }
  slashLine(ctx, SL1, t - s1); slashLine(ctx, SL2, t - s2);
}

// ------------------------------------------------------------- TIMELINE: [start, ende, zeichnen]
const EL = [
  // 0,00 „Die Notfallstationen sind ja massiv überlaufen."  (Vollbild-B-Roll BR01 → zentriert)
  [0.15, 2.20, (ctx, t) => {
    rise(ctx, 'NOTAUFNAHMEN', 960, 470, 104, t, 0.30, { align: 'center', track: 8 });
    slam(ctx, t, 1.42, 960, 590, () => boxText(ctx, 'MASSIV ÜBERLAUFEN', 960, 628, 92, t, 1.42, { align: 'center', dur: 0.22, track: 2 }), { from: 1.3 });
  }],
  // 2,23 „Weil …"  — Studie: DGINA-Umfrage 2026
  [2.30, 3.78, (ctx, t) => {
    kicker(ctx, 'NOTAUFNAHMEN IN DEUTSCHLAND', ZX, 200, t, 2.30);
    const p = E.outExpo(prog(t, 2.32, 2.75)), v = Math.round(45 * E.outCubic(prog(t, 2.35, 3.0)));
    ctx.save(); ctx.globalAlpha *= clamp(p * 2); txt(ctx, v + ' %', ZX - 6, 362 + (1 - p) * 30, 168); ctx.restore();
    bar(ctx, ZX, 392, 600, 12, 0.45 * E.outCubic(prog(t, 2.35, 3.0)), C.red);
    rise(ctx, 'waren am Stichtag überlastet', ZX, 458, 40, t, 2.55);
    source(ctx, 'DGINA-Umfrage · 271 Notaufnahmen · 2. Juni 2026 · mind. 2 Std. überlastet', ZX, 502, t, 2.8);
  }],
  // 3,10 „… die Menschen keinen Zugang zu den Gesundheitssystemen haben."
  [3.70, 5.12, (ctx, t) => {
    lockIcon(ctx, ZX + 34, 238, 1.15, E.outBack(prog(t, 3.70, 3.95), 2));
    rise(ctx, 'Menschen haben', ZX + 90, 262, 44, t, 3.75);
    slam(ctx, t, 3.98, ZX + 330, 360, () => boxText(ctx, 'KEINEN ZUGANG', ZX + 14, 392, 70, t, 3.98, { dur: 0.22 }), { from: 1.25 });
    rise(ctx, 'zum Gesundheitssystem', ZX, 478, 44, t, 4.35);
  }],
  // 5,20 „Du kriegst einen Facharzttermin …"  — Wartezeit Ø 42 Tage
  [5.30, 7.85, (ctx, t) => {
    kicker(ctx, 'WARTEZEIT AUF EINEN FACHARZTTERMIN', ZX, 200, t, 5.30);
    const p = E.outExpo(prog(t, 5.35, 5.8)), v = Math.round(lerp(33, 42, E.inOutCubic(prog(t, 5.6, 6.5))));
    ctx.save(); ctx.globalAlpha *= clamp(p * 2); txt(ctx, 'Ø ' + v + ' Tage', ZX - 4, 352 + (1 - p) * 30, 136); ctx.restore();
    const b = E.outCubic(prog(t, 5.7, 6.5));
    txt(ctx, '2019', ZX, 414, 22, { w: 500 }); bar(ctx, ZX + 80, 398, 430 * 33 / 42, 18, b, C.white, 'rgba(255,255,255,0.18)'); txt(ctx, '33', ZX + 92 + 430 * 33 / 42 * b, 414, 22, { w: 500 });
    txt(ctx, '2024', ZX, 452, 22, { w: 500 }); bar(ctx, ZX + 80, 436, 430, 18, b, C.red, 'rgba(255,255,255,0.18)'); txt(ctx, '42', ZX + 92 + 430 * b, 452, 22, { w: 500 });
    source(ctx, 'Gesetzlich Versicherte · Bundesregierung (Kleine Anfrage), Versichertenbefragung', ZX, 500, t, 6.4);
  }],
  // „… für wirklich dringliche Sachen in einem halben Jahr."  (Vollbild-B-Roll BR02 → zentriert)
  [7.85, 9.05, (ctx, t) => {
    rise(ctx, 'für wirklich dringliche Sachen:', 960, 430, 46, t, 7.88, { align: 'center' });
    slam(ctx, t, 8.30, 960, 600, () => boxText(ctx, '½ JAHR', 960, 660, 170, t, 8.30, { align: 'center', dur: 0.2, track: 4 }), { from: 1.35 });
  }],
  // 9,10 „… Mutter hat eine Sauerstoffsättigung von 85 %."  /  „Die läuft mit 85 % rum."
  [9.20, 15.05, (ctx, t) => {
    kicker(ctx, 'SAUERSTOFFSÄTTIGUNG', ZX, 140, t, 9.25);
    const a = E.outExpo(prog(t, 9.3, 9.85));
    ctx.save(); ctx.globalAlpha *= clamp(a * 1.5); ctx.translate(0, (1 - a) * 40); oximeter(ctx, t, ZX + 10, 170); ctx.restore();
    rise(ctx, 'Normal: 95–100 %', ZX, 540, 36, t, 12.55);
    spo2Scale(ctx, t, ZX + 10, 580, 600, 12.75);
  }],
  // 15,10 „Der Hausarzt sagt: Sie müssen zum Kardiologen."
  [15.25, 17.55, (ctx, t) => {
    kicker(ctx, 'DER HAUSARZT SAGT', ZX, 225, t, 15.25);
    rise(ctx, '„Sie müssen zum', ZX, 330, 62, t, 15.45);
    rise(ctx, 'Kardiologen.“', ZX, 408, 62, t, 15.65);
    const p = E.outBack(prog(t, 16.2, 16.55), 2);
    if (p > 0) { ctx.save(); ctx.globalAlpha *= clamp(p); shadow(ctx, 24); ctx.strokeStyle = C.white; ctx.lineWidth = 3; rrect(ctx, ZX, 445, 400 * p, 52, 26); ctx.stroke(); noShadow(ctx);
      txt(ctx, 'Überweisung: Kardiologie', ZX + 24, 480, 24, { w: 500 }); ctx.restore(); }
  }],
  // „Wann hat sie einen Termin bekommen?" — „Wisst ihr, wann …?"
  [17.60, 21.05, (ctx, t) => {
    kicker(ctx, 'UND DER TERMIN?', ZX, 220, t, 17.62);
    slam(ctx, t, 17.95, ZX + 330, 360, () => txt(ctx, 'WANN?', ZX - 6, 420, 178), { from: 1.4 });
    const p = E.outBack(prog(t, 19.15, 19.5), 2);
    if (p > 0) { ctx.save(); ctx.globalAlpha *= clamp(p); clockIcon(ctx, ZX + 48, 520, 44 * p, t); ctx.restore();
      rise(ctx, 'beim Kardiologen?', ZX + 112, 534, 36, t, 19.3); }
  }],
  // 21,10 „Mit der Indikation der Sauerstoffsättigung von 85 % …"
  [21.15, 24.02, (ctx, t) => {
    kicker(ctx, 'MIT DER INDIKATION', ZX, 250, t, 21.2);
    slam(ctx, t, 21.6, ZX + 300, 360, () => boxText(ctx, 'SpO₂ 85 %', ZX + 14, 400, 104, t, 21.6, { dur: 0.22 }), { from: 1.25 });
    rise(ctx, 'Deutlich zu niedrig.', ZX, 480, 34, t, 22.4, { w: 500 });
    rise(ctx, 'Normal: 95–100 %', ZX, 526, 34, t, 22.6, { w: 500 });
  }],
  // 24,10 „… im Juli nächsten Jahres."  — Kalender-Reveal
  [24.10, 25.62, (ctx, t) => {
    const a = E.outCubic(prog(t, 24.10, 24.2));
    ctx.save(); ctx.globalAlpha *= a; calendar(ctx, t, ZX + 90, 150, 24.10); ctx.restore();
  }],
  // 25,10 „Deutschland hat die Digitalisierung verschlafen."
  [25.70, 27.15, (ctx, t) => {
    rise(ctx, 'DEUTSCHLAND HAT DIE', ZX, 300, 44, t, 25.72, { track: 3 });
    rise(ctx, 'DIGITALISIERUNG', ZX, 392, 76, t, 25.9);
    slam(ctx, t, 26.35, ZX + 310, 480, () => boxText(ctx, 'VERSCHLAFEN', ZX + 14, 512, 84, t, 26.35, { dur: 0.22 }), { from: 1.3 });
  }],
  // 27,20 Klemmbrett → Computer abtippen  — Studie: Nutzung der ePA
  [27.35, 32.90, (ctx, t) => {
    kicker(ctx, 'ELEKTRONISCHE PATIENTENAKTE', ZX, 165, t, 27.35);
    const p1 = E.outExpo(prog(t, 27.55, 28.0)), v1 = Math.round(73 * E.outCubic(prog(t, 27.6, 28.4)));
    ctx.save(); ctx.globalAlpha *= clamp(p1 * 2); txt(ctx, v1 + ' Mio.', ZX - 4, 272 + (1 - p1) * 24, 100); ctx.restore();
    rise(ctx, 'Akten angelegt', ZX, 314, 30, t, 27.8, { w: 500 });
    bar(ctx, ZX, 334, 640, 16, E.outCubic(prog(t, 27.8, 28.6)), 'rgba(255,255,255,0.9)');
    const p2 = E.outExpo(prog(t, 29.2, 29.65)), v2 = 5.85 * E.outCubic(prog(t, 29.25, 30.0));
    ctx.save(); ctx.globalAlpha *= clamp(p2 * 2); txt(ctx, de(v2, 2) + ' Mio.', ZX - 4, 444 + (1 - p2) * 24, 100, { col: C.white }); ctx.restore();
    rise(ctx, 'nutzen sie aktiv  ·  ≈ 8 %', ZX, 486, 30, t, 29.45, { w: 500 });
    bar(ctx, ZX, 506, 640, 16, 0.08 * E.outCubic(prog(t, 29.5, 30.3)), C.red);
    source(ctx, 'gematik-Daten via BfDI-Datenbarometer · G+G-Umfrage · Herbst 2026', ZX, 556, t, 30.4);
  }],
  // 33,00 „Wie viel man mit KI … sparen kann? Das hat mir McKinsey ausgerechnet."
  [33.15, 36.95, (ctx, t) => {
    rise(ctx, 'WIE VIEL KÖNNTE', ZX, 300, 56, t, 33.2, { track: 2 });
    slam(ctx, t, 33.85, ZX + 280, 400, () => boxText(ctx, 'KI SPAREN?', ZX + 14, 436, 100, t, 33.85, { dur: 0.22 }), { from: 1.25 });
    rise(ctx, 'McKinsey hat nachgerechnet.', ZX, 520, 34, t, 35.55, { w: 500 });
  }],
  // 37,00 „80 Milliarden. Das gesamte … Gesetz spart 19 Milliarden."
  [37.00, 41.95, (ctx, t) => {
    const p1 = E.outExpo(prog(t, 37.05, 37.35)), v1 = Math.round(80 * E.outCubic(prog(t, 37.05, 37.5)));
    slam(ctx, t, 37.05, ZX + 220, 210, () => txt(ctx, v1 + ' Mrd. €', ZX - 4, 250, 108), { from: 1.35 });
    const b1 = E.outCubic(prog(t, 37.2, 38.0));
    bar(ctx, ZX, 276, 720, 26, b1, 'rgba(255,255,255,0.92)');
    if (b1 > 0.3) { ctx.save(); ctx.globalAlpha *= prog(b1, 0.3, 1); ctx.fillStyle = C.amber; ctx.fillRect(ZX, 276, 720 * 22.8 / 80 * b1, 26);
      txt(ctx, 'davon KI: 22,8 Mrd.', ZX + 8, 323, 20, { w: 500, col: C.amber }); ctx.restore(); }
    rise(ctx, 'Potenzial pro Jahr durch Digitalisierung & KI', ZX, 360, 26, t, 37.6, { w: 500 });
    source(ctx, 'Quelle: McKinsey, „KI und Digitalisierung: 80 Mrd. € Potenzial"', ZX, 392, t, 38.0);
    const v2 = Math.round(19 * E.outCubic(prog(t, 39.4, 39.8)));
    slam(ctx, t, 39.4, ZX + 160, 470, () => txt(ctx, v2 + ' Mrd. €', ZX - 4, 500, 96, { col: C.white }), { from: 1.35 });
    bar(ctx, ZX, 522, 720, 26, 19 / 80 * E.outCubic(prog(t, 39.5, 40.2)), C.red, 'rgba(255,255,255,0.12)');
    rise(ctx, 'GKV-Spargesetz: Einsparvolumen 2027', ZX, 584, 26, t, 39.8, { w: 500 });
    source(ctx, 'Quelle: BMG · GKV-Beitragssatzstabilisierungsgesetz', ZX, 614, t, 40.2);
  }],
  // 42,00 „Das ist keine Reform. Eine Reform beinhaltet, dass du Dinge erst einmal verbesserst."
  [42.15, 46.90, (ctx, t) => {
    slam(ctx, t, 42.3, ZX + 330, 330, () => {
      ctx.save(); ctx.translate(ZX + 330, 330); ctx.rotate(-0.045); ctx.translate(-ZX - 330, -330);
      const w = tw(ctx, 'KEINE REFORM.', 80, 700, 2) + 56; shadow(ctx, 40); ctx.strokeStyle = C.red; ctx.lineWidth = 8; ctx.strokeRect(ZX + 330 - w / 2, 262, w, 120); noShadow(ctx);
      txt(ctx, 'KEINE REFORM.', ZX + 330, 350, 80, { align: 'center', track: 2 }); ctx.restore();
    }, { from: 1.6, dur: 0.15 });
    rise(ctx, 'Eine Reform heißt:', ZX, 480, 40, t, 44.25, { w: 500 });
    rise(ctx, 'Dinge erst einmal verbessern.', ZX, 534, 44, t, 44.5);
  }],
  // 47,00 „Das ist eine Kürzungsorgie."  (Vollbild-B-Roll BR08 → zentriert)
  [47.05, 49.45, (ctx, t) => {
    rise(ctx, 'Das ist eine', 960, 432, 50, t, 47.12, { align: 'center' });
    slam(ctx, t, 47.55, 960, 560, () => boxText(ctx, 'KÜRZUNGSORGIE', 960, 610, 140, t, 47.55, { align: 'center', dur: 0.2, track: 3 }), { from: 1.4 });
  }],
  // 49,50 „Wir reden 25 % Augenheilkunde weniger, 20 % … 15 bis 16 % bei den Kindern."  + 57,00 Sense: „schnipp, schnapp"
  [49.55, 59.75, (ctx, t) => cutsElement(ctx, t)],
  // 60,00 „Aber wir sind doch faul. Deswegen … Krankschreibung ab dem ersten Tag …"
  [60.15, 63.95, (ctx, t) => {
    rise(ctx, '„Aber wir sind', ZX, 290, 64, t, 60.2);
    rise(ctx, 'doch faul.“', ZX, 370, 64, t, 60.42);
    rise(ctx, 'Also Krankschreibung', ZX, 466, 40, t, 61.75, { w: 500 });
    slam(ctx, t, 62.15, ZX + 250, 520, () => boxText(ctx, 'ab dem ersten Tag?', ZX + 12, 548, 52, t, 62.15, { dur: 0.22 }), { from: 1.2 });
  }],
  // 64,00 „Das ist die erste Generation, wo es uns nicht besser geht als unseren Eltern."  — Studie
  [64.10, 67.45, (ctx, t) => {
    kicker(ctx, 'UMFRAGE', ZX, 190, t, 64.1);
    const p = E.outExpo(prog(t, 64.2, 64.6)), v = Math.round(52 * E.outCubic(prog(t, 64.25, 64.95)));
    ctx.save(); ctx.globalAlpha *= clamp(p * 2); txt(ctx, v + ' %', ZX - 6, 350 + (1 - p) * 30, 168); ctx.restore();
    rise(ctx, 'erwarten: Künftigen Generationen', ZX, 420, 36, t, 64.5);
    rise(ctx, 'wird es schlechter gehen.', ZX, 466, 36, t, 64.65);
    source(ctx, 'Bertelsmann Stiftung / YouGov · Dez. 2025 · 2.117 Befragte', ZX, 512, t, 65.1);
  }],
  // 67,50 Schweiz  — Studie: FMH-Ärztestatistik
  [67.65, 72.90, (ctx, t) => {
    const f = E.outBack(prog(t, 67.65, 67.95), 2);
    if (f > 0) { ctx.save(); ctx.translate(ZX + 22, 158); ctx.scale(f, f); flagCH(ctx, -22, -22, 44); ctx.restore(); }
    kicker(ctx, 'SCHWEIZ', ZX + 62, 170, t, 67.7);
    const p = E.outExpo(prog(t, 67.85, 68.3)), v = Math.round(43 * E.outCubic(prog(t, 67.9, 68.6)));
    ctx.save(); ctx.globalAlpha *= clamp(p * 2); txt(ctx, v + ' %', ZX - 6, 320 + (1 - p) * 30, 160); ctx.restore();
    rise(ctx, 'der Ärzt:innen haben ein', ZX, 376, 36, t, 68.2);
    rise(ctx, 'ausländisches Diplom', ZX, 420, 36, t, 68.35);
    const g = E.outBack(prog(t, 70.0, 70.3), 2);
    if (g > 0) { ctx.save(); ctx.translate(ZX + 26, 486); ctx.scale(g, g); flagDE(ctx, -26, -17, 52, 34); ctx.restore(); }
    rise(ctx, 'Knapp die Hälfte davon', ZX + 74, 482, 32, t, 70.1);
    rise(ctx, 'mit deutschem Diplom.', ZX + 74, 522, 32, t, 70.25);
    source(ctx, 'FMH-Ärztestatistik 2025 · Herkunftsländer: Stand 2024', ZX, 572, t, 70.7);
  }],
  // „Warum bildest du diese Leute in Deutschland aus und hältst sie nicht hier …?"
  [73.00, 77.90, (ctx, t) => {
    rise(ctx, 'Warum bilden wir sie aus –', ZX, 320, 46, t, 73.05);
    slam(ctx, t, 73.9, ZX + 300, 400, () => boxText(ctx, 'und halten sie nicht?', ZX + 12, 430, 58, t, 73.9, { dur: 0.22 }), { from: 1.2 });
    rise(ctx, 'Weil die Bedingungen', ZX, 520, 38, t, 76.0, { w: 500 });
    rise(ctx, 'so schlecht sind.', ZX, 568, 38, t, 76.2, { w: 500 });
  }],
  // 78,00 „Ich war im MDR in so einem Interview, … Vertreterin der Ersatzkassen …"
  [78.15, 85.95, (ctx, t) => {
    const p = E.outBack(prog(t, 78.2, 78.55), 1.8);
    if (p > 0) { ctx.save(); ctx.globalAlpha *= clamp(p); const w = tw(ctx, 'MDR-INTERVIEW', 30, 700, 4) + 48;
      shadow(ctx, 30); ctx.fillStyle = C.red; rrect(ctx, ZX, 205, w * p, 60, 8); ctx.fill(); noShadow(ctx);
      ctx.beginPath(); ctx.rect(ZX, 205, w * p, 60); ctx.clip(); txt(ctx, 'MDR-INTERVIEW', ZX + 24, 246, 30, { track: 4, shadow: false }); ctx.restore(); }
    rise(ctx, 'Gegenüber: eine Vertreterin', ZX, 340, 40, t, 80.4);
    rise(ctx, 'der Ersatzkassen', ZX, 392, 40, t, 80.6);
    rise(ctx, '„Wenn man die Krankenkassen', ZX, 486, 36, t, 83.4, { w: 500 });
    rise(ctx, 'reduziert, bringt das nichts.“', ZX, 532, 36, t, 83.6, { w: 500 });
  }],
  // 86,00 (lacht) … „wenn man so jemanden einlädt …"  — Fakten zu den Kassen
  [86.05, 91.95, (ctx, t) => {
    kicker(ctx, 'GESETZLICHE KRANKENKASSEN', ZX, 190, t, 86.05);
    const p = E.outExpo(prog(t, 86.15, 86.55)), v = Math.round(lerp(420, 93, E.outCubic(prog(t, 86.2, 87.3))));
    ctx.save(); ctx.globalAlpha *= clamp(p * 2); txt(ctx, String(v), ZX - 6, 342 + (1 - p) * 30, 160);
    txt(ctx, 'Kassen', ZX + tw(ctx, String(v), 160) + 14, 342 + (1 - p) * 30, 44); ctx.restore();
    rise(ctx, 'Stand April 2026  ·  im Jahr 2000: 420', ZX, 392, 26, t, 86.6, { w: 500 });
    const q = E.outExpo(prog(t, 87.7, 88.1));
    ctx.save(); ctx.globalAlpha *= clamp(q * 2); txt(ctx, '12,6 Mrd. €', ZX - 4, 492 + (1 - q) * 24, 80); ctx.restore();
    rise(ctx, 'Verwaltungskosten 2024  ·  ≈ 3,9 % der Ausgaben', ZX, 532, 26, t, 88.0, { w: 500 });
    source(ctx, 'Quelle: GKV-Spitzenverband', ZX, 574, t, 88.4);
  }],
  // 92,00 „Und wir reden jetzt von kleinen Kindern, die jetzt richtig hören können."
  [92.10, 95.55, (ctx, t) => {
    rise(ctx, 'Kleine Kinder,', ZX, 330, 64, t, 92.15);
    rise(ctx, 'die jetzt richtig', ZX, 416, 50, t, 92.6);
    slam(ctx, t, 93.05, ZX + 220, 480, () => boxText(ctx, 'hören können.', ZX + 12, 508, 60, t, 93.05, { dur: 0.22 }), { from: 1.2 });
  }],
  // 94,00 „… ob der Ton sauber und klangvoll ankommt oder ob da so ein Geräusch ankommt."
  [95.65, 99.90, (ctx, t) => {
    rise(ctx, 'sauber & klangvoll', ZX, 230, 38, t, 95.7);
    wave(ctx, t, 95.8, ZX, 320, 700, 56, C.white, false);
    rise(ctx, 'oder nur Geräusch?', ZX, 470, 38, t, 97.55, { col: C.white });
    wave(ctx, t, 97.65, ZX, 560, 700, 56, C.red, true);
  }],
];

// ------------------------------------------------------------- Szene
function drawOverlay(ctx, t) {
  for (const [t0, t1, fn] of EL) {
    if (t < t0 || t > t1) continue;
    const out = E.inCubic(prog(t, t1 - 0.28, t1));
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -26 * out); fn(ctx, t); ctx.restore();
  }
}
// Vorschau-Hintergrund: Bea-Standbild (A-Roll) bzw. Platzhalter für die KI-B-Roll
const bg = {};
const loadImg = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => { bg[k] = i; r(); }; i.onerror = () => r(); i.src = src; });
const grainC = (() => { const [c, x] = mk(256, 256); const d = x.createImageData(256, 256), r = mulberry32(3); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } x.putImageData(d, 0, 0); return c; })();
function drawPreviewBG(ctx, t) {
  const slot = SLOTS.find(s => t >= s[1] && t < s[2]);
  if (slot) {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#20232B'); g.addColorStop(1, '#0C0D11');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.9; const ox = Math.floor(hash(Math.floor(t * FPS)) * 256); ctx.translate(-ox, -ox);
    ctx.fillStyle = ctx.createPattern(grainC, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([14, 10]); ctx.strokeRect(40, 40, W - 80, H - 80); ctx.setLineDash([]);
    txt(ctx, 'KI-B-ROLL ' + slot[0], 90, H - 150, 54, { col: 'rgba(255,255,255,0.9)' });
    txt(ctx, slot[3] + '  ·  ' + de(slot[2] - slot[1], 1) + ' s', 90, H - 96, 30, { w: 500, col: 'rgba(255,255,255,0.7)' });
    return;
  }
  // A-Roll: abwechselnd die beiden Standbilder, leichter Push-in
  let idx = 0, segStart = 0;
  for (const s of SLOTS) { if (s[2] <= t) { idx++; segStart = s[2]; } }
  const img = bg[idx % 2 ? 'b2' : 'b1'];
  if (!img) { ctx.fillStyle = '#3A2A1E'; ctx.fillRect(0, 0, W, H); return; }
  const z = 1.0 + 0.035 * clamp((t - segStart) / 6), sc = Math.max(W / img.width, H / img.height) * z;
  ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc);
}
function drawScene(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; noShadow(ctx); ctx.setLineDash([]);
  ctx.clearRect(0, 0, W, H);
  if (MODE === 'preview') drawPreviewBG(ctx, t);
  drawOverlay(ctx, t);
}

// ------------------------------------------------------------- Renderer mit Bewegungsunschärfe (alpha-korrekt, vormultipliziert)
const out = document.getElementById('c');
const octx = out.getContext('2d', { willReadFrequently: true });
const [, wctx] = mk(W, H, true);
let acc = null;
const HITS = [1.42, 3.98, 8.30, 17.95, 21.6, 24.1, 26.35, 33.85, 37.05, 39.4, 42.3, 47.55, 50.38, 52.68, 55.08, 58.55, 59.25, 62.15, 73.9, 93.05];
const samplesAt = t => HITS.some(h => t > h - 0.08 && t < h + 0.35) || (t > 24.1 && t < 24.7) ? 12 : 6;
function renderFrame(fi, opts = {}) {
  const t0 = fi / FPS, n = opts.samples ?? samplesAt(t0), span = (opts.shutter ?? 0.5) / FPS;
  if (n <= 1) { drawScene(octx, t0); return; }
  if (!acc) acc = new Float32Array(W * H * 4);
  acc.fill(0);
  for (let s = 0; s < n; s++) {
    drawScene(wctx, Math.min(DUR - 1e-4, t0 + (s + 0.5) / n * span));
    const d = wctx.getImageData(0, 0, W, H).data;
    for (let k = 0; k < d.length; k += 4) { const a = d[k + 3]; if (!a) continue; acc[k] += d[k] * a; acc[k + 1] += d[k + 1] * a; acc[k + 2] += d[k + 2] * a; acc[k + 3] += a; }
  }
  const img = octx.createImageData(W, H), o = img.data;
  for (let k = 0; k < o.length; k += 4) { const A = acc[k + 3]; if (!A) continue; o[k] = acc[k] / A; o[k + 1] = acc[k + 1] / A; o[k + 2] = acc[k + 2] / A; o[k + 3] = A / n; }
  octx.clearRect(0, 0, W, H); octx.putImageData(img, 0, 0);
}

const ready = Promise.all([
  ...[MS(20), MS(20, 500)].map(f => document.fonts.load(f, 'ÄÖÜ„“½€₂')),
  ...(MODE === 'preview' ? [loadImg('b1', Q.get('bg1') || '../out/intro-bea/bea1.png'), loadImg('b2', Q.get('bg2') || '../out/intro-bea/bea2.png')] : []),
]).then(() => document.fonts.ready);
window.reel = { W, H, FPS, DUR, SLOTS, ready, frame(fi, o) { renderFrame(fi, o); return out.toDataURL('image/png'); }, draw: renderFrame };

if (!RENDER) {
  const pp = document.getElementById('pp'), scrub = document.getElementById('scrub'), tc = document.getElementById('tc');
  scrub.max = DUR;
  let playing = true, start = performance.now(), pos = 0;
  const now = () => playing ? ((performance.now() - start) / 1000) % DUR : pos;
  const toggle = () => { if (playing) { pos = now(); playing = false; pp.textContent = 'PLAY'; } else { start = performance.now() - pos * 1000; playing = true; pp.textContent = 'PAUSE'; } };
  pp.onclick = toggle; out.onclick = toggle;
  scrub.oninput = () => { pos = +scrub.value; start = performance.now() - pos * 1000; };
  ready.then(() => (function loop() {
    const t = now(); drawScene(octx, t);
    if (playing) scrub.value = t;
    tc.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${t % 60 < 10 ? '0' : ''}${(t % 60).toFixed(2)}`;
    requestAnimationFrame(loop);
  })());
}
})();
