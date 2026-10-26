// Rail City 3D extras: play-together UI, shared host world, mini-games, remotes, cat rescue.
import { makeCat } from '../shared/tabby-cat.js';
import { PlayTogether, EMOJI, roomFromUrl } from '../shared/play-together.js';

export function installKit(ctx){
  const {
    THREE, $, scene, camera, ROSTER, TYPE, GX, CITY,
    newCar, removeCar, spawnPlayer, ents, say, popup, LINES,
    getMe, setMe, getMode, setCamOverride, GARAGE, meow,
    wreck, packTrain, applyTrainSnap, resetWorld, firstScene,
  } = ctx;
  const V3 = THREE.Vector3;

  const remotes = new Map();
  const worldCars = new Map();
  let net = null, lastSend = 0, lastWorld = 0, worldSeq = 0;
  let myName = localStorage.getItem('railCityWho') || 'Weston';
  let game = { mode:'free', it:'', scores:{}, t:0, winner:'', host:'' };
  let appliedSeq = 0;

  function setWho(n){
    myName = n === 'Dad' ? 'Dad' : 'Weston';
    localStorage.setItem('railCityWho', myName);
    $('whoWeston').classList.toggle('on', myName==='Weston');
    $('whoDad').classList.toggle('on', myName==='Dad');
    if(net) net.setName(myName);
  }

  function netOn(){ return !!(net && net.code); }
  function isHost(){ return !netOn() || net.isHost; }

  function showRoom(info){
    $('ptPanel').classList.remove('hidden');
    $('ptLobby').classList.add('hidden');
    $('ptLive').classList.remove('hidden');
    $('ptCode').textContent = info.code;
    $('ptLink').value = info.url;
    $('chatBox').classList.remove('hidden');
    $('ptMini').classList.remove('hidden');
    $('ptMini').textContent = 'ROOM '+info.code;
    try { history.replaceState(null, '', info.url); } catch {}
    say(myName==='Dad' ? 'Dad is here! Same city now!' : 'Room is ready! Give Dad the code!');
    paintGameBtns();
    if(!isHost()){
      const mine = getMe();
      for(const e of [...ents]) if(!e.isTrain && e!==mine && !e.net) removeCar(e);
    }
  }

  function makeLabel(text){
    const c = document.createElement('canvas'); c.width=256; c.height=64;
    const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2,.8), new THREE.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
    m.position.y = 3.2; m.userData.keep = true;
    m.userData.setText = (t)=>{
      g.clearRect(0,0,256,64); g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(8,8,240,48);
      g.strokeStyle='#ffd21e'; g.lineWidth=4; g.strokeRect(8,8,240,48);
      g.fillStyle='#fff'; g.font='bold 28px Courier New,monospace'; g.textAlign='center'; g.textBaseline='middle';
      g.fillText(String(t).slice(0,16), 128, 34); tex.needsUpdate = true;
    };
    m.userData.setText(text);
    return m;
  }

  function upsertRemote(peer){
    if(!peer || peer.id === (net && net.id)) return;
    if(peer.data && peer.data.hidden){ dropRemote(peer.id); return; }
    let r = remotes.get(peer.id);
    const ci = Math.max(0, Math.min(ROSTER.length-1, peer.data && peer.data.ci|0));
    if(r && r.ci !== ci){ removeCar(r.e); r = null; }
    if(!r){
      const e = newCar(ci, peer.data?.x||0, peer.data?.z||0, peer.data?.yaw||0, 'net');
      e.net = true; e.fwd = 0; e.pid = peer.id;
      r = { id:peer.id, e, ci, name: peer.name || 'Friend', tx:0, ty:0, tz:0, tyaw:0, label: makeLabel(peer.name || 'Friend') };
      e.G.add(r.label);
      remotes.set(peer.id, r);
    }
    r.name = peer.name || r.name;
    r.e.pid = peer.id;
    if(r.label) r.label.userData.setText(r.name);
    if(peer.data){
      r.tx = +peer.data.x || r.e.G.position.x;
      r.ty = +peer.data.y || r.e.G.position.y;
      r.tz = +peer.data.z || r.e.G.position.z;
      r.tyaw = +peer.data.yaw || r.e.yaw;
      if(isHost()){
        r.e.G.position.x = r.tx; r.e.G.position.y = r.ty || r.e.com; r.e.G.position.z = r.tz;
        r.e.yaw = r.tyaw; r.e.G.rotation.set(0, r.e.yaw, 0);
        r.e.fwd = +peer.data.fwd || 0;
        if(r.e.V) r.e.V.set(Math.sin(r.e.yaw)*r.e.fwd, 0, Math.cos(r.e.yaw)*r.e.fwd);
      }
      if(peer.data.mode === 'tumble' || peer.data.mode === 'wreck') r.e.mode = peer.data.mode;
      else if(r.e.mode !== 'tumble' && r.e.mode !== 'wreck') r.e.mode = 'net';
    }
  }

  function dropRemote(id){
    const r = remotes.get(id); if(!r) return;
    removeCar(r.e); remotes.delete(id);
  }

  function addChat(msg){
    const box = $('chatLog');
    const line = document.createElement('div');
    line.innerHTML = `<b>${escapeHtml(msg.name||'?')}:</b> ${escapeHtml(msg.text||'')}`;
    box.appendChild(line); box.scrollTop = box.scrollHeight;
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function paintGameBtns(){
    const host = isHost();
    for(const [id, mode] of [['gmFree','free'],['gmTag','tag'],['gmDerail','derail']]){
      const b = $(id); if(!b) continue;
      b.classList.toggle('on', game.mode === mode);
      b.disabled = !host;
    }
  }

  function setGame(mode, fromNet){
    if(game.mode === mode && fromNet) return;
    game.mode = mode; game.winner = ''; game.t = mode==='free' ? 0 : 90;
    game.scores = {}; game.it = '';
    if(mode === 'tag'){
      game.it = (net && net.hostId) || (net && net.id) || '';
      if(net && net.id) game.scores[net.id] = 0;
      for(const r of remotes.values()) game.scores[r.id] = 0;
      say('TAG! Do not get tagged!');
      popup('TAG!<small>bump the IT car to make them it</small>');
    } else if(mode === 'derail'){
      say('Derail race! Smash the train first!');
      popup('DERAIL RACE!<small>first to crash the train wins</small>');
    } else {
      say('Free drive! Same city together!');
    }
    paintGameBtns();
    if(!fromNet && net && isHost()) net.sendEvent({ kind:'game', game });
  }

  function applyGame(g){
    if(!g) return;
    game.mode = g.mode || 'free';
    game.it = g.it || '';
    game.scores = g.scores || {};
    game.t = g.t || 0;
    game.winner = g.winner || '';
    paintGameBtns();
  }

  function packWorld(){
    const me = getMe();
    const cars = [];
    for(const e of ents){
      if(e.isTrain) continue;
      const P = e.G.position;
      cars.push({
        i: e.sid, ci: e.ci, m: e.mode,
        x:+P.x.toFixed(2), y:+P.y.toFixed(2), z:+P.z.toFixed(2),
        yaw:+(e.yaw||0).toFixed(3), fwd:+(e.fwd||0).toFixed(2),
        crush:+(e.crush||0).toFixed(3), hits:e.hits|0, fire:+(e.fire||0).toFixed(1),
        pid: e.pid || (e===me && net ? net.id : ''),
        w: e.lastWreck || null,
      });
    }
    return { seq: ++worldSeq, game, train: packTrain(), cars };
  }

  function applyWorld(snap){
    if(!snap || (snap.seq|0) < appliedSeq) return;
    appliedSeq = snap.seq|0;
    applyGame(snap.game);
    if(applyTrainSnap) applyTrainSnap(snap.train);
    const keep = new Set();
    const me = getMe();
    const myId = net && net.id;
    for(const c of (snap.cars || [])){
      keep.add(c.i);
      if(c.pid && c.pid === myId){
        if(me && c.w){
          if(me.lastWreck && me.lastWreck.seed === c.w.seed) me.appliedWreck = Math.max(me.appliedWreck||0, c.w.n);
          else if(!me.appliedWreck || c.w.n > me.appliedWreck){
            wreck(me, new V3(c.w.px, c.w.py||1, c.w.pz), new V3(c.w.dx, c.w.dy||0, c.w.dz), c.w.sev, { seed:c.w.seed, n:c.w.n, fromNet:true });
            me.appliedWreck = c.w.n;
          }
        }
        if(me) me.crush = Math.max(me.crush||0, c.crush||0);
        continue;
      }
      let e = worldCars.get(c.i);
      if(c.pid && remotes.get(c.pid)) e = remotes.get(c.pid).e;
      if(!e){
        const mode = c.pid ? 'net' : (c.m==='parked' ? 'parked' : 'ai');
        e = newCar(c.ci|0, c.x, c.z, c.yaw, mode, c.i);
        e.net = true; e.netWorld = !c.pid; e.pid = c.pid || '';
        worldCars.set(c.i, e);
      }
      e.sid = c.i;
      e.tx = c.x; e.ty = c.y; e.tz = c.z; e.tyaw = c.yaw; e.tfwd = c.fwd;
      e.crush = c.crush; e.hits = c.hits; e.fire = Math.max(e.fire||0, c.fire||0);
      e.pid = c.pid || e.pid;
      if(c.m === 'tumble' || c.m === 'wreck') e.mode = c.m;
      else if(e.mode !== 'tumble') e.mode = e.netWorld ? 'ai' : e.mode;
      if(c.w && (!e.appliedWreck || c.w.n > e.appliedWreck)){
        if(e.lastWreck && e.lastWreck.seed === c.w.seed) e.appliedWreck = Math.max(e.appliedWreck||0, c.w.n);
        else {
          wreck(e, new V3(c.w.px, c.w.py||1, c.w.pz), new V3(c.w.dx, c.w.dy||0, c.w.dz), c.w.sev, { seed:c.w.seed, n:c.w.n, fromNet:true });
          e.appliedWreck = c.w.n;
        }
      }
    }
    for(const [sid, e] of worldCars){
      if(!keep.has(sid)){ removeCar(e); worldCars.delete(sid); }
    }
  }

  function handleEvent(ev, from){
    if(!ev) return;
    if(ev.kind === 'game' && ev.game){ applyGame(ev.game); return; }
    if(ev.kind === 'hit' && isHost()){
      const me = getMe();
      let e = null;
      if(ev.victimPid && net && ev.victimPid === net.id) e = me;
      if(!e && ev.victimPid){ const r = remotes.get(ev.victimPid); if(r) e = r.e; }
      if(!e) e = ents.find(x => x.sid === ev.sid) || (me && me.sid === ev.sid ? me : null);
      if(!e && ev.pid && !ev.victimPid){ const r = remotes.get(ev.pid); if(r) e = r.e; }
      if(!e) return;
      e.cd = Math.max(e.cd||0, .25);
      wreck(e, new V3(ev.px, ev.py||1, ev.pz), new V3(ev.dx, ev.dy||0, ev.dz), ev.sev, { seed: ev.seed, fromNet:true, n:ev.n });
      return;
    }
    if(ev.kind === 'tag' && isHost()){ tagPlayer(ev.who, ev.victim); return; }
    if(ev.kind === 'derail' && isHost() && ctx.forceDerail) ctx.forceDerail(from);
  }

  function tagPlayer(it, victim){
    if(game.mode !== 'tag' || game.winner) return;
    if(it !== game.it || !victim || victim === it) return;
    game.it = victim;
    game.scores[it] = (game.scores[it]|0) + 1;
    say('Tagged! New IT!');
    popup('TAGGED!<small>new IT</small>');
  }

  function tickGame(dt){
    if(!isHost() || !netOn()) return;
    if(game.mode === 'tag' && !game.winner){
      game.t = Math.max(0, game.t - dt);
      const me = getMe();
      const players = [];
      if(me) players.push({ id: net.id, e: me });
      for(const r of remotes.values()) players.push({ id: r.id, e: r.e });
      const it = players.find(p => p.id === game.it);
      if(it){
        for(const p of players){
          if(p.id === game.it) continue;
          const dx = p.e.G.position.x - it.e.G.position.x;
          const dz = p.e.G.position.z - it.e.G.position.z;
          if(Math.hypot(dx,dz) < (p.e.L + it.e.L) * 0.45) tagPlayer(game.it, p.id);
        }
      }
      if(game.t <= 0){
        let best = '', bestS = -1;
        for(const [id, s] of Object.entries(game.scores)) if(s > bestS){ bestS = s; best = id; }
        game.winner = best || game.it;
        popup('TAG OVER!<small>winner scored '+(bestS|0)+'</small>');
      }
    }
    if(game.mode === 'derail' && !game.winner && ctx.train && ctx.train.derailed){
      game.winner = ctx.train.lastHitter || net.id;
      popup('DERAIL WIN!<small>the train jumped the tracks</small>');
      say('Somebody wrecked the train! You win!');
    }
  }

  function noteHit(e, wpt, wdir, sev, seed){
    if(!netOn() || isHost() || !e) return;
    const me = getMe();
    net.sendEvent({
      kind:'hit', sid:e.sid, pid:net.id,
      victimPid: e.pid || (e===me ? net.id : ''),
      px:wpt.x, py:wpt.y, pz:wpt.z, dx:wdir.x, dy:wdir.y, dz:wdir.z, sev, seed,
      n: e.lastWreck && e.lastWreck.n,
    });
  }

  function noteDerail(){
    if(netOn() && isHost() && game.mode === 'derail' && !game.winner){
      game.winner = (ctx.train && ctx.train.lastHitter) || net.id;
    }
  }

  function bootNet(){
    if(net) return net;
    net = PlayTogether({
      game: 'rail-city-3d',
      name: myName,
      onRoom: showRoom,
      onPeer: upsertRemote,
      onPeers: list => { const ids=new Set(list.map(p=>p.id)); for(const [id] of remotes) if(!ids.has(id)) dropRemote(id); list.forEach(upsertRemote); },
      onLeave: dropRemote,
      onChat: addChat,
      onWorld: applyWorld,
      onEvent: handleEvent,
      onHost: info => {
        paintGameBtns();
        if(info.reset){
          say('Host left! New shared city!');
          popup('NEW HOST<small>city reset so both screens match</small>');
          if(resetWorld) resetWorld();
          worldCars.clear(); remotes.clear(); appliedSeq = 0; worldSeq = 0;
          if(ctx.getMode && ctx.getMode()==='play' && spawnPlayer) spawnPlayer(ctx.getSel?ctx.getSel():10, -3.3, -45, 0);
          if(isHost() && firstScene) firstScene();
          setGame('free', true);
        }
      },
      onStatus: (s, extra)=>{
        $('ptStatus').textContent = s==='online' ? (isHost() ? 'You are HOST. Same city!' : 'Connected! Shared world.') : s==='reconnect' ? 'Reconnecting…' : s==='error' ? (extra && extra.message) || 'Hmm.' : 'Ready';
      },
      onError: m => { $('ptStatus').textContent = m; say('Room no work. Try again, question?'); },
    });
    net.connect();
    return net;
  }

  function sendMine(now){
    if(!net || !net.code) return;
    if(now - lastSend < 70) return;
    lastSend = now;
    const me = getMe();
    if(!me){ net.sendState({ hidden:true }); return; }
    net.sendState({
      x: +me.G.position.x.toFixed(2), y: +me.G.position.y.toFixed(2), z: +me.G.position.z.toFixed(2),
      yaw: +me.yaw.toFixed(3), fwd: +(me.fwd||0).toFixed(2), ci: me.ci, mode: me.mode, crush: +me.crush.toFixed(2), name: myName,
    });
    if(isHost() && now - lastWorld > 70){
      lastWorld = now;
      net.sendWorld(packWorld());
    }
  }

  function updateRemotes(dt){
    const lerp = isHost() ? 0 : Math.min(1, dt*8);
    for(const r of remotes.values()){
      if(!isHost()){
        const P = r.e.G.position;
        P.x += (r.tx - P.x) * lerp;
        P.z += (r.tz - P.z) * lerp;
        P.y = r.ty != null ? r.ty : r.e.com;
        let d = r.tyaw - r.e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
        r.e.yaw += d * lerp;
        r.e.G.rotation.set(0, r.e.yaw, 0);
      }
      if(r.label) r.label.quaternion.copy(camera.quaternion);
      const rw = r.e.g.userData.wheels;
      if(rw) for(const w of rw) if(w.userData && w.userData.spin) w.userData.spin.rotation.x += dt * 4;
    }
    if(!isHost()){
      for(const e of worldCars.values()){
        if(!e.tx && e.tx !== 0) continue;
        const P = e.G.position;
        P.x += (e.tx - P.x) * lerp;
        P.z += (e.tz - P.z) * lerp;
        P.y = e.ty != null ? e.ty : e.com;
        let d = (e.tyaw||0) - e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
        e.yaw += d * lerp;
        e.G.rotation.set(0, e.yaw, 0);
        e.fwd = e.tfwd || 0;
        const ww = e.g.userData.wheels;
        if(ww) for(const w of ww) if(w.userData && w.userData.spin) w.userData.spin.rotation.x += (e.fwd||4)*dt/(w.userData.r||.35);
      }
    }
  }

  function updateHud(){
    const el = $('gameHud'); if(!el) return;
    if(!netOn() || game.mode === 'free'){ el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    if(game.mode === 'tag'){
      const it = game.it === (net && net.id) ? myName : ([...remotes.values()].find(r=>r.id===game.it)?.name || 'IT');
      el.innerHTML = game.winner
        ? `TAG OVER · winner scored ${(game.scores[game.winner]|0)}`
        : `TAG · IT: <b>${escapeHtml(it)}</b> · ${Math.ceil(game.t)}s`;
    } else if(game.mode === 'derail'){
      el.innerHTML = game.winner ? 'DERAIL RACE · somebody wrecked the train!' : 'DERAIL RACE · smash the train first!';
    }
  }

  function copyLink(){
    const url = $('ptLink').value;
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).catch(()=>{});
    $('ptCopy').textContent = 'COPIED!';
    setTimeout(()=>{ $('ptCopy').textContent = 'COPY LINK'; }, 1200);
  }

  // ---------- CAT RESCUE ----------
  const rescue = { on:false, phase:'', t:0, path:[], i:0, cat:null, floor:1, pickCi:0 };
  function poseCat(x,z,y,heading,phase){
    const c = rescue.cat; if(!c) return;
    c.position.set(x,y,z); c.rotation.y = heading;
    const u = c.userData, walk = phase != null;
    if(walk){ u.legs.forEach((l,i)=> l.rotation.x = Math.sin(phase + (i%3===0?0:Math.PI))*0.6); u.tail.rotation.y = Math.sin(phase*.7)*0.25; }
    else { u.legs.forEach(l=> l.rotation.x = 0); }
  }

  function nearestGX(v){ let b=GX[0]; for(const g of GX) if(Math.abs(g-v)<Math.abs(b-v)) b=g; return b; }
  function roadPath(sx,sz,ex,ez){
    const ax=nearestGX(sx), az=nearestGX(sz), bx=nearestGX(ex), bz=nearestGX(ez);
    const pts=[[sx,sz],[ax,sz],[ax,az]];
    if(Math.abs(bx-ax)+Math.abs(bz-az) > 1){ pts.push([bx,az]); pts.push([bx,bz]); }
    pts.push([ex,ez]);
    const out=[];
    for(let i=0;i<pts.length-1;i++){
      const [x0,z0]=pts[i], [x1,z1]=pts[i+1];
      const n=Math.max(1, Math.hypot(x1-x0,z1-z0)/18|0);
      for(let k=0;k<n;k++) out.push([x0+(x1-x0)*k/n, z0+(z1-z0)*k/n]);
    }
    out.push([ex,ez]);
    return out;
  }

  function startRescue(){
    if(rescue.on) return;
    const me = getMe(); if(!me) return;
    rescue.on = true; rescue.phase = 'run'; rescue.t = 0; rescue.floor = 1; rescue.i = 0;
    if(!rescue.cat){ rescue.cat = makeCat(THREE); rescue.cat.scale.setScalar(1.8); scene.add(rescue.cat); }
    rescue.cat.visible = true;
    const P = me.G.position;
    rescue.path = roadPath(P.x, P.z, GARAGE.doorX, GARAGE.doorZ);
    poseCat(P.x, P.z, 0, me.yaw, 0);
    $('prompt').innerHTML = 'THE CAT IS GETTING YOU A NEW CAR!<small>Watch the cat run to the 100-level garage · ENTER skips</small>';
    $('prompt').classList.remove('hidden');
    meow(); say('Cat run run! Big garage has ONE HUNDRED floors of cars!');
    popup('CAT TO THE RESCUE!<small>the tabby is getting a new car</small>');
  }

  function openPicker(){
    rescue.phase = 'pick';
    setCamOverride({ p: new V3(GARAGE.x+18, 12, GARAGE.z+8), t: new V3(GARAGE.x, 4, GARAGE.z) });
    poseCat(GARAGE.doorX, GARAGE.doorZ, 0, Math.PI, null);
    $('garagePick').classList.remove('hidden');
    $('prompt').classList.add('hidden');
    buildGarageGrid();
    say('Pick a car! Or let the cat bring one!');
  }

  function buildGarageGrid(){
    const gr = $('ggrid'); gr.innerHTML = '';
    ROSTER.forEach((d,i)=>{
      const b = document.createElement('button');
      b.className = 'pe'+(i===rescue.pickCi?' on':'');
      b.innerHTML = `${d.name}<small>${(d.police && d.type==='cyber')?'POLICE TRUCK':(TYPE[d.type]||d.type)} · ${Math.round(d.top*2.237)} MPH</small>`;
      b.onclick = ()=>{ rescue.pickCi = i; [...gr.children].forEach((x,k)=>x.classList.toggle('on',k===i)); };
      b.ondblclick = ()=> takeCar(i);
      gr.appendChild(b);
    });
  }

  function takeCar(ci){
    if(!rescue.on) return;
    const pick = ci==null ? rescue.pickCi : ci;
    $('garagePick').classList.add('hidden');
    setCamOverride(null);
    if(rescue.cat) rescue.cat.visible = false;
    rescue.on = false; rescue.phase = '';
    spawnPlayer(pick, GARAGE.exitX, GARAGE.exitZ, GARAGE.exitYaw);
    popup('NEW RIDE!<small>'+ROSTER[pick].name+'</small>');
    say('New car! Drive drive! Thank you cat!');
    meow();
  }

  function catBring(){
    const fancy = ROSTER.map((d,i)=>i).filter(i=>['hyper','cyber','sport','police'].includes(ROSTER[i].type) || ROSTER[i].police);
    takeCar(fancy[(Math.random()*fancy.length)|0]);
  }

  function updateRescue(dt){
    if(!rescue.on) return;
    rescue.t += dt;
    if(rescue.phase==='run'){
      const path = rescue.path; if(!path.length){ rescue.phase='climb'; rescue.t=0; return; }
      const spd = 36;
      let need = spd * dt;
      while(need>0 && rescue.i < path.length-1){
        const a = path[rescue.i], b = path[rescue.i+1];
        const dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz)||1;
        if(need >= len){ need -= len; rescue.i++; }
        else {
          const t = need/len; const x=a[0]+dx*t, z=a[1]+dz*t;
          path[rescue.i] = [x,z];
          poseCat(x,z,0, Math.atan2(dx,dz), rescue.t*14);
          setCamOverride({ p: new V3(x - Math.sin(Math.atan2(dx,dz))*8, 4.2, z - Math.cos(Math.atan2(dx,dz))*8), t: new V3(x, 1.2, z) });
          need = 0;
        }
      }
      if(rescue.i >= path.length-1){ rescue.phase='climb'; rescue.t=0; meow(); say('Cat climb climb! One hundred levels!'); }
    } else if(rescue.phase==='climb'){
      const dur = 8.5;
      const u = Math.min(1, rescue.t/dur);
      const floors = GARAGE.floors;
      rescue.floor = Math.max(1, Math.min(floors, 1 + Math.floor(u*(floors-1))));
      const ang = u * Math.PI * 2 * 6;
      const rad = 14;
      const x = GARAGE.x + Math.cos(ang)*rad;
      const z = GARAGE.z + Math.sin(ang)*rad;
      const y = u * (floors * GARAGE.fh - 4);
      poseCat(x, z, y, ang + Math.PI/2, rescue.t*16);
      setCamOverride({ p: new V3(x+Math.cos(ang+1.1)*9, y+3.2, z+Math.sin(ang+1.1)*9), t: new V3(x, y+1.1, z) });
      $('prompt').innerHTML = `CAT CLIMBING · LEVEL <b>${rescue.floor}</b> / ${floors}<small>crawling past parked cars · ENTER to pick now</small>`;
      $('prompt').classList.remove('hidden');
      if(u>=1) openPicker();
    }
  }

  function skipRescue(){
    if(!rescue.on) return;
    if(rescue.phase==='pick') takeCar(rescue.pickCi);
    else openPicker();
  }

  function endRescueCleanup(){
    $('garagePick').classList.add('hidden');
    if(rescue.cat) rescue.cat.visible = false;
    rescue.on = false; rescue.phase='';
    setCamOverride(null);
  }

  function bind(){
    setWho(myName);
    $('whoWeston').onclick = ()=>setWho('Weston');
    $('whoDad').onclick = ()=>setWho('Dad');
    const openPt = ()=>{ bootNet(); $('ptPanel').classList.remove('hidden'); };
    $('ptOpen').onclick = openPt;
    if($('ptOpenIn')) $('ptOpenIn').onclick = openPt;
    $('ptClose').onclick = ()=>$('ptPanel').classList.add('hidden');
    $('ptMake').onclick = ()=>{ setWho(myName); bootNet().create(); };
    $('ptJoinBtn').onclick = ()=>{ setWho(myName); bootNet().join($('ptJoin').value); };
    $('ptJoin').addEventListener('keydown', ev=>{ if(ev.code==='Enter'){ ev.preventDefault(); bootNet().join($('ptJoin').value); } });
    $('ptCopy').onclick = copyLink;
    $('gmFree').onclick = ()=>{ if(isHost()) setGame('free'); };
    $('gmTag').onclick = ()=>{ if(isHost()) setGame('tag'); };
    $('gmDerail').onclick = ()=>{ if(isHost()) setGame('derail'); };
    $('chatSend').onclick = ()=>{ const v=$('chatIn').value.trim(); if(!v||!net) return; net.chat(v); $('chatIn').value=''; };
    $('chatIn').addEventListener('keydown', ev=>{ if(ev.code==='Enter'){ ev.preventDefault(); $('chatSend').click(); } ev.stopPropagation(); });
    $('chatIn').addEventListener('keyup', ev=>ev.stopPropagation());
    const emos = $('chatEmo'); emos.innerHTML='';
    EMOJI.forEach(e=>{ const b=document.createElement('button'); b.type='button'; b.textContent=e; b.onclick=()=>{ if(net) net.chat(e); }; emos.appendChild(b); });
    $('gGo').onclick = ()=>takeCar(rescue.pickCi);
    $('gCat').onclick = catBring;
    const preset = roomFromUrl();
    if(preset){
      const joinRoom = ()=>{ $('ptPanel').classList.remove('hidden'); bootNet().join(preset); };
      if(typeof window.arcadeWhenReady === 'function') window.arcadeWhenReady(joinRoom);
      else joinRoom();
    }
  }

  bind();

  return {
    startRescue, updateRescue, skipRescue, endRescueCleanup, isRescue:()=>rescue.on,
    updateRemotes, sendMine, remotes, EMOJI,
    netOn, isHost, tickGame, updateHud, noteHit, noteDerail, packWorld, applyWorld,
    myId:()=>net && net.id, sendDerail:()=>{ if(netOn()) net.sendEvent({ kind:'derail' }); },
    get game(){ return game; },
  };
}
