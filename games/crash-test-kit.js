// Crash Test 3D play-together: room code, chat, host-authoritative crash state,
// shared deformation seed so both screens show the same wreck.
import { makeCat } from '../shared/tabby-cat.js';
import { PlayTogether, EMOJI, roomFromUrl } from '../shared/play-together.js';

export function installKit(ctx){
  const {
    THREE, $, scene, camera, ROSTER, newCar, removeCar, ents, say, popup,
    getMe, getSel, applyCrash, resetFacility, startTest, packCars, poseCat,
  } = ctx;

  const remotes = new Map();
  let net = null, lastSend = 0, lastWorld = 0, worldSeq = 0, appliedSeq = 0;
  let myName = localStorage.getItem('crashTestWho') || 'Weston';
  let cat = null;

  function setWho(n){
    myName = n === 'Dad' ? 'Dad' : 'Weston';
    localStorage.setItem('crashTestWho', myName);
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
    say(myName==='Dad' ? 'Dad is in the crash lab!' : 'Room ready! Give Dad the code!');
    if(!isHost()){
      const mine = getMe();
      for(const e of [...ents]) if(e!==mine && !e.net && !e.isTrain && !e.isDummy) removeCar(e);
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
    const box = $('chatLog'); if(!box) return;
    const line = document.createElement('div');
    line.innerHTML = `<b>${escapeHtml(msg.name||'?')}:</b> ${escapeHtml(msg.text||'')}`;
    box.appendChild(line); box.scrollTop = box.scrollHeight;
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function packWorld(){
    return { seq: ++worldSeq, cars: packCars(), test: ctx.getTest ? ctx.getTest() : null };
  }

  function applyWorld(snap){
    if(!snap || (snap.seq|0) < appliedSeq) return;
    appliedSeq = snap.seq|0;
    if(ctx.applyWorldSnap) ctx.applyWorldSnap(snap);
  }

  function handleEvent(ev){
    if(!ev) return;
    if(ev.kind === 'launch' && !isHost() && startTest){
      startTest(ev.setup, {fromNet:true});
      return;
    }
    if(ev.kind === 'crash'){
      if(applyCrash) applyCrash(ev);
      return;
    }
    if(ev.kind === 'reset' && resetFacility){
      resetFacility({fromNet:true});
    }
  }

  function noteCrash(payload){
    if(!netOn() || !payload) return;
    if(isHost()) net.sendEvent({ kind:'crash', ...payload });
    else net.sendEvent({ kind:'crash', ...payload, guest:true });
  }

  function noteLaunch(setup){
    if(netOn() && isHost()) net.sendEvent({ kind:'launch', setup });
  }

  function noteReset(){
    if(netOn() && isHost()) net.sendEvent({ kind:'reset' });
  }

  function bootNet(){
    if(net) return net;
    net = PlayTogether({
      game: 'crash-test-3d',
      name: myName,
      onRoom: showRoom,
      onPeer: upsertRemote,
      onPeers: list => { const ids=new Set(list.map(p=>p.id)); for(const [id] of remotes) if(!ids.has(id)) dropRemote(id); list.forEach(upsertRemote); },
      onLeave: dropRemote,
      onChat: addChat,
      onWorld: applyWorld,
      onEvent: handleEvent,
      onHost: info => {
        if(info.reset){
          say('Host left! New crash lab!');
          popup('NEW HOST<small>lab reset so both screens match</small>');
          remotes.clear(); appliedSeq = 0; worldSeq = 0;
          if(resetFacility) resetFacility({fromNet:true, hostReset:true});
        }
      },
      onStatus: (s, extra)=>{
        if($('ptStatus')) $('ptStatus').textContent = s==='online' ? (isHost() ? 'You are HOST. Same wrecks!' : 'Connected! Shared lab.') : s==='reconnect' ? 'Reconnecting…' : s==='error' ? (extra && extra.message) || 'Hmm.' : 'Ready';
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
    if(!me){ net.sendState({ hidden:true }); return; }
    net.sendState({
      x: +me.G.position.x.toFixed(2), y: +me.G.position.y.toFixed(2), z: +me.G.position.z.toFixed(2),
      yaw: +me.yaw.toFixed(3), fwd: +(me.fwd||0).toFixed(2), ci: me.ci, mode: me.mode, crush: +(me.crush||0).toFixed(2), name: myName,
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
    }
  }

  function updateCat(dt, now){
    const c = ensureCat();
    const me = getMe();
    const wreck = ents.find(e => e.crush > .35 && !e.isTrain && !e.isDummy);
    const target = wreck || me;
    const tx = target ? target.G.position.x + 3.2 : 8;
    const tz = target ? target.G.position.z + 2.4 : 12;
    const P = c.position;
    const dx = tx - P.x, dz = tz - P.z, dist = Math.hypot(dx,dz);
    if(dist > .2){
      const sp = Math.min(8, dist*2);
      P.x += (dx/dist)*sp*dt; P.z += (dz/dist)*sp*dt;
      c.rotation.y = Math.atan2(dx, dz);
      const u = c.userData, ph = now*10;
      u.legs.forEach((l,i)=> l.rotation.x = Math.sin(ph + (i%3===0?0:Math.PI))*0.55);
      u.tail.rotation.y = Math.sin(ph*.7)*0.25;
    } else {
      c.userData.legs.forEach(l=> l.rotation.x = 0);
      if(wreck) c.userData.head.rotation.y = Math.sin(now*3)*.2;
    }
    if(poseCat) poseCat(c);
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
    ensureCat();
  }

  bind();

  return {
    netOn, isHost, sendMine, updateRemotes, updateCat, remotes, EMOJI,
    noteCrash, noteLaunch, noteReset, packWorld, applyWorld,
    myId:()=>net && net.id, get cat(){ return cat; }, ensureCat,
  };
}
