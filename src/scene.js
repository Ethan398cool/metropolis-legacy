import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

export function createScene(scene){
  // ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({color:0x222233}));
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  // simple skyline block placeholders
  for(let i=0;i<8;i++){
    const w = 6 + Math.random()*8;
    const h = 8 + Math.random()*40;
    const geo = new THREE.BoxGeometry(w, h, w);
    const mat = new THREE.MeshStandardMaterial({color:0x8888aa});
    const m = new THREE.Mesh(geo, mat);
    m.position.set((i-4)*12, h/2, -20 - Math.random()*60);
    scene.add(m);
  }
}

export function spawnBuilding(scene, pos){
  const geo = new THREE.BoxGeometry(10, 40, 10);
  const mat = new THREE.MeshStandardMaterial({color:0x996633});
  const b = new THREE.Mesh(geo, mat);
  b.position.copy(pos);
  b.userData.hp = 200;
  scene.add(b);
  return b;
}

export function spawnCivilians(scene, n=5){
  const arr = [];
  for(let i=0;i<n;i++){
    const geo = new THREE.SphereGeometry(0.6,8,8);
    const mat = new THREE.MeshStandardMaterial({color:0xffcc88});
    const m = new THREE.Mesh(geo, mat);
    m.position.set((Math.random()-0.5)*10, 1, -5 + Math.random()*20);
    scene.add(m);
    arr.push({mesh:m, panic:false, saved:false, beingCarried:false});
  }
  return arr;
}

export function spawnDrone(scene, pos){
  const geo = new THREE.BoxGeometry(2,1,2);
  const mat = new THREE.MeshStandardMaterial({color:0x2233ff});
  const d = new THREE.Mesh(geo, mat);
  d.position.copy(pos);
  scene.add(d);
  d.userData.hp = 50;
  d.userData.time = 0;
  return d;
}
