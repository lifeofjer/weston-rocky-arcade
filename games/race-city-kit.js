// Race City 3D extras: Play Together rooms + chat, host world snapshots,
// and helpers for cat-mode / Target shop so Weston and Dad share the same city.
import { makeCat } from '../shared/tabby-cat.js';
import { PlayTogether, EMOJI, roomFromUrl } from '../shared/play-together.js';

export function installKit(ctx){
  const {
    THREE, $, scene, camera, ROSTER, TYPE, newCar, removeCar, spawnPlayer, ents, say, popup,
    getMe, setCamOverride, wreck, packTrain, applyTrainSnap, resetWorld, firstScene,
    getMap, getPlayMode, setPlayMode, getForm,
  } = ctx;

  const remotes = new Map();
  const worldCars = new Map();
  let net = null, lastSend = 0, lastWorld = 0, worldSeq = 0, appliedSeq = 0;
  let myName = localStorage.getItem('raceCityWho') || 'Weston';
  let game = { mode:'free', t:0, winner:'', host:'', laps:3 };
  let cat = null;

  function setWho(n){
    myName = n === 'Dad' ? 'Dad' : 'Weston';
    localStorage.setItem('raceCityWho', myName);
    if($('whoWeston')) $('whoWeston').classList.toggle('on', myName==='Weston');
    if($('whoDad')) $('whoDad').classList.toggle('on', myName==='Dad');
    if(net) net.setName(myName);
  }
  function netOn(){ return !!(net && net.code); }
  function isHost(){ return !netOn() || net.isHost; }

  function ensureCat(){
    if(cat) return cat;
    cat = makeCat(THREE);
    cat.scale.setScalar(1.7);
    cat.visible = false;
    scene.add(cat);
    return cat;
  }

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
    say(myName==='Dad' ? 'Dad is in Race City!' : 'Room ready! Give Dad the code!');
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
      r = { id:peer.id, e, ci, name: peer.name || 'Friend', tx:0, ty:0, tz:0, tyaw:0, label: makeLabel(peer.name || 'Friend'), form: peer.data?.form||'car' };
      e.G.add(r.label);
      remotes.set(peer.id, r);
    }
    r.name = peer.name || r.name;
    r.e.pid = peer.id;
    r.form = (peer.data && peer.data.form) || r.form || 'car';
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
    const box = $('chatLog'); if(!box) return;
    const line = document.createElement('div');
    line.innerHTML = `<b>${escapeHtml(msg.name||'?')}:</b> ${escapeHtml(msg.text||'')}`;
    box.appendChild(line); box.scrollTop = box.scrollHeight;
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function paintGameBtns(){
    const host = isHost();
    for(const [id, mode] of [['gmFree','free'],['gmRace','race']]){
      const b = $(id); if(!b) continue;
      b.classList.toggle('on', (getPlayMode?getPlayMode():game.mode) === mode);
      b.disabled = !host;
    }
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
    return { seq: ++worldSeq, game, map: getMap && getMap(), play: getPlayMode && getPlayMode(), train: packTrain && packTrain(), cars };
  }

  function applyWorld(snap){
    if(!snap || (snap.seq|0) < appliedSeq) return;
    appliedSeq = snap.seq|0;
    if(snap.game) game = Object.assign(game, snap.game);
    if(applyTrainSnap && snap.train) applyTrainSnap(snap.train);
    const keep = new Set();
    const me = getMe();
    const myId = net && net.id;
    for(const c of (snap.cars || [])){
      keep.add(c.i);
      if(c.pid && c.pid === myId){
        if(me && c.w){
          if(me.lastWreck && me.lastWreck.seed === c.w.seed) me.appliedWreck = Math.max(me.appliedWreck||0, c.w.n);
          else if(!me.appliedWreck || c.w.n > me.appliedWreck){
            wreck(me, new THREE.Vector3(c.w.px, c.w.py||1, c.w.pz), new THREE.Vector3(c.w.dx, c.w.dy||0, c.w.dz), c.w.sev, { seed:c.w.seed, n:c.w.n, fromNet:true });
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
    }
    paintGameBtns();
  }

  function handleEvent(ev){
    if(!ev) return;
    if(ev.kind === 'hit' && wreck){
      const me = getMe();
      const e = ents.find(x=>x.sid===ev.sid) || (ev.victimPid && ev.victimPid===(net&&net.id) ? me : null);
      if(e) wreck(e, new THREE.Vector3(ev.px, ev.py||1, ev.pz), new THREE.Vector3(ev.dx, ev.dy||0, ev.dz), ev.sev, {seed:ev.seed, n:ev.n, fromNet:true});
    }
    if(ev.kind === 'mode' && setPlayMode) setPlayMode(ev.mode, {fromNet:true});
    if(ev.kind === 'map' && ctx.loadMap) ctx.loadMap(ev.map, {fromNet:true});
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

  function bootNet(){
    if(net) return net;
    net = PlayTogether({
      game: 'race-city-3d',
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
          if(firstScene) firstScene();
        }
      },
      onStatus: (s, extra)=>{
        if($('ptStatus')) $('ptStatus').textContent = s==='online' ? (isHost() ? 'You are HOST. Same city!' : 'Connected! Shared world.') : s==='reconnect' ? 'Reconnecting…' : s==='error' ? (extra && extra.message) || 'Hmm.' : 'Ready';
      },
      onError: m => { if($('ptStatus')) $('ptStatus').textContent = m; say('Room no work. Try again, question?'); },
    });
    net.connect();
    return net;
  }

  function sendMine(now){
    if(!net || !net.code) return;
    if(now - lastSend < 70) return;
    lastSend = now;
    const me = getMe();
    if(!me && getForm && getForm()!=='cat'){ net.sendState({ hidden:true }); return; }
    const P = me ? me.G.position : (cat ? cat.position : {x:0,y:0,z:0});
    net.sendState({
      x: +P.x.toFixed(2), y: +(P.y||0).toFixed(2), z: +P.z.toFixed(2),
      yaw: +((me && me.yaw) || (cat && cat.rotation.y) || 0).toFixed(3),
      fwd: +((me && me.fwd) || 0).toFixed(2), ci: me ? me.ci : 0,
      mode: me ? me.mode : 'cat', crush: +((me && me.crush) || 0).toFixed(2),
      name: myName, form: getForm ? getForm() : 'car',
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
      const rw = r.e.g && r.e.g.userData.wheels;
      if(rw) for(const w of rw) if(w.userData && w.userData.spin) w.userData.spin.rotation.x += dt * 4;
    }
  }

  function copyLink(){
    const url = $('ptLink').value;
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).catch(()=>{});
    $('ptCopy').textContent = 'COPIED!';
    setTimeout(()=>{ $('ptCopy').textContent = 'COPY LINK'; }, 1200);
  }

  function bind(){
    setWho(myName);
    if($('whoWeston')) $('whoWeston').onclick = ()=>setWho('Weston');
    if($('whoDad')) $('whoDad').onclick = ()=>setWho('Dad');
    const openPt = ()=>{ bootNet(); $('ptPanel').classList.remove('hidden'); };
    if($('ptOpen')) $('ptOpen').onclick = openPt;
    if($('ptOpenIn')) $('ptOpenIn').onclick = openPt;
    if($('ptClose')) $('ptClose').onclick = ()=>$('ptPanel').classList.add('hidden');
    if($('ptMake')) $('ptMake').onclick = ()=>{ setWho(myName); bootNet().create(); };
    if($('ptJoinBtn')) $('ptJoinBtn').onclick = ()=>{ setWho(myName); bootNet().join($('ptJoin').value); };
    if($('ptJoin')) $('ptJoin').addEventListener('keydown', ev=>{ if(ev.code==='Enter'){ ev.preventDefault(); bootNet().join($('ptJoin').value); } });
    if($('ptCopy')) $('ptCopy').onclick = copyLink;
    if($('gmFree')) $('gmFree').onclick = ()=>{ if(isHost() && setPlayMode) setPlayMode('free'); };
    if($('gmRace')) $('gmRace').onclick = ()=>{ if(isHost() && setPlayMode) setPlayMode('race'); };
    if($('chatSend')) $('chatSend').onclick = ()=>{ const v=$('chatIn').value.trim(); if(!v||!net) return; net.chat(v); $('chatIn').value=''; };
    if($('chatIn')){
      $('chatIn').addEventListener('keydown', ev=>{ if(ev.code==='Enter'){ ev.preventDefault(); $('chatSend').click(); } ev.stopPropagation(); });
      $('chatIn').addEventListener('keyup', ev=>ev.stopPropagation());
    }
    const emos = $('chatEmo');
    if(emos){ emos.innerHTML=''; EMOJI.forEach(e=>{ const b=document.createElement('button'); b.type='button'; b.textContent=e; b.onclick=()=>{ if(net) net.chat(e); }; emos.appendChild(b); }); }
    const preset = roomFromUrl();
    if(preset){
      const joinRoom = ()=>{ $('ptPanel').classList.remove('hidden'); bootNet().join(preset); };
      if(typeof window.arcadeWhenReady === 'function') window.arcadeWhenReady(joinRoom);
      else joinRoom();
    }
  }

  bind();

  return {
    netOn, isHost, sendMine, updateRemotes, remotes, EMOJI, ensureCat, get cat(){ return cat; },
    noteHit, packWorld, applyWorld, myId:()=>net && net.id, sendMode:(m)=>{ if(netOn()) net.sendEvent({ kind:'mode', mode:m }); },
    sendMap:(m)=>{ if(netOn()) net.sendEvent({ kind:'map', map:m }); },
    get game(){ return game; }, paintGameBtns, TYPE,
    simulatePeer: upsertRemote,
  };
}
