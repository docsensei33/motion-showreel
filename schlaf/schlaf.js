/* ==========================================================================
   „Ein normaler Schlaf bedeutet, man legt sich am Abend ins Bett
    und man steht in der Frühe wieder auf."
   Kinetic-typography / character piece, 1920×1080, no audio.
   Cut to the voice-over: the spoken sentence lasts 4.011 s.
   Every frame is a pure function of time; all timings live in T below,
   so the piece can be re-timed to a voice-over in one place.
   ?fps=25 sets the frame rate, ?tail=1.5 adds seconds of run-out after the line.
   ========================================================================== */
'use strict';
(() => {

const Q = new URLSearchParams(location.search);
const SPEECH = 4.011;
const W = 1920, H = 1080, DUR = SPEECH + +(Q.get('tail') || 0);
const FPS = +(Q.get('fps') || 60);
const TAU = Math.PI * 2, CX = W / 2;
const RENDER = /[?&]render/.test(location.search);
if (RENDER) document.documentElement.classList.add('render');

// ------------------------------------------------------------- TIMING (s)
const T = {
  // „Ein normaler Schlaf bedeutet,"  (word onsets, seconds into the line)
  ein: 0.0, normaler: 0.15, schlaf: 0.59, bedeutet: 0.73, eq: 0.92, eqDrop: 1.02, outA: 1.18, bedPop: 1.26,
  // „man legt sich am Abend ins Bett" — the jump lands on „Bett"
  figIn: 1.2, man: 1.29, legt: 1.43, sich: 1.58, am: 1.72, abend: 1.87, ins: 2.16, bett: 2.31,
  crouch: 1.78, jump: 1.92, land: 2.31, blanket: 2.35, lie: 2.31, outB: 2.4,
  // night time-lapse: moon arc 22:00 -> 06:30, sunrise on „Frühe"
  lightsOut: 2.31, ffA: 2.42, ffB: 3.25,
  // „und man steht in der Frühe wieder auf." — he lands on his feet on „auf"
  und: 2.53, man2: 2.67, steht: 2.82, in: 2.96, der: 3.11, fruehe: 3.25, wieder: 3.54, auf: 3.83,
  wake: 3.27, getUp: 3.48, stand: 3.86, stretch: 4.35,
};

// ------------------------------------------------------------- palette
const C = {
  ink: '#0A0B1A', paper: '#F4EFE6', amber: '#FFB547', coral: '#FF6A3D', gold: '#FFD58A',
  lilac: '#A99BFF', violet: '#4A3F8F', violetD: '#2E2763', pillow: '#D9D1FF',
};

// ------------------------------------------------------------- math kit
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const fract = x => x - Math.floor(x);
const E = {
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
const spring = (t, hz = 2, damp = 8) => t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(TAU * hz * t);
const hump = (u, k = 0.06) => u <= 0 ? 0 : (u / k) * Math.exp(1 - u / k);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const rgba = (h, a) => rgb(hex(h), a);
const mixC = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// ------------------------------------------------------------- canvas kit
function mk(w, h, read = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: read })]; }
function reset(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.letterSpacing = '0px'; }
function disc(ctx, x, y, r) { if (r <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
const U = (s, w = 800) => `${w} ${s}px "Unbounded"`;
const SERIF = s => `italic 600 ${s}px "Fraunces"`;
const MONO = (s, w = 800) => `${w} ${s}px "JetBrains Mono"`;
const _m = new Map();
function measure(ctx, f, s) { const k = f + '|' + s; let v = _m.get(k); if (v === undefined) { ctx.font = f; ctx.letterSpacing = '0px'; v = ctx.measureText(s).width; _m.set(k, v); } return v; }
const _cap = new Map();
function capH(ctx, f) { let v = _cap.get(f); if (v === undefined) { ctx.font = f; v = ctx.measureText('H').actualBoundingBoxAscent; _cap.set(f, v); } return v; }

// ------------------------------------------------------------- stage geometry
const HOR = 840;                                   // horizon / floor line
const ARC = { cx: 960, cy: HOR, rx: 780, ry: 400 };
const arcPt = phi => [ARC.cx + ARC.rx * Math.cos(phi), ARC.cy - ARC.ry * Math.sin(phi)];
const BED = { x0: 700, x1: 1280, matT: 715, matB: 760, baseB: 790 };
const STAND_L = [360, 690], LIE = [1000, 675], STAND_R = [1460, 690];

// ------------------------------------------------------------- sky
const SKY = [
  [0.0, '#1E1748', '#4F2A6E', '#FF8A4C'],
  [1.3, '#1B1442', '#4A2468', '#FF7B47'],
  [2.25, '#130F36', '#2E1B57', '#B8445C'],
  [2.62, '#05071A', '#0A0F30', '#18204E'],
  [3.05, '#05071A', '#0A0F30', '#18204E'],
  [3.6, '#1C2A64', '#6A5AA6', '#FFB070'],
  [4.3, '#28468F', '#8E86C9', '#FFD6A0'],
  [99, '#28468F', '#8E86C9', '#FFD6A0'],
].map(([t, ...c]) => [t, ...c.map(hex)]);
function skyAt(t) {
  let i = 0; while (t > SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], p = E.inOutSine(prog(t, a[0], b[0]));
  return [1, 2, 3].map(k => mixC(a[k], b[k], p));
}
const nightAmt = t => smooth(prog(t, 2.2, 2.6)) * (1 - smooth(prog(t, 3.1, 3.6)));
const STARS = (() => { const r = mulberry32(42), s = []; for (let i = 0; i < 170; i++) s.push([r() * W, r() * (HOR - 60), 0.6 + r() * 1.8, r() * TAU, 0.5 + r() * 2]); return s; })();

// ------------------------------------------------------------- clock
// seconds of the day shown at time t
function clockSec(t) {
  const s0 = 22 * 3600 - T.lightsOut;           // flips to 22:00 exactly at T.lightsOut
  if (t < T.ffA) return s0 + t;
  const a = s0 + T.ffA, b = 24 * 3600 + 6.5 * 3600;   // 06:30 next morning
  if (t < T.ffB) return lerp(a, b, E.inOutCubic(prog(t, T.ffA, T.ffB)));
  return b + (t - T.ffB);
}
const hhmm = s => { const m = Math.floor(s / 60); return [Math.floor(m / 60) % 24, m % 60].map(v => String(v).padStart(2, '0')).join(':'); };

// ------------------------------------------------------------- typography
// phrase -> lines -> words { s, f, col, t, kind }
const PHRASES = [
  { out: T.outA, lines: [
    { y: 215, out: 1.16, words: [{ s: 'Ein', f: U(100), t: T.ein }, { s: 'normaler', f: SERIF(150), col: C.amber, t: T.normaler, kind: 'serif' }, { s: 'Schlaf', f: U(100, 900), t: T.schlaf }] },
    { y: 345, out: 1.56, words: [{ s: 'bedeutet,', f: SERIF(110), t: T.bedeutet, kind: 'serif' }], eq: true },
  ] },
  { out: T.outB, dreamy: true, lines: [
    { y: 215, out: 2.43, words: [{ s: 'man', f: U(100), t: T.man }, { s: 'legt', f: U(100), t: T.legt, kind: 'lie' }, { s: 'sich', f: U(100), t: T.sich }] },
    { y: 352, out: 2.8, words: [{ s: 'am', f: U(100), t: T.am }, { s: 'Abend', f: SERIF(146), col: C.amber, t: T.abend, kind: 'serif' }, { s: 'ins', f: U(100), t: T.ins }, { s: 'Bett', f: U(100), t: T.bett, kind: 'dip' }] },
  ] },
  { out: 99, lines: [
    { y: 215, words: [{ s: 'und', f: U(92), t: T.und }, { s: 'man', f: U(92), t: T.man2 }, { s: 'steht', f: U(92), t: T.steht, kind: 'stand' }] },
    { y: 350, words: [{ s: 'in', f: U(92), t: T.in }, { s: 'der', f: U(92), t: T.der }, { s: 'Frühe', f: SERIF(136), col: C.gold, t: T.fruehe, kind: 'serif' }, { s: 'wieder', f: U(92), t: T.wieder }, { s: 'auf.', f: U(92), t: T.auf, kind: 'hop' }] },
  ] },
];
const EQ = { w: 120, h: 18, gap: 22 };
let laidOut = false;
function layoutAll(ctx) {
  if (laidOut) return; laidOut = true;
  for (const ph of PHRASES) for (const ln of ph.lines) {
    const sp = measure(ctx, U(96), ' ') * 0.95;
    let w = 0;
    ln.words.forEach((wd, i) => {
      wd.w = measure(ctx, wd.f, wd.s); wd.size = +wd.f.match(/(\d+)px/)[1];
      wd.letters = [...wd.s].map((ch, k) => { const x0 = measure(ctx, wd.f, wd.s.slice(0, k)), x1 = measure(ctx, wd.f, wd.s.slice(0, k + 1)); return { ch, c: (x0 + x1) / 2, w: x1 - x0 }; });
      w += wd.w + (i ? sp : 0);
    });
    if (ln.eq) w += 50 + EQ.w;
    let x = CX - w / 2;
    ln.words.forEach(wd => { wd.x = x; x += wd.w + sp; });
    if (ln.eq) ln.eqX = x - sp + 50;
  }
}

function drawWord(ctx, wd, y, t, exitP, idx, dreamy) {
  const u = t - wd.t; if (u <= 0) return;
  const cap = capH(ctx, wd.f), n = wd.letters.length;
  ctx.font = wd.f; ctx.textAlign = 'center'; ctx.fillStyle = wd.col || C.paper;
  wd.letters.forEach((L, k) => {
    let dy = 0, sx = 1, sy = 1, rot = 0, a = 1, clip = false;
    const kind = wd.kind;
    if (kind === 'serif') {
      const p = prog(u, k * 0.016, k * 0.016 + 0.34);
      a = clamp(p * 2.5); dy = (1 - E.outBack(p, 1.4)) * 60; const s = lerp(0.75, 1, E.outBack(p, 2)); sx = sy = s; rot = (1 - E.outCubic(p)) * -0.25;
    } else if (kind === 'stand') {
      // letters start lying flat on the baseline and spring upright
      const s = spring(u - k * 0.03, 3.4, 12);
      a = clamp((u - k * 0.03) * 14); sy = lerp(0.08, 1, s); sx = lerp(1.35, 1, Math.min(1, s));
    } else {
      clip = true;
      const p = kind === 'hop' ? E.outBack(prog(u, k * 0.01, k * 0.01 + 0.13), 2.2) : E.outExpo(prog(u, k * 0.014, k * 0.014 + 0.3));
      dy = (1 - p) * wd.size * 1.25;
      if (kind === 'breathe') {
      }
      if (kind === 'lie') {
        // „legt" lies down when the character lands in bed
        const s = spring(t - T.lie - (n - 1 - k) * 0.02, 3.2, 11);
        sy = lerp(1, 0.6, s); sx = lerp(1, 1.15, s);
      }
      if (kind === 'dip') dy += 14 * hump(t - T.land, 0.05);
      if (kind === 'hop') {
        const h = t - T.stand + 0.06 - k * 0.025;
        dy -= 34 * Math.sin(Math.PI * clamp(h / 0.16)) * (h > 0 && h < 0.16 ? 1 : 0);
        if (h > 0.16 && h < 0.3) { const q = (h - 0.16) / 0.14; sy = 1 - 0.16 * Math.sin(Math.PI * q); sx = 1 + 0.1 * Math.sin(Math.PI * q); }
      }
    }
    // exits
    if (exitP > 0) {
      const ep = clamp(exitP * 1.6 - (idx * 0.08 + k * 0.02));
      if (dreamy) { dy -= E.inCubic(ep) * 60; a *= 1 - smooth(ep); }
      else { dy -= E.inCubic(ep) * 120; a *= 1 - ep; }
    }
    if (a <= 0.003) return;
    const lx = wd.x + L.c + (dreamy && exitP > 0 ? (L.c - wd.w / 2) * 0.12 * smooth(exitP) : 0);
    ctx.save();
    if (clip) { ctx.beginPath(); ctx.rect(lx - L.w / 2 - 30, y - cap * 1.6, L.w + 60, cap * 1.6 + wd.size * 0.3); ctx.clip(); }
    ctx.globalAlpha = a; ctx.translate(lx, y + dy); ctx.rotate(rot); ctx.scale(sx, sy); ctx.fillText(L.ch, 0, 0);
    ctx.restore();
  });
}

const lineShift = (ln, t) => ln.eq ? (50 + EQ.w) / 2 * (1 - E.outExpo(prog(t, T.eq - 0.06, T.eq + 0.2))) : 0;
function drawText(ctx, t) {
  layoutAll(ctx);
  for (const ph of PHRASES) {
    let idx = 0;
    for (const ln of ph.lines) {
      const out = ln.out ?? ph.out, exitP = prog(t, out, out + 0.16);
      if (exitP >= 1) { idx += ln.words.length; continue; }
      ctx.save(); ctx.translate(lineShift(ln, t), 0);
      for (const wd of ln.words) drawWord(ctx, wd, ln.y, t, exitP, idx++, ph.dreamy);
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------- the „=" that becomes the bed
function eqBars(ctx, t) {
  layoutAll(ctx);
  const ln = PHRASES[0].lines[1], cap = capH(ctx, U(100));
  const mid = ln.y - cap / 2, x = ln.eqX + lineShift(ln, t);
  return [
    { x, y: mid - EQ.gap / 2 - EQ.h, w: EQ.w, h: EQ.h },
    { x, y: mid + EQ.gap / 2, w: EQ.w, h: EQ.h },
  ];
}
function drawBed(ctx, t) {
  const [b1, b2] = eqBars(ctx, t);
  const draw = prog(t, T.eq, T.eq + 0.12);
  if (draw <= 0) return;
  const m = E.inOutCubic(prog(t, T.eqDrop, T.eqDrop + 0.28));
  const thud = hump(t - T.eqDrop - 0.28, 0.04);
  const sink = 6 * thud + 12 * hump(t - T.land, 0.05) + 2.5 * Math.sin(TAU * (t - T.land) / 1.0) * smooth(prog(t, T.land + 0.2, T.land + 0.5)) * (1 - smooth(prog(t, T.getUp, T.getUp + 0.15)));
  const dipUp = 8 * hump(t - T.getUp - 0.02, 0.05);
  const tgtM = { x: BED.x0 + 20, y: BED.matT + sink - dipUp, w: BED.x1 - BED.x0 - 40, h: BED.matB - BED.matT };
  const tgtB = { x: BED.x0, y: BED.matB, w: BED.x1 - BED.x0, h: BED.baseB - BED.matB };
  const L = (a, b) => ({ x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m), w: lerp(a.w, b.w, m), h: lerp(a.h, b.h, m) });
  const r1 = L(b1, tgtM), r2 = L(b2, tgtB);
  const grow = k => E.outBack(prog(t, T.bedPop + k * 0.04, T.bedPop + 0.24 + k * 0.04), 2.2);

  // floor shadow
  const sh = grow(0);
  if (sh > 0) { ctx.fillStyle = `rgba(0,0,0,${0.35 * Math.min(1, sh)})`; ctx.beginPath(); ctx.ellipse(990, HOR + 6, 330 * sh, 14, 0, 0, TAU); ctx.fill(); }
  // legs
  const lg = grow(0);
  if (lg > 0) { ctx.fillStyle = C.violetD; rrect(ctx, BED.x0 + 18, BED.baseB - 4, 22, (HOR - BED.baseB + 4) * lg, 4); rrect(ctx, BED.x1 - 40, BED.baseB - 4, 22, (HOR - BED.baseB + 4) * lg, 4); }
  // headboard
  const hb = grow(1);
  if (hb > 0) { const hh = 180 * hb; ctx.fillStyle = C.violet; rrect(ctx, BED.x0, BED.baseB - hh, 38, hh, [18, 18, 4, 4]); }
  // base + mattress (the two bars of „=")
  const a = clamp(draw * 1.5);
  ctx.globalAlpha = a;
  ctx.fillStyle = m > 0 ? rgb(mixC(hex(C.paper), hex(C.violet), m)) : C.paper;
  rrect(ctx, r2.x, r2.y, r2.w * E.outExpo(draw), r2.h, lerp(6, 8, m));
  ctx.fillStyle = m > 0 ? rgb(mixC(hex(C.paper), hex(C.lilac), m)) : C.paper;
  rrect(ctx, r1.x, r1.y, r1.w * E.outExpo(prog(t, T.eq + 0.08, T.eq + 0.5)), r1.h, lerp(6, 20, m));
  ctx.globalAlpha = 1;
  // pillow
  const pw = grow(2);
  if (pw > 0) { ctx.save(); ctx.translate(805, BED.matT + sink - dipUp - 14); ctx.scale(pw, pw); ctx.fillStyle = C.pillow; rrect(ctx, -58, -18, 116, 36, 18); ctx.restore(); }
}
function drawFootboard(ctx, t) {
  const g = E.outBack(prog(t, T.bedPop + 0.1, T.bedPop + 0.34), 2.2);
  if (g <= 0) return;
  const hh = 112 * g; ctx.fillStyle = C.violet; rrect(ctx, BED.x1 - 36, BED.baseB - hh, 36, hh, [14, 14, 4, 4]);
}

// ------------------------------------------------------------- nightstand + alarm clock
function drawNightstand(ctx, t) {
  const g = E.outBack(prog(t, T.bedPop + 0.04, T.bedPop + 0.28), 1.8);
  if (g <= 0) return;
  ctx.save(); ctx.translate(580, HOR); ctx.scale(1, g); ctx.translate(-580, -HOR);
  ctx.fillStyle = C.violetD; rrect(ctx, 505, 740, 150, HOR - 740, [10, 10, 2, 2]);
  ctx.fillStyle = rgba(C.paper, 0.12); rrect(ctx, 520, 780, 120, 4, 2);
  ctx.restore();
  const cg = E.outBack(prog(t, T.bedPop + 0.12, T.bedPop + 0.36), 2.5);
  if (cg <= 0) return;
  ctx.save(); ctx.translate(580, 740); ctx.scale(cg, cg);
  ctx.fillStyle = '#15122E'; rrect(ctx, -70, -70, 140, 70, 16);
  const s = clockSec(t), ff = t > T.ffA && t < T.ffB;
  const colon = ff || fract(s) < 0.5;
  const str = hhmm(s), glow = t < T.fruehe ? C.coral : C.gold;
  ctx.font = MONO(34); ctx.textAlign = 'center'; ctx.fillStyle = glow;
  ctx.shadowColor = glow; ctx.shadowBlur = 18;
  ctx.fillText(colon ? str : str.replace(':', ' '), 0, -22);
  ctx.restore();
  // a tick pulse on every real second
  if (!ff) { const u = fract(s); ctx.strokeStyle = rgba(C.coral, 0.35 * (1 - u)); ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(510 - 8 * u, 670 - 8 * u, 140 + 16 * u, 70 + 16 * u, 18); ctx.stroke(); }
}

// ------------------------------------------------------------- the sleeper
function pose(t) {
  const p = { x: STAND_L[0], y: STAND_L[1], rot: 0, sx: 1, sy: 1, s: 0, lie: 0, eyes: 1 };
  p.s = E.outBack(prog(t, T.figIn, T.figIn + 0.28), 2.2);
  if (t < T.jump) {
    p.sy = 1 + 0.012 * Math.sin(TAU * t / 2.2) - 0.16 * smooth(prog(t, T.crouch, T.jump)); p.sx = 2 - p.sy;
  } else if (t < T.land) {
    const q = prog(t, T.jump, T.land);
    p.x = lerp(STAND_L[0], LIE[0], q); p.y = lerp(STAND_L[1], LIE[1], q) - 60 * 4 * q * (1 - q);
    p.rot = -Math.PI / 2 * E.inOutCubic(q); p.lie = E.inOutCubic(q);
    p.sy = 1 + 0.14 * Math.sin(Math.PI * q); p.sx = 1 / p.sy;
  } else if (t < T.getUp) {
    p.x = LIE[0]; p.y = LIE[1]; p.rot = -Math.PI / 2; p.lie = 1;
    const sq = hump(t - T.land, 0.045);
    p.sx = 1 - 0.28 * sq + 0.035 * Math.sin(TAU * (t - T.land) / 1.0) * smooth(prog(t, T.land + 0.2, T.land + 0.5)); p.sy = 1 + 0.1 * sq;
  } else if (t < T.stand) {
    const q = prog(t, T.getUp, T.stand);
    p.x = lerp(LIE[0], STAND_R[0], q); p.y = lerp(LIE[1], STAND_R[1], q) - 30 * 4 * q * (1 - q);
    p.rot = -Math.PI / 2 * (1 - E.outBack(q, 1.6)); p.lie = 1 - q;
    p.sy = 1 + 0.16 * Math.sin(Math.PI * q); p.sx = 1 / p.sy;
  } else {
    p.x = STAND_R[0]; p.y = STAND_R[1];
    const sq = hump(t - T.stand, 0.04), st = Math.sin(Math.PI * prog(t, T.stretch, T.stretch + 0.9));
    p.sy = 1 - 0.22 * sq + 0.09 * st + 0.012 * Math.sin(TAU * t / 2.2); p.sx = 1 + 0.16 * sq - 0.06 * st;
    p.rot = 0.04 * Math.sin(Math.PI * prog(t, T.stretch, T.stretch + 0.9) * 2) * st;
  }
  // eyes: open (1) / closed (0)
  const closed = smooth(prog(t, T.land + 0.05, T.land + 0.16)) * (1 - smooth(prog(t, T.wake, T.wake + 0.07)));
  let blink = 0; for (const bt of [0.9, 4.6, 5.3]) blink = Math.max(blink, hump(t - bt, 0.05) * 1.0);
  p.eyes = clamp(1 - closed - blink);
  return p;
}
function drawSleeper(ctx, t) {
  const p = pose(t);
  if (p.s <= 0) return;
  // ground shadow
  const air = clamp((STAND_L[1] - p.y) / 300);
  if (p.lie < 0.5) { ctx.fillStyle = `rgba(0,0,0,${0.35 * p.s * (1 - air) * (1 - p.lie * 2)})`; ctx.beginPath(); ctx.ellipse(p.x, HOR + 4, 58 * (1 - air * 0.5), 10, 0, 0, TAU); ctx.fill(); }
  ctx.save();
  ctx.translate(p.x, p.y + 150); ctx.scale(p.s, p.s); ctx.translate(0, -150);   // pop-in from the feet
  ctx.rotate(p.rot);
  const px = -40 * p.lie;                                                        // squash pivot: feet when standing, back when lying
  ctx.translate(px, 150 * (1 - p.lie)); ctx.scale(p.sx, p.sy); ctx.translate(-px, -150 * (1 - p.lie));
  ctx.fillStyle = C.paper;
  rrect(ctx, -40, -150, 80, 300, 40);
  disc(ctx, 0, -200, 42);
  // face looks right when standing (= up when lying)
  ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const ex of [10, 28]) {
    if (p.eyes > 0.15) { ctx.beginPath(); ctx.ellipse(ex, -206, 4.5, 6.5 * p.eyes, 0, 0, TAU); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(ex, -208, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  }
  ctx.restore();
}
function drawBlanket(ctx, t) {
  const on = E.outCubic(prog(t, T.blanket, T.blanket + 0.22));
  const off = E.inOutCubic(prog(t, T.wake, T.getUp + 0.03));
  const reach = on * (1 - off);
  if (reach <= 0.001) return;
  const breathe = 3 * Math.sin(TAU * (t - T.land) / 1.0) * smooth(prog(t, T.land + 0.2, T.land + 0.5));
  const right = BED.x1 - 30, left = lerp(right, 885, reach);
  ctx.fillStyle = C.coral;
  ctx.beginPath(); ctx.roundRect(left, 628 - breathe, right - left, 100 + breathe, [26, 10, 10, 26]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(left + 18, 628 - breathe + 16, Math.max(0, 26 * reach), 84);
}
function drawZs(ctx, t) {
  for (let i = 0; i < 3; i++) {
    const t0 = T.land + 0.25 + i * 0.2, u = (t - t0) / 0.75;
    if (u <= 0 || u >= 1 || t > T.wake) continue;
    const a = Math.sin(Math.PI * u) * (1 - smooth(prog(t, T.wake - 0.1, T.wake)));
    ctx.save(); ctx.globalAlpha = a; ctx.font = SERIF(34 + i * 10 + u * 18); ctx.fillStyle = C.lilac; ctx.textAlign = 'center';
    ctx.translate(830 + u * 140 + Math.sin(u * 6 + i) * 18, 600 - u * 170); ctx.rotate(-0.25 + Math.sin(u * 4) * 0.15);
    ctx.fillText('z', 0, 0); ctx.restore();
  }
}

// ------------------------------------------------------------- sky elements
function drawSky(ctx, t) {
  const [top, mid, hor] = skyAt(t);
  const g = ctx.createLinearGradient(0, 0, 0, HOR);
  g.addColorStop(0, rgb(top)); g.addColorStop(0.55, rgb(mid)); g.addColorStop(1, rgb(hor));
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, HOR + 300);
  // stars
  const na = nightAmt(t);
  if (na > 0) for (const [x, y, r, ph, sp] of STARS) {
    const tw = 0.55 + 0.45 * Math.sin(t * sp * 3 + ph);
    ctx.fillStyle = `rgba(244,239,230,${na * tw * (0.35 + 0.65 * (1 - y / HOR))})`;
    ctx.fillRect(x - r / 2 + (t - 6) * -4, y - r / 2, r, r);
  }
}
function glowAt(ctx, x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}
const [moonC, moonX] = mk(160, 160);
function drawCelestial(ctx, t) {
  ctx.save(); ctx.beginPath(); ctx.rect(-300, -300, W + 600, HOR + 300); ctx.clip();
  // evening sun sinking at the west end of the arc
  const ds = prog(t, 0, T.land + 0.05);
  if (ds > 0 && ds < 1) {
    const a = 1;
    const x = lerp(250, 150, E.inOutSine(ds)), y = lerp(560, HOR + 100, E.inOutSine(ds));
    glowAt(ctx, x, y, 560, C.amber, 0.45 * a);
    ctx.globalAlpha = a; ctx.fillStyle = C.amber; disc(ctx, x, y, 74); ctx.globalAlpha = 1;
  }
  // the night arc: one unbroken line from evening to morning
  const plan = smooth(prog(t, T.land, T.ffA + 0.1)) * (1 - smooth(prog(t, 4.3, 5)) * 0.5);
  if (plan > 0) {
    ctx.save(); ctx.setLineDash([2, 14]); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(C.paper, 0.28 * plan); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(ARC.cx, ARC.cy, ARC.rx, ARC.ry, 0, Math.PI, TAU); ctx.stroke(); ctx.restore();
  }
  const mp = E.inOutSine(prog(t, T.ffA, T.ffB));
  if (t > T.ffA) {
    const phi = Math.PI * (1 - mp);
    ctx.save(); ctx.lineCap = 'round';
    const trailCol = mixC(hex(C.paper), hex(C.gold), smooth(prog(t, T.ffB - 0.1, T.ffB + 0.35)));
    ctx.shadowColor = rgb(trailCol, 0.9); ctx.shadowBlur = 22; ctx.strokeStyle = rgb(trailCol, 0.95); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(ARC.cx, ARC.cy, ARC.rx, ARC.ry, 0, Math.PI, Math.PI + Math.PI * mp + 1e-4); ctx.stroke();
    ctx.restore();
    // moon -> sun
    const [mx, my] = arcPt(phi);
    const toSun = E.inOutCubic(prog(t, T.ffB - 0.04, T.ffB + 0.3));
    const rise = E.outCubic(prog(t, T.ffB + 0.1, T.ffB + 2.6));
    const sx = lerp(mx, 1690, rise), sy = lerp(my, 655, rise);
    const r = lerp(30, 78, toSun);
    glowAt(ctx, sx, sy, lerp(160, 680, toSun), toSun > 0.01 ? C.gold : C.paper, lerp(0.35, 0.62, toSun));
    // rays
    if (toSun > 0) {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.25); ctx.strokeStyle = rgba(C.gold, 0.5 * toSun); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); const L = (18 + 10 * Math.sin(t * 3 + i)) * toSun; ctx.beginPath(); ctx.moveTo(r + 18, 0); ctx.lineTo(r + 18 + L, 0); ctx.stroke(); }
      ctx.restore();
    }
    // crescent drawn offscreen, opening up into the full sun disc
    reset(moonX); moonX.clearRect(0, 0, 160, 160);
    moonX.fillStyle = rgb(mixC(hex(C.paper), hex(C.gold), toSun)); disc(moonX, 80, 80, r);
    moonX.globalCompositeOperation = 'destination-out';
    disc(moonX, 80 + lerp(14, 220, toSun), 80 - lerp(10, 110, toSun), r * 0.92);
    ctx.drawImage(moonC, sx - 80, sy - 80);
  }
  ctx.restore();
}
function drawGround(ctx, t) {
  const [, , hor] = skyAt(t);
  const gc = mixC(hex('#07081A'), hor, 0.1);
  const g = ctx.createLinearGradient(0, HOR, 0, H);
  g.addColorStop(0, rgb(gc)); g.addColorStop(1, rgb(mixC(gc, [0, 0, 0], 0.5)));
  ctx.fillStyle = g; ctx.fillRect(-300, HOR, W + 600, H - HOR + 300);
  // horizon line + hour ticks
  const lp = E.outExpo(prog(t, 0.0, 0.45));
  ctx.strokeStyle = rgba(C.paper, 0.45); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(CX - lp * W * 0.6, HOR); ctx.lineTo(CX + lp * W * 0.6, HOR); ctx.stroke();
  for (let i = 0; i <= 24; i++) {
    const x = 120 + i * 70, d = Math.abs(x - CX) / 900, p = E.outBack(prog(t, 0.05 + d * 0.25, 0.25 + d * 0.25), 2);
    if (p <= 0) continue;
    ctx.strokeStyle = rgba(C.paper, i % 6 === 0 ? 0.45 : 0.2); ctx.lineWidth = 2;
    const h = (i % 6 === 0 ? 16 : 8) * p; ctx.beginPath(); ctx.moveTo(x, HOR + 6); ctx.lineTo(x, HOR + 6 + h); ctx.stroke();
  }
  // arc end labels
  const l1 = E.outExpo(prog(t, T.land, T.land + 0.25)), l2 = E.outExpo(prog(t, T.ffB - 0.08, T.ffB + 0.2));
  ctx.font = MONO(24); ctx.textAlign = 'center';
  if (l1 > 0) { ctx.fillStyle = rgba(C.paper, 0.8 * l1); ctx.fillText('22:00', 180, HOR + 58 + (1 - l1) * 20); }
  if (l2 > 0) { ctx.fillStyle = rgba(C.gold, 0.95 * l2); ctx.fillText('06:30', 1740, HOR + 58 + (1 - l2) * 20); }
}

// ------------------------------------------------------------- camera: push in at dusk, pull back for the night arc, settle at dawn
const CAM = [[0, 1.12, 960, 500], [1.25, 1.14, 945, 502], [2.3, 1.16, 925, 505], [2.62, 1.08, 960, 500],
  [3.2, 1.08, 960, 500], [4.0, 1.12, 975, 505], [99, 1.15, 985, 512]];
function camera(t) {
  let i = 0; while (t > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], p = E.inOutSine(prog(t, a[0], b[0]));
  return [lerp(a[1], b[1], p), lerp(a[2], b[2], p), lerp(a[3], b[3], p)];
}

// ------------------------------------------------------------- frame
function drawScene(ctx, t) {
  reset(ctx);
  const [cs, cx, cy] = camera(t);
  ctx.translate(W / 2, H / 2); ctx.scale(cs, cs); ctx.translate(-cx, -cy);
  drawSky(ctx, t);
  drawCelestial(ctx, t);
  drawGround(ctx, t);
  drawNightstand(ctx, t);
  drawBed(ctx, t);
  drawSleeper(ctx, t);
  drawBlanket(ctx, t);
  drawFootboard(ctx, t);
  drawZs(ctx, t);
  // wake-up ring on landing
  const u = t - T.stand;
  if (u > 0 && u < 0.5) { ctx.strokeStyle = rgba(C.gold, 0.7 * (1 - u / 0.5)); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(STAND_R[0], HOR, 40 + 140 * E.outExpo(u / 0.5), 6 + 16 * E.outExpo(u / 0.5), 0, 0, TAU); ctx.stroke(); }
  drawText(ctx, t);
  reset(ctx);
}

const grain = (() => {
  const [c, x] = mk(512, 512); const img = x.createImageData(512, 512); const r = mulberry32(7);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
})();
let grainPat = null;
function post(ctx, t) {
  reset(ctx);
  const v = ctx.createRadialGradient(CX, H / 2, H * 0.42, CX, H / 2, H * 1.1);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (!grainPat) grainPat = ctx.createPattern(grain, 'repeat');
  const fi = Math.floor(t * FPS);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.09;
  ctx.translate(-Math.floor(hash(fi) * 512), -Math.floor(hash(fi + 0.5) * 512));
  ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore();
  // fade in from black
}

// ------------------------------------------------------------- motion-blur renderer
const out = document.getElementById('c');
const octx = out.getContext('2d', { willReadFrequently: true });
const [, wctx] = mk(W, H, true);
let acc = null;
function samplesAt(t) {
  const within = (a, b) => t > a && t < b;
  if (within(T.jump - 0.05, T.land + 0.12) || within(T.getUp - 0.05, T.stand + 0.12) || within(T.eqDrop - 0.03, T.eqDrop + 0.4)) return 24;
  if (within(T.ffA, T.ffB + 0.3)) return 16;
  return 12;
  return 8;
}
function renderFrame(fi, opts = {}) {
  const t0 = fi / FPS, n = opts.samples ?? samplesAt(t0), span = (opts.shutter ?? 0.5) / FPS;
  if (n <= 1) { drawScene(octx, t0); post(octx, t0); return; }
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
  post(octx, t0);
}

// ------------------------------------------------------------- API + preview player
const ready = Promise.all([U(100), U(100, 900), SERIF(100), MONO(20), MONO(20, 500)].map(f => document.fonts.load(f, 'Frühe ÄÖÜ'))).then(() => document.fonts.ready);
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
    const t = now(); drawScene(octx, t); post(octx, t);
    if (playing) scrub.value = t; tc.textContent = t.toFixed(3).padStart(6, '0');
    requestAnimationFrame(loop);
  })());
}
})();
