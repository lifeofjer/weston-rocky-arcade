// Race City visual look: HDRI env, ACES, soft shadows, SSAO/bloom on desktop,
// PBR asphalt, windowed buildings, curbs, lanes, lights, trees.
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { canvasTex } from './arcade-cars.js';

export function makeWorldMats(THREE, ANISO){
  const asphaltMap = canvasTex(THREE, ANISO, 512, 512, (c,w,h)=>{
    c.fillStyle='#2a2c30'; c.fillRect(0,0,w,h);
    for(let i=0;i<9000;i++){
      const v=30+Math.random()*50;
      c.fillStyle=`rgba(${v},${v},${v+4},${0.22})`;
      c.fillRect(Math.random()*w, Math.random()*h, 1+Math.random()*2, 1+Math.random()*2);
    }
    c.fillStyle='rgba(20,20,22,.35)';
    for(let y=0;y<h;y+=64) c.fillRect(0,y,w,2);
  });
  asphaltMap.wrapS=asphaltMap.wrapT=THREE.RepeatWrapping;
  asphaltMap.repeat.set(18,18);

  const asphaltN = canvasTex(THREE, ANISO, 256, 256, (c,w,h)=>{
    c.fillStyle='#8080ff'; c.fillRect(0,0,w,h);
    for(let i=0;i<4000;i++){
      const v=110+Math.random()*40;
      c.fillStyle=`rgb(${v},${v},255)`;
      c.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
  asphaltN.wrapS=asphaltN.wrapT=THREE.RepeatWrapping;
  asphaltN.repeat.set(18,18);

  const walk = canvasTex(THREE, ANISO, 256, 256, (c,w,h)=>{
    c.fillStyle='#9a968e'; c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(70,68,64,.35)'; c.lineWidth=2;
    for(let x=0;x<w;x+=32){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,h); c.stroke(); }
    for(let y=0;y<h;y+=32){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); }
    for(let i=0;i<800;i++){
      c.fillStyle=`rgba(${140+Math.random()*40},${136+Math.random()*30},${120+Math.random()*20},.4)`;
      c.fillRect(Math.random()*w, Math.random()*h, 3, 3);
    }
  });
  walk.wrapS=walk.wrapT=THREE.RepeatWrapping;

  const curbMat = new THREE.MeshStandardMaterial({color:0xb9b4ab, roughness:.85, metalness:.04});
  const asphalt = new THREE.MeshStandardMaterial({
    color:0x3d4046, map:asphaltMap, roughness:.92, metalness:.06, envMapIntensity:.35,
  });
  try { asphalt.normalMap = asphaltN; asphalt.normalScale = new THREE.Vector2(.35,.35); } catch {}
  const sidewalk = new THREE.MeshStandardMaterial({color:0xa8a49c, map:walk, roughness:.9, metalness:.02});

  function windowTex(seed, night){
    return canvasTex(THREE, ANISO, 512, 512, (c,w,h)=>{
      const rng=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
      const wall = night? '#1a1c24' : ['#c8c2b4','#8a9098','#b9a089','#6d7380','#d9d4c8'][seed%5];
      c.fillStyle=wall; c.fillRect(0,0,w,h);
      const cols=8, rows=12, m=18, gap=8;
      const cw=(w-m*2)/cols, ch=(h-m*2)/rows;
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){
        const on = night ? rng()>.35 : rng()>.12;
        if(night){
          c.fillStyle = on ? (rng()>.2?'#ffd89a':'#cfe6ff') : '#0b0d14';
        } else {
          c.fillStyle = on ? 'rgba(70,110,150,.55)' : 'rgba(30,40,50,.45)';
        }
        c.fillRect(m+i*cw+gap/2, m+j*ch+gap/2, cw-gap, ch-gap);
        if(!night){
          c.fillStyle='rgba(255,255,255,.18)';
          c.fillRect(m+i*cw+gap/2, m+j*ch+gap/2, (cw-gap)*.45, 2);
        }
      }
    });
  }

  const dayFacades=[], nightFacades=[];
  for(let i=0;i<6;i++){
    const t=windowTex(1000+i*97, false); t.wrapS=t.wrapT=THREE.RepeatWrapping;
    dayFacades.push(new THREE.MeshPhysicalMaterial({
      color:0xffffff, map:t, roughness:.55, metalness:.12, envMapIntensity:.8, clearcoat:.15,
    }));
    const n=windowTex(2000+i*53, true); n.wrapS=n.wrapT=THREE.RepeatWrapping;
    nightFacades.push(new THREE.MeshStandardMaterial({
      color:0x8899aa, map:n, roughness:.5, metalness:.2, emissive:0x445566, emissiveIntensity:.55, emissiveMap:n,
    }));
  }

  const glassB=new THREE.MeshPhysicalMaterial({
    color:0x6a8eb8, metalness:.55, roughness:.08, envMapIntensity:1.8, clearcoat:1, clearcoatRoughness:.1,
  });
  const neon=new THREE.MeshStandardMaterial({color:0xff40c8, emissive:0xff20a0, emissiveIntensity:2.4, toneMapped:false});
  const grass=new THREE.MeshStandardMaterial({color:0x4a7a32, roughness:1});
  const sand=new THREE.MeshStandardMaterial({color:0xc2a36a, roughness:1});
  const conc=new THREE.MeshStandardMaterial({color:0x8a8680, roughness:.92});
  const mark=new THREE.MeshBasicMaterial({color:0xf2f0e4, toneMapped:false});
  const markY=new THREE.MeshBasicMaterial({color:0xe8c440, toneMapped:false});
  const xwalk=canvasTex(THREE, ANISO, 256, 64, (c,w,h)=>{
    c.fillStyle='#2a2c30'; c.fillRect(0,0,w,h);
    c.fillStyle='#f4f1e6';
    for(let x=4;x<w;x+=22) c.fillRect(x,6,12,h-12);
  });
  xwalk.wrapS=THREE.RepeatWrapping; xwalk.repeat.set(2,1);
  const xwalkMat=new THREE.MeshStandardMaterial({map:xwalk, roughness:.85, metalness:.02});

  return { asphalt, sidewalk, curbMat, dayFacades, nightFacades, glassB, neon, grass, sand, conc, mark, markY, xwalkMat };
}

export function decorateRoads(THREE, worldRoot, mats, roads, opts={}){
  const night=!!opts.night;
  const lights=[], trees=[];
  const poleMat=new THREE.MeshStandardMaterial({color:0x2a2c30, metalness:.7, roughness:.35});
  const lampMat=new THREE.MeshStandardMaterial({color:0xfff2c8, emissive:night?0xffe8a0:0xfff6d0, emissiveIntensity:night?2.8:1.2, toneMapped:false});
  const trunk=new THREE.MeshStandardMaterial({color:0x4a3424, roughness:.9});
  const leaf=new THREE.MeshStandardMaterial({color:night?0x1c3a1c:0x2f7a32, roughness:.85});

  function dashLine(x0,z0,x1,z1, col=mats.mark, w=.18){
    const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz)||1, ang=Math.atan2(dx,dz);
    const n=Math.max(2, Math.floor(len/7));
    for(let i=0;i<n;i++){
      const t=(i+.5)/n;
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,.04,2.4), col);
      m.position.set(x0+dx*t, .09, z0+dz*t); m.rotation.y=ang; worldRoot.add(m);
    }
  }
  function solidLine(x0,z0,x1,z1, col=mats.markY, w=.16){
    const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz)||1, ang=Math.atan2(dx,dz);
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,.035,len), col);
    m.position.set((x0+x1)/2, .085, (z0+z1)/2); m.rotation.y=ang; worldRoot.add(m);
  }
  function sidewalk(x0,z0,x1,z1, side, w=2.4){
    const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz)||1, ang=Math.atan2(dx,dz);
    const nx=Math.cos(ang)*side, nz=-Math.sin(ang)*side;
    const cx=(x0+x1)/2 + nx*(6.2), cz=(z0+z1)/2 + nz*(6.2);
    const walk=new THREE.Mesh(new THREE.BoxGeometry(w,.18,len), mats.sidewalk);
    walk.position.set(cx, .1, cz); walk.rotation.y=ang; walk.receiveShadow=true; worldRoot.add(walk);
    const curb=new THREE.Mesh(new THREE.BoxGeometry(.22,.28,len), mats.curbMat);
    curb.position.set(cx - nx*(w/2+.1), .14, cz - nz*(w/2+.1)); curb.rotation.y=ang; worldRoot.add(curb);
  }
  function streetlight(x,z){
    const g=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,6.2,8), poleMat);
    pole.position.y=3.1; g.add(pole);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(1.6,.08,.08), poleMat);
    arm.position.set(.7, 6.1, 0); g.add(arm);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6), lampMat);
    lamp.position.set(1.35, 6.0, 0); g.add(lamp);
    g.position.set(x,0,z); g.castShadow=true; worldRoot.add(g); lights.push(g);
  }
  function tree(x,z,s=1){
    const g=new THREE.Group();
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,2.2,6), trunk);
    t.position.y=1.1; g.add(t);
    const f=new THREE.Mesh(new THREE.SphereGeometry(1.35, 8, 6), leaf);
    f.position.y=2.8; g.add(f);
    const f2=new THREE.Mesh(new THREE.SphereGeometry(.9, 7, 5), leaf);
    f2.position.set(.4, 3.3, -.2); g.add(f2);
    g.position.set(x,0,z); g.scale.setScalar(s); g.castShadow=true; worldRoot.add(g); trees.push(g);
  }
  function crosswalk(x,z, ang){
    const m=new THREE.Mesh(new THREE.BoxGeometry(12, .05, 3.2), mats.xwalkMat);
    m.position.set(x, .08, z); m.rotation.y=ang; m.receiveShadow=true; worldRoot.add(m);
  }
  function trafficLight(x,z, yaw){
    const g=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,4.6,8), poleMat);
    pole.position.y=2.3; g.add(pole);
    const head=new THREE.Mesh(new THREE.BoxGeometry(.28,.7,.18), poleMat);
    head.position.set(0, 4.5, .12); g.add(head);
    const cols=[0xff2020, 0xe8c440, 0x20c840];
    cols.forEach((col,i)=>{
      const l=new THREE.Mesh(new THREE.CircleGeometry(.08,10), new THREE.MeshStandardMaterial({color:col, emissive:col, emissiveIntensity:i===2?1.6:.4, toneMapped:false}));
      l.position.set(0, 4.72-i*.2, .22); g.add(l);
    });
    g.position.set(x,0,z); g.rotation.y=yaw; worldRoot.add(g);
  }

  for(const r of roads){
    dashLine(r.x0, r.z0, r.x1, r.z1);
    sidewalk(r.x0, r.z0, r.x1, r.z1, 1);
    sidewalk(r.x0, r.z0, r.x1, r.z1, -1);
    const dx=r.x1-r.x0, dz=r.z1-r.z0, len=Math.hypot(dx,dz)||1;
    const ux=dx/len, uz=dz/len, nx=-uz, nz=ux;
    for(let d=12; d<len-8; d+=28){
      streetlight(r.x0+ux*d + nx*7.2, r.z0+uz*d + nz*7.2);
    }
  }
  return { streetlight, tree, crosswalk, trafficLight, dashLine, solidLine, lights, trees };
}

export async function loadHdris(THREE, renderer){
  const loader = new RGBELoader();
  const base = new URL('./race-city-assets/', import.meta.url).href;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  async function one(file){
    const tex = await loader.loadAsync(base + file);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const rt = pmrem.fromEquirectangular(tex);
    tex.dispose();
    return rt.texture;
  }
  const out = {};
  try { out.day = await one('venice_sunset_1k.hdr'); } catch(e){ console.warn('hdri day', e); }
  try { out.sunset = await one('venice_sunset_1k.hdr'); } catch(e){ console.warn('hdri sunset', e); }
  try { out.night = await one('moonless_golf_1k.hdr'); } catch(e){ console.warn('hdri night', e); }
  return { env: out, pmrem };
}

export function setupLook(THREE, renderer, scene, camera, sun){
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, {left:-70, right:70, top:70, bottom:-70, near:4, far:260});

  let composer=null, bloom=null, ssao=null, useComposer=true, splitGfx=false;
  function buildComposer(){
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    ssao = new SSAOPass(scene, camera, innerWidth, innerHeight);
    ssao.kernelRadius = 8; ssao.minDistance = .001; ssao.maxDistance = .12;
    composer.addPass(ssao);
    bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .22, .4, .85);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  try { buildComposer(); } catch(e){ useComposer=false; composer=null; }

  function applyTier(level, night){
    const pad = (navigator.maxTouchPoints||0)>1;
    const lv = pad && level>1 ? 1 : level;
    renderer.shadowMap.enabled = lv>=1;
    sun.castShadow = lv>=1;
    const sm = splitGfx ? (lv>=1?1024:512) : (lv>=2?2048:1024);
    sun.shadow.mapSize.set(sm, sm);
    if(bloom) bloom.strength = night ? (lv>=2?.42:.22) : (lv>=2?.18:.08);
    if(ssao) ssao.enabled = !splitGfx && lv>=2 && !pad && !navigator.webdriver;
    useComposer = !splitGfx && lv>=1 && composer;
    renderer.toneMappingExposure = night ? 0.72 : 1.05;
  }
  function setSplit(on){
    splitGfx=!!on;
    if(splitGfx){
      useComposer=false;
      sun.shadow.mapSize.set(1024, 1024);
    }
  }
  function fullView(){
    renderer.setScissorTest(false);
    renderer.setViewport(0,0,innerWidth,innerHeight);
  }
  function resize(){
    const w=innerWidth, h=innerHeight;
    renderer.setSize(w,h);
    if(composer) composer.setSize(w,h);
    if(ssao && typeof ssao.setSize==='function') ssao.setSize(w,h);
  }
  function render(cam){
    fullView();
    const c = cam || camera;
    try{
      if(useComposer && composer && c===camera) composer.render();
      else renderer.render(scene, c);
    }catch(e){
      useComposer=false;
      renderer.render(scene, c);
    }
  }
  function renderSplit(camL, camR){
    const w=innerWidth, h=innerHeight, half=Math.floor(w/2);
    const prev=renderer.autoClear;
    renderer.autoClear=false;
    renderer.setScissorTest(true);
    renderer.setViewport(0,0,w,h);
    renderer.setScissor(0,0,w,h);
    renderer.clear();
    renderer.setViewport(0,0,half,h);
    renderer.setScissor(0,0,half,h);
    renderer.render(scene, camL);
    renderer.setViewport(half,0,w-half,h);
    renderer.setScissor(half,0,w-half,h);
    renderer.render(scene, camR);
    renderer.setScissorTest(false);
    renderer.setViewport(0,0,w,h);
    renderer.autoClear=prev;
  }
  function setEnv(tex, bgColor, fogColor, fogDen){
    if(tex){ scene.environment = tex; scene.background = tex; }
    else if(bgColor) scene.background = new THREE.Color(bgColor);
    if(fogColor) scene.fog = new THREE.FogExp2(fogColor, fogDen||.0015);
  }
  return { applyTier, resize, render, renderSplit, setSplit, setEnv, composer };
}
