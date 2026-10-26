// Two fake clients join one room and exchange state + chat + host world snapshots.
// A crash on A must show on B. Host leave must hand off with reset.
// Set ARCADE_EXTERNAL=1 to test an already-running host (e.g. the production Docker image).
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { WebSocket } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT) || 8765;
const HOST = process.env.ARCADE_HOST || '127.0.0.1';
const external = process.env.ARCADE_EXTERNAL === '1';
const origin = `http://${HOST}:${PORT}`;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let child = null;
let out = '';
if(!external){
  child = spawn(process.execPath, ['server/index.mjs'], {
    env: { ...process.env, PORT: String(PORT), ARCADE_BUILD: 'play9' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', d => { out += d; process.stdout.write(d); });
  child.stderr.on('data', d => process.stderr.write(d));
}

function once(ws, type, ms=2000){
  return new Promise((resolve, reject)=>{
    const t = setTimeout(()=>reject(new Error('timeout waiting for '+type)), ms);
    const on = ev=>{
      const msg = JSON.parse(ev.data);
      if(msg.t === type){ clearTimeout(t); ws.removeEventListener('message', on); resolve(msg); }
    };
    ws.addEventListener('message', on);
  });
}

function stop(){
  if(child) try { child.kill('SIGTERM'); } catch {}
}

try {
  if(!external){
    let ready = false;
    for(let i=0;i<20;i++){ if(out.includes('listening')){ ready = true; break; } await sleep(100); }
    if(!ready) throw new Error('server did not start');
  } else {
    let ready = false;
    for(let i=0;i<40;i++){
      try {
        const r = await fetch(`${origin}/healthz`);
        if(r.ok){ ready = true; break; }
      } catch {}
      await sleep(250);
    }
    if(!ready) throw new Error('external arcade did not become healthy');
  }

  const health = await fetch(`${origin}/api/play/health`).then(r=>r.json());
  if(!health.ok) throw new Error('health failed');
  if(health.build !== 'play9' && !external) throw new Error('expected play9 build header via health, got '+health.build);

  const html = await fetch(`${origin}/games/rail-city-3d.html`).then(r=>r.text());
  if(!html.includes('PLAY TOGETHER') || !html.includes('tabby-cat')) throw new Error('rail city page missing new features');
  if(!html.includes('gmTag') || !html.includes('gmDerail') || !html.includes('gameHud')) throw new Error('mini-game UI missing');
  if(!html.includes('play9')) throw new Error('html not on play9');
  if(!html.includes('2015 RAM POWER WAGON') && !html.includes('arcade-cars.js')) throw new Error('rail city missing shared Ram roster');
  if(!html.includes('addRamp') || !html.includes('groundY') || !html.includes('packTrain')) throw new Error('ramps / shared world helpers missing');
  if(!html.includes('buildLodKit') || !html.includes('showDetail') || !html.includes('TBLOB') || !html.includes('InstancedMesh')) throw new Error('per-type car LOD missing');
  if(!html.includes('classifyLod') || !html.includes('prepLodGeo') || !html.includes('instanceColor')) throw new Error('per-type part kits missing');
  if(!html.includes('nearR') || !html.includes('detailCap')) throw new Error('near LOD radius missing');
  if(!html.includes('tickQuality') || !html.includes('applyQuality')) throw new Error('quality scaler missing');
  if(!html.includes('COLC') || !html.includes('collideNear')) throw new Error('spatial collide missing');
  if(!html.includes('if(!host && e!==me)') && !html.includes('if(!simHost())')) throw new Error('guest local hits missing');
  if(!html.includes("ev.code==='KeyF'")) throw new Error('FPS key missing');

  const hdr = await fetch(`${origin}/games/rail-city-3d.html`);
  const buildHdr = hdr.headers.get('x-arcade-build');
  if(buildHdr !== 'play9') throw new Error('X-Arcade-Build is '+buildHdr+' not play9');

  const crash = await fetch(`${origin}/games/crash-test-3d.html`).then(r=>r.text());
  if(!crash.includes('PLAY TOGETHER') || !crash.includes('tabby-cat')) throw new Error('crash test missing play-together / cat');
  if(!crash.includes('tickQuality') || !crash.includes('applyQuality')) throw new Error('crash test quality scaler missing');
  if(!crash.includes("ev.code==='KeyF'")) throw new Error('crash test FPS key missing');
  if(!crash.includes('InstancedMesh') || !crash.includes('class Pool')) throw new Error('crash test instanced pools missing');
  if(!crash.includes('2015 RAM POWER WAGON') && !crash.includes('POWER WAGON')) throw new Error('crash test missing Power Wagon');
  if(!crash.includes('RAM 3500 DUALLY') && !crash.includes('dually')) throw new Error('crash test missing Ram 3500 dually');
  if(!crash.includes('makeDummy') || !crash.includes('gash') || !crash.includes('CRASH REPORT')) throw new Error('crash test missing dummies / gash / report');
  if(!crash.includes('HEAD-ON') || !crash.includes('SPIKES') || !crash.includes('FREE DRIVE')) throw new Error('crash test modes missing');
  if(!crash.includes('play9')) throw new Error('crash test html not on play9');
  if(!crash.includes('createVehicleSystem') || !crash.includes('wreckDeform') || !crash.includes('WRECK_HEAVY')) throw new Error('crash test missing shared Rail City builder / heavy wreck');
  if(crash.includes('buildBlockyVehicle')) throw new Error('crash test still uses blocky cars');
  if(!crash.includes('function rideOver') || !crash.includes('chassisY') || !crash.includes('roofTo')) throw new Error('crash test missing height-aware ride-over crush');
  if(!crash.includes('const HANG') || !crash.includes('TRACKX') || !crash.includes('Indoor crash hangar')) throw new Error('crash test missing indoor hangar / through-track');
  if(!crash.includes('tWedge') || !crash.includes("kind==='wedge'") || !crash.includes('split:')) throw new Error('crash test missing B-2 wedge target');
  if(!crash.includes('tTrailer') || !crash.includes("kind==='icc'") || !crash.includes('trailerSide') || !crash.includes('under')) throw new Error('crash test missing trailer ICC / side underride');
  if(!crash.includes('tDiesel') || !crash.includes('tFront') || !crash.includes('buildLoco') || !crash.includes('buildFrontRunnerLoco') || !crash.includes('assembleTrain')) throw new Error('crash test missing diesel / FrontRunner trains');
  if(!crash.includes('kickImpact') || !crash.includes('stepPitch') || !crash.includes('popHood') || !crash.includes('roofLand')) throw new Error('crash test missing rear-kick / hood / rollover');
  if(!crash.includes("kind==='train'")) throw new Error('crash test missing train plow exception');
  const crashHdr = await fetch(`${origin}/games/crash-test-3d.html`);
  if(crashHdr.headers.get('x-arcade-build') !== 'play9') throw new Error('crash test X-Arcade-Build not play9');

  const cars = fs.readFileSync(path.join(root, 'games/arcade-cars.js'), 'utf8');
  if(!cars.includes('2015 RAM POWER WAGON') || !cars.includes('powerWagon') || !cars.includes('dually')) throw new Error('arcade-cars missing Ram trucks');
  if(!cars.includes('makeRamHead') || !cars.includes('powerWagonDecal') || !cars.includes('winch')) throw new Error('arcade-cars missing Power Wagon details');
  if(!cars.includes('createVehicleSystem') || !cars.includes('sideExtrude') || !cars.includes('wreckDeform')) throw new Error('arcade-cars missing shared Rail City builder / wreck');
  if(!cars.includes('roofTo') || !cars.includes('hoodTo') || !cars.includes('split>0')) throw new Error('wreckDeform missing height crush / split');
  if(!cars.includes('buildLoco') || !cars.includes('buildFrontRunnerLoco') || !cars.includes('buildBilevel') || !cars.includes('part:\'hood\'')) throw new Error('arcade-cars missing shared trains / hood');
  if(cars.includes('buildBlockyVehicle')) throw new Error('blocky vehicle builder should be gone');
  if(!html.includes('buildLoco') || !html.includes('buildRailCar')) throw new Error('rail city not using shared train kit');
  if(!html.includes('createVehicleSystem')) throw new Error('rail city not using shared vehicle kit');
  const ctKit = fs.readFileSync(path.join(root, 'games/crash-test-kit.js'), 'utf8');
  if(!ctKit.includes('crash-test-3d') || !ctKit.includes('sendWorld') || !ctKit.includes('noteCrash')) throw new Error('crash-test kit missing host world / crash seed');
  if(!ctKit.includes('arcadeWhenReady')) throw new Error('crash-test kit must wait for age YES before joining ?room=');

  const kitSrc = fs.readFileSync(path.join(root, 'games/rail-city-kit.js'), 'utf8');
  if(!kitSrc.includes('sendWorld') || !kitSrc.includes('onWorld')) throw new Error('kit missing world snapshot API');
  if(!kitSrc.includes('victimPid')) throw new Error('kit missing guest hit victimPid');
  if(!kitSrc.includes('arcadeWhenReady')) throw new Error('rail-city kit must wait for age YES before joining ?room=');

  const a = new WebSocket(`ws://${HOST}:${PORT}/play`);
  await new Promise((res,rej)=>{ a.on('open', res); a.on('error', rej); });
  a.send(JSON.stringify({ t:'hello', game:'rail-city-3d', name:'Weston' }));
  await once(a, 'welcome');
  a.send(JSON.stringify({ t:'create', game:'rail-city-3d', name:'Weston' }));
  const created = await once(a, 'created');
  if(!created.code) throw new Error('no room code');
  if(!created.host) throw new Error('created missing host');

  const b = new WebSocket(`ws://${HOST}:${PORT}/play`);
  await new Promise((res,rej)=>{ b.on('open', res); b.on('error', rej); });
  b.send(JSON.stringify({ t:'hello', game:'rail-city-3d', name:'Dad' }));
  await once(b, 'welcome');
  const joinedP = once(b, 'joined');
  const peerP = once(a, 'peer');
  b.send(JSON.stringify({ t:'join', code: created.code, game:'rail-city-3d', name:'Dad' }));
  const joined = await joinedP;
  if(joined.code !== created.code) throw new Error('join mismatch');
  if(joined.host !== created.host) throw new Error('guest host mismatch');
  await peerP;

  const chatP = once(b, 'chat');
  a.send(JSON.stringify({ t:'chat', text:'vroom!' }));
  const chat = await chatP;
  if(chat.text !== 'vroom!') throw new Error('chat mismatch');

  const stateP = once(b, 'peer');
  a.send(JSON.stringify({ t:'state', data:{ x:10, z:20, yaw:1, ci:0, name:'Weston' } }));
  const peer = await stateP;
  if(peer.peer.data.x !== 10) throw new Error('state mismatch');

  // Crash on A (host world snapshot) must show on B.
  const wreck = { n:1, px:12, py:1, pz:22, dx:1, dy:0, dz:0, sev:0.9, seed:4242 };
  const worldP = once(b, 'world');
  a.send(JSON.stringify({ t:'world', world:{
    seq:1, game:{ mode:'free', it:'', scores:{}, t:0, winner:'' },
    train:{ s:20, v:24, derailed:false, lastHitter:'', cars:[] },
    cars:[{ i:7, ci:0, m:'wreck', x:12, y:1, z:22, yaw:0, fwd:0, crush:0.82, hits:2, fire:4, pid:'', w:wreck }],
  }}));
  const world = await worldP;
  const crashed = world.world && world.world.cars && world.world.cars[0];
  if(!crashed || crashed.crush !== 0.82 || !crashed.w || crashed.w.seed !== 4242){
    throw new Error('crash on A did not show on B');
  }

  // Guest collision event is relayed to the host.
  const evP = once(a, 'event');
  b.send(JSON.stringify({ t:'event', ev:{ kind:'hit', sid:7, sev:0.5, seed:7, px:1, py:1, pz:1, dx:1, dy:0, dz:0 } }));
  const ev = await evP;
  if(!ev.ev || ev.ev.kind !== 'hit' || ev.ev.sid !== 7) throw new Error('guest hit not relayed to host');

  // Guest cannot publish world snapshots.
  let guestWorld = false;
  const sneak = ev=>{ const msg=JSON.parse(ev.data); if(msg.t==='world') guestWorld=true; };
  a.addEventListener('message', sneak);
  b.send(JSON.stringify({ t:'world', world:{ seq:99, cars:[] } }));
  await sleep(80);
  a.removeEventListener('message', sneak);
  if(guestWorld) throw new Error('guest world snapshot was relayed');

  const page = await fetch(`${origin}/index.html`).then(r=>r.text());
  if(!page.includes('rail-city-3d.html?v=play9')) throw new Error('arcade card not cache-busted to play9');
  if(!page.includes('crash-test-3d.html?v=play9')) throw new Error('crash test arcade card missing');
  if(!page.includes('og:image') || !page.includes('https://westonandrockysarcade.com/og-image.png')) throw new Error('index missing arcade OG image');
  if(!page.includes('rel="canonical"') || !page.includes('twitter:card')) throw new Error('index missing canonical/twitter card');
  if(!page.includes('/favicon.svg') || !page.includes('/site.webmanifest')) throw new Error('index missing favicon links');
  if(!page.includes('og:site_name') || !page.includes('og:url" content="https://westonandrockysarcade.com/')) throw new Error('index missing site_name or absolute og:url');
  if(!page.includes('Rated 6+') || !page.includes('/shared/age-rating.js')) throw new Error('index missing 6+ rating snippet');
  const rootPage = await fetch(`${origin}/`);
  if(rootPage.status !== 200) throw new Error('root not 200');

  async function expectType(urlPath, status, type){
    const r = await fetch(`${origin}${urlPath}`);
    const ct = r.headers.get('content-type') || '';
    if(r.status !== status) throw new Error(urlPath+' status '+r.status);
    if(!ct.includes(type)) throw new Error(urlPath+' type '+ct+' expected '+type);
  }
  await expectType('/favicon.ico', 200, 'image/');
  await expectType('/favicon.svg', 200, 'image/svg+xml');
  await expectType('/apple-touch-icon.png', 200, 'image/png');
  await expectType('/icon-192.png', 200, 'image/png');
  await expectType('/icon-512.png', 200, 'image/png');
  await expectType('/og-image.png', 200, 'image/png');
  await expectType('/site.webmanifest', 200, 'application/manifest+json');
  await expectType('/og/rail-city-3d.jpg', 200, 'image/jpeg');
  await expectType('/og/crash-test-3d.jpg', 200, 'image/jpeg');
  await expectType('/shared/age-rating.js', 200, 'javascript');
  const rail = await fetch(`${origin}/games/rail-city-3d.html`).then(r=>r.text());
  if(!rail.includes('og/rail-city-3d.jpg') || !rail.includes('og:title')) throw new Error('rail city missing per-game OG');
  if(!rail.includes('Rail City 3D · Weston') || !rail.includes('og:site_name')) throw new Error('rail city missing branded og:title');
  if(!rail.includes('Join the room and play together')) throw new Error('rail city missing play-together description');
  const ctPage = await fetch(`${origin}/games/crash-test-3d.html`).then(r=>r.text());
  if(!ctPage.includes('og/crash-test-3d.jpg') || !ctPage.includes('og:title')) throw new Error('crash test missing per-game OG');
  if(!ctPage.includes('/favicon.ico')) throw new Error('crash test missing favicon link');
  if(!ctPage.includes('Crash Test 3D · Weston') || !ctPage.includes('twitter:title')) throw new Error('crash test missing branded share title');
  if(!ctPage.includes('og:url" content="https://westonandrockysarcade.com/games/crash-test-3d.html"')) throw new Error('crash test og:url must be absolute arcade domain');
  if(!ctPage.includes('/shared/age-rating.js') || !ctPage.includes('Rated 6+')) throw new Error('crash test missing 6+ age snippet');
  const ageJs = await fetch(`${origin}/shared/age-rating.js`).then(r=>r.text());
  if(!ageJs.includes('ARE YOU 6 OR OLDER') || !ageJs.includes('Come back when you\'re 6') || !ageJs.includes('arcadeAge6plus')) {
    throw new Error('age-rating snippet missing dialog or localStorage key');
  }

  // Host leave: guest becomes host and gets a reset so both screens match.
  const hostP = once(b, 'host');
  a.close();
  const hostMsg = await hostP;
  if(!hostMsg.reset || !hostMsg.id) throw new Error('host leave did not migrate with reset');

  b.close();
  // Crash Test rooms are a separate game key.
  const c = new WebSocket(`ws://${HOST}:${PORT}/play`);
  await new Promise((res,rej)=>{ c.on('open', res); c.on('error', rej); });
  c.send(JSON.stringify({ t:'hello', game:'crash-test-3d', name:'Weston' }));
  await once(c, 'welcome');
  c.send(JSON.stringify({ t:'create', game:'crash-test-3d', name:'Weston' }));
  const createdCT = await once(c, 'created');
  if(!createdCT.code) throw new Error('crash-test room missing code');
  const d = new WebSocket(`ws://${HOST}:${PORT}/play`);
  await new Promise((res,rej)=>{ d.on('open', res); d.on('error', rej); });
  d.send(JSON.stringify({ t:'hello', game:'crash-test-3d', name:'Dad' }));
  await once(d, 'welcome');
  const ctJoinP = once(d, 'joined');
  d.send(JSON.stringify({ t:'join', code: createdCT.code, game:'crash-test-3d', name:'Dad' }));
  const ctJoined = await ctJoinP;
  if(ctJoined.code !== createdCT.code) throw new Error('crash-test join mismatch');
  const ctWorldP = once(d, 'world');
  c.send(JSON.stringify({ t:'world', world:{ seq:1, cars:[{ i:1, ci:0, m:'wreck', crush:0.9, w:{ seed:99, sev:0.8 } }], test:{ mode:'head' } } }));
  const ctWorld = await ctWorldP;
  if(!ctWorld.world || !ctWorld.world.cars || ctWorld.world.cars[0].w.seed !== 99) throw new Error('crash-test wreck seed did not sync');
  c.close(); d.close();

  console.log('play-together ok code='+created.code+' crash A->B host='+(external?'docker':'node')+' build=play9 ct='+createdCT.code);
  stop();
  process.exit(0);
} catch (err) {
  console.error(err);
  stop();
  process.exit(1);
}
