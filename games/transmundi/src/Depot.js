import * as THREE from 'three';
export const fleet = [
 ['base','trainBase','Iron Pioneer','Classe I · Pioniere','#bd9259','Acciaio, carbone e spirito d’avventura. La locomotiva da cui cominciano tutte le leggende.'],
 ['gold','trainGoldenTycoon','Golden Tycoon','Classe II · Imperiale','#e5bc58','Oro cesellato e velluto cremisi. Un palazzo viaggiante per chi pretende un ingresso trionfale.'],
 ['bandits','trainTheBandits','The Bandits','Classe III · Fuorilegge','#ba6550','Una leggenda delle terre di frontiera. Nessun orario, nessun padrone: soltanto la prossima rotaia.'],
 ['ant','trainAntSingularityOne','Singularity One','Classe IV · Quantica','#53c9c7','Un cuore di energia impossibile, racchiuso in un’armatura forgiata oltre i confini della scienza.'],
 ['celestial','trainCelestialAetherDreadnought','Aether Dreadnought','Classe V · Celestiale','#a6cbd4','Anelli di etere e bagliori celesti. Una corazzata nata per attraversare l’orizzonte dei sogni.'],
 ['chronos','trainChronosLeviathanTheTimeEather','Chronos Leviathan','Classe VI · Cronomantica','#9f8acb','Ingranaggi che scandiscono un tempo diverso. Il Leviatano non aspetta il futuro: lo raggiunge.'],
 ['hades','trainHadesDoomtrainTheSoulGrinder','Hades Doomtrain','Classe VII · Infernale','#e26b42','Ferro oscuro e fuochi degli abissi. Ogni partenza è un patto con il signore delle profondità.'],
 ['omega','trainOmegaZeroTheEventHorizon','Omega Zero','Classe VIII · Singolarità','#92a6dc','Oltre l’orizzonte degli eventi, perfino la luce viaggia su binari sconosciuti.'],
 ['valhalla','trainValhallaExpressTheImmortansFury','Valhalla Express','Classe IX · Immortale','#d2a16d','La furia degli immortali alimenta la caldaia. Un ultimo viaggio verso la gloria.']
].map(([id,file,name,category,color,description])=>({id,file,name,category,color,description}));
const modules = new Map();
export async function loadTrain(id) {
 const entry = fleet.find(t=>t.id===id) || fleet[0];
 if(!modules.has(entry.id)) modules.set(entry.id, import(`./components/${entry.file}.js`).catch(error=>{modules.delete(entry.id);throw error;}));
 return (await modules.get(entry.id)).Assets;
}
export function setupDepot() {
 const canvas=document.getElementById('train-preview');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);
 const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(35,1,.1,1000);
 scene.add(new THREE.HemisphereLight(0xb8e4dc,0x342519,3));
 const key=new THREE.DirectionalLight(0xffd49a,4);key.position.set(8,15,12);scene.add(key);
 const rim=new THREE.DirectionalLight(0x5bcabb,3);rim.position.set(-10,6,-10);scene.add(rim);
 let model, selection=0;
 const previews=new Map();
 const roster=document.getElementById('train-roster');
 fleet.forEach((entry,i)=>{const button=document.createElement('button');button.className='train-card';button.style.setProperty('--train-color',entry.color);button.innerHTML=`<span class="card-number">${String(i+1).padStart(2,'0')}</span><span class="train-icon" aria-hidden="true">♜</span><span>${entry.name}</span>`;button.onclick=()=>select(entry,i);roster.append(button);});
 async function select(entry,i) {
  const token=++selection;window.selectedTrainId=entry.id;
  [...roster.children].forEach((b,n)=>{b.classList.toggle('selected',i===n);b.setAttribute('aria-pressed',String(i===n));});
  document.getElementById('train-name').textContent=entry.name;
  document.getElementById('train-class').textContent=entry.category;
  document.getElementById('train-description').textContent=entry.description;
  document.getElementById('fleet-number').textContent=`${String(i+1).padStart(2,'0')} / 09`;
  const depart=document.getElementById('depart-button');depart.disabled=true;depart.textContent='PREPARAZIONE LOCOMOTIVA…';
  document.getElementById('dispatch-error').textContent='';
  try {
   const assets=await loadTrain(entry.id); if(token!==selection)return;
   const next=previews.get(entry.id) || assets.createLocomotive();
   previews.set(entry.id,next);
   if(model) scene.remove(model);
   model=next;model.rotation.y=-.55;
   const box=new THREE.Box3().setFromObject(model);const center=box.getCenter(new THREE.Vector3());model.position.sub(center);
   const size=box.getSize(new THREE.Vector3()).length();camera.position.set(size*.75,size*.42,size*.85);camera.lookAt(0,0,0);camera.near=.1;camera.far=Math.max(1000,size*10);camera.updateProjectionMatrix();scene.add(model);
   depart.disabled=false;depart.textContent='PARTENZA  →';
   window.dispatchEvent(new Event('playground:ready'));
  }catch(error){if(token!==selection)return;document.getElementById('dispatch-error').textContent='Locomotiva non disponibile. Seleziona un altro convoglio.';console.error(error);window.dispatchEvent(new Event('playground:error'));}
 }
 const observer=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});observer.observe(canvas);
 let last=performance.now();function animate(now){requestAnimationFrame(animate);const delta=Math.min((now-last)/1000,.05);last=now;if(document.getElementById('main-menu').style.display==='none')return;if(model&&!matchMedia('(prefers-reduced-motion: reduce)').matches)model.rotation.y+=delta*.13;renderer.render(scene,camera);}requestAnimationFrame(animate);
 let wagons=3;document.querySelectorAll('[data-wagons]').forEach(button=>button.onclick=()=>{wagons=Number(button.dataset.wagons);document.querySelectorAll('[data-wagons]').forEach(b=>b.classList.toggle('selected',b===button));});
 document.getElementById('depart-button').onclick=()=>window.startGame(wagons);
 window.switchTab('seed');
 select(fleet[0],0);
}
