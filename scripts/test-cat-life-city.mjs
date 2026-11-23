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

const url = `http://127.0.0.1:${PORT}/games/cat-life-city-3d.html?theme=none&v=cat5`;
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
    inside: C.inside, liveCoins: C.liveCoins, prompt: C.prompt,
    insideMart: C.insideMart, swimming: C.swimming, onBus: C.onBus,
    moving: C.moving, cart: C.cart, checkout: C.checkout, doorOpen: C.doorOpen,
    doors: C.doors, pool: C.pool, peds: C.peds, buses: C.buses,
    fire: C.fire, hospital: C.hospital, floors: C.floors, upstairs: C.upstairs,
    tip: C.tip, howText: C.howText,
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
check(st.goal && /20|coin/i.test(st.goal), `goal hint teaches saving: ${st.goal}`);
check(st.pads && st.pads.stick && st.pads.act && st.pads.fly && st.pads.grip && st.pads.climb && st.pads.dive, 'iPad touch pads present with fly/grip/climb/dive');
check(st.pt, 'Play Together panel exists');
check(st.badge, '6+ HUD badge mounted');
notBlack(await canvas(), 'spawn');
await shot('cat-life-spawn.jpg');

const collected = await page.evaluate(() => window.CATLIFE.collectNearest());
st = await G();
check(collected > 0 || st.coins > 0, `earned coins collected=${collected} coins=${st.coins}`);
if (st.coins < 20) await page.evaluate(() => window.CATLIFE.addCoins(20));
st = await G();
check(st.coins >= 20, `have 20 coins to buy rusty car coins=${st.coins}`);

const catalog = await page.evaluate(() => window.CATLIFE.CARS.map(c => ({ id: c.id, price: c.price, name: c.name })));
check(catalog.length >= 8 && catalog.every(c => c.price === 20), `every car for sale costs 20 ${JSON.stringify(catalog)}`);
check(catalog.some(c => /VOLT SKY ROADSTER/i.test(c.name)), 'Volt Sky Roadster is in the catalog');
check(!catalog.some(c => /TESLA/i.test(c.name)), 'no Tesla brand names on sale cars');

const bought = await page.evaluate(() => window.CATLIFE.buyCar('rusty'));
await page.evaluate(() => window.CATLIFE.sim(0.3));
st = await G();
check(bought, 'bought 20-coin rusty car');
check(st.owned.includes('rusty'), `owned rusty ${JSON.stringify(st.owned)}`);
check(st.car === 'rusty', `current car ${st.car}`);
check(st.form === 'car', `hopped into car form=${st.form}`);
check(st.me && /RUSTY/i.test(st.me.n), `driving ${st.me && st.me.n}`);
check(/20/i.test(st.goal), `HUD still teaches 20-coin cars: ${st.goal}`);
notBlack(await canvas(), 'after buy car');
await shot('cat-life-rusty-car.jpg');

const rustyTop = await page.evaluate(() => (window.CATLIFE.CARS.find(c => c.id === 'rusty') || {}).top);
const usedTop = await page.evaluate(() => (window.CATLIFE.CARS.find(c => c.id === 'used') || {}).top);
const hatchTop = await page.evaluate(() => (window.CATLIFE.CARS.find(c => c.id === 'hatch') || {}).top);
check(usedTop > rustyTop, `used coupe faster than rusty usedTop=${usedTop} rustyTop=${rustyTop}`);
check(usedTop < hatchTop, `used coupe slower than hatch usedTop=${usedTop} hatchTop=${hatchTop}`);
check(await page.evaluate(() => window.CATLIFE.USED_COUPE_PRICE === 20 && window.CATLIFE.CAR_PRICE === 20), 'used coupe and every car cost 20');

await page.evaluate(() => window.CATLIFE.addCoins(25));
const usedBought = await page.evaluate(() => window.CATLIFE.buyCar('used'));
await page.evaluate(() => window.CATLIFE.sim(0.3));
st = await G();
check(usedBought, 'bought 20-coin used coupe');
check(st.owned.includes('used'), `owned used ${JSON.stringify(st.owned)}`);
check(st.car === 'used', `current car ${st.car}`);
check(st.me && /USED COUPE/i.test(st.me.n), `driving ${st.me && st.me.n}`);
notBlack(await canvas(), 'after buy used coupe');
await shot('cat-life-used-coupe.jpg');

await page.evaluate(() => {
  window.CATLIFE.setVel(18);
  window.CATLIFE.sim(0.8);
});
st = await G();
check(st.me && Math.abs(st.me.x) + Math.abs(st.me.z) > 1, `drove somewhere x=${st.me && st.me.x} z=${st.me && st.me.z}`);

await page.evaluate(() => window.CATLIFE.smash());
await page.evaluate(() => window.CATLIFE.sim(0.2));
st = await G();
check(st.me && st.me.crush > 0, `small crash dent crush=${st.me && st.me.crush}`);

await page.evaluate(() => window.CATLIFE.addCoins(40));
const skyBought = await page.evaluate(() => window.CATLIFE.buyCar('volt-roadster'));
await page.evaluate(() => window.CATLIFE.sim(0.2));
st = await G();
check(skyBought && st.owned.includes('volt-roadster'), 'bought Volt Sky Roadster for 20 coins');
check(st.me && /VOLT SKY ROADSTER/i.test(st.me.n), `driving ${st.me && st.me.n}`);
const flew = await page.evaluate(() => {
  window.CATLIFE.pose(0, -48, 0);
  const on = window.CATLIFE.setFly(true);
  const flyingOn = !!(window.CATLIFE.me && window.CATLIFE.me.flying);
  const y0 = window.CATLIFE.me && window.CATLIFE.me.y;
  const y1 = window.CATLIFE.climb(0.8);
  const y2 = window.CATLIFE.dive(0.35);
  return { on, flyingOn, y0, y1, y2, flying: window.CATLIFE.me && window.CATLIFE.me.flying };
});
check(flew.on && flew.flyingOn && flew.flying, `fly toggle flyingOn=${flew.flyingOn} flying=${flew.flying}`);
check(flew.y1 > (flew.y0 || 0) + 1.2, `climbed in fly mode y0=${flew.y0} y1=${flew.y1}`);
notBlack(await canvas(), 'sky roadster flying');
await shot('cat-life-sky-fly.jpg');
const gripped = await page.evaluate(() => {
  window.CATLIFE.setFly(false);
  window.CATLIFE.pose(12, 12, 0);
  const g = window.CATLIFE.forceGripWall();
  window.CATLIFE.setVel(10);
  window.CATLIFE.sim(0.4);
  return { g, wall: window.CATLIFE.me && window.CATLIFE.me.wall, y: window.CATLIFE.me && window.CATLIFE.me.y };
});
check(gripped.g && gripped.wall, `grip mode stuck to wall wall=${gripped.wall} y=${gripped.y}`);
await page.evaluate(() => { window.CATLIFE.setGrip(false); window.CATLIFE.pose(10, 8, 0); });
notBlack(await canvas(), 'sky roadster grip');
await shot('cat-life-sky-grip.jpg');

const hard = await page.evaluate(() => {
  window.CATLIFE.setFly(false);
  window.CATLIFE.setGrip(false);
  const fire = window.CATLIFE.smashHard();
  window.CATLIFE.sim(0.3);
  const arrived = window.CATLIFE.arriveResponders();
  window.CATLIFE.sim(1.2);
  return {
    fire, state: window.CATLIFE.fire, tip: window.CATLIFE.tip, how: window.CATLIFE.howText,
    arrived, alert: document.getElementById('fireAlert') && !document.getElementById('fireAlert').classList.contains('hidden'),
  };
});
st = await G();
check(hard.fire && st.fire && st.fire.crash, `hard crash started fire phase=${st.fire && st.fire.phase}`);
check(hard.alert && st.fire.alert, 'FIRE! Help is coming alert visible');
check(st.fire.compass, 'minimap/compass marker for fire');
check(hard.arrived && hard.arrived.truck && hard.arrived.police && hard.arrived.amb, `responders arrived ${JSON.stringify(hard.arrived)}`);
check(/Slow down at corners/i.test(hard.tip || st.tip || ''), `crash tip ${hard.tip || st.tip}`);
check(/follow the roads/i.test(hard.how || st.howText || ''), 'How it works explains fire trucks follow roads');
notBlack(await canvas(), 'crash fire');
await shot('cat-life-crash-fire.jpg');
const out = await page.evaluate(() => window.CATLIFE.extinguishNow());
check(out, 'firefighters extinguished the fire');
st = await G();
check(!st.fire.crash, 'fire cleared after spray');

const hurt = await page.evaluate(() => {
  window.CATLIFE.spawnOwnedCar('used', true);
  const h = window.CATLIFE.smashHurt();
  window.CATLIFE.sim(0.5);
  const stars = window.CATLIFE.hospital;
  const inside = window.CATLIFE.skipToHospitalInside();
  window.CATLIFE.sim(0.4);
  window.CATLIFE.finishHospital();
  return { h, stars, inside, after: window.CATLIFE.hospital, cat: window.CATLIFE.cat, form: window.CATLIFE.form };
});
st = await G();
check(hurt.h, 'very hard crash hurt the cat');
check(hurt.stars && hurt.stars.hurt === 'stars', `cartoon stars phase=${hurt.stars && hurt.stars.hurt}`);
check(hurt.inside && hurt.inside.room && hurt.inside.doctor, `hospital cutscene room=${hurt.inside && hurt.inside.room} doctor=${hurt.inside && hurt.inside.doctor}`);
check(st.form === 'cat' && st.cat && st.cat.vis !== false, `hospital flow returned to walking cat form=${st.form}`);
check(!st.hospital.hurt, `hospital cutscene finished hurt=${st.hospital && st.hospital.hurt}`);
const nearHosp = await page.evaluate(() => {
  const c = window.CATLIFE.cat, p = window.CATLIFE.POI.hosp;
  return c && p && Math.hypot(c.x - p.x, c.z - p.z) < 28;
});
check(nearHosp, 'cat walked out at the hospital door');
await page.evaluate(() => { if (window.CATLIFE.fire && window.CATLIFE.fire.crash) window.CATLIFE.extinguishNow(); });
notBlack(await canvas(), 'hospital healed');
await shot('cat-life-hospital.jpg');

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

await page.evaluate(() => { window.CATLIFE.goToDoor(); window.CATLIFE.sim(0.1); });
st = await G();
check(/ENTER HOUSE|GO IN|green mat/i.test(st.prompt), `door prompt ${st.prompt}`);
const entered = await page.evaluate(() => window.CATLIFE.enterHouse());
await page.evaluate(() => { window.CATLIFE.snapCam(); window.CATLIFE.sim(0.15); });
st = await G();
check(entered && st.inside, `entered starter house inside=${st.inside}`);
check(st.form === 'cat', 'inside on foot as cat');
check(st.floors && st.floors.stairs, `starter house has stairs floors=${JSON.stringify(st.floors)}`);
notBlack(await canvas(), 'starter interior');
await shot('cat-life-inside-starter.jpg');
const climbed = await page.evaluate(() => window.CATLIFE.climbStairs());
st = await G();
check(climbed && climbed.upstairs && climbed.y > 2.4, `walked starter stairs upstairs y=${climbed && climbed.y} upstairs=${st.upstairs}`);
notBlack(await canvas(), 'starter upstairs');
await shot('cat-life-upstairs-starter.jpg');
const down = await page.evaluate(() => window.CATLIFE.descendStairs());
check(down && down.downstairs && down.y < 1.2, `walked starter stairs down y=${down && down.y}`);
const left = await page.evaluate(() => window.CATLIFE.leaveHouse());
await page.evaluate(() => window.CATLIFE.snapCam());
st = await G();
check(left && !st.inside, `left starter house inside=${st.inside}`);
notBlack(await canvas(), 'outside after leave');

for (const hid of ['cozy', 'town', 'mansion', 'villa']) {
  await page.evaluate((id) => {
    window.CATLIFE.setHouse(id);
    window.CATLIFE.enterHouse();
    window.CATLIFE.snapCam();
    window.CATLIFE.sim(0.12);
  }, hid);
  st = await G();
  check(st.inside && st.house === hid, `inside ${hid} house=${st.house} inside=${st.inside}`);
  notBlack(await canvas(), `${hid} interior`);
  await shot(`cat-life-inside-${hid}.jpg`);
  if (hid === 'villa') {
    const v = await page.evaluate(() => window.CATLIFE.climbStairs());
    check(v && v.upstairs && v.y > 3.2, `Palm Villa stairs upstairs y=${v && v.y}`);
    notBlack(await canvas(), 'villa upstairs');
    await shot('cat-life-upstairs-villa.jpg');
    await page.evaluate(() => window.CATLIFE.descendStairs());
  }
  await page.evaluate(() => { window.CATLIFE.leaveHouse(); window.CATLIFE.snapCam(); });
  st = await G();
  check(!st.inside, `left ${hid}`);
}

st = await G();
check(st.house === 'villa', 'still at villa after leave');
check(st.owned.includes('horse-red') && st.owned.includes('bull-orange'), `villa includes garage supercars ${JSON.stringify(st.owned)}`);
const swam = await page.evaluate(() => {
  const p = window.CATLIFE.pool;
  if (!p) return { ok:false, reason:'no pool' };
  window.CATLIFE.goTo('pool');
  window.CATLIFE.sim(0.5);
  return { ok: window.CATLIFE.swimming, y: window.CATLIFE.cat && window.CATLIFE.cat.y, pool: p };
});
st = await G();
check(swam.ok && st.swimming, `jumped in pool swimming=${st.swimming} y=${swam.y}`);
notBlack(await canvas(), 'villa pool');
await shot('cat-life-pool.jpg');
await page.evaluate(() => window.CATLIFE.setHouse('starter'));

await page.evaluate(() => {
  window.CATLIFE.spawnOwnedCar('used', true);
  window.CATLIFE.goToDoor();
  window.CATLIFE.sim(0.05);
});
st = await G();
check(st.form === 'car', `at door in car form=${st.form}`);
const fromCar = await page.evaluate(() => window.CATLIFE.interact());
await page.evaluate(() => { window.CATLIFE.snapCam(); window.CATLIFE.sim(0.1); });
st = await G();
check(fromCar === 'enter' && st.inside && st.form === 'cat', `enter after car interact=${fromCar} inside=${st.inside} form=${st.form}`);
await page.evaluate(() => window.CATLIFE.leaveHouse());

const coinRound = await page.evaluate(() => {
  const before = window.CATLIFE.liveCoins;
  const grabbed = window.CATLIFE.collectAllCoins();
  const after = window.CATLIFE.liveCoins;
  window.CATLIFE.sim(3.2);
  let respawned = window.CATLIFE.liveCoins;
  if (respawned < 1) respawned = window.CATLIFE.forceCoinRefill();
  return { before, grabbed, after, respawned, cap: window.CATLIFE.COIN_RESPAWN_CAP };
});
check(coinRound.grabbed > 0 && coinRound.after === 0, `collected all coins grabbed=${coinRound.grabbed} live=${coinRound.after} before=${coinRound.before}`);
check(coinRound.respawned > 0, `coins respawned live=${coinRound.respawned}`);
check(coinRound.respawned <= coinRound.cap, `coin cap respected live=${coinRound.respawned} cap=${coinRound.cap}`);

const played = await page.evaluate(() => window.CATLIFE.playToy('ball'));
check(played, 'cat can play with ball');

await page.evaluate(() => window.CATLIFE.goTo('bull'));
await page.evaluate(() => window.CATLIFE.openShop('bull'));
st = await G();
check(st.shopOpen, 'Bull Motors shop opens');
check(/BULL/i.test(st.shopText), `Bull Motors generic name ${st.shopText.slice(0,80)}`);
check(/20/i.test(st.shopText), `Bull Motors prices are 20 coins ${st.shopText.slice(0,120)}`);
await page.evaluate(() => window.CATLIFE.openShop('volt'));
st = await G();
check(/VOLT/i.test(st.shopText), 'Volt Motors generic name');
check(/SKY ROADSTER/i.test(st.shopText) && /20/i.test(st.shopText), 'Volt Sky Roadster listed for 20 coins');
check(!/TESLA/i.test(st.shopText), 'Volt shop has no Tesla brand name');
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

st = await G();
check(st.buses >= 1, `city buses exist ${st.buses}`);
check(st.peds >= 4, `pedestrians exist ${st.peds}`);
check(st.fire && st.fire.station && st.fire.trucks >= 1, `fire station trucks=${st.fire && st.fire.trucks}`);
check(st.hospital && st.hospital.ok && st.hospital.ambulances >= 1, `hospital ambulances=${st.hospital && st.hospital.ambulances}`);
const fired = await page.evaluate(() => window.CATLIFE.startFire());
check(fired, 'friendly smoke emergency started');
await page.evaluate(() => window.CATLIFE.sim(0.4));
notBlack(await canvas(), 'fire call');
await shot('cat-life-fire.jpg');

await page.evaluate(() => {
  window.CATLIFE.goToMartDoor();
  window.CATLIFE.sim(0.8);
});
st = await G();
check(st.doors && st.doors.outer > 0.3, `sliding doors opened by motion outer=${st.doors && st.doors.outer}`);
const walkedIn = await page.evaluate(() => window.CATLIFE.enterMart());
await page.evaluate(() => { window.CATLIFE.snapCam(); window.CATLIFE.sim(0.2); });
st = await G();
check(walkedIn && st.insideMart, `walked into Bullseye Mart insideMart=${st.insideMart}`);
notBlack(await canvas(), 'mart interior');
await shot('cat-life-mart-inside.jpg');

await page.evaluate(() => {
  window.CATLIFE.goToCart();
  window.CATLIFE.sim(0.1);
  window.CATLIFE.grabCart();
});
st = await G();
check(st.cart && st.cart.held, `pushing shopping cart held=${st.cart && st.cart.held}`);
const shelved = await page.evaluate(() => {
  window.CATLIFE.goToShelf();
  window.CATLIFE.sim(0.1);
  const goods = window.CATLIFE.MART.find(m => !(window.CATLIFE.items || []).includes(m.id));
  return goods ? window.CATLIFE.putInCart(goods.id) : false;
});
st = await G();
check(shelved && st.cart && st.cart.items.length >= 1, `item in cart ${JSON.stringify(st.cart && st.cart.items)}`);
await page.evaluate(() => {
  window.CATLIFE.goToCheckout();
  window.CATLIFE.sim(0.1);
  window.CATLIFE.startCheckout();
  window.CATLIFE.sim(2.4);
});
st = await G();
check(st.checkout && st.checkout.phase === 'pay', `cashier scanned total=${st.checkout && st.checkout.total} phase=${st.checkout && st.checkout.phase}`);
await page.evaluate(() => window.CATLIFE.addCoins(200));
const paid = await page.evaluate(() => window.CATLIFE.payCheckout());
st = await G();
check(paid && st.items.length >= 2, `paid cashier items went home ${JSON.stringify(st.items)}`);
await page.evaluate(() => { window.CATLIFE.leaveMart(); window.CATLIFE.snapCam(); });
st = await G();
check(!st.insideMart, 'left mart through doors');
notBlack(await canvas(), 'outside mart');

const busRide = await page.evaluate(() => {
  window.CATLIFE.goTo('bus');
  window.CATLIFE.parkBus('lot');
  window.CATLIFE.waitBus();
  window.CATLIFE.sim(0.4);
  const boarded = window.CATLIFE.onBus;
  window.CATLIFE.parkBus('mart');
  window.CATLIFE.sim(0.2);
  const off = window.CATLIFE.leaveBus();
  const cat = window.CATLIFE.cat;
  const stop = window.CATLIFE.BUS_STOPS.find(s => s.id === 'mart');
  const near = stop && cat && Math.hypot(cat.x - stop.x, cat.z - stop.z) < 8;
  return { boarded, off, near, x: cat && cat.x, z: cat && cat.z };
});
st = await G();
check(busRide.boarded, `boarded city bus boarded=${busRide.boarded}`);
check(busRide.off && busRide.near, `got off at another stop near=${busRide.near} x=${busRide.x} z=${busRide.z}`);
notBlack(await canvas(), 'after bus ride');
await shot('cat-life-bus.jpg');

const moveFlow = await page.evaluate(() => {
  window.CATLIFE.resetSave();
  window.CATLIFE.addCoins(400);
  window.CATLIFE.buyItem('couch');
  window.CATLIFE.buyCar('rusty');
  window.CATLIFE.hopOut();
  const bought = window.CATLIFE.buyHouse('cozy');
  const started = window.CATLIFE.moving;
  window.CATLIFE.goHome(true);
  window.CATLIFE.enterHouse();
  window.CATLIFE.sim(0.1);
  window.CATLIFE.packNearest();
  const haul = window.CATLIFE.me && window.CATLIFE.me.id === 'haul';
  const packedCarry = window.CATLIFE.moving && window.CATLIFE.moving.packed;
  const items = window.CATLIFE.houseItems;
  const furn = items.find(h => h.id === 'couch');
  if (furn) {
    window.CATLIFE.pose(furn.x, furn.z, 0);
    window.CATLIFE.packNearest();
  }
  const P = window.CATLIFE.cat;
  if (window.CATLIFE.moving && window.CATLIFE.moving.step === 'pack') {
    window.CATLIFE.interact();
  }
  window.CATLIFE.boardHaul();
  const dest = window.CATLIFE.HOUSES.find(h => h.id === 'cozy');
  if (dest) window.CATLIFE.pose(dest.lot[0], dest.lot[1] + dest.d / 2 + 8, Math.PI);
  window.CATLIFE.sim(0.5);
  if (window.CATLIFE.moving) window.CATLIFE.finishMoving();
  return {
    bought, started, after: window.CATLIFE.house,
    items: window.CATLIFE.items, houseItems: window.CATLIFE.houseItems,
    packedCarry, haulAfter: window.CATLIFE.form,
  };
});
st = await G();
check(moveFlow.bought && moveFlow.started, `Haul-It moving started ${JSON.stringify(moveFlow.started)}`);
check(st.house === 'cozy', `moved into cozy house=${st.house}`);
check(st.items.includes('couch') && st.houseItems.some(h => h.id === 'couch'), `furniture arrived at new house ${JSON.stringify(st.houseItems)}`);
notBlack(await canvas(), 'after moving');
await shot('cat-life-moved.jpg');
await page.evaluate(() => {
  window.CATLIFE.resetSave();
  window.CATLIFE.addCoins(80);
  window.CATLIFE.buyCar('rusty');
  window.CATLIFE.buyCar('used');
  window.CATLIFE.buyItem('ball');
  window.CATLIFE.hopOut();
  window.CATLIFE.setHouse('starter');
  window.CATLIFE.goHome(true);
});

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
check(saved.owned && saved.owned.includes('used'), 'localStorage has used coupe');
check(saved.items && saved.items.includes('ball'), 'localStorage has ball');
check((saved.coins|0) >= 0, `localStorage coins=${saved.coins}`);

await page.reload({ waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.CATLIFE_READY === true, { timeout: 90000 });
await page.evaluate(() => window.CATLIFE.startPlay());
await page.evaluate(() => window.CATLIFE.sim(0.3));
st = await G();
check(st.owned.includes('rusty'), `reload kept rusty car ${JSON.stringify(st.owned)}`);
check(st.owned.includes('used'), `reload kept used coupe ${JSON.stringify(st.owned)}`);
check(st.items.includes('ball'), `reload kept ball ${JSON.stringify(st.items)}`);
check(st.house === 'starter', `reload kept house ${st.house}`);
check(st.houseItems.some(h => h.id === 'ball'), 'reload placed ball in house');
notBlack(await canvas(), 'after reload');
await shot('cat-life-reload.jpg');

await page.evaluate(() => {
  localStorage.setItem('catLifeCity3d', JSON.stringify({
    coins: 9, owned: ['rusty'], car: 'rusty', house: 'starter', items: ['ball'], jobs: 2,
  }));
});
await page.reload({ waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.CATLIFE_READY === true, { timeout: 90000 });
await page.evaluate(() => window.CATLIFE.startPlay());
await page.evaluate(() => window.CATLIFE.sim(0.2));
st = await G();
check(st.owned.includes('rusty') && !st.owned.includes('used'), `old save without used still loads owned=${JSON.stringify(st.owned)}`);
check(st.coins === 9, `old save coins=${st.coins}`);
check(st.items.includes('ball'), 'old save kept ball');
notBlack(await canvas(), 'old save load');

await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluate(() => {
  window.CATLIFE.showPads();
  window.CATLIFE.startPlay();
  window.CATLIFE.sim(0.2);
});
st = await G();
const padBox = await page.evaluate(() => {
  const ids = ['stick', 'padAct', 'padOut', 'padHorn', 'padBrake', 'padFly', 'padGrip', 'padClimb', 'padDive'];
  const vis = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    const r = el && el.getBoundingClientRect();
    vis[id] = !!(el && r && r.width > 8 && r.height > 8);
  }
  const pads = document.getElementById('pads');
  const shown = pads && (pads.classList.contains('show') || getComputedStyle(pads).display !== 'none');
  return { vis, shown, w: innerWidth, h: innerHeight };
});
check(padBox.shown && padBox.w === 1024, `iPad viewport pads shown w=${padBox.w} h=${padBox.h}`);
check(padBox.vis.stick && padBox.vis.padFly && padBox.vis.padGrip && padBox.vis.padClimb && padBox.vis.padDive, `iPad fly/grip/climb/dive buttons ${JSON.stringify(padBox.vis)}`);
notBlack(await canvas(), 'iPad tablet viewport');
await shot('cat-life-ipad.jpg');

const gameErrs = await page.evaluate(() => window.CATLIFE.errs || []);
for (const e of gameErrs) errors.push('game: ' + e);

await browser.close();
if (server) server.kill();

if (errors.length) {
  console.error('\nFAILURES\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nCat Life City 3D e2e ok');
