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
    env: { ...process.env, PORT: String(PORT), ARCADE_BUILD: 'play6' },
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
  if(health.build !== 'play6' && !external) throw new Error('expected play6 build header via health, got '+health.build);

  const html = await fetch(`${origin}/games/rail-city-3d.html`).then(r=>r.text());
  if(!html.includes('PLAY TOGETHER') || !html.includes('tabby-cat')) throw new Error('rail city page missing new features');
  if(!html.includes('gmTag') || !html.includes('gmDerail') || !html.includes('gameHud')) throw new Error('mini-game UI missing');
  if(!html.includes('play6')) throw new Error('html not on play6');
  if(!html.includes('addRamp') || !html.includes('groundY') || !html.includes('packTrain')) throw new Error('ramps / shared world helpers missing');
  if(!html.includes('TBOX') || !html.includes('TBLOB') || !html.includes('InstancedMesh')) throw new Error('instanced traffic missing');
  if(!html.includes('tickQuality') || !html.includes('applyQuality')) throw new Error('quality scaler missing');
  if(!html.includes('COLC') || !html.includes('collideNear')) throw new Error('spatial collide missing');
  if(!html.includes('if(!host && e!==me)') && !html.includes('if(!simHost())')) throw new Error('guest local hits missing');
  if(!html.includes("ev.code==='KeyF'")) throw new Error('FPS key missing');

  const hdr = await fetch(`${origin}/games/rail-city-3d.html`);
  const buildHdr = hdr.headers.get('x-arcade-build');
  if(buildHdr !== 'play6') throw new Error('X-Arcade-Build is '+buildHdr+' not play6');

  const kitSrc = fs.readFileSync(path.join(root, 'games/rail-city-kit.js'), 'utf8');
  if(!kitSrc.includes('sendWorld') || !kitSrc.includes('onWorld')) throw new Error('kit missing world snapshot API');
  if(!kitSrc.includes('victimPid')) throw new Error('kit missing guest hit victimPid');

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
  if(!page.includes('rail-city-3d.html?v=play6')) throw new Error('arcade card not cache-busted to play6');
  const rootPage = await fetch(`${origin}/`);
  if(rootPage.status !== 200) throw new Error('root not 200');

  // Host leave: guest becomes host and gets a reset so both screens match.
  const hostP = once(b, 'host');
  a.close();
  const hostMsg = await hostP;
  if(!hostMsg.reset || !hostMsg.id) throw new Error('host leave did not migrate with reset');

  b.close();
  console.log('play-together ok code='+created.code+' crash A->B host='+(external?'docker':'node')+' build=play6');
  stop();
  process.exit(0);
} catch (err) {
  console.error(err);
  stop();
  process.exit(1);
}
