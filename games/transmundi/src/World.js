import * as THREE from 'three';
import { getTrackPoint, getTrackDerivative, Perlin } from './Utils.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        
        // Materiali Ambiente
        this.matSnow = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
        this.matRail = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
        this.matWood = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
        
        // Gestione Chunk
        this.chunks = [];
        this.chunkSize = 200;
        this.renderDist = 3; 
    }

    update(trainZ) {
        const currentChunk = Math.floor(trainZ / this.chunkSize);

        // Genera nuovi chunk
        for(let i = currentChunk - 1; i <= currentChunk + this.renderDist; i++) {
            if(!this.chunks.includes(i)) {
                this.generateChunk(i);
                this.chunks.push(i);
            }
        }

        // Rimuovi vecchi (Opzionale per memoria, qui semplificato)
        // In un gioco vero rimuoveresti i chunk < currentChunk - 2
    }

    generateChunk(index) {
        const group = new THREE.Group();
        const startZ = index * this.chunkSize;
        const endZ = startZ + this.chunkSize;

        // 1. TERRENO (Plane deformato)
        const w = 300; 
        const seg = 40;
        const geo = new THREE.PlaneGeometry(w, this.chunkSize, seg, 20);
        geo.rotateX(-Math.PI/2);
        
        const pos = geo.attributes.position;
        for(let i=0; i < pos.count; i++){
            const x = pos.getX(i);
            let y = pos.getY(i); // Z in Threejs prima della rotazione
            // Mappiamo la y locale alla Z mondo corretta
            const worldZ = startZ + (this.chunkSize/2) - y; 
            
            // Calcoliamo dove sono i binari a questa Z
            const trackP = getTrackPoint(worldZ);
            const distTrack = Math.abs(x - trackP.x);

            // Rumore Base
            let h = Perlin.smooth(x, worldZ);

            // Scavare passo ferroviario
            if(distTrack < 8) {
                h = trackP.y - 1.5; // Piatto sotto i binari
            } else if (distTrack < 25) {
                // Rampa dolce
                const t = (distTrack - 8) / 17;
                h = THREE.MathUtils.lerp(trackP.y - 1.5, h + 10, t);
            } else {
                h += 15; // Montagne ai lati
            }

            // Coordinate finali vertex
            // Nota: PlaneGeometry è centrata, dobbiamo spostarla al posto giusto
            pos.setY(i, h);
        }
        geo.computeVertexNormals();
        geo.translate(0, 0, startZ + this.chunkSize/2);
        
        const terrain = new THREE.Mesh(geo, this.matSnow);
        terrain.receiveShadow = true;
        group.add(terrain);

        // 2. BINARI REALI
        // Traversine
        const sleeperGeo = new THREE.BoxGeometry(5, 0.4, 0.8);
        const sleeperMesh = new THREE.InstancedMesh(sleeperGeo, this.matWood, 200);
        let sIdx = 0;
        const dummy = new THREE.Object3D();

        // Rotaie (Creiamo shape estrusa lungo il path)
        const pathPoints = [];
        const steps = 40;
        
        for(let z = startZ; z <= endZ; z += (this.chunkSize/steps)) {
            pathPoints.push(getTrackPoint(z));
        }
        const curve = new THREE.CatmullRomCurve3(pathPoints);
        
        // Genera Traversine lungo la curva
        for(let z = startZ; z < endZ; z += 1.5) { // Ogni 1.5 metri
            const p = getTrackPoint(z);
            const d = getTrackDerivative(z);
            
            dummy.position.copy(p);
            // Allinea alla direzione binari
            dummy.lookAt(p.clone().add(d));
            dummy.position.y -= 0.2; // Appena sotto
            dummy.updateMatrix();
            sleeperMesh.setMatrixAt(sIdx++, dummy.matrix);
        }
        sleeperMesh.count = sIdx;
        group.add(sleeperMesh);

        // Genera Rotaie (Tubi)
        // Trucco: spostiamo i punti a dx e sx per fare due binari
        // Per semplicità usiamo TubeGeometry sulla curva centrale e trasliamo le mesh
        const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.15, 6, false);
        const railL = new THREE.Mesh(tubeGeo, this.matRail);
        const railR = new THREE.Mesh(tubeGeo, this.matRail);
        
        // Spostamento approssimativo (non perfetto in curve strette ma ok per cartoon)
        railL.position.x = -1.5; railL.position.y = 0.4;
        railR.position.x = 1.5;  railR.position.y = 0.4;
        
        // Per farle seguire la curva perfettamente servirebbe generare due curve separate offsettate
        // Ma per ora, mettiamole figlie di un oggetto che segue il path? No.
        // Generiamo geometria unica corretta è complesso.
        // Metodo semplice funzionante:
        // Usiamo il curve points per generare mesh custom veloce o lasciamo il tubo singolo centrale come "guida" e usiamo shader?
        // Facciamo così: lasciamo le traversine che danno l'idea e usiamo un tubo per rotaia calcolato al volo.
        // (Per brevità codice: renderizziamo un singolo "track bed" scuro + traversine, e due linee semplici)
        // Ricalcoliamo punti precisi per rotaia dx e sx:
        const ptsL = []; const ptsR = [];
        for(let i=0; i<=steps; i++) {
            const t = i/steps;
            const p = curve.getPoint(t);
            const tan = curve.getTangent(t);
            const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(1.4); // 1.4 scartamento metà
            ptsL.push(p.clone().add(right).add(new THREE.Vector3(0,0.4,0)));
            ptsR.push(p.clone().sub(right).add(new THREE.Vector3(0,0.4,0)));
        }
        const cL = new THREE.CatmullRomCurve3(ptsL);
        const cR = new THREE.CatmullRomCurve3(ptsR);
        group.add(new THREE.Mesh(new THREE.TubeGeometry(cL, 40, 0.1, 5, false), this.matRail));
        group.add(new THREE.Mesh(new THREE.TubeGeometry(cR, 40, 0.1, 5, false), this.matRail));

        this.scene.add(group);
    }
}