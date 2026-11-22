// Cat Life City 3D extras: walk-in mart, buses, Haul-It moving truck,
// fire/hospital, pedestrians, pool. Shared materials, simple boxes for iPad.

export function installCatLifeKit(THREE, helpers){
  const { mat, box, addOb, WMAT, worldRoot, label } = helpers;

  function B(w,h,d,m,x,y,z,parent){
    return box(w,h,d,m,x,y,z,parent||worldRoot);
  }
  function cyl(r,h,m,x,y,z,parent,seg=10){
    const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg), m);
    o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true;
    (parent||worldRoot).add(o); return o;
  }
  function sph(r,m,x,y,z,parent,seg=10){
    const o=new THREE.Mesh(new THREE.SphereGeometry(r,seg,seg), m);
    o.position.set(x,y,z); o.castShadow=true; (parent||worldRoot).add(o); return o;
  }
  function canvasTex(w,h,draw){
    const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.needsUpdate=true; return t;
  }
  function planeTex(tex,w,h,x,y,z,parent,ry=0){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
    m.position.set(x,y,z); m.rotation.y=ry; (parent||worldRoot).add(m); return m;
  }

  function makePerson(outfit, x, y, z, parent){
    const g=new THREE.Group();
    const skin=mat(0xf0d0b0), hair=mat(outfit.hair||0x3b2a1a), cloth=mat(outfit.cloth||0x3a6ea5), pants=mat(outfit.pants||0x2a3344);
    B(.34,.42,.22, cloth, 0,.92,0, g);
    sph(.16, skin, 0,1.24,0, g, 8);
    B(.28,.12,.28, hair, 0,1.36,0, g);
    B(.12,.38,.12, cloth, -.2,.9,0, g);
    B(.12,.38,.12, cloth, .2,.9,0, g);
    B(.14,.46,.16, pants, -.08,.38,0, g);
    B(.14,.46,.16, pants, .08,.38,0, g);
    B(.14,.06,.2, mat(0x222226), -.08,.08,.02, g);
    B(.14,.06,.2, mat(0x222226), .08,.08,.02, g);
    g.position.set(x,y,z);
    g.userData.legs=[g.children[5], g.children[6]];
    (parent||worldRoot).add(g);
    return g;
  }

  function makeWheel(parent, x, y, z, r=.38, w=.22){
    const g=new THREE.Group();
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(r,r,w,12), mat(0x161618));
    tire.rotation.z=Math.PI/2; g.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,w+.04,10), mat(0xc8cdd2,'shiny'));
    rim.rotation.z=Math.PI/2; g.add(rim);
    g.position.set(x,y,z); parent.add(g);
    g.userData={spin:g, r, front:false};
    return g;
  }

  function makeBusMesh(){
    const g=new THREE.Group();
    const paint=mat(0x2a6cff), stripe=mat(0xffd21e), dark=mat(0x1a1c22), glass=WMAT.glassB||mat(0x9fd4ff);
    B(2.6,2.35,9.4, paint, 0,1.55,0, g);
    B(2.64,.22,9.44, stripe, 0,.72,0, g);
    B(2.5,.7,.08, glass, 0,1.85,4.72, g);
    for(const s of [-1,1]){
      for(let i=0;i<4;i++) B(.06,.7,1.35, glass, s*1.32,1.85,2.6-i*1.7, g);
    }
    B(2.62,.12,9.42, dark, 0,2.74,0, g);
    B(1.1,.18,2.2, mat(0x111114), 0,.42,4.2, g);
    const wheels=[];
    for(const s of [-1,1]){
      wheels.push(makeWheel(g, s*1.15, .38, 3.1, .38,.24));
      wheels.push(makeWheel(g, s*1.15, .38, -3.15, .38,.24));
    }
    const sign=canvasTex(512,128,(c,w,h)=>{
      c.fillStyle='#1a1c22'; c.fillRect(0,0,w,h);
      c.fillStyle='#ffd21e'; c.font='bold 52px Arial Black,Arial'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText('CITY BUS', w/2, h/2);
    });
    planeTex(sign, 4.6, 1.05, 0, 2.42, 4.74, g);
    for(const s of [-1,1]) planeTex(sign, 4.2, .9, s*1.34, 2.35, 0, g, s*Math.PI/2);
    g.userData={wheels, L:9.6, W:2.7, top:2.8};
    return g;
  }

  function makeHaulRig(){
    const truck=new THREE.Group();
    const orange=mat(0xff7a1a), white=mat(0xf4f4f6), dark=mat(0x1c1e24), chrome=mat(0xd0d5da,'shiny');
    B(2.45,1.55,2.4, orange, 0,1.35,3.55, truck);
    B(2.2,.7,.08, WMAT.glassB||mat(0x9fd4ff), 0,1.7,4.76, truck);
    B(2.5,2.55,6.2, orange, 0,2.05, -.15, truck);
    B(2.54,.28,6.24, white, 0,1.15, -.15, truck);
    B(2.52,.12,6.22, dark, 0,3.35, -.15, truck);
    const logo=canvasTex(512,160,(c,w,h)=>{
      c.fillStyle='#ff7a1a'; c.fillRect(0,0,w,h);
      c.fillStyle='#fff'; c.font='bold 64px Arial Black,Arial'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText('HAUL-IT', w/2, h/2-8);
      c.font='bold 28px Arial'; c.fillText('BOX + TRAILER', w/2, h/2+42);
    });
    for(const s of [-1,1]) planeTex(logo, 4.6, 1.4, s*1.28, 2.15, -.2, truck, s*Math.PI/2);
    planeTex(logo, 3.6, 1.1, 0, 2.35, 2.96, truck);
    const wheels=[];
    for(const s of [-1,1]){
      wheels.push(makeWheel(truck, s*1.1, .4, 3.5, .4,.26));
      wheels.push(makeWheel(truck, s*1.1, .4, .4, .4,.26));
      wheels.push(makeWheel(truck, s*1.1, .4, -2.4, .4,.26));
    }
    B(2.2,.18,.18, chrome, 0,.7,4.82, truck);
    truck.userData={wheels, L:8.8, W:2.6, top:3.4};

    const trailer=new THREE.Group();
    B(2.35,.22,6.4, mat(0x4a4e56), 0,.55,0, trailer);
    for(const s of [-1,1]){
      B(.08,.55,6.2, mat(0x2a2c32), s*1.18,.85,0, trailer);
    }
    B(2.35,.12,.18, dark, 0,.62,3.2, trailer);
    const ramp=new THREE.Mesh(new THREE.BoxGeometry(2.2,.1,2.6), mat(0x6a7080));
    ramp.position.set(0,.18,4.55); trailer.add(ramp);
    const tw=[];
    for(const s of [-1,1]){
      tw.push(makeWheel(trailer, s*1.05, .32, -2.2, .32,.22));
      tw.push(makeWheel(trailer, s*1.05, .32, -1.1, .32,.22));
    }
    trailer.userData={wheels:tw, ramp, L:6.6, W:2.5};
    return {truck, trailer};
  }

  function makeAmbulanceMesh(){
    const g=new THREE.Group();
    const white=mat(0xf4f6f8), red=mat(0xe02020), glass=WMAT.glassB||mat(0x9fd4ff);
    B(2.35,1.45,2.2, white, 0,1.15,2.05, g);
    B(2.2,.62,.08, glass, 0,1.45,3.16, g);
    B(2.4,2.05,4.1, white, 0,1.45, -.55, g);
    B(2.44,.32,6.2, red, 0,1.05, .2, g);
    B(.9,.22,1.1, red, -.45,2.55, .2, g);
    B(.9,.22,1.1, mat(0x2040ff), .45,2.55, .2, g);
    const cross=canvasTex(128,128,(c,w,h)=>{
      c.fillStyle='#f4f6f8'; c.fillRect(0,0,w,h);
      c.fillStyle='#e02020'; c.fillRect(w*.38,h*.12,w*.24,h*.76);
      c.fillRect(w*.12,h*.38,w*.76,h*.24);
    });
    for(const s of [-1,1]) planeTex(cross, 1.1, 1.1, s*1.22, 1.7, -.4, g, s*Math.PI/2);
    const wheels=[];
    for(const s of [-1,1]){
      wheels.push(makeWheel(g, s*1.05, .38, 2.15, .38,.22));
      wheels.push(makeWheel(g, s*1.05, .38, -1.85, .38,.22));
    }
    g.userData={wheels, L:6.4, W:2.5, top:2.7, siren:true};
    return g;
  }

  function makeCartMesh(){
    const g=new THREE.Group();
    const wire=mat(0x8a9098,'shiny'), red=mat(0xcc0000);
    B(1.05,.08,1.45, wire, 0,.42,0, g);
    B(1.05,.55,.08, wire, 0,.7, .72, g);
    B(1.05,.55,.08, wire, 0,.7,-.72, g);
    B(.08,.55,1.45, wire, -.5,.7,0, g);
    B(.08,.55,1.45, wire, .5,.7,0, g);
    B(.08,.55,.08, red, -.42,.95, .85, g);
    B(.9,.08,.08, red, 0,1.18, .92, g);
    for(const [x,z] of [[-.42,.55],[.42,.55],[-.42,-.55],[.42,-.55]]){
      const w=makeWheel(g, x, .12, z, .12,.08); w.userData.r=.12;
    }
    g.userData.basket=g;
    return g;
  }

  function makePriceTag(name, price){
    const tex=canvasTex(256,96,(c,w,h)=>{
      c.fillStyle='#fffbe8'; c.fillRect(0,0,w,h);
      c.strokeStyle='#cc0000'; c.lineWidth=8; c.strokeRect(4,4,w-8,h-8);
      c.fillStyle='#111'; c.font='bold 22px Arial'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText(name, w/2, 30);
      c.fillStyle='#cc0000'; c.font='bold 28px Arial Black,Arial';
      c.fillText(price+' coins', w/2, 64);
    });
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.5), new THREE.MeshBasicMaterial({map:tex, transparent:false}));
    return m;
  }

  function makeSlidingDoorPair(w, h, thick=.12){
    const g=new THREE.Group();
    const glass=new THREE.MeshPhysicalMaterial({color:0xb8e0ff, metalness:.1, roughness:.08, transparent:true, opacity:.45, depthWrite:false});
    const frame=mat(0x4a4e56);
    const half=w/2;
    const left=new THREE.Group(); const right=new THREE.Group();
    const lg=new THREE.Mesh(new THREE.BoxGeometry(half-.04, h, thick), glass);
    const rg=new THREE.Mesh(new THREE.BoxGeometry(half-.04, h, thick), glass);
    lg.position.x=-half/2; rg.position.x=half/2;
    left.add(lg); right.add(rg);
    B(.08,h,.14, frame, -half, 0, 0, g);
    B(.08,h,.14, frame, half, 0, 0, g);
    B(w,.1,.16, frame, 0, h/2, 0, g);
    left.position.y=0; right.position.y=0;
    g.add(left, right);
    g.userData={left, right, half, w, h, open:0};
    return g;
  }

  function makePool(x, z, w=12, d=8){
    const g=new THREE.Group();
    const deck=mat(0xe8dcc8), water=new THREE.MeshStandardMaterial({color:0x3ec4e8, transparent:true, opacity:.62, roughness:.12, metalness:.15, emissive:0x145a78, emissiveIntensity:.18});
    const tile=mat(0x4db8d0);
    B(w+3.2,.12,d+3.2, deck, 0,.08,0, g);
    B(w,.08,d, tile, 0,.02,0, g);
    const pool=new THREE.Mesh(new THREE.BoxGeometry(w-.4,.22,d-.4), water);
    pool.position.set(0,.28,0); g.add(pool);
    for(const s of [-1,1]){
      B(w+.2,.55,.28, tile, 0,.28, s*(d/2), g);
      B(.28,.55,d+.2, tile, s*(w/2), .28, 0, g);
    }
    B(.18,1.1,.18, mat(0xc0c6cc,'shiny'), -w/2+.5, .7, d/2-.4, g);
    B(.18,.08,1.1, mat(0xc0c6cc,'shiny'), -w/2+.5, 1.2, d/2-1.0, g);
    for(const s of [-1,1]){
      B(1.6,.18,.7, mat(0xff8a3a), s* (w/2+1.4), .22, -d/2-1.1, g);
      B(1.6,.08,.22, mat(0xffd21e), s* (w/2+1.4), .32, -d/2-1.35, g);
    }
    for(const s of [-1,1]){
      cyl(.18,2.4, mat(0x6b4a28), s*(w/2+2.2), 1.2, d/2+1.2, g, 6);
      sph(1.15, mat(0x2f9e44), s*(w/2+2.2), 2.7, d/2+1.2, g, 8);
    }
    g.position.set(x,0,z);
    worldRoot.add(g);
    return {g, water:pool, x, z, w:w-.6, d:d-.6, y:.42};
  }

  function makeSmoke(x, y, z){
    const g=new THREE.Group();
    const m=new THREE.MeshStandardMaterial({color:0xc8c4be, transparent:true, opacity:.55, roughness:1, depthWrite:false});
    for(let i=0;i<5;i++){
      const s=sph(.35+i*.12, m, (i%2?-.2:.2), i*.45, 0, g, 8);
      s.userData.ph=i;
    }
    g.position.set(x,y,z);
    worldRoot.add(g);
    return g;
  }

  function makeStopSign(name, x, z){
    const g=new THREE.Group();
    B(.08,2.4,.08, mat(0x44464c), 0,1.2,0, g);
    const tex=canvasTex(256,160,(c,w,h)=>{
      c.fillStyle='#2a6cff'; c.fillRect(0,0,w,h);
      c.fillStyle='#ffd21e'; c.fillRect(0,0,w,18); c.fillRect(0,h-18,w,18);
      c.fillStyle='#fff'; c.font='bold 28px Arial Black,Arial'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText('BUS', w/2, 52);
      c.font='bold 22px Arial'; c.fillText(name, w/2, 100);
    });
    planeTex(tex, 1.8, 1.1, 0, 2.55, .08, g);
    g.position.set(x,0,z);
    worldRoot.add(g);
    return g;
  }

  function makeCrosswalk(x, z, alongX){
    const g=new THREE.Group();
    const w=mat(0xf4f4f0);
    for(let i=-3;i<=3;i++){
      if(alongX) B(1.1,.04,.38, w, i*.7, .05, 0, g);
      else B(.38,.04,1.1, w, 0, .05, i*.7, g);
    }
    g.position.set(x,.03,z);
    worldRoot.add(g);
    return g;
  }

  function buildFireStation(x, z){
    const g=new THREE.Group();
    const brick=mat(0xc45c48), cream=mat(0xf2e6c8), dark=mat(0x2a2c32);
    B(28,.2,20, mat(0x6a6e74), 0,.1,0, g);
    B(28,8,.5, brick, 0,4, -10, g);
    B(.5,8,20, brick, -14,4,0, g);
    B(.5,8,20, brick, 14,4,0, g);
    B(28,.4,20, cream, 0,8.2,0, g);
    B(10,8,.5, brick, -9,4, 10, g);
    B(10,8,.5, brick, 9,4, 10, g);
    // open bays
    B(7.6,.2,1, dark, 0,.12, 9.6, g);
    B(8, .15, .2, mat(0xffd21e), 0, 4.2, 10.1, g);
    label('FIRE STATION', '#c8101a', x, 9.4, z+10.4, 14);
    const pole=cyl(.12,7.2, mat(0xc8ccd2,'shiny'), 12, 3.6, 8, g, 8);
    B(.5,.2,.5, mat(0xc8101a), 12, 7.3, 8, g);
    g.position.set(x,0,z); worldRoot.add(g);
    addOb(x, z-10, 28, .8, 'wall');
    addOb(x-14, z, .8, 20, 'wall');
    addOb(x+14, z, .8, 20, 'wall');
    addOb(x-9, z+10, 10, .8, 'wall');
    addOb(x+9, z+10, 10, .8, 'wall');
    return g;
  }

  function buildHospital(x, z){
    const g=new THREE.Group();
    const white=mat(0xf0f3f7), red=mat(0xe02020), glass=WMAT.glassB||mat(0x9fd4ff);
    B(30,.2,22, mat(0xd8dee6), 0,.1,0, g);
    B(30,10,.5, white, 0,5, -11, g);
    B(.5,10,22, white, -15,5,0, g);
    B(.5,10,22, white, 15,5,0, g);
    B(12,10,.5, white, -9,5, 11, g);
    B(12,10,.5, white, 9,5, 11, g);
    B(30,.4,22, white, 0,10.2,0, g);
    for(let wy=2.2; wy<9; wy+=2.1){
      B(22,.7,.08, glass, 0, wy, -11.08, g);
    }
    const plus=canvasTex(256,256,(c,w,h)=>{
      c.fillStyle='#f0f3f7'; c.fillRect(0,0,w,h);
      c.fillStyle='#e02020'; c.fillRect(w*.38,h*.12,w*.24,h*.76);
      c.fillRect(w*.12,h*.38,w*.76,h*.24);
    });
    planeTex(plus, 3.2, 3.2, 0, 12.2, 11.3, g);
    label('CITY HOSPITAL', '#e02020', x, 11.6, z+11.4, 14);
    B(6, .08, 8, mat(0xe8eef4), 0, .12, 15, g);
    g.position.set(x,0,z); worldRoot.add(g);
    addOb(x, z-11, 30, .8, 'wall');
    addOb(x-15, z, .8, 22, 'wall');
    addOb(x+15, z, .8, 22, 'wall');
    addOb(x-9, z+11, 12, .8, 'wall');
    addOb(x+9, z+11, 12, .8, 'wall');
    return g;
  }

  function buildMart(x, z){
    const W=38, D=30, H=8.2, doorW=7.2, doorH=3.4;
    const g=new THREE.Group();
    const red=mat(0xcc0000), cream=mat(0xf4efe6), floor=new THREE.MeshStandardMaterial({color:0xf2eee6, roughness:.82, emissive:0xe8dcc8, emissiveIntensity:.08});
    const inside=new THREE.MeshStandardMaterial({color:0xfff7ea, roughness:.9, emissive:0xe8d0a8, emissiveIntensity:.1, side:THREE.DoubleSide});
    B(W,.16,D, floor, 0,.1,0, g);
    const back=B(W,H,.45, red, 0,H/2, -D/2, g);
    const sideW=Math.max(1.4,(W-doorW)/2);
    const fl=B(sideW,H,.45, red, -(doorW+sideW)/2, H/2, D/2, g);
    const fr=B(sideW,H,.45, red, (doorW+sideW)/2, H/2, D/2, g);
    const lintel=B(doorW, Math.max(.4,H-doorH), .45, red, 0, doorH+(H-doorH)/2, D/2, g);
    const left=B(.45,H,D, red, -W/2, H/2, 0, g);
    const right=B(.45,H,D, red, W/2, H/2, 0, g);
    const cuts=[back,fl,fr,lintel,left,right];
    B(W-.4,H-.4,.08, inside, 0, H/2, -D/2+.28, g);
    B(.08,H-.4,D-.4, inside, -W/2+.28, H/2, 0, g);
    B(.08,H-.4,D-.4, inside, W/2-.28, H/2, 0, g);
    const roof=B(W+1.2,.4,D+1.2, cream, 0, H+.2, 0, g);
    const ceil=new THREE.Mesh(new THREE.PlaneGeometry(W-.4,D-.4), new THREE.MeshStandardMaterial({color:0xfff3dc, roughness:.9, emissive:0xe8cda0, emissiveIntensity:.22, side:THREE.DoubleSide}));
    ceil.rotation.x=Math.PI/2; ceil.position.set(0, H-0.18, 0); g.add(ceil);

    const disc=new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.6,.18,24), mat(0xffffff));
    disc.position.set(0, H+1.15, D/2+.2); disc.rotation.x=Math.PI/2; g.add(disc);
    const inner=new THREE.Mesh(new THREE.CylinderGeometry(2.05,2.05,.2,24), mat(0xcc0000));
    inner.position.set(0, H+1.18, D/2+.2); inner.rotation.x=Math.PI/2; g.add(inner);
    label('BULLSEYE MART', '#cc0000', x, H+2.4, z+D/2+.35, 16);

    const outer=makeSlidingDoorPair(doorW, doorH, .1);
    outer.position.set(0, doorH/2, D/2+.05); g.add(outer);
    const innerDoors=makeSlidingDoorPair(doorW-0.6, doorH-0.15, .1);
    innerDoors.position.set(0, (doorH-0.15)/2, D/2-3.4); g.add(innerDoors);

    // vestibule walls
    B(8,.2,.2, mat(0xdd3333), -6.2, 1.6, D/2-1.7, g);
    B(8,.2,.2, mat(0xdd3333), 6.2, 1.6, D/2-1.7, g);

    const shelves=[];
    const aisleZ=[-4, 2, 8];
    const aisleX=[-11, -3.5, 4, 11.5];
    for(const az of aisleZ){
      for(const ax of aisleX){
        const sh=new THREE.Group();
        B(2.6,2.2,.7, mat(0xcc0000), 0,1.15,0, sh);
        B(2.5,.08,.72, mat(0xf4f0e6), 0,.55,0, sh);
        B(2.5,.08,.72, mat(0xf4f0e6), 0,1.15,0, sh);
        B(2.5,.08,.72, mat(0xf4f0e6), 0,1.75,0, sh);
        sh.position.set(ax,0,az); g.add(sh);
        shelves.push({g:sh, x:x+ax, z:z+az, slotY:1.35});
        addOb(x+ax, z+az, 2.7, .9, 'wall');
      }
    }

    const checkout=new THREE.Group();
    B(2.8,.95,4.4, mat(0xeeeeee), 0,.5,0, checkout);
    B(2.8,.08,4.4, mat(0x222226), 0,1.0,0, checkout);
    B(.5,.35,.5, mat(0x111114), .7,1.22, 1.4, checkout);
    const belt=B(1.4,.06,3.2, mat(0x888890), -.3,1.04, -.2, checkout);
    checkout.position.set(12.4,0, D/2-8.2); g.add(checkout);

    const lights=[];
    for(const lz of [-6, 2, 10]){
      const L=new THREE.PointLight(0xfff1d0, .35, 16, 1.2);
      L.position.set(0, 5.6, lz); g.add(L); lights.push(L);
    }
    const amb=new THREE.HemisphereLight(0xfff6e8, 0xb08958, .28);
    amb.position.set(0, 3, 0); g.add(amb);

    g.position.set(x,0,z); worldRoot.add(g);

    const obs=[];
    obs.push(addOb(x, z-D/2, W, .7, 'wall'));
    obs.push(addOb(x-(doorW+sideW)/2, z+D/2, sideW, .7, 'wall'));
    obs.push(addOb(x+(doorW+sideW)/2, z+D/2, sideW, .7, 'wall'));
    obs.push(addOb(x-W/2, z, .7, D, 'wall'));
    obs.push(addOb(x+W/2, z, .7, D, 'wall'));
    const outerDoorOb=addOb(x, z+D/2, doorW, .55, 'door');
    const innerDoorOb=addOb(x, z+D/2-3.4, doorW-0.4, .55, 'door');
    obs.push(outerDoorOb, innerDoorOb);

    return {
      g, x, z, w:W, d:D, h:H, doorW, doorH, doorZ:z+D/2,
      innerDoorZ:z+D/2-3.4, cuts, roof, lights, amb, insideMat:inside,
      outer, innerDoors, shelves, checkout,
      checkoutPos:{x:x+12.4, z:z+D/2-8.2},
      cartSpot:{x:x-6.5, z:z+D/2-5.2},
      outerDoorOb, innerDoorOb, obs,
    };
  }

  function decorateVilla(houseGroup, H, x, z, w, d, h){
    const marble=new THREE.MeshStandardMaterial({color:0xf7f1e4, roughness:.35, metalness:.12, emissive:0xe8dcc0, emissiveIntensity:.12});
    B(w-1.2,.04,d-1.2, marble, x, .2, z, houseGroup);
    B(3.4,.08,2.4, mat(0x8b1e3f), x, .24, z, houseGroup);
    const ch=new THREE.Group();
    cyl(.08,.5, mat(0xd4af37,'shiny'), 0,0,0, ch, 8);
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2;
      sph(.08, mat(0xfff4c4), Math.cos(a)*.45, -.35, Math.sin(a)*.45, ch, 8);
    }
    ch.position.set(x, h-0.7, z); houseGroup.add(ch);
    B(2.8,.9,1.1, mat(0x3a6ea5), x-w*.22, .55, z+d*.12, houseGroup);
    B(2.8,.45,.28, mat(0x2d5680), x-w*.22, .95, z+d*.12-.4, houseGroup);
    B(1.8,1.1,.16, mat(0x151518), x+w*.22, 1.15, z-d*.32, houseGroup);
    B(1.55,.85,.05, new THREE.MeshStandardMaterial({color:0x1a3050, emissive:0x2266aa, emissiveIntensity:.7}), x+w*.22, 1.15, z-d*.32+.1, houseGroup);
    B(2.2,.85,1.0, mat(0xf4f0e6), x+w*.28, .52, z+d*.05, houseGroup);
    B(2.0,.08,1.0, mat(0xcc0000), x+w*.28, .96, z+d*.05, houseGroup);
    B(.55,1.4,.55, mat(0x8a6a48), x-w*.32, .8, z-d*.28, houseGroup);
    sph(.35, mat(0x2f9e44), x-w*.32, 1.7, z-d*.28, houseGroup, 8);
    B(1.4,.7,.7, mat(0xdde4ea,'shiny'), x+w*.32, .45, z-d*.12, houseGroup);
    for(const s of [-1,1]){
      B(.5,3.6,.5, mat(0xf2e6c8), x+s*4.4, 1.8, z+d/2+.35, houseGroup);
      cyl(.22, .35, mat(0xd4af37,'shiny'), x+s*4.4, 3.7, z+d/2+.35, houseGroup, 8);
    }
    B(4.2,.12,1.8, mat(0x2a6b4e), x, .08, z+d/2+2.1, houseGroup);
  }

  function slab(x0,x1,z0,z1,y,m,parent){
    const ww=x1-x0, dd=z1-z0;
    if(ww<0.2||dd<0.2) return null;
    return B(ww, 0.14, dd, m, (x0+x1)/2, y, (z0+z1)/2, parent);
  }

  function addSecondFloor(g, H, x, z, w, d, h){
    const floorY = H.pool ? 4.35 : 3.28;
    const run = H.pool ? 5.8 : 4.15;
    const stairW = H.pool ? 1.72 : 1.38;
    const leftX = x - w/2 + stairW/2 + 0.42;
    const zBot = z + d/2 - 0.95;
    const zTop = zBot - run;
    const steps = H.pool ? 11 : 8;
    const wood=mat(0x8a5a32), rail=mat(H.pool?0xf2e6c8:0xe8d8b8), floorM=mat(H.pool?0xe8dcc8:0xd4b48a);
    for(let i=0;i<steps;i++){
      const t=i/(steps-1);
      const sy = 0.1 + t*floorY;
      const sz = zBot - t*run;
      B(stairW, 0.13, run/steps+0.05, wood, leftX, sy, sz, g);
    }
    B(.08, floorY+0.55, run+0.2, rail, leftX+stairW/2+0.14, (floorY+0.55)/2, (zBot+zTop)/2, g);
    for(let i=0;i<4;i++){
      B(.07, 0.55, .07, rail, leftX+stairW/2+0.14, floorY+0.55, zBot-i*(run/3), g);
    }
    const inset=0.32;
    const x0=x-w/2+inset, x1=x+w/2-inset, z0=z-d/2+inset, z1=z+d/2-inset;
    const hole={minx:leftX-stairW/2-0.08, maxx:leftX+stairW/2+0.22, minz:zTop-0.12, maxz:zBot+0.18};
    slab(hole.maxx, x1, z0, z1, floorY, floorM, g);
    slab(x0, hole.maxx, z0, hole.minz, floorY, floorM, g);
    slab(x0, hole.maxx, hole.maxz, z1, floorY, floorM, g);
    const rug=B(Math.min(w-3.4, H.pool?8:4.2), .05, Math.min(d-3.2, H.pool?6:3.4), mat(H.pool?0x8b1e3f:0x3a6ea5), x+1.1, floorY+0.1, z-0.2, g);
    rug.receiveShadow=true;
    const fancy=!!H.pool;
    B(fancy?2.4:1.7, .28, fancy?1.3:1.05, mat(0xfff2df), x+w*.18, floorY+0.22, z-d*.18, g);
    B(fancy?.6:.48, .22, fancy?1.3:1.05, mat(0xf0983c), x+w*.18-(fancy?0.9:0.6), floorY+0.42, z-d*.18, g);
    B(1.3, .7, .7, mat(0x8a6a48), x-w*.08, floorY+0.45, z-d*.28, g);
    B(1.1, .55, .5, mat(0xdde4ea), x+w*.28, floorY+0.38, z+d*.12, g);
    if(fancy){
      B(2.6, .9, 1.05, mat(0x3a6ea5), x-w*.16, floorY+0.55, z+d*.16, g);
      B(2.6, .45, .24, mat(0x2d5680), x-w*.16, floorY+0.95, z+d*.16-.4, g);
      B(1.6, 1.0, .14, mat(0x151518), x+w*.22, floorY+1.1, z-d*.32, g);
      sph(.32, mat(0x2f9e44), x-w*.28, floorY+0.85, z-d*.12, g, 8);
      B(.55, 1.2, .55, mat(0xd4af37,'shiny'), x+w*.32, floorY+0.7, z+d*.22, g);
    } else {
      B(.9, .55, .55, mat(0x3a6ea5), x+w*.12, floorY+0.38, z+d*.18, g);
      sph(.22, mat(0x2f9e44), x-w*.12, floorY+0.55, z+d*.2, g, 8);
    }
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8), new THREE.MeshStandardMaterial({color:0xfff6d8, emissive:0xffe08a, emissiveIntensity:1.8, toneMapped:false}));
    lamp.position.set(x, floorY+1.55, z); g.add(lamp);
    return {
      floorY,
      stairs:{
        along:'z', flip:true, y0:0, y1:floorY,
        minx:leftX-stairW/2, maxx:leftX+stairW/2,
        minz:Math.min(zTop,zBot), maxz:Math.max(zTop,zBot),
        cx:leftX, zBot, zTop, w:stairW, run,
      },
      hole,
      upper:{y:floorY, minx:x0, maxx:x1, minz:z0, maxz:z1},
    };
  }

  function makeFireRig(){
    const g=new THREE.Group();
    const flameM=new THREE.MeshBasicMaterial({color:0xff6a10, transparent:true, opacity:.92, depthWrite:false});
    const flameM2=new THREE.MeshBasicMaterial({color:0xffee66, transparent:true, opacity:.85, depthWrite:false});
    const smokeM=new THREE.MeshStandardMaterial({color:0x9a968e, transparent:true, opacity:.55, roughness:1, depthWrite:false});
    const flames=[];
    for(let i=0;i<7;i++){
      const cone=new THREE.Mesh(new THREE.ConeGeometry(.45+i*.12, 1.3+i*.35, 7), i%2?flameM2:flameM);
      cone.position.set((i%3-1)*.35, .7+i*.18, (i%2?-.2:.2));
      cone.userData.ph=i*0.7;
      g.add(cone); flames.push(cone);
    }
    const smokes=[];
    for(let i=0;i<8;i++){
      const s=sph(.5+i*.18, smokeM, (i%2?-.25:.25), 1.4+i*.7, 0, g, 8);
      s.userData.ph=i;
      smokes.push(s);
    }
    const glow=new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 10), new THREE.MeshBasicMaterial({color:0xff8020, transparent:true, opacity:.28, depthWrite:false}));
    glow.position.y=1.4; g.add(glow);
    const halo=new THREE.PointLight(0xff6a18, 4.2, 90, 1.1);
    halo.position.set(0, 2.2, 0); g.add(halo);
    g.userData={flames, smokes, glow, halo, flameM, smokeM};
    return g;
  }

  function tickFireRig(g, dt, t, strength){
    if(!g || !g.userData) return;
    const k=Math.max(0.15, strength||1);
    for(const f of g.userData.flames){
      const ph=f.userData.ph+t*4;
      f.scale.set(k*(0.8+Math.sin(ph)*0.25), k*(1.05+Math.sin(ph*1.4)*0.35), k*(0.8+Math.cos(ph)*0.2));
      f.position.y=0.55+Math.sin(ph)*0.18;
      f.rotation.y+=dt*2;
    }
    for(const s of g.userData.smokes){
      const i=s.userData.ph;
      s.position.y=1.2+i*.75+Math.sin(t*1.4+i)*.2;
      s.position.x=Math.sin(t*.7+i)*.28;
      s.material.opacity=Math.max(0.08, .5*k - i*.04);
      s.scale.setScalar(k*(1+i*.08));
    }
    if(g.userData.glow){
      const pulse=0.22+Math.sin(t*6)*0.08;
      g.userData.glow.material.opacity=pulse*k;
      g.userData.glow.scale.setScalar(1.1+Math.sin(t*3)*0.15);
    }
    if(g.userData.halo) g.userData.halo.intensity=3.4*k+Math.sin(t*8)*0.6;
  }

  function makeSprayRig(){
    const g=new THREE.Group();
    const m=new THREE.MeshBasicMaterial({color:0x9ee7ff, transparent:true, opacity:.8, depthWrite:false});
    const drops=[];
    for(let i=0;i<28;i++){
      const d=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6), m);
      d.userData.t=Math.random();
      g.add(d); drops.push(d);
    }
    g.userData={drops, m};
    g.visible=false;
    return g;
  }

  function tickSpray(g, from, to, dt){
    if(!g || !g.userData) return;
    g.visible=true;
    const drops=g.userData.drops;
    const dx=to.x-from.x, dy=(to.y+1.2)-from.y, dz=to.z-from.z;
    for(const d of drops){
      d.userData.t=(d.userData.t+dt*1.8)%1;
      const u=d.userData.t;
      d.position.set(
        from.x+dx*u+(Math.sin(u*18+d.userData.t)*0.12),
        from.y+dy*u - u*u*1.4,
        from.z+dz*u+(Math.cos(u*14)*0.12)
      );
    }
  }

  function makeStarRing(){
    const g=new THREE.Group();
    const m=new THREE.MeshBasicMaterial({color:0xffe14a, depthWrite:false});
    const stars=[];
    for(let i=0;i<6;i++){
      const s=new THREE.Mesh(new THREE.ConeGeometry(.12, .28, 5), m);
      s.rotation.x=Math.PI;
      g.add(s); stars.push(s);
    }
    g.userData={stars};
    g.visible=false;
    return g;
  }

  function tickStars(g, t){
    if(!g) return;
    g.visible=true;
    const stars=g.userData.stars||[];
    stars.forEach((s,i)=>{
      const a=t*2.2+i*(Math.PI*2/stars.length);
      s.position.set(Math.cos(a)*.55, 1.15+Math.sin(t*5+i)*.08, Math.sin(a)*.55);
      s.rotation.y=a;
    });
  }

  function makeHospitalRoom(){
    const g=new THREE.Group();
    const white=mat(0xf4f7fb), sheet=mat(0xe8f4ff), wood=mat(0xd8c4a0);
    B(8.4,.12,6.4, white, 0,.06,0, g);
    B(8.4, 3.4, .2, white, 0, 1.7, -3.2, g);
    B(.2, 3.4, 6.4, white, -4.2, 1.7, 0, g);
    B(.2, 3.4, 6.4, white, 4.2, 1.7, 0, g);
    B(2.6,.42,1.3, wood, 0, .32, -0.4, g);
    B(2.4,.12,1.2, sheet, 0, .58, -0.4, g);
    B(.7,.28,1.2, mat(0xffffff), -1.0, .72, -0.4, g);
    B(.18,1.4,.18, mat(0xc0c6cc,'shiny'), 2.2, .8, 1.4, g);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8), new THREE.MeshStandardMaterial({color:0xfff6d8, emissive:0xffe08a, emissiveIntensity:1.6}));
    bulb.position.set(2.2, 1.55, 1.4); g.add(bulb);
    const L=new THREE.PointLight(0xfff1d0, 1.4, 12, 1.2);
    L.position.set(0, 2.6, 0); g.add(L);
    g.userData={bed:[0, .7, -0.4], doctor:[1.6, 0, 0.3]};
    g.visible=false;
    return g;
  }

  function addSirenLights(parent, y=2.4){
    const red=new THREE.Mesh(new THREE.BoxGeometry(.42,.16,.42), new THREE.MeshBasicMaterial({color:0xff2020}));
    const blu=new THREE.Mesh(new THREE.BoxGeometry(.42,.16,.42), new THREE.MeshBasicMaterial({color:0x2040ff}));
    red.position.set(-.35, y, 0); blu.position.set(.35, y, 0);
    parent.add(red, blu);
    parent.userData.sirenMats=[red.material, blu.material];
    return [red, blu];
  }

  function bandageOn(cat){
    const b=B(.14,.08,.18, mat(0xf4f4f6), .12, .12, .26, cat);
    b.userData.bandage=true;
    return b;
  }

  return {
    makePerson, makeBusMesh, makeHaulRig, makeAmbulanceMesh, makeCartMesh,
    makePriceTag, makeSlidingDoorPair, makePool, makeSmoke, makeStopSign,
    makeCrosswalk, buildFireStation, buildHospital, buildMart, decorateVilla, canvasTex,
    addSecondFloor, makeFireRig, tickFireRig, makeSprayRig, tickSpray, makeStarRing, tickStars,
    makeHospitalRoom, addSirenLights, bandageOn,
  };
}
