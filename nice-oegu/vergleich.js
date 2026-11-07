/* ==========================================================================
   NICE vs. ÖGU — „am selben Tag"   (14 s, 1920×1080, no audio)

   0–4 s    „Das ist eine Methode, die gibt es, die funktioniert, die ist sicher."
            -> the real NICE guidance (rendered from the PDF), recommendation 1.1,
               highlights placed on the exact words via PDF word boxes
   4–10 s   „Und am selben Tag, wo diese Guidelines erschienen sind, ist auf der
             Homepage der Österreichischen Gesellschaft für Urologie ein Statement erschienen,"
            -> NICE publication date -> date chip -> schematic browser window uro.at
               (the statement itself is no longer online, so NO text is invented:
                the page content is drawn as neutral skeleton lines)
   10–14 s  „wie schrecklich und wie gefährlich und wie fürchterlich die
             Prostata-Arterienembolisation ist."
            -> the speaker's three adjectives as kinetic type (not presented as a quote)
   All word onsets live in T; ?fps=25 sets the frame rate.
   ========================================================================== */
'use strict';
(() => {

const Q = new URLSearchParams(location.search);
const W = 1920, H = 1080, DUR = 14;
const FPS = +(Q.get('fps') || 60);
const TAU = Math.PI * 2;
const RENDER = /[?&]render/.test(location.search);
if (RENDER) document.documentElement.classList.add('render');

// ------------------------------------------------------------- TIMING (s)
const T = {
  // „Das ist eine Methode, die gibt es, die funktioniert, die ist sicher."
  pageIn: 0.0, methode: 0.55, gibtEs: 1.0, funktioniert: 1.7, sicher: 2.7,
  // „Und am selben Tag, wo diese Guidelines erschienen sind,"
  swap: 4.0, published: 4.45, chip: 4.75, guidelines: 5.0,
  // „ist auf der Homepage der Österreichischen Gesellschaft für Urologie ein Statement erschienen,"
  browser: 6.7, typeUrl: 7.05, org: 7.5, statement: 9.0,
  // „wie schrecklich und wie gefährlich und wie fürchterlich die Prostata-Arterienembolisation ist."
  dim: 10.0, w1: 10.1, w2: 11.1, w3: 12.2, pae: 13.2,
};

const C = {
  desk: '#0E1022', paper: '#F4EFE6', ink: '#16171C', amber: '#FFC94A', mark: 'rgba(255,214,74,0.95)',
  green: '#3DDC97', red: '#FF5A4A', mute: 'rgba(244,239,230,0.6)',
};

// ------------------------------------------------------------- math kit
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const E = {
  inCubic: t => t * t * t, outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
const fract = x => x - Math.floor(x);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
const noise1 = x => { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1; };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h, read = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: read })]; }
const INTER = (s, w = 800) => `${w} ${s}px "Inter"`;
const MONO = (s, w = 800) => `${w} ${s}px "JetBrains Mono"`;
const SERIF = s => `italic 600 ${s}px "Fraunces"`;
function text(ctx, s, x, y, font, col, align = 'left', track = 0) { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.letterSpacing = track + 'px'; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; }

// ------------------------------------------------------------- the NICE pages (pt coordinates from `pdftotext -bbox`)
const PT_W = 595.276, PT_H = 841.89;
const BOX = {
  methode: [[358.73, 186.10, 519.27, 200.61]],                                    // „prostate artery embolisation" (p.4, 1.1)
  gibtEs: [[267.87, 204.10, 529.93, 218.61]],                                     // „adequate to support the use of this procedure"
  funktioniert: [[295.12, 186.10, 340.41, 200.61]],                               // „efficacy"
  sicher: [[232.03, 186.10, 267.16, 200.61]],                                     // „safety"
  published: [[40.0, 576.79, 199.61, 593.71]],                                    // „Published: 25 April 2018" (p.1)
  title: [[40.0, 293.68, 277.96, 335.92], [40.0, 333.28, 241.76, 375.52]],        // „Prostate artery / embolisation" (p.1)
};
const imgs = {};
const loadImg = n => new Promise((res, rej) => { const i = new Image(); i.onload = () => { imgs[n] = i; res(); }; i.onerror = rej; i.src = n + '.png'; });
const shadowTex = (() => {
  const pad = 110, [c, x] = mk(600 + pad * 2, 850 + pad * 2);
  x.filter = 'blur(30px)'; x.fillStyle = '#000'; x.fillRect(pad, pad, 600, 850); return c;
})();
// page placement: left/top in px, s = px per pt, rotation about the page centre
function pagePose(name, t) {
  if (name === 'page4') {
    const a = E.outCubic(prog(t, T.pageIn, T.pageIn + 0.6)), out = E.inOutCubic(prog(t, T.swap, T.swap + 0.7));
    return { x: 30 - out * 1500, y: 130 + (1 - a) * 760, s: 2.0 - out * 0.4, rot: (1 - a) * 0.05 - out * 0.06, alpha: 1 };
  }
  const a = E.outCubic(prog(t, T.swap + 0.08, T.swap + 0.8));
  return { x: 110, y: 55 + (1 - a) * 1100, s: 1.2, rot: (1 - a) * 0.06, alpha: 1 };
}
function withPage(ctx, P, fn) {
  const w = PT_W * P.s, h = PT_H * P.s;
  ctx.save(); ctx.translate(P.x + w / 2, P.y + h / 2); ctx.rotate(P.rot); ctx.translate(-w / 2, -h / 2); ctx.scale(P.s, P.s);
  fn(); ctx.restore();
}
function drawPage(ctx, name, t) {
  const P = pagePose(name, t); if (P.y > H + 50 || P.x + PT_W * P.s < -50) return;
  // soft shadow
  ctx.save(); const w = PT_W * P.s, h = PT_H * P.s;
  ctx.translate(P.x + w / 2 + 16, P.y + h / 2 + 26); ctx.rotate(P.rot); ctx.scale(w / 600, h / 850); ctx.globalAlpha = 0.5;
  ctx.drawImage(shadowTex, -shadowTex.width / 2, -shadowTex.height / 2); ctx.restore();
  withPage(ctx, P, () => {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgs[name], 0, 0, PT_W, PT_H);
    // highlighter strokes on the exact words
    const marks = name === 'page4'
      ? [['methode', T.methode, C.mark], ['gibtEs', T.gibtEs, C.mark], ['funktioniert', T.funktioniert, C.mark], ['sicher', T.sicher, C.mark]]
      : [['published', T.published, C.mark], ['title', T.pae, C.mark]];
    ctx.globalCompositeOperation = 'multiply';
    for (const [k, t0, col] of marks) {
      const p = E.inOutCubic(prog(t, t0, t0 + 0.32));
      if (p <= 0) continue;
      const rows = BOX[k], total = rows.reduce((a, r) => a + r[2] - r[0], 0); let left = total * p;
      ctx.fillStyle = k === 'methode' ? 'rgba(255,214,74,0.55)' : col;
      for (const [x0, y0, x1, y1] of rows) {
        if (left <= 0) break; const w_ = Math.min(x1 - x0, left); left -= x1 - x0;
        ctx.beginPath(); ctx.roundRect(x0 - 2, y0 - 1, w_ + 4, y1 - y0 + 2, 2); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}
// page pt -> screen px (for connectors)
function ptToScreen(name, t, px, py) {
  const P = pagePose(name, t), w = PT_W * P.s, h = PT_H * P.s;
  const lx = px * P.s - w / 2, ly = py * P.s - h / 2, c = Math.cos(P.rot), s = Math.sin(P.rot);
  return [P.x + w / 2 + lx * c - ly * s, P.y + h / 2 + lx * s + ly * c];
}

// ------------------------------------------------------------- the three checks (A: big list on the right, B/C: stamped on page 1)
const CHECKS = [['gibt es', 'gibtEs'], ['funktioniert', 'funktioniert'], ['sicher', 'sicher']];
function checkPose(i, t) {
  const big = { x: 1340, y: 420 + i * 132, r: 32, fs: 64 };
  const small = { x: 166, y: 858 + i * 42, r: 13, fs: 26 };
  const m = E.inOutCubic(prog(t, T.swap + 0.25 + i * 0.05, T.swap + 0.95 + i * 0.05));
  return { x: lerp(big.x, small.x, m), y: lerp(big.y, small.y, m), r: lerp(big.r, small.r, m), fs: lerp(big.fs, small.fs, m), m };
}
function drawCheck(ctx, x, y, r, p, col) {
  ctx.strokeStyle = col; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * E.outCubic(clamp(p * 1.6))); ctx.stroke();
  const q = clamp(p * 1.6 - 0.6);
  if (q > 0) {
    const pts = [[x - r * 0.42, y + r * 0.02], [x - r * 0.1, y + r * 0.34], [x + r * 0.46, y - r * 0.3]];
    const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
    let d = (l1 + l2) * E.outCubic(q);
    ctx.beginPath(); ctx.moveTo(...pts[0]);
    if (d <= l1) ctx.lineTo(lerp(pts[0][0], pts[1][0], d / l1), lerp(pts[0][1], pts[1][1], d / l1));
    else { ctx.lineTo(...pts[1]); d -= l1; ctx.lineTo(lerp(pts[1][0], pts[2][0], d / l2), lerp(pts[1][1], pts[2][1], d / l2)); }
    ctx.stroke();
  }
}
function drawChecks(ctx, t) {
  const head = E.outCubic(prog(t, T.gibtEs - 0.2, T.gibtEs + 0.2)) * (1 - prog(t, T.swap, T.swap + 0.3));
  if (head > 0) { ctx.globalAlpha = head; text(ctx, 'NICE · EMPFEHLUNG 1.1', 1340 - 32, 318, MONO(18), C.mute, 'left', 3); ctx.globalAlpha = 1; }
  CHECKS.forEach(([label, key], i) => {
    const t0 = T[key], p = prog(t, t0, t0 + 0.45);
    if (p <= 0) return;
    const P = checkPose(i, t), pulse = P.m > 0.99 ? Math.max(0, Math.sin(Math.PI * prog(t, T.pae, T.pae + 0.5))) : 0;
    // connector from the highlighted words (only while the list sits on the right)
    if (P.m < 1) {
      const b = BOX[key][0], [sx, sy] = ptToScreen('page4', t, b[2] + 4, (b[1] + b[3]) / 2);
      const cp = E.outCubic(prog(t, t0 + 0.05, t0 + 0.45)) * (1 - P.m);
      if (cp > 0) {
        ctx.save(); ctx.globalAlpha = 0.85 * (1 - P.m); ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.setLineDash([2, 7]); ctx.lineCap = 'round';
        const ex = lerp(sx, P.x - P.r - 14, cp), ey = lerp(sy, P.y, cp);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(lerp(sx, ex, 0.5), sy, lerp(sx, ex, 0.5), ey, ex, ey); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.save(); ctx.globalAlpha = clamp(p * 3);
    if (P.m > 0) { // backing plate once stamped onto the page
      ctx.fillStyle = `rgba(14,16,34,${0.86 * P.m})`; ctx.beginPath(); ctx.roundRect(P.x - P.r - 10, P.y - P.r - 6, 236, P.r * 2 + 12, 10); ctx.fill();
    }
    drawCheck(ctx, P.x, P.y, P.r * (1 + 0.12 * pulse), p, C.green);
    const tx = E.outCubic(prog(t, t0 + 0.08, t0 + 0.45));
    ctx.save(); ctx.beginPath(); ctx.rect(P.x + P.r, P.y - P.fs, 900, P.fs * 1.6); ctx.clip();
    text(ctx, label, P.x + P.r + P.fs * 0.45, P.y + P.fs * 0.36 + (1 - tx) * P.fs, INTER(P.fs), C.paper);
    ctx.restore(); ctx.restore();
  });
}

// ------------------------------------------------------------- date chip
function drawChip(ctx, t) {
  const p = E.inOutCubic(prog(t, T.chip, T.chip + 0.6));
  if (t < T.chip) return;
  const [sx, sy] = ptToScreen('page1', t, 120, 585);
  const tx = 1415, ty = 170, x = lerp(sx, tx, p), y = lerp(sy, ty, p) - 120 * Math.sin(Math.PI * p);
  const s = lerp(0.35, 1, p), w = 520, h = 104;
  // connectors: NICE date -> chip -> browser
  const c1 = E.outCubic(prog(t, T.chip + 0.5, T.chip + 1.1));
  ctx.save(); ctx.strokeStyle = 'rgba(255,201,74,0.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([2, 8]); ctx.lineCap = 'round';
  if (c1 > 0) {
    const [ax, ay] = ptToScreen('page1', t, 202, 585), ex = tx - w / 2 - 10, ey = ty;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    const N = 40; for (let i = 1; i <= N * c1; i++) { const u = i / N; const bx = (1 - u) ** 3 * ax + 3 * (1 - u) ** 2 * u * (ax + 300) + 3 * (1 - u) * u * u * (ex - 260) + u ** 3 * ex; const by = (1 - u) ** 3 * ay + 3 * (1 - u) ** 2 * u * ay + 3 * (1 - u) * u * u * ey + u ** 3 * ey; ctx.lineTo(bx, by); }
    ctx.stroke();
  }
  const c2 = E.outCubic(prog(t, T.browser + 0.4, T.browser + 0.9));
  if (c2 > 0) { ctx.beginPath(); ctx.moveTo(tx, ty + h / 2 + 6); ctx.lineTo(tx, lerp(ty + h / 2 + 6, 296, c2)); ctx.stroke(); }
  ctx.restore();
  // label + chip
  const la = E.outCubic(prog(t, T.chip + 0.3, T.chip + 0.7));
  if (la > 0) { ctx.globalAlpha = la; text(ctx, 'AM SELBEN TAG', tx, ty - h / 2 - 22 + (1 - la) * 10, MONO(20), C.paper, 'center', 5); ctx.globalAlpha = 1; }
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = C.amber; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.shadowColor = 'transparent';
  text(ctx, '25. April 2018', 0, 20, INTER(56), C.ink, 'center', -1);
  ctx.restore();
}

// ------------------------------------------------------------- schematic browser window (no invented content)
const BW = { x: 1010, y: 300, w: 810, h: 590 };
function drawBrowser(ctx, t) {
  const a = E.outCubic(prog(t, T.browser, T.browser + 0.6));
  if (a <= 0) return;
  const { y, w, h } = BW, x = BW.x + (1 - a) * 980;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#F6F6F8'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.clip();
  // chrome
  ctx.fillStyle = '#E4E4EA'; ctx.fillRect(x, y, w, 64);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 30 + i * 24, y + 32, 7, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(x + 120, y + 14, w - 150, 36, 18); ctx.fill();
  const url = 'https://www.uro.at', n = Math.floor(url.length * prog(t, T.typeUrl, T.typeUrl + 0.55));
  ctx.strokeStyle = '#8A8F98'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x + 140, y + 26, 10, 9, 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 145, y + 26, 4, Math.PI, 0); ctx.stroke();
  text(ctx, url.slice(0, n), x + 162, y + 39, INTER(17, 500), '#2A2B31');
  if (n < url.length && fract(t * 2.5) < 0.6) { ctx.fillStyle = '#2A2B31'; ctx.fillRect(x + 164 + measure(ctx, INTER(17, 500), url.slice(0, n)), y + 22, 2, 22); }
  // page skeleton: header, nav
  const sk = E.outCubic(prog(t, T.typeUrl + 0.5, T.typeUrl + 0.9));
  ctx.globalAlpha = sk;
  ctx.fillStyle = '#D9DBE3'; ctx.beginPath(); ctx.arc(x + 58, y + 112, 22, 0, TAU); ctx.fill();
  ctx.fillRect(x + 92, y + 100, 220, 12); ctx.fillRect(x + 92, y + 118, 150, 8);
  for (let i = 0; i < 4; i++) ctx.fillRect(x + w - 380 + i * 88, y + 106, 64, 10);
  ctx.fillStyle = '#ECEDF2'; ctx.fillRect(x, y + 152, w, 2);
  ctx.globalAlpha = 1;
  // the statement card
  const sp = prog(t, T.statement, T.statement + 0.5);
  if (sp > 0) {
    const cy = y + 188, ch = 360, red = smooth(prog(t, T.dim, T.dim + 0.5));
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#E2E3EA'; ctx.lineWidth = 2;
    ctx.globalAlpha = E.outCubic(sp);
    ctx.beginPath(); ctx.roundRect(x + 40, cy + (1 - E.outCubic(sp)) * 30, w - 80, ch, 14); ctx.fill(); ctx.stroke();
    // tag
    ctx.fillStyle = red > 0 ? `rgba(255,90,74,${0.12 + 0.2 * red})` : 'rgba(42,43,49,0.08)';
    ctx.beginPath(); ctx.roundRect(x + 68, cy + 28, 150, 34, 17); ctx.fill();
    text(ctx, 'STATEMENT', x + 143, cy + 51, MONO(14), red > 0 ? C.red : '#5B5E68', 'center', 2);
    // skeleton lines write in, then turn red
    const lines = [0.92, 0.86, 0.95, 0.7, 0.9, 0.82, 0.55];
    lines.forEach((lw, i) => {
      const lp = E.outCubic(prog(t, T.statement + 0.12 + i * 0.09, T.statement + 0.45 + i * 0.09));
      if (lp <= 0) return;
      ctx.fillStyle = red > 0 ? `rgba(${lerp(206, 255, red)},${lerp(208, 140, red)},${lerp(216, 130, red)},1)` : '#CED0D8';
      ctx.fillRect(x + 68, cy + 96 + i * 34, (w - 136) * lw * lp, i === 0 ? 16 : 11);
    });
    ctx.globalAlpha = 1;
  }
  // scrim for the closing words
  const dim = smooth(prog(t, T.dim, T.dim + 0.4));
  if (dim > 0) { ctx.fillStyle = `rgba(14,16,34,${0.82 * dim})`; ctx.fillRect(x, y + 64, w, h - 64); }
  ctx.restore();
  ctx.restore();
  // org name + caption under the window
  const words = ['Österreichische', 'Gesellschaft', 'für', 'Urologie', 'und', 'Andrologie'];
  let wx = BW.x + 4;
  words.forEach((wd, i) => {
    const wp = E.outCubic(prog(t, T.org + i * 0.2, T.org + i * 0.2 + 0.4));
    if (wp > 0) { ctx.save(); ctx.globalAlpha = wp; text(ctx, wd, wx, y + h + 54 + (1 - wp) * 16, INTER(29), C.paper); ctx.restore(); }
    wx += measure(ctx, INTER(29), wd + ' ');
  });
  const cp = E.outCubic(prog(t, T.statement + 0.6, T.statement + 1.0));
  if (cp > 0) { ctx.globalAlpha = cp; text(ctx, 'uro.at · Statement heute nicht mehr online', BW.x + 4, y + h + 92, MONO(16, 500), C.mute, 'left', 1); ctx.globalAlpha = 1; }
}
const _m = new Map();
function measure(ctx, f, s) { const k = f + '|' + s; let v = _m.get(k); if (v === undefined) { ctx.font = f; v = ctx.measureText(s).width; _m.set(k, v); } return v; }

// ------------------------------------------------------------- the speaker's adjectives
const WORDS = [['schrecklich', 'w1'], ['gefährlich', 'w2'], ['fürchterlich', 'w3']];
function drawWords(ctx, t) {
  WORDS.forEach(([wd, key], i) => {
    const u = t - T[key]; if (u <= 0) return;
    const p = E.outExpo(clamp(u / 0.5));
    const cx = BW.x + BW.w / 2, cy = 470 + i * 140;
    const jit = 1.6 * smooth(clamp(u / 0.4));
    const jx = jit * noise1(t * 16 + i * 9), jy = jit * noise1(t * 16 + i * 9 + 40);
    ctx.save(); ctx.globalAlpha = clamp(u / 0.18);
    ctx.translate(cx + jx, cy + jy); const s = lerp(1.35, 1, p); ctx.scale(s, s);
    ctx.font = SERIF(104); ctx.textAlign = 'center';
    ctx.fillStyle = C.red; ctx.fillText(wd, 0, 0);
    ctx.restore();
    // a short warning rule that draws under each word
    const r = E.outCubic(prog(t, T[key] + 0.15, T[key] + 0.5));
    if (r > 0) { ctx.fillStyle = 'rgba(255,90,74,0.55)'; const rw = measure(ctx, SERIF(104), wd) * r; ctx.fillRect(cx - rw / 2, cy + 22, rw, 3); }
  });
}

// ------------------------------------------------------------- frame
function drawScene(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); ctx.letterSpacing = '0px';
  const g = ctx.createRadialGradient(700, 300, 100, 960, 540, 1400);
  g.addColorStop(0, '#22253F'); g.addColorStop(0.6, C.desk); g.addColorStop(1, '#06070F');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // calm camera: slow push through act A, settle for B, slight drift in C
  const a = E.inOutSine(prog(t, 0, T.swap)), b = E.inOutSine(prog(t, T.swap, T.swap + 1.2)), c = E.inOutSine(prog(t, T.dim, DUR));
  const s = lerp(1.0, 1.045, a) * lerp(1, 1 / 1.045, b) * lerp(1, 1.025, c);
  const fx = lerp(lerp(620, 960, b), 1100, c), fy = 540;
  ctx.translate(fx, fy); ctx.scale(s, s); ctx.translate(-fx, -fy);
  drawPage(ctx, 'page1', t);
  drawPage(ctx, 'page4', t);
  drawChecks(ctx, t);
  drawChip(ctx, t);
  drawBrowser(ctx, t);
  drawWords(ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const grain = (() => {
  const [c, x] = mk(512, 512); const img = x.createImageData(512, 512); const r = mulberry32(7);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
})();
let grainPat = null;
function post(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(960, 540, H * 0.4, 960, 540, H * 1.1);
  v.addColorStop(0, 'rgba(5,5,15,0)'); v.addColorStop(1, 'rgba(5,5,15,0.5)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (!grainPat) grainPat = ctx.createPattern(grain, 'repeat');
  const fi = Math.floor(t * FPS);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  ctx.translate(-Math.floor(hash(fi) * 512), -Math.floor(hash(fi + 0.5) * 512));
  ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore();
}

// ------------------------------------------------------------- motion-blur renderer
const out = document.getElementById('c');
const octx = out.getContext('2d', { willReadFrequently: true });
const [, wctx] = mk(W, H, true);
let acc = null;
const samplesAt = t => (t < 0.7 || (t > T.swap && t < T.swap + 1.0) || (t > T.chip && t < T.chip + 0.7) || (t > T.browser && t < T.browser + 0.7)) ? 14 : 8;
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

const ready = Promise.all([loadImg('page1'), loadImg('page4'),
  ...[INTER(20), INTER(20, 500), SERIF(40), MONO(20), MONO(20, 500)].map(f => document.fonts.load(f, 'Österreichische gefährlich fürchterlich'))]).then(() => document.fonts.ready);
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
