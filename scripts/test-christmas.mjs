#!/usr/bin/env node
// Headless Christmas season tests: theme override, snow, plows, Cat Life activities + presents.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  inChristmasWindow, resolveArcadeTheme, christmasSeasonYear,
} from '../shared/arcade-theme.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = process.env.ARTIFACTS || '/opt/cursor/artifacts';
fs.mkdirSync(artifacts, { recursive: true });

const errors = [];
function check(cond, msg) {
  if (!cond) { errors.push('FAIL: ' + msg); console.error('FAIL', msg); }
  else console.log('ok', msg);
}

// Date logic (no browser)
{
  const nov23 = new Date('2026-11-23T18:00:00Z');
  const nov19 = new Date('2026-11-19T18:00:00Z');
  const jan1 = new Date('2027-01-01T18:00:00Z');
  check(inChristmasWindow(nov23), 'Nov 23 Denver window is Christmas');
  check(!inChristmasWindow(nov19), 'Nov 19 is outside Christmas window');
  check(!inChristmasWindow(jan1), 'Jan 1 is outside Christmas window');
  check(resolveArcadeTheme({ search: '?theme=christmas', now: jan1 }).christmas, '?theme=christmas forces on');
  check(!resolveArcadeTheme({ search: '?theme=none', now: nov23 }).christmas, '?theme=none forces off');
  check(resolveArcadeTheme({ search: '', now: nov23 }).christmas, 'in-season default is christmas');
  check(christmasSeasonYear(nov23) === 2026, 'season year 2026');
}

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

const PORT = Number(process.env.PORT || 8091);
async function portUp() {
  try { return (await fetch(`http://127.0.0.1:${PORT}/api/play/health`)).ok; }
  catch { return false; }
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

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: [
    '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-webgl', '--ignore-gpu-blocklist',
  ],
});

async function openGame(pathUrl) {
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  const pageErrs = [];
  page.on('pageerror', err => pageErrs.push('pageerror: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') pageErrs.push('console: ' + msg.text()); });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('arcadeAge6plus', 'yes'); } catch {}
  });
  await page.goto(`http://127.0.0.1:${PORT}${pathUrl}`, { waitUntil: 'load', timeout: 60000 });
  return { page, pageErrs };
}

async function shot(page, name) {
  const dest = path.join(artifacts, name);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 82 });
  console.log('wrote', dest);
}

function notBlack(c, label) {
  check(c && !c.lost, `${label} WebGL alive lost=${c && c.lost}`);
  check(c && c.mean > 8 && c.lit >= 8, `${label} not black mean=${c && c.mean && c.mean.toFixed(1)} lit=${c && c.lit}`);
}

// --- Cat Life Christmas ON ---
{
  const { page, pageErrs } = await openGame('/games/cat-life-city-3d.html?theme=christmas&v=xmas2');
  await page.waitForFunction(() => window.CATLIFE_READY === true, { timeout: 90000 });
  await page.evaluate(() => { window.CATLIFE.resetSave(); window.CATLIFE.startPlay(); window.CATLIFE.sim(0.5); });
  let st = await page.evaluate(() => ({
    theme: window.CATLIFE.theme, x: window.CATLIFE.christmas, cat: window.CATLIFE.cat,
    pads: window.CATLIFE.pads, badge: !!document.querySelector('.age6-hud'),
    pt: !!document.getElementById('ptPanel'),
  }));
  check(st.theme && st.theme.christmas, `catlife theme christmas override=${JSON.stringify(st.theme && st.theme.override)}`);
  check(st.x && st.x.on && st.x.snow, `christmas on snow=${st.x && st.x.snow}`);
  check(st.x && st.x.plows >= 2, `snowplows ${st.x && st.x.plows}`);
  check(st.x && st.x.flakes >= 80, `falling snow flakes=${st.x && st.x.flakes}`);
  check(st.x && st.x.blades >= 2, `plow blades ${st.x && st.x.blades}`);
  check(st.x && st.x.beacons >= 4, `amber beacons ${st.x && st.x.beacons}`);
  check(st.x && st.x.spinners >= 2, `salt spinners ${st.x && st.x.spinners}`);
  check(st.x && st.x.list && /CHRISTMAS DAY/i.test(st.x.listText), `activity list ${st.x && st.x.listText.slice(0,80)}`);
  check(st.cat && st.cat.vis, 'tabby still visible');
  check(st.pads && st.pads.stick && st.pads.fly, 'iPad pads still present');
  check(st.badge, '6+ badge still mounted');
  check(st.pt, 'Play Together still present');
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'catlife christmas spawn');
  await shot(page, 'xmas-catlife-snow.jpg');

  await page.evaluate(() => window.CATLIFE.sim(3.5));
  st = await page.evaluate(() => window.CATLIFE.christmas);
  check(st.cleared > 0, `plows cleared snow cells=${st.cleared} banks=${st.banks}`);
  const plowAt = await page.evaluate(() => {
    const at = window.CATLIFE.goToPlow(0);
    ['pop', 'goal', 'vname'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.style.opacity = '0'; }
    });
    window.CATLIFE.sim(0.2);
    return at;
  });
  check(plowAt && Number.isFinite(plowAt.x), `stood in front of snowplow ${JSON.stringify(plowAt)}`);
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'snowplow closeup');
  await shot(page, 'xmas-catlife-plow.jpg');

  const list = await page.evaluate(() => {
    window.CATLIFE.setHouse('starter');
    window.CATLIFE.goHome(true);
    window.CATLIFE.enterHouse();
    const done = window.CATLIFE.xmasFinishList();
    window.CATLIFE.sim(0.2);
    return { done, x: window.CATLIFE.christmas, list: document.getElementById('xmasList').textContent };
  });
  check(list.done, 'activity list completed via API');
  check(list.x.activities.tree && list.x.activities.lights && list.x.activities.cookies && list.x.activities.snowman && list.x.activities.milk, `acts ${JSON.stringify(list.x.activities)}`);
  check(/Sleep in the bed/i.test(list.list), `sleep hint ${list.list.slice(-80)}`);
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'catlife decorated house');
  await shot(page, 'xmas-catlife-decorated.jpg');

  await page.evaluate(() => {
    window.CATLIFE.xmasGo('snowman');
    window.CATLIFE.sim(0.15);
  });
  await shot(page, 'xmas-catlife-snowman.jpg');

  const slept = await page.evaluate(() => {
    window.CATLIFE.xmasGo('bed');
    const s = window.CATLIFE.xmasSleep();
    window.CATLIFE.sim(0.4);
    const eve = window.CATLIFE.christmas;
    window.CATLIFE.xmasMorning();
    window.CATLIFE.sim(0.3);
    return { s, eve, morning: window.CATLIFE.christmas };
  });
  check(slept.s, 'sleep started Christmas Eve');
  check(slept.eve.phase === 'eve' || slept.morning.slept, `eve phase=${slept.eve.phase}`);
  check(slept.morning.slept && slept.morning.phase === 'morning', `christmas morning phase=${slept.morning.phase}`);
  check(/presents/i.test(slept.morning.listText), `morning list ${slept.morning.listText.slice(-90)}`);
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'christmas morning');
  await shot(page, 'xmas-catlife-morning.jpg');

  const gifts = await page.evaluate(() => {
    window.CATLIFE.xmasGo('presents');
    const opened = [];
    for (let i = 0; i < 6; i++) opened.push(window.CATLIFE.xmasOpen());
    window.CATLIFE.sim(0.5);
    window.CATLIFE.persist();
    return {
      opened,
      x: window.CATLIFE.christmas,
      coins: window.CATLIFE.coins,
      items: window.CATLIFE.items,
      outfit: window.CATLIFE.outfit,
      save: JSON.parse(localStorage.getItem('catLifeCity3d') || '{}'),
    };
  });
  check(gifts.opened.some(id => id === 'coins' || id === 'santa-hat' || id === 'toy-car' || id === 'yarn'), `opened ${JSON.stringify(gifts.opened)}`);
  check(gifts.coins >= 25, `gift coins saved coins=${gifts.coins}`);
  check(gifts.outfit === 'santa', `santa hat outfit=${gifts.outfit}`);
  check(gifts.items.includes('yarn') && gifts.items.includes('toy-car'), `gift items ${JSON.stringify(gifts.items)}`);
  check(gifts.save.outfit === 'santa' && gifts.save.items.includes('yarn'), 'localStorage has hat and yarn');
  check(gifts.x.opened && gifts.x.replay, 'opened once and replay button shown');
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'presents opened');
  await shot(page, 'xmas-catlife-presents.jpg');

  const replay = await page.evaluate(() => {
    const r = window.CATLIFE.xmasReplay();
    window.CATLIFE.sim(0.2);
    return { r, x: window.CATLIFE.christmas, outfit: window.CATLIFE.outfit, items: window.CATLIFE.items };
  });
  check(replay.r && !replay.x.opened && !replay.x.slept, `replay reset ritual opened=${replay.x.opened}`);
  check(replay.outfit === 'santa' && replay.items.includes('yarn'), 'replay keeps gifts already earned');

  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.waitForFunction(() => window.CATLIFE_READY === true, { timeout: 90000 });
  await page.evaluate(() => {
    window.CATLIFE.startPlay();
    window.CATLIFE.showPads();
    window.CATLIFE.sim(0.3);
  });
  const pad = await page.evaluate(() => {
    const stick = document.getElementById('stick');
    const r = stick && stick.getBoundingClientRect();
    const list = document.getElementById('xmasList');
    return { w: innerWidth, shown: !!(r && r.width > 8), list: !!(list && !list.classList.contains('hidden')) };
  });
  check(pad.w === 1024 && pad.shown, `iPad viewport pads w=${pad.w}`);
  check(pad.list, 'christmas list still visible on tablet');
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'iPad christmas');
  await shot(page, 'xmas-catlife-ipad.jpg');

  const villa = await page.evaluate(() => {
    window.CATLIFE.setHouse('villa');
    window.CATLIFE.enterHouse();
    window.CATLIFE.sim(0.15);
    return window.CATLIFE.christmas;
  });
  check(villa.on, 'Palm Villa still has Christmas');
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'villa christmas');
  await shot(page, 'xmas-catlife-villa.jpg');

  for (const e of pageErrs) errors.push('catlife-xmas ' + e);
  const gameErrs = await page.evaluate(() => window.CATLIFE.errs || []);
  for (const e of gameErrs) errors.push('catlife-game ' + e);
  await page.close();
}

// --- Cat Life Christmas OFF ---
{
  const { page, pageErrs } = await openGame('/games/cat-life-city-3d.html?theme=none&v=xmas2');
  await page.waitForFunction(() => window.CATLIFE_READY === true, { timeout: 90000 });
  await page.evaluate(() => { window.CATLIFE.resetSave(); window.CATLIFE.startPlay(); window.CATLIFE.sim(0.4); });
  const st = await page.evaluate(() => ({
    theme: window.CATLIFE.theme, x: window.CATLIFE.christmas,
    list: document.getElementById('xmasList') && !document.getElementById('xmasList').classList.contains('hidden'),
    cat: window.CATLIFE.cat,
  }));
  check(st.theme && !st.theme.christmas, `theme=none christmas=${st.theme && st.theme.christmas}`);
  check(st.x && !st.x.on && !st.x.snow && (st.x.plows|0) === 0, `no snow/plows off-season ${JSON.stringify({on:st.x.on,plows:st.x.plows})}`);
  check(!st.list, 'no activity list when theme=none');
  check(st.cat && st.cat.vis, 'tabby visible off-season');
  notBlack(await page.evaluate(() => window.CATLIFE.sampleCanvas()), 'catlife theme=none');
  await shot(page, 'xmas-catlife-none.jpg');
  for (const e of pageErrs) errors.push('catlife-none ' + e);
  await page.close();
}

// --- Race City Christmas ON / OFF ---
{
  const { page, pageErrs } = await openGame('/games/race-city-3d.html?theme=christmas&v=xmas2');
  await page.waitForFunction(() => window.RACE_READY === true, { timeout: 90000 });
  await page.evaluate(() => {
    window.RACE.pickMap('utah');
    window.RACE.chooseCar(window.RACE.ROADSTER);
    window.RACE.startPlay('free');
    window.RACE.sim(1.2);
  });
  let st = await page.evaluate(() => ({ theme: window.RACE.theme, x: window.RACE.christmas, me: window.RACE.me }));
  check(st.theme && st.theme.christmas, 'race city theme=christmas');
  check(st.x && st.x.on && st.x.plows >= 1, `race plows ${st.x && st.x.plows} flakes=${st.x && st.x.flakes}`);
  check(st.x && st.x.blades >= 1 && st.x.beacons >= 2 && st.x.spinners >= 1, `race plow details blades=${st.x && st.x.blades} beacons=${st.x && st.x.beacons}`);
  check(st.me && st.me.n, `race player spawned ${st.me && st.me.n}`);
  notBlack(await page.evaluate(() => window.RACE.sampleCanvas()), 'race christmas utah');
  await shot(page, 'xmas-race-utah.jpg');

  await page.evaluate(() => { window.RACE.pickMap('california'); window.RACE.startPlay('free'); window.RACE.sim(0.6); });
  st = await page.evaluate(() => window.RACE.christmas);
  check(st.on && st.plows >= 1, `california snow plows=${st.plows}`);
  notBlack(await page.evaluate(() => window.RACE.sampleCanvas()), 'race christmas california');
  await shot(page, 'xmas-race-california.jpg');

  await page.evaluate(() => { window.RACE.pickMap('vegas'); window.RACE.startPlay('free'); window.RACE.sim(0.6); });
  st = await page.evaluate(() => window.RACE.christmas);
  check(st.on && st.plows >= 1, `vegas snow plows=${st.plows}`);
  notBlack(await page.evaluate(() => window.RACE.sampleCanvas()), 'race christmas vegas');
  await shot(page, 'xmas-race-vegas.jpg');

  for (const e of pageErrs) errors.push('race-xmas ' + e);
  const gameErrs = await page.evaluate(() => window.RACE.errs || []);
  for (const e of gameErrs) if (!/AudioContext|Autoplay|favicon|404/.test(e)) errors.push('race-game ' + e);
  await page.close();
}

{
  const { page, pageErrs } = await openGame('/games/race-city-3d.html?theme=none&v=xmas2');
  await page.waitForFunction(() => window.RACE_READY === true, { timeout: 90000 });
  await page.evaluate(() => {
    window.RACE.pickMap('utah');
    window.RACE.chooseCar(window.RACE.ROADSTER);
    window.RACE.startPlay('free');
    window.RACE.sim(0.5);
  });
  const st = await page.evaluate(() => ({ theme: window.RACE.theme, x: window.RACE.christmas }));
  check(st.theme && !st.theme.christmas, 'race theme=none');
  check(st.x && !st.x.on && (st.x.plows|0) === 0, `race no plows off-season plows=${st.x && st.x.plows}`);
  notBlack(await page.evaluate(() => window.RACE.sampleCanvas()), 'race theme=none');
  await shot(page, 'xmas-race-none.jpg');
  for (const e of pageErrs) errors.push('race-none ' + e);
  await page.close();
}

await browser.close();
if (server) try { server.kill('SIGTERM'); } catch {}

const real = errors.filter(e => !/AudioContext|Autoplay|favicon|404/.test(e));
if (real.length) {
  console.error('\nFAILURES\n' + real.join('\n'));
  process.exit(1);
}
console.log('\nChristmas season e2e ok');
