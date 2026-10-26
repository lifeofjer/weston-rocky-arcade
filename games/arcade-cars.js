// Shared arcade roster + Rail City 3D vehicle builders.
// Crash Test 3D and Rail City 3D use the exact same extruded meshes.
export const TYPE = {
  hyper:'SUPERCAR', sport:'SPORTS CAR', sedan:'SEDAN', suv:'SUV', muscle:'MUSCLE CAR',
  pickup:'PICKUP', jeep:'4x4', gwagon:'4x4', police:'POLICE', monster:'MONSTER TRUCK',
  cyber:'TESLA TRUCK', semi:'SEMI TRUCK', tsemi:'ELECTRIC SEMI', fire:'FIRE TRUCK',
};

export const CLS = {
  hyper:{L:4.6,W:2.05,r:.35,af:.32,ar:-.31,clr:.11,nose:.56,cowl:.2,belt:.82,beltRise:.05,rg:-.42,tail:.92,roof:1.14,rf:.04,rb:-.14,cw:.7,top:92,acc:23,turn:2.2,grip:9,mass:1.15,hl:'slim',tl:'twin',spoiler:'wing',intake:true,doors:1,rearGlass:false},
  sport:{L:4.52,W:1.9,r:.35,af:.34,ar:-.32,clr:.12,nose:.66,cowl:.18,belt:.9,beltRise:0,rg:-.4,tail:.98,roof:1.3,rf:0,rb:-.16,cw:.74,top:84,acc:20,turn:2.3,grip:8.5,mass:1.15,hl:'round',tl:'bar',spoiler:'duck',doors:1,rearGlass:true},
  sedan:{L:4.95,W:1.96,r:.36,af:.33,ar:-.31,clr:.14,nose:.7,cowl:.2,belt:.96,beltRise:.04,rg:-.36,tail:1.03,roof:1.44,rf:.04,rb:-.2,cw:.8,top:70,acc:16,turn:2.1,grip:7.5,mass:1.35,hl:'slim',tl:'twin',doors:2,rearGlass:true,grille:true},
  suv:{L:4.75,W:1.98,r:.39,af:.32,ar:-.31,clr:.2,nose:.85,cowl:.22,belt:1.06,beltRise:.04,rg:-.43,tail:1.14,roof:1.64,rf:.06,rb:-.32,cw:.82,top:62,acc:14,turn:2.0,grip:7,mass:1.6,hl:'slim',tl:'twin',doors:2,rearGlass:true,grille:true},
  muscle:{L:4.8,W:1.92,r:.37,af:.34,ar:-.31,clr:.13,nose:.72,cowl:.15,belt:.95,beltRise:0,rg:-.3,tail:1.0,roof:1.36,rf:-.02,rb:-.15,cw:.78,top:76,acc:18,turn:2.1,grip:7.5,mass:1.4,hl:'slim',tl:'twin',doors:2,rearGlass:true,grille:true,spoiler:'duck'},
  pickup:{L:5.9,W:2.2,r:.46,af:.36,ar:-.3,clr:.36,nose:1.22,cowl:.22,belt:1.28,beltRise:0,rg:-.06,tail:1.28,roof:2.0,rf:.11,rb:-.04,cw:.9,top:52,acc:12,turn:1.9,grip:6.5,mass:2.2,hl:'slim',tl:'twin',doors:2,rearGlass:true,grille:true,bed:true,flares:true},
  jeep:{L:4.4,W:1.94,r:.43,af:.34,ar:-.32,clr:.32,nose:1.08,cowl:.2,belt:1.16,beltRise:0,rg:-.47,tail:1.16,roof:1.86,rf:.13,rb:-.45,cw:.94,top:48,acc:12,turn:2.1,grip:6.5,mass:1.8,hl:'round',tl:'twin',doors:2,rearGlass:true,grille:true,spare:true,flares:true},
  gwagon:{L:4.85,W:1.98,r:.43,af:.33,ar:-.31,clr:.3,nose:1.12,cowl:.2,belt:1.2,beltRise:0,rg:-.47,tail:1.2,roof:1.96,rf:.14,rb:-.45,cw:.94,top:58,acc:13,turn:2.0,grip:6.8,mass:2.2,hl:'round',tl:'twin',doors:2,rearGlass:true,grille:true,spare:true},
  police:{L:5.05,W:1.96,r:.37,af:.33,ar:-.31,clr:.14,nose:.74,cowl:.19,belt:.98,beltRise:.02,rg:-.33,tail:1.05,roof:1.45,rf:.03,rb:-.2,cw:.8,top:72,acc:17,turn:2.1,grip:7.5,mass:1.45,hl:'slim',tl:'twin',doors:2,rearGlass:true,grille:true,cab2:0xf2f2f2,bar:true},
  monster:{L:4.9,W:2.1,r:.4,af:.34,ar:-.3,clr:.1,nose:.85,cowl:.22,belt:.95,beltRise:0,rg:-.06,tail:.95,roof:1.6,rf:.11,rb:-.04,cw:.9,top:50,acc:15,turn:2.0,grip:6.5,mass:3,hl:'slim',tl:'twin',doors:1,rearGlass:true,grille:true,bed:true,lift:1.25,mr:1.0,noArch:true},
  cyber:{L:5.68,W:2.2,r:.45,af:.34,ar:-.32,clr:.38,top:58,acc:17,turn:1.9,grip:7,mass:2.6},
  semi:{L:16.4,W:2.55,r:.52,top:36,acc:6,turn:1.3,grip:6,mass:7,big:true},
  tsemi:{L:16.4,W:2.55,r:.52,top:42,acc:9,turn:1.3,grip:6,mass:7,big:true,ev:true},
  fire:{L:10.8,W:2.55,r:.55,top:40,acc:8,turn:1.5,grip:6,mass:5,big:true,siren:true},
};

// [name, type, color, overrides]
export const ROSTER_RAW = [
  ['TESLA CYBERTRUCK','cyber',0xb8bcc0,{ev:true}],
  ['TESLA MODEL S','sedan',0xb0101c,{L:5.0,roof:1.43,rb:-.24,rg:-.42,tesla:true,top:90,acc:26}],
  ['TESLA MODEL 3','sedan',0xf2f2f2,{L:4.72,roof:1.44,rb:-.22,rg:-.4,tesla:true,top:72,acc:20}],
  ['TESLA MODEL Y','suv',0x1b3f8b,{rb:-.28,rg:-.42,roof:1.62,tesla:true,top:70,acc:19}],
  ['TESLA MODEL X','suv',0x121316,{L:5.04,roof:1.68,rb:-.3,rg:-.43,tesla:true,top:72,acc:20}],
  ['TESLA ROADSTER','sport',0xd0101a,{L:4.3,roof:1.2,rb:-.08,rg:-.32,tesla:true,hl:'slim',spoiler:null,top:110,acc:30}],
  ['TESLA SEMI','tsemi',0xe9ebee,{}],
  ['LAMBORGHINI AVENTADOR','hyper',0xff7f00,{L:4.94,W:2.1,rf:.07,rb:-.12,top:97}],
  ['LAMBORGHINI HURACAN','hyper',0x7bd321,{L:4.52,roof:1.17,spoiler:'duck',top:90}],
  ['LAMBORGHINI URUS','suv',0xffc300,{L:5.11,W:2.02,roof:1.62,rb:-.25,rg:-.4,clr:.17,top:85,acc:20,rim:'dark'}],
  ['FERRARI SF90 STRADALE','hyper',0xd40000,{L:4.71,W:1.97,roof:1.19,rf:.06,spoiler:'duck',top:95,acc:26}],
  ['FERRARI LAFERRARI','hyper',0xb80d0d,{L:4.7,roof:1.11,spoiler:'duck',top:97}],
  ['FERRARI F8 TRIBUTO','hyper',0xffd000,{roof:1.2,rg:-.38,spoiler:'duck',top:94}],
  ['PORSCHE 911 TURBO S','sport',0xb9bcc1,{top:92,acc:25}],
  ['PORSCHE 911 GT3 RS','sport',0x3fd06a,{spoiler:'wing',top:88,rim:'dark'}],
  ['BUGATTI CHIRON','hyper',0x1a3fb5,{L:4.54,W:2.04,roof:1.21,cab2:0x0d0f14,spoiler:'duck',top:115,acc:28}],
  ['McLAREN P1','hyper',0xff7a00,{roof:1.17,top:98}],
  ['CORVETTE C8','hyper',0x1d6fe0,{roof:1.24,top:86,spoiler:'duck'}],
  ['FORD MUSTANG GT','muscle',0x1f2d6b,{}],
  ['POLICE INTERCEPTOR','police',0x111114,{}],
  ['FORD F-150 RAPTOR','pickup',0x2b5aa6,{}],
  ['RAM 1500 FLAME RED','pickup',0xc4141c,{ram:true,L:5.95,W:2.22,r:.47,mass:2.7,top:50,acc:12,nose:1.28,roof:2.02,hl:'stack'}],
  ['RAM 1500 BRIGHT WHITE','pickup',0xf2f0ea,{ram:true,L:5.95,W:2.22,r:.47,mass:2.7,top:50,acc:12,nose:1.28,roof:2.02,hl:'stack'}],
  ['RAM 3500 DUALLY BLUE','pickup',0x1a3c8c,{ram:true,dually:true,L:6.55,W:2.48,r:.5,mass:4.4,top:42,acc:9,turn:1.6,grip:6.2,nose:1.32,roof:2.12,clr:.4,hl:'stack'}],
  ['RAM 3500 DUALLY BLACK','pickup',0x141416,{ram:true,dually:true,L:6.55,W:2.48,r:.5,mass:4.4,top:42,acc:9,turn:1.6,grip:6.2,nose:1.32,roof:2.12,clr:.4,hl:'stack',rim:'dark'}],
  ['2015 RAM POWER WAGON','pickup',0xb01018,{
    ram:true, powerWagon:true, highlight:true, dadTruck:true,
    L:6.15, W:2.28, r:.58, lift:.42, mass:3.6, top:46, acc:11, turn:1.75, grip:7.2,
    nose:1.34, roof:2.08, clr:.42, hl:'stack', flares:true, winch:true, knobby:true,
  }],
  ['JEEP WRANGLER','jeep',0x2e7d32,{}],
  ['MERCEDES G-WAGON','gwagon',0x18191b,{rim:'dark'}],
  ['PETERBILT 579','semi',0xc4141c,{aero:true}],
  ['KENWORTH W900','semi',0x1a3c8c,{}],
  ['FIRE TRUCK','fire',0xc8101a,{}],
  ['MONSTER TRUCK','monster',0x2ea3ff,{}],
  ['TOYOTA CAMRY','sedan',0x8a8f96,{}],
  ['HONDA CIVIC','sedan',0x2b2b30,{L:4.6,roof:1.41}],
  ['POLICE CYBERTRUCK','cyber',0x16181c,{ev:true,police:true,bar:true}],
];

export function makeRoster(){
  return ROSTER_RAW.map(([name,type,color,o])=>({name,type,color,...CLS[type],...o}));
}

export function carKind(d){
  if(d.powerWagon) return "DAD'S TRUCK";
  if(d.dually) return 'RAM DUALLY';
  if(d.ram) return 'RAM PICKUP';
  if(d.police && d.type==='cyber') return 'POLICE TRUCK';
  return TYPE[d.type] || d.type;
}

export function findRosterIndex(roster, pred){
  const i = roster.findIndex(pred);
  return i >= 0 ? i : 0;
}

export function canvasTex(THREE, ANISO, w, h, draw){
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace;
  if(ANISO) t.anisotropy=ANISO; return t;
}

// Exact Rail City 3D materials so both games paint the same.
export function createMats(THREE){
  const DS = THREE.DoubleSide;
  return {
    tire:new THREE.MeshStandardMaterial({color:0x141416, roughness:.85, side:DS}),
    rim:new THREE.MeshStandardMaterial({color:0xc9cdd2, metalness:1, roughness:.2, side:DS}),
    rimDark:new THREE.MeshStandardMaterial({color:0x2a2c30, metalness:.9, roughness:.3, side:DS}),
    rimGold:new THREE.MeshStandardMaterial({color:0xc9a040, metalness:1, roughness:.25, side:DS}),
    glass:new THREE.MeshPhysicalMaterial({color:0x0b131b, metalness:.1, roughness:.03, clearcoat:1, envMapIntensity:1.5, side:DS}),
    black:new THREE.MeshStandardMaterial({color:0x111214, roughness:.55, side:DS}),
    gloss:new THREE.MeshPhysicalMaterial({color:0x050607, metalness:.3, roughness:.08, clearcoat:1, side:DS}),
    chrome:new THREE.MeshStandardMaterial({color:0xe6e9ed, metalness:1, roughness:.1, side:DS}),
    head:new THREE.MeshStandardMaterial({color:0xffffff, emissive:0xfff4d6, emissiveIntensity:2.4, side:DS}),
    tail:new THREE.MeshStandardMaterial({color:0x550000, emissive:0xff1010, emissiveIntensity:1.8, side:DS}),
    amber:new THREE.MeshStandardMaterial({color:0x553300, emissive:0xff9000, emissiveIntensity:1.6, side:DS}),
    interior:new THREE.MeshStandardMaterial({color:0x1d1a17, roughness:.9, side:DS}),
    steel:new THREE.MeshStandardMaterial({color:0xb8bdc2, metalness:1, roughness:.33, flatShading:true, side:DS}),
    white:new THREE.MeshStandardMaterial({color:0xf0f0f0, roughness:.45, side:DS}),
    red:new THREE.MeshStandardMaterial({color:0xff2020, emissive:0xff0000, emissiveIntensity:1.5, side:DS}),
    blue:new THREE.MeshStandardMaterial({color:0x2040ff, emissive:0x0030ff, emissiveIntensity:1.5, side:DS}),
    dummySkin:new THREE.MeshStandardMaterial({color:0xe8d4a8, roughness:.92}),
    dummySuit:new THREE.MeshStandardMaterial({color:0xf2d24b, roughness:.88}),
    dummyDark:new THREE.MeshStandardMaterial({color:0x1a1a1c, roughness:.7}),
  };
}

export function mkPaint(THREE, c){
  return new THREE.MeshPhysicalMaterial({color:c, metalness:.55, roughness:.3, clearcoat:1, clearcoatRoughness:.04, side:THREE.DoubleSide});
}

export function makeRamHead(THREE, chrome){
  const g = new THREE.Group();
  const B = (w,h,d,mat,x,y,z)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.position.set(x,y,z); g.add(m); return m; };
  B(.22,.2,.08, chrome, 0,0,0);
  B(.1,.08,.06, chrome, 0,-.02,.04);
  for(const s of [-1,1]){
    const horn = new THREE.Mesh(new THREE.BoxGeometry(.16,.07,.06), chrome);
    horn.position.set(s*.18,.1,.01); horn.rotation.z = s*-.55; horn.rotation.y = s*.2; g.add(horn);
    B(.05,.05,.05, chrome, s*.08,.02,.045);
  }
  g.userData.keep = true;
  return g;
}

export function powerWagonDecal(THREE, ANISO){
  return canvasTex(THREE, ANISO, 512, 128, (c,w,h)=>{
    c.clearRect(0,0,w,h);
    c.fillStyle = 'rgba(0,0,0,0)';
    c.fillRect(0,0,w,h);
    c.fillStyle = '#111';
    c.font = 'bold 42px Impact, Arial Black, Arial';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = '#f2f2f2'; c.lineWidth = 6;
    c.strokeText('POWER WAGON', w/2, h/2+2);
    c.fillText('POWER WAGON', w/2, h/2+2);
  });
}

export function ramWordTex(THREE, ANISO){
  return canvasTex(THREE, ANISO, 256, 64, (c,w,h)=>{
    c.fillStyle = '#111214'; c.fillRect(0,0,w,h);
    c.fillStyle = '#f4f4f4';
    c.font = 'bold 34px Arial Black,Arial';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('RAM', w/2, h/2+2);
  });
}

function weldGeometry(THREE, geo, mergeVertices){
  if(!geo || !geo.attributes || !geo.attributes.position) return geo;
  const src = geo.index ? geo.toNonIndexed() : geo;
  const welded = mergeVertices ? mergeVertices(src, 1e-3) : src;
  if(welded !== src && src !== geo) src.dispose();
  if(!welded.attributes.normal) welded.computeVertexNormals();
  return welded;
}

// Rail City 3D's exact side-extrude / bake / buildVehicle kit.
// Both games call this so every car is identical.
export function createVehicleSystem(THREE, mergeGeometries, opts={}){
  const ANISO = opts.aniso || 1;
  const mergeVertices = opts.mergeVertices || null;
  const MAT = opts.MAT || createMats(THREE);
  const SHARED = new Set();
  const TIRE = {}, RIM = {};

  function seg(n){ return Math.max(1, Math.min(16, Math.ceil(n/.35))); }
  function resample(pts,maxLen){
    const out=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[i], b=pts[(i+1)%pts.length];
      const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/maxLen));
      for(let k=0;k<n;k++) out.push(new THREE.Vector2(a[0]+(b[0]-a[0])*k/n, a[1]+(b[1]-a[1])*k/n));
    }
    return out;
  }
  function sideExtrude(pts,width,bevel=.05,steps=6){
    const sh=new THREE.Shape(resample(pts,.2));
    const depth=Math.max(.01,width-2*bevel);
    const geo=new THREE.ExtrudeGeometry(sh,{depth, steps, bevelEnabled:bevel>0, bevelThickness:bevel, bevelSize:bevel, bevelSegments:2, curveSegments:2});
    geo.rotateY(-Math.PI/2); geo.translate(depth/2,0,0);
    return geo;
  }
  function tireGeo(r,w){
    const k=r+'_'+w;
    if(!TIRE[k]){ TIRE[k]=new THREE.CylinderGeometry(r,r,w,26,1).rotateZ(Math.PI/2); SHARED.add(TIRE[k]); }
    return TIRE[k];
  }
  function rimGeo(r,w){
    const k=r+'_'+w; if(RIM[k]) return RIM[k];
    const parts=[new THREE.CylinderGeometry(r*.64,r*.64,w+.02,22).rotateZ(Math.PI/2)];
    for(const s of [-1,1]) for(let i=0;i<5;i++){
      const b=new THREE.BoxGeometry(.035,r*.62,r*.17); b.translate(0,r*.31,0); b.rotateX(i*Math.PI*2/5); b.translate(s*(w/2+.014),0,0); parts.push(b);
    }
    for(const s of [-1,1]){
      const hub=new THREE.CylinderGeometry(r*.13,r*.13,.05,10).rotateZ(Math.PI/2); hub.translate(s*(w/2+.03),0,0); parts.push(hub);
    }
    RIM[k]=mergeGeometries(parts.map(g=>g.index?g.toNonIndexed():g)); SHARED.add(RIM[k]); return RIM[k];
  }
  function bake(g){
    g.updateMatrixWorld(true);
    const inv=new THREE.Matrix4().copy(g.matrixWorld).invert();
    const by=new Map(), dead=[];
    g.traverse(o=>{
      if(!o.isMesh || o.userData.keep) return;
      let p=o.parent; while(p && p!==g){ if(p.userData.keep) return; p=p.parent; }
      let geo=o.geometry.index? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)); geo.clearGroups();
      for(const k of Object.keys(geo.attributes)) if(!['position','normal','uv'].includes(k)) geo.deleteAttribute(k);
      if(!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
      if(!by.has(o.material)) by.set(o.material,[]); by.get(o.material).push(geo); dead.push(o);
    });
    for(const o of dead){ o.parent.remove(o); if(!SHARED.has(o.geometry)) o.geometry.dispose(); }
    for(const [mat,list] of by){
      let merged=mergeGeometries(list);
      merged=weldGeometry(THREE, merged, mergeVertices);
      const m=new THREE.Mesh(merged, mat);
      if(mat && mat.side!==THREE.DoubleSide) mat.side=THREE.DoubleSide;
      g.add(m);
    }
    return g;
  }
  function carProfile(d){
    const L=d.L, zf=L/2, zr=-L/2, r=d.r, R=r+.06, AF=d.af*L, AR=d.ar*L, clr=d.clr;
    const fender=z=>{ if(d.noArch) return 0; let y=0; for(const a of [AF,AR]){ const u=(z-a)/(R*1.7); if(Math.abs(u)<1) y=Math.max(y, 2*r+.1-u*u*.25); } return y; };
    const P=[[zr+.06,clr+.22],[zr+.3,clr]];
    const arch=a=>{ if(d.noArch) return; P.push([a-R,clr]); for(let k=0;k<=8;k++){ const t=Math.PI*(1-k/8); P.push([a+R*Math.cos(t), r+R*Math.sin(t)*.98]); } P.push([a+R,clr]); };
    arch(AR); arch(AF);
    P.push([zf-.3,clr],[zf-.05,clr+.12],[zf,(clr+d.nose)/2]);
    const zc=d.cowl*L, zg=d.rg*L, br=d.beltRise||0;
    for(let k=0;k<=8;k++){ const t=k/8, z=zf-.04+(zc-(zf-.04))*t; const y=d.nose+(d.belt-d.nose)*(1-Math.pow(1-t,1.8)); P.push([z, Math.max(y, fender(z))]); }
    for(let k=1;k<=6;k++){ const z=zc+(zg-zc)*k/6; P.push([z, Math.max(d.belt+br*k/6, fender(z))]); }
    for(let k=1;k<=6;k++){ const t=k/6, z=zg+((zr+.05)-zg)*t; const y=d.belt+br+(d.tail-d.belt-br)*t; P.push([z, Math.max(y, fender(z))]); }
    P.push([zr,d.tail-.1]); return P;
  }
  function cabinProfile(d){
    const L=d.L, zc=d.cowl*L, zg=d.rg*L, zF=d.rf*L, zB=d.rb*L, b=d.belt-.04, H=d.roof;
    const P=[[zc+.05,b]];
    for(let k=1;k<=4;k++){ const t=k/4; P.push([zc+.05+(zF-zc-.05)*t, b+(H-.03-b)*Math.pow(t,.8)]); }
    for(let k=1;k<=4;k++){ const t=k/5; P.push([zF+(zB-zF)*t, H-.03+Math.sin(Math.PI*t)*.03]); }
    P.push([zB,H-.03]);
    for(let k=1;k<=4;k++){ const t=k/4; P.push([zB+(zg+.05-zB)*t, H-.03-(H-.03-b)*Math.pow(t,1.25)]); }
    return P;
  }

  function buildVehicle(d){
    const g=new THREE.Group(); const wheels=[]; const paint=d.type==='cyber'? (d.police? mkPaint(THREE,d.color) : MAT.steel.clone()) : mkPaint(THREE,d.color); const body=[paint];
    let lightBars=null;
    const mk=(geo,mat,x,y,z,o={})=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); if(o.rx) m.rotation.x=o.rx; if(o.ry) m.rotation.y=o.ry; if(o.rz) m.rotation.z=o.rz;
      if(o.part){ m.userData.part=o.part; if(o.part==='lightbar') m.userData.keep=true; } if(o.glass){ m.userData.glass=true; m.userData.keep=true; } (o.parent||g).add(m); return m; };
    const B=(w,h,l,mat,x,y,z,o={})=>mk(new THREE.BoxGeometry(w,h,l,o.seg?seg(w):1,o.seg?seg(h):1,o.seg?seg(l):1),mat,x,y,z,o);
    const C=(r1,r2,h,n,mat,x,y,z,axis,o={})=>{ const geo=new THREE.CylinderGeometry(r1,r2,h,n); if(axis==='x') geo.rotateZ(Math.PI/2); if(axis==='z') geo.rotateX(Math.PI/2); return mk(geo,mat,x,y,z,o); };
    const rimM=d.rim==='dark'?MAT.rimDark:d.rim==='gold'?MAT.rimGold:MAT.rim;
    const wheel=(x,z,r,w,o={})=>{ const pv=new THREE.Group(); pv.position.set(x,r,z); const sp=new THREE.Group(); pv.add(sp); sp.add(new THREE.Mesh(tireGeo(r,w),MAT.tire)); sp.add(new THREE.Mesh(rimGeo(r,w),o.rim||rimM));
      pv.userData={wheel:true, front:!!o.front, r, spin:sp, keep:true, noDent:true}; sp.traverse(c=>{ c.userData.noDent=true; c.userData.keep=true; }); g.add(pv); wheels.push(pv); return pv; };
    const slope=(z0,y0,z1,y1,w,mat,o={})=>{ const dz=z1-z0, dy=y1-y0, l=Math.hypot(dz,dy), off=o.off??.025; return B(w,.03,l*(o.k??.9),mat,0,(y0+y1)/2-dz/l*off,(z0+z1)/2+dy/l*off,{...o, rx:Math.atan2(-dy,dz)}); };
    const L=d.L, W=d.W, zf=L/2, zr=-L/2; let top=1.4;
    const t=d.type;
    if(['hyper','sport','sedan','suv','muscle','pickup','jeep','gwagon','police','monster'].includes(t)){
      let hold=g; if(d.lift){ hold=new THREE.Group(); hold.position.y=d.lift; g.add(hold); }
      const P={parent:hold};
      mk(sideExtrude(carProfile(d),W,.045,8),paint,0,0,0,P);
      let cabMat=paint; if(d.tesla) cabMat=MAT.gloss; else if(d.cab2){ cabMat=mkPaint(THREE,d.cab2); body.push(cabMat); }
      mk(sideExtrude(cabinProfile(d),W*d.cw,.07,4),cabMat,0,0,0,P);
      const zc=d.cowl*L, zg=d.rg*L, zF=d.rf*L, zB=d.rb*L, b=d.belt-.04, H=d.roof, cw=W*d.cw;
      B(cw*.86,Math.max(.2,H-b-.12),Math.max(.6,(zF-zB)+.5),MAT.interior,0,b+(H-b)/2-.04,(zF+zB)/2,P);
      slope(zc+.05,b,zF,H-.03,cw*.9,MAT.glass,{glass:true,parent:hold});
      if(d.rearGlass!==false) slope(zB,H-.03,zg+.05,b,cw*.86,MAT.glass,{glass:true,parent:hold,k:.86}); else slope(zB,H-.03,zg+.05,b,cw*.8,MAT.black,{parent:hold,k:.85});
      { const cp=cabinProfile(d); let cz=0, cy=0; for(const p of cp){ cz+=p[0]; cy+=p[1]; } cz/=cp.length; cy/=cp.length;
        const ip=cp.map(([z,y])=>[cz+(z-cz)*.86, Math.max(b+.07, cy+(y-cy)*.78)]);
        for(const s of [-1,1]) mk(sideExtrude(ip,.02,0,1),MAT.glass,s*(cw/2+.004),0,0,{glass:true,parent:hold}); }
      if(d.doors===2) B(cw+.03,H-b-.08,.09,MAT.black,0,(H+b)/2-.02,(zF+zB)/2+.15,P);
      const hy=d.nose-.06, hz=zf-.1;
      if(d.hl==='round') for(const s of [-1,1]) C(.12,.12,.08,16,MAT.head,s*(W/2-.34),hy+.04,hz-.04,'z',P);
      else if(d.hl==='stack' || d.ram){ for(const s of [-1,1]){ B(.42,.12,.12,MAT.head,s*(W/2-.4),hy+.08,hz,{...P}); B(.42,.1,.12,MAT.amber,s*(W/2-.4),hy-.08,hz,{...P}); } }
      else for(const s of [-1,1]) B(.46,.07,.16,MAT.head,s*(W/2-.36),hy,hz,{...P, ry:-s*.15});
      if(d.tl==='bar' || d.tesla) B(W*.86,.06,.06,MAT.tail,0,d.tail-.16,zr+.03,P); else for(const s of [-1,1]) B(.42,.1,.06,MAT.tail,s*(W/2-.3),d.tail-.16,zr+.03,P);
      if(d.ram){
        const gh=d.powerWagon?.62:.5, gy=d.nose-.28;
        B(W*(d.powerWagon?.72:.66),gh,.1,MAT.chrome,0,gy,zf+.03,{...P,part:'grille'});
        B(W*.62,.07,.05,MAT.black,0,gy,zf+.08,P);
        B(.08,gh*.88,.05,MAT.black,0,gy,zf+.08,P);
        const head=makeRamHead(THREE,MAT.chrome); head.position.set(0,gy,zf+.12); head.scale.setScalar(d.powerWagon?.9:.7); hold.add(head);
      } else if(d.grille && !d.tesla){ const tall=['pickup','jeep','gwagon','monster'].includes(t); B(W*(tall?.62:.5),tall?.42:.22,.06,tall?MAT.chrome:MAT.black,0,tall?d.nose-.3:d.clr+.32,zf+.005,P);
        if(t==='jeep') for(let i=-3;i<=3;i++) B(.07,.36,.07,MAT.black,i*.15,d.nose-.3,zf+.03,P); }
      B(W*.7,.12,.05,MAT.black,0,d.clr+.17,zf-.03,P);
      B(W*.78,.16,.12,MAT.black,0,d.clr+.1,zr+.08,P);
      if(d.intake) for(const s of [-1,1]) B(.04,.28,.6,MAT.black,s*(W/2+.005),d.belt-.25,d.ar*L+d.r+.55,P);
      if(!d.tesla) for(const s of (t==='hyper'?[-.15,.15]:[-1,1])) C(.05,.05,.2,10,MAT.chrome,s*.45,d.clr+.17,zr+.04,'z',P);
      if(d.winch || d.powerWagon){
        B(W*.98,.36,.42,MAT.black,0,d.clr+.2,zf+.12,{...P,part:'bumper',seg:true});
        B(W*.7,.14,.16,paint,0,d.clr+.36,zf+.16,{...P,part:'bumper'});
        C(.11,.11,.28,10,MAT.steel,0,d.clr+.18,zf+.34,'x',{...P,part:'winch'});
        B(.22,.16,.16,MAT.black,0,d.clr+.18,zf+.28,{...P,part:'winch'});
        B(.08,.1,.14,MAT.chrome,0,d.clr+.08,zf+.46,{...P,part:'hook'});
      } else B(W*.92,.2,.18,t==='police'||t==='pickup'||t==='jeep'||t==='monster'?MAT.black:paint,0,d.clr+.24,zf-.03,{...P,part:'bumper',seg:true});
      B(W*.92,.2,.16,t==='pickup'||t==='jeep'||t==='gwagon'||t==='monster'?MAT.black:paint,0,d.clr+.3,zr+.1,{...P,part:'bumper',seg:true});
      const AF=d.af*L, AR=d.ar*L, R=d.r+.06, dz0=AR+R+.1, dz1=AF-R-.1, y0=d.clr+.2, y1=d.belt-.06;
      if(dz1-dz0>.6 && y1-y0>.2){ const n=d.doors||1; for(const s of [-1,1]) for(let k=0;k<n;k++){ const a=dz0+(dz1-dz0)*k/n, c=dz0+(dz1-dz0)*(k+1)/n;
        B(.03,y1-y0,c-a-.04,t==='police'?body[1]:paint,s*(W/2+.012),(y0+y1)/2,(a+c)/2,{...P,part:'door',seg:true}); } }
      for(const s of [-1,1]) B(.2,.11,.16,t==='police'?MAT.black:paint,s*(cw/2+.13),b+.13,zc-.18,{...P,part:'mirror'});
      if(d.spoiler==='wing'){ for(const s of [-1,1]) B(.05,.26,.08,MAT.black,s*.5,d.tail+.1,zr+.36,P); B(W*.88,.04,.32,MAT.gloss,0,d.tail+.24,zr+.34,{...P,part:'spoiler'}); }
      else if(d.spoiler==='duck') B(W*.8,.05,.16,paint,0,d.tail+.02,zr+.12,{...P,rx:-.3});
      if(d.bar){ const rb=MAT.red.clone(), bb=MAT.blue.clone(); lightBars=[rb,bb]; B(.62,.13,.3,rb,-.32,H+.07,(zF+zB)/2,{...P,part:'lightbar'}); B(.62,.13,.3,bb,.32,H+.07,(zF+zB)/2,{...P,part:'lightbar'}); B(W*.6,.35,.08,MAT.black,0,d.clr+.35,zf+.08,{...P,part:'bumper'}); }
      if(d.bed){ B(W*.84,.03,(zg-zr)-.35,MAT.black,0,d.belt+.03,(zg+zr)/2-.05,P); }
      if(d.flares || d.dually || d.powerWagon) for(const s of [-1,1]){ B(.12,.16,R*2.3,MAT.black,s*(W/2+.05),2*d.r+.12,AF,P); B(d.dually?.24:.16,d.dually?.28:.18,R*2.6,MAT.black,s*(W/2+(d.dually?.12:.06)),2*d.r+.14,AR,{...P,part:'flare'}); }
      if(d.powerWagon){
        const ptex=powerWagonDecal(THREE, ANISO);
        const pmat=new THREE.MeshStandardMaterial({map:ptex, transparent:true, roughness:.55, side:THREE.DoubleSide});
        for(const s of [-1,1]){ const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.38), pmat); pl.position.set(s*(W/2+.03),d.belt+.05,(zg+zr)/2); pl.rotation.y=s*Math.PI/2; hold.add(pl); }
      }
      if(d.spare) C(d.r*.95,d.r*.95,.26,20,MAT.tire,0,d.belt-.15,zr-.15,'z',{...P,part:'spare'});
      top=H+(d.lift||0)+(d.bar?.15:0);
      if(t==='monster'){ B(1.1,.3,3.4,MAT.black,0,d.mr+.15,0); for(const s of [-1,1]) for(const a of [1.5,-1.5]) C(.08,.08,1.3,8,MAT.chrome,s*.75,d.mr+.6,a,null,{rz:s*.35});
        for(const z of [1.55,-1.55]) for(const s of [-1,1]) wheel(s*(W/2+.25),z,d.mr,.85,{front:z>0}); }
      else {
        const ww=t==='hyper'?.32:t==='pickup'||t==='jeep'||d.ram?.36:.27;
        for(const s of [-1,1]) wheel(s*(W/2-ww/2-.03),AF,d.r,ww,{front:true});
        if(d.dually){ const inner=W/2-ww-.06, outer=W/2+ww*.2; for(const s of [-1,1]){ wheel(s*inner,AR,d.r,ww); wheel(s*outer,AR,d.r,ww); } }
        else for(const s of [-1,1]) wheel(s*(W/2-ww/2-.03),AR,d.r,ww);
      }
    } else if(t==='cyber'){
      const r=d.r, R=r+.08, AF=d.af*L, AR=d.ar*L, clr=d.clr, belt=1.3, zap=-.05*L, ap=1.92;
      const P=[[zr+.02,.62],[zr+.12,clr]];
      for(const a of [AR,AF]) P.push([a-R-.08,clr],[a-R*.72,r+R*.82],[a+R*.72,r+R*.82],[a+R+.08,clr]);
      P.push([zf-.15,clr],[zf,.75],[zf+.02,1.05],[zf*.45,belt],[zr*.6,belt],[zr,1.32]);
      mk(sideExtrude(P,W,.012,8),paint,0,0,0);
      const yf=z=>1.05+(ap-1.05)*(zf-z)/(zf-zap), yr=z=>ap+(1.32-ap)*(zap-z)/(zap-zr);
      const U=[[zf*.45,belt-.02],[zap,ap],[zr,1.32],[zr*.6,belt-.02]];
      mk(sideExtrude(U,W*.9,.012,4),paint,0,0,0);
      B(W*.8,1.0,2.0,MAT.interior,0,belt+.25,.2);
      slope(zf*.42,yf(zf*.42)+.01,zap+.15,ap-.02,W*.82,MAT.glass,{glass:true,off:.02});
      { const z1=zf*.38, z2=zr*.25; const ip=[[z1,belt+.06],[z1,yf(z1)-.07],[zap,ap-.1],[z2,yr(z2)-.07],[z2,belt+.06]]; for(const s of [-1,1]) mk(sideExtrude(ip,.02,0,1),MAT.glass,s*(W*.45+.004),0,0,{glass:true}); }
      B(W*.96,.045,.06,MAT.head,0,1.04,zf+.03); B(W*.96,.05,.05,MAT.tail,0,1.29,zr-.01);
      for(const s of [-1,1]) B(.03,.55,1.5,paint,s*(W/2+.012),.95,AF-R-.95,{part:'door',seg:true});
      for(const s of [-1,1]) B(.03,.55,1.2,paint,s*(W/2+.012),.95,AR+R+.75,{part:'door',seg:true});
      B(W*.9,.25,.2,MAT.black,0,clr+.2,zf-.05,{part:'bumper',seg:true});
      for(const s of [-1,1]) B(.18,.1,.16,MAT.black,s*(W*.45+.12),belt+.18,zf*.38,{part:'mirror'});
      for(const a of [AF,AR]) for(const s of [-1,1]) wheel(s*(W/2-.2),a,r,.34,{front:a>0,rim:MAT.rimDark});
      if(d.police || d.bar){
        const rb=MAT.red.clone(), bb=MAT.blue.clone(); lightBars=[rb,bb];
        B(1.55,.1,.42,MAT.black,0,ap+.06,-.05*L);
        B(.68,.16,.34,rb,-.34,ap+.18,-.05*L,{part:'lightbar'}); B(.68,.16,.34,bb,.34,ap+.18,-.05*L,{part:'lightbar'});
        for(const s of [-1,1]) B(.035,.48,1.35,MAT.white,s*(W/2+.018),.98,AF-R-.9);
        const ptex=canvasTex(THREE, ANISO, 256,64,(c,w,h)=>{ c.fillStyle='#f4f4f4'; c.fillRect(0,0,w,h); c.fillStyle='#111'; c.font='bold 34px Arial Black,Arial'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('POLICE',w/2,h/2+2); });
        const pmat=new THREE.MeshStandardMaterial({map:ptex, roughness:.45, side:THREE.DoubleSide});
        for(const s of [-1,1]){ const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.3), pmat); pl.position.set(s*(W/2+.022),1.08,.05); pl.rotation.y=s*Math.PI/2; g.add(pl); }
      }
      top=ap+(d.bar||d.police?0.2:0);
    } else if(t==='semi' || t==='tsemi'){
      const aero=d.aero||t==='tsemi', trailerMat=new THREE.MeshPhysicalMaterial({color:0xf4f4f6, metalness:.3, roughness:.35, clearcoat:.6, side:THREE.DoubleSide}); body.push(trailerMat);
      B(1.1,.32,L-.4,MAT.black,0,.95,0);
      let zc, cabTop;
      if(t==='tsemi'){ const cp=[[zf,.85],[zf,1.75],[zf-.18,2.3],[zf-1.05,3.55],[zf-1.7,3.98],[zf-3.4,4.02],[zf-3.75,3.9],[zf-3.75,.85]]; mk(sideExtrude(cp,2.5,.14,6),paint,0,0,0);
        slope(zf-.2,2.32,zf-1.05,3.55,2.2,MAT.glass,{glass:true,off:.05}); for(const s of [-1,1]) B(.04,.8,.9,MAT.glass,s*1.26,2.8,zf-.85,{glass:true});
        B(2.3,.05,.06,MAT.head,0,1.76,zf+.03); B(2.2,.4,.06,MAT.black,0,1.2,zf+.01); zc=zf-3.75; cabTop=4.02;
        B(2.5,.36,.32,MAT.black,0,.75,zf-.1,{part:'bumper',seg:true}); }
      else { const hoodL=aero?2.4:3.1; zc=zf-.35-hoodL;
        if(aero){ B(2.0,1.15,hoodL,paint,0,1.72,zf-.35-hoodL/2,{seg:true}); B(2.0,.25,hoodL+.1,paint,0,2.35,zf-.35-hoodL/2,{rx:-.1}); B(1.5,1.05,.08,MAT.chrome,0,1.65,zf-.33); }
        else { B(1.45,1.25,hoodL,paint,0,1.85,zf-.35-hoodL/2,{seg:true}); B(1.3,1.2,.08,MAT.chrome,0,1.85,zf-.33); C(.08,.08,.5,8,MAT.chrome,0,2.6,zf-.5,'z'); }
        for(const s of [-1,1]){ if(aero) B(.4,.16,.12,MAT.head,s*.82,1.35,zf-.3); else C(.16,.16,.1,14,MAT.head,s*1.0,1.45,zf-.55,'z'); B(.55,.15,1.6,paint,s*1.0,1.2,zf-1.3); }
        B(2.5,.38,.32,MAT.chrome,0,.75,zf-.16,{part:'bumper',seg:true});
        const cabH=aero?2.0:1.85; B(2.45,cabH,2.1,paint,0,1.3+cabH/2,zc-1.05,{seg:true});
        B(2.2,.8,.06,MAT.glass,0,1.3+cabH-.55,zc+.04,{glass:true,rx:-.12}); for(const s of [-1,1]) B(.06,.7,.9,MAT.glass,s*1.235,1.3+cabH-.55,zc-.6,{glass:true});
        const slH=aero?2.5:2.25; B(2.5,slH,2.0,paint,0,1.3+slH/2,zc-2.1-1.0,{seg:true}); if(aero) B(2.45,.6,1.6,paint,0,1.3+cabH+.28,zc-1.0,{rx:.28});
        for(const s of [-1,1]) C(.12,.12,2.9,10,MAT.chrome,s*1.3,2.95,zc-2.05,null,{part:'stack'});
        zc=zc-2.1; cabTop=1.3+slH; }
      for(const s of [-1,1]){ C(.33,.33,1.3,14,MAT.chrome,s*1.05,.85,zc+.9,'z'); B(.08,.5,.2,MAT.chrome,s*1.45,2.5,zc+(t==='tsemi'?3.4:2.0),{part:'mirror'}); }
      const tFront=(t==='tsemi'?zf-4.5:zc-2.0-.7), tLen=tFront-zr;
      B(2.56,2.85,tLen,trailerMat,0,2.88,tFront-tLen/2,{seg:true}); B(2.58,.28,tLen-.4,paint,0,2.0,tFront-tLen/2);
      B(2.4,.25,tLen,MAT.black,0,1.33,tFront-tLen/2); B(2.5,.1,.08,MAT.tail,0,1.55,zr-.02); for(const s of [-1,1]) B(.08,2.6,.06,MAT.black,s*.02,2.88,zr-.02);
      for(const s of [-1,1]) C(.06,.06,1,6,MAT.black,s*.9,.75,tFront-2.5);
      const fa=t==='tsemi'?zf-1.2:zf-1.35, da=t==='tsemi'?zf-5.0:zc-.2;
      for(const s of [-1,1]){ wheel(s*1.02,fa,.52,.32,{front:true}); for(const a of [da,da-1.35]) wheel(s*.95,a,.52,.55); for(const a of [zr+1.4,zr+2.7]) wheel(s*.95,a,.52,.55); }
      top=1.3+2.85+.15;
    } else if(t==='fire'){
      const white=MAT.white;
      B(2.55,2.2,2.6,paint,0,2.05,zf-1.3,{seg:true}); B(2.56,.3,2.62,white,0,3.0,zf-1.3);
      B(2.3,1.0,.06,MAT.glass,0,2.45,zf+.01,{glass:true}); for(const s of [-1,1]){ B(.06,.8,1.0,MAT.glass,s*1.28,2.45,zf-.7,{glass:true}); B(.06,.7,.8,MAT.glass,s*1.28,2.45,zf-2.0,{glass:true}); }
      B(1.3,.75,.06,MAT.chrome,0,1.45,zf+.02); for(const s of [-1,1]) B(.35,.2,.06,MAT.head,s*.95,1.45,zf+.02);
      B(2.6,.35,.3,MAT.chrome,0,.8,zf+.1,{part:'bumper',seg:true});
      B(2.0,.22,.4,MAT.red,0,3.27,zf-.5,{part:'lightbar'});
      const bl=L-2.8; B(2.55,2.1,bl,paint,0,2.0,zf-2.7-bl/2,{seg:true});
      for(const s of [-1,1]) for(let k=0;k<4;k++) B(.04,1.4,1.6,MAT.chrome,s*1.29,2.0,zf-3.6-k*1.85,{part:k%2?'door':undefined});
      B(2.58,.16,L-.2,white,0,1.25,0);
      for(const s of [-1,1]) B(.1,.12,8.8,MAT.chrome,s*.5,3.35,-.6,{part:'ladder'});
      for(let z=-4.8; z<3.9; z+=.5) B(1.0,.06,.06,MAT.chrome,0,3.35,z);
      C(.7,.7,.4,16,MAT.chrome,0,3.15,-4.3); B(2.5,.1,.06,MAT.tail,0,1.4,zr-.02);
      for(const s of [-1,1]){ wheel(s*1.0,zf-1.4,.55,.36,{front:true}); for(const a of [-2.7,-4.0]) wheel(s*.95,a,.55,.55); }
      top=3.45;
    }
    bake(g);
    g.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=false; if(o.material && o.material.side!==THREE.DoubleSide && !o.userData.noDent) o.material.side=THREE.DoubleSide; } });
    g.userData={wheels, body, top, bars:lightBars};
    return g;
  }

  return { MAT, SHARED, bake, buildVehicle, carProfile, cabinProfile, sideExtrude, mkPaint:(c)=>mkPaint(THREE,c) };
}

// Rail City crush/wreck kernel. Crash Test passes heavy>1 and fold>0 for smash-lab dents.
// Welded vertices move together so damage folds instead of opening holes.
export function wreckDeform(THREE, ctx, e, wpt, wdir, sev, opts={}){
  const { clamp, h3, _gi, _p, _m4, _mi } = ctx;
  const V3 = THREE.Vector3;
  const heavy = opts.heavy==null ? 1 : opts.heavy;
  const fold = opts.fold==null ? 0 : opts.fold;
  const k=sev*Math.max(.3, 1-e.crush*.7);
  e.G.updateMatrixWorld(true); _gi.copy(e.g.matrixWorld).invert();
  const p=wpt.clone().applyMatrix4(_gi), dd=wdir.clone().transformDirection(_gi); dd.y=0; if(dd.lengthSq()<1e-6) dd.set(1,0,0); dd.normalize(); const q=new V3(-dd.z,0,dd.x);
  const L=e.L, W=e.W, H=e.top, belt=Math.min(H*.75,(e.def.belt||H*.5)+(e.def.lift||0));
  const sideF=Math.abs(dd.x), ext=sideF*W+(1-sideF)*L, bend=opts.bend??1;
  const C=k*(sideF*W*.5+(1-sideF)*Math.min(L*.3,2.4))*heavy;
  const Bd=k*(sideF*1.6+(1-sideF)*.5)*bend*(e.def.big?.7:1)*heavy*(1+fold*1.4);
  const span=(sideF*L+(1-sideF)*W)*.45+.4;
  const roofDrop=k*(H-belt)*.62*heavy*(1+fold*.5);
  const up=(1-sideF)*k*.4;
  const frontHit=Math.max(0, -dd.z);
  const rearHit=Math.max(0, dd.z);
  const roofTo=opts.roofTo, hoodTo=opts.hoodTo, split=opts.split||0;
  const deform=v=>{
    const rx=v.x-p.x, rz=v.z-p.z, t=rx*dd.x+rz*dd.z, s=rx*q.x+rz*q.z, lat=Math.exp(-2*(s/span)*(s/span)), tt=clamp(1-t/ext,0,1);
    const n1=h3(v.x*1.3,v.y*1.6,v.z*1.2)-.5, n2=h3(v.z*1.1,v.x*1.4,v.y*1.7)-.5, n3=h3(v.y*1.2,v.z*1.5,v.x*.9)-.5;
    const push=C*Math.pow(tt,1.15)*(.35+.65*lat)+Bd*lat, jit=k*(.05+.16*tt*lat)*Math.min(1.4, heavy);
    v.x+=dd.x*push+n1*jit; v.z+=dd.z*push+n3*jit;
    let dy=n2*jit*.7; if(v.y>belt) dy-=roofDrop*(.4+.6*lat)*clamp((v.y-belt)/(H-belt+.01),0,1);
    dy+=up*tt*lat*Math.max(0,1-t/1.8)*(v.y>belt*.6?1:.3);
    if(frontHit>.25 && v.z>0){
      const hood=Math.pow(clamp(v.z/(L*.5),0,1),1.15)*frontHit;
      v.z-=hood*k*heavy*1.55;
      if(v.y>belt*.42) dy-=hood*k*heavy*.95;
    }
    if(rearHit>.25 && v.z<0){
      const tail=Math.pow(clamp(-v.z/(L*.5),0,1),1.15)*rearHit;
      v.z+=tail*k*heavy*1.15;
    }
    if(fold>0){
      const wrap=fold*k*heavy*lat*Math.pow(tt,.75);
      v.x+=q.x*wrap*Math.sign(s||1)*Math.min(2.2, Math.abs(s)*.55+wrap*.8);
      v.z+=dd.z*wrap*.65;
      dy-=wrap*.45;
    }
    if(split>0){
      const away=Math.sign(s||v.x||1);
      const slit=split*k*heavy*Math.pow(tt,.7);
      v.x+=away*slit*(.55+Math.abs(s)*.4);
      v.z+=dd.z*slit*.85;
      if(Math.abs(s)<.42){ v.x+=away*slit*1.05; dy-=slit*.4; }
    }
    if(sideF>.55){
      const sideCrush=k*heavy*lat*tt*1.15;
      v.x+=dd.x*sideCrush*.55;
    }
    if(roofTo!=null && v.y>roofTo){
      dy-=(v.y-roofTo)*(0.62+0.5*k*heavy);
    }
    if(hoodTo!=null && v.z>0 && v.y>hoodTo){
      const hood=Math.pow(clamp(v.z/(L*.5),0,1),1.05);
      dy-=(v.y-hoodTo)*hood*(0.7+0.55*k*heavy);
      v.z-=hood*k*heavy*1.1;
    }
    v.y=Math.max(.04, v.y+dy);
    if(roofTo!=null) v.y=Math.min(v.y, roofTo+Math.max(.02,(v.y-roofTo)*0.18));
    if(hoodTo!=null && v.z>L*.08) v.y=Math.min(v.y, hoodTo+Math.max(.04,(v.y-hoodTo)*0.22));
  };
  const meshes=[]; e.g.traverse(o=>{ if(o.isMesh) meshes.push(o); });
  const glass=[];
  for(const m of meshes){
    if(m.userData.glass){ glass.push(m); continue; }
    if(m.userData.noDent) continue;
    _m4.multiplyMatrices(_gi,m.matrixWorld); _mi.copy(_m4).invert(); const pa=m.geometry.attributes.position;
    for(let i=0;i<pa.count;i++){ _p.fromBufferAttribute(pa,i).applyMatrix4(_m4); deform(_p); _p.applyMatrix4(_mi); pa.setXYZ(i,_p.x,_p.y,_p.z); }
    pa.needsUpdate=true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere();
  }
  return { k, p, dd, glass, deform };
}

export function popChance(part, sev, dist, isW, wheelCount, heavy=1){
  let ch=isW?(sev>.55?.7:sev>.28?.4:sev*.25):(sev>.35?.95:sev>.18?.7:sev*.7);
  if(part==='door' || part==='bumper' || part==='mirror' || part==='grille') ch=Math.min(1, ch*(1.15+heavy*.35));
  if(dist<2.4) ch*=1.55; else if(dist>4.5) ch*=.55;
  if(isW && wheelCount<=2) ch=0;
  return Math.min(1, ch);
}

export function makeDummy(THREE, MAT, scale=1){
  const g = new THREE.Group();
  const B = (w,h,d,mat,x,y,z,parent=g)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(x,y,z); parent.add(m); return m;
  };
  const torso = new THREE.Group(); torso.position.set(0,.72,0); g.add(torso);
  B(.28,.34,.18, MAT.dummySuit, 0,0,0, torso);
  B(.08,.06,.04, MAT.dummyDark, 0,.08,.1, torso);
  B(.08,.06,.04, MAT.dummyDark, 0,-.04,.1, torso);
  const head = new THREE.Group(); head.position.set(0,.28,0); torso.add(head);
  B(.2,.2,.2, MAT.dummySkin, 0,0,0, head);
  for(const s of [-1,1]) B(.04,.04,.03, MAT.dummyDark, s*.05,.02,.1, head);
  const limbs = [];
  for(const [x,z,len] of [[-.2,.02,.32],[.2,.02,.32]]){
    const arm = new THREE.Group(); arm.position.set(x,.08,z); torso.add(arm);
    B(.1,len,.1, MAT.dummySuit, 0,-len/2,0, arm);
    limbs.push(arm);
  }
  for(const [x] of [[-.1],[.1]]){
    const leg = new THREE.Group(); leg.position.set(x,.52,0); g.add(leg);
    B(.11,.42,.12, MAT.dummyDark, 0,-.22,0, leg);
    B(.12,.06,.16, MAT.dummyDark, 0,-.44,.02, leg);
    limbs.push(leg);
  }
  g.scale.setScalar(scale);
  g.userData = {head, torso, limbs};
  return g;
}
