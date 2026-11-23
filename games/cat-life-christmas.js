// Cat Life City 3D — Christmas at home.
// Tree, lights, stockings, fireplace, activity list, Christmas Eve sleigh, morning presents.

import { isChristmas as seasonOn, christmasSeasonYear } from '../shared/arcade-theme.js';

const ACTS = [
  { id: 'tree', label: 'Decorate the tree' },
  { id: 'lights', label: 'Hang lights outside' },
  { id: 'cookies', label: 'Bake cookies' },
  { id: 'snowman', label: 'Build a snowman' },
  { id: 'milk', label: 'Leave milk and cookies' },
];

const GIFTS = [
  { id: 'coins', name: 'COIN POUCH', kind: 'coins', amount: 25 },
  { id: 'santa-hat', name: 'SANTA HAT', kind: 'hat' },
  { id: 'toy-car', name: 'TOY CAR', kind: 'item' },
  { id: 'yarn', name: 'YARN TOY', kind: 'item' },
];

function emptyXmas(year) {
  return {
    year: year || christmasSeasonYear(),
    activities: { tree: false, lights: false, cookies: false, snowman: false, milk: false },
    ornaments: 0,
    slept: false,
    opened: false,
    gifts: [],
  };
}

function mat(THREE, cache, color, extra) {
  const k = color + ':' + (extra || '');
  if (!cache[k]) {
    cache[k] = new THREE.MeshStandardMaterial({
      color,
      roughness: extra === 'shiny' ? 0.25 : extra === 'glow' ? 0.4 : 0.82,
      metalness: extra === 'shiny' ? 0.55 : 0.06,
      emissive: extra === 'glow' ? color : 0x000000,
      emissiveIntensity: extra === 'glow' ? 0.7 : 0,
    });
  }
  return cache[k];
}

function box(THREE, parent, w, h, d, m, x, y, z) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  parent.add(o);
  return o;
}

function sph(THREE, parent, r, m, x, y, z, seg = 8) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  parent.add(o);
  return o;
}

function cone(THREE, parent, r, h, m, x, y, z) {
  const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  parent.add(o);
  return o;
}

function makeTree(THREE, mats, tall) {
  const g = new THREE.Group();
  box(THREE, g, 0.22, 0.7, 0.22, mats.wood, 0, 0.35, 0);
  cone(THREE, g, 1.15, 1.3, mats.pine, 0, 1.15, 0);
  cone(THREE, g, 0.92, 1.15, mats.pine, 0, 1.85, 0);
  cone(THREE, g, 0.68, 1.0, mats.pine, 0, 2.5, 0);
  const star = cone(THREE, g, 0.16, 0.28, mats.gold, 0, 3.12, 0);
  star.visible = false;
  g.userData.star = star;
  g.userData.ornaments = [];
  const cols = [0xff4040, 0xffd21e, 0x2a6cff, 0xff8fa8, 0x77ccff];
  const spots = [
    [-0.55, 1.05, 0.35], [0.5, 1.15, -0.2], [0.15, 1.45, 0.55],
    [-0.4, 1.7, -0.25], [0.42, 1.9, 0.22], [-0.2, 2.15, 0.4],
    [0.28, 2.35, -0.18], [-0.32, 2.5, 0.12],
  ];
  for (let i = 0; i < spots.length; i++) {
    const o = sph(THREE, g, 0.09, mat(THREE, {}, cols[i % cols.length], 'glow'), spots[i][0], spots[i][1], spots[i][2], 8);
    o.visible = false;
    g.userData.ornaments.push(o);
  }
  if (tall) g.scale.setScalar(1.15);
  return g;
}

function makeFireplace(THREE, mats) {
  const g = new THREE.Group();
  box(THREE, g, 2.2, 1.8, 0.55, mats.brick, 0, 0.9, 0);
  box(THREE, g, 1.15, 0.85, 0.35, mats.black, 0, 0.7, 0.12);
  const glow = box(THREE, g, 0.9, 0.45, 0.08, mats.fire, 0, 0.55, 0.28);
  glow.userData.fire = true;
  box(THREE, g, 2.4, 0.18, 0.7, mats.wood, 0, 1.82, 0.05);
  g.userData.stockings = [];
  const sockCols = [0xff4040, 0x2a6cff, 0xffd21e];
  for (let i = 0; i < 3; i++) {
    const s = box(THREE, g, 0.22, 0.45, 0.08, mat(THREE, {}, sockCols[i]), -0.55 + i * 0.55, 1.45, 0.38);
    g.userData.stockings.push(s);
  }
  return g;
}

function makeKitchen(THREE, mats) {
  const g = new THREE.Group();
  box(THREE, g, 2.4, 0.9, 0.85, mats.wood, 0, 0.45, 0);
  box(THREE, g, 2.4, 0.08, 0.9, mats.counter, 0, 0.92, 0);
  box(THREE, g, 0.7, 0.12, 0.55, mats.black, -0.55, 0.98, 0.05);
  const oven = box(THREE, g, 0.55, 0.45, 0.08, mats.black, 0.55, 0.45, 0.44);
  oven.userData.oven = true;
  const tray = box(THREE, g, 0.5, 0.05, 0.35, mats.gold, 0.1, 1.0, 0.1);
  tray.visible = false;
  g.userData.tray = tray;
  for (let i = 0; i < 4; i++) {
    const c = sph(THREE, g, 0.07, mats.cookie, -0.05 + (i % 2) * 0.16, 1.08, 0.02 + Math.floor(i / 2) * 0.14, 8);
    c.visible = false;
    (g.userData.cookies || (g.userData.cookies = [])).push(c);
  }
  return g;
}

function makeSnowman(THREE, mats) {
  const g = new THREE.Group();
  sph(THREE, g, 0.55, mats.snow, 0, 0.55, 0, 10);
  sph(THREE, g, 0.4, mats.snow, 0, 1.25, 0, 10);
  sph(THREE, g, 0.28, mats.snow, 0, 1.78, 0, 10);
  box(THREE, g, 0.38, 0.12, 0.38, mats.black, 0, 2.02, 0);
  box(THREE, g, 0.55, 0.05, 0.55, mats.black, 0, 1.95, 0);
  const nose = cone(THREE, g, 0.05, 0.22, mats.carrot, 0, 1.75, 0.28);
  nose.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) sph(THREE, g, 0.04, mats.black, s * 0.08, 1.82, 0.22, 6);
  g.visible = false;
  return g;
}

function makePresent(THREE, mats, color, x, z) {
  const g = new THREE.Group();
  box(THREE, g, 0.55, 0.42, 0.55, mat(THREE, {}, color), 0, 0.22, 0);
  box(THREE, g, 0.58, 0.08, 0.12, mats.gold, 0, 0.42, 0);
  box(THREE, g, 0.12, 0.08, 0.58, mats.gold, 0, 0.42, 0);
  const lid = box(THREE, g, 0.58, 0.08, 0.58, mat(THREE, {}, color), 0, 0.46, 0);
  g.userData.lid = lid;
  g.position.set(x, 0, z);
  g.userData.opened = false;
  return g;
}

function makeSleigh(THREE, mats) {
  const g = new THREE.Group();
  box(THREE, g, 1.6, 0.35, 0.7, mats.sleigh, 0, 0, 0);
  box(THREE, g, 0.12, 0.45, 0.7, mats.sleigh, -0.75, 0.15, 0);
  box(THREE, g, 1.5, 0.06, 0.08, mats.gold, 0, -0.28, 0.32);
  box(THREE, g, 1.5, 0.06, 0.08, mats.gold, 0, -0.28, -0.32);
  const deer = [];
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Group();
    box(THREE, d, 0.22, 0.28, 0.5, mats.deer, 0, 0, 0);
    sph(THREE, d, 0.12, mats.deer, 0, 0.18, 0.28, 6);
    for (const s of [-1, 1]) {
      box(THREE, d, 0.03, 0.22, 0.03, mats.antler, s * 0.08, 0.38, 0.28);
      box(THREE, d, 0.16, 0.03, 0.03, mats.antler, s * 0.14, 0.46, 0.28);
    }
    d.position.set(0.2 - i * 0.08, -0.05, 1.1 + i * 0.85);
    g.add(d);
    deer.push(d);
  }
  g.userData.deer = deer;
  return g;
}

function makeSantaHat(THREE, parent) {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xff3030, roughness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfff6f0, roughness: 0.85 });
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 8), red);
  hat.position.set(0, 0.16, -0.02);
  hat.rotation.z = 0.25;
  g.add(hat);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 10), white);
  brim.rotation.x = Math.PI / 2;
  g.add(brim);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), white);
  pom.position.set(0.1, 0.3, -0.02);
  g.add(pom);
  g.position.set(0, 0.22, 0);
  parent.add(g);
  return g;
}

function makeToyCar(THREE) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.28), new THREE.MeshStandardMaterial({ color: 0x2a6cff, roughness: 0.4, metalness: 0.2 }));
  body.position.y = 0.16;
  g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.26), new THREE.MeshStandardMaterial({ color: 0x9fd4ff, roughness: 0.3 }));
  cab.position.set(0.04, 0.28, 0);
  g.add(cab);
  return g;
}

function makeYarn(THREE) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff4040, roughness: 0.7 }));
  g.add(ball);
  return g;
}

export function installCatLifeChristmas(THREE, ctx) {
  const on = ctx.force === true ? true : ctx.force === false ? false : seasonOn(ctx.themeOpts);
  const year = christmasSeasonYear();
  const api = {
    on,
    year,
    phase: 'off', // off | list | eve | morning | done
    activities: {},
    ornaments: 0,
    presents: [],
    giftsGiven: [],
    nightT: 0,
    unwrapT: 0,
    unwrapping: null,
  };
  if (!on) {
    api.prompt = () => null;
    api.tryInteract = () => null;
    api.tick = () => {};
    api.syncHouse = () => {};
    api.dispose = () => {};
    api.state = () => ({ on: false, phase: 'off' });
    api.doActivity = () => false;
    api.sleepNow = () => false;
    api.openPresent = () => false;
    api.replay = () => false;
    api.applyOutfit = () => {};
    api.allDone = () => false;
    return api;
  }

  const cache = {};
  const mats = {
    pine: mat(THREE, cache, 0x1f7a3a),
    wood: mat(THREE, cache, 0x6b3a1a),
    gold: mat(THREE, cache, 0xffd21e, 'shiny'),
    brick: mat(THREE, cache, 0xa84a38),
    black: mat(THREE, cache, 0x1a1c20),
    fire: new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5500, emissiveIntensity: 1.6, toneMapped: false }),
    counter: mat(THREE, cache, 0xe8dcc8),
    cookie: mat(THREE, cache, 0xc47a3a),
    snow: mat(THREE, cache, 0xf4f7fb),
    carrot: mat(THREE, cache, 0xff7a1a),
    sleigh: mat(THREE, cache, 0xa01018),
    deer: mat(THREE, cache, 0x6b4a28),
    antler: mat(THREE, cache, 0xcbb48a),
    milk: mat(THREE, cache, 0xf4f4f0),
  };

  const root = new THREE.Group();
  root.name = 'xmasHome';
  ctx.scene.add(root);

  const houses = new Map();
  const fade = ctx.fadeEl;
  const listEl = ctx.listEl;
  const replayEl = ctx.replayEl;

  function saveObj() {
    return ctx.getSave();
  }
  function persist() { ctx.persist(); }

  function ensureSave() {
    const s = saveObj();
    if (!s.xmas || s.xmas.year !== year) s.xmas = emptyXmas(year);
    if (!Array.isArray(s.items)) s.items = [];
    if (!s.outfit) s.outfit = 'none';
    return s.xmas;
  }

  function allActs(x) {
    return ACTS.every(a => x.activities[a.id]);
  }

  function refreshHud() {
    const x = ensureSave();
    api.phase = x.opened ? 'done' : (x.slept ? 'morning' : 'list');
    api.activities = { ...x.activities };
    api.ornaments = x.ornaments | 0;
    if (listEl) {
      const title = typeof document !== 'undefined' && document.getElementById('title');
      const playing = !title || title.classList.contains('hidden');
      if (!on || api.phase === 'eve' || !playing) { listEl.classList.add('hidden'); }
      else {
        const rows = ACTS.map(a => {
          const ok = x.activities[a.id];
          return `<div class="xmas-act${ok ? ' on' : ''}">${ok ? '✓' : '○'} ${a.label}</div>`;
        }).join('');
        const next = allActs(x)
          ? (x.slept ? (x.opened ? 'Merry Christmas!' : 'Open presents under the tree!') : 'Sleep in the bed for Christmas morning!')
          : 'Christmas Day list — walk up and ENTER';
        listEl.innerHTML = `<b>CHRISTMAS DAY</b>${rows}<small>${next}</small>`;
        listEl.classList.remove('hidden');
      }
    }
    if (replayEl) {
      if (x.opened) replayEl.classList.remove('hidden');
      else replayEl.classList.add('hidden');
    }
  }

  function houseSpots(H) {
    const x = H.x, z = H.z, w = H.w, d = H.d, h = H.h;
    const floorY = H.floors >= 2 ? (H.pool ? 4.35 : 3.28) : 0;
    return {
      tree: [x - w * 0.22, 0, z - d * 0.12],
      fire: [x, 0.9, z - d / 2 + 0.45],
      kitchen: [x + w * 0.28, 0, z + d * 0.08],
      snowman: [x + w * 0.7, 0, z + d / 2 + 7.2],
      lights: [x - w * 0.55, 0, z + d / 2 + 0.6],
      milk: [x - w * 0.22, 0.2, z - d * 0.12 + 0.9],
      bed: [x + w * 0.18, floorY, z - d * 0.18],
      presents: [x - w * 0.22, z - d * 0.12 + 0.85],
    };
  }

  function buildForHouse(H) {
    if (houses.has(H.id)) {
      const old = houses.get(H.id);
      if (old.g.parent) old.g.parent.remove(old.g);
    }
    const spots = houseSpots(H);
    const g = new THREE.Group();
    g.userData.houseId = H.id;
    const tree = makeTree(THREE, mats, !!H.pool);
    tree.position.set(spots.tree[0], 0, spots.tree[2]);
    g.add(tree);
    const fire = makeFireplace(THREE, mats);
    fire.position.set(spots.fire[0], 0, spots.fire[2]);
    g.add(fire);
    const kitchen = makeKitchen(THREE, mats);
    kitchen.position.set(spots.kitchen[0], 0, spots.kitchen[2]);
    g.add(kitchen);
    const snowman = makeSnowman(THREE, mats);
    snowman.position.set(spots.snowman[0], 0, spots.snowman[2]);
    root.add(snowman); // yard, not inside house group
    const milk = new THREE.Group();
    box(THREE, milk, 0.12, 0.18, 0.12, mats.milk, -0.12, 0.12, 0);
    sph(THREE, milk, 0.07, mats.cookie, 0.12, 0.08, 0.05, 8);
    sph(THREE, milk, 0.07, mats.cookie, 0.2, 0.08, -0.04, 8);
    milk.position.set(spots.milk[0], 0.18, spots.milk[2]);
    milk.visible = false;
    g.add(milk);
    // Outdoor string lights on the front
    const lights = new THREE.Group();
    const glowCols = [0xff4040, 0xffd21e, 0x4cff6a, 0x2a6cff];
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const lx = H.x + (t - 0.5) * (H.w - 0.8);
      const ly = H.h * 0.72 + Math.sin(t * Math.PI) * 0.25;
      const lz = H.z + H.d / 2 + 0.28;
      const b = sph(THREE, lights, 0.07, new THREE.MeshStandardMaterial({
        color: glowCols[i % glowCols.length], emissive: glowCols[i % glowCols.length], emissiveIntensity: 1.3, toneMapped: false,
      }), lx, ly, lz, 6);
      b.userData.pulse = i;
    }
    lights.visible = false;
    root.add(lights);
    const presents = [];
    const pCols = [0xff4040, 0x2a6cff, 0xffd21e, 0x4cff6a];
    GIFTS.forEach((gift, i) => {
      const p = makePresent(THREE, mats, pCols[i], spots.presents[0] + (i - 1.5) * 0.55, spots.presents[1]);
      p.visible = false;
      p.userData.gift = gift;
      g.add(p);
      presents.push(p);
    });
    root.add(g);
    houses.set(H.id, { H, g, tree, fire, kitchen, snowman, milk, lights, presents, spots });
    applyProgress(H.id);
    return houses.get(H.id);
  }

  function applyProgress(hid) {
    const rec = houses.get(hid);
    if (!rec) return;
    const x = ensureSave();
    rec.tree.userData.ornaments.forEach((o, i) => { o.visible = i < (x.ornaments | 0); });
    rec.tree.userData.star.visible = !!x.activities.tree;
    rec.lights.visible = !!x.activities.lights;
    rec.kitchen.userData.tray.visible = !!x.activities.cookies;
    (rec.kitchen.userData.cookies || []).forEach(c => { c.visible = !!x.activities.cookies; });
    rec.snowman.visible = !!x.activities.snowman;
    rec.milk.visible = !!x.activities.milk;
    const showPresents = !!x.slept;
    rec.presents.forEach((p, i) => {
      const gift = GIFTS[i];
      const already = (x.gifts || []).includes(gift.id);
      p.visible = showPresents && (!x.opened || !already);
      p.userData.opened = already;
      if (p.userData.lid) p.userData.lid.rotation.x = already ? -1.1 : 0;
    });
  }

  function syncHouse(houseList) {
    for (const H of houseList) {
      if (H.id === 'starter' || H.id === 'villa') buildForHouse(H);
    }
    refreshHud();
    applyOutfit();
  }

  function recFor(hid) {
    return houses.get(hid) || houses.get(ctx.currentHouseId());
  }

  function near(P, pos, r) {
    return P && pos && Math.hypot(P.x - pos[0], P.z - pos[2] != null ? pos[2] : pos[1]) < r;
  }

  function near2(P, x, z, r) {
    return P && Math.hypot(P.x - x, P.z - z) < r;
  }

  function currentRec() {
    const id = ctx.currentHouseId();
    return houses.get(id) || houses.get('starter');
  }

  function prompt(P, form, inside) {
    const x = ensureSave();
    const rec = currentRec();
    if (!rec) return null;
    const S = rec.spots;
    if (api.phase === 'eve') return { html: 'CHRISTMAS EVE<small>Look up! A sleigh!</small>', act: 'WAIT' };
    if (x.slept && !x.opened && inside) {
      if (near2(P, S.presents[0], S.presents[1], 2.4)) return { html: 'CHRISTMAS MORNING!<small>ENTER to unwrap a present</small>', act: 'OPEN' };
      return { html: 'CHRISTMAS MORNING<small>presents under the tree!</small>', act: 'OPEN' };
    }
    if (inside && allActs(x) && !x.slept) {
      if (near2(P, S.bed[0], S.bed[2], 2.2) && (P.y || 0) > (S.bed[1] - 0.8)) {
        return { html: 'SLEEP<small>Christmas Eve night — then presents in the morning</small>', act: 'SLEEP' };
      }
    }
    if (form !== 'cat') return null;
    if (inside && !x.activities.tree && near2(P, S.tree[0], S.tree[2], 2.2)) {
      return { html: x.ornaments < 8 ? 'DECORATE THE TREE<small>ENTER to hang an ornament</small>' : 'STAR ON TOP<small>ENTER to place the star</small>', act: 'HANG' };
    }
    if (inside && !x.activities.cookies && near2(P, S.kitchen[0], S.kitchen[2], 2.0)) {
      return { html: 'BAKE COOKIES<small>ENTER to bake a tray</small>', act: 'BAKE' };
    }
    if (inside && x.activities.cookies && !x.activities.milk && near2(P, S.milk[0], S.milk[2], 1.8)) {
      return { html: 'MILK AND COOKIES<small>leave a snack for the sleigh</small>', act: 'SET' };
    }
    if (!inside && !x.activities.lights && near2(P, S.lights[0], S.lights[2], 3.2)) {
      return { html: 'HANG LIGHTS<small>string lights on the house</small>', act: 'HANG' };
    }
    if (!inside && !x.activities.snowman && near2(P, S.snowman[0], S.snowman[2], 2.6)) {
      return { html: 'BUILD A SNOWMAN<small>ENTER to roll three snowballs</small>', act: 'BUILD' };
    }
    return null;
  }

  function doActivity(id, rec) {
    const s = saveObj();
    const x = ensureSave();
    rec = rec || currentRec();
    if (!rec) return false;
    if (id === 'tree') {
      if (x.activities.tree) return false;
      x.ornaments = Math.min(8, (x.ornaments | 0) + 1);
      if (x.ornaments >= 8) {
        x.activities.tree = true;
        rec.tree.userData.star.visible = true;
        ctx.popup('STAR!<small>the tree is ready</small>');
        ctx.say('Star on top! The tree looks so happy.');
      } else {
        ctx.popup('ORNAMENT!<small>' + x.ornaments + ' of 8</small>');
        ctx.say('Pretty pretty. Hang more ornaments, then the star!');
      }
      applyProgress(rec.H.id);
      persist(); refreshHud();
      return 'tree';
    }
    if (id === 'lights' && !x.activities.lights) {
      x.activities.lights = true;
      rec.lights.visible = true;
      ctx.popup('TWINKLE!<small>lights on the house</small>');
      ctx.say('The house is glowing! Christmas lights!');
      persist(); refreshHud(); applyProgress(rec.H.id);
      return 'lights';
    }
    if (id === 'cookies' && !x.activities.cookies) {
      x.activities.cookies = true;
      rec.kitchen.userData.tray.visible = true;
      (rec.kitchen.userData.cookies || []).forEach(c => { c.visible = true; });
      ctx.popup('COOKIES!<small>warm from the oven</small>');
      ctx.say('Bake bake! Save some for the sleigh later.');
      persist(); refreshHud(); applyProgress(rec.H.id);
      return 'cookies';
    }
    if (id === 'snowman' && !x.activities.snowman) {
      x.activities.snowman = true;
      rec.snowman.visible = true;
      ctx.popup('SNOWMAN!<small>carrot nose and all</small>');
      ctx.say('Three snowballs, a hat, a carrot. Best snowman.');
      persist(); refreshHud(); applyProgress(rec.H.id);
      return 'snowman';
    }
    if (id === 'milk' && !x.activities.milk) {
      if (!x.activities.cookies) { ctx.say('Bake cookies first!'); return 'need-cookies'; }
      x.activities.milk = true;
      rec.milk.visible = true;
      ctx.popup('SNACK SET<small>milk and cookies by the tree</small>');
      ctx.say('Milk and cookies ready. Time for bed soon!');
      persist(); refreshHud(); applyProgress(rec.H.id);
      return 'milk';
    }
    return false;
  }

  function grantGift(gift) {
    const s = saveObj();
    const x = ensureSave();
    if (x.gifts.includes(gift.id)) return gift;
    x.gifts.push(gift.id);
    if (gift.kind === 'coins') {
      s.coins = (s.coins | 0) + gift.amount;
      ctx.popup('+' + gift.amount + ' COINS<small>Christmas morning!</small>');
    } else if (gift.kind === 'hat') {
      s.outfit = 'santa';
      applyOutfit();
      ctx.popup('SANTA HAT!<small>it stays on your cat</small>');
    } else if (gift.id === 'toy-car') {
      if (!s.items.includes('toy-car')) s.items.push('toy-car');
      ctx.popup('TOY CAR!<small>a tiny city plow pal</small>');
      ctx.placeFurniture && ctx.placeFurniture();
    } else if (gift.id === 'yarn') {
      if (!s.items.includes('yarn')) s.items.push('yarn');
      ctx.popup('YARN TOY!<small>bap bap</small>');
      ctx.placeFurniture && ctx.placeFurniture();
    }
    persist();
    api.giftsGiven = x.gifts.slice();
    return gift;
  }

  function applyOutfit() {
    const cat = ctx.getCat && ctx.getCat();
    if (!cat || !cat.userData || !cat.userData.head) return;
    const s = saveObj();
    if (cat.userData.santaHat) {
      if (cat.userData.santaHat.parent) cat.userData.santaHat.parent.remove(cat.userData.santaHat);
      cat.userData.santaHat = null;
    }
    if (s.outfit === 'santa') {
      cat.userData.santaHat = makeSantaHat(THREE, cat.userData.head);
    }
  }

  function openPresent() {
    const x = ensureSave();
    if (!x.slept) return false;
    const rec = currentRec();
    if (!rec) return false;
    const next = rec.presents.find(p => p.visible && !p.userData.opened);
    if (!next) {
      x.opened = true;
      persist(); refreshHud();
      return 'done';
    }
    next.userData.opened = true;
    api.unwrapping = next;
    api.unwrapT = 1.4;
    const gift = next.userData.gift;
    grantGift(gift);
    ctx.say(gift.name === 'SANTA HAT' ? 'A Santa hat! You look festive.' : 'A surprise! It goes in your save.');
    if (rec.presents.every(p => p.userData.opened || !p.visible)) {
      x.opened = true;
    }
    persist(); refreshHud();
    return gift.id;
  }

  function beginSleep() {
    const x = ensureSave();
    if (!allActs(x) || x.slept) return false;
    api.phase = 'eve';
    api.nightT = 0;
    const rec = currentRec();
    if (rec && ctx.getCat) {
      const cat = ctx.getCat();
      const S = rec.spots;
      cat.position.set(S.bed[0], S.bed[1] + 0.05, S.bed[2]);
      cat.rotation.y = Math.PI;
      ctx.insideHouse(true);
    }
    if (listEl) listEl.classList.add('hidden');
    ctx.popup('GOOD NIGHT<small>Christmas Eve…</small>');
    ctx.say('Sleep sleep. When you wake up it is Christmas morning!');
    if (!api.sleigh) {
      api.sleigh = makeSleigh(THREE, mats);
      api.moon = sph(THREE, ctx.scene, 3.2, new THREE.MeshBasicMaterial({ color: 0xfff4c8 }), 0, 40, 0);
      api.moon.visible = false;
      ctx.scene.add(api.sleigh);
      api.sleigh.visible = false;
    }
    return true;
  }

  function finishMorning() {
    const x = ensureSave();
    x.slept = true;
    api.phase = 'morning';
    api.nightT = 0;
    if (api.sleigh) api.sleigh.visible = false;
    if (api.moon) api.moon.visible = false;
    if (fade) { fade.style.opacity = '0'; fade.classList.add('hidden'); }
    ctx.setNight && ctx.setNight(false);
    houses.forEach(rec => applyProgress(rec.H.id));
    persist(); refreshHud();
    ctx.popup('CHRISTMAS MORNING!<small>presents under the tree</small>');
    ctx.say('Wake up! It is Christmas morning. Open your presents!');
    const rec = currentRec();
    if (rec && ctx.getCat) {
      const cat = ctx.getCat();
      cat.position.set(rec.spots.tree[0] + 0.8, 0, rec.spots.tree[2] + 1.2);
    }
    ctx.insideHouse(true);
    ctx.snapCam && ctx.snapCam();
  }

  function tryInteract(P, form, inside) {
    const x = ensureSave();
    const rec = currentRec();
    if (!rec) return null;
    const S = rec.spots;
    if (x.slept && !x.opened && inside && near2(P, S.presents[0], S.presents[1], 2.6)) {
      return openPresent();
    }
    if (inside && allActs(x) && !x.slept && near2(P, S.bed[0], S.bed[2], 2.4) && (P.y || 0) > (S.bed[1] - 0.9)) {
      return beginSleep() ? 'sleep' : null;
    }
    if (form !== 'cat') return null;
    if (inside && !x.activities.tree && near2(P, S.tree[0], S.tree[2], 2.2)) return doActivity('tree', rec);
    if (inside && !x.activities.cookies && near2(P, S.kitchen[0], S.kitchen[2], 2.0)) return doActivity('cookies', rec);
    if (inside && x.activities.cookies && !x.activities.milk && near2(P, S.milk[0], S.milk[2], 1.8)) return doActivity('milk', rec);
    if (!inside && !x.activities.lights && near2(P, S.lights[0], S.lights[2], 3.4)) return doActivity('lights', rec);
    if (!inside && !x.activities.snowman && near2(P, S.snowman[0], S.snowman[2], 2.8)) return doActivity('snowman', rec);
    return null;
  }

  function replay() {
    const s = saveObj();
    s.xmas = emptyXmas(year);
    api.phase = 'list';
    api.unwrapping = null;
    houses.forEach(rec => applyProgress(rec.H.id));
    persist(); refreshHud();
    ctx.popup('DO CHRISTMAS AGAIN<small>decorate, bake, sleep, presents</small>');
    ctx.say('Another Christmas! Decorate all over again.');
    return true;
  }

  function tick(dt) {
    const x = ensureSave();
    houses.forEach(rec => {
      rec.lights.children.forEach(b => {
        if (b.material && b.material.emissiveIntensity != null) {
          b.material.emissiveIntensity = 0.8 + 0.8 * Math.sin(performance.now() / 220 + (b.userData.pulse || 0));
        }
      });
      rec.fire.traverse(o => {
        if (o.userData.fire && o.material) o.material.emissiveIntensity = 1.2 + Math.sin(performance.now() / 140) * 0.5;
      });
    });
    if (api.unwrapping) {
      api.unwrapT -= dt;
      const lid = api.unwrapping.userData.lid;
      if (lid) lid.rotation.x = -Math.min(1.4, (1.4 - api.unwrapT) * 2);
      api.unwrapping.position.y = Math.max(0, Math.sin(Math.max(0, 1.4 - api.unwrapT) * 4) * 0.15);
      if (api.unwrapT <= 0) {
        api.unwrapping.visible = false;
        api.unwrapping = null;
        if (x.opened && replayEl) replayEl.classList.remove('hidden');
      }
    }
    if (api.phase === 'eve') {
      api.nightT += dt;
      const t = api.nightT;
      if (fade) {
        fade.classList.remove('hidden');
        fade.style.opacity = String(Math.min(0.78, t * 0.55));
      }
      ctx.setNight && ctx.setNight(true);
      if (api.moon) {
        api.moon.visible = true;
        const rec = currentRec();
        const hx = rec ? rec.H.x : 0, hz = rec ? rec.H.z : 0;
        api.moon.position.set(hx + 8, 22, hz - 18);
      }
      if (api.sleigh) {
        api.sleigh.visible = true;
        const rec = currentRec();
        const hx = rec ? rec.H.x : 0, hz = rec ? rec.H.z : 0;
        const u = Math.min(1, (t - 0.6) / 5.5);
        const ang = -0.6 + u * 1.8;
        api.sleigh.position.set(hx + Math.cos(ang) * 16, 18 + Math.sin(u * Math.PI) * 3, hz + Math.sin(ang) * 16);
        api.sleigh.rotation.y = ang + Math.PI / 2;
        api.sleigh.userData.deer.forEach((d, i) => {
          d.rotation.x = Math.sin(t * 10 + i) * 0.15;
        });
      }
      if (t > 7.2) finishMorning();
    }
  }

  function extraFurn() {
    const s = saveObj();
    const rec = houses.get(s.house) || currentRec();
    if (!rec) return [];
    const out = [];
    if (s.items.includes('toy-car')) {
      const m = makeToyCar(THREE);
      m.position.set(rec.spots.tree[0] + 1.2, 0.12, rec.spots.tree[2] + 0.4);
      m.userData.item = 'toy-car';
      out.push(m);
    }
    if (s.items.includes('yarn')) {
      const m = makeYarn(THREE);
      m.position.set(rec.spots.tree[0] + 0.6, 0.16, rec.spots.tree[2] + 1.1);
      m.userData.item = 'yarn';
      out.push(m);
    }
    return out;
  }

  function dispose() {
    if (root.parent) root.parent.remove(root);
    if (api.sleigh && api.sleigh.parent) api.sleigh.parent.remove(api.sleigh);
    if (api.moon && api.moon.parent) api.moon.parent.remove(api.moon);
  }

  function state() {
    const x = ensureSave();
    return {
      on: true,
      phase: api.phase,
      activities: { ...x.activities },
      ornaments: x.ornaments | 0,
      slept: !!x.slept,
      opened: !!x.opened,
      gifts: (x.gifts || []).slice(),
      outfit: saveObj().outfit || 'none',
      presents: (currentRec() ? currentRec().presents : []).map(p => ({ vis: p.visible, opened: !!p.userData.opened, id: p.userData.gift && p.userData.gift.id })),
    };
  }

  if (replayEl) replayEl.onclick = () => replay();
  ensureSave();
  refreshHud();

  Object.assign(api, {
    prompt, tryInteract, tick, syncHouse, dispose, state,
    doActivity: (id) => doActivity(id),
    sleepNow: beginSleep,
    finishMorning,
    openPresent,
    replay,
    applyOutfit,
    extraFurn,
    allDone: () => allActs(ensureSave()),
    ACTS, GIFTS,
    refreshHud,
    applyProgress,
  });
  return api;
}

export { ACTS, GIFTS, emptyXmas };
