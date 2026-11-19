#!/usr/bin/env node
// Headless end-to-end for Cat Life City 3D.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = process.env.ARTIFACTS || '/opt/cursor/artifacts';
fs.mkdirSync(artifacts, { recursive: true });
fs.mkdirSync(path.join(root, 'og'), { recursive: true });

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

const PORT = Number(process.env.PORT || 8088);
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
  for (let i = 0; i < 40 && !ready; i++) await new Promise(r => setTimeout(r, 100));
  if (!ready) { console.error('server did not start'); process.exit(1); }
} else {
  console.log('reusing arcade on', PORT);
}

const errors = [];
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: [
    '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-webgl', '--ignore-gpu-blocklist',
    '--disable-background-networking', '--disable-component-update',
    '--disable-features=Translate,BackForwardCache',
  ],
});
const page = await browser.newPage();
page.setDefaultTimeout(90000);
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
page.on('pageerror', err => errors.push('pageerror: ' + err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('arcadeAge6plus', 'yes'); } catch {}
});

const url = `http://127.0.0.1:${PORT}/games/cat-life-city-3d.html?v=cat1`;
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.CATLIFE_READY === true, { timeout: 90000 });

async function shot(name) {
  const dest = path.join(artifacts, name);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 82 });
  console.log('wrote', dest);
  return dest;
}

const G = () => page.evaluate(() => {
  const C = window.CATLIFE;
  return {
    ready: C.ready, coins: C.coins, car: C.car, house: C.house, items: C.items,
    owned: C.owned, form: C.form, screen: C.screen, goal: C.goal,
    me: C.me, cat: C.cat, houseItems: C.houseItems, pads: C.pads,
    shopOpen: C.shopOpen, shopText: C.shopText, errs: C.errs,
    pt: !!(document.getElementById('ptPanel')),
    badge: !!document.querySelector('.age6-hud'),
  };
});

function check(cond, msg) {
  if (!cond) { errors.push('FAIL: ' + msg); console.error('FAIL', msg); }
  else console.log('ok', msg);
}

async function canvas() {
  return page.evaluate(() => window.CATLIFE.sampleCanvas());
}
function notBlack(c, label) {
  check(c && !c.lost, `${label} WebGL context alive lost=${c && c.lost}`);
  check(c && c.w > 8 && c.h > 8, `${label} drawing buffer ${c && c.w}x${c && c.h}`);
  check(c && c.mean > 8 && c.lit >= 8, `${label} not black mean=${c && c.mean && c.mean.toFixed(1)} lit=${c && c.lit}/${c && c.n}`);
  check(c && c.scissor === false, `${label} scissor off after render scissor=${c && c.scissor}`);
  check(c && c.autoClear === true, `${label} autoClear restored autoClear=${c && c.autoClear}`);
  check(c && c.vp && c.vp[0] === 0 && c.vp[1] === 0 && c.vp[2] > 8 && c.vp[3] > 8, `${label} viewport ${c && c.vp}`);
}

await page.evaluate(() => window.CATLIFE.resetSave());
await page.evaluate(() => window.CATLIFE.startPlay());
await page.evaluate(() => window.CATLIFE.sim(0.4));
await new Promise(r => setTimeout(r, 300));

let st = await G();
check(st.ready, 'game ready');
check(st.form === 'cat', `spawn as cat form=${st.form}`);
check(st.cat && st.cat.vis, 'tabby visible');
check(st.house === 'starter', `starter house house=${st.house}`);
check(st.owned.length === 0, `no cars yet owned=${JSON.stringify(st.owned)}`);
check(st.goal && /coin|rusty|\$1/i.test(st.goal), `goal hint teaches saving: ${st.goal}`);
check(st.pads && st.pads.stick && st.pads.act, 'iPad touch pads present');
check(st.pt, 'Play Together panel exists');
check(st.badge, '6+ HUD badge mounted');
notBlack(await canvas(), 'spawn');
await shot('cat-life-spawn.jpg');

const collected = await page.evaluate(() => window.CATLIFE.collectNearest());
st = await G();
check(collected > 0 || st.coins > 0, `earned coins collected=${collected} coins=${st.coins}`);
if (st.coins < 1) await page.evaluate(() => window.CATLIFE.addCoins(5));
st = await G();
check(st.coins >= 1, `have coins to buy rusty car coins=${st.coins}`);

const bought = await page.evaluate(() => window.CATLIFE.buyCar('rusty'));
await page.evaluate(() => window.CATLIFE.sim(0.3));
st = await G();
check(bought, 'bought $1 rusty car');
check(st.owned.includes('rusty'), `owned rusty ${JSON.stringify(st.owned)}`);
check(st.car === 'rusty', `current car ${st.car}`);
check(st.form === 'car', `hopped into car form=${st.form}`);
check(st.me && /RUSTY/i.test(st.me.n), `driving ${st.me && st.me.n}`);
notBlack(await canvas(), 'after buy car');
await shot('cat-life-rusty-car.jpg');

await page.evaluate(() => {
  window.CATLIFE.setVel(18);
  window.CATLIFE.sim(0.8);
});
st = await G();
check(st.me && Math.abs(st.me.x) + Math.abs(st.me.z) > 1, `drove somewhere x=${st.me && st.me.x} z=${st.me && st.me.z}`);

await page.evaluate(() => window.CATLIFE.smash());
await page.evaluate(() => window.CATLIFE.sim(0.2));
st = await G();
check(st.me && st.me.crush > 0, `crash dent crush=${st.me && st.me.crush}`);

await page.evaluate(() => window.CATLIFE.addCoins(20));
const itemOk = await page.evaluate(() => window.CATLIFE.buyItem('ball'));
await page.evaluate(() => {
  window.CATLIFE.goHome(true);
  window.CATLIFE.goTo('home');
  window.CATLIFE.sim(0.2);
});
st = await G();
check(itemOk, 'bought cat ball');
check(st.items.includes('ball'), `items saved ${JSON.stringify(st.items)}`);
check(st.houseItems.some(h => h.id === 'ball' && h.vis !== false), `ball visible in house ${JSON.stringify(st.houseItems)}`);
check(st.form === 'cat', 'back to cat at house');
notBlack(await canvas(), 'house with toy');
await shot('cat-life-house.jpg');

const played = await page.evaluate(() => window.CATLIFE.playToy('ball'));
check(played, 'cat can play with ball');

await page.evaluate(() => window.CATLIFE.goTo('bull'));
await page.evaluate(() => window.CATLIFE.openShop('bull'));
st = await G();
check(st.shopOpen, 'Bull Motors shop opens');
check(/BULL/i.test(st.shopText), `Bull Motors generic name ${st.shopText.slice(0,80)}`);
await page.evaluate(() => window.CATLIFE.openShop('volt'));
st = await G();
check(/VOLT/i.test(st.shopText), 'Volt Motors generic name');
await page.evaluate(() => window.CATLIFE.openShop('horse'));
st = await G();
check(/PRANCING HORSE/i.test(st.shopText), 'Prancing Horse Motors generic name');
await page.evaluate(() => window.CATLIFE.openShop('rig'));
st = await G();
check(/BIG RIG/i.test(st.shopText), 'Big Rig Trucks generic name');
await page.evaluate(() => window.CATLIFE.openShop('mart'));
st = await G();
check(/BULLSEYE/i.test(st.shopText), 'Bullseye Mart generic name');
await page.evaluate(() => document.getElementById('shop').classList.add('hidden'));

await page.evaluate(() => window.CATLIFE.beautyCam());
await new Promise(r => setTimeout(r, 200));
notBlack(await canvas(), 'beauty cam');
await shot('cat-life-city-3d.jpg');
fs.copyFileSync(path.join(artifacts, 'cat-life-city-3d.jpg'), path.join(root, 'og', 'cat-life-city-3d.jpg'));
console.log('copied og/cat-life-city-3d.jpg');

const saved = await page.evaluate(() => {
  window.CATLIFE.persist();
  return JSON.parse(localStorage.getItem('catLifeCity3d') || '{}');
});
check(saved.owned && saved.owned.includes('rusty'), 'localStorage has rusty car');
check(saved.items && saved.items.includes('ball'), 'localStorage has ball');
check((saved.coins|0) >= 0, `localStorage coins=${saved.coins}`);

await page.reload({ waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.CATLIFE_READY === true, { timeout: 90000 });
await page.evaluate(() => window.CATLIFE.startPlay());
await page.evaluate(() => window.CATLIFE.sim(0.3));
st = await G();
check(st.owned.includes('rusty'), `reload kept rusty car ${JSON.stringify(st.owned)}`);
check(st.items.includes('ball'), `reload kept ball ${JSON.stringify(st.items)}`);
check(st.house === 'starter', `reload kept house ${st.house}`);
check(st.houseItems.some(h => h.id === 'ball'), 'reload placed ball in house');
notBlack(await canvas(), 'after reload');
await shot('cat-life-reload.jpg');

const gameErrs = await page.evaluate(() => window.CATLIFE.errs || []);
for (const e of gameErrs) errors.push('game: ' + e);

await browser.close();
if (server) server.kill();

if (errors.length) {
  console.error('\nFAILURES\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nCat Life City 3D e2e ok');
