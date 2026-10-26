// Shared arcade roster + Minecraft-style blocky builders.
// Same names/stats as Rail City 3D, plus Ram pickups (1500, 3500 dually, 2015 Power Wagon).
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

export function createMats(THREE){
  return {
    tire:new THREE.MeshStandardMaterial({color:0x141416, roughness:.85, flatShading:true}),
    rim:new THREE.MeshStandardMaterial({color:0xc9cdd2, metalness:1, roughness:.2, flatShading:true}),
    rimDark:new THREE.MeshStandardMaterial({color:0x2a2c30, metalness:.9, roughness:.3, flatShading:true}),
    rimGold:new THREE.MeshStandardMaterial({color:0xc9a040, metalness:1, roughness:.25, flatShading:true}),
    glass:new THREE.MeshStandardMaterial({color:0x0b131b, metalness:.2, roughness:.08, transparent:true, opacity:.72, flatShading:true}),
    black:new THREE.MeshStandardMaterial({color:0x111214, roughness:.55, flatShading:true}),
    gloss:new THREE.MeshStandardMaterial({color:0x050607, metalness:.35, roughness:.12, flatShading:true}),
    chrome:new THREE.MeshStandardMaterial({color:0xe6e9ed, metalness:1, roughness:.12, flatShading:true}),
    head:new THREE.MeshStandardMaterial({color:0xffffff, emissive:0xfff4d6, emissiveIntensity:2.2, flatShading:true}),
    tail:new THREE.MeshStandardMaterial({color:0x550000, emissive:0xff1010, emissiveIntensity:1.8, flatShading:true}),
    amber:new THREE.MeshStandardMaterial({color:0x553300, emissive:0xff9000, emissiveIntensity:1.6, flatShading:true}),
    interior:new THREE.MeshStandardMaterial({color:0x1d1a17, roughness:.9, flatShading:true}),
    steel:new THREE.MeshStandardMaterial({color:0xb8bdc2, metalness:1, roughness:.33, flatShading:true}),
    white:new THREE.MeshStandardMaterial({color:0xf0f0f0, roughness:.45, flatShading:true}),
    red:new THREE.MeshStandardMaterial({color:0xff2020, emissive:0xff0000, emissiveIntensity:1.5, flatShading:true}),
    blue:new THREE.MeshStandardMaterial({color:0x2040ff, emissive:0x0030ff, emissiveIntensity:1.5, flatShading:true}),
    dummySkin:new THREE.MeshStandardMaterial({color:0xe8d4a8, roughness:.92, flatShading:true}),
    dummySuit:new THREE.MeshStandardMaterial({color:0xf2d24b, roughness:.88, flatShading:true}),
    dummyDark:new THREE.MeshStandardMaterial({color:0x1a1a1c, roughness:.7, flatShading:true}),
  };
}

export function mkPaint(THREE, c){
  return new THREE.MeshStandardMaterial({color:c, metalness:.38, roughness:.42, flatShading:true});
}

function segs(n){ return Math.max(1, Math.min(16, Math.ceil(n/.32))); }

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

// Blocky Minecraft-style car. Extra segments on hood/bumper so crumple zones fold.
export function buildBlockyVehicle(THREE, d, MAT, opts={}){
  const ANISO = opts.aniso || 1;
  const g = new THREE.Group();
  const wheels = [];
  const paint = d.type==='cyber' ? (d.police ? mkPaint(THREE,d.color) : MAT.steel.clone()) : mkPaint(THREE,d.color);
  const body = [paint];
  let lightBars = null;
  const lift = d.lift || 0;
  const hold = lift ? new THREE.Group() : g;
  if(lift){ hold.position.y = lift; g.add(hold); }

  const mk = (geo, mat, x, y, z, o={})=>{
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x,y,z);
    if(o.rx) m.rotation.x=o.rx; if(o.ry) m.rotation.y=o.ry; if(o.rz) m.rotation.z=o.rz;
    if(o.part){ m.userData.part=o.part; if(o.part==='lightbar') m.userData.keep=true; }
    if(o.glass){ m.userData.glass=true; m.userData.keep=true; }
    (o.parent||hold).add(m); return m;
  };
  const B = (w,h,l,mat,x,y,z,o={})=>{
    const sw=o.seg?segs(w):1, sh=o.seg?segs(h):1;
    const sl = o.crumple ? Math.max(6, segs(l*.55)) : (o.seg?segs(l):1);
    return mk(new THREE.BoxGeometry(w,h,l,sw,sh,sl), mat, x,y,z,o);
  };
  const rimM = d.rim==='dark'?MAT.rimDark:d.rim==='gold'?MAT.rimGold:MAT.rim;
  const wheel = (x,z,r,w,o={})=>{
    const pv=new THREE.Group(); pv.position.set(x, r+(o.y||0), z);
    const sp=new THREE.Group(); pv.add(sp);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r,r,w,10,1).rotateZ(Math.PI/2), MAT.tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,w+.04,8).rotateZ(Math.PI/2), o.rim||rimM);
    sp.add(tire); sp.add(rim);
    if(d.knobby){
      for(let i=0;i<8;i++){
        const kn = new THREE.Mesh(new THREE.BoxGeometry(w+.04, r*.22, r*.16), MAT.tire);
        kn.rotation.x = i*Math.PI/4; kn.position.y = 0; kn.translateY(r*.92);
        sp.add(kn);
      }
    }
    pv.userData={wheel:true, front:!!o.front, r, spin:sp, keep:true, noDent:true};
    sp.traverse(c=>{ c.userData.noDent=true; c.userData.keep=true; });
    g.add(pv); wheels.push(pv); return pv;
  };

  const L=d.L, W=d.W, zf=L/2, zr=-L/2;
  const t=d.type;
  let top = d.roof || 1.5;

  function ramGrille(y, z, w, h){
    B(w, h, .1, MAT.chrome, 0, y, z, {part:'grille'});
    B(w*.92, .07, .05, MAT.black, 0, y, z+.06);
    B(.08, h*.88, .05, MAT.black, 0, y, z+.06);
    const head = makeRamHead(THREE, MAT.chrome);
    head.position.set(0, y, z+.11);
    head.scale.setScalar(h> .45 ? .85 : .65);
    hold.add(head);
  }

  function winchBumper(){
    const y = d.clr + .18;
    B(W*.98, .38, .42, MAT.black, 0, y, zf+.12, {part:'bumper', crumple:true, seg:true});
    B(W*.7, .16, .18, paint, 0, y+.16, zf+.18, {part:'bumper'});
    // Warn winch drum + hook
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.28,10).rotateZ(Math.PI/2), MAT.steel);
    drum.position.set(0, y+.02, zf+.36); drum.userData.part='winch'; hold.add(drum);
    B(.22,.16,.16, MAT.black, 0, y+.02, zf+.3, {part:'winch'});
    const hook = new THREE.Mesh(new THREE.BoxGeometry(.08,.1,.14), MAT.chrome);
    hook.position.set(0, y-.08, zf+.46); hook.userData.part='hook'; hold.add(hook);
    B(.04,.18,.04, MAT.steel, 0, y-.02, zf+.42, {part:'winch'});
  }

  if(['hyper','sport','sedan','suv','muscle','pickup','jeep','gwagon','police','monster'].includes(t)){
    const hoodL = L * (t==='pickup'||t==='jeep'||t==='gwagon' ? .28 : t==='hyper'||t==='sport' ? .34 : .30);
    const cabL = L * (d.bed ? .28 : t==='hyper'||t==='sport' ? .42 : .40);
    const bedL = d.bed ? L - hoodL - cabL - .15 : 0;
    const bodyH = Math.max(.55, (d.belt||1.0) - (d.clr||.2));
    const cabinH = Math.max(.45, (d.roof||1.5) - (d.belt||1.0));
    const y0 = (d.clr||.2) + bodyH/2;
    const hoodZ = zf - hoodL/2;
    const cabZ = hoodZ - hoodL/2 - cabL/2;
    const bedZ = cabZ - cabL/2 - bedL/2;

    B(W, bodyH, hoodL, paint, 0, y0, hoodZ, {seg:true, crumple:true, part:'hood'});
    B(W, bodyH*.55, .28, t==='pickup'||t==='jeep'||d.ram ? MAT.black : paint, 0, (d.clr||.2)+.14, zf-.04, {part:'bumper', crumple:true, seg:true});
    B(W*(d.cw||.8), cabinH, cabL, d.tesla?MAT.gloss:(d.cab2?mkPaint(THREE,d.cab2):paint), 0, (d.belt||1)+cabinH/2-.04, cabZ, {seg:true});
    if(d.cab2) body.push(hold.children[hold.children.length-1].material);
    B(W*(d.cw||.8)*.86, cabinH*.55, cabL*.7, MAT.interior, 0, (d.belt||1)+cabinH/2-.08, cabZ);
    B(W*(d.cw||.8)*.88, .06, cabL*.7, MAT.glass, 0, (d.belt||1)+cabinH*.82, cabZ+.02, {glass:true});
    B(W*(d.cw||.8)*.7, cabinH*.45, .06, MAT.glass, 0, (d.belt||1)+cabinH*.45, cabZ+cabL/2-.02, {glass:true});
    if(d.rearGlass!==false) B(W*(d.cw||.8)*.7, cabinH*.4, .06, MAT.glass, 0, (d.belt||1)+cabinH*.4, cabZ-cabL/2+.02, {glass:true});
    for(const s of [-1,1]) B(.04, cabinH*.5, cabL*.55, MAT.glass, s*(W*(d.cw||.8)/2+.01), (d.belt||1)+cabinH*.4, cabZ, {glass:true});

    if(d.bed){
      B(W, bodyH*.85, bedL, paint, 0, y0-.04, bedZ, {seg:true, part:'bed'});
      B(W*.9, .06, bedL*.92, MAT.black, 0, (d.belt||1.2)+.02, bedZ);
      B(W*.92, bodyH*.7, .08, paint, 0, y0, zr+.06, {part:'tailgate'});
    } else {
      B(W, bodyH*.9, Math.max(.4, L-hoodL-cabL), paint, 0, y0, (cabZ-cabL/2 + zr)/2, {seg:true});
    }

    if(d.hl==='round') for(const s of [-1,1]) mk(new THREE.BoxGeometry(.22,.22,.1), MAT.head, s*(W/2-.36), y0+.05, zf+.02);
    else if(d.hl==='stack' || d.ram){
      for(const s of [-1,1]){
        B(.42,.16,.1, MAT.head, s*(W/2-.42), y0+.18, zf+.04);
        B(.42,.14,.1, MAT.amber, s*(W/2-.42), y0-.02, zf+.04);
      }
    } else for(const s of [-1,1]) B(.46,.1,.1, MAT.head, s*(W/2-.36), y0+.08, zf+.02);

    if(d.tl==='bar' || d.tesla) B(W*.86,.08,.08, MAT.tail, 0, y0, zr-.02);
    else for(const s of [-1,1]) B(.42,.12,.08, MAT.tail, s*(W/2-.3), y0, zr-.02);

    if(d.ram) ramGrille(y0+.08, zf+.06, W*(d.powerWagon?.72:.66), d.powerWagon?.62:.5);
    else if(d.grille && !d.tesla) B(W*.55, t==='pickup'||t==='jeep'?.42:.22, .08, MAT.chrome, 0, y0, zf+.03, {part:'grille'});

    if(d.winch || d.powerWagon) winchBumper();

    if(d.spoiler==='wing'){ for(const s of [-1,1]) B(.05,.26,.08, MAT.black, s*.5, (d.tail||1)+.1, zr+.2); B(W*.88,.06,.3, MAT.gloss, 0, (d.tail||1)+.24, zr+.18, {part:'spoiler'}); }
    else if(d.spoiler==='duck') B(W*.8,.06,.16, paint, 0, (d.tail||1)+.02, zr+.1, {rx:-.3});

    if(d.bar){
      const rb=MAT.red.clone(), bb=MAT.blue.clone(); lightBars=[rb,bb];
      B(.62,.14,.3, rb, -.32, (d.roof||1.45)+.1, cabZ, {part:'lightbar'});
      B(.62,.14,.3, bb, .32, (d.roof||1.45)+.1, cabZ, {part:'lightbar'});
    }

    if(d.flares || d.dually || d.powerWagon){
      const AF=d.af*L, AR=d.ar*L, R=d.r+.1;
      for(const s of [-1,1]){
        B(.14,.18,R*2.2, MAT.black, s*(W/2+.05), 2*d.r*.45+lift*.1, AF, {part:'flare'});
        B(d.dually?.24:.16, d.dually?.3:.2, R*2.5, MAT.black, s*(W/2+(d.dually?.12:.06)), 2*d.r*.5+lift*.1, AR, {part:'flare'});
      }
    }

    if(d.powerWagon){
      const tex = powerWagonDecal(THREE, ANISO);
      const pmat = new THREE.MeshStandardMaterial({map:tex, transparent:true, roughness:.55, flatShading:true});
      for(const s of [-1,1]){
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(bedL*.9, .38), pmat);
        pl.position.set(s*(W/2+.03), y0+.08, bedZ);
        pl.rotation.y = s*Math.PI/2;
        pl.userData.keep = true;
        hold.add(pl);
      }
    }

    if(d.spare) mk(new THREE.CylinderGeometry(d.r*.9,d.r*.9,.22,10).rotateX(Math.PI/2), MAT.tire, 0, (d.belt||1)-.1, zr-.12, {part:'spare'});

    const AF=d.af*L, AR=d.ar*L;
    const ww = t==='hyper'?.32: t==='pickup'||t==='jeep'||d.ram?.36:.28;
    if(t==='monster'){
      B(1.1,.3,3.4, MAT.black, 0, (d.mr||1)+.15, 0);
      for(const z of [1.55,-1.55]) for(const s of [-1,1]) wheel(s*(W/2+.25), z, d.mr||1, .85, {front:z>0});
    } else {
      for(const s of [-1,1]) wheel(s*(W/2-ww/2-.03), AF, d.r, ww, {front:true});
      if(d.dually){
        const inner = W/2 - ww - .06;
        const outer = W/2 + ww*.2;
        for(const s of [-1,1]){ wheel(s*inner, AR, d.r, ww); wheel(s*outer, AR, d.r, ww); }
      } else {
        for(const s of [-1,1]) wheel(s*(W/2-ww/2-.03), AR, d.r, ww);
      }
    }
    top = (d.roof||1.5) + lift + (d.bar? .18:0);
  } else if(t==='cyber'){
    B(W, 1.15, L, paint, 0, .95, 0, {seg:true, crumple:true});
    B(W*.9, .08, L*.55, MAT.glass, 0, 1.62, .15, {glass:true, rx:-.18});
    B(W*.96, .08, .1, MAT.head, 0, 1.05, zf+.02);
    B(W*.96, .08, .08, MAT.tail, 0, 1.2, zr-.02);
    for(const a of [d.af*L, d.ar*L]) for(const s of [-1,1]) wheel(s*(W/2-.2), a, d.r, .34, {front:a>0, rim:MAT.rimDark});
    if(d.police || d.bar){
      const rb=MAT.red.clone(), bb=MAT.blue.clone(); lightBars=[rb,bb];
      B(.68,.16,.34, rb, -.34, 2.05, -.2, {part:'lightbar'});
      B(.68,.16,.34, bb, .34, 2.05, -.2, {part:'lightbar'});
    }
    top = 1.95 + (d.bar||d.police?0.2:0);
  } else if(t==='semi' || t==='tsemi'){
    const trailer = mkPaint(THREE, 0xf4f4f6); body.push(trailer);
    if(t==='tsemi'){
      B(2.5, 3.1, 3.6, paint, 0, 2.2, zf-1.9, {seg:true, crumple:true});
      B(2.2, .9, .08, MAT.glass, 0, 2.9, zf-.05, {glass:true});
      B(2.3, .08, .08, MAT.head, 0, 1.7, zf+.02);
    } else {
      B(2.0, 1.2, 2.8, paint, 0, 1.7, zf-1.5, {seg:true, crumple:true});
      B(2.45, 2.0, 2.1, paint, 0, 2.3, zf-3.6, {seg:true});
      B(2.2, .8, .08, MAT.glass, 0, 2.7, zf-2.5, {glass:true});
      B(2.5, .38, .32, MAT.chrome, 0, .75, zf-.1, {part:'bumper', crumple:true});
    }
    const tFront = t==='tsemi' ? zf-4.5 : zf-5.2;
    const tLen = tFront - zr;
    B(2.56, 2.85, tLen, trailer, 0, 2.88, tFront-tLen/2, {seg:true});
    B(2.5, .1, .08, MAT.tail, 0, 1.55, zr-.02);
    const fa=t==='tsemi'?zf-1.2:zf-1.35, da=t==='tsemi'?zf-5.0:zf-4.2;
    for(const s of [-1,1]){
      wheel(s*1.02, fa, .52, .32, {front:true});
      for(const a of [da, da-1.35]) wheel(s*.95, a, .52, .55);
      for(const a of [zr+1.4, zr+2.7]) wheel(s*.95, a, .52, .55);
    }
    top = 4.2;
  } else if(t==='fire'){
    B(2.55, 2.2, 2.6, paint, 0, 2.05, zf-1.3, {seg:true, crumple:true});
    B(2.3, 1.0, .08, MAT.glass, 0, 2.45, zf+.01, {glass:true});
    B(2.55, 2.1, L-2.8, paint, 0, 2.0, zr+(L-2.8)/2, {seg:true});
    B(2.0, .22, .4, MAT.red, 0, 3.27, zf-.5, {part:'lightbar'});
    for(const s of [-1,1]) B(.1,.12,8.8, MAT.chrome, s*.5, 3.35, -.6, {part:'ladder'});
    for(const s of [-1,1]){ wheel(s*1.0, zf-1.4, .55, .36, {front:true}); for(const a of [-2.7,-4.0]) wheel(s*.95, a, .55, .55); }
    top = 3.5;
  }

  g.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=false; } });
  g.userData = {wheels, body, top, bars:lightBars};
  return g;
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
