// Arcade host: static files + reusable play-together WebSocket rooms.
// Other games can join later with { t:'hello', game:'<name>' }. Only Rail City 3D is wired today.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const BUILD = process.env.ARCADE_BUILD || 'play7';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const NO_STORE = 'no-cache, no-store, must-revalidate';
const SAFE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff2', '.map']);

function safeJoin(root, urlPath){
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0].split('#')[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, clean);
  if(!full.startsWith(root)) return null;
  return full;
}

function send(res, status, body, headers={}){
  res.writeHead(status, { 'Cache-Control': NO_STORE, ...headers });
  res.end(body);
}

function serveFile(req, res, file){
  const ext = path.extname(file).toLowerCase();
  if(!SAFE.has(ext) && !file.includes(`${path.sep}node_modules${path.sep}three${path.sep}`)){
    return send(res, 404, 'not found');
  }
  fs.stat(file, (err, st)=>{
    if(err || !st.isFile()) return send(res, 404, 'not found');
    const mime = MIME[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': isHtml ? NO_STORE : 'public, max-age=60, must-revalidate',
      'X-Arcade-Build': BUILD,
    });
    fs.createReadStream(file).pipe(res);
  });
}

const rooms = new Map(); // code -> { game, clients: Map<id, client>, chat: [], idle: null }
let nextId = 1;

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const WORDS = ['WEST','ROCK','CATS','LION','ZOOM','VROOM','TESL','LAMB','FERR','CHOO','DASH','RACE','PURR','MEOW','DINO','BEAR','WOLF','FROG','DUCK','STAR'];

function makeCode(){
  for(let i=0;i<WORDS.length;i++){
    const w = WORDS[(Math.random()*WORDS.length)|0];
    if(!rooms.has(w)) return w;
  }
  for(let n=0;n<80;n++){
    let c=''; for(let i=0;i<4;i++) c += LETTERS[(Math.random()*LETTERS.length)|0];
    if(!rooms.has(c)) return c;
  }
  return 'R' + String(nextId).padStart(3,'0');
}

function publicPeer(c){
  return { id:c.id, name:c.name, game:c.game, data:c.data };
}

function roomPeers(room){
  return [...room.clients.values()].map(publicPeer);
}

function sendJSON(ws, obj){
  if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function broadcast(room, obj, except){
  const raw = JSON.stringify(obj);
  for(const c of room.clients.values()){
    if(c === except) continue;
    if(c.ws.readyState === WebSocket.OPEN) c.ws.send(raw);
  }
}

function leaveRoom(client){
  const room = client.room;
  if(!room) return;
  const wasHost = room.hostId === client.id;
  room.clients.delete(client.id);
  client.room = null;
  broadcast(room, { t:'leave', id: client.id });
  broadcast(room, { t:'peers', peers: roomPeers(room) });
  if(room.clients.size === 0){
    room.idle = setTimeout(()=> { if(rooms.get(room.code) === room && room.clients.size === 0) rooms.delete(room.code); }, 10 * 60 * 1000);
    return;
  }
  if(wasHost){
    room.hostId = room.clients.keys().next().value;
    broadcast(room, { t:'host', id: room.hostId, reset: true });
  }
}

function joinRoom(client, code, game){
  const key = String(code || '').trim().toUpperCase();
  const room = rooms.get(key);
  if(!room){ sendJSON(client.ws, { t:'error', message:'That room code is not open. Ask for a new one!' }); return; }
  if(room.game && game && room.game !== game){ sendJSON(client.ws, { t:'error', message:'That room is for a different game.' }); return; }
  if(client.room === room){ sendJSON(client.ws, { t:'joined', code: room.code, id: client.id, peers: roomPeers(room) }); return; }
  leaveRoom(client);
  if(room.idle){ clearTimeout(room.idle); room.idle = null; }
  client.room = room; client.game = game || room.game;
  room.clients.set(client.id, client);
  sendJSON(client.ws, { t:'joined', code: room.code, id: client.id, host: room.hostId, peers: roomPeers(room) });
  broadcast(room, { t:'peer', peer: publicPeer(client) }, client);
  broadcast(room, { t:'peers', peers: roomPeers(room) });
  for(const line of room.chat.slice(-12)) sendJSON(client.ws, line);
}

function createRoom(client, game){
  leaveRoom(client);
  const code = makeCode();
  const room = { code, game: game || 'arcade', clients: new Map(), chat: [], idle: null, hostId: client.id };
  rooms.set(code, room);
  client.room = room; client.game = room.game;
  room.clients.set(client.id, client);
  sendJSON(client.ws, { t:'created', code, id: client.id, host: client.id, peers: roomPeers(room) });
}

function onMessage(client, raw){
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  if(!msg || typeof msg !== 'object') return;
  client.last = Date.now();
  const t = msg.t;
  if(t === 'hello'){
    if(msg.name) client.name = String(msg.name).slice(0, 18);
    if(msg.game) client.game = String(msg.game).slice(0, 40);
    sendJSON(client.ws, { t:'welcome', id: client.id, build: BUILD });
    return;
  }
  if(t === 'name'){
    client.name = String(msg.name || 'Weston').slice(0, 18);
    if(client.room) broadcast(client.room, { t:'peers', peers: roomPeers(client.room) });
    return;
  }
  if(t === 'create'){ createRoom(client, msg.game || client.game); return; }
  if(t === 'join'){ joinRoom(client, msg.code, msg.game || client.game); return; }
  if(t === 'state'){
    client.data = msg.data && typeof msg.data === 'object' ? msg.data : null;
    if(client.room) broadcast(client.room, { t:'peer', peer: publicPeer(client) }, client);
    return;
  }
  if(t === 'world'){
    if(!client.room || client.room.hostId !== client.id) return;
    if(!msg.world || typeof msg.world !== 'object') return;
    const payload = { t:'world', from: client.id, world: msg.world };
    const raw = JSON.stringify(payload);
    if(raw.length > 180000) return;
    for(const c of client.room.clients.values()){
      if(c === client) continue;
      if(c.ws.readyState === WebSocket.OPEN) c.ws.send(raw);
    }
    return;
  }
  if(t === 'event'){
    if(!client.room || !msg.ev || typeof msg.ev !== 'object') return;
    broadcast(client.room, { t:'event', from: client.id, ev: msg.ev }, client);
    return;
  }
  if(t === 'chat'){
    const text = String(msg.text || '').replace(/[\u0000-\u001f]/g,'').slice(0, 140);
    if(!text || !client.room) return;
    const line = { t:'chat', id: client.id, name: client.name, text, at: Date.now() };
    client.room.chat.push(line);
    if(client.room.chat.length > 40) client.room.chat.shift();
    broadcast(client.room, line);
    return;
  }
  if(t === 'ping'){ sendJSON(client.ws, { t:'pong' }); }
}

const server = http.createServer((req, res)=>{
  const url = req.url || '/';
  if(url.startsWith('/favicon.ico')) return send(res, 204, '');
  if(url.startsWith('/api/play/health') || url === '/healthz'){
    return send(res, 200, JSON.stringify({ ok:true, build:BUILD, rooms: rooms.size }), { 'Content-Type': 'application/json; charset=utf-8' });
  }
  if(url.startsWith('/api/play/room/')){
    const code = decodeURIComponent(url.slice('/api/play/room/'.length).split('?')[0]).toUpperCase();
    const room = rooms.get(code);
    return send(res, 200, JSON.stringify({ ok:!!room, code, players: room ? room.clients.size : 0 }), { 'Content-Type': 'application/json; charset=utf-8' });
  }

  let file = safeJoin(ROOT, url);
  if(!file) return send(res, 404, 'not found');
  if(file.endsWith(path.sep) || (fs.existsSync(file) && fs.statSync(file).isDirectory())){
    file = path.join(file, 'index.html');
  }
  serveFile(req, res, file);
});

const wss = new WebSocketServer({ server, path: '/play' });
wss.on('connection', ws=>{
  const client = { id: 'p' + (nextId++), ws, name:'Weston', game:'arcade', room:null, data:null, last: Date.now() };
  sendJSON(ws, { t:'welcome', id: client.id, build: BUILD });
  ws.on('message', raw => onMessage(client, raw));
  ws.on('close', ()=> leaveRoom(client));
  ws.on('error', ()=> leaveRoom(client));
});

setInterval(()=>{
  const now = Date.now();
  for(const room of rooms.values()){
    for(const c of [...room.clients.values()]){
      if(now - c.last > 25000){ try { c.ws.close(); } catch {} leaveRoom(c); }
    }
  }
}, 8000);

server.listen(PORT, '0.0.0.0', ()=>{
  console.log(`arcade listening on ${PORT} build=${BUILD}`);
});
