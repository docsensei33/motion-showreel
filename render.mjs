#!/usr/bin/env node
// Renders the reel frame-by-frame in headless Chromium (with sub-frame motion
// blur), synthesizes the soundtrack offline, and muxes both with ffmpeg.
//
//   node render.mjs                       full render  -> out/showreel.mp4
//   node render.mjs --stills 0.5,4.2,9    PNG stills   -> out/stills/
//   node render.mjs --from 300 --to 420   partial range (frame numbers)
//   node render.mjs --workers 4 --samples 8 --crf 16
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(execRoot(), 'playwright'))); }
function execRoot() { return spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout.trim(); }

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const OUT = path.resolve(ROOT, args.out ?? 'out');
const WORKERS = +(args.workers ?? Math.max(1, Math.min(4, os.cpus().length)));
const SAMPLES = args.samples ? +args.samples : undefined;
const CRF = args.crf ?? '18';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const URL_ = `http://127.0.0.1:${server.address().port}/index.html?render`;

async function openPage() {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('[page]', e.message));
  page.on('console', m => m.type() === 'error' && console.error('[console]', m.text()));
  await page.goto(URL_);
  await page.evaluate(() => window.reel.ready);
  return { browser, page };
}
const writePng = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));

fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();

if (args.stills) {
  const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await openPage();
  const fps = await page.evaluate(() => window.reel.FPS);
  for (const s of String(args.stills).split(',').map(Number)) {
    const fi = Math.round(s * fps);
    const url = await page.evaluate(([fi, n]) => window.reel.frame(fi, n ? { samples: n } : {}), [fi, SAMPLES]);
    const f = path.join(dir, `still_${s.toFixed(3).padStart(6, '0')}.png`);
    writePng(f, url); console.log('wrote', path.relative(ROOT, f));
  }
  await browser.close(); server.close(); process.exit(0);
}

const framesDir = path.join(OUT, 'frames');
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const meta = await (async () => { const { browser, page } = await openPage(); const m = await page.evaluate(() => ({ FPS: reel.FPS, DUR: reel.DUR })); await browser.close(); return m; })();
const total = Math.round(meta.FPS * meta.DUR);
const from = +(args.from ?? 0), to = Math.min(total, +(args.to ?? total));
const todo = []; for (let i = from; i < to; i++) todo.push(i);
let done = 0;

const audioJob = (async () => {
  const { browser, page } = await openPage();
  const b64 = await page.evaluate(() => window.reel.audioWav());
  fs.writeFileSync(path.join(OUT, 'soundtrack.wav'), Buffer.from(b64, 'base64'));
  await browser.close();
  console.log('soundtrack.wav ready');
})();

await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const { browser, page } = await openPage();
  for (let k = w; k < todo.length; k += WORKERS) {
    const fi = todo[k];
    const url = await page.evaluate(([fi, n]) => window.reel.frame(fi, n ? { samples: n } : {}), [fi, SAMPLES]);
    writePng(path.join(framesDir, `f_${String(fi).padStart(5, '0')}.png`), url);
    if (++done % 30 === 0 || done === todo.length) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r${done}/${todo.length} frames  ${el.toFixed(0)}s elapsed  ~${(el / done * (todo.length - done)).toFixed(0)}s left   `);
    }
  }
  await browser.close();
}));
await audioJob;
server.close();
console.log();

const mp4 = path.join(OUT, args.name ?? 'showreel.mp4');
const ff = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(meta.FPS), '-start_number', String(from), '-i', path.join(framesDir, 'f_%05d.png'),
  '-ss', String(from / meta.FPS), '-i', path.join(OUT, 'soundtrack.wav'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.2', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv',
  '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', mp4,
], { stdio: 'inherit' });
if (ff.status !== 0) process.exit(ff.status ?? 1);
console.log(`wrote ${path.relative(ROOT, mp4)} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
