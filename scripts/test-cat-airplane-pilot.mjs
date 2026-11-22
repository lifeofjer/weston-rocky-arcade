#!/usr/bin/env node
// Headless end-to-end for Cat Airplane Pilot 3D.
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

function check(cond, msg) {
  if (!cond) { errors.push('FAIL: ' + msg); console.error('FAIL', msg); }
  else console.log('ok', msg);
}

async function shot(name) {
  const dest = path.join(artifacts, name);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 82 });
  console.log('wrote', dest);
  return dest;
}

const G = () => page.evaluate(() => {
  const C = window.CATAIR;
  return {
    ready: C.ready, coins: C.coins, owned: C.owned, plane: C.plane,
    form: C.form, mode: C.mode, screen: C.screen, hint: C.hint,
    mission: C.mission, lastLanding: C.lastLanding, pads: C.pads,
    cat: C.cat, craft: C.craft, hangarOpen: C.hangarOpen, prompt: C.prompt,
    errs: C.errs, pt: !!document.getElementById('ptPanel'),
    badge: !!document.querySelector('.age6-hud'),
    gate: !!document.getElementById('age6-gate'),
    gateText: (document.getElementById('age6-gate') || {}).innerText || '',
  };
});

async function canvas() {
  return page.evaluate(() => window.CATAIR.sampleCanvas());
}
function notBlack(c, label) {
  check(c && !c.lost, `${label} WebGL context alive lost=${c && c.lost}`);
  check(c && c.w > 8 && c.h > 8, `${label} drawing buffer ${c && c.w}x${c && c.h}`);
  check(c && c.mean > 8 && c.lit >= 8, `${label} not black mean=${c && c.mean && c.mean.toFixed(1)} lit=${c && c.lit}/${c && c.n}`);
}

const url = `http://127.0.0.1:${PORT}/games/cat-airplane-pilot-3d.html?v=air1`;

// --- Age gate (fresh device, no cookie) ---
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForSelector('#age6-gate', { timeout: 20000 });
let st = await G();
check(st.gate, 'age gate shown before first play');
check(/are you 6 or older/i.test(st.gateText), `gate asks age: ${st.gateText.slice(0, 80)}`);
check(!!await page.$('.age6-badge'), '6+ badge on the gate');
await shot('cat-air-gate.jpg');
await page.click('#age6-yes');
await page.waitForFunction(() => !document.getElementById('age6-gate') && window.CATAIR_READY === true, { timeout: 90000 });
st = await G();
check(!st.gate, 'gate gone after YES');
check(st.ready, 'game ready after YES');
check(st.badge, '6+ HUD badge mounted');

await page.evaluate(() => window.CATAIR.resetSave());
await page.evaluate(() => window.CATAIR.startPlay());
await page.evaluate(() => window.CATAIR.sim(0.4));
await new Promise(r => setTimeout(r, 250));

st = await G();
check(st.form === 'cat', `spawn as cat form=${st.form}`);
check(st.cat && st.cat.vis, 'tabby visible');
check(st.owned.includes('cub') && st.owned.length === 1, `starter cub only owned=${JSON.stringify(st.owned)}`);
check(/hangar|plane/i.test(st.hint), `goal teaches hangar: ${st.hint}`);
check(st.pads && st.pads.stick && st.pads.boost && st.pads.act, 'iPad touch pads present');
check(st.pt, 'Play Together panel exists');
notBlack(await canvas(), 'spawn');
await shot('cat-air-spawn.jpg');

await page.evaluate(() => window.CATAIR.goTo('hangar'));
await page.evaluate(() => window.CATAIR.sim(0.15));
const boarded = await page.evaluate(() => window.CATAIR.board('cub'));
await page.evaluate(() => window.CATAIR.sim(0.2));
st = await G();
check(boarded, 'boarded Cubby Prop');
check(st.form === 'plane', `in plane form=${st.form}`);
check(st.craft && /CUBBY|PROP/i.test(st.craft.n), `flying ${st.craft && st.craft.n}`);
check(/speed|lift|taxi|runway|W/i.test(st.hint), `takeoff teaching: ${st.hint}`);
notBlack(await canvas(), 'in hangar plane');
await shot('cat-air-hangar.jpg');

const tookOff = await page.evaluate(() => window.CATAIR.takeoffRun());
await page.evaluate(() => window.CATAIR.sim(0.4));
st = await G();
check(tookOff, `takeoffRun returned ${tookOff}`);
check(st.mode === 'air', `mode after takeoff=${st.mode}`);
check(st.craft && st.craft.y > 3, `airborne y=${st.craft && st.craft.y}`);
check(st.craft && st.craft.spd > 10, `has airspeed spd=${st.craft && st.craft.spd}`);
notBlack(await canvas(), 'after takeoff');
await shot('cat-air-takeoff.jpg');

const rings = await page.evaluate(() => {
  window.CATAIR.clearKeys();
  const started = window.CATAIR.startMission('rings');
  const n = window.CATAIR.completeRings();
  return { type: started && started.type, n, coins: window.CATAIR.coins, mission: window.CATAIR.mission };
});
st = await G();
check(rings.type === 'rings', `started ring mission type=${rings.type}`);
check(rings.n >= 5, `flew through rings n=${rings.n}`);
check(st.coins >= 30, `ring coins coins=${st.coins}`);
check(!st.mission, `ring mission finished mission=${JSON.stringify(st.mission)}`);
notBlack(await canvas(), 'after rings');
await shot('cat-air-rings.jpg');

const landed = await page.evaluate(() => window.CATAIR.landRun());
st = await G();
check(landed === 'smooth' || landed === 'ok', `landRun quality=${landed}`);
st = await G();
check(st.mode === 'taxi' || st.lastLanding === 'smooth' || st.lastLanding === 'ok', `landed mode=${st.mode} last=${st.lastLanding}`);
check(st.lastLanding === 'smooth' || st.lastLanding === 'ok', `landing quality=${st.lastLanding}`);
check(st.form === 'plane', 'still in plane after landing');
notBlack(await canvas(), 'after landing');
await shot('cat-air-landing.jpg');

const beforeBuy = st.coins;
const bought = await page.evaluate(() => window.CATAIR.buyPlane('jet'));
st = await G();
check(bought, `bought zoom jet coinsBefore=${beforeBuy} coins=${st.coins}`);
check(st.owned.includes('jet'), `owned jet ${JSON.stringify(st.owned)}`);
const hopped = await page.evaluate(() => window.CATAIR.board('jet'));
await page.evaluate(() => window.CATAIR.sim(0.2));
st = await G();
check(hopped && st.craft && /JET/i.test(st.craft.n), `in jet ${st.craft && st.craft.n}`);
notBlack(await canvas(), 'after unlock jet');
await shot('cat-air-jet.jpg');

await page.evaluate(() => { window.CATAIR.crashNow('test bonk'); window.CATAIR.sim(2); });
st = await G();
check(st.form === 'cat' && st.mode === 'walk', `cartoony respawn form=${st.form} mode=${st.mode}`);
check(st.cat && st.cat.vis, 'cat visible after bonk');

const delivered = await page.evaluate(() => window.CATAIR.deliverPackage());
const rode = await page.evaluate(() => window.CATAIR.giveRide());
check(delivered, 'package delivery mission completes');
check(rode, 'passenger ride mission completes');

const saved = await page.evaluate(() => {
  window.CATAIR.persist();
  return JSON.parse(localStorage.getItem('catAirplanePilot3d') || '{}');
});
check(saved.owned && saved.owned.includes('cub'), 'localStorage has cub');
check(saved.owned && saved.owned.includes('jet'), 'localStorage has jet');
check((saved.coins | 0) >= 0, `localStorage coins=${saved.coins}`);

await page.reload({ waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.CATAIR_READY === true, { timeout: 90000 });
await page.evaluate(() => window.CATAIR.startPlay());
await page.evaluate(() => window.CATAIR.sim(0.2));
st = await G();
check(st.owned.includes('jet'), `reload kept jet ${JSON.stringify(st.owned)}`);
check(!st.gate, 'no age gate on return visit');

await page.evaluate(() => window.CATAIR.beautyCam());
await new Promise(r => setTimeout(r, 200));
notBlack(await canvas(), 'beauty cam');
await shot('cat-airplane-pilot-3d.jpg');
fs.copyFileSync(path.join(artifacts, 'cat-airplane-pilot-3d.jpg'), path.join(root, 'og', 'cat-airplane-pilot-3d.jpg'));
console.log('copied og/cat-airplane-pilot-3d.jpg');

const gameErrs = await page.evaluate(() => window.CATAIR.errs || []);
for (const e of gameErrs) errors.push('game: ' + e);

await browser.close();
if (server) server.kill();

if (errors.length) {
  console.error('\nFAILURES\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nCat Airplane Pilot 3D e2e ok');
