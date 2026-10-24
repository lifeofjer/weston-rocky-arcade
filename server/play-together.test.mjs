// Two fake clients join one room and exchange state + chat.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { WebSocket } from 'ws';

const PORT = 8765;
const child = spawn(process.execPath, ['server/index.mjs'], {
  env: { ...process.env, PORT: String(PORT), ARCADE_BUILD: 'test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
child.stdout.on('data', d => { out += d; process.stdout.write(d); });
child.stderr.on('data', d => process.stderr.write(d));

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

try {
  let ready = false;
  for(let i=0;i<20;i++){ if(out.includes('listening')){ ready = true; break; } await sleep(100); }
  if(!ready) throw new Error('server did not start');

  const health = await fetch(`http://127.0.0.1:${PORT}/api/play/health`).then(r=>r.json());
  if(!health.ok) throw new Error('health failed');

  const html = await fetch(`http://127.0.0.1:${PORT}/games/rail-city-3d.html`).then(r=>r.text());
  if(!html.includes('PLAY TOGETHER') || !html.includes('tabby-cat')) throw new Error('rail city page missing new features');

  const a = new WebSocket(`ws://127.0.0.1:${PORT}/play`);
  await new Promise((res,rej)=>{ a.on('open', res); a.on('error', rej); });
  a.send(JSON.stringify({ t:'hello', game:'rail-city-3d', name:'Weston' }));
  await once(a, 'welcome');
  a.send(JSON.stringify({ t:'create', game:'rail-city-3d', name:'Weston' }));
  const created = await once(a, 'created');
  if(!created.code) throw new Error('no room code');

  const b = new WebSocket(`ws://127.0.0.1:${PORT}/play`);
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

  const page = await fetch(`http://127.0.0.1:${PORT}/index.html`).then(r=>r.text());
  if(!page.includes('rail-city-3d.html?v=')) throw new Error('arcade card not cache-busted');

  a.close(); b.close();
  console.log('play-together ok code='+created.code);
  child.kill('SIGTERM');
  process.exit(0);
} catch (err) {
  console.error(err);
  child.kill('SIGTERM');
  process.exit(1);
}
