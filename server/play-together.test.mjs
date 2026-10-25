// Two fake clients join one room and exchange state + chat.
// Set ARCADE_EXTERNAL=1 to test an already-running host (e.g. the production Docker image).
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { WebSocket } from 'ws';

const PORT = Number(process.env.PORT) || 8765;
const HOST = process.env.ARCADE_HOST || '127.0.0.1';
const external = process.env.ARCADE_EXTERNAL === '1';
const origin = `http://${HOST}:${PORT}`;

let child = null;
let out = '';
if(!external){
  child = spawn(process.execPath, ['server/index.mjs'], {
    env: { ...process.env, PORT: String(PORT), ARCADE_BUILD: 'test' },
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

  const html = await fetch(`${origin}/games/rail-city-3d.html`).then(r=>r.text());
  if(!html.includes('PLAY TOGETHER') || !html.includes('tabby-cat')) throw new Error('rail city page missing new features');

  const a = new WebSocket(`ws://${HOST}:${PORT}/play`);
  await new Promise((res,rej)=>{ a.on('open', res); a.on('error', rej); });
  a.send(JSON.stringify({ t:'hello', game:'rail-city-3d', name:'Weston' }));
  await once(a, 'welcome');
  a.send(JSON.stringify({ t:'create', game:'rail-city-3d', name:'Weston' }));
  const created = await once(a, 'created');
  if(!created.code) throw new Error('no room code');

  const b = new WebSocket(`ws://${HOST}:${PORT}/play`);
  await new Promise((res,rej)=>{ b.on('open', res); b.on('error', rej); });
  b.send(JSON.stringify({ t:'hello', game:'rail-city-3d', name:'Dad' }));
  await once(b, 'welcome');
  const joinedP = once(b, 'joined');
  const peerP = once(a, 'peer');
  b.send(JSON.stringify({ t:'join', code: created.code, game:'rail-city-3d', name:'Dad' }));
  const joined = await joinedP;
  if(joined.code !== created.code) throw new Error('join mismatch');
  await peerP;

  const chatP = once(b, 'chat');
  a.send(JSON.stringify({ t:'chat', text:'vroom!' }));
  const chat = await chatP;
  if(chat.text !== 'vroom!') throw new Error('chat mismatch');

  const stateP = once(b, 'peer');
  a.send(JSON.stringify({ t:'state', data:{ x:10, z:20, yaw:1, ci:0, name:'Weston' } }));
  const peer = await stateP;
  if(peer.peer.data.x !== 10) throw new Error('state mismatch');

  const page = await fetch(`${origin}/index.html`).then(r=>r.text());
  if(!page.includes('rail-city-3d.html?v=')) throw new Error('arcade card not cache-busted');
  const root = await fetch(`${origin}/`);
  if(root.status !== 200) throw new Error('root not 200');

  a.close(); b.close();
  console.log('play-together ok code='+created.code+' host='+(external?'docker':'node'));
  stop();
  process.exit(0);
} catch (err) {
  console.error(err);
  stop();
  process.exit(1);
}
