// Shared Christmas-city dressing for 3D driving games.
// Falling snow, snowy ground/roofs/trees, road snow, and real city snowplows.
// Keep it light: Points for flakes, few plows, instanced road patches.

import { isChristmas as seasonOn } from './arcade-theme.js';

const ORANGE = 0xee7a12;
const YELLOW = 0xf0c400;
const STEEL = 0x8a93a0;
const STEEL_DK = 0x5a616c;
const CHASSIS = 0x1a1c20;
const SALT = 0xc4b49a;
const SNOW = 0xf4f7fb;

function mat(THREE, cache, color, extra) {
  const k = color + ':' + (extra || '');
  if (!cache[k]) {
    cache[k] = new THREE.MeshStandardMaterial({
      color,
      roughness: extra === 'shiny' ? 0.28 : extra === 'steel' ? 0.42 : 0.78,
      metalness: extra === 'shiny' ? 0.55 : extra === 'steel' ? 0.72 : 0.08,
    });
  }
  return cache[k];
}

function box(THREE, g, w, h, d, m, x, y, z) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  g.add(o);
  return o;
}

function cyl(THREE, g, rTop, rBot, h, m, x, y, z, seg = 10, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), m);
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  o.castShadow = true;
  o.receiveShadow = true;
  g.add(o);
  return o;
}

function sph(THREE, g, r, m, x, y, z, seg = 8) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  g.add(o);
  return o;
}

function makeTire(THREE, parent, x, y, z, r, w, mats) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), mats.rubber);
  tire.rotation.z = Math.PI / 2;
  g.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.52, r * 0.52, w + 0.05, 10), mats.rim);
  rim.rotation.z = Math.PI / 2;
  g.add(rim);
  // Chunky tread nubs
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const nub = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.1, 0.16), mats.rubber);
    nub.position.set(0, Math.sin(a) * r, Math.cos(a) * r);
    nub.rotation.x = a;
    g.add(nub);
  }
  // Tire chains: rings + cross links
  for (const off of [-w * 0.32, w * 0.32]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.04, 0.035, 6, 12), mats.chain);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = off;
    g.add(ring);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const link = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, w + 0.12, 5), mats.chain);
    link.rotation.z = Math.PI / 2;
    link.position.set(0, Math.sin(a) * (r + 0.02), Math.cos(a) * (r + 0.02));
    g.add(link);
  }
  g.position.set(x, y, z);
  parent.add(g);
  g.userData = { spin: g, r, front: Math.abs(z) > 1.4 };
  return g;
}

function makeCurvedBlade(THREE, mats, wide, high) {
  const g = new THREE.Group();
  // Stacked steel slats form a curved moldboard (readable as a plow, not a drum).
  const slats = 7;
  for (let i = 0; i < slats; i++) {
    const t = i / (slats - 1);
    const pitch = -0.08 + t * 0.95;
    const y = 0.08 + Math.sin(t * 1.15) * high * 0.72;
    const z = 0.15 + (1 - Math.cos(t * 1.05)) * high * 0.62;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(wide, 0.2, 0.16), mats.blade);
    slat.position.set(0.08, y, z);
    slat.rotation.x = pitch;
    slat.castShadow = true;
    g.add(slat);
  }
  // Solid back so the scoop isn't hollow
  box(THREE, g, wide * 0.96, high * 0.82, 0.12, mats.blade, -0.02, high * 0.28, -0.12);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(wide + 0.28, 0.16, 0.28), mats.edge);
  edge.position.set(0.12, -0.02, 0.42);
  edge.rotation.x = -0.12;
  g.add(edge);
  box(THREE, g, 0.22, 0.32, 1.7, mats.frame, 0, 0.12, -0.85);
  box(THREE, g, 1.9, 0.16, 0.16, mats.frame, 0, 0.4, -0.45);
  box(THREE, g, 0.16, 0.7, 0.16, mats.frame, -0.7, 0.22, -0.5);
  box(THREE, g, 0.16, 0.7, 0.16, mats.frame, 0.7, 0.22, -0.5);
  for (const s of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 6), mats.rubber);
    pole.position.set(s * (wide * 0.48), 0.85, 0.2);
    g.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.03), mats.beacon);
    flag.position.set(s * (wide * 0.48), 1.45, 0.2);
    g.add(flag);
  }
  g.rotation.y = 0.42; // ~24° — snow rolls off to the right into a bank
  return g;
}

/** Real generic city snowplow: orange dump truck, angled steel blade, amber beacons, salt spinner, chained tires. */
export function makeSnowPlow(THREE, opts = {}) {
  const cache = {};
  const paintHex = opts.yellow ? YELLOW : ORANGE;
  const mats = {
    paint: mat(THREE, cache, paintHex),
    cab2: mat(THREE, cache, 0x1c1e24),
    chassis: mat(THREE, cache, CHASSIS),
    rubber: mat(THREE, cache, 0x161618),
    rim: mat(THREE, cache, 0xc8cdd2, 'shiny'),
    chain: mat(THREE, cache, 0x6a7078, 'steel'),
    blade: (() => { const m = mat(THREE, cache, STEEL, 'steel'); m.side = THREE.DoubleSide; return m; })(),
    edge: mat(THREE, cache, 0x2a2c30, 'steel'),
    frame: mat(THREE, cache, STEEL_DK, 'steel'),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fd4ff, roughness: 0.18, metalness: 0.15, transparent: true, opacity: 0.55 }),
    salt: mat(THREE, cache, SALT),
    hopper: mat(THREE, cache, paintHex),
    beacon: new THREE.MeshStandardMaterial({ color: 0xffc000, emissive: 0xffaa00, emissiveIntensity: 2.2, toneMapped: false }),
    light: new THREE.MeshStandardMaterial({ color: 0xfff4d0, emissive: 0xffe08a, emissiveIntensity: 1.4, toneMapped: false }),
    black: mat(THREE, cache, 0x111114),
  };
  const g = new THREE.Group();
  // Heavy conventional dump chassis (hood + cab + hopper)
  box(THREE, g, 2.25, 0.34, 7.4, mats.chassis, 0, 0.66, -0.25);
  for (const s of [-1, 1]) cyl(THREE, g, 0.22, 0.22, 1.35, mats.chassis, s * 1.08, 0.7, 0.2, 10, 0, 0, Math.PI / 2);
  // Hood / engine
  box(THREE, g, 1.9, 1.08, 2.2, mats.paint, 0, 1.3, 2.55);
  box(THREE, g, 1.72, 0.1, 1.95, mats.black, 0, 1.86, 2.55);
  box(THREE, g, 1.2, 0.64, 0.1, mats.chassis, 0, 1.22, 3.66);
  for (let i = -2; i <= 2; i++) box(THREE, g, 0.07, 0.54, 0.06, mats.frame, i * 0.2, 1.22, 3.72);
  box(THREE, g, 2.5, 0.36, 0.34, mats.chassis, 0, 0.62, 3.78);
  for (const s of [-1, 1]) sph(THREE, g, 0.14, mats.light, s * 0.9, 0.64, 3.98, 8);
  // Cab
  box(THREE, g, 2.38, 1.7, 1.72, mats.paint, 0, 1.88, 0.82);
  box(THREE, g, 2.18, 0.92, 0.08, mats.glass, 0, 2.28, 1.68);
  for (const s of [-1, 1]) box(THREE, g, 0.08, 0.74, 1.18, mats.glass, s * 1.22, 2.22, 0.82);
  box(THREE, g, 2.42, 0.12, 1.78, mats.cab2, 0, 2.76, 0.82);
  for (const s of [-1, 1]) {
    box(THREE, g, 0.08, 0.08, 0.38, mats.chassis, s * 1.3, 2.08, 1.52);
    box(THREE, g, 0.06, 0.3, 0.18, mats.glass, s * 1.46, 2.08, 1.52);
  }
  // Door label — generic CITY PLOW, not a brand
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = opts.yellow ? '#f0c400' : '#ee7a12'; ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#111'; ctx.font = 'bold 28px Arial Black,Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('CITY PLOW', 128, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  for (const s of [-1, 1]) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.34), new THREE.MeshBasicMaterial({ map: tex }));
    sign.position.set(s * 1.2, 1.52, 0.82);
    sign.rotation.y = s * Math.PI / 2;
    g.add(sign);
  }
  // Dump / salt hopper
  box(THREE, g, 2.38, 1.58, 4.0, mats.hopper, 0, 1.88, -1.9);
  const lipL = box(THREE, g, 0.14, 1.4, 3.8, mats.hopper, -1.24, 2.4, -1.9);
  lipL.rotation.z = 0.24;
  const lipR = box(THREE, g, 0.14, 1.4, 3.8, mats.hopper, 1.24, 2.4, -1.9);
  lipR.rotation.z = -0.24;
  box(THREE, g, 2.12, 0.22, 3.6, mats.salt, 0, 2.72, -1.9);
  box(THREE, g, 2.38, 1.28, 0.14, mats.hopper, 0, 2.32, -3.88);
  cyl(THREE, g, 0.09, 0.1, 1.9, mats.chassis, -1.14, 2.9, 0.02, 8);
  cyl(THREE, g, 0.12, 0.13, 0.18, mats.black, -1.14, 3.88, 0.02, 8);
  // Front plow blade
  const blade = makeCurvedBlade(THREE, mats, 3.75, 1.28);
  blade.position.set(0.38, 0.92, 4.45);
  g.add(blade);
  // Optional right-side wing plow
  const wing = new THREE.Group();
  const wingScoop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 2.2, 12, 1, true, 0, Math.PI * 0.75),
    mats.blade
  );
  wingScoop.rotation.z = Math.PI / 2;
  wingScoop.rotation.y = Math.PI / 2;
  wingScoop.castShadow = true;
  wing.add(wingScoop);
  box(THREE, wing, 0.16, 0.12, 2.25, mats.edge, 0, -0.5, 0);
  wing.position.set(1.58, 0.78, -0.15);
  wing.rotation.y = -0.38;
  g.add(wing);
  // Rear spinner salt/sand spreader
  const spinner = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.09, 14), mats.frame);
  spinner.add(disc);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const vane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.44), mats.frame);
    vane.rotation.y = a;
    vane.position.set(Math.sin(a) * 0.14, 0.05, Math.cos(a) * 0.14);
    spinner.add(vane);
  }
  const chute = box(THREE, g, 0.4, 0.5, 0.4, mats.chassis, 0, 0.98, -3.95);
  spinner.position.set(0, 0.5, -4.15);
  g.add(spinner);
  // Amber rotating beacons on cab roof
  const beacons = [];
  box(THREE, g, 1.45, 0.08, 0.24, mats.chassis, 0, 2.86, 0.82);
  for (const s of [-0.5, 0, 0.5]) {
    cyl(THREE, g, 0.075, 0.095, 0.08, mats.chassis, s, 2.92, 0.82, 8);
    const bulb = sph(THREE, g, 0.2, mats.beacon.clone(), s, 3.16, 0.82, 10);
    beacons.push(bulb);
  }
  // Wheels with chains: steer axle + tandem drive
  const wheels = [];
  for (const s of [-1, 1]) {
    wheels.push(makeTire(THREE, g, s * 1.12, 0.5, 2.2, 0.5, 0.36, mats));
    wheels.push(makeTire(THREE, g, s * 1.16, 0.54, -1.05, 0.54, 0.42, mats));
    wheels.push(makeTire(THREE, g, s * 1.16, 0.54, -2.28, 0.54, 0.42, mats));
    box(THREE, g, 0.3, 0.48, 0.06, mats.black, s * 1.16, 0.52, -2.62);
  }
  g.userData = {
    wheels,
    blade,
    wing,
    spinner,
    beacons,
    chute,
    L: 9.6,
    W: 2.7,
    top: 3.2,
    plow: true,
  };
  return g;
}

function makePoints(THREE, n, color, size) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const life = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, m);
  pts.frustumCulled = false;
  pts.userData = { pos, life, n };
  return pts;
}

function snowCapOn(THREE, mesh, snowMat) {
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), snowMat);
  cap.scale.copy(mesh.scale);
  cap.scale.multiplyScalar(1.05);
  cap.position.copy(mesh.position);
  cap.position.y += (mesh.geometry.parameters?.radius || 1) * (mesh.scale.y || 1) * 0.35;
  cap.userData.xmasSnow = true;
  if (mesh.parent) mesh.parent.add(cap);
  return cap;
}

function roofSnowOn(THREE, mesh, snowMat) {
  const p = mesh.geometry && mesh.geometry.parameters;
  if (!p || !p.width) return null;
  const s = new THREE.Mesh(new THREE.BoxGeometry(p.width * 1.02, Math.max(0.1, p.height * 0.35), p.depth * 1.02), snowMat);
  s.position.copy(mesh.position);
  s.position.y += (p.height || 0.3) * 0.55 + 0.08;
  s.rotation.copy(mesh.rotation);
  s.userData.xmasSnow = true;
  if (mesh.parent) mesh.parent.add(s);
  return s;
}

/**
 * Dress a 3D city with Christmas snow + snowplows.
 * roads: [{x0,z0,x1,z1,w}]
 */
export function installChristmasCity(THREE, opts) {
  const on = opts.force === true ? true : opts.force === false ? false : seasonOn(opts.themeOpts);
  const api = {
    on,
    plows: [],
    flakes: 0,
    cleared: 0,
    cells: 0,
    snowCover(x, z) { return 0; },
    slipAt(x, z) { return 0; },
    tick() {},
    dressWorld() {},
    dispose() {},
    stats() { return { on, plows: 0, flakes: 0, cleared: 0, cells: 0, blades: 0, beacons: 0, spinners: 0 }; },
  };
  if (!on) return api;

  const scene = opts.scene;
  const worldRoot = opts.worldRoot || scene;
  const pad = (typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 1) || opts.tablet;
  const nFlakes = pad ? 140 : (opts.flakes || 240);
  const nPlows = Math.max(1, Math.min(opts.plows || (pad ? 2 : 3), 4));
  const cell = opts.cell || 8;
  const snowMat = new THREE.MeshStandardMaterial({ color: SNOW, roughness: 0.92, metalness: 0.02 });
  const bankMat = new THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: 0.95 });
  const group = new THREE.Group();
  group.name = 'xmasCity';
  scene.add(group);

  const cover = new Map(); // key -> 0..1 remaining snow on lane
  const banks = [];
  const roadMeshes = [];
  const roads = opts.roads || [];

  function ensureCell(x, z) {
    const k = (Math.round(x / cell) + 500) * 10007 + (Math.round(z / cell) + 500);
    if (!cover.has(k)) cover.set(k, 1);
    return k;
  }

  // Snow blankets on roads
  for (const r of roads) {
    const dx = r.x1 - r.x0, dz = r.z1 - r.z0, len = Math.hypot(dx, dz) || 1;
    const ang = Math.atan2(dx, dz);
    const w = r.w || 12;
    const snow = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.07, len), snowMat);
    snow.position.set((r.x0 + r.x1) / 2, 0.055, (r.z0 + r.z1) / 2);
    snow.rotation.y = ang;
    snow.receiveShadow = true;
    snow.userData.xmasRoad = true;
    group.add(snow);
    roadMeshes.push(snow);
    const step = cell;
    const ux = dx / len, uz = dz / len;
    const nx = -uz, nz = ux;
    for (let d = 0; d < len; d += step) {
      const x = r.x0 + ux * d, z = r.z0 + uz * d;
      ensureCell(x, z);
    }
    r._ux = ux; r._uz = uz; r._nx = nx; r._nz = nz; r._len = len;
  }
  api.cells = cover.size;

  // Ground snow sheet (sits on top of grass pads, under car chassis)
  if (opts.groundSize) {
    const gs = opts.groundSize;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(gs, gs), new THREE.MeshStandardMaterial({
      color: 0xeef3f8, roughness: 0.96, transparent: true, opacity: 0.84,
    }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.11;
    ground.receiveShadow = true;
    group.add(ground);
  }

  function dressWorld() {
    const snowCaps = [];
    worldRoot.traverse((o) => {
      if (!o.isMesh || o.userData.xmasSnow) return;
      const geo = o.geometry;
      if (!geo) return;
      // Outdoor tree leaves: greenish spheres (skip house plants / ornaments)
      if (geo.type === 'SphereGeometry') {
        const c = o.material && o.material.color;
        const r = geo.parameters && geo.parameters.radius;
        const wy = o.getWorldPosition(new THREE.Vector3()).y;
        if (c && c.g > c.r && c.g > c.b && r >= 1.2 && wy > 2.4) {
          const cap = snowCapOn(THREE, o, snowMat);
          if (cap) snowCaps.push(cap);
        }
      }
      // Roofs: wide thin boxes high off the ground
      if (geo.type === 'BoxGeometry' && geo.parameters) {
        const p = geo.parameters;
        const wy = o.getWorldPosition(new THREE.Vector3()).y;
        if (p.width > 4 && p.depth > 4 && p.height < 0.8 && wy > 3.2) {
          const cap = roofSnowOn(THREE, o, snowMat);
          if (cap) snowCaps.push(cap);
        }
      }
    });
    api._caps = snowCaps.length;
    const seenGrass = new Set();
    const snowCol = new THREE.Color(0xe6edf4);
    worldRoot.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.color) return;
      const m = o.material;
      if (seenGrass.has(m)) return;
      const c = m.color;
      if (!(c.g > 0.32 && c.g > c.r * 1.12 && c.g > c.b * 1.05)) return;
      const geo = o.geometry;
      const p = geo && geo.parameters;
      const flat = geo && (geo.type === 'PlaneGeometry' || (geo.type === 'BoxGeometry' && p && p.height < 0.35 && p.width > 6 && p.depth > 6));
      if (!flat) return;
      seenGrass.add(m);
      c.lerp(snowCol, 0.68);
    });
  }
  if (opts.autoDress !== false) dressWorld();

  // Extra lawn snow at house lots (above the grass pad)
  for (const lot of (opts.lots || [])) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(lot.w || 22, 0.1, lot.d || 20), snowMat);
    m.position.set(lot.x, 0.16, lot.z);
    m.receiveShadow = true;
    group.add(m);
  }

  // Falling snow
  const flakes = makePoints(THREE, nFlakes, 0xffffff, pad ? 0.22 : 0.28);
  const fp = flakes.userData.pos, fl = flakes.userData.life;
  const spread = opts.spread || 70;
  const fallY = opts.fallY || 28;
  for (let i = 0; i < nFlakes; i++) {
    fp[i * 3] = (Math.random() - 0.5) * spread * 2;
    fp[i * 3 + 1] = Math.random() * fallY;
    fp[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;
    fl[i] = Math.random();
  }
  flakes.geometry.attributes.position.needsUpdate = true;
  group.add(flakes);
  api.flakes = nFlakes;

  // Blade spray + salt spray as one shared Points each (updated from plow positions)
  const sprayN = pad ? 72 : 120;
  const spray = makePoints(THREE, sprayN, 0xf2f6fb, pad ? 0.28 : 0.38);
  const saltN = pad ? 48 : 80;
  const salt = makePoints(THREE, saltN, 0xc8b898, pad ? 0.18 : 0.24);
  group.add(spray, salt);
  const sp = spray.userData.pos, sl = spray.userData.life;
  const sa = salt.userData.pos, sal = salt.userData.life;
  for (let i = 0; i < sprayN; i++) { sl[i] = Math.random(); sp[i * 3 + 1] = -20; }
  for (let i = 0; i < saltN; i++) { sal[i] = Math.random(); sa[i * 3 + 1] = -20; }

  function routeFor(i) {
    const routes = opts.routes;
    if (routes && routes.length) return routes[i % routes.length];
    // Default: follow first two roads as a loop
    const loop = [];
    for (const r of roads) loop.push([r.x0, r.z0], [r.x1, r.z1]);
    if (loop.length < 2) loop.push([0, -40], [0, 40], [40, 40], [40, -40]);
    return loop;
  }

  const plows = [];
  for (let i = 0; i < nPlows; i++) {
    const mesh = makeSnowPlow(THREE, { yellow: i % 2 === 1 });
    const G = new THREE.Group();
    const com = 0.9;
    mesh.position.y = 0;
    G.add(mesh);
    const route = routeFor(i);
    const start = route[i % route.length] || [0, 0];
    G.position.set(start[0], com, start[1]);
    scene.add(G);
    plows.push({
      G, mesh, com, yaw: 0, fwd: 10 + i, _pi: i % Math.max(1, route.length),
      route, id: 'snowplow', name: 'CITY SNOWPLOW',
    });
  }
  api.plows = plows;

  function nearestRoad(x, z) {
    let best = null, bd = 1e9;
    for (const r of roads) {
      const dx = r.x1 - r.x0, dz = r.z1 - r.z0, len = r._len || Math.hypot(dx, dz) || 1;
      const t = Math.max(0, Math.min(1, ((x - r.x0) * dx + (z - r.z0) * dz) / (len * len)));
      const px = r.x0 + dx * t, pz = r.z0 + dz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }

  function clearAt(x, z, yaw) {
    const k = (Math.round(x / cell) + 500) * 10007 + (Math.round(z / cell) + 500);
    const prev = cover.has(k) ? cover.get(k) : 1;
    if (prev <= 0.08) { cover.set(k, 0); return; }
    cover.set(k, Math.max(0, prev - 0.45));
    api.cleared++;
    if (prev > 0.6 && cover.get(k) <= 0.55) {
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      // Snow rolls off to the plow's right
      const rx = fz, rz = -fx;
      const bank = new THREE.Mesh(new THREE.BoxGeometry(1.6 + Math.random() * 0.8, 0.55, 2.4), bankMat);
      bank.position.set(x + rx * 5.2, 0.28, z + rz * 5.2);
      bank.rotation.y = yaw + 0.15;
      bank.userData.xmasBank = true;
      group.add(bank);
      banks.push(bank);
      if (banks.length > 80) {
        const old = banks.shift();
        if (old.parent) old.parent.remove(old);
      }
    }
  }

  function snowCover(x, z) {
    const k = (Math.round(x / cell) + 500) * 10007 + (Math.round(z / cell) + 500);
    if (cover.has(k)) return cover.get(k);
    const r = nearestRoad(x, z);
    if (!r) return 0.35;
    const dx = r.x1 - r.x0, dz = r.z1 - r.z0, len = r._len || 1;
    const t = Math.max(0, Math.min(1, ((x - r.x0) * dx + (z - r.z0) * dz) / (len * len)));
    const px = r.x0 + dx * t, pz = r.z0 + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d > (r.w || 12) * 0.7) return 0.25;
    return 1;
  }

  function slipAt(x, z) {
    const c = snowCover(x, z);
    return c > 0.35 ? (c - 0.35) * 0.55 : 0;
  }

  let tAcc = 0;
  function tick(dt, followX, followZ) {
    tAcc += dt;
    const cx = followX || 0, cz = followZ || 0;
    // Flakes follow the camera/player
    for (let i = 0; i < nFlakes; i++) {
      fp[i * 3 + 1] -= (4.2 + (i % 5) * 0.35) * dt;
      fp[i * 3] += Math.sin(tAcc * 0.7 + i) * 1.1 * dt;
      if (fp[i * 3 + 1] < 0) {
        fp[i * 3] = cx + (Math.random() - 0.5) * spread * 2;
        fp[i * 3 + 1] = fallY * (0.4 + Math.random() * 0.7);
        fp[i * 3 + 2] = cz + (Math.random() - 0.5) * spread * 2;
      }
    }
    flakes.geometry.attributes.position.needsUpdate = true;

    let si = 0, sai = 0;
    for (const p of plows) {
      const route = p.route;
      if (!route || !route.length) continue;
      if (p._pi >= route.length) p._pi = 0;
      const wp = route[p._pi];
      const dx = wp[0] - p.G.position.x, dz = wp[1] - p.G.position.z, dist = Math.hypot(dx, dz);
      if (dist < 4.2) { p._pi = (p._pi + 1) % route.length; }
      const want = Math.atan2(dx, dz);
      let dYaw = want - p.yaw;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      p.yaw += Math.max(-1.8 * dt, Math.min(1.8 * dt, dYaw));
      p.fwd = 11;
      p.G.position.x += Math.sin(p.yaw) * p.fwd * dt;
      p.G.position.z += Math.cos(p.yaw) * p.fwd * dt;
      p.G.position.y = p.com;
      p.G.rotation.set(0, p.yaw, 0);
      const wheels = p.mesh.userData.wheels || [];
      for (const w of wheels) w.rotation.x += p.fwd * dt / (w.userData.r || 0.5);
      const spinner = p.mesh.userData.spinner;
      if (spinner) spinner.rotation.y += dt * 9;
      const beacons = p.mesh.userData.beacons || [];
      const pulse = 0.55 + 0.45 * Math.sin(tAcc * 10 + p._pi);
      for (const b of beacons) {
        if (b.material) b.material.emissiveIntensity = 1.2 + pulse * 2.4;
        b.rotation.y += dt * 8;
      }
      clearAt(p.G.position.x, p.G.position.z, p.yaw);
      // Blade spray to the right-front of the blade
      const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
      const rx = fz, rz = -fx;
      const bx = p.G.position.x + fx * 4.4 + rx * 1.6;
      const bz = p.G.position.z + fz * 4.4 + rz * 1.6;
      for (let k = 0; k < 10 && si < sprayN; k++, si++) {
        const life = (tAcc * 8 + si * 0.17) % 1;
        sp[si * 3] = bx + rx * life * 4.6 + (Math.random() - 0.5) * 0.55;
        sp[si * 3 + 1] = 0.35 + Math.sin(life * Math.PI) * 1.15 * (1 - life * 0.35);
        sp[si * 3 + 2] = bz + rz * life * 4.6 + (Math.random() - 0.5) * 0.55;
      }
      // Salt spinner behind
      const tx = p.G.position.x - fx * 4.2, tz = p.G.position.z - fz * 4.2;
      for (let k = 0; k < 8 && sai < saltN; k++, sai++) {
        const life = (tAcc * 10 + sai * 0.13) % 1;
        const ang = life * Math.PI * 2 + sai;
        sa[sai * 3] = tx + Math.cos(ang) * (0.35 + life * 1.85);
        sa[sai * 3 + 1] = 0.28 + (1 - life) * 0.7;
        sa[sai * 3 + 2] = tz + Math.sin(ang) * (0.35 + life * 1.85);
      }
    }
    for (; si < sprayN; si++) sp[si * 3 + 1] = -20;
    for (; sai < saltN; sai++) sa[sai * 3 + 1] = -20;
    spray.geometry.attributes.position.needsUpdate = true;
    salt.geometry.attributes.position.needsUpdate = true;
  }

  function dispose() {
    scene.remove(group);
    for (const p of plows) if (p.G.parent) p.G.parent.remove(p.G);
    plows.length = 0;
    cover.clear();
  }

  function stats() {
    const blades = plows.reduce((n, p) => n + (p.mesh.userData.blade ? 1 : 0), 0);
    const beacons = plows.reduce((n, p) => n + ((p.mesh.userData.beacons || []).length), 0);
    const spinners = plows.reduce((n, p) => n + (p.mesh.userData.spinner ? 1 : 0), 0);
    return {
      on: true,
      plows: plows.length,
      flakes: nFlakes,
      cleared: api.cleared,
      cells: cover.size,
      blades, beacons, spinners,
      banks: banks.length,
      spray: sprayN,
      salt: saltN,
      plow0: plows[0] ? { x: plows[0].G.position.x, z: plows[0].G.position.z, yaw: plows[0].yaw } : null,
    };
  }

  Object.assign(api, { tick, dressWorld, dispose, snowCover, slipAt, stats, group, cover });
  return api;
}

export function catLifeRoads() {
  const axes = [-168, -120, -72, -24, 24, 72, 120, 168];
  const roads = [];
  const span = 188;
  for (const a of axes) {
    roads.push({ x0: a, z0: -span, x1: a, z1: span, w: 16 });
    roads.push({ x0: -span, z0: a, x1: span, z1: a, w: 16 });
  }
  return roads;
}

export function catLifePlowRoutes() {
  const loop = [
    [24, 24], [24, 168], [168, 168], [168, -168], [-168, -168], [-168, 168], [-72, 168], [-72, 72], [24, 72], [24, 24],
  ];
  const loop2 = [
    [-24, -24], [-24, -168], [72, -168], [72, 24], [120, 24], [120, 120], [-120, 120], [-120, -24], [-24, -24],
  ];
  const loop3 = [
    [72, -72], [168, -72], [168, 72], [-24, 72], [-24, -120], [72, -120], [72, -72],
  ];
  return [loop, loop2, loop3];
}

export function raceCityRoads(mapId) {
  if (mapId === 'california') {
    return [
      { x0: -400, z0: 0, x1: 400, z1: 0, w: 16 },
      { x0: 0, z0: -80, x1: 0, z1: 220, w: 10 },
    ];
  }
  if (mapId === 'vegas') {
    return [
      { x0: -40, z0: -240, x1: -40, z1: 240, w: 14 },
      { x0: 40, z0: -240, x1: 40, z1: 240, w: 14 },
    ];
  }
  const roads = [];
  for (let x = -150; x <= 150; x += 50) roads.push({ x0: x, z0: -180, x1: x, z1: 180, w: 12 });
  for (let z = -150; z <= 150; z += 50) roads.push({ x0: -180, z0: z, x1: 180, z1: z, w: 12 });
  return roads;
}

export function raceCityPlowRoutes(mapId) {
  if (mapId === 'california') {
    return [
      [[-200, 0], [200, 0], [0, 0], [0, 180], [0, -60], [-200, 0]],
    ];
  }
  if (mapId === 'vegas') {
    return [
      [[-40, -200], [-40, 200], [40, 200], [40, -200], [-40, -200]],
    ];
  }
  return [
    [[0, -150], [0, 150], [50, 150], [50, -150], [0, -150]],
    [[-50, -100], [-50, 100], [100, 100], [100, -100], [-50, -100]],
    [[-100, 0], [150, 0], [150, 50], [-100, 50], [-100, 0]],
  ];
}
