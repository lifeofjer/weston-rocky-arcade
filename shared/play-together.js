// Reusable arcade play-together client.
// One room code / link, live peer state, kid-simple chat, and host world snapshots.
// Games send opaque `data` / `world` / `ev` blobs; only Rail City 3D is wired today.

const EMOJI = ['😀','😂','😍','🐱','🚗','🚂','💥','👍','❤️','🎉','👋','🤠'];

function wsUrl(){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/play`;
}

function roomFromUrl(){
  try { return new URLSearchParams(location.search).get('room') || ''; } catch { return ''; }
}

export { EMOJI, roomFromUrl };

export function PlayTogether(opts){
  const game = opts.game || 'arcade';
  const on = {
    room: opts.onRoom || (()=>{}),
    peers: opts.onPeers || (()=>{}),
    peer: opts.onPeer || (()=>{}),
    leave: opts.onLeave || (()=>{}),
    chat: opts.onChat || (()=>{}),
    status: opts.onStatus || (()=>{}),
    error: opts.onError || (()=>{}),
    world: opts.onWorld || (()=>{}),
    event: opts.onEvent || (()=>{}),
    host: opts.onHost || (()=>{}),
  };
  let ws = null, id = null, code = '', name = opts.name || 'Weston', closed = false;
  let hostId = null;
  let pingTimer = null, retry = 0, wantJoin = null, pendingCreate = false, reconnecting = false;

  function send(msg){
    if(ws && ws.readyState === 1){ ws.send(JSON.stringify(msg)); return true; }
    return false;
  }

  function setStatus(s, extra){ on.status(s, extra); }

  function handle(msg){
    if(!msg || !msg.t) return;
    if(msg.t === 'welcome'){ id = msg.id; setStatus(code ? 'online' : 'ready'); return; }
    if(msg.t === 'created' || msg.t === 'joined'){
      code = msg.code; id = msg.id || id;
      hostId = msg.host || (msg.t === 'created' ? id : hostId);
      const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(code)}`;
      on.room({ code, url, name, you: id, host: hostId, peers: msg.peers || [] });
      on.host({ id: hostId, reset: false });
      setStatus('online', { code });
      return;
    }
    if(msg.t === 'host'){ hostId = msg.id; on.host({ id: hostId, reset: !!msg.reset }); return; }
    if(msg.t === 'world'){ on.world(msg.world, msg.from); return; }
    if(msg.t === 'event'){ on.event(msg.ev, msg.from); return; }
    if(msg.t === 'peers'){ on.peers(msg.peers || []); return; }
    if(msg.t === 'peer'){ on.peer(msg.peer); return; }
    if(msg.t === 'leave'){ on.leave(msg.id); return; }
    if(msg.t === 'chat'){ on.chat(msg); return; }
    if(msg.t === 'error'){ on.error(msg.message || 'Room problem'); setStatus('error', msg); }
  }

  function hook(sock){
    sock.addEventListener('open', ()=>{
      retry = 0; setStatus(code || wantJoin ? 'joining' : 'ready');
      send({ t:'hello', game, name });
      if(wantJoin) send({ t:'join', code: wantJoin, game, name });
      else if(code) send({ t:'join', code, game, name });
      else if(pendingCreate){ pendingCreate = false; send({ t:'create', game, name }); }
      clearInterval(pingTimer);
      pingTimer = setInterval(()=>send({ t:'ping' }), 5000);
    });
    sock.addEventListener('message', ev=>{
      try { handle(JSON.parse(ev.data)); } catch {}
    });
    sock.addEventListener('close', ()=>{
      clearInterval(pingTimer); pingTimer = null;
      if(closed) return;
      reconnecting = true; setStatus('reconnect');
      const wait = Math.min(8000, 400 * (2 ** retry++));
      setTimeout(connect, wait);
    });
    sock.addEventListener('error', ()=>{});
  }

  function connect(){
    if(closed) return;
    try { if(ws){ ws.onclose = null; ws.close(); } } catch {}
    setStatus(reconnecting ? 'reconnect' : 'connect');
    ws = new WebSocket(wsUrl());
    hook(ws);
  }

  return {
    get id(){ return id; },
    get code(){ return code; },
    get name(){ return name; },
    get hostId(){ return hostId; },
    get isHost(){ return !!id && id === hostId; },
    connect,
    setName(n){ name = String(n || 'Weston').slice(0, 18); send({ t:'name', name }); },
    create(){
      wantJoin = null;
      if(send({ t:'create', game, name })) return;
      pendingCreate = true;
      if(!ws || ws.readyState === 3) connect();
    },
    join(c){
      wantJoin = String(c || '').trim().toUpperCase();
      if(!wantJoin) return;
      if(send({ t:'join', code: wantJoin, game, name })) return;
      if(!ws || ws.readyState === 3) connect();
    },
    sendState(data){ send({ t:'state', data }); },
    sendWorld(world){ send({ t:'world', world }); },
    sendEvent(ev){ send({ t:'event', ev }); },
    chat(text){ const clean = String(text || '').slice(0, 140); if(!clean) return; send({ t:'chat', text: clean }); },
    disconnect(){ closed = true; clearInterval(pingTimer); try { ws && ws.close(); } catch {} },
  };
}
