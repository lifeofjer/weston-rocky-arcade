// Rail City 3D extras: play-together UI, remote cars, cat rescue cinematic.
import { makeCat } from '../shared/tabby-cat.js';
import { PlayTogether, EMOJI, roomFromUrl } from '../shared/play-together.js';

export function installKit(ctx){
  const {
    THREE, $, scene, camera, ROSTER, TYPE, GX, CITY,
    newCar, removeCar, spawnPlayer, ents, say, popup, LINES,
    getMe, setMe, getMode, setCamOverride, GARAGE, meow,
  } = ctx;
  const V3 = THREE.Vector3;

  // ---------- PLAY TOGETHER ----------
  const remotes = new Map();
  let net = null, lastSend = 0, myName = localStorage.getItem('railCityWho') || 'Weston';

  function setWho(n){
    myName = n === 'Dad' ? 'Dad' : 'Weston';
    localStorage.setItem('railCityWho', myName);
    $('whoWeston').classList.toggle('on', myName==='Weston');
    $('whoDad').classList.toggle('on', myName==='Dad');
    if(net) net.setName(myName);
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
    say(myName==='Dad' ? 'Dad is here! Drive drive together!' : 'Room is ready! Give Dad the code!');
  }

  function upsertRemote(peer){
    if(!peer || peer.id === (net && net.id)) return;
    if(peer.data && peer.data.hidden){ dropRemote(peer.id); return; }
    let r = remotes.get(peer.id);
    const ci = Math.max(0, Math.min(ROSTER.length-1, peer.data && peer.data.ci|0));
    if(r && r.ci !== ci){ removeCar(r.e); r = null; }
    if(!r){
      const e = newCar(ci, peer.data?.x||0, peer.data?.z||0, peer.data?.yaw||0, 'net');
      e.net = true; e.fwd = 0;
      r = { id:peer.id, e, ci, name: peer.name || 'Friend', tx:0, tz:0, tyaw:0, label: makeLabel(peer.name || 'Friend') };
      e.G.add(r.label);
      remotes.set(peer.id, r);
    }
    r.name = peer.name || r.name;
    if(r.label) r.label.userData.setText(r.name);
    if(peer.data){
      r.tx = +peer.data.x || r.e.G.position.x;
      r.tz = +peer.data.z || r.e.G.position.z;
      r.tyaw = +peer.data.yaw || r.e.yaw;
      r.e.mode = peer.data.mode === 'tumble' ? 'tumble' : (peer.data.mode === 'wreck' ? 'wreck' : 'net');
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
      onStatus: (s, extra)=>{
        $('ptStatus').textContent = s==='online' ? 'Connected! Drive together.' : s==='reconnect' ? 'Reconnecting…' : s==='error' ? (extra && extra.message) || 'Hmm.' : 'Ready';
      },
      onError: m => { $('ptStatus').textContent = m; say('Room no work. Try again, question?'); },
    });
    net.connect();
    return net;
  }

  function sendMine(now){
    if(!net || !net.code) return;
    if(now - lastSend < 80) return;
    lastSend = now;
    const me = getMe();
    if(!me){ net.sendState({ hidden:true }); return; }
    net.sendState({
      x: +me.G.position.x.toFixed(2), y: +me.G.position.y.toFixed(2), z: +me.G.position.z.toFixed(2),
      yaw: +me.yaw.toFixed(3), ci: me.ci, mode: me.mode, crush: +me.crush.toFixed(2), name: myName,
    });
  }

  function updateRemotes(dt){
    for(const r of remotes.values()){
      const P = r.e.G.position;
      P.x += (r.tx - P.x) * Math.min(1, dt*8);
      P.z += (r.tz - P.z) * Math.min(1, dt*8);
      P.y = r.e.com;
      let d = r.tyaw - r.e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      r.e.yaw += d * Math.min(1, dt*8);
      r.e.G.rotation.set(0, r.e.yaw, 0);
      if(r.label) r.label.quaternion.copy(camera.quaternion);
      for(const w of r.e.g.userData.wheels) w.userData.spin.rotation.x += dt * 4;
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
    if(Math.abs(bx-ax)+Math.abs(bz-az) > 1){
      pts.push([bx,az]); pts.push([bx,bz]);
    }
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

  // ---------- UI HOOKUP ----------
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
    $('chatSend').onclick = ()=>{ const v=$('chatIn').value.trim(); if(!v||!net) return; net.chat(v); $('chatIn').value=''; };
    $('chatIn').addEventListener('keydown', ev=>{ if(ev.code==='Enter'){ ev.preventDefault(); $('chatSend').click(); } ev.stopPropagation(); });
    $('chatIn').addEventListener('keyup', ev=>ev.stopPropagation());
    const emos = $('chatEmo'); emos.innerHTML='';
    EMOJI.forEach(e=>{ const b=document.createElement('button'); b.type='button'; b.textContent=e; b.onclick=()=>{ if(net) net.chat(e); }; emos.appendChild(b); });
    $('gGo').onclick = ()=>takeCar(rescue.pickCi);
    $('gCat').onclick = catBring;
    const preset = roomFromUrl();
    if(preset){ $('ptPanel').classList.remove('hidden'); bootNet().join(preset); }
  }

  bind();

  return {
    startRescue, updateRescue, skipRescue, endRescueCleanup, isRescue:()=>rescue.on,
    updateRemotes, sendMine, remotes, EMOJI,
  };
}
