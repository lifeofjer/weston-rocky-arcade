// Realistic glTF cars for Race City 3D.
// Templates: Ferrari 458 (sports/Roadster), Khronos Car Concept (sedan/SUV/pickup),
// Cesium Milk Truck (truck/semi cab). See race-city-assets/CREDITS.txt.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mkPaint } from './arcade-cars.js';

const _box = { min:null, max:null };

export async function loadCarKit(THREE, opts={}){
  const { MAT } = opts;
  const loader = new GLTFLoader();
  const base = new URL('./race-city-assets/', import.meta.url).href;
  const templates = {};

  async function loadOne(file){
    try {
      const gltf = await loader.loadAsync(base + file);
      gltf.scene.updateMatrixWorld(true);
      return gltf.scene;
    } catch (e) {
      console.warn('Race City: failed to load', file, e);
      return null;
    }
  }

  const [ferrari, concept, truck] = await Promise.all([
    loadOne('ferrari.glb'),
    loadOne('CarConcept.glb'),
    loadOne('CesiumMilkTruck.glb'),
  ]);
  if(ferrari) templates.ferrari = ferrari;
  if(concept) templates.concept = concept;
  if(truck) templates.truck = truck;

  function deepClone(src){
    const g = src.clone(true);
    g.traverse(o=>{
      if(o.isMesh){
        o.geometry = o.geometry.clone();
        if(Array.isArray(o.material)) o.material = o.material.map(m=>m.clone());
        else if(o.material) o.material = o.material.clone();
      }
    });
    return g;
  }

  function pruneInterior(root){
    const dead=[];
    root.traverse(o=>{
      const n=o.name||'';
      if(/^(Interior|steering|leather|carpet|pedal)/i.test(n) || /steering_/.test(n) || n==='interior_light' || n==='leather' || n==='carpet') dead.push(o);
    });
    for(const o of dead){ if(o.parent) o.parent.remove(o); }
  }

  function facePlusZ(root){
    const p = new THREE.Vector3();
    let z=0, n=0;
    root.updateMatrixWorld(true);
    root.traverse(o=>{
      const nm=o.name||'';
      if(/Headlight|lights$|BodyHeadlights|^lights$/i.test(nm) && !/red|tail|brake/i.test(nm)){
        o.getWorldPosition(p); z+=p.z; n++;
      }
    });
    if(n && z/n < 0) root.rotation.y += Math.PI;
  }

  function fitToDef(root, def){
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if(size.x > size.z * 1.15){
      root.rotation.y += Math.PI/2;
      root.updateMatrixWorld(true);
      box.setFromObject(root);
      box.getSize(size);
    }
    facePlusZ(root);
    root.updateMatrixWorld(true);
    box.setFromObject(root);
    box.getSize(size);
    const s = def.L / Math.max(0.2, size.z);
    const sy = def.type==='suv' || def.type==='jeep' || def.type==='gwagon' || def.type==='pickup' ? s * 1.12 : s;
    root.scale.set(s, sy, s);
    root.updateMatrixWorld(true);
    box.setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    root.position.x -= c.x;
    root.position.z -= c.z;
    root.position.y -= box.min.y;
    root.updateMatrixWorld(true);
    box.setFromObject(root);
    return { top: box.max.y, width: box.max.x - box.min.x };
  }

  function paintBody(root, def){
    const paint = mkPaint(THREE, def.color, def.envBoost || 1);
    const body = [paint];
    root.traverse(o=>{
      if(!o.isMesh) return;
      const nm = o.name||'';
      const mn = (o.material && o.material.name) || '';
      o.castShadow = true;
      o.receiveShadow = true;
      if(/glass|window|windshield|gasket/i.test(nm+mn) && !/trim|paint|body/i.test(mn)){
        o.userData.glass = true;
        o.userData.keep = true;
        if(MAT && MAT.glass){
          const g = MAT.glass.clone();
          g.transmission = 0.55; g.opacity = 0.35; g.transparent = true; g.roughness = 0.04;
          g.envMapIntensity = 2.2; g.color.set(0x0a1520);
          o.material = g;
        }
        return;
      }
      if(/tire|tyre/i.test(nm+mn)){
        o.userData.noDent = true; o.userData.keep = true;
        if(MAT && MAT.tire) o.material = MAT.tire;
        return;
      }
      if(/rim|disc|brake|nut|centre|center/i.test(nm) && !/light/i.test(nm)){
        o.userData.noDent = true; o.userData.keep = true;
        return;
      }
      if(/headlight|^lights$|leds|Projector/i.test(nm+mn) && !/tail|brake|red/i.test(nm+mn)){
        o.userData.part = 'light';
        if(MAT && MAT.head){ const m=MAT.head.clone(); m.emissiveIntensity=3.2; o.material=m; }
        return;
      }
      if(/tail|brake.?light|lights_red|Signallight|Brakelight|Turn_Signal/i.test(nm+mn)){
        o.userData.part = 'light';
        if(MAT && MAT.tail){ const m=MAT.tail.clone(); m.emissiveIntensity=2.4; o.material=m; }
        return;
      }
      if(/chrome|metal_chrome/i.test(nm+mn)){
        if(MAT && MAT.chrome) o.material = MAT.chrome;
        return;
      }
      if(/mirror/i.test(nm)){
        o.userData.part = 'mirror';
        o.material = paint;
        return;
      }
      if(/hood/i.test(nm)){
        o.userData.part = 'hood';
        o.material = paint;
        return;
      }
      if(/door/i.test(nm) && !/interior|window|gasket|handle/i.test(nm)){
        o.userData.part = 'door';
        o.material = paint;
        return;
      }
      if(/paint|body|Body_Color|panels|roof/i.test(nm+mn) && !/window|glass|gasket|light|wiper|interior/i.test(nm)){
        o.material = paint;
      }
    });
    return body;
  }

  function collectWheels(root, THREE){
    const wheels=[];
    const names=[];
    root.traverse(o=> names.push(o));
    const groups = names.filter(o=>{
      const n=o.name||'';
      return /^(wheel_fl|wheel_fr|wheel_rl|wheel_rr)$/i.test(n) || /^Wheel(Front|Rear)[LR]$/.test(n) || n==='Wheels' || n==='Wheels.001';
    });
    for(const o of groups){
      const box = new THREE.Box3().setFromObject(o);
      const size = box.getSize(new THREE.Vector3());
      const r = Math.max(0.18, Math.min(size.y, size.z, size.x) * 0.5);
      const front = /f[lr]$|Front/i.test(o.name||'');
      o.userData.wheel = true;
      o.userData.front = front;
      o.userData.r = r;
      o.userData.spin = o;
      o.userData.keep = true;
      o.userData.noDent = true;
      o.traverse(c=>{ c.userData.noDent = true; c.userData.keep = true; });
      wheels.push(o);
    }
    return wheels;
  }

  function addRockets(THREE, root, def){
    if(!(def.rockets || def.fly || def.roadster) || !MAT) return;
    const box = new THREE.Box3().setFromObject(root);
    for(const s of [-1,1]){
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,.55,10).rotateX(Math.PI/2), MAT.chrome || MAT.steel);
      tube.position.set(s*(def.W*.28), .28, box.min.z + .2);
      tube.userData.part = 'rocket';
      root.add(tube);
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.08,8).rotateX(Math.PI/2), MAT.tail);
      glow.position.set(s*(def.W*.28), .28, box.min.z - .08);
      glow.userData.part = 'rocket';
      root.add(glow);
    }
  }

  function addLightbar(THREE, root, def){
    if(!(def.bar || def.police) || !MAT) return;
    const box = new THREE.Box3().setFromObject(root);
    const y = box.max.y + .02;
    const z = (box.min.z + box.max.z) * .15;
    const rb = MAT.red.clone(), bb = MAT.blue.clone();
    const a = new THREE.Mesh(new THREE.BoxGeometry(.62,.13,.3), rb);
    a.position.set(-.32, y, z); a.userData.part='lightbar'; a.userData.keep=true; root.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.62,.13,.3), bb);
    b.position.set(.32, y, z); b.userData.part='lightbar'; b.userData.keep=true; root.add(b);
    return [rb, bb];
  }

  function addTrailer(THREE, root, def){
    if(!(def.type==='semi' || def.type==='tsemi')) return;
    const box = new THREE.Box3().setFromObject(root);
    const trailerMat = new THREE.MeshPhysicalMaterial({color:0xf4f4f6, metalness:.35, roughness:.32, clearcoat:.5, side:THREE.DoubleSide});
    const tLen = Math.max(8, def.L * .62);
    const t = new THREE.Mesh(new THREE.BoxGeometry(def.W||2.5, 2.7, tLen, 1, 2, 6), trailerMat);
    t.position.set(0, 1.55, box.min.z - tLen/2 - .4);
    t.castShadow = true; t.receiveShadow = true;
    root.add(t);
    if(MAT && MAT.tail){
      const bar = new THREE.Mesh(new THREE.BoxGeometry(def.W*.9, .1, .08), MAT.tail);
      bar.position.set(0, .9, box.min.z - tLen - .4);
      root.add(bar);
    }
    return trailerMat;
  }

  function templateName(def){
    if(def.type==='semi' || def.type==='tsemi') return templates.truck ? 'truck' : null;
    if(def.big || def.type==='cyber' || def.type==='monster' || def.type==='fire') return null;
    if(def.ram || def.powerWagon || def.type==='pickup' || def.type==='jeep' || def.type==='gwagon') return null;
    if(def.roadster || def.type==='hyper' || def.type==='sport') return templates.ferrari ? 'ferrari' : (templates.concept ? 'concept' : null);
    return templates.concept ? 'concept' : (templates.ferrari ? 'ferrari' : null);
  }

  function build(def, extra={}){
    const key = templateName(def);
    if(!key || !templates[key]) return null;
    const root = deepClone(templates[key]);
    pruneInterior(root);
    const wrap = new THREE.Group();
    wrap.add(root);
    const body = paintBody(root, def);
    const fitDef = key==='truck' ? Object.assign({}, def, { L: Math.min(def.L, 7.2) }) : def;
    const fit = fitToDef(root, fitDef);
    const wheels = collectWheels(root, THREE);
    const bars = addLightbar(THREE, root, def);
    addRockets(THREE, root, def);
    const trailerMat = addTrailer(THREE, root, def);
    if(trailerMat) body.push(trailerMat);
    wrap.userData = { wheels, body, top: fit.top, bars: bars || null, gltf: key };
    wrap.traverse(o=>{
      if(o.isMesh && o.material && o.material.clearcoat>0) o.material.envMapIntensity = Math.max(o.material.envMapIntensity||1, 1.6);
    });
    return wrap;
  }

  return {
    ready: Object.keys(templates).length>0,
    templates: Object.keys(templates),
    build,
  };
}
