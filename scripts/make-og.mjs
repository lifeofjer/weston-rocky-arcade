#!/usr/bin/env node
// Rebuild og-image.png (1200×630) and per-game og/<slug>.(png|jpg) from index.html cards.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://westonandrockysarcade.com';
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function slugFromHref(href) {
  const file = href.split('?')[0].split('/').pop() || '';
  return file.replace(/\.html$/, '');
}

const cards = [...html.matchAll(/<a class="card"(?! soon)([^>]*)>([\s\S]*?)<\/a>/g)].map(m => {
  const href = (m[1].match(/href="([^"]+)"/) || [])[1] || '';
  const title = ((m[2].match(/<div class="t">([^<]+)</) || [])[1] || '').trim();
  const desc = ((m[2].match(/<div class="d">([\s\S]*?)<\/div>/) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const img = m[2].match(/<img src="(data:image\/(png|jpeg|jpg|gif|webp);base64,[^"]+)"/i);
  const box = ((m[2].match(/<div class="box"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').trim();
  return {
    href,
    slug: slugFromHref(href),
    title,
    desc,
    dataUri: img ? img[1] : null,
    ext: img ? (img[2] === 'jpeg' ? 'jpg' : img[2]) : null,
    fallback: box || '?',
  };
}).filter(c => c.slug);

const ogDir = path.join(root, 'og');
fs.mkdirSync(ogDir, { recursive: true });
for (const c of cards) {
  if (!c.dataUri) continue;
  const buf = Buffer.from(c.dataUri.split(',')[1], 'base64');
  fs.writeFileSync(path.join(ogDir, `${c.slug}.${c.ext}`), buf);
}

const tiles = cards.map(c => {
  const src = c.dataUri || '';
  const media = src
    ? `<img src="${src}" alt="${c.title}">`
    : `<div class="ph">${c.fallback}</div>`;
  return `<figure>${media}<figcaption>${c.title}</figcaption></figure>`;
}).join('\n');

const preview = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0b0b2a;color:#fff;font-family:"Courier New",monospace}
.check{height:14px;background:repeating-conic-gradient(#fff 0 25%,#111 0 50%) 0 0/14px 14px}
.wrap{box-sizing:border-box;width:1200px;height:630px;padding:0 28px 18px;display:flex;flex-direction:column}
h1{margin:16px 0 2px;text-align:center;font-size:54px;line-height:1.05;color:#ffd21e;letter-spacing:5px;text-shadow:5px 5px 0 #000,0 0 22px #ff4040}
.sub{text-align:center;color:#7cf;font-size:18px;margin:0 0 14px}
.grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:10px;min-height:0}
figure{margin:0;background:#1d1d48;border:3px solid #ffd21e;box-shadow:4px 4px 0 #000;display:flex;flex-direction:column;min-height:0;overflow:hidden}
figure img,.ph{flex:1;width:100%;object-fit:cover;background:#151528;image-rendering:pixelated;min-height:0}
.ph{display:flex;align-items:center;justify-content:center;font-size:64px;background:#3a3228}
figcaption{padding:4px 6px;font-size:12px;font-weight:bold;color:#ffd21e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.foot{text-align:center;color:#556;font-size:13px;margin-top:8px}
</style></head><body>
<div class="check"></div>
<div class="wrap">
  <h1>WESTON &amp; ROCKY ARCADE</h1>
  <p class="sub">INSERT COIN… JUST KIDDING. FREE PLAY!</p>
  <div class="grid">${tiles}</div>
  <div class="foot">westonandrockysarcade.com · built by Weston and Rocky</div>
</div>
</body></html>`;

const tmpHtml = path.join(tmpdir(), 'wr-arcade-og.html');
fs.writeFileSync(tmpHtml, preview);

const chrome = process.env.CHROME || [
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
].find(p => fs.existsSync(p));

if (!chrome) {
  console.error('No Chrome found. Wrote og thumbs only. Set CHROME= to rasterize og-image.png');
  process.exit(cards.some(c => c.dataUri) ? 0 : 1);
}

const outPng = path.join(root, 'og-image.png');
const shot = path.join(tmpdir(), 'wr-arcade-og.png');
const profile = path.join(tmpdir(), 'wr-arcade-chrome-' + process.pid);
try { fs.unlinkSync(shot); } catch {}
await new Promise((resolve, reject) => {
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1200,630',
    `--user-data-dir=${profile}`,
    `--screenshot=${shot}`, `file://${tmpHtml}`,
  ];
  const child = spawn(chrome, args, { stdio: 'inherit' });
  const timer = setTimeout(() => { try { child.kill('SIGTERM'); } catch {} }, 25000);
  child.on('error', err => { clearTimeout(timer); reject(err); });
  child.on('exit', () => {
    clearTimeout(timer);
    if (fs.existsSync(shot)) resolve();
    else reject(new Error('chrome did not write screenshot'));
  });
});
fs.copyFileSync(shot, outPng);

const manifest = {
  site: SITE,
  generated: new Date().toISOString(),
  games: cards.map(c => ({
    slug: c.slug,
    title: c.title,
    href: c.href,
    thumb: c.dataUri ? `og/${c.slug}.${c.ext}` : null,
  })),
};
fs.writeFileSync(path.join(ogDir, 'games.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('wrote og-image.png and', cards.filter(c => c.dataUri).length, 'thumbs');
