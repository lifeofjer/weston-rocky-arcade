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
page.setDefaultTimeout(90000);
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
page.on('pageerror', err => errors.push('pageerror: ' + err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('arcadeAge6plus', 'yes'); } catch {}
});

const url = `http://127.0.0.1:${PORT}/games/race-city-3d.html?v=race6`;
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.RACE_READY === true, { timeout: 90000 });

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
    picker: r.picker, prompt: r.prompt, remotes: r.remotes, mineNet: r.mineNet,
    pads: r.pads, split: r.split, p2: r.p2,
    gltf: typeof r.gltf==='function'? r.gltf() : r.gltf,
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
  check(st.picker && st.picker.newCarBtn, `${map} NEW CAR button visible`);
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

// Hold-altitude flight: F toggles, stays up, climb/dive/flip, glide, wheel landing
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.pose(0, -80, 0);
  R.setVel(18);
  R.setFly(true);
  R.sim(0.4);
});
st = await R();
check(st.me && st.me.flying && st.me.air, `fly toggle on flying=${st.me && st.me.flying} air=${st.me && st.me.air} y=${st.me && st.me.y}`);
const y0 = st.me && st.me.y;
await page.evaluate(() => window.RACE.sim(2.2));
st = await R();
check(st.me && st.me.flying, `still flying after 2.2s flying=${st.me && st.me.flying}`);
check(st.me && st.me.y > (y0 - 1.5), `holds altitude y0=${y0} y=${st.me && st.me.y}`);
await shot('race-city-fly-hold.jpg');

await page.evaluate(() => {
  const R = window.RACE;
  R.holdAir('climb', true);
  R.sim(1.1);
  R.holdAir('climb', false);
});
st = await R();
const yClimb = st.me && st.me.y;
check(st.me && yClimb > y0 + 4, `climb raised altitude y0=${y0} y=${yClimb}`);
await page.evaluate(() => window.RACE.sim(1.0));
st = await R();
check(st.me && Math.abs(st.me.y - yClimb) < 4, `holds after climb yClimb=${yClimb} y=${st.me && st.me.y}`);

await page.evaluate(() => {
  const R = window.RACE;
  R.holdAir('dive', true);
  R.sim(0.8);
  R.holdAir('dive', false);
});
st = await R();
check(st.me && st.me.y < yClimb - 2 && st.me.flying, `dive lowered y=${st.me && st.me.y} still flying`);

await page.evaluate(() => {
  const R = window.RACE;
  R.holdAir('flip', true);
  R.sim(0.7);
  R.holdAir('flip', false);
});
st = await R();
check(st.me && Math.abs(st.me.flipX) > 0.8, `flip spun pitch flipX=${st.me && st.me.flipX}`);
await page.evaluate(() => {
  const R = window.RACE;
  R.holdAir('rollR', true);
  R.sim(0.5);
  R.holdAir('rollR', false);
});
st = await R();
check(st.me && Math.abs(st.me.flipZ) > 0.4, `roll spun flipZ=${st.me && st.me.flipZ}`);
await shot('race-city-fly-flip.jpg');

await page.evaluate(() => {
  const R = window.RACE;
  R.holdAir('flip', false); R.holdAir('rollR', false); R.holdAir('climb', false); R.holdAir('dive', false);
  R.setFlip(0, 0);
  R.setFly(false);
  R.sim(0.8); // glide
  const y = (window.RACE.me && window.RACE.me.y) || 20;
  return y;
});
st = await R();
check(st.me && !st.me.flying && st.me.air, `glide after F off flying=${st.me && st.me.flying} air=${st.me && st.me.air} y=${st.me && st.me.y}`);
await page.evaluate(() => {
  const R = window.RACE;
  R.setFlip(0, 0);
  R.dropFrom(5, -4);
  R.sim(1.4);
});
st = await R();
check(st.me && !st.me.flying && !st.me.air, `landed flying=${st.me && st.me.flying} air=${st.me && st.me.air} y=${st.me && st.me.y} mode=${st.me && st.me.m}`);
check(st.me && st.me.m === 'drive', `wheel landing kept driving mode=${st.me && st.me.m}`);
check(st.me && (st.me.crush||0) < 0.2, `wheel landing no crash crush=${st.me && st.me.crush}`);
await shot('race-city-fly-landing.jpg');

// Bad landing (upside down) may still crash
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.pose(20, -80, 0);
  R.setVel(12);
  R.setFly(true);
  R.sim(0.25);
  R.setFlip(Math.PI, 1.4);
  R.holdAir('flip', true);
  R.dropFrom(10, -16);
  R.sim(0.9);
  R.holdAir('flip', false);
});
st = await R();
check(st.me && (st.me.crush > 0.08 || st.me.m === 'tumble' || st.me.m === 'wreck'), `bad landing crashed mode=${st.me && st.me.m} crush=${st.me && st.me.crush}`);
await shot('race-city-fly-crash-land.jpg');

// Rockets never run out: boost twice in the air
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.pose(0, -80, 0);
  R.setFly(true);
  R.boost();
  R.sim(1.2);
  R.unboost();
  R.sim(0.2);
  R.boost();
  R.sim(1.2);
});
st = await R();
check(st.me && st.me.flying && st.me.mph > 20, `rockets still boost in air mph=${st.me && st.me.mph} flying=${st.me && st.me.flying}`);
await page.evaluate(() => window.RACE.unboost());

// Touch / iPad buttons
const pads = await page.evaluate(() => window.RACE.showPads() && window.RACE.pads);
check(pads && pads.fly && pads.climb && pads.dive && pads.steerL && pads.steerR && pads.flip && pads.rollL && pads.rollR, `touch pads present ${JSON.stringify(pads)}`);
await page.evaluate(() => {
  const R = window.RACE;
  R.showPads();
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.pose(0, -80, 0);
  R.tapPad('padFly');
  R.sim(0.5);
});
st = await R();
check(st.me && st.me.flying, `padFly toggle on flying=${st.me && st.me.flying}`);
check(st.pads && st.pads.flyOn, `FLY button shows ON`);
await page.evaluate(() => {
  const R = window.RACE;
  R.holdAir('climb', true);
  R.sim(0.8);
  R.holdAir('climb', false);
  R.holdAir('steerR', true);
  R.sim(0.4);
  R.holdAir('steerR', false);
  R.tapPad('padFly');
});
st = await R();
check(st.me && !st.me.flying && st.me.air, `padFly toggle off starts glide flying=${st.me && st.me.flying} air=${st.me && st.me.air}`);
await shot('race-city-fly-touch.jpg');

// Crash with damage + wheel kick
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.pose(0, -40, 0);
  R.setVel(28);
  R.smashWall();
  R.sim(0.5);
});
st = await R();
check(st.me && st.me.crush > 0.1, `crash damage crush=${st.me && st.me.crush}`);
check(st.stats && st.stats.wrecks >= 1, `wreck counted ${st.stats && st.stats.wrecks}`);
await page.evaluate(() => window.RACE.settleCrash());
st = await R();
check(st.prompt && st.prompt.open, `post-crash popup open`);
check(st.prompt && st.prompt.hasNewCar, `post-crash popup has NEW CAR`);
check(st.prompt && st.prompt.hasCat, `post-crash popup has BE THE CAT`);
check(st.prompt && /NEW CAR/i.test(st.prompt.text||'') && /BE THE CAT/i.test(st.prompt.text||''), `popup labels ${st.prompt && st.prompt.text}`);
check(st.picker && st.picker.newCarBtn, `NEW CAR HUD button still visible after crash`);
await shot('race-city-crash.jpg');

// NEW CAR picker after crash (button + R key) — respawn driving on the same map
await page.keyboard.press('KeyR');
st = await R();
check(st.picker && st.picker.open, `R key opened picker crash=${st.picker && st.picker.crash} go=${st.picker && st.picker.go}`);
check(st.picker && /DRIVE THIS CAR/i.test(st.picker.go||''), `picker confirm label ${st.picker && st.picker.go}`);
await shot('race-city-newcar-picker.jpg');
await page.evaluate(() => {
  const R = window.RACE;
  R.chooseCar(R.POWER_WAGON);
  R.driveThisCar();
  R.sim(0.5);
});
st = await R();
check(st.form === 'car', `new car form=${st.form}`);
check(st.me && /POWER WAGON/i.test(st.me.n||''), `respawned as ${st.me && st.me.n}`);
check(st.me && st.me.m === 'drive', `respawn mode=${st.me && st.me.m}`);
check(st.me && (st.me.crush||0) < 0.05, `fresh car crush=${st.me && st.me.crush}`);
check(st.map === 'utah', `stayed on same map ${st.map}`);
check(st.playMode === 'free', `free-drive new car kept mode=${st.playMode}`);
await shot('race-city-newcar-respawn.jpg');

// Race mode: crash then pick a new car, stay on the same race
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('race');
  R.sim(0.3);
  R.smashWall();
  R.settleCrash();
  R.openPicker('crash');
  R.chooseCar(R.POWER_WAGON);
  R.driveThisCar();
  R.sim(0.4);
});
st = await R();
check(st.playMode === 'race' && st.race && st.race.on, `race new-car kept race on lap=${st.race && st.race.lap}`);
check(st.me && /POWER WAGON/i.test(st.me.n||'') && st.me.m === 'drive', `race respawned driving ${st.me && st.me.n}`);
check(st.map === 'utah', `race new-car stayed on ${st.map}`);
await shot('race-city-newcar-race.jpg');

// Play Together: remote friend rebuilding when they pick a new car (ci change)
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.simulatePeer({ id:'dad', name:'Dad', data:{ x:4, y:0.6, z:-36, yaw:0, ci:R.ROADSTER, form:'car', mode:'drive', fwd:0 } });
  R.simulatePeer({ id:'dad', name:'Dad', data:{ x:4, y:0.6, z:-36, yaw:0, ci:R.POWER_WAGON, form:'car', mode:'drive', fwd:0 } });
});
st = await R();
check(st.remotes && st.remotes.length >= 1, `play-together remote count=${st.remotes && st.remotes.length}`);
check(st.remotes && st.remotes.some(r => /POWER WAGON/i.test(r.n||'')), `play-together remote rebuilt as ${st.remotes && st.remotes.map(r=>r.n).join(',')}`);
check(st.mineNet && st.mineNet.ci === st.roadster, `local sendMine ci stays ${st.mineNet && st.mineNet.ci}`);
await page.evaluate(() => {
  const R = window.RACE;
  R.openPicker('play');
  R.chooseCar(R.POWER_WAGON);
  R.driveThisCar();
});
st = await R();
check(st.mineNet && /POWER WAGON/i.test(st.mineNet.n||''), `play-together local new car ci=${st.mineNet && st.mineNet.ci} ${st.mineNet && st.mineNet.n}`);
await shot('race-city-newcar-together.jpg');

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
  R.pose(0, -40, 0);
  R.beautyCam();
});
await new Promise(r => setTimeout(r, 400));
await page.evaluate(() => window.RACE.beautyCam());
await shot('race-city-beauty.jpg');
await page.evaluate(() => window.RACE.carCloseup && window.RACE.carCloseup());
await shot('race-city-car-closeup.jpg');
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
  R.chooseCar(R.ROADSTER);
  R.startPlay('free');
  R.pose(0, -40, 0);
  R.carCloseup();
});
await new Promise(r => setTimeout(r, 300));
await shot('race-city-car-closeup-roadster.jpg');
{
  const og = path.join(root, 'og', 'race-city-3d.jpg');
  fs.copyFileSync(path.join(artifacts, 'race-city-beauty.jpg'), og);
  console.log('copied beauty og', og);
}

// Local 2-player split screen (Weston + Brogan, one laptop)
await page.evaluate(() => {
  const R = window.RACE;
  R.pickMap('utah');
});
st = await R();
check(st.picker && st.picker.splitBtn, `2 PLAYERS button on car pick "${st.picker && st.picker.go}" splitBtn=${st.picker && st.picker.splitBtn}`);
await page.evaluate(() => window.RACE.chooseCar(window.RACE.ROADSTER));
await page.evaluate(() => document.getElementById('goSplit').click());
st = await R();
check(st.split && st.split.pick === 2, `after 2 PLAYERS click, picking P2 pick=${st.split && st.split.pick} btn=${st.split && st.split.btnText}`);
check(st.split && /START 2 PLAYERS/i.test(st.split.btnText||''), `P2 confirm label ${st.split && st.split.btnText}`);
await page.evaluate(() => window.RACE.chooseCar(window.RACE.POWER_WAGON));
await page.evaluate(() => document.getElementById('goSplit').click());
await page.evaluate(() => window.RACE.sim(0.4));
st = await R();
check(st.split && st.split.on, `split on after start hud=${st.split && st.split.hud}`);
check(st.me && /ROADSTER/i.test(st.me.n||''), `P1 spawned ${st.me && st.me.n}`);
check(st.p2 && /POWER WAGON/i.test(st.p2.n||''), `P2 spawned ${st.p2 && st.p2.n}`);
check(st.split && st.split.legend, `key legends visible at start`);
check(st.picker && st.picker.newCarBtn, `P1 NEW CAR button in split`);
await shot('race-city-split.jpg');

// Drive both cars
await page.evaluate(() => {
  const R = window.RACE;
  R.poseP(1, -12, -260, 0);
  R.poseP(2, 12, -260, 0);
  R.driveP(1, true);
  R.driveP(2, true);
  R.sim(0.8);
  R.driveP(1, false);
  R.driveP(2, false);
});
st = await R();
check(st.me && st.me.mph > 4, `P1 drove mph=${st.me && st.me.mph} z=${st.me && st.me.z}`);
check(st.p2 && st.p2.mph > 4, `P2 drove mph=${st.p2 && st.p2.mph} z=${st.p2 && st.p2.z}`);
await shot('race-city-split-drive.jpg');

// Fly with F (P1) and L (P2) — both in Roadsters
await page.evaluate(() => {
  const R = window.RACE;
  R.startSplit(R.ROADSTER, R.ROADSTER);
  R.poseP(1, -30, -280, 0);
  R.poseP(2, 30, -280, 0);
  R.setVelP(1, 16);
  R.setVelP(2, 16);
  R.setFlyP(1, true);
  R.setFlyP(2, true);
  R.sim(0.5);
});
st = await R();
check(st.me && st.me.flying && st.me.air, `P1 F fly flying=${st.me && st.me.flying} y=${st.me && st.me.y}`);
check(st.p2 && st.p2.flying && st.p2.air, `P2 L fly flying=${st.p2 && st.p2.flying} y=${st.p2 && st.p2.y}`);
const y1 = st.me && st.me.y, y2 = st.p2 && st.p2.y;
await page.evaluate(() => {
  const R = window.RACE;
  R.holdAirP(1, 'climb', true);
  R.holdAirP(2, 'climb', true);
  R.sim(0.9);
  R.holdAirP(1, 'climb', false);
  R.holdAirP(2, 'climb', false);
});
st = await R();
check(st.me && st.me.y > y1 + 2, `P1 climb y0=${y1} y=${st.me && st.me.y}`);
check(st.p2 && st.p2.y > y2 + 2, `P2 climb y0=${y2} y=${st.p2 && st.p2.y} flying=${st.p2 && st.p2.flying} mode=${st.p2 && st.p2.m}`);
await page.keyboard.press('KeyF');
await page.keyboard.press('KeyL');
await page.evaluate(() => window.RACE.sim(0.3));
st = await R();
check(st.me && !st.me.flying && st.me.air, `P1 F toggled off flying=${st.me && st.me.flying}`);
check(st.p2 && !st.p2.flying && st.p2.air, `P2 L toggled off flying=${st.p2 && st.p2.flying}`);
await shot('race-city-split-fly.jpg');

// Crash into each other
await page.evaluate(() => {
  const R = window.RACE;
  R.startSplit(R.ROADSTER, R.POWER_WAGON);
  R.poseP(1, 0, -110, 0);
  R.poseP(2, 0, -80, Math.PI);
  R.setVelP(1, 28);
  R.setVelP(2, 28);
  R.sim(1.0);
});
st = await R();
check(st.me && st.p2, `both alive after head-on P1 crush=${st.me && st.me.crush} P2 crush=${st.p2 && st.p2.crush}`);
check((st.me && st.me.crush > 0.08) || (st.p2 && st.p2.crush > 0.08), `split crash damage P1=${st.me && st.me.crush} P2=${st.p2 && st.p2.crush} P1m=${st.me && st.me.m} P2m=${st.p2 && st.p2.m}`);
await shot('race-city-split-crash.jpg');

await page.evaluate(() => {
  const R = window.RACE;
  R.settleCrashP(1);
  R.settleCrashP(2);
});
st = await R();
const p1prompt = await page.evaluate(() => window.RACE.promptP(1));
const p2prompt = await page.evaluate(() => window.RACE.promptP(2));
check(p1prompt && p1prompt.open && p1prompt.hasCat, `P1 crash prompt cat=${p1prompt && p1prompt.hasCat} new=${p1prompt && p1prompt.hasNewCar} ${p1prompt && p1prompt.text}`);
check(p2prompt && p2prompt.open && p2prompt.hasCat, `P2 crash prompt cat=${p2prompt && p2prompt.hasCat} new=${p2prompt && p2prompt.hasNewCar}`);

await page.evaluate(() => window.RACE.becomeCat(1));
st = await R();
check(st.me && st.me.form === 'cat', `P1 became cat form=${st.me && st.me.form}`);
check(st.p2 && st.p2.form === 'car', `P2 still a car form=${st.p2 && st.p2.form}`);

// Reset each player
await page.keyboard.press('KeyR');
st = await R();
check(st.picker && st.picker.open && st.picker.slot === 1, `R opened P1 picker slot=${st.picker && st.picker.slot}`);
await page.evaluate(() => {
  const R = window.RACE;
  R.chooseCar(R.POWER_WAGON);
  R.driveThisCar();
  R.sim(0.3);
});
st = await R();
check(st.me && /POWER WAGON/i.test(st.me.n||'') && st.me.form === 'car', `P1 reset to ${st.me && st.me.n} form=${st.me && st.me.form}`);
await page.keyboard.press('KeyP');
st = await R();
check(st.picker && st.picker.open && st.picker.slot === 2, `P opened P2 picker slot=${st.picker && st.picker.slot}`);
await page.evaluate(() => {
  const R = window.RACE;
  R.chooseCar(R.ROADSTER);
  R.driveThisCar();
  R.sim(0.3);
});
st = await R();
check(st.p2 && /ROADSTER/i.test(st.p2.n||'') && st.p2.form === 'car', `P2 reset to ${st.p2 && st.p2.n} form=${st.p2 && st.p2.form}`);
check(st.split && st.split.on, `still split after resets`);
await shot('race-city-split-reset.jpg');

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
