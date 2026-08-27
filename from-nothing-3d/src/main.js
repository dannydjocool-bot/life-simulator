import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86a7c4);
scene.fog = new THREE.Fog(0x86a7c4, 55, 150);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 300);

const hemi = new THREE.HemisphereLight(0xd9efff, 0x323128, 2.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 3.4);
sun.position.set(-35, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
scene.add(sun);

const groundMat = new THREE.MeshStandardMaterial({ color: 0x53684d, roughness: 1 });
const roadMat = new THREE.MeshStandardMaterial({ color: 0x252a31, roughness: .93 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xa7a39a, roughness: .95 });
const curbMat = new THREE.MeshStandardMaterial({ color: 0xbdb8ad, roughness: .9 });

const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function box(w,h,d,color,x,y,z, cast=true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({ color, roughness:.78 }));
  m.position.set(x,y,z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m;
}
function plane(w,d,mat,x,z,y=.015) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat); m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.receiveShadow=true; scene.add(m); return m;
}
function label(text, color='#ffffff', bg='rgba(4,7,11,.82)') {
  const c=document.createElement('canvas'); c.width=512; c.height=128;
  const ctx=c.getContext('2d'); ctx.fillStyle=bg; ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle=color; ctx.font='800 44px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,256,64);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true})); s.scale.set(8,2,1); scene.add(s); return s;
}

plane(18,180,roadMat,0,0,.02);
plane(180,18,roadMat,0,0,.021);
for(let i=-80;i<=80;i+=10){ plane(.35,5,new THREE.MeshBasicMaterial({color:0xd8c45d}),0,i,.03); plane(5,.35,new THREE.MeshBasicMaterial({color:0xd8c45d}),i,0,.031); }
plane(4.5,180,sidewalkMat,-11.5,0,.025); plane(4.5,180,sidewalkMat,11.5,0,.025);
plane(180,4.5,sidewalkMat,0,-11.5,.026); plane(180,4.5,sidewalkMat,0,11.5,.026);

const colliders=[];
function building({x,z,w,d,h,color,name,signColor='#fff'}) {
  const body=box(w,h,d,color,x,h/2,z);
  colliders.push({x,z,hx:w/2+.65,hz:d/2+.65});
  const roof=box(w+.35,.35,d+.35,0x262c35,x,h+.17,z,false);
  const sign=label(name,signColor);
  sign.position.set(x,h*.68,z+d/2+.12);
  return body;
}

building({x:-27,z:-28,w:20,d:17,h:14,color:0x6b4c42,name:'YOUR APARTMENT',signColor:'#d9f1ff'});
building({x:28,z:-28,w:22,d:17,h:10,color:0x78352f,name:'NIGHT OWL DINER',signColor:'#ffd7a8'});
building({x:29,z:29,w:20,d:18,h:9,color:0x35665a,name:'QUICK MART',signColor:'#d7ffe9'});
building({x:-31,z:29,w:27,d:18,h:12,color:0x4f5668,name:'CITY SERVICES',signColor:'#dfe7ff'});
building({x:-54,z:-31,w:19,d:26,h:18,color:0x675c50,name:'APARTMENTS'});
building({x:55,z:-29,w:25,d:22,h:16,color:0x4b5562,name:'OFFICES'});
building({x:55,z:30,w:24,d:19,h:13,color:0x625b46,name:'WAREHOUSE'});

function tree(x,z,s=1){
  const trunk=box(.65,3.1,.65,0x5c3b25,x,1.55,z);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(2.2*s,10,8),new THREE.MeshStandardMaterial({color:0x315f3a,roughness:1}));
  crown.position.set(x,4.2,z); crown.castShadow=true; scene.add(crown);
}
[[-19,22],[-20,39],[-44,18],[-46,42],[18,20],[43,18],[46,44],[-18,-45],[18,-46],[45,-48]].forEach(([x,z])=>tree(x,z,.9));

const park=plane(26,21,new THREE.MeshStandardMaterial({color:0x3e7546,roughness:1}),-25,55,.028);
box(8,.45,1.4,0x6a4a32,-25,.5,54);
box(.35,1.6,.35,0x3d332a,-28,.8,54);
box(.35,1.6,.35,0x3d332a,-22,.8,54);

function car(x,z,color,rot=0){
  const g=new THREE.Group();
  const b=new THREE.Mesh(new THREE.BoxGeometry(4.2,1.1,2),new THREE.MeshStandardMaterial({color,metalness:.25,roughness:.45}));
  b.position.y=.9;b.castShadow=true;g.add(b);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(2.2,.85,1.8),new THREE.MeshStandardMaterial({color:0x263646,metalness:.5,roughness:.25}));
  cab.position.set(-.25,1.65,0);cab.castShadow=true;g.add(cab);
  for(const sx of [-1.35,1.35]) for(const sz of [-1.02,1.02]) { const w=new THREE.Mesh(new THREE.CylinderGeometry(.44,.44,.34,12),new THREE.MeshStandardMaterial({color:0x12151a,roughness:1})); w.rotation.x=Math.PI/2; w.position.set(sx,.55,sz); g.add(w); }
  g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
}
car(-3,-31,0x314f73,Math.PI/2); car(3,31,0x772e2e,Math.PI/2); car(32,-3,0xb5a355,0); car(-34,3,0x3a5d46,0);

function makePerson(shirt=0x394d6b,skin=0xc78f6a){
  const g=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.45,.62),new THREE.MeshStandardMaterial({color:shirt,roughness:.8})); torso.position.y=2.1; torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),new THREE.MeshStandardMaterial({color:skin,roughness:.75}));head.position.y=3.2;head.castShadow=true;g.add(head);
  for(const sx of [-.32,.32]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.33,1.35,.38),new THREE.MeshStandardMaterial({color:0x1e2530,roughness:.9}));leg.position.set(sx,.72,0);leg.castShadow=true;g.add(leg)}
  return g;
}
const player=makePerson(0x202733,0xa96f4e); scene.add(player); player.position.set(-16,0,-5);
const npc=makePerson(0x6d3e68,0x9b694f); npc.position.set(-25,0,55); npc.rotation.y=Math.PI; scene.add(npc);
const dinerNpc=makePerson(0x7a2727,0xd09a76); dinerNpc.position.set(28,0,-17); dinerNpc.rotation.y=Math.PI; scene.add(dinerNpc);
const storeNpc=makePerson(0x365c49,0xb87957); storeNpc.position.set(29,0,18); scene.add(storeNpc);

const interactions=[
  {id:'home',name:'Apartment',pos:new THREE.Vector3(-27,0,-18.3),radius:4.4},
  {id:'diner',name:'Diner Manager',pos:new THREE.Vector3(28,0,-17.4),radius:4.4},
  {id:'store',name:'Quick Mart',pos:new THREE.Vector3(29,0,18.6),radius:4.4},
  {id:'npc',name:'Talk to Marcus',pos:new THREE.Vector3(-25,0,55),radius:4.2}
];
for(const i of interactions){ const ring=new THREE.Mesh(new THREE.RingGeometry(1.3,1.55,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.38,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2;ring.position.copy(i.pos);ring.position.y=.06;scene.add(ring); i.ring=ring; }

const state={
  cash:120, energy:100, hunger:12, rep:0, day:1, minutes:480,
  employed:false, interviewDone:false, talkedMarcus:false,
  objective:'Find the diner and ask for work.'
};
const els={cash:document.querySelector('#cash'),energy:document.querySelector('#energy'),hunger:document.querySelector('#hunger'),rep:document.querySelector('#rep'),day:document.querySelector('#day'),clock:document.querySelector('#clock'),objective:document.querySelector('#objectiveText'),prompt:document.querySelector('#prompt'),toast:document.querySelector('#toast')};
function clampStats(){state.energy=Math.max(0,Math.min(100,state.energy));state.hunger=Math.max(0,Math.min(100,state.hunger));}
function updateHud(){
  clampStats(); els.cash.textContent='$'+Math.floor(state.cash); els.energy.textContent=Math.floor(state.energy); els.hunger.textContent=Math.floor(state.hunger); els.rep.textContent=Math.floor(state.rep); els.day.textContent=state.day;
  const hh=String(Math.floor(state.minutes/60)%24).padStart(2,'0'), mm=String(Math.floor(state.minutes%60)).padStart(2,'0'); els.clock.textContent=hh+':'+mm; els.objective.textContent=state.objective;
}
function advanceTime(min){ state.minutes+=min; while(state.minutes>=1440){state.minutes-=1440;state.day++;state.energy=Math.min(100,state.energy+20);state.hunger=Math.min(100,state.hunger+10)} updateHud(); }
let toastTimer; function toast(msg){clearTimeout(toastTimer);els.toast.textContent=msg;els.toast.classList.remove('hidden');toastTimer=setTimeout(()=>els.toast.classList.add('hidden'),2400)}

const modal=document.querySelector('#modal'), title=document.querySelector('#modalTitle'), textEl=document.querySelector('#modalText'), actions=document.querySelector('#modalActions'), kicker=document.querySelector('#modalKicker');
function openModal({title:t,text,buttons,k='INTERACTION'}){paused=true;kicker.textContent=k;title.textContent=t;textEl.textContent=text;actions.innerHTML='';for(const b of buttons){const btn=document.createElement('button');btn.textContent=b.label;if(b.secondary)btn.className='secondary';btn.onclick=()=>{if(b.action)b.action();if(b.close!==false)closeModal()};actions.append(btn)}modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden');paused=false}
document.querySelector('#closeModal').onclick=closeModal;

function interact(id){
  if(id==='diner'){
    if(!state.interviewDone){
      openModal({title:'Night Owl Diner',text:'The manager looks you over. “You show up on time, work hard, and don’t start trouble?”',buttons:[
        {label:'Ask for a job',action:()=>{state.interviewDone=true;state.employed=true;state.rep+=2;state.objective='Work your first shift at the diner.';advanceTime(30);toast('Hired! $18/hour · Shift unlocked')}},
        {label:'Maybe later',secondary:true}
      ],k:'JOB INTERVIEW'});
    }else if(state.employed){
      openModal({title:'Clock In',text:'Work a 4-hour diner shift. This costs energy and increases hunger.',buttons:[
        {label:'Work 4 hours · Earn $72',action:()=>{if(state.energy<20){toast('Too exhausted to work. Rest at home.');return}state.cash+=72;state.energy-=28;state.hunger+=24;state.rep+=1;advanceTime(240);state.objective='Keep building your life: earn money, eat, rest, and meet people.';toast('Shift complete · +$72')}},
        {label:'Not right now',secondary:true}
      ],k:'WORK'});
    }
  }
  if(id==='home'){
    openModal({title:'Your Apartment',text:'Tiny, cheap, and yours. Resting restores energy but time passes.',buttons:[
      {label:'Sleep 8 hours',action:()=>{state.energy=100;state.hunger+=18;advanceTime(480);toast('Rested up')}},
      {label:'Save game',action:saveGame},
      {label:'Leave',secondary:true}
    ],k:'HOME'});
  }
  if(id==='store'){
    openModal({title:'Quick Mart',text:'Grab something cheap to keep going.',buttons:[
      {label:'Meal · $14',action:()=>{if(state.cash<14){toast('Not enough cash');return}state.cash-=14;state.hunger-=38;advanceTime(15);toast('You ate a meal')}},
      {label:'Energy drink · $6',action:()=>{if(state.cash<6){toast('Not enough cash');return}state.cash-=6;state.energy+=18;state.hunger-=6;advanceTime(5);toast('Energy +18')}},
      {label:'Leave',secondary:true}
    ],k:'STORE'});
  }
  if(id==='npc'){
    if(!state.talkedMarcus){
      openModal({title:'Marcus',text:'“New around here? Everybody starts somewhere. Keep your word, work hard, and people remember.”',buttons:[
        {label:'Introduce yourself',action:()=>{state.talkedMarcus=true;state.rep+=3;advanceTime(10);toast('Reputation +3')}},
        {label:'Walk away',secondary:true}
      ],k:'CONVERSATION'});
    } else openModal({title:'Marcus',text:'“Still standing. That counts for something.”',buttons:[{label:'Later'}],k:'CONVERSATION'});
  }
  updateHud();
}
function saveGame(){localStorage.setItem('from-nothing-save',JSON.stringify({...state,pos:{x:player.position.x,z:player.position.z}}));toast('Game saved')}
function loadGame(){const raw=localStorage.getItem('from-nothing-save');if(!raw){toast('No save found');return}const s=JSON.parse(raw);Object.assign(state,s);if(s.pos)player.position.set(s.pos.x,0,s.pos.z);updateHud();toast('Save loaded')}
function newGame(){localStorage.removeItem('from-nothing-save');location.reload()}

const pauseEl=document.querySelector('#pause'); let paused=false;
document.querySelector('#resumeBtn').onclick=()=>{pauseEl.classList.add('hidden');paused=false};
document.querySelector('#saveBtn').onclick=saveGame;
document.querySelector('#loadBtn').onclick=loadGame;
document.querySelector('#resetBtn').onclick=newGame;
function togglePause(){if(!modal.classList.contains('hidden'))return;paused=!paused;pauseEl.classList.toggle('hidden',!paused)}

const keys={}; let nearest=null;
addEventListener('keydown',e=>{if(e.code==='Escape'){togglePause();return}keys[e.code]=true;if(e.code==='KeyE'&&!paused&&nearest)interact(nearest.id)});
addEventListener('keyup',e=>keys[e.code]=false);

function collides(x,z){
  if(Math.abs(x)>84||Math.abs(z)>84)return true;
  return colliders.some(c=>Math.abs(x-c.x)<c.hx&&Math.abs(z-c.z)<c.hz);
}
const clock=new THREE.Clock(); let elapsed=0;
const velocity=new THREE.Vector3(), move=new THREE.Vector3();
function updatePlayer(dt){
  if(paused)return;
  move.set(0,0,0);
  if(keys.KeyW)move.z-=1;if(keys.KeyS)move.z+=1;if(keys.KeyA)move.x-=1;if(keys.KeyD)move.x+=1;
  if(move.lengthSq()>0){
    move.normalize(); const sprint=keys.ShiftLeft||keys.ShiftRight; const speed=sprint?10.5:6.2;
    velocity.x=THREE.MathUtils.damp(velocity.x,move.x*speed,10,dt);velocity.z=THREE.MathUtils.damp(velocity.z,move.z*speed,10,dt);
    const nx=player.position.x+velocity.x*dt,nz=player.position.z+velocity.z*dt;
    if(!collides(nx,player.position.z))player.position.x=nx;if(!collides(player.position.x,nz))player.position.z=nz;
    player.rotation.y=Math.atan2(velocity.x,velocity.z);
    player.position.y=Math.sin(elapsed*(sprint?13:9))*.045;
    if(sprint){state.energy-=dt*.45;state.hunger+=dt*.11}
  }else{velocity.x=THREE.MathUtils.damp(velocity.x,0,12,dt);velocity.z=THREE.MathUtils.damp(velocity.z,0,12,dt);player.position.y=THREE.MathUtils.damp(player.position.y,0,8,dt)}
}
function updateCamera(dt){
  const forward=new THREE.Vector3(0,0,1).applyQuaternion(player.quaternion);
  const desired=player.position.clone().add(new THREE.Vector3(0,7.3,0)).add(forward.multiplyScalar(-9.8));
  camera.position.lerp(desired,1-Math.pow(.002,dt));
  const target=player.position.clone().add(new THREE.Vector3(0,2.1,0));camera.lookAt(target);
}
function updateInteractions(){
  nearest=null;let best=999;
  for(const i of interactions){const d=player.position.distanceTo(i.pos);i.ring.material.opacity=.18+Math.sin(elapsed*3)*.08;if(d<i.radius&&d<best){best=d;nearest=i}}
  els.prompt.classList.toggle('hidden',!nearest||paused);
  if(nearest)els.prompt.innerHTML='Press <kbd>E</kbd> · '+nearest.name;
}
function updateWorld(dt){
  if(paused)return;
  state.minutes+=dt*.38;
  if(state.minutes>=1440){state.minutes-=1440;state.day++}
  const hour=state.minutes/60;
  const daylight=Math.max(.08,Math.sin(((hour-5.5)/24)*Math.PI*2)*.5+.5);
  sun.intensity=.45+daylight*3.2;hemi.intensity=.45+daylight*1.9;
  const skyDay=new THREE.Color(0x86a7c4),skyNight=new THREE.Color(0x070b18);scene.background.copy(skyNight).lerp(skyDay,daylight);scene.fog.color.copy(scene.background);
  sun.position.x=Math.cos((hour/24)*Math.PI*2)*55;sun.position.y=12+daylight*55;
}

function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
  updatePlayer(dt);updateCamera(dt);updateInteractions();updateWorld(dt);updateHud();renderer.render(scene,camera);
}
updateHud();camera.position.set(-16,7,-14);animate();

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
