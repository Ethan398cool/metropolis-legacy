import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { createScene, spawnBuilding, spawnCivilians, spawnDrone } from './scene.js';
import { initUI, setDistrict, setRestraint, setSavedTotal, showMessage } from './ui.js';

let renderer, scene, camera;
let player = {
  pos: new THREE.Vector3(0, 5, 20),
  vel: new THREE.Vector3(0,0,0),
  speed: 0,
  carrying: null
};

let keys = {};
let pointer = {x:0,y:0};
let precisionMode = false;
let restraint = 100; // 0-100 (higher = more restraint / safer)
let districtIntegrity = 100;
let civilians = [];
let saved = 0;
let totalCivs = 0;
let drone;

export function start(){
  initUI();
  const canvas = document.getElementById('c');
  renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(0,5,40);

  // add lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(10,20,10);
  scene.add(dir);

  createScene(scene);

  // spawn a building and some civs
  spawnBuilding(scene, new THREE.Vector3(0,0,0));
  civilians = spawnCivilians(scene, 6);
  totalCivs = civilians.length;
  setSavedTotal(saved, totalCivs);

  drone = spawnDrone(scene, new THREE.Vector3(20,8,0));

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', (e)=> keys[e.key.toLowerCase()]=true);
  window.addEventListener('keyup', (e)=> keys[e.key.toLowerCase()]=false);
  window.addEventListener('mousemove', (e)=>{
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('mousedown', (e)=>{
    if(e.button===0) strike();
    if(e.button===2) catchOrRedirect();
  });
  window.addEventListener('contextmenu', (e)=> e.preventDefault());
  window.addEventListener('keypress', (e)=>{
    if(e.key.toLowerCase()==='f') togglePrecision();
    if(e.key.toLowerCase()==='r') toggleCarry();
  });

  animate();
}

function onResize(){
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function animate(){
  requestAnimationFrame(animate);
  const dt = 0.016;
  updatePlayer(dt);
  updateDrone(dt);
  updateCivilians(dt);
  updateUISystem(dt);
  renderer.render(scene, camera);
}

function updatePlayer(dt){
  // basic flight input
  const forward = (keys['w']?1:0) - (keys['s']?1:0);
  const strafe = (keys['d']?1:0) - (keys['a']?1:0);
  const ascend = (keys[' ']?1:0) - (keys['control']?1:0);
  const dash = keys['shift'];

  const accel = 40 * (dash?3:1);
  // simple local space movement relative to camera
  const dir = new THREE.Vector3(strafe, ascend, -forward).normalize();
  if(dir.length()>0){
    player.vel.add(dir.multiplyScalar(accel*dt));
  }
  // drag
  player.vel.multiplyScalar(0.95);
  player.pos.addScaledVector(player.vel, dt);

  // clamp height
  if(player.pos.y < 2) player.pos.y = 2;
  if(player.pos.y > 400) player.pos.y = 400;

  // camera follow
  camera.position.lerp(new THREE.Vector3(player.pos.x, player.pos.y+6, player.pos.z+18), 0.12);
  camera.lookAt(player.pos.x, player.pos.y+2, player.pos.z);
}

function strike(){
  // simulate a strike in front of player: raycast from camera
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if(intersects.length===0) return;
  const hit = intersects[0];
  // find object with userData.hp
  let target = hit.object;
  while(target && !target.userData.hp && target.parent) target = target.parent;
  let power = precisionMode ? 1 : 3; // 1=low,3=high
  // reduce restraint on heavy hits
  if(!precisionMode){
    restraint = Math.max(0, restraint - 10);
    districtIntegrity = Math.max(0, districtIntegrity - 6);
    spawnDebris(hit.point, 6);
  } else {
    restraint = Math.min(100, restraint + 2);
    districtIntegrity = Math.max(0, districtIntegrity - 1);
  }
  setRestraint(Math.round(restraint));
  setDistrict(Math.round(districtIntegrity));

  if(target && target.userData.hp){
    target.userData.hp -= power*10;
    if(target.userData.hp <= 0){
      // collapse
      collapseBuilding(target);
    }
  }
}

function catchOrRedirect(){
  // quick capture: raycast to debris/civ
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if(intersects.length===0) return;
  const thing = intersects[0].object;
  // if it's a civilian, pick up
}

function togglePrecision(){
  precisionMode = !precisionMode;
  showMessage(precisionMode ? 'Precision Mode ON' : 'Precision Mode OFF', 1.2);
}

function toggleCarry(){
  // pick up nearest civilian if in range
  if(player.carrying){
    // drop
    player.carrying.mesh.position.copy(player.pos.clone().add(new THREE.Vector3(0,-1, -3)));
    player.carrying.beingCarried = false;
    player.carrying = null;
    return;
  }
  let nearest = null; let nd = 1e9;
  civilians.forEach(c=>{
    if(c.saved) return;
    const d = c.mesh.position.distanceTo(player.pos);
    if(d < 4 && d < nd){ nd = d; nearest = c; }
  });
  if(nearest){
    player.carrying = nearest;
    nearest.beingCarried = true;
  }
}

function updateCivilians(dt){
  civilians.forEach(c=>{
    if(c.saved) return;
    if(c.beingCarried){
      c.mesh.position.copy(player.pos.clone().add(new THREE.Vector3(0,-1,-3)));
      // auto-save when near safe zone (z>40)
      if(c.mesh.position.z > 38){
        c.saved = true;
        scene.remove(c.mesh);
        saved++;
        setSavedTotal(saved, totalCivs);
        showMessage('Civilian saved!', 1.0);
      }
      return;
    }
    // basic flee: move away from nearest explosion/drone/player if in panic
    if(c.panic){
      c.mesh.position.add(new THREE.Vector3(Math.random()-0.5,0,Math.random()).multiplyScalar(dt*5));
    }
  });
}

function updateDrone(dt){
  if(!drone) return;
  // simple patrol and occasionally shoot (create local damage)
  drone.userData.time = (drone.userData.time || 0) + dt;
  drone.position.x = 20*Math.cos(drone.userData.time*0.6);
  if(Math.random() < 0.01){
    // generate a local explosion near crowd
    districtIntegrity = Math.max(0, districtIntegrity - 2);
    setDistrict(Math.round(districtIntegrity));
    showMessage('Drone attack! Protect civilians!', 1.2);
  }
}

function updateUISystem(dt){
  // restraint slowly recovers when precision mode active
  if(precisionMode){
    restraint = Math.min(100, restraint + 12*dt);
    setRestraint(Math.round(restraint));
  } else {
    restraint = Math.max(0, restraint - 2*dt);
    setRestraint(Math.round(restraint));
  }

  // failure condition
  if(districtIntegrity < 12){
    showMessage('Mission Failed: District collapsed', 5);
    // stop loop by not updating further
  }

  // success condition
  if(saved >= Math.ceil(totalCivs*0.8) && districtIntegrity > 30){
    showMessage('Mission Success — District Protected', 5);
  }
}

function spawnDebris(point, count=4){
  for(let i=0;i<count;i++){
    const g = new THREE.BoxGeometry(0.5,0.5,0.5);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color:0x777777}));
    m.position.copy(point).add(new THREE.Vector3((Math.random()-0.5)*6, (Math.random()*4)+1, (Math.random()-0.5)*6));
    m.userData.v = new THREE.Vector3((Math.random()-0.5)*4, Math.random()*6, (Math.random()-0.5)*4);
    scene.add(m);
    // animate debris simple
    const lifetime = 3 + Math.random()*3;
    let t=0;
    (function step(){
      t+=0.016;
      m.position.addScaledVector(m.userData.v, 0.016);
      m.userData.v.y -= 9.8*0.016;
      if(t < lifetime) requestAnimationFrame(step);
      else scene.remove(m);
    })();
  }
}

function collapseBuilding(building){
  // spawn larger debris and reduce integrity heavily
  spawnDebris(building.position, 30);
  districtIntegrity = Math.max(0, districtIntegrity - 25);
  setDistrict(Math.round(districtIntegrity));
  showMessage('Building collapsed! Evacuate!', 2.5);
  scene.remove(building);
}
