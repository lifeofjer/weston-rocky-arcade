#!/usr/bin/env node
// Headless end-to-end for Race City 3D.
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
page.setDefaultTimeout(45000);
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
page.on('pageerror', err => errors.push('pageerror: ' + err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('arcadeAge6plus', 'yes'); } catch {}
});

const url = `http://127.0.0.1:${PORT}/games/race-city-3d.html?v=race2`;
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.RACE_READY === true, { timeout: 45000 });

async function shot(name) {
  const dest = path.join(artifacts, name);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 80 });
  console.log('wrote', dest);
  return dest;
}

const R = () => page.evaluate(() => {
  const r = window.RACE;
  return {
    ready: r.ready, map: r.map, form: r.form, playMode: r.playMode, coins: r.coins,
    inv: r.inv, me: r.me, cat: r.cat, train: r.train, race: r.race, stats: r.stats,
    errs: r.errs, roadster: r.ROADSTER, wagon: r.POWER_WAGON,
  };
});

function check(cond, msg) {
  if (!cond) { errors.push('FAIL: ' + msg); console.error('FAIL', msg); }
  else console.log('ok', msg);
}

// Load each map, start drive, screenshot
for (const map of ['utah', 'california', 'vegas']) {
  await page.evaluate(id => { window.RACE.pickMap(id); window.RACE.chooseCar(window.RACE.ROADSTER); window.RACE.startPlay('free'); }, map);
  await page.evaluate(() => window.RACE.sim(0.8));
  await new Promise(r => setTimeout(r, 400));
  const st = await R();
  check(st.map === map, `map ${map} loaded`);
  check(st.me && st.me.n, `${map} player spawned (${st.me && st.me.n})`);
  check(st.train && st.train.cars >= 5, `${map} full-length train (${st.train && st.train.cars} cars)`);
  await shot(`race-city-${map}.jpg`);
}

// Driving + boost + fly
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.pose(0, -40, 0);
  R.setVel(20);
  R.boost();
  R.sim(0.6);
  R.fly();
  R.sim(0.8);
});
let st = await R();
check(st.me && (st.me.air || st.me.y > 1.2 || st.me.mph > 5), `fly/boost moved the roadster y=${st.me && st.me.y} mph=${st.me && st.me.mph} air=${st.me && st.me.air}`);
await shot('race-city-fly.jpg');

// Crash with damage + wheel kick
await page.evaluate(() => {
  const R = window.RACE;
  R.pose(0, -40, 0);
  R.setVel(28);
  R.smashWall();
  R.sim(0.5);
});
st = await R();
check(st.me && st.me.crush > 0.1, `crash damage crush=${st.me && st.me.crush}`);
check(st.stats && st.stats.wrecks >= 1, `wreck counted ${st.stats && st.stats.wrecks}`);
await shot('race-city-crash.jpg');

// Train hit (no wheel kick path; plowed)
await page.evaluate(() => {
  const R = window.RACE;
  R.smashTrain();
  R.sim(0.7);
});
st = await R();
check(st.me && (st.me.crush > 0.2 || st.me.m === 'tumble' || st.me.m === 'wreck'), `train hit mode=${st.me && st.me.m} crush=${st.me && st.me.crush}`);
await shot('race-city-train.jpg');

// Cat mode + Target purchase
await page.evaluate(() => {
  const R = window.RACE;
  R.becomeCat();
  R.enterTarget();
  R.buyItem('snack', 10);
});
st = await R();
check(st.form === 'cat', `cat mode form=${st.form}`);
check(st.inv && st.inv.snack >= 1, `target purchase snack=${st.inv && st.inv.snack} coins=${st.coins}`);
await shot('race-city-cat-target.jpg');

await page.evaluate(() => window.RACE.hopIn());
st = await R();
check(st.form === 'car', `hop back in car form=${st.form}`);

// Race laps
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('race');
  R.sim(0.4);
  // Warp around the oval waypoints to complete laps
  const path = [];
  // drive API doesn't expose path coords; complete laps via internal race object
});
await page.evaluate(() => {
  const r = window.RACE;
  // Force lap progress by simulating race internals through startRace already.
  // Teleport along TRACK using me pose in a circle.
  for (let i = 0; i < 20; i++) {
    const t = i / 20 * Math.PI * 2;
    r.pose(210 + Math.sin(t) * 68, -10 - Math.cos(t) * 44, t);
    r.sim(0.12);
  }
});
st = await R();
check(st.race && st.race.on, `race on lap=${st.race && st.race.lap} wp=${st.race && st.race.wp} path=${st.race && st.race.path}`);
check(st.race && (st.race.lap >= 1 || st.race.wp > 2 || st.race.done), `race progressed lap=${st.race && st.race.lap} wp=${st.race && st.race.wp}`);
await shot('race-city-race.jpg');

await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  // South edge of the Utah speedway, away from the FrontRunner.
  R.pose(210, -52, 0);
  R.beautyCam();
});
await new Promise(r => setTimeout(r, 400));
await page.evaluate(() => window.RACE.beautyCam());
await shot('race-city-beauty.jpg');
{
  const og = path.join(root, 'og', 'race-city-3d.jpg');
  fs.copyFileSync(path.join(artifacts, 'race-city-beauty.jpg'), og);
  console.log('copied beauty og', og);
}

const pageErrs = await page.evaluate(() => window.RACE.errs || []);
for (const e of pageErrs) errors.push('RACE_ERRS: ' + e);

await browser.close();
if (server) try { server.kill('SIGTERM'); } catch {}

const real = errors.filter(e => !/AudioContext|Autoplay|favicon|404/.test(e));
if (real.length) {
  console.error('ERRORS', real);
  process.exit(1);
}
console.log('Race City 3D e2e passed');
process.exit(0);
