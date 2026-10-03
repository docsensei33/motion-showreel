/* ==========================================================================
   CLAUDE — MOTION REEL 2026
   A 15 second, 1080p60 showreel generated entirely in code.
   Every frame is a pure function of time: drawScene(ctx, t).
   Music + sound design are synthesized with the Web Audio API and share the
   exact same beat grid as the visuals (128 BPM, 8 bars = 15.000 s).
   ========================================================================== */
'use strict';
(() => {

// ---------------------------------------------------------------- constants
const W = 1920, H = 1080, FPS = 60, DUR = 15;
const BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4;           // 0.46875 / 1.875 s
const TAU = Math.PI * 2;
const CX = W / 2, CY = H / 2;
const RENDER = /[?&]render/.test(location.search);
if (RENDER) document.documentElement.classList.add('render');

const C = {
  ink: '#0B0B12', paper: '#F3EFE6', coral: '#FF4F2E', cobalt: '#2B44FF',
  lime: '#C8FF2E', lilac: '#B9A6FF', white: '#FFFFFF',
};

// ---------------------------------------------------------------- math kit
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const fract = x => x - Math.floor(x);
const E = {
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inOutQuint: t => t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2,
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
};
// damped spring 0 -> 1 (t in seconds)
const spring = (t, hz = 2.2, damp = 8) => t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(TAU * hz * t);
// hump that peaks at 1 when u == k and decays afterwards
const hump = (u, k = 0.07) => u <= 0 ? 0 : (u / k) * Math.exp(1 - u / k);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
const noise1 = x => { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1; };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (h1, h2, t) => { const a = hexRgb(h1), b = hexRgb(h2); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`; };

// ---------------------------------------------------------------- timeline
const T_DROP = 4 * BEAT;          // first kick
const T_IMPACT = 28 * BEAT;       // end-card hit (13.125 s)
const WHIP_A = 6 * BAR - 0.25, WHIP_B = 6 * BAR + 0.15;
const MC = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(b => b * BEAT);     // montage cut points (local)
const KICKS = [];
for (let b = 4; b < 28; b++) KICKS.push(b * BEAT);
KICKS.push(T_IMPACT);
const BIG_HITS = new Set([4, 28]);

function kickEnv(t, decay = 0.09) {
  let e = 0;
  for (const k of KICKS) { const d = t - k; if (d >= 0 && d < 0.7) e = Math.max(e, Math.exp(-d / decay)); }
  return e;
}
function shake(t) {
  let a = 0;
  for (let i = 0; i < KICKS.length; i++) {
    const d = t - KICKS[i]; if (d < 0 || d > 0.8) continue;
    const big = BIG_HITS.has(Math.round(KICKS[i] / BEAT));
    a = Math.max(a, (big ? 22 : 3.5) * Math.exp(-d / (big ? 0.16 : 0.07)));
  }
  return [a * noise1(t * 38), a * noise1(t * 38 + 91.7)];
}
// hard edit points: motion blur never integrates across these
const CUTS = [BAR, 2 * BAR, 3 * BAR, 4 * BAR, 5 * BAR, 7 * BAR, ...MC.slice(1, 7).map(m => 6 * BAR + m)];

// ---------------------------------------------------------------- canvas kit
function mk(w, h, read = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: read })]; }
function reset(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; }
function bg(ctx, col) { ctx.fillStyle = col; ctx.fillRect(-300, -300, W + 600, H + 600); }
function disc(ctx, x, y, r) { if (r <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function ring(ctx, x, y, r, lw) { if (r <= 0 || lw <= 0) return; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
function seg(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
const F = (size, fam = 'Unbounded', w = 900) => `${w} ${size}px "${fam}"`;
const MONO = (size, w = 500) => `${w} ${size}px "JetBrains Mono"`;

const _m = new Map();
function measure(ctx, f, s) { const k = f + '|' + s; let v = _m.get(k); if (v === undefined) { ctx.font = f; ctx.letterSpacing = '0px'; v = ctx.measureText(s).width; _m.set(k, v); } return v; }
const _cap = new Map();
function capH(ctx, f) { let v = _cap.get(f); if (v === undefined) { ctx.font = f; v = ctx.measureText('H').actualBoundingBoxAscent; _cap.set(f, v); } return v; }
const _lay = new Map();
function layout(ctx, str, f, track = 0) {
  const key = f + '|' + track + '|' + str; let L = _lay.get(key); if (L) return L;
  const chars = [];
  for (let i = 0; i < str.length; i++) {
    const x0 = measure(ctx, f, str.slice(0, i)) + i * track;
    const x1 = measure(ctx, f, str.slice(0, i + 1)) + i * track;
    chars.push({ ch: str[i], x: x0, w: x1 - x0, c: (x0 + x1) / 2 });
  }
  L = { chars, width: measure(ctx, f, str) + track * (str.length - 1) };
  _lay.set(key, L); return L;
}
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
function scramble(str, q, t, seed = 0) {
  const p = q * 1.3; let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], th = i / str.length;
    if (ch === ' ') out += ' ';
    else if (p >= th + 0.3) out += ch;
    else if (p >= th) out += GLYPHS[Math.floor(hash(i * 13.1 + Math.floor(t * 30) * 7.7 + seed) * GLYPHS.length)];
    else out += ' ';
  }
  return out;
}
function textC(ctx, s, x, y, f, col, track = 0, align = 'center') {
  ctx.font = f; ctx.letterSpacing = track + 'px'; ctx.textAlign = align; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
}

const [offA, offActx] = mk(W, H);
const [offB, offBctx] = mk(W, H);
const [offC, offCctx] = mk(W, H);

// horizontal band displacement glitch
function sliceGlitch(ctx, src, amt, seed) {
  let y = 0, i = 0;
  while (y < H) {
    const h = 8 + hash(seed + i * 1.37) * 110;
    const on = hash(seed + i * 3.1) > 0.45 ? 1 : 0;
    const off = (hash(seed + i * 7.3) - 0.5) * 2 * amt * on;
    ctx.drawImage(src, 0, y, W, h, off, y, W, h);
    y += h; i++;
  }
}
// cheap RGB split: isolate channels with multiply, recombine additively
function rgbSplit(ctx, src, dx, dy = 0) {
  const chans = [['#FF0000', -dx, -dy], ['#00FF00', 0, 0], ['#0000FF', dx, dy]];
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (const [col, ox, oy] of chans) {
    reset(offCctx); offCctx.globalCompositeOperation = 'copy'; offCctx.drawImage(src, 0, 0);
    offCctx.globalCompositeOperation = 'multiply'; offCctx.fillStyle = col; offCctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(offC, ox, oy);
  }
  ctx.restore();
}

// =================================================================== SCENES
// Each scene receives (ctx, local time τ, global time t) and paints the full frame.

// ---------------------------------------------------------- 00 · IGNITION
function sIntro(ctx, tl, t) {
  bg(ctx, C.ink);
  const B = BEAT;
  const collapse = E.inExpo(prog(tl, 1.18, 1.6));
  const keep = 1 - collapse;

  // radial glow behind dot
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 600);
  g.addColorStop(0, rgba(C.coral, 0.16 * E.outCubic(prog(tl, 0, .6)))); g.addColorStop(1, rgba(C.coral, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // crosshair + rulers
  const lp = E.outExpo(prog(tl, 0.02, 0.85));
  const hx = lp * W * 0.5 * keep, hy = lp * H * 0.5 * keep;
  ctx.strokeStyle = rgba(C.paper, 0.22); ctx.lineWidth = 1.5;
  seg(ctx, CX - hx, CY, CX + hx, CY); seg(ctx, CX, CY - hy, CX, CY + hy);
  ctx.strokeStyle = rgba(C.paper, 0.4);
  for (let k = -24; k <= 24; k++) {
    if (!k) continue; const big = k % 5 === 0, s = big ? 13 : 6;
    if (Math.abs(k * 40) < hx) seg(ctx, CX + k * 40, CY - s, CX + k * 40, CY + s);
    if (Math.abs(k * 40) < hy) seg(ctx, CX - s, CY + k * 40, CX + s, CY + k * 40);
  }

  // corner brackets fly out from the centre
  const fb = E.outExpo(prog(tl, 0.18, 0.9)) * keep;
  if (fb > 0) {
    const bw = 40 + 520 * fb, bh = 30 + 290 * fb, arm = 34;
    ctx.strokeStyle = rgba(C.paper, 0.9 * fb); ctx.lineWidth = 3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = CX + sx * bw, y = CY + sy * bh;
      ctx.beginPath(); ctx.moveTo(x - sx * arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * arm); ctx.stroke();
    }
    ctx.globalAlpha = fb * 0.7;
    textC(ctx, `X ${String(Math.round(CX - bw)).padStart(4, '0')}  Y ${String(Math.round(CY - bh)).padStart(4, '0')}`, CX - bw, CY - bh - 18, MONO(15), C.paper, 1, 'left');
    textC(ctx, `FIG.00 / IGNITION`, CX + bw, CY + bh + 30, MONO(15), C.paper, 1, 'right');
    ctx.globalAlpha = 1;
  }

  // shock rings
  const r1 = prog(tl, B, B + 0.75);
  if (r1 > 0 && r1 < 1) { ctx.strokeStyle = rgba(C.coral, 0.95 * (1 - r1 * 0.6)); ring(ctx, CX, CY, (24 + 300 * E.outExpo(r1)) * keep, lerp(10, 1.2, E.outExpo(r1))); }
  const r2 = prog(tl, 1.5 * B, 1.5 * B + 0.7);
  if (r2 > 0) {
    ctx.save(); ctx.setLineDash([3, 11]); ctx.lineDashOffset = -tl * 220;
    ctx.strokeStyle = rgba(C.paper, 0.7); ring(ctx, CX, CY, (24 + 205 * E.outExpo(r2)) * keep, 2.5); ctx.restore();
  }

  // orbiters with analytic trails
  const op = E.outBack(prog(tl, 2 * B, 2 * B + 0.42), 2.2);
  if (op > 0) {
    for (let i = 0; i < 6; i++) {
      for (let k = 11; k >= 0; k--) {
        const tt = tl - k * 0.014;
        const ang = i * TAU / 6 + tt * 4.4 + collapse * 7;
        const R = 205 * op * keep;
        ctx.fillStyle = rgba(i % 2 ? C.lime : C.paper, (1 - k / 12) * (k ? 0.45 : 1));
        disc(ctx, CX + Math.cos(ang) * R, CY + Math.sin(ang) * R, (k ? 5 : 8) * (1 - k / 14));
      }
    }
  }

  // speed lines rushing in while we zoom into the dot
  const z = E.inExpo(prog(tl, 1.42, 1.875));
  if (z > 0.001) {
    ctx.strokeStyle = rgba(C.paper, 0.55 * Math.min(1, z * 4)); ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const a = hash(i) * TAU, ph = fract(hash(i + 9.1) + tl * 2.6);
      const d = lerp(1200, 60, ph), len = 60 + 160 * hash(i + 3);
      seg(ctx, CX + Math.cos(a) * d, CY + Math.sin(a) * d, CX + Math.cos(a) * (d + len), CY + Math.sin(a) * (d + len));
    }
  }

  // the dot — ticks on every beat, then swallows the frame
  const bi = Math.floor(tl / B);
  const pulse = tl < 1.25 ? Math.exp(-(tl - bi * B) / 0.08) : 0;
  let r = 24 * spring(tl, 2.2, 8) * (1 + 0.5 * pulse) * lerp(1, 0.75, collapse);
  r = lerp(r, 1250, z);
  ctx.fillStyle = C.coral; disc(ctx, CX, CY, r);

  // decoding title
  const sp = prog(tl, 0.22, 0.95);
  if (sp > 0 && keep > 0) {
    ctx.globalAlpha = keep;
    textC(ctx, scramble('MOTION DESIGN SHOWREEL — 2026', sp, tl), CX, CY + 104, MONO(24, 800), C.paper, 6);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------- 01 · KINETIC TYPE
function sType(ctx, tl, t) {
  const B = BEAT;
  const slam = tl >= 2 * B;
  bg(ctx, slam ? C.lime : C.coral);

  if (tl < 2 * B + 0.1) {
    const exitP = E.inExpo(prog(tl, 2 * B - 0.16, 2 * B + 0.04));
    ctx.save(); ctx.translate(-exitP * 2400, 0);
    const f = F(176), ch = capH(ctx, f);
    const up = E.outExpo(prog(tl, B, B + 0.38));
    // line 1: masked slide-up, letter by letter
    const L1 = layout(ctx, 'I MAKE', f, 4), y1 = CY - up * 118 + ch / 2, x1 = CX - L1.width / 2;
    ctx.font = f; ctx.textAlign = 'center'; ctx.fillStyle = C.ink;
    L1.chars.forEach((c, i) => {
      const p = E.outExpo(prog(tl, 0.02 + i * 0.035, 0.02 + i * 0.035 + 0.5));
      ctx.save(); ctx.beginPath(); ctx.rect(x1 + c.x - 20, y1 - ch - 20, c.w + 40, ch + 46); ctx.clip();
      ctx.fillText(c.ch, x1 + c.c, y1 + (1 - p) * (ch + 50)); ctx.restore();
    });
    // line 2: pop + twist from the middle out
    const L2 = layout(ctx, 'THINGS', f, 4), y2 = CY + up * 118 + ch / 2, x2 = CX - L2.width / 2;
    L2.chars.forEach((c, i) => {
      const d = Math.abs(i - 2.5) * 0.045;
      const p = prog(tl, B + d, B + d + 0.42);
      if (p <= 0) return;
      const s = E.outBack(p, 2.4), rot = (1 - E.outCubic(p)) * (i % 2 ? 0.7 : -0.7);
      ctx.save(); ctx.translate(x2 + c.c, y2 - ch / 2); ctx.rotate(rot); ctx.scale(s, s);
      ctx.fillStyle = i === 2 ? C.paper : C.ink; ctx.fillText(c.ch, 0, ch / 2); ctx.restore();
    });
    ctx.restore();
  }

  if (slam) {
    const u = tl - 2 * B;
    const f = F(300), ch = capH(ctx, f);
    const L = layout(ctx, 'MOVE', f, 0);
    const s = lerp(2.8, 1, E.outExpo(prog(u, 0, 0.26)));
    const step = 15 * E.outExpo(prog(u, 0.04, 0.55));
    const N = 9;
    const jump = (uu, j) => { const p = prog(uu, B + j * 0.055, B + j * 0.055 + 0.32); return -70 * Math.sin(Math.PI * p) * (p > 0 && p < 1 ? 1 : 0); };
    const ox = CX - L.width / 2 - N * step / 2, oy = CY + ch / 2 - N * step / 2;
    ctx.save(); ctx.translate(CX, CY); ctx.scale(s, s); ctx.translate(-CX, -CY);
    ctx.font = f; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (let k = N; k >= 0; k--) {
      const uu = u - k * 0.028;
      const sway = Math.sin(u * 9 - k * 0.5) * k * 1.3 * E.outCubic(prog(u, 0.2, 0.6));
      L.chars.forEach((c, j) => {
        const x = ox + c.c + k * step + sway, y = oy + k * step + jump(uu, j);
        if (k === 0) { ctx.fillStyle = C.ink; ctx.fillText(c.ch, x, y); }
        else {
          ctx.fillStyle = [C.coral, C.cobalt, C.paper][k % 3]; ctx.fillText(c.ch, x, y);
          ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeText(c.ch, x, y);
        }
      });
    }
    ctx.restore();
    // micro label
    ctx.globalAlpha = E.outExpo(prog(u, 0.2, 0.5));
    textC(ctx, '( SQUASH · STRETCH · OVERLAP · FOLLOW-THROUGH )', CX, CY + 300, MONO(20, 800), C.ink, 3);
    ctx.globalAlpha = 1;
  }

  // venetian-blind wipe to ink
  const b0 = 3.25 * B;
  if (tl > b0) {
    ctx.fillStyle = C.ink;
    for (let j = 0; j < 12; j++) {
      const p = E.inOutQuint(prog(tl, b0 + j * 0.012, b0 + j * 0.012 + 0.2));
      if (p > 0) ctx.fillRect(j * 160 - 0.5, 0, 161, H * p);
    }
  }
}

// ---------------------------------------------------------- 02 · RHYTHM & GRIDS
function drawPlus(ctx, x, y, L, th, r, rot) {
  if (L <= 0.3) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.roundRect(-L, -th, 2 * L, 2 * th, r); ctx.roundRect(-th, -L, 2 * th, 2 * L, r); ctx.fill('nonzero');
  ctx.restore();
}
function sGrid(ctx, tl, t) {
  bg(ctx, C.ink);
  const B = BEAT;
  const outP = prog(tl, 3 * B, 4 * B - 0.04), out = E.inExpo(outP);
  const cam = 1 + 0.25 * E.inCubic(prog(tl, 3 * B, 4 * B));
  const morphSq = E.inOutExpo(prog(tl, 1.5 * B, 1.5 * B + 0.3));
  const morphCi = E.inOutExpo(prog(tl, 2.5 * B, 2.5 * B + 0.3));
  const waveCols = [C.coral, C.lime, C.cobalt, C.paper];
  const maxD = Math.hypot(CX, CY);
  ctx.save(); ctx.translate(CX, CY); ctx.rotate(0.05 * Math.sin(tl * 2.3) * (1 - out)); ctx.scale(cam, cam); ctx.translate(-CX, -CY);
  let centre = null;
  for (let j = 0; j < 9; j++) for (let i = 0; i < 17; i++) {
    const x = i * 120, y = 60 + j * 120, dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy) || 1;
    const isC = i === 8 && j === 4;
    let s = E.outBack(prog(tl, i * 0.016, i * 0.016 + 0.3), 2.2), rot = 0, col = rgba(C.paper, 0.3), push = 0;
    for (let k = 0; k < 4; k++) {
      const u = tl - k * B - (d / maxD) * 0.3;
      if (u > 0) { col = waveCols[k]; rot += (Math.PI / 2) * E.outBack(clamp(u / 0.34), 1.8); const bm = hump(u, 0.07); s += 0.6 * bm; push += 34 * bm; }
    }
    let px = x + dx / d * push, py = y + dy / d * push;
    let L = 34 * s, th = lerp(11, 34, morphSq) * s, rr = lerp(2, 34, morphCi) * s;
    if (isC) { centre = [px, py, L, th, rr, rot]; continue; }
    const f = 1 + 2.4 * out * (0.6 + hash(i * 31 + j) * 0.8);
    px = CX + (px - CX) * f; py = CY + (py - CY) * f; L *= 1 - out * 0.6; th *= 1 - out * 0.6; rr *= 1 - out * 0.6;
    ctx.fillStyle = col; drawPlus(ctx, px, py, L, Math.min(th, L), Math.min(rr, th), rot);
  }
  // the centre cell grows into the next scene's sphere (match cut)
  const [px, py, L0, th0, rr0, rot0] = centre;
  const g = E.inOutExpo(prog(tl, 3 * B - 0.05, 4 * B - 0.02));
  const L = lerp(L0, 240, g);
  ctx.fillStyle = g > 0 ? mix(C.paper, C.cobalt, g) : C.paper;
  drawPlus(ctx, lerp(px, CX, g), lerp(py, CY, g), L, lerp(Math.min(th0, L0), L, g), lerp(Math.min(rr0, th0), L, g), rot0 * (1 - g));
  ctx.restore();
  // beat counter
  const bt = Math.min(3, Math.floor(tl / B));
  ctx.globalAlpha = 1 - out;
  for (let k = 0; k < 4; k++) { ctx.fillStyle = k <= bt ? waveCols[k] : rgba(C.paper, 0.2); ctx.fillRect(CX - 70 + k * 36, H - 120, 26, 6); }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------- 03 · DIMENSION
const NU = 44, NV = 34;
function s3D(ctx, tl, t) {
  bg(ctx, C.ink);
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 760);
  g.addColorStop(0, rgba(C.cobalt, 0.32)); g.addColorStop(1, rgba(C.cobalt, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const k = kickEnv(t, 0.12);
  const morph = E.inOutCubic(prog(tl, 0.7, 1.22));
  const burst = E.outExpo(prog(tl, 0, 0.5));
  const fly = E.inExpo(prog(tl, 1.28, 1.875));
  const D = lerp(1000, -120, fly), FOC = 1000;
  const ry = tl * 1.35 + 0.4 + fly * 1.2, rx = lerp(0.45, 1.05, morph) + 0.18 * Math.sin(tl * 1.7);
  const cy_ = Math.cos(ry), sy_ = Math.sin(ry), cx_ = Math.cos(rx), sx_ = Math.sin(rx);
  const R = 300, Rt = 255, rt = 105;

  // the disc we matched from the grid dissolves into points
  const dz = 1 - E.outCubic(prog(tl, 0, 0.22));
  if (dz > 0) { ctx.fillStyle = rgba(C.cobalt, dz); disc(ctx, CX, CY, 300); }

  ctx.globalCompositeOperation = 'lighter';
  const proj = (x, y, z) => {
    let X = x * cy_ + z * sy_, Z = -x * sy_ + z * cy_;
    let Y = y * cx_ - Z * sx_; Z = y * sx_ + Z * cx_;
    const zz = Z + D; if (zz < 25) return null;
    const s = FOC / zz; return [CX + X * s, CY + Y * s, s, Z];
  };
  for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
    const u = iu / NU, v = iv / (NV - 1);
    const th = v * Math.PI, ph = u * TAU, ps = v * TAU;
    const ripple = 1 + 0.16 * k * Math.sin(v * Math.PI * 9 + tl * 14) + 0.04 * Math.sin(u * TAU * 4 + tl * 3);
    let x = lerp(R * Math.sin(th) * Math.cos(ph), (Rt + rt * Math.cos(ps)) * Math.cos(ph), morph) * ripple;
    let y = lerp(R * Math.cos(th), rt * Math.sin(ps), morph) * ripple;
    let z = lerp(R * Math.sin(th) * Math.sin(ph), (Rt + rt * Math.cos(ps)) * Math.sin(ph), morph) * ripple;
    const jitter = (1 - burst) * 0.0;
    x *= burst; y *= burst; z *= burst; x += jitter;
    const p = proj(x, y, z); if (!p) continue;
    const depth = clamp((p[3] + R) / (2 * R));            // 0 near, 1 far
    const accent = iv % 6 === 0;
    const col = accent ? C.lime : mix(C.paper, C.cobalt, depth * 0.85);
    ctx.fillStyle = col; ctx.globalAlpha = lerp(1, 0.35, depth);
    const sz = (accent ? 4.2 : 3.3) * p[2];
    if (sz < 3) ctx.fillRect(p[0] - sz / 2, p[1] - sz / 2, sz, sz); else disc(ctx, p[0], p[1], sz / 2);
  }
  // orbit ring
  const ob = E.outExpo(prog(tl, 0.12, 0.7));
  for (let i = 0; i < 160; i++) {
    const a = i / 160 * TAU - tl * 1.1;
    const rr = 470 * ob;
    let x = Math.cos(a) * rr, y = 0, z = Math.sin(a) * rr;
    const tilt = 1.15; const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    const p = proj(x, y2 + 0.0, z2); if (!p) continue;
    ctx.globalAlpha = i % 10 === 0 ? 1 : 0.5; ctx.fillStyle = C.coral;
    const sz = (i % 10 === 0 ? 5 : 2.4) * p[2]; ctx.fillRect(p[0] - sz / 2, p[1] - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

  // technical callout
  const la = E.outExpo(prog(tl, 0.25, 0.6)) * (1 - fly * 3);
  if (la > 0) {
    ctx.globalAlpha = clamp(la);
    const ax = CX + 215, ay = CY - 215, bx = CX + 420, by = CY - 330;
    ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx + 240 * la, by); ctx.stroke();
    ctx.fillStyle = C.lime; disc(ctx, ax, ay, 5);
    const deg = ((ry * 180 / Math.PI) % 360).toFixed(1).padStart(5, '0');
    textC(ctx, `ROT.Y ${deg}°`, bx + 6, by - 14, MONO(17, 800), C.paper, 1, 'left');
    textC(ctx, `MESH ${morph < 0.5 ? 'SPHERE' : 'TORUS '}  ${NU * NV} PTS`, bx + 6, by + 28, MONO(15), rgba(C.paper, 0.65), 1, 'left');
    textC(ctx, `MORPH ${(morph * 100).toFixed(0).padStart(3, '0')}%`, bx + 6, by + 50, MONO(15), rgba(C.paper, 0.65), 1, 'left');
    ctx.globalAlpha = 1;
  }

  // iris into the liquid scene
  const ir = E.inExpo(prog(tl, 1.5, 1.875));
  if (ir > 0) { ctx.fillStyle = C.cobalt; disc(ctx, CX, CY, ir * 1150); }
}

// ---------------------------------------------------------- 04 · LIQUID
const LSC = RENDER ? 2 : 4;              // field resolution divisor
const LW = W / LSC, LH = H / LSC;
const [liqC, liqX] = mk(LW, LH);
const liqImg = liqX.createImageData(LW, LH);
const fbuf = new Float32Array(LW * LH), hbuf = new Float32Array(LW * LH);
function liquidBalls(tl, t) {
  const k = kickEnv(t, 0.1);
  const conv = E.inExpo(prog(tl, 1.3, 1.78));
  const grow = E.inExpo(prog(tl, 1.5, 1.875));
  const list = [];
  const intro = E.outBack(prog(tl, 0, 0.45), 1.6);
  list.push([CX + 40 * Math.sin(tl * 2), CY, lerp((150 + 30 * k) * intro, 1450, grow)]);
  for (let i = 0; i < 7; i++) {
    const ii = E.outBack(prog(tl, 0.04 * i, 0.04 * i + 0.5), 1.8);
    const a = i * TAU / 7 + tl * (0.8 + 0.25 * (i % 3));
    const R = (250 + 160 * Math.sin(tl * 2.7 + i * 1.7)) * (1 - conv) * ii;
    list.push([CX + Math.cos(a) * R * 1.35, CY + Math.sin(a) * R * 0.85, (52 + 46 * hash(i + 4)) * ii * (1 - conv * 0.4)]);
  }
  for (let i = 0; i < 6; i++) {
    const ii = prog(tl, 0.2 + 0.03 * i, 0.5);
    const a = -i * TAU / 6 - tl * 1.9;
    const R = (470 + 40 * Math.sin(tl * 5 + i)) * (1 - conv);
    list.push([CX + Math.cos(a) * R * 1.3, CY + Math.sin(a) * R * 0.7, (16 + 12 * hash(i + 20)) * ii]);
  }
  return list;
}
function sLiquid(ctx, tl, t) {
  bg(ctx, C.cobalt);
  // marquee typography behind the fluid
  const mf = F(210, 'Unbounded', 900);
  ctx.save(); ctx.font = mf; ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(C.paper, 0.4); ctx.textAlign = 'left';
  const str = 'LIQUID • FLUID • ORGANIC • ';
  const sw = measure(ctx, mf, str);
  for (const [y, dir] of [[CY - 210, -1], [CY + 360, 1]]) {
    let x = ((dir * tl * 520) % sw) - sw; while (x < W) { ctx.strokeText(str, x, y); x += sw; }
  }
  ctx.restore();

  const flat = prog(tl, 1.72, 1.86);
  const balls = liquidBalls(tl, t).map(([x, y, r]) => [x / LSC, y / LSC, (r / LSC) ** 2]);
  const nb = balls.length;
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    let f = 0;
    for (let b = 0; b < nb; b++) { const dx = x - balls[b][0], dy = y - balls[b][1]; f += balls[b][2] / (dx * dx + dy * dy + 0.5); }
    const i = y * LW + x; fbuf[i] = f; hbuf[i] = f > 1 ? Math.sqrt(1 - 1 / f) : 0;
  }
  const d = liqImg.data, K = 9 * (4 / LSC) ** 0, kk = LSC / 2;
  const Lx = -0.45, Ly = -0.62, Lz = 0.64, Hx = Lx, Hy = Ly, Hz = Lz + 1, hn = Math.hypot(Hx, Hy, Hz);
  const PA = hexRgb(C.paper), SH = [96, 112, 255], RIM = hexRgb(C.lime);
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const i = y * LW + x, o = i * 4, f = fbuf[i];
    if (f < 0.9) { d[o + 3] = 0; continue; }
    const a = smooth(clamp((f - 0.965) / 0.07));
    const hl = hbuf[x > 0 ? i - 1 : i], hr = hbuf[x < LW - 1 ? i + 1 : i], hu = hbuf[y > 0 ? i - LW : i], hd = hbuf[y < LH - 1 ? i + LW : i];
    let nx = (hl - hr) * K * kk, ny = (hu - hd) * K * kk, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
    const spec = Math.pow(Math.max(0, (nx * Hx + ny * Hy + nz * Hz) / hn), 70);
    const fr = Math.pow(1 - nz, 2.2);
    const m = 0.2 + 0.8 * dif;
    let r = lerp(SH[0], PA[0], m) + RIM[0] * fr * 0.55 + 255 * spec;
    let g = lerp(SH[1], PA[1], m) + RIM[1] * fr * 0.55 + 255 * spec;
    let b = lerp(SH[2], PA[2], m) + RIM[2] * fr * 0.55 + 255 * spec;
    d[o] = lerp(r, PA[0], flat); d[o + 1] = lerp(g, PA[1], flat); d[o + 2] = lerp(b, PA[2], flat); d[o + 3] = a * 255;
  }
  liqX.putImageData(liqImg, 0, 0);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(liqC, 0, 0, W, H); ctx.restore();

  // difference-blended headline punches through the fluid
  const hp = E.outExpo(prog(tl, 0.35, 0.8)) * (1 - prog(tl, 1.3, 1.5));
  if (hp > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.globalAlpha = hp;
    const f = F(150), L = layout(ctx, 'SURFACE', f, 10), ch = capH(ctx, f);
    ctx.font = f; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
    L.chars.forEach((c, i) => {
      const p = E.outExpo(prog(tl, 0.35 + i * 0.03, 0.75 + i * 0.03));
      ctx.fillText(c.ch, CX - L.width / 2 + c.c, CY + ch / 2 + (1 - p) * 80 + Math.sin(tl * 6 + i * 0.7) * 10);
    });
    ctx.restore();
  }
  if (flat >= 1) bg(ctx, C.paper);
}

// ---------------------------------------------------------- 05 · PRODUCT UI
const BARS = [0.34, 0.48, 0.41, 0.6, 0.53, 0.71, 0.64, 0.83, 0.77, 1.0];
const LINE = [0.2, 0.32, 0.28, 0.45, 0.4, 0.58, 0.5, 0.66, 0.62, 0.78, 0.74, 0.9, 0.86, 0.97];
function catmull(pts, n) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < n; s++) {
      const u = s / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3)));
    }
  }
  out.push(pts[pts.length - 1]); return out;
}
function card(ctx, x, y, w, h, tl, i, fill = '#FFFFFF') {
  const p = E.outExpo(prog(tl, 0.02 + i * 0.06, 0.55 + i * 0.06));
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2 + (1 - p) * 140); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p)); ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = p;
  ctx.shadowColor = 'rgba(11,11,18,0.13)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 30); ctx.fill();
  ctx.shadowColor = 'transparent';
  return p;
}
function cursorPos(tl) {
  const B = BEAT;
  const a = E.inOutCubic(prog(tl, 0.6, 2 * B - 0.04)), b = E.inOutCubic(prog(tl, 2 * B + 0.12, 3 * B - 0.04));
  const p0 = [1990, 1180], p1 = [1722, 764], p2 = [1722, 844];
  return [lerp(lerp(p0[0], p1[0], a), p2[0], b), lerp(lerp(p0[1], p1[1], a), p2[1], b)];
}
function drawUI(ctx, tl, t) {
  bg(ctx, C.paper);
  const B = BEAT, k = kickEnv(t, 0.1);
  // dotted backdrop
  ctx.fillStyle = rgba(C.ink, 0.09);
  for (let y = 30; y < H; y += 40) for (let x = 30; x < W; x += 40) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  const cam = E.outExpo(prog(tl, 0, 0.7));
  ctx.save(); ctx.translate(CX, CY); ctx.rotate(lerp(-0.07, 0, cam)); ctx.scale(lerp(1.18, 1, cam) * (1 + 0.006 * k), lerp(1.18, 1, cam) * (1 + 0.006 * k)); ctx.translate(-CX, -CY);

  // A — revenue (dark)
  card(ctx, 110, 150, 620, 790, tl, 0, C.ink);
  {
    textC(ctx, 'REVENUE · Q3', 44, 70, MONO(18, 800), rgba(C.paper, 0.6), 2, 'left');
    const v = 2.48 * E.outExpo(prog(tl, 0.18, 1.2));
    textC(ctx, `$${v.toFixed(2)}M`, 44, 178, F(96, 'Unbounded', 800), C.paper, -2, 'left');
    const cp = E.outBack(prog(tl, 0.55, 0.85), 2.5);
    if (cp > 0) {
      ctx.save(); ctx.translate(124, 236); ctx.scale(cp, cp);
      ctx.fillStyle = C.lime; ctx.beginPath(); ctx.roundRect(-80, -24, 160, 48, 24); ctx.fill();
      textC(ctx, '▲ 248%', 0, 8, MONO(20, 800), C.ink, 0); ctx.restore();
    }
    const bw = 40, gap = 13, base = 740, top = 330;
    BARS.forEach((h, i) => {
      const p = E.outBack(prog(tl, 0.25 + i * 0.045, 0.7 + i * 0.045), 1.6);
      const hh = (base - top) * h * p * (1 + (i === 9 ? 0.04 * k : 0));
      ctx.fillStyle = i === 9 ? C.coral : rgba(C.paper, 0.18 + 0.06 * i);
      ctx.beginPath(); ctx.roundRect(44 + i * (bw + gap), base - hh, bw, Math.max(0, hh), [10, 10, 4, 4]); ctx.fill();
    });
    ctx.fillStyle = rgba(C.paper, 0.2); ctx.fillRect(44, base + 10, 10 * (bw + gap) - gap, 2);
  }
  ctx.restore();

  // B — engagement line chart
  card(ctx, 770, 150, 1040, 420, tl, 1);
  {
    textC(ctx, 'Engagement', 48, 76, F(30, 'Inter', 800), C.ink, -0.5, 'left');
    textC(ctx, 'LAST 14 DAYS', 48, 108, MONO(15), rgba(C.ink, 0.45), 2, 'left');
    const n = 184.2 * E.outExpo(prog(tl, 0.3, 1.3));
    textC(ctx, `${n.toFixed(1)}K`, 992, 84, F(44, 'Unbounded', 800), C.cobalt, -1, 'right');
    const gx = 48, gy = 150, gw = 944, gh = 220;
    ctx.strokeStyle = rgba(C.ink, 0.08); ctx.lineWidth = 2;
    for (let r = 0; r <= 4; r++) seg(ctx, gx, gy + r * gh / 4, gx + gw, gy + r * gh / 4);
    const pts = catmull(LINE.map((v, i) => [gx + i * gw / (LINE.length - 1), gy + gh - v * gh]), 16);
    const lp = E.inOutCubic(prog(tl, 0.28, 1.35));
    const nn = Math.max(2, Math.floor(lp * (pts.length - 1)) + 1);
    const ar = ctx.createLinearGradient(0, gy, 0, gy + gh);
    ar.addColorStop(0, rgba(C.cobalt, 0.28)); ar.addColorStop(1, rgba(C.cobalt, 0));
    ctx.fillStyle = ar; ctx.beginPath(); ctx.moveTo(pts[0][0], gy + gh);
    for (let i = 0; i < nn; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[nn - 1][0], gy + gh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.cobalt; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); for (let i = 0; i < nn; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); ctx.stroke();
    const tip = pts[nn - 1];
    if (lp > 0) {
      const pu = fract(tl / B);
      ctx.strokeStyle = rgba(C.cobalt, 0.5 * (1 - pu)); ring(ctx, tip[0], tip[1], 10 + 26 * E.outCubic(pu), 3);
      ctx.fillStyle = C.paper; disc(ctx, tip[0], tip[1], 12); ctx.fillStyle = C.cobalt; disc(ctx, tip[0], tip[1], 7);
    }
  }
  ctx.restore();

  // C — donut
  card(ctx, 770, 610, 500, 330, tl, 2);
  {
    const dx = 165, dy = 165, r = 100, p = E.outExpo(prog(tl, 0.35, 1.25));
    ctx.strokeStyle = '#ECE7DC'; ctx.lineCap = 'round'; ring(ctx, dx, dy, r, 34);
    if (p > 0) { ctx.strokeStyle = C.cobalt; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(dx, dy, r, -Math.PI / 2, -Math.PI / 2 + 0.78 * TAU * p); ctx.stroke(); }
    textC(ctx, `${Math.round(78 * p)}%`, dx, dy + 16, F(44, 'Unbounded', 800), C.ink, -1);
    textC(ctx, 'CONVERSION', 310, 150, MONO(16, 800), rgba(C.ink, 0.5), 2, 'left');
    textC(ctx, '+12.4%', 310, 200, F(36, 'Unbounded', 800), C.ink, -1, 'left');
  }
  ctx.restore();

  // D — toggles + cursor
  card(ctx, 1310, 610, 500, 330, tl, 3);
  const rows = ['Motion blur', 'Overshoot', 'Follow-through'];
  const onAt = [0.5, 2 * B, 3 * B];
  rows.forEach((label, i) => {
    const y = 74 + i * 80;
    textC(ctx, label, 44, y + 10, F(26, 'Inter', 800), C.ink, -0.3, 'left');
    const p = prog(tl, onAt[i], onAt[i] + 0.32), kp = E.outBack(p, 2.2);
    const tx = 370, tw = 88, th = 48;
    ctx.fillStyle = mix('#DDD8CD', i === 1 ? C.coral : C.cobalt, E.outCubic(p));
    ctx.beginPath(); ctx.roundRect(tx, y - th / 2, tw, th, th / 2); ctx.fill();
    const vel = Math.sin(Math.PI * p) * (p > 0 && p < 1 ? 1 : 0);
    const kx = tx + 24 + (tw - 48) * kp;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(kx, y, 19 * (1 + 0.35 * vel), 19 * (1 - 0.15 * vel), 0, 0, TAU); ctx.fill();
  });
  ctx.restore();

  // cursor + click ripples (screen space)
  const [mx, my] = cursorPos(tl);
  for (const ct of [2 * B, 3 * B]) {
    const u = tl - ct; if (u < 0 || u > 0.6) continue;
    ctx.strokeStyle = rgba(C.cobalt, 0.6 * (1 - u / 0.6)); ring(ctx, mx, my, 10 + 90 * E.outExpo(u / 0.6), 4);
  }
  let press = 0; for (const ct of [2 * B, 3 * B]) press = Math.max(press, hump(tl - ct + 0.04, 0.05));
  ctx.save(); ctx.translate(mx, my); ctx.scale(1 - 0.18 * press, 1 - 0.18 * press); ctx.rotate(-0.1);
  ctx.fillStyle = C.ink; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.lineTo(11, 33); ctx.lineTo(20, 52); ctx.lineTo(28, 48); ctx.lineTo(19, 30); ctx.lineTo(34, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
function sUI(ctx, tl, t) { if (t >= WHIP_A) return whip(ctx, t); drawUI(ctx, tl, t); }
function whip(ctx, t) {
  const p = E.inOutExpo(prog(t, WHIP_A, WHIP_B));
  ctx.save(); ctx.translate(-W * p, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); drawUI(ctx, t - 5 * BAR, t); ctx.restore();
  ctx.translate(W, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); cutFast(ctx, Math.max(0, t - 6 * BAR), t); ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------- 06 · CHAOS EDIT
function cutFast(ctx, u, t) {
  bg(ctx, C.lime);
  const f = F(640, 'Anton', 400), ch = capH(ctx, f);
  const sx = 1 + 0.6 * (1 - E.outExpo(prog(t, WHIP_B - 0.12, WHIP_B + 0.25)));
  ctx.save(); ctx.font = f; ctx.textAlign = 'center';
  for (const [dy, dir] of [[-ch - 30, 1], [ch + 30, -1]]) {
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
    for (let k = -3; k <= 3; k++) ctx.strokeText('FAST', CX + k * 1250 + dir * u * 900, CY + ch / 2 + dy);
  }
  ctx.translate(CX - u * 160, CY); ctx.scale(sx, 1);
  ctx.fillStyle = C.ink; ctx.fillText('FAST', 0, ch / 2);
  ctx.restore();
}
function cutHalftone(ctx, u, t) {
  bg(ctx, C.ink);
  const ox = CX + 420 * Math.sin(u * 7), oy = CY + 140 * Math.cos(u * 9);
  ctx.fillStyle = C.coral;
  for (let y = 20; y < H + 20; y += 40) for (let x = 20; x < W + 20; x += 40) {
    const d = Math.hypot(x - ox, y - oy);
    const r = 18 * (0.5 + 0.5 * Math.sin(d * 0.022 - u * 30));
    disc(ctx, x, y, r);
  }
}
function cutSphere(ctx, u, t) {
  reset(offActx); offActx.translate(CX, CY); offActx.scale(1.75, 1.75); offActx.rotate(0.3); offActx.translate(-CX, -CY);
  s3D(offActx, 0.55 + u * 1.2, t); reset(offActx);
  rgbSplit(offBctx, offA, 14 + 30 * (1 - u / (0.5 * BEAT)), 0);
  sliceGlitch(ctx, offB, 140 * (1 - E.outCubic(clamp(u / 0.2))), Math.floor(u * 40) * 17);
}
function cutStripes(ctx, u, t) {
  bg(ctx, C.paper);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 22; ctx.lineCap = 'butt';
  for (let i = -6; i < 48; i++) {
    const x0 = i * 48 + (u * 1100) % 96;
    ctx.beginPath();
    for (let y = -20; y <= H + 20; y += 30) {
      const x = x0 + 90 * Math.sin(y * 0.006 + u * 14 + i * 0.12) * Math.sin(u * 5 + y * 0.002);
      y === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
function cutTunnel(ctx, u, t) {
  bg(ctx, C.cobalt);
  const z = u * 9;
  for (let k = 0; k < 34; k++) {
    const kk = k - fract(z), s = 2900 * Math.pow(0.86, kk);
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(kk * 0.13 - u * 2);
    ctx.fillStyle = (k + Math.floor(z)) % 2 ? C.paper : C.cobalt;
    ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
  }
}
function cutLoud(ctx, u, t) {
  reset(offActx); bg(offActx, C.coral);
  const f = F(760, 'Anton', 400), ch = capH(offActx, f);
  offActx.font = f; offActx.textAlign = 'center'; offActx.fillStyle = C.ink;
  const s = 1 + 0.12 * Math.exp(-u / 0.05);
  offActx.translate(CX, CY); offActx.scale(s, s); offActx.fillText('LOUD', 0, ch / 2);
  rgbSplit(offBctx, offA, 22 * Math.exp(-u / 0.12) + 4, 6);
  sliceGlitch(ctx, offB, 160 * Math.exp(-u / 0.1) + 20, Math.floor(u * 50) * 13 + 5);
}
function cutConverge(ctx, u, t) {
  bg(ctx, C.ink);
  const P = 0.5 * BEAT, p = clamp(u / P);
  ctx.strokeStyle = C.paper; ctx.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const a = hash(i * 1.7) * TAU, ph = fract(hash(i + 0.3) + u * 5);
    const d = lerp(1250, 0, ph) * (1 - E.inQuad(p)), len = 140 * (1 - p);
    ctx.lineWidth = 1 + 3 * hash(i + 8);
    seg(ctx, CX + Math.cos(a) * d, CY + Math.sin(a) * d, CX + Math.cos(a) * (d + len), CY + Math.sin(a) * (d + len));
  }
  ctx.strokeStyle = C.coral; ring(ctx, CX, CY, 520 * (1 - E.inExpo(p)), 10);
  ctx.fillStyle = C.paper; disc(ctx, CX, CY, 14 * (1 - E.inExpo(p)));
  if (p > 0.88) bg(ctx, '#000');     // the gap before the hit
}
const MONTAGE = [cutFast, cutHalftone, cutSphere, cutStripes, cutTunnel, cutLoud, cutConverge];
function sMontage(ctx, tl, t) {
  if (t < WHIP_B) return whip(ctx, t);
  let ci = 0; while (ci < MONTAGE.length - 1 && tl >= MC[ci + 1]) ci++;
  const u = tl - MC[ci];
  const punch = ci ? 1 + 0.08 * (1 - E.outExpo(clamp(u / 0.2))) : 1;
  ctx.save(); ctx.translate(CX, CY); ctx.scale(punch, punch); ctx.translate(-CX, -CY);
  MONTAGE[ci](ctx, u, t);
  ctx.restore();
}

// ---------------------------------------------------------- 07 · END CARD
const DROP0 = 0.5, DROP_H = 760, G = 9000, REST = 0.42;
function bounce(tt) {
  if (tt < 0) return { h: DROP_H, v: 0, since: -1, iv: 0, pre: true };
  const t0 = Math.sqrt(2 * DROP_H / G), v0 = G * t0;
  if (tt < t0) return { h: DROP_H - 0.5 * G * tt * tt, v: G * tt, since: -1, iv: 0 };
  let tl = tt - t0, v = v0;
  for (let n = 0; n < 12; n++) {
    const iv = v; v *= REST; const fl = 2 * v / G;
    if (fl < 0.015) return { h: 0, v: 0, since: tl, iv };
    if (tl < fl) return { h: v * tl - 0.5 * G * tl * tl, v: Math.abs(v - G * tl), since: tl, iv };
    tl -= fl;
  }
  return { h: 0, v: 0, since: 1, iv: 0 };
}
function bounceImpacts() {
  const t0 = Math.sqrt(2 * DROP_H / G); let v = G * t0, tt = DROP0 + t0; const out = [[tt, 1]];
  for (let n = 0; n < 6; n++) { v *= REST; const fl = 2 * v / G; if (fl < 0.015) break; tt += fl; out.push([tt, v / (G * t0) * REST]); }
  return out;
}
const LETTER_T = i => 0.06 + i * 0.05;
function sEnd(ctx, tl, t) {
  bg(ctx, C.ink);
  const push = 1 + 0.035 * E.outCubic(prog(tl, 0.2, 1.875));
  ctx.translate(CX, CY); ctx.scale(push, push); ctx.translate(-CX, -CY);
  // grid callback to the intro crosshair
  const gp = E.outExpo(prog(tl, 0.05, 0.9));
  ctx.strokeStyle = rgba(C.paper, 0.08); ctx.lineWidth = 1;
  for (let x = CX % 80; x < W; x += 80) seg(ctx, x, CY - gp * CY, x, CY + gp * CY);
  for (let y = CY % 80; y < H; y += 80) seg(ctx, CX - gp * CX, y, CX + gp * CX, y);

  // shockwave + debris
  const sw = prog(tl, 0, 0.9);
  if (sw < 1) { ctx.strokeStyle = rgba(C.coral, 1 - sw); ring(ctx, CX, CY, 30 + 1300 * E.outExpo(sw), 70 * (1 - sw) + 1); }
  for (let i = 0; i < 90; i++) {
    const a = hash(i * 3.3) * TAU, sp = 900 + 1900 * hash(i + 1.1), dr = 3.2;
    const dist = sp * (1 - Math.exp(-dr * tl)) / dr, life = 1 - prog(tl, 0.2, 1.1 + hash(i) * 0.5);
    if (life <= 0) continue;
    ctx.fillStyle = [C.coral, C.lime, C.paper, C.cobalt][i % 4]; ctx.globalAlpha = life;
    const sz = (4 + 10 * hash(i + 5)) * life;
    ctx.fillRect(CX + Math.cos(a) * dist - sz / 2, CY + Math.sin(a) * dist - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;

  // wordmark
  const f = F(230), ch = capH(ctx, f), L = layout(ctx, 'CLAUDE', f, 2);
  const dotR = 32, gap = 26, total = L.width + gap + dotR * 2;
  const x0 = CX - total / 2, base = CY + ch / 2 - 40;
  const imp = bounceImpacts();
  reset(offActx); offActx.clearRect(0, 0, W, H);
  offActx.font = f; offActx.textAlign = 'center'; offActx.fillStyle = C.paper;
  L.chars.forEach((c, i) => {
    const s = spring(tl - LETTER_T(i), 2.1, 9);
    if (s <= 0) return;
    const rot = (1 - Math.min(1, s)) * (hash(i + 40) - 0.5) * 1.6;
    let dip = 0;
    const n = L.chars.length;
    for (const [it, amp] of imp) { const p = prog(tl, it + (n - 1 - i) * 0.028, it + (n - 1 - i) * 0.028 + 0.22); if (p > 0 && p < 1) dip += 26 * amp * Math.sin(Math.PI * p); }
    offActx.save(); offActx.translate(x0 + c.c, base - ch / 2 + dip + (1 - Math.min(1, s)) * 120); offActx.rotate(rot); offActx.scale(s, s);
    offActx.fillText(c.ch, 0, ch / 2); offActx.restore();
  });
  // specular sweep across the letters
  const sh = prog(tl, 1.45, 1.85);
  if (sh > 0 && sh < 1) {
    offActx.globalCompositeOperation = 'source-atop';
    const sx = lerp(x0 - 300, x0 + total + 300, E.inOutCubic(sh));
    const lg = offActx.createLinearGradient(sx - 140, 0, sx + 140, 0);
    lg.addColorStop(0, 'rgba(200,255,46,0)'); lg.addColorStop(0.5, 'rgba(200,255,46,0.9)'); lg.addColorStop(1, 'rgba(200,255,46,0)');
    offActx.fillStyle = lg; offActx.fillRect(0, 0, W, H);
    offActx.globalCompositeOperation = 'source-over';
  }
  ctx.drawImage(offA, 0, 0);

  // the dot from frame one comes home — with squash & stretch
  const bo = bounce(tl - DROP0);
  if (!bo.pre) {
    const v0 = Math.sqrt(2 * DROP_H * G);
    let syy = 1 + 0.32 * bo.v / v0;
    if (bo.since >= 0) syy -= 0.5 * (bo.iv / v0) * Math.exp(-bo.since / 0.035);
    const sxx = 1 / Math.max(0.35, syy);
    const dx = x0 + L.width + gap + dotR, dy = base - bo.h;
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.ellipse(dx, dy - dotR * syy, dotR * sxx, dotR * syy, 0, 0, TAU); ctx.fill();
    if (bo.since >= 0 && bo.since < 0.3 && bo.iv / v0 > 0.2) {
      const q = bo.since / 0.3; ctx.strokeStyle = rgba(C.coral, 1 - q); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(dx, base, 40 + 120 * E.outExpo(q), 8 + 20 * E.outExpo(q), 0, 0, TAU); ctx.stroke();
    }
  }

  // subtitle + rule
  const sp = prog(tl, 0.55, 1.15);
  if (sp > 0) textC(ctx, scramble('MOTION DESIGNER  /  SHOWREEL 2026', sp, tl, 3), CX, base + 104, MONO(26, 800), C.paper, 7);
  const up = E.inOutExpo(prog(tl, 0.7, 1.15));
  ctx.fillStyle = C.coral; ctx.fillRect(CX - 330, base + 136, 660 * up, 4);
  const fp = E.outExpo(prog(tl, 1.05, 1.45));
  ctx.globalAlpha = fp * 0.55;
  textC(ctx, 'EVERY FRAME, CURVE & SOUND GENERATED IN CODE', CX, H - 118 + (1 - fp) * 20, MONO(16), C.paper, 4);
  ctx.globalAlpha = 1;

  // impact flash
  const fl = Math.exp(-tl / 0.09);
  if (fl > 0.01) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(-300, -300, W + 600, H + 600); }
}

// =================================================================== ENGINE
const SCENES = [
  { fn: sIntro, label: 'INTRO', hud: C.paper },
  { fn: sType, label: 'KINETIC TYPE', hud: C.ink },
  { fn: sGrid, label: 'RHYTHM & GRIDS', hud: C.paper },
  { fn: s3D, label: 'DIMENSION', hud: C.paper },
  { fn: sLiquid, label: 'LIQUID SURFACES', hud: C.paper },
  { fn: sUI, label: 'PRODUCT UI', hud: C.ink },
  { fn: sMontage, label: 'CHAOS EDIT', hud: 'diff' },
  { fn: sEnd, label: 'HELLO', hud: C.paper },
];
function sceneIndex(t) { return Math.min(SCENES.length - 1, Math.max(0, Math.floor(t / BAR + 1e-9))); }

function drawScene(ctx, t) {
  reset(ctx);
  const i = sceneIndex(t);
  const [sx, sy] = shake(t);
  const k = kickEnv(t, 0.08);
  const z = 1 + 0.012 * k;
  ctx.translate(CX + sx, CY + sy); ctx.scale(z, z); ctx.translate(-CX, -CY);
  ctx.save(); SCENES[i].fn(ctx, t - i * BAR, t); ctx.restore();
  reset(ctx);
}

// ---------------------------------------------------------- HUD + finishing
const grain = (() => {
  const [c, x] = mk(512, 512); const img = x.createImageData(512, 512); const r = mulberry32(7);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
})();
let grainPat = null;
function post(ctx, t) {
  reset(ctx);
  // vignette
  const v = ctx.createRadialGradient(CX, CY, H * 0.45, CX, CY, H * 1.15);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // film grain
  if (!grainPat) grainPat = ctx.createPattern(grain, 'repeat');
  const fi = Math.floor(t * FPS);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.11;
  ctx.translate(-Math.floor(hash(fi) * 512), -Math.floor(hash(fi + 0.5) * 512));
  ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore();
  hud(ctx, t);
}
function hud(ctx, t) {
  const i = sceneIndex(t), S = SCENES[i];
  const a = E.outCubic(prog(t, 0.1, 0.5));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  let col = S.hud;
  if (col === 'diff') { ctx.globalCompositeOperation = 'difference'; col = C.white; }
  ctx.fillStyle = col; ctx.strokeStyle = col;
  // registration marks
  ctx.lineWidth = 2;
  for (const [x, y] of [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]]) { seg(ctx, x - 9, y, x + 9, y); seg(ctx, x, y - 9, x, y + 9); }
  textC(ctx, 'CLAUDE — MOTION REEL ’26', 74, 72, MONO(17, 800), col, 2, 'left');
  // timecode
  const f = Math.min(Math.floor(t * FPS + 1e-6), DUR * FPS - 1);
  const ss = Math.floor(f / FPS), ff = f % FPS;
  const tc = `00:00:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
  textC(ctx, tc, W - 74, 72, MONO(17, 800), col, 2, 'right');
  const blink = Math.exp(-fract(t / BEAT) * 4);
  ctx.globalAlpha = a * (0.35 + 0.65 * blink); ctx.fillStyle = S.hud === 'diff' ? col : C.coral;
  disc(ctx, W - 74 - measure(ctx, MONO(17, 800), tc) - 2 * tc.length - 18, 66, 6);
  ctx.globalAlpha = a; ctx.fillStyle = col;
  // chapter label with masked roll
  const lt = t - i * BAR, roll = E.outExpo(prog(lt, 0, 0.35));
  ctx.save(); ctx.beginPath(); ctx.rect(70, H - 100, 700, 40); ctx.clip();
  const prev = i > 0 ? SCENES[i - 1] : null;
  if (prev && roll < 1) textC(ctx, `${String(i - 1).padStart(2, '0')} / ${prev.label}`, 74, H - 70 - roll * 40, MONO(17, 800), col, 2, 'left');
  textC(ctx, `${String(i).padStart(2, '0')} / ${S.label}`, 74, H - 70 + (i > 0 ? (1 - roll) * 40 : 0), MONO(17, 800), col, 2, 'left');
  ctx.restore();
  // segmented progress
  const segW = 34, gap = 6, x0 = W - 74 - (8 * segW + 7 * gap);
  for (let s = 0; s < 8; s++) {
    const p = clamp((t - s * BAR) / BAR);
    ctx.globalAlpha = a * 0.25; ctx.fillRect(x0 + s * (segW + gap), H - 78, segW, 4);
    ctx.globalAlpha = a; ctx.fillRect(x0 + s * (segW + gap), H - 78, segW * p, 4);
  }
  ctx.restore();
}

// ---------------------------------------------------------- frame renderer (motion blur)
const out = document.getElementById('c');
const octx = out.getContext('2d', { willReadFrequently: true });
const [work, wctx] = mk(W, H, true);
let acc = null;
// sub-frames per output frame: more where things move fastest
function samplesAt(t) {
  const within = (a, b) => t > a && t < b;
  if (within(WHIP_A + 0.08, WHIP_B - 0.06)) return 48;                  // whip pan peak
  if (within(BAR + 2 * BEAT - 0.18, BAR + 2 * BEAT + 0.3)) return 40;   // type whip + MOVE slam
  if (within(WHIP_A - 0.05, WHIP_B + 0.25)) return 24;
  if (within(1.4, 1.9) || within(BAR + 3.2 * BEAT, 2 * BAR) || within(2 * BAR + 3 * BEAT, 3 * BAR)) return 24;
  if (within(3 * BAR + 1.2, 4 * BAR) || within(5 * BAR - 0.3, 5 * BAR) || within(T_IMPACT, T_IMPACT + 0.5)) return 20;
  if (within(6 * BAR, 7 * BAR)) return 16;
  return 10;
}
function segmentOf(t) { let a = 0, b = DUR; for (const c of CUTS) { if (c <= t) a = Math.max(a, c); else b = Math.min(b, c); } return [a, b]; }
function renderFrame(fi, opts = {}) {
  const t0 = fi / FPS, shutter = opts.shutter ?? 0.5, n = opts.samples ?? samplesAt(t0);
  if (n <= 1) { drawScene(octx, t0); post(octx, t0); return; }
  const span = shutter / FPS, [sa, sb] = segmentOf(t0 + span / 2);
  if (!acc) acc = new Float32Array(W * H * 4);
  acc.fill(0);
  for (let s = 0; s < n; s++) {
    const ts = clamp(t0 + (s + 0.5) / n * span, sa, sb - 1e-5);
    drawScene(wctx, ts);
    const d = wctx.getImageData(0, 0, W, H).data;
    for (let k = 0; k < d.length; k++) acc[k] += d[k];
  }
  const img = octx.createImageData(W, H), o = img.data, inv = 1 / n;
  for (let k = 0; k < o.length; k++) o[k] = acc[k] * inv;
  octx.putImageData(img, 0, 0);
  post(octx, t0);
}

// =================================================================== AUDIO
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = {
  Fm: [53, 56, 60, 63], Db: [49, 53, 56, 60], Ab: [56, 60, 63, 67], Eb: [51, 55, 58, 62],
};
const ROOT = { Fm: 41, Db: 37, Ab: 44, Eb: 39 };
const PROG = ['Fm', 'Db', 'Ab', 'Eb', 'Fm', 'Eb'];

async function synthAudio(sr = 48000) {
  const ac = new OfflineAudioContext(2, Math.round(DUR * sr), sr);
  const rnd = mulberry32(1234);
  const noiseBuf = ac.createBuffer(1, sr * 2, sr);
  { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
  const irBuf = ac.createBuffer(2, Math.round(sr * 2.6), sr);
  for (let c = 0; c < 2; c++) { const d = irBuf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); }

  const master = ac.createGain();
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.12;
  const lim = ac.createDynamicsCompressor();
  lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.05;
  master.connect(comp); comp.connect(lim); lim.connect(ac.destination);
  const MG = 0.85;
  master.gain.setValueAtTime(MG, 0);
  master.gain.setValueAtTime(MG, T_IMPACT - 0.115);
  master.gain.linearRampToValueAtTime(0.0001, T_IMPACT - 0.1);
  master.gain.setValueAtTime(0.0001, T_IMPACT - 0.004);
  master.gain.linearRampToValueAtTime(MG, T_IMPACT);
  master.gain.setValueAtTime(MG, DUR - 0.25);
  master.gain.linearRampToValueAtTime(0.0001, DUR);

  const rev = ac.createConvolver(); rev.buffer = irBuf;
  const revOut = ac.createGain(); revOut.gain.value = 0.32; rev.connect(revOut); revOut.connect(master);
  const dly = ac.createDelay(1); dly.delayTime.value = BEAT * 0.75;
  const dfb = ac.createGain(); dfb.gain.value = 0.38; const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3200;
  dly.connect(dlp); dlp.connect(dfb); dfb.connect(dly);
  const dOut = ac.createGain(); dOut.gain.value = 0.35; dlp.connect(dOut); dOut.connect(master);
  // side-chained music bus
  const duck = ac.createGain(); duck.connect(master);
  const duckSend = ac.createGain(); duckSend.gain.value = 0.25; duck.connect(duckSend); duckSend.connect(rev);
  duck.gain.setValueAtTime(1, 0);
  for (const k of KICKS) { duck.gain.setValueAtTime(1, k - 0.004); duck.gain.linearRampToValueAtTime(0.22, k + 0.004); duck.gain.setTargetAtTime(1, k + 0.03, 0.075); }

  const noise = (t, dur) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(t, rnd() * 1.5); s.stop(t + dur + 0.05); return s; };
  const gainEnv = (t, a, peak, d) => { const g = ac.createGain(); g.gain.setValueAtTime(0.00001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.00001, t + a + d); return g; };
  const filt = (type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };
  const pan = p => { const s = ac.createStereoPanner(); s.pan.value = p; return s; };

  function kick(t, amp = 1, big = false) {
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(big ? 190 : 160, t); o.frequency.exponentialRampToValueAtTime(big ? 34 : 46, t + (big ? 0.32 : 0.11));
    const g = gainEnv(t, 0.002, amp, big ? 1.5 : 0.36);
    chain(o, g, master); o.start(t); o.stop(t + 1.8);
    const c = noise(t, 0.02); chain(c, filt('highpass', 2500), gainEnv(t, 0.001, 0.25 * amp, 0.012), master);
  }
  function clap(t, amp = 0.5) {
    for (let i = 0; i < 3; i++) chain(noise(t + i * 0.011, 0.02), filt('bandpass', 1400, 1.1), gainEnv(t + i * 0.011, 0.001, amp, 0.012), master);
    const n = noise(t + 0.033, 0.25); const g = gainEnv(t + 0.033, 0.001, amp, 0.17); chain(n, filt('bandpass', 1200, 0.9), g); g.connect(master); g.connect(rev);
  }
  function hat(t, amp = 0.2, open = false, p = 0.15) {
    chain(noise(t, open ? 0.3 : 0.06), filt('highpass', 7500), filt('peaking', 10500, 1), gainEnv(t, 0.001, amp, open ? 0.22 : 0.035), pan(p), master);
  }
  function snare(t, amp = 0.4) {
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    chain(o, gainEnv(t, 0.001, amp * 0.6, 0.08), master); o.start(t); o.stop(t + 0.15);
    const g = gainEnv(t, 0.001, amp, 0.11); chain(noise(t, 0.15), filt('bandpass', 2600, 0.7), g); g.connect(master); g.connect(rev);
  }
  function bass(t, m, dur, amp = 0.3) {
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.006); g.gain.setValueAtTime(amp, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = filt('lowpass', 900, 4); lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(180, t + dur);
    for (const det of [-9, 9]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(m); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
    const sub = ac.createOscillator(); sub.frequency.value = midi(m - 12); const sg = ac.createGain(); sg.gain.value = 0.9; chain(sub, sg, g); sub.start(t); sub.stop(t + dur + 0.05);
    lp.connect(g); g.connect(duck);
  }
  function pluck(t, m, amp = 0.1, cut = 2400, p = 0, send = true) {
    const lp = filt('lowpass', cut, 6); lp.frequency.setValueAtTime(cut * 2.2, t); lp.frequency.exponentialRampToValueAtTime(Math.max(200, cut * 0.25), t + 0.18);
    const g = gainEnv(t, 0.003, amp, 0.22);
    for (const [type, det] of [['sawtooth', -6], ['square', 7]]) { const o = ac.createOscillator(); o.type = type; o.frequency.value = midi(m); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + 0.35); }
    chain(lp, g, pan(p)); g.connect(duck); if (send) g.connect(dly);
  }
  function pad(t0, t1, notes, amp, c0, c1, fadeAt = t1 - 0.4) {
    const lp = filt('lowpass', c0, 1.5); lp.frequency.setValueAtTime(c0, t0); lp.frequency.exponentialRampToValueAtTime(c1, t1 - 0.05);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(amp, t0 + 0.25); g.gain.setValueAtTime(amp, fadeAt); g.gain.exponentialRampToValueAtTime(0.0001, t1);
    notes.forEach((m, i) => { for (const det of [-12, 12]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(m); o.detune.value = det + i; const pn = pan(det > 0 ? 0.5 : -0.5); chain(o, pn, lp); o.start(t0); o.stop(t1 + 0.05); } });
    lp.connect(g); g.connect(master); g.connect(rev);
  }
  function riser(t0, t1, amp = 0.25) {
    const n = noise(t0, t1 - t0); const bp = filt('bandpass', 300, 2.5);
    bp.frequency.setValueAtTime(250, t0); bp.frequency.exponentialRampToValueAtTime(9000, t1);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(amp, t1 - 0.01); g.gain.linearRampToValueAtTime(0.0001, t1);
    chain(n, bp, g); g.connect(master); g.connect(rev);
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(220, t0); o.frequency.exponentialRampToValueAtTime(1760, t1);
    const og = ac.createGain(); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(amp * 0.25, t1 - 0.01); og.gain.linearRampToValueAtTime(0.0001, t1);
    chain(o, og, master); o.start(t0); o.stop(t1);
  }
  function whoosh(t, dur, amp = 0.3, f0 = 400, f1 = 5000, p0 = -0.8, p1 = 0.8) {
    const n = noise(t, dur); const bp = filt('bandpass', f0, 1.4);
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6); bp.frequency.exponentialRampToValueAtTime(f0 * 0.8, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const pn = ac.createStereoPanner(); pn.pan.setValueAtTime(p0, t); pn.pan.linearRampToValueAtTime(p1, t + dur);
    chain(n, bp, g, pn); pn.connect(master); pn.connect(rev);
  }
  function blip(t, f, amp = 0.08, dur = 0.05, type = 'square', p = 0) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f;
    chain(o, gainEnv(t, 0.001, amp, dur), pan(p), master); o.start(t); o.stop(t + dur + 0.02);
  }
  function ping(t, f, amp = 0.15) {
    const o = ac.createOscillator(); o.frequency.value = f; const g = gainEnv(t, 0.002, amp, 0.4);
    chain(o, g); g.connect(master); g.connect(dly); g.connect(rev); o.start(t); o.stop(t + 0.5);
  }
  function bell(t, m, amp = 0.1, p = 0) {
    const f = midi(m), car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain();
    car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.1, t + 0.6);
    mod.connect(mg); mg.connect(car.frequency);
    const g = gainEnv(t, 0.002, amp, 1.1); chain(car, g, pan(p)); g.connect(master); g.connect(rev);
    car.start(t); mod.start(t); car.stop(t + 1.3); mod.stop(t + 1.3);
  }
  function thock(t, amp) {
    const o = ac.createOscillator(); o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.09);
    chain(o, gainEnv(t, 0.001, amp, 0.14), master); o.start(t); o.stop(t + 0.2);
    chain(noise(t, 0.02), filt('bandpass', 1800, 1.2), gainEnv(t, 0.001, amp * 0.4, 0.02), master);
  }
  function bloop(t, amp = 0.12, p = 0) {
    const o = ac.createOscillator(); o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.07);
    chain(o, gainEnv(t, 0.002, amp, 0.12), pan(p), master); o.start(t); o.stop(t + 0.2);
  }
  function impact(t) {
    kick(t, 1.15, true);
    const n = noise(t, 2.2); const lp = filt('lowpass', 6000, 0.5); lp.frequency.setValueAtTime(7000, t); lp.frequency.exponentialRampToValueAtTime(220, t + 1.6);
    const g = gainEnv(t, 0.002, 0.45, 1.8); chain(n, lp, g); g.connect(master); g.connect(rev);
    const cr = noise(t, 2.2); const hp = filt('highpass', 5000); const cg = gainEnv(t, 0.002, 0.16, 1.7); chain(cr, hp, cg); cg.connect(master); cg.connect(rev);
  }

  // ---- arrangement ----
  const B = BEAT;
  // bar 0 — ignition
  pad(0, BAR + 0.05, [41, 53, 56, 60, 63], 0.06, 260, 3200, BAR - 0.3);
  [0, 1, 2, 3].forEach(b => ping(b * B, midi(b === 3 ? 89 : 84), 0.11));
  for (let s = 8; s < 16; s++) hat(s * B / 4, 0.03 + 0.1 * (s - 8) / 8, false, s % 2 ? 0.3 : -0.3);
  riser(0.25, BAR, 0.22);
  for (let s = 0; s < 8; s++) snare(3 * B + s * B / 8, 0.08 + 0.3 * s / 8);
  whoosh(1.4, 0.48, 0.25, 300, 6000, 0, 0);
  // bars 1–6 — the groove
  for (let bar = 1; bar <= 6; bar++) {
    const ch = PROG[bar - 1], tb = bar * BAR, open = Math.min(1, (bar - 1) / 4);
    for (let b = 0; b < 4; b++) {
      const t = tb + b * B;
      kick(t, BIG_HITS.has(bar * 4 + b) ? 1.1 : 0.95, BIG_HITS.has(bar * 4 + b));
      hat(t + B / 2, 0.16, b === 3 && bar % 2 === 0, 0.2);
      if (bar >= 3) { hat(t + B / 4, 0.05, false, -0.35); hat(t + 3 * B / 4, 0.06, false, 0.35); }
      if (b % 2 === 1) clap(t, 0.42);
      bass(t + B / 2, ROOT[ch] + (b === 3 && bar % 2 ? 12 : 0), B * 0.42, 0.24);
    }
    const pat = [0, 1, 2, 3, 2, 3, 1, 2, 0, 1, 2, 3, 3, 2, 1, 2];
    for (let s = 0; s < 16; s++) {
      if (bar === 6 && s >= 12) break;
      const m = CHORDS[ch][pat[s]] + 12 + (s % 8 === 6 ? 12 : 0);
      pluck(tb + s * B / 4, m, s % 4 === 0 ? 0.075 : 0.05, lerp(1400, 4200, open), s % 2 ? 0.4 : -0.4);
    }
  }
  // sound design locked to picture
  whoosh(BAR + 2 * B - 0.18, 0.26, 0.22, 500, 7000, 0.6, -0.9);               // type whips off
  for (let j = 0; j < 12; j++) blip(BAR + 3.25 * B + j * 0.012 + 0.1, 2400 + j * 120, 0.025, 0.02, 'square', -0.8 + j * 0.14); // blinds
  riser(2 * BAR + 3 * B, 3 * BAR, 0.16);                                      // grid -> sphere
  whoosh(3 * BAR + 1.25, 0.6, 0.3, 200, 8000, 0, 0);                         // fly-through
  [0.5, 1.5, 2.5, 3.5].forEach((b, i) => bloop(4 * BAR + b * B, 0.1, i % 2 ? 0.5 : -0.5));
  BARS.forEach((_, i) => blip(5 * BAR + 0.25 + i * 0.045 + 0.08, 900 + i * 90, 0.03, 0.03, 'sine', 0.4));
  [2 * B, 3 * B].forEach(c => { blip(5 * BAR + c, 2200, 0.08, 0.02, 'square', 0.6); blip(5 * BAR + c + 0.03, 1600, 0.05, 0.03, 'sine', 0.6); });
  whoosh(WHIP_A - 0.05, 0.5, 0.42, 300, 6000, 0.9, -0.9);
  // montage stabs
  [1, 1.5, 2, 2.5, 3].forEach((b, i) => {
    const t = 6 * BAR + b * B;
    CHORDS[i % 2 ? 'Eb' : 'Fm'].forEach(m => pluck(t, m + 12, 0.05, 5000, 0, false));
    blip(t, [880, 660, 1320, 990, 440][i], 0.05, 0.06, 'square', i % 2 ? 0.7 : -0.7);
  });
  for (let s = 0; s < 8; s++) snare(6 * BAR + 3 * B + s * B / 16, 0.1 + 0.35 * s / 8);
  riser(6 * BAR + 2 * B, T_IMPACT - 0.1, 0.3);
  // bar 7 — the hit and the hello
  impact(T_IMPACT);
  pad(T_IMPACT, DUR, [29, 41, 53, 56, 60, 63, 67], 0.07, 4000, 700, DUR - 1.0);
  [65, 68, 72, 75, 77, 80].forEach((m, i) => bell(T_IMPACT + LETTER_T(i), m, 0.07, -0.5 + i * 0.2));
  bounceImpacts().forEach(([it, a]) => thock(T_IMPACT + it, 0.35 * a + 0.03));
  for (let i = 0; i < 18; i++) blip(T_IMPACT + 0.55 + i * 0.033, 1800 + hash(i) * 2400, 0.012, 0.015, 'square', hash(i + 4) - 0.5);
  hat(T_IMPACT + 1.45, 0.05, true, 0);

  const buf = await ac.startRendering();
  return buf;
}
function toWav(buf) {
  const nCh = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const ab = new ArrayBuffer(44 + len * nCh * 2), dv = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + len * nCh * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nCh, true); dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * nCh * 2, true); dv.setUint16(32, nCh * 2, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, len * nCh * 2, true);
  const ch = []; for (let c = 0; c < nCh; c++) ch.push(buf.getChannelData(c));
  let o = 44; for (let i = 0; i < len; i++) for (let c = 0; c < nCh; c++) { const v = clamp(ch[c][i], -1, 1); dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7FFF, true); o += 2; }
  return ab;
}
function b64(ab) { const u = new Uint8Array(ab); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }

// =================================================================== API + PLAYER
const fontsReady = Promise.all([
  F(100), F(100, 'Unbounded', 800), F(100, 'Unbounded', 400), F(100, 'Anton', 400), MONO(20), MONO(20, 800), F(20, 'Inter', 800), F(20, 'Inter', 500),
].map(f => document.fonts.load(f))).then(() => document.fonts.ready);

window.reel = {
  W, H, FPS, DUR, BPM,
  ready: fontsReady,
  frame(fi, opts) { renderFrame(fi, opts); return out.toDataURL('image/png'); },
  draw(fi, opts) { renderFrame(fi, opts); },
  async audioWav() { const b = await synthAudio(); return b64(toWav(b)); },
};

if (!RENDER) {
  const pp = document.getElementById('pp'), scrub = document.getElementById('scrub'), tcEl = document.getElementById('tc'), start = document.getElementById('start');
  let actx = null, buffer = null, src = null, playing = false, startAt = 0, pos = 0;
  const now = () => playing ? (actx.currentTime - startAt) % DUR : pos;
  function play() {
    if (!buffer) return;
    src = actx.createBufferSource(); src.buffer = buffer; src.loop = true; src.connect(actx.destination);
    startAt = actx.currentTime - pos; src.start(0, pos); playing = true; pp.textContent = 'PAUSE';
  }
  function pause() { pos = now(); if (src) src.stop(); playing = false; pp.textContent = 'PLAY'; }
  async function boot() {
    start.querySelector('span').textContent = 'SYNTHESIZING SOUNDTRACK…';
    actx = new AudioContext(); buffer = await synthAudio(actx.sampleRate);
    start.remove(); play();
  }
  start.addEventListener('click', boot, { once: true });
  pp.addEventListener('click', () => playing ? pause() : play());
  out.addEventListener('click', () => { if (buffer) playing ? pause() : play(); });
  scrub.addEventListener('input', () => { const was = playing; if (playing) pause(); pos = +scrub.value; if (was) play(); });
  fontsReady.then(() => {
    (function loop() {
      const t = now();
      drawScene(octx, t); post(octx, t);
      if (playing) scrub.value = t;
      tcEl.textContent = t.toFixed(3).padStart(6, '0');
      requestAnimationFrame(loop);
    })();
  });
}
})();
