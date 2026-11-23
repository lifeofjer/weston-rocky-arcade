#!/usr/bin/env node
// Headless Chromium checks for seasonal home-page themes.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = process.env.ARTIFACTS || '/opt/cursor/artifacts';
fs.mkdirSync(artifacts, { recursive: true });

const chrome = process.env.CHROME || [
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(p => fs.existsSync(p));
if (!chrome) { console.error('no chrome'); process.exit(1); }

let puppeteer;
try {
  const require = createRequire(import.meta.url);
  puppeteer = require('puppeteer-core');
} catch {
  console.log('installing puppeteer-core…');
  await new Promise((resolve, reject) => {
    const c = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: root, stdio: 'inherit' });
    c.on('exit', code => code === 0 ? resolve() : reject(new Error('npm install failed')));
  });
  const require = createRequire(import.meta.url);
  puppeteer = require('puppeteer-core');
}

const PORT = Number(process.env.PORT || 8099);
async function portUp() {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/api/play/health`);
    return r.ok;
  } catch { return false; }
}
let server = null;
if (!(await portUp())) {
  server = spawn('node', ['server/index.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  server.stdout.on('data', d => { process.stdout.write(d); if (String(d).includes('listening')) ready = true; });
  server.stderr.on('data', d => process.stderr.write(d));
  for (let i = 0; i < 50 && !ready; i++) await new Promise(r => setTimeout(r, 100));
  if (!ready) { console.error('server did not start'); process.exit(1); }
} else {
  console.log('reusing arcade on', PORT);
}

const fails = [];
function check(cond, msg) {
  if (!cond) { fails.push(msg); console.error('FAIL', msg); }
  else console.log('ok', msg);
}

const gamesDiff = execSync('git diff --name-only -- games/ && git diff --cached --name-only -- games/', { cwd: root, encoding: 'utf8' }).trim();
check(gamesDiff === '', 'git diff has no changes under games/');

const themeSrc = fs.readFileSync(path.join(root, 'shared/arcade-theme.js'), 'utf8')
  + fs.readFileSync(path.join(root, 'shared/arcade-theme.css'), 'utf8');
check(!/balloon/i.test(themeSrc), 'theme source has no balloons');

const EXPECTED = [
  'games/turbo-tap-racers.html',
  'games/train-crash.html',
  'games/asteroid-dodge.html',
  'games/xenonite-builder.html',
  'games/crash-derby.html',
  'games/big-load.html',
  'games/crash-ten.html',
  'games/cat-city.html',
  'games/train-crash-3d.html',
  'games/rail-city-3d.html?v=play9',
  'games/crash-test-3d.html?v=play9',
  'games/race-city-3d.html?v=race7',
  'games/cat-life-city-3d.html?v=cat4',
  'games/cat-airplane-pilot-3d.html?v=air1',
  'games/cat-parkour-3d.html?v=park1',
];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: [
    '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--disable-background-networking', '--disable-component-update',
    '--disable-features=Translate,BackForwardCache',
  ],
});

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: 'ipad', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'ipad-landscape', width: 1024, height: 768, deviceScaleFactor: 2 },
];

const THEMES = [
  { q: 'christmas', expect: 'christmas', banner: 'Merry Christmas from Weston & Rocky!' },
  { q: 'halloween', expect: 'halloween', banner: 'Happy Halloween from Weston & Rocky!' },
  { q: 'july4', expect: 'july4', banner: 'Happy Fourth of July from Weston & Rocky!' },
  { q: 'none', expect: 'none', banner: null },
];

async function inspect(page, theme) {
  return page.evaluate((expectedTheme) => {
    const cards = [...document.querySelectorAll('a.card')];
    const playable = cards.filter(c => !c.classList.contains('soon'));
    const hrefs = playable.map(c => c.getAttribute('href') || '');
    const badges = playable.filter(c => c.querySelector('.age6-badge')).length;
    const banner = document.querySelector('.arcade-banner .msg');
    const balloons = document.querySelectorAll('[class*="balloon"], [id*="balloon"]');
    const grid = getComputedStyle(document.querySelector('.grid')).display;
    return {
      theme: document.documentElement.dataset.arcadeTheme || '',
      className: document.documentElement.className,
      hrefs,
      cardCount: cards.length,
      playable: playable.length,
      badges,
      banner: banner ? banner.textContent.trim() : null,
      balloonCount: balloons.length,
      grid,
      title: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim() || '',
      mascot: !!document.querySelector('.arcade-mascot'),
      lights: !!document.querySelector('.arcade-lights'),
      snow: !!document.querySelector('.arcade-snow'),
      fireworks: !!document.querySelector('.arcade-fx'),
      bats: document.querySelectorAll('.arcade-bat').length,
      bunting: !!document.querySelector('.arcade-bunting'),
      soon: cards.filter(c => c.classList.contains('soon')).length,
      reduced: document.documentElement.classList.contains('reduced-motion'),
      expectedTheme,
    };
  }, theme.expect);
}

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    const logs = [];
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    await page.setViewport(vp);
    page.on('pageerror', err => logs.push('pageerror: ' + err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push('console: ' + msg.text());
    });
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('arcadeAge6plus', 'yes'); } catch {}
    });
    const url = `http://127.0.0.1:${PORT}/?theme=${theme.q}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('a.card');
    await page.waitForFunction(() => document.querySelectorAll('a.card:not(.soon) .age6-badge').length >= 15);
    if (theme.expect !== 'none') {
      await page.waitForSelector('.arcade-banner');
    }
    await new Promise(r => setTimeout(r, 250));
    const info = await inspect(page, theme);
    const tag = `${theme.q}@${vp.name}`;
    check(logs.length === 0, `${tag} no console errors (${logs.join(' | ') || 'none'})`);
    check(info.theme === theme.expect, `${tag} data-arcade-theme=${info.theme}`);
    check(info.cardCount === 16, `${tag} 16 cards (got ${info.cardCount})`);
    check(info.playable === 15, `${tag} 15 playable cards`);
    check(info.soon === 1, `${tag} 1 coming-soon card`);
    check(info.badges === 15, `${tag} 6+ badge on every playable card (${info.badges})`);
    check(info.grid === 'grid', `${tag} grid layout`);
    check(info.title.includes('WESTON') && info.title.includes('ARCADE'), `${tag} title intact`);
    check(JSON.stringify(info.hrefs) === JSON.stringify(EXPECTED), `${tag} game card hrefs unchanged`);
    check(info.balloonCount === 0, `${tag} no balloons`);
    if (theme.banner) {
      check(info.banner === theme.banner, `${tag} banner "${info.banner}"`);
      check(info.mascot, `${tag} mascot present`);
      check(info.lights, `${tag} string lights present`);
    } else {
      check(!info.banner, `${tag} no festive banner`);
      check(!info.mascot, `${tag} no mascot on default look`);
      check(!info.lights, `${tag} no lights on default look`);
    }
    if (theme.expect === 'christmas') check(info.snow, `${tag} snow canvas`);
    if (theme.expect === 'july4') {
      check(info.fireworks, `${tag} fireworks canvas`);
      check(info.bunting, `${tag} bunting`);
    }
    if (theme.expect === 'halloween') check(info.bats >= 4, `${tag} bats around the edges (${info.bats})`);
    const shot = path.join(artifacts, `arcade-${theme.q}-${vp.name}.jpg`);
    await page.screenshot({ path: shot, type: 'jpeg', quality: 80, fullPage: true });
    console.log('wrote', shot);
    await page.close();
  }
}

const phone = await browser.newPage();
phone.setDefaultTimeout(30000);
await phone.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
phone.on('pageerror', err => fails.push('phone pageerror: ' + err.message));
phone.on('console', msg => { if (msg.type() === 'error') fails.push('phone console: ' + msg.text()); });
await phone.goto(`http://127.0.0.1:${PORT}/?theme=christmas`, { waitUntil: 'networkidle0' });
await phone.waitForSelector('.arcade-banner');
await phone.screenshot({ path: path.join(artifacts, 'arcade-christmas-phone.jpg'), type: 'jpeg', quality: 80, fullPage: true });
console.log('wrote', path.join(artifacts, 'arcade-christmas-phone.jpg'));
await phone.close();

const reduced = await browser.newPage();
reduced.setDefaultTimeout(30000);
await reduced.setViewport({ width: 1440, height: 900 });
reduced.on('pageerror', err => fails.push('reduced pageerror: ' + err.message));
await reduced.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await reduced.goto(`http://127.0.0.1:${PORT}/?theme=christmas`, { waitUntil: 'networkidle0' });
await reduced.waitForSelector('.arcade-banner');
const reducedOn = await reduced.evaluate(() => document.documentElement.classList.contains('reduced-motion'));
check(reducedOn, 'christmas respects prefers-reduced-motion');
await reduced.screenshot({ path: path.join(artifacts, 'arcade-christmas-reduced-motion.jpg'), type: 'jpeg', quality: 80, fullPage: true });
await reduced.close();

const autoPage = await browser.newPage();
await autoPage.setViewport({ width: 1440, height: 900 });
await autoPage.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
const autoTheme = await autoPage.evaluate(() => document.documentElement.dataset.arcadeTheme);
console.log('auto theme (America/Denver today) =', autoTheme);
check(autoTheme === 'none' || ['christmas', 'halloween', 'july4'].includes(autoTheme), 'auto theme is a known value');
await autoPage.close();

await browser.close();

console.log('checking game card HTTP links…');
for (const href of EXPECTED) {
  const res = await fetch(`http://127.0.0.1:${PORT}/${href}`);
  check(res.ok, `GET /${href} -> ${res.status}`);
}

if (server) server.kill('SIGTERM');

if (fails.length) {
  console.error('\n' + fails.length + ' failures:');
  for (const f of fails) console.error(' -', f);
  process.exit(1);
}
console.log('\nall arcade theme checks passed');
