/* ==========================================================================
   PubMed stack — PAE vs. TURP
   4.000 s background plate: real PubMed records (pubs.json, retrieved from
   PubMed) rain down onto a pile, each slightly rotated, faster and faster.
   The first, readable sheets carry a highlighter sweep over a VERBATIM
   sentence from their abstract. Every sheet is a real, unique publication.
   ?fps=25 sets the frame rate, ?overlay=1 adds a counter/label chip.
   ========================================================================== */
'use strict';
(() => {

const Q = new URLSearchParams(location.search);
const W = 1920, H = 1080, DUR = 4.0;
const FPS = +(Q.get('fps') || 60);
const OVERLAY = Q.get('overlay') === '1';
const TAU = Math.PI * 2, CX = W / 2, CY = H / 2;
const RENDER = /[?&]render/.test(location.search);
if (RENDER) document.documentElement.classList.add('render');

// verbatim sentences from the abstracts, highlighted on the readable lead sheets
const HEROES = [
  ['32249193', 'Reduction of LUTS in the PAE group was similar to that in the TURP group at 12 months, with fewer complications secondary to PAE.'],
  ['33078236', 'PAE was associated with fewer AEs and shorter hospitalization times.'],
  ['29921613', 'PAE is associated with fewer complications than TURP'],
  ['36964042', 'PAE, PUL, and WVTT appear favourable from a risk-benefit perspective'],
  ['34286370', 'PAE was associated with significantly lower costs compared with TURP.'],
  ['31831295', 'The improvements in subjective and objective variables after PAE are far superior from those due to the placebo effect.'],
];
const EXCLUDE = new Set(['18253111']);     // off-topic hit of the search

// ------------------------------------------------------------- math kit
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const E = {
  inQuad: t => t * t, inCubic: t => t * t * t, outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
const hump = (u, k = 0.04) => u <= 0 ? 0 : (u / k) * Math.exp(1 - u / k);
const fract = x => x - Math.floor(x);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const gauss = r => { let s = 0; for (let i = 0; i < 4; i++) s += r(); return (s - 2) / 0.58; };
function mk(w, h, read = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: read })]; }

// ------------------------------------------------------------- sheet layout
const SW = 820, SH = 1060, M = 56, TEX = 1.6;     // sheet size (px at scale 1), margin, texture supersampling
const INTER = (s, w = 500) => `${w} ${s}px "Inter"`;

function wrap(ctx, text, maxW) {
  const words = text.split(/\s+/).filter(Boolean), lines = []; let cur = '', start = 0, pos = 0;
  const starts = []; let idx = 0;
  for (const w of words) { idx = text.indexOf(w, idx); starts.push(idx); idx += w.length; }
  words.forEach((w, i) => {
    const test = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(test).width > maxW) { lines.push({ s: cur, at: start }); cur = w; start = starts[i]; }
    else { if (!cur) start = starts[i]; cur = test; }
    pos = i;
  });
  if (cur) lines.push({ s: cur, at: start });
  return lines;
}
function layoutSheet(ctx, P, phrase) {
  for (let body = 15.5; body >= 12; body -= 0.5) {
    const L = { ops: [], hl: [], body }; let y = 44;
    const add = (font, col, text, x, yy) => L.ops.push([font, col, text, x, yy]);
    const cw = SW - 2 * M;
    // journal citation line
    ctx.font = INTER(13);
    const cite = `${P.journal}. ${P.year}${P.vol ? ';' + P.vol : ''}${P.issue ? '(' + P.issue + ')' : ''}${P.pages ? ':' + P.pages : ''}. doi: ${P.doi}.`;
    y = 92; for (const l of wrap(ctx, cite, cw)) { add(INTER(13), '#5B616B', l.s, M, y); y += 19; }
    // title
    y += 14; ctx.font = INTER(27, 800);
    for (const l of wrap(ctx, P.title, cw)) { add(INTER(27, 800), '#212121', l.s, M, y + 22); y += 34; }
    // authors
    y += 12; ctx.font = INTER(14);
    const auth = wrap(ctx, P.authors.join(', '), cw);
    auth.slice(0, 3).forEach((l, i) => { add(INTER(14), '#20558A', i === 2 && auth.length > 3 ? l.s.replace(/,?\s*\S*$/, ' et al.') : l.s, M, y + 14); y += 21; });
    // affiliation
    if (P.aff) { y += 6; ctx.font = INTER(12); wrap(ctx, '1 ' + P.aff, cw).slice(0, 2).forEach(l => { add(INTER(12), '#6B7079', l.s, M, y + 12); y += 17; }); }
    // identifiers
    y += 12; add(INTER(13, 800), '#212121', 'PMID: ', M, y + 13);
    ctx.font = INTER(13, 800); const pw = ctx.measureText('PMID: ').width;
    add(INTER(13), '#212121', P.pmid, M + pw, y + 13);
    ctx.font = INTER(13); const iw = ctx.measureText(P.pmid + '     ').width;
    add(INTER(13, 800), '#212121', 'DOI: ', M + pw + iw, y + 13);
    ctx.font = INTER(13, 800); add(INTER(13), '#20558A', P.doi, M + pw + iw + ctx.measureText('DOI: ').width, y + 13);
    y += 30; L.rule = y; y += 26;
    add(INTER(20, 800), '#212121', 'Abstract', M, y + 16); y += 40;
    // abstract body (+ highlight geometry)
    const lh = body * 1.47;
    for (const para of P.abstract) {
      ctx.font = INTER(body);
      const hs = phrase ? para.indexOf(phrase) : -1, he = hs + (phrase ? phrase.length : 0);
      for (const l of wrap(ctx, para, cw)) {
        add(INTER(body), '#222327', l.s, M, y + body);
        if (hs >= 0) {
          const a = Math.max(hs, l.at), b = Math.min(he, l.at + l.s.length);
          if (b > a) {
            const x0 = M + ctx.measureText(l.s.slice(0, a - l.at)).width, x1 = M + ctx.measureText(l.s.slice(0, b - l.at)).width;
            L.hl.push([x0 - 3, y + body * 0.05, x1 - x0 + 6, body * 1.32]);
          }
        }
        y += lh;
      }
      y += body * 0.7;
    }
    const lastHl = L.hl.length ? L.hl[L.hl.length - 1] : null;
    if (!phrase || (lastHl && lastHl[1] + lastHl[3] < SH - 80)) return L;
  }
  throw new Error('highlight does not fit on sheet ' + P.pmid);
}
function paperTexture(P, L) {
  const [c, x] = mk(Math.round(SW * TEX), Math.round(SH * TEX));
  x.scale(TEX, TEX);
  x.fillStyle = '#FBFAF6'; x.fillRect(0, 0, SW, SH);
  const g = x.createLinearGradient(0, 0, SW, SH); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(210,205,190,0.25)');
  x.fillStyle = g; x.fillRect(0, 0, SW, SH);
  // print header/footer like a browser printout
  x.font = INTER(11); x.fillStyle = '#8A8F98';
  x.fillText(`pubmed.ncbi.nlm.nih.gov/${P.pmid}/`, M, 30);
  x.textAlign = 'right'; x.fillText('1/2', SW - M, 30); x.fillText('1/2', SW - M, SH - 22); x.textAlign = 'left';
  // body
  x.save(); x.beginPath(); x.rect(0, 0, SW, SH - 48); x.clip();
  for (const [font, col, text, xx, yy] of L.ops) { x.font = font; x.fillStyle = col; x.fillText(text, xx, yy); }
  x.restore();
  x.fillStyle = '#E3E1DA'; x.fillRect(M, L.rule, SW - 2 * M, 1.5);
  // page continues: fade the cut-off abstract
  const f = x.createLinearGradient(0, SH - 120, 0, SH - 48); f.addColorStop(0, 'rgba(251,250,246,0)'); f.addColorStop(1, 'rgba(251,250,246,1)');
  x.fillStyle = f; x.fillRect(0, SH - 120, SW, 72);
  return c;
}
// cheap stand-in for sheets that are buried deep in the pile (only their edges show)
const blankTex = (() => {
  const [c, x] = mk(SW, SH); const r = mulberry32(9);
  x.fillStyle = '#F7F5EF'; x.fillRect(0, 0, SW, SH); x.fillStyle = '#D9D7D0';
  let y = 90; while (y < SH - 80) { const w = (y < 220 ? 0.9 : 0.75 + r() * 0.25) * (SW - 2 * M); x.fillRect(M, y, w, y < 220 ? 14 : 7); y += y < 220 ? 30 : 22; }
  return c;
})();
const shadowTex = (() => {
  const pad = 120, [c, x] = mk(SW + pad * 2, SH + pad * 2);
  x.filter = 'blur(28px)'; x.fillStyle = 'rgba(0,0,0,1)'; x.fillRect(pad, pad, SW, SH);
  return c;
})();

// ------------------------------------------------------------- the pile
let SHEETS = [];
function buildSheets(pubs) {
  const byId = Object.fromEntries(pubs.map(p => [p.pmid, p]));
  const heroIds = new Set(HEROES.map(h => h[0]));
  const rest = pubs.filter(p => !heroIds.has(p.pmid) && !EXCLUDE.has(p.pmid));
  const r = mulberry32(2024);
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const order = [...HEROES.map(([id, ph]) => ({ P: byId[id], phrase: ph })), ...rest.map(P => ({ P, phrase: null }))];
  const N = order.length, k = 1.3, L0 = 0.32, Lend = 3.96;
  const A = (N - 1) / (Math.exp(k * (Lend - L0)) - 1);              // landing rate grows exponentially
  const meas = mk(10, 10)[1];
  SHEETS = order.map((o, i) => {
    const land = i === 0 ? L0 : L0 + Math.log(1 + i / A) / k;
    const prog_ = i / (N - 1), hero = i < HEROES.length;
    const spread = hero ? 26 + i * 6 : lerp(70, 300, Math.sqrt(prog_));
    const rot = hero ? (hash(i + 3) - 0.5) * 0.09 : (hash(i + 3) - 0.5) * lerp(0.2, 0.55, prog_);
    const from = hash(i + 11) * TAU;
    const L = layoutSheet(meas, o.P, o.phrase);
    if (o.phrase && !L.hl.length) throw new Error('phrase not found in ' + o.P.pmid);
    return {
      ...o, i, land, hero, L, fall: lerp(0.32, 0.15, Math.min(1, prog_ * 1.6)),
      x: CX + gauss(mulberry32(i * 7 + 1)) * spread * 1.3, y: CY + 20 + gauss(mulberry32(i * 13 + 5)) * spread * 0.7,
      rot, fx: Math.cos(from) * lerp(700, 1100, hash(i + 21)), fy: Math.sin(from) * lerp(420, 700, hash(i + 21)),
      frot: (hash(i + 31) - 0.5) * 0.9, tex: null,
    };
  });
}
const texCache = new Map();
function texFor(s) {
  let t = texCache.get(s.i);
  if (!t) { t = paperTexture(s.P, s.L); texCache.set(s.i, t); }
  return t;
}

// ------------------------------------------------------------- frame
function camera(t) {
  const p = t / DUR;
  const s = 1.02 + 0.2 * E.inCubic(p) + 0.04 * p;
  const rot = -0.035 * E.inOutSine(p);
  let sx = 0, sy = 0;
  for (const S of SHEETS) {
    const u = t - S.land; if (u < 0 || u > 0.25) continue;
    const a = lerp(1.5, 7, S.i / SHEETS.length) * Math.exp(-u / 0.05);
    sx += a * Math.sin(S.i * 12.9 + u * 90); sy += a * Math.cos(S.i * 7.1 + u * 80);
  }
  return { s, rot, sx: clamp(sx, -14, 14), sy: clamp(sy, -14, 14) };
}
function drawScene(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // desk
  const g = ctx.createRadialGradient(CX - 200, CY - 260, 80, CX, CY, 1300);
  g.addColorStop(0, '#2A2D44'); g.addColorStop(0.55, '#14152A'); g.addColorStop(1, '#07070F');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const cam = camera(t);
  ctx.translate(CX + cam.sx, CY + cam.sy); ctx.rotate(cam.rot); ctx.scale(cam.s, cam.s); ctx.translate(-CX, -CY);

  let top = -1; for (const S of SHEETS) if (t >= S.land) top = S.i;
  for (const S of SHEETS) {
    const t0 = S.land - S.fall;
    if (t < t0) break;
    const p = clamp((t - t0) / S.fall), h = 1 - E.inQuad(p);           // height above the pile: 1 -> 0
    const settle = hump(t - S.land, 0.035);
    const sc = 1 + h * 0.75 - 0.012 * settle;
    const x = S.x + S.fx * h, y = S.y + S.fy * h, rot = S.rot + S.frot * h;
    // shadow: wide & soft while high, tight on contact
    ctx.save(); ctx.translate(x + 10 + h * 70, y + 14 + h * 90); ctx.rotate(rot); ctx.scale(sc * (1 + h * 0.08), sc * (1 + h * 0.08));
    ctx.globalAlpha = lerp(0.42, 0.18, h);
    ctx.drawImage(shadowTex, -shadowTex.width / 2, -shadowTex.height / 2);
    ctx.restore();
    // sheet
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-SW / 2, -SH / 2);
    const buried = top - S.i > 12 && t > S.land + 0.3;
    if (buried) ctx.drawImage(blankTex, 0, 0, SW, SH);
    else ctx.drawImage(texFor(S), 0, 0, SW, SH);
    // highlighter sweep over the verbatim sentence
    if (S.phrase) {
      const hp = E.inOutCubic(prog(t, S.land + 0.04, S.land + 0.04 + (S.i === 0 ? 0.32 : 0.2)));
      if (hp > 0) {
        const total = S.L.hl.reduce((a, r) => a + r[2], 0); let left = total * hp;
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,226,64,0.95)';
        for (const [rx, ry, rw, rh] of S.L.hl) {
          if (left <= 0) break;
          const w = Math.min(rw, left); left -= rw;
          ctx.beginPath(); ctx.roundRect(rx, ry, w, rh, 3); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    // fresh sheets catch the light, then settle into the pile's tone
    const dim = clamp((top - S.i) / 10) * 0.16;
    if (dim > 0) { ctx.fillStyle = `rgba(20,18,40,${dim})`; ctx.fillRect(0, 0, SW, SH); }
    ctx.restore();
  }
  for (const k of [...texCache.keys()]) if (k < top - 14) texCache.delete(k);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const grain = (() => {
  const [c, x] = mk(512, 512); const img = x.createImageData(512, 512); const r = mulberry32(7);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 100; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
})();
let grainPat = null;
function post(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(CX, CY, H * 0.35, CX, CY, H * 1.05);
  v.addColorStop(0, 'rgba(5,5,15,0)'); v.addColorStop(1, 'rgba(5,5,15,0.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  if (!grainPat) grainPat = ctx.createPattern(grain, 'repeat');
  const fi = Math.floor(t * FPS);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.08;
  ctx.translate(-Math.floor(hash(fi) * 512), -Math.floor(hash(fi + 0.5) * 512));
  ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore();
  if (OVERLAY) drawOverlay(ctx, t);
}
function drawOverlay(ctx, t) {
  let n = 0; for (const S of SHEETS) if (t >= S.land) n++;
  const a = smooth(prog(t, 0.15, 0.4));
  const x = 72, y = H - 150;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(10,11,26,0.82)'; ctx.beginPath(); ctx.roundRect(x, y, 470, 92, 18); ctx.fill();
  ctx.font = '800 15px "JetBrains Mono"'; ctx.fillStyle = 'rgba(244,239,230,0.6)'; ctx.letterSpacing = '3px';
  ctx.fillText('PUBMED · PAE vs. TURP', x + 26, y + 34);
  ctx.font = '800 40px "Inter"'; ctx.fillStyle = '#F4EFE6'; ctx.letterSpacing = '0px';
  const pulse = (() => { let m = 0; for (const S of SHEETS) m = Math.max(m, hump(t - S.land, 0.04)); return m; })();
  ctx.save(); ctx.translate(x + 26, y + 76); ctx.scale(1 + 0.06 * pulse, 1 + 0.06 * pulse);
  ctx.fillText(String(n).padStart(2, '0'), 0, 0); ctx.restore();
  ctx.font = '500 20px "Inter"'; ctx.fillStyle = 'rgba(244,239,230,0.75)'; ctx.fillText('Publikationen', x + 92, y + 72);
  ctx.restore();
}

// ------------------------------------------------------------- motion-blur renderer
const out = document.getElementById('c');
const octx = out.getContext('2d', { willReadFrequently: true });
const [, wctx] = mk(W, H, true);
let acc = null;
const samplesAt = t => t < 0.4 ? 16 : t > 2.6 ? 16 : 12;
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

const ready = Promise.all([
  fetch('pubs.json').then(r => r.json()),
  ...['500 20px "Inter"', '800 20px "Inter"', '800 20px "JetBrains Mono"'].map(f => document.fonts.load(f)),
]).then(([pubs]) => { buildSheets(pubs); return document.fonts.ready; });
window.reel = { W, H, FPS, DUR, ready, frame(fi, o) { renderFrame(fi, o); return out.toDataURL('image/png'); }, draw: renderFrame, sheets: () => SHEETS.map(s => ({ pmid: s.P.pmid, land: +s.land.toFixed(3), hero: s.hero })) };

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
