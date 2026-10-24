// Exact orange tabby from Cat City 3D / Xenonite Builder.
// Same boxes, colors, scale, and limb groups. Do not restyle.
export function makeCat(THREE){
  const g = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({color:0xf0983c, roughness:.9});
  const str = new THREE.MeshStandardMaterial({color:0xa4521a, roughness:.9});
  const wht = new THREE.MeshStandardMaterial({color:0xfff2df, roughness:.9});
  const eye = new THREE.MeshStandardMaterial({color:0x66ee66, emissive:0x226622});
  const pink = new THREE.MeshStandardMaterial({color:0xff8fa8});
  const mesh = (geo, mat, x=0, y=0, z=0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; return m; };
  const B = (w,h,d,mat,x,y,z,parent=g) => { const m = mesh(new THREE.BoxGeometry(w,h,d), mat, x,y,z); parent.add(m); return m; };
  B(.36,.3,.72, fur, 0,.34,0);
  for(const z of [-.24,-.06,.12]) B(.38,.32,.07, str, 0,.34,z);
  B(.3,.04,.5, str, 0,.5,-.02);
  B(.26,.12,.5, wht, 0,.22,.02);
  const head = new THREE.Group(); head.position.set(0,.52,.42); g.add(head);
  B(.34,.28,.28, fur, 0,0,0, head);
  B(.06,.03,.2, str, 0,.15,-.02, head); B(.06,.03,.2, str, -.09,.145,-.02, head); B(.06,.03,.2, str, .09,.145,-.02, head);
  for(const s of [-1,1]){ const ear = mesh(new THREE.ConeGeometry(.075,.15,4), fur, s*.1,.2,-.02); ear.rotation.y = Math.PI/4; head.add(ear); B(.065,.065,.02, eye, s*.08,.03,.145, head); }
  B(.17,.1,.05, wht, 0,-.07,.14, head); B(.05,.04,.03, pink, 0,-.03,.17, head);
  const legs = [];
  for(const [x,z] of [[-.12,.25],[.12,.25],[-.12,-.25],[.12,-.25]]){ const lg = new THREE.Group(); lg.position.set(x,.24,z); g.add(lg); B(.1,.24,.1, fur, 0,-.12,0, lg); B(.105,.05,.105, wht, 0,-.22,0, lg); legs.push(lg); }
  const tail = new THREE.Group(); tail.position.set(0,.42,-.36); g.add(tail);
  const t1 = B(.08,.08,.42, fur, 0,.1,-.18, tail); t1.rotation.x = -0.6; B(.09,.09,.06, str, 0,.12,-.2, tail).rotation.x = -0.6; B(.09,.09,.06, str, 0,.22,-.34, tail).rotation.x = -0.6;
  g.scale.setScalar(1.25);
  g.userData = {legs, tail, head};
  return g;
}
