/* ==========================================================================
   „Es wird einfach von der Urologie nach wie vor zu großen Teilen abgelehnt
    und nicht angeboten. Einfach weil sie es nicht selber machen. Punkt.
    Dann wird ihnen einfach die TURP angeboten. Punkt."
   8.05 s, 1920×1080, no audio. Pure black frame; everything is animated in the
   LEFT half only (hard clip at x < 960) — the speaker sits on the right.
   All word onsets live in T; ?fps=25 sets the frame rate, ?tail=1 adds run-out.
   ========================================================================== */
'use strict';
(() => {

const Q = new URLSearchParams(location.search);
const W = 1920, H = 1080, HALF = 960;
const SPEECH = 5.05 + 1.0 + 2.0;
const DUR = SPEECH + +(Q.get('tail') || 0);
const FPS = +(Q.get('fps') || 60);
const TAU = Math.PI * 2;
const RENDER = /[?&]render/.test(location.search);
if (RENDER) document.documentElement.classList.add('render');

// ------------------------------------------------------------- TIMING (s)
const T = {
  // „Es wird einfach von der Urologie nach wie vor zu großen Teilen abgelehnt und nicht angeboten."  (0 – 5.05)
  pae: 0.0, urologie: 0.75, nachWieVor: 1.5, grossenTeilen: 2.1, abgelehnt: 2.95, nichtAngeboten: 3.75,
  // „Einfach weil sie es nicht selber machen. Punkt."  (5.05 – 6.05)
  weil: 5.08, sie: 5.18, es: 5.26, nicht: 5.33, selber: 5.45, machen: 5.58, punkt1: 5.8,
  // „Dann wird ihnen einfach die TURP angeboten. Punkt."  (6.05 – 8.05)
  turpCard: 6.1, turp: 6.75, angeboten: 7.12, punkt2: 7.72,
};

const C = {
  paper: '#F4EFE6', mute: 'rgba(244,239,230,0.55)', card: '#14151B', edge: '#2B2D37',
  amber: '#FFC94A', red: '#FF4D3D', green: '#3DDC97',
};

// ------------------------------------------------------------- math kit
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const E = {
  outCubic: t => 1 - Math.pow(1 - t, 3), inCubic: t => t * t * t,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
const hump = (u, k = 0.05) => u <= 0 ? 0 : (u / k) * Math.exp(1 - u / k);
const fract = x => x - Math.floor(x);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
const noise1 = x => { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1; };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h, read = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: read })]; }
const INTER = (s, w = 800) => `${w} ${s}px "Inter"`;
const MONO = (s, w = 800) => `${w} ${s}px "JetBrains Mono"`;
const _m = new Map();
function measure(ctx, f, s, track = 0) { const k = f + '|' + track + '|' + s; let v = _m.get(k); if (v === undefined) { ctx.font = f; ctx.letterSpacing = track + 'px'; v = ctx.measureText(s).width; ctx.letterSpacing = '0px'; _m.set(k, v); } return v; }
function text(ctx, s, x, y, font, col, align = 'left', track = 0) { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.letterSpacing = track + 'px'; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; }

// ------------------------------------------------------------- layout (left half only)
const LX = 96, RX = 864;                       // content column
const PAE = { x: LX, y: 250, w: RX - LX, h: 250 };
const TURP = { x: LX, y: 640, w: RX - LX, h: 250 };

// "Punkt" — a literal full stop that slams onto the end of a line
function punkt(ctx, x, y, r, t0, t, col) {
  const u = t - t0; if (u < 0) return 0;
  const p = clamp(u / 0.16), s = lerp(5, 1, E.inCubic(p));
  const sq = hump(u - 0.16, 0.035);
  ctx.save(); ctx.translate(x, y);
  if (u > 0.16) { const q = clamp((u - 0.16) / 0.3); ctx.strokeStyle = `rgba(255,201,74,${0.6 * (1 - q)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r + 70 * E.outCubic(q), 0, TAU); ctx.stroke(); }
  ctx.globalAlpha = clamp(p * 4);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, r * 0.3 * sq, r * s * (1 + 0.35 * sq), r * s * (1 - 0.3 * sq), 0, 0, TAU); ctx.fill();
  ctx.restore();
  return hump(u - 0.16, 0.05);                 // impact strength, drives the shake
}

// ink stamp, pre-rendered with worn-ink specks (built after the fonts load)
let stamp = null;
const makeStamp = () => {
  const w = 430, h = 112, [c, x] = mk(w + 20, h + 20); x.translate(10, 10);
  x.strokeStyle = C.red; x.lineWidth = 7; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 14); x.stroke();
  x.lineWidth = 2.5; x.beginPath(); x.roundRect(15, 15, w - 30, h - 30, 8); x.stroke();
  x.font = INTER(58); x.fillStyle = C.red; x.textAlign = 'center'; x.letterSpacing = '6px'; x.fillText('ABGELEHNT', w / 2 + 3, h / 2 + 21);
  x.globalCompositeOperation = 'destination-out'; const r = mulberry32(5);
  for (let i = 0; i < 900; i++) { x.globalAlpha = 0.3 + r() * 0.7; x.beginPath(); x.arc(r() * w, r() * h, 0.4 + r() * 1.6, 0, TAU); x.fill(); }
  return c;
};

function iconPAE(ctx, x, y, s, col) {           // artery branching into the prostate, embolic dots
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-34, -46); ctx.bezierCurveTo(-30, -10, -6, -4, 0, 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.quadraticCurveTo(14, 18, 30, 8); ctx.moveTo(0, 12); ctx.quadraticCurveTo(4, 32, 22, 42); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(18, 26, 30, 26, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = col; for (const [dx, dy] of [[30, 8], [22, 42], [12, 24]]) { ctx.beginPath(); ctx.arc(dx, dy, 5, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function iconTURP(ctx, x, y, s, col) {          // resectoscope with cutting loop
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-40, 34); ctx.lineTo(18, -24); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(28, -34, 14, 0, TAU); ctx.stroke();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-40, 34); ctx.lineTo(-52, 46); ctx.stroke();
  ctx.restore();
}

function card(ctx, R, a) {
  ctx.fillStyle = C.card; ctx.strokeStyle = C.edge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(R.x, R.y, R.w, R.h, 26); ctx.fill(); ctx.stroke();
}

// ------------------------------------------------------------- frame
function drawScene(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.letterSpacing = '0px';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, HALF, H); ctx.clip();      // nothing ever reaches the speaker's half

  // impact shake from stamp + the two „Punkt"
  const imp = Math.max(hump(t - T.abgelehnt - 0.14, 0.04), hump(t - T.punkt1 - 0.16, 0.05), hump(t - T.punkt2 - 0.16, 0.05));
  ctx.translate(9 * imp * noise1(t * 60), 9 * imp * noise1(t * 60 + 30));

  // header: UROLOGIE chip + the speaker's qualifiers
  const ch = E.outCubic(prog(t, T.urologie - 0.1, T.urologie + 0.35));
  if (ch > 0) {
    ctx.save(); ctx.globalAlpha = ch; ctx.translate(0, (1 - ch) * 16);
    const cw = measure(ctx, MONO(20), 'UROLOGIE', 4) + 44;
    ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(LX, 132, cw, 46, 23); ctx.stroke();
    text(ctx, 'UROLOGIE', LX + 22, 162, MONO(20), C.amber, 'left', 4);
    let qx = LX + cw + 22;
    for (const [w, t0] of [['NACH WIE VOR', T.nachWieVor], ['·', T.grossenTeilen - 0.05], ['ZU GROSSEN TEILEN', T.grossenTeilen]]) {
      const q = E.outCubic(prog(t, t0, t0 + 0.3));
      if (q > 0) { ctx.globalAlpha = ch * q; text(ctx, w, qx, 162 + (1 - q) * 10, MONO(18, 500), C.mute, 'left', 2); }
      qx += measure(ctx, MONO(18, 500), w + ' ', 2) + 6;
    }
    ctx.restore();
  }

  // PAE card
  const pin = E.outCubic(prog(t, T.pae, T.pae + 0.55));
  const off = smooth(prog(t, T.nichtAngeboten, T.nichtAngeboten + 0.45));
  ctx.save(); ctx.translate((1 - pin) * -620, 0); ctx.globalAlpha = clamp(pin * 1.5);
  card(ctx, PAE);
  const tc = off > 0 ? `rgba(244,239,230,${1 - 0.6 * off})` : C.paper;
  iconPAE(ctx, PAE.x + 98, PAE.y + 112, 1.25, off > 0 ? `rgba(255,201,74,${1 - 0.65 * off})` : C.amber);
  text(ctx, 'PAE', PAE.x + 200, PAE.y + 150, INTER(118), tc, 'left', -2);
  text(ctx, 'Prostata-Arterien-Embolisation', PAE.x + 204, PAE.y + 204, INTER(30, 500), off > 0 ? `rgba(244,239,230,${0.7 - 0.4 * off})` : 'rgba(244,239,230,0.7)');
  // strike-through on „nicht angeboten"
  const st = E.inOutCubic(prog(t, T.nichtAngeboten + 0.1, T.nichtAngeboten + 0.45));
  if (st > 0) { ctx.strokeStyle = C.red; ctx.lineWidth = 9; ctx.lineCap = 'round'; const sx = PAE.x + 192, sw = measure(ctx, INTER(118), 'PAE', -2) + 20; ctx.beginPath(); ctx.moveTo(sx, PAE.y + 108); ctx.lineTo(sx + sw * st, PAE.y + 108); ctx.stroke(); }
  // stamp on „abgelehnt"
  const su = t - T.abgelehnt;
  if (su > 0) {
    const p = clamp(su / 0.14), s = lerp(2.4, 1, E.inCubic(p));
    ctx.save(); ctx.translate(PAE.x + 590, PAE.y + 96); ctx.rotate(-0.12); ctx.scale(s * 0.84, s * 0.84); ctx.globalAlpha = clamp(p * 3) * 0.95;
    ctx.drawImage(stamp, -stamp.width / 2, -stamp.height / 2); ctx.restore();
  }
  ctx.restore();
  // „nicht angeboten" tag under the card
  const ng = E.outBack(prog(t, T.nichtAngeboten + 0.2, T.nichtAngeboten + 0.55), 2);
  if (ng > 0) {
    ctx.save(); ctx.translate(LX, PAE.y + PAE.h + 26); ctx.globalAlpha = clamp(ng); ctx.scale(ng, ng);
    const w = measure(ctx, INTER(28), 'nicht angeboten') + 84;
    ctx.fillStyle = 'rgba(255,77,61,0.14)'; ctx.beginPath(); ctx.roundRect(0, 0, w, 54, 27); ctx.fill();
    ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(22, 17); ctx.lineTo(42, 37); ctx.moveTo(42, 17); ctx.lineTo(22, 37); ctx.stroke();
    text(ctx, 'nicht angeboten', 60, 37, INTER(28), C.red);
    ctx.restore();
  }

  // „Weil sie es nicht selber machen."  (+ Punkt 1)
  const exit2 = E.inCubic(prog(t, T.turpCard - 0.08, T.turpCard + 0.2));
  if (t > T.weil && exit2 < 1) {
    ctx.save(); ctx.globalAlpha = 1 - exit2; ctx.translate(0, -exit2 * 40);
    const f = INTER(70), y1 = 700, y2 = 790;
    let x = LX;
    for (const [w, t0] of [['Weil', T.weil], ['sie', T.sie], ['es', T.es], ['nicht', T.nicht]]) {
      const q = E.outExpo(prog(t, t0, t0 + 0.2));
      ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y1 - 80, 600, 100); ctx.clip();
      text(ctx, w, x, y1 + (1 - q) * 90, f, w === 'nicht' ? C.amber : C.paper); ctx.restore();
      x += measure(ctx, f, w + ' ');
    }
    x = LX;
    for (const [w, t0] of [['selber', T.selber], ['machen', T.machen]]) {
      const q = E.outExpo(prog(t, t0, t0 + 0.2));
      ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y2 - 80, 700, 100); ctx.clip();
      text(ctx, w, x, y2 + (1 - q) * 90, f, w === 'selber' ? C.amber : C.paper); ctx.restore();
      x += measure(ctx, f, w + (w === 'selber' ? ' ' : ''));
    }
    punkt(ctx, x + 18, y2 - 9, 11, T.punkt1, t, C.paper);
    ctx.restore();
  }

  // TURP card (+ „angeboten" badge + Punkt 2)
  const tin = E.outCubic(prog(t, T.turpCard, T.turpCard + 0.5));
  if (tin > 0) {
    ctx.save(); ctx.translate(0, (1 - tin) * 220); ctx.globalAlpha = clamp(tin * 1.6);
    const glow = smooth(prog(t, T.angeboten, T.angeboten + 0.4));
    if (glow > 0) { ctx.shadowColor = `rgba(61,220,151,${0.35 * glow})`; ctx.shadowBlur = 40; }
    card(ctx, TURP); ctx.shadowColor = 'transparent';
    if (glow > 0) { ctx.strokeStyle = `rgba(61,220,151,${0.8 * glow})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(TURP.x, TURP.y, TURP.w, TURP.h, 26); ctx.stroke(); }
    iconTURP(ctx, TURP.x + 98, TURP.y + 112, 1.25, C.paper);
    const q = E.outExpo(prog(t, T.turp, T.turp + 0.3));
    ctx.save(); ctx.beginPath(); ctx.rect(TURP.x + 190, TURP.y + 20, 560, 150); ctx.clip();
    text(ctx, 'TURP', TURP.x + 200, TURP.y + 150 + (1 - q) * 140, INTER(118), C.paper, 'left', -2); ctx.restore();
    text(ctx, 'Transurethrale Resektion der Prostata', TURP.x + 204, TURP.y + 204, INTER(30, 500), `rgba(244,239,230,${0.7 * smooth(prog(t, T.turp + 0.1, T.turp + 0.4))})`);
    const tw = measure(ctx, INTER(118), 'TURP', -2);
    punkt(ctx, TURP.x + 200 + tw + 22, TURP.y + 136, 16, T.punkt2, t, C.paper);
    ctx.restore();
    // badge
    const b = E.outBack(prog(t, T.angeboten, T.angeboten + 0.35), 2);
    if (b > 0) {
      const w = measure(ctx, INTER(28), 'angeboten') + 84;
      ctx.save(); ctx.translate(LX, TURP.y + TURP.h + 26); ctx.globalAlpha = clamp(b); ctx.scale(b, b);
      ctx.fillStyle = 'rgba(61,220,151,0.14)'; ctx.beginPath(); ctx.roundRect(0, 0, w, 54, 27); ctx.fill();
      ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(21, 28); ctx.lineTo(30, 37); ctx.lineTo(45, 18); ctx.stroke();
      text(ctx, 'angeboten', 60, 37, INTER(28), C.green);
      ctx.restore();
    }
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------- motion-blur renderer
const out = document.getElementById('c');
const octx = out.getContext('2d', { willReadFrequently: true });
const [, wctx] = mk(W, H, true);
let acc = null;
const near = (t, k, w = 0.35) => t > T[k] - 0.05 && t < T[k] + w;
const samplesAt = t => (t < 0.6 || near(t, 'abgelehnt') || near(t, 'punkt1') || near(t, 'punkt2') || near(t, 'turpCard', 0.6) || (t > T.weil && t < T.machen + 0.25)) ? 16 : 8;
function renderFrame(fi, opts = {}) {
  const t0 = fi / FPS, n = opts.samples ?? samplesAt(t0), span = (opts.shutter ?? 0.5) / FPS;
  if (n <= 1) { drawScene(octx, t0); return; }
  if (!acc) acc = new Float32Array(W * H * 4);
  acc.fill(0);
  for (let s = 0; s < n; s++) {
    drawScene(wctx, Math.min(DUR - 1e-4, t0 + (s + 0.5) / n * span));
    const d = wctx.getImageData(0, 0, W, H).data;
    for (let k = 0; k < d.length; k++) acc[k] += d[k];
  }
  const img = octx.createImageData(W, H), o = img.data, inv = 1 / n;
  for (let k = 0; k < o.length; k++) o[k] = acc[k] * inv;
  octx.putImageData(img, 0, 0);
}

const ready = Promise.all([INTER(20), INTER(20, 500), MONO(20), MONO(20, 500)].map(f => document.fonts.load(f, 'ÄÖÜ'))).then(() => document.fonts.ready).then(() => { stamp = makeStamp(); });
window.reel = { W, H, FPS, DUR, T, ready, frame(fi, o) { renderFrame(fi, o); return out.toDataURL('image/png'); }, draw: renderFrame };

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
    if (playing) scrub.value = t; tc.textContent = t.toFixed(3).padStart(6, '0');
    requestAnimationFrame(loop);
  })());
}
})();
