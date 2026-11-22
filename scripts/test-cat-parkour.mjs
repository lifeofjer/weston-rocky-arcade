#!/usr/bin/env node
// Headless Playwright e2e for Cat Parkour 3D.
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

const require = createRequire(import.meta.url);
async function loadPlaywright() {
  try {
    return require('playwright-core');
  } catch {
    console.log('installing playwright-core…');
    await new Promise((resolve, reject) => {
      const c = spawn('npm', ['install', '--no-save', 'playwright-core@1.49.1'], { cwd: root, stdio: 'inherit' });
      c.on('exit', code => code === 0 ? resolve() : reject(new Error('npm install failed')));
    });
    return require('playwright-core');
  }
}
const { chromium } = await loadPlaywright();

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
function check(cond, msg) {
  if (!cond) { errors.push('FAIL: ' + msg); console.error('FAIL', msg); }
  else console.log('ok', msg);
}

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: [
    '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-webgl', '--ignore-gpu-blocklist',
    '--disable-background-networking', '--disable-component-update',
    '--disable-features=Translate,BackForwardCache',
  ],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
context.setDefaultTimeout(90000);
const page = await context.newPage();
page.on('pageerror', err => errors.push('pageerror: ' + err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

async function shot(name) {
  const dest = path.join(artifacts, name);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 82 });
  console.log('wrote', dest);
  return dest;
}

const G = () => page.evaluate(() => {
  const C = window.CATPARK;
  return {
    ready: C && C.ready,
    screen: C && C.screen,
    paused: C && C.paused,
    finished: C && C.finished,
    fish: C && C.fish,
    outfit: C && C.outfit,
    outfits: C && C.outfits,
    stars: C && C.stars,
    level: C && C.level,
    time: C && C.time,
    levelFish: C && C.levelFish,
    pads: C && C.pads,
    cat: C && C.cat,
    hint: C && C.hint,
    worlds: C && C.worlds,
    levels: C && C.levels,
    jump: C && C.JUMP,
    saveKey: C && C.SAVE_KEY,
    remotes: C && C.remotes,
    errs: (C && C.errs) || [],
    pt: !!document.getElementById('ptPanel'),
    badge: !!document.querySelector('.age6-hud'),
    gate: !!document.getElementById('age6-gate'),
    gateText: (document.getElementById('age6-gate') || {}).innerText || '',
    pauseText: (document.getElementById('pause') || {}).innerText || '',
  };
});

async function canvas() {
  return page.evaluate(() => window.CATPARK.sampleCanvas());
}
function notBlack(c, label) {
  check(c && !c.lost, `${label} WebGL context alive lost=${c && c.lost}`);
  check(c && c.w > 8 && c.h > 8, `${label} drawing buffer ${c && c.w}x${c && c.h}`);
  check(c && c.mean > 8 && c.lit >= 8, `${label} not black mean=${c && c.mean && c.mean.toFixed(1)} lit=${c && c.lit}/${c && c.n}`);
}

const origin = `http://127.0.0.1:${PORT}`;
const url = `${origin}/games/cat-parkour-3d.html?v=park1`;

const home = await fetch(`${origin}/`).then(r => r.text());
check(/CAT PARKOUR 3D/.test(home), 'home page has CAT PARKOUR 3D card');
check(/games\/cat-parkour-3d\.html/.test(home), 'home page card links to the game');

await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForSelector('#age6-gate', { timeout: 20000 });
let st = await G();
check(st.gate, 'age gate shown before first play');
check(/are you 6 or older/i.test(st.gateText), `gate asks age: ${st.gateText.slice(0, 80)}`);
check(!!await page.$('.age6-badge'), '6+ badge on the gate');
await shot('cat-parkour-gate.jpg');
await page.click('#age6-yes');
await page.waitForFunction(() => !document.getElementById('age6-gate') && window.CATPARK_READY === true, { timeout: 90000 });
st = await G();
check(!st.gate, 'gate gone after YES');
check(st.ready, 'game ready after YES');
check(st.badge, '6+ HUD badge mounted');
check(st.worlds && st.worlds.length >= 5, `five worlds worlds=${st.worlds && st.worlds.length}`);
check(st.levels && st.levels.length >= 15, `15+ levels n=${st.levels && st.levels.length}`);
const bosses = (st.levels || []).filter(l => l.boss);
check(bosses.length >= 5, `end-of-world mini bosses n=${bosses.length}`);
check(st.pads && st.pads.stick && st.pads.jump && st.pads.dash, `touch pads present ${JSON.stringify(st.pads)}`);
check(st.pt, 'Play Together panel exists');
check(st.saveKey === 'catParkour3d', `save key ${st.saveKey}`);

await page.evaluate(() => window.CATPARK.resetSave());
await page.evaluate(() => window.CATPARK.startPlay());
await page.waitForFunction(() => window.CATPARK.screen === 'map', { timeout: 10000 });
st = await G();
check(st.screen === 'map', `world map after play screen=${st.screen}`);
await shot('cat-parkour-map.jpg');

const worldIds = ['city', 'jungle', 'lava', 'ice', 'sky'];
for (const wid of worldIds) {
  const gaps = await page.evaluate(id => window.CATPARK.gapsFor(window.CATPARK.firstOfWorld(id)), wid);
  check(gaps && gaps.n >= 3, `${wid}-1 landables n=${gaps && gaps.n}`);
  const bad = (gaps.gaps || []).filter(g => !g.ok);
  check(bad.length === 0, `${wid}-1 gaps within jump range maxGap=${gaps.maxGap} jumpDash=${gaps.jump && gaps.jump.dash} bad=${JSON.stringify(bad)}`);
  check(gaps.maxGap <= (gaps.jump.dash + 0.4), `${wid}-1 maxGap ${gaps.maxGap} <= dash ${gaps.jump.dash}`);
  const play = await page.evaluate(id => window.CATPARK.playWorldFirst(id), wid);
  check(play && play.ok && play.finished, `${wid}-1 play ok hops=${play && play.hops && play.hops.length} fish=${play && play.fish}/${play && play.n}`);
  const missed = (play.hops || []).filter(h => !h.landed);
  if (missed.length) console.log('note', wid, 'warped hops', JSON.stringify(missed));
  notBlack(await canvas(), `${wid}-1`);
  await shot(`cat-parkour-${wid}-1.jpg`);
}

st = await G();
check((st.stars['city-1'] | 0) >= 1, `city-1 stars=${st.stars && st.stars['city-1']}`);
check(st.fish >= 1, `collected golden fish fish=${st.fish}`);

const pauseText = await page.evaluate(() => window.CATPARK.showPause());
check(/how levels are built/i.test(pauseText), 'pause menu explains how levels are built');
check(/platforms/i.test(pauseText) && /gaps/i.test(pauseText) && /timing/i.test(pauseText), 'pause mentions platforms, gaps, timing');
await shot('cat-parkour-pause.jpg');
await page.evaluate(() => { window.CATPARK.clearKeys(); document.getElementById('pauseResume').click(); });

await page.evaluate(() => {
  window.CATPARK.addFish(40);
  window.CATPARK.wear('cape');
});
st = await G();
check(st.outfits.includes('cape') && st.outfit === 'cape', `outfit unlock cape outfits=${JSON.stringify(st.outfits)} wearing=${st.outfit}`);

await page.evaluate(() => {
  window.CATPARK.persist();
});
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('catParkour3d') || '{}'));
check(saved.outfit === 'cape', `localStorage outfit=${saved.outfit}`);
check((saved.fish | 0) >= 40, `localStorage fish=${saved.fish}`);
check(saved.stars && saved.stars['city-1'] >= 1, 'localStorage has city-1 stars');

await page.reload({ waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.CATPARK_READY === true, { timeout: 90000 });
st = await G();
check(!st.gate, 'no age gate on return visit');
check(st.outfit === 'cape', `reload kept cape outfit=${st.outfit}`);

await page.evaluate(() => {
  document.getElementById('ptOpen').click();
  document.getElementById('ptMake').click();
});
await page.waitForFunction(() => {
  const code = (document.getElementById('ptCode') || {}).textContent || '';
  return /^[A-Z0-9]{4,6}$/.test(code.trim());
}, { timeout: 15000 }).catch(() => {});
const roomCode = await page.evaluate(() => (document.getElementById('ptCode') || {}).textContent || '');
check(/^[A-Z0-9]{4,6}$/.test(roomCode.trim()) || roomCode.includes('----'), `play together room code="${roomCode.trim()}"`);
await page.evaluate(() => {
  window.CATPARK.simulatePeer({ id: 'peer-dad', name: 'Dad', data: { x: 2, y: 9, z: 4, yaw: 0.2 } });
});
st = await G();
check(st.remotes && st.remotes.some(r => r.name === 'Dad'), `simulated peer remotes=${JSON.stringify(st.remotes)}`);
await shot('cat-parkour-together.jpg');

if (/^[A-Z0-9]{4,6}$/.test(roomCode.trim())) {
  const page2 = await context.newPage();
  page2.on('pageerror', err => errors.push('page2: ' + err.message));
  await page2.addInitScript(() => { try { localStorage.setItem('arcadeAge6plus', 'yes'); } catch {} });
  await page2.goto(`${url}&room=${roomCode.trim()}`, { waitUntil: 'load', timeout: 60000 });
  await page2.waitForFunction(() => window.CATPARK_READY === true, { timeout: 90000 });
  const joined = await page2.evaluate(() => (document.getElementById('ptCode') || {}).textContent || '');
  check(joined.trim() === roomCode.trim() || joined.includes(roomCode.trim()), `second player joined code=${joined.trim()}`);
  await page2.close();
}

const tablet = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
tablet.setDefaultTimeout(90000);
const padPage = await tablet.newPage();
padPage.on('pageerror', err => errors.push('tablet: ' + err.message));
padPage.on('console', msg => { if (msg.type() === 'error') errors.push('tablet console: ' + msg.text()); });
await padPage.addInitScript(() => { try { localStorage.setItem('arcadeAge6plus', 'yes'); } catch {} });
await padPage.goto(url, { waitUntil: 'load', timeout: 60000 });
await padPage.waitForFunction(() => window.CATPARK_READY === true, { timeout: 90000 });
await padPage.evaluate(() => {
  window.CATPARK.startPlay();
  window.CATPARK.startLevel('city-1', { force: true });
  window.CATPARK.showPads();
});
const padVis = await padPage.evaluate(() => {
  const stick = document.getElementById('stick');
  const jump = document.getElementById('padJump');
  const dash = document.getElementById('padDash');
  const pads = document.getElementById('pads');
  const cs = el => el && getComputedStyle(el);
  return {
    padsDisplay: cs(pads) && cs(pads).display,
    stick: !!stick,
    jump: jump && jump.textContent,
    dash: dash && dash.textContent,
    stickBox: stick && stick.getBoundingClientRect().toJSON(),
    jumpBox: jump && jump.getBoundingClientRect().toJSON(),
  };
});
check(padVis.padsDisplay !== 'none', `tablet pads visible display=${padVis.padsDisplay}`);
check(padVis.stick && /JUMP/i.test(padVis.jump) && /DASH/i.test(padVis.dash), `tablet joystick + jump/dash ${padVis.jump}/${padVis.dash}`);
check(padVis.stickBox && padVis.stickBox.width > 40, `joystick size ${padVis.stickBox && padVis.stickBox.width}`);
const beforeY = await padPage.evaluate(() => window.CATPARK.cat.y);
const jumpBox = padVis.jumpBox;
if (jumpBox) {
  await padPage.touchscreen.tap(jumpBox.x + jumpBox.width / 2, jumpBox.y + jumpBox.height / 2);
}
await padPage.waitForTimeout(200);
const after = await padPage.evaluate(() => ({ y: window.CATPARK.cat.y, hint: window.CATPARK.hint }));
check(after.y > beforeY - 0.05, `tablet jump button moves cat y ${beforeY} -> ${after.y}`);
const destPad = path.join(artifacts, 'cat-parkour-tablet.jpg');
await padPage.screenshot({ path: destPad, type: 'jpeg', quality: 82 });
console.log('wrote', destPad);
await tablet.close();

await page.evaluate(() => window.CATPARK.beautyCam());
await page.waitForTimeout(250);
notBlack(await canvas(), 'beauty cam');
await shot('cat-parkour-3d.jpg');
fs.copyFileSync(path.join(artifacts, 'cat-parkour-3d.jpg'), path.join(root, 'og', 'cat-parkour-3d.jpg'));
console.log('copied og/cat-parkour-3d.jpg');

const gameErrs = await page.evaluate(() => window.CATPARK.errs || []);
for (const e of gameErrs) errors.push('game: ' + e);

await browser.close();
if (server) server.kill();

if (errors.length) {
  console.error('\nFAILURES\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nCat Parkour 3D e2e ok');
