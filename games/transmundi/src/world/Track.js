import * as THREE from 'three';
import { getTrackPoint, getTrackDerivative } from '../Utils.js';

export class TrackSystem {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.chunkSize = 100; // Metri per chunk binari
        
        // Materiali riutilizzabili
        this.matWood = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1 });
        this.matIron = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.7 });
        
        // Geometria Traversina (Legno)
        this.sleeperGeo = new THREE.BoxGeometry(0.6, 0.2, 4); // X è lungo binario, Z è larghezza
        
        // InstancedMesh per performance estrema
        this.maxSleepers = 5000;
        this.sleeperMesh = new THREE.InstancedMesh(this.sleeperGeo, this.matWood, this.maxSleepers);
        this.sleeperMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.sleeperMesh);
        
        this.sleeperCount = 0;
    }

    update(trainZ) {
        // Logica semplificata: rigeneriamo tutto attorno al treno per pulizia
        // In un gioco vero useremmo un buffer circolare, qui svuotiamo e riempiamo per semplicità
        // Ma per le traversine usiamo InstancedMesh.
        
        const startZ = Math.floor(trainZ / 10) * 10 - 200;
        const endZ = startZ + 600; // Disegna 600 metri avanti
        
        let index = 0;
        const dummy = new THREE.Object3D();

        // 1. Genera Traversine (Irregolari)
        // Distanza tra traversine ~ 1.2 metri
        for (let z = startZ; z < endZ; z += 1.2) {
            if (index >= this.maxSleepers) break;

            const pos = getTrackPoint(z);
            const dir = getTrackDerivative(z);
            
            // Calcola asse "Destra" (Cross product tra Dir e UP)
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(dir, up).normalize();
            
            // Posiziona e Ruota
            dummy.position.copy(pos);
            
            // Irregolarità:
            // Leggero offset casuale
            dummy.position.x += (Math.random() - 0.5) * 0.2; 
            
            // Orientamento: LookAt verso la direzione, ma ruotato di 90 gradi
            const target = pos.clone().add(dir);
            dummy.lookAt(target); 
            // Traversina è larga su Z locale, ma noi viaggiamo su Z mondo? 
            // Fix rotazione: La geometria è Box(0.6, 0.2, 4).
            // Se lookAt(dir), Z della box punta verso dir. No.
            // Vogliamo che Z della box punti verso Right.
            // Quindi ruotiamo dummy su Y.
            dummy.rotateY(Math.PI / 2);
            
            // Irregolarità rotazione (leggero tilt)
            dummy.rotateX((Math.random() - 0.5) * 0.1);
            dummy.rotateZ((Math.random() - 0.5) * 0.05);

            dummy.updateMatrix();
            this.sleeperMesh.setMatrixAt(index++, dummy.matrix);
        }
        
        this.sleeperMesh.count = index;
        this.sleeperMesh.instanceMatrix.needsUpdate = true;
        
        // 2. Genera Rotaie (Tubi continui per il rendering visivo)
        // Per semplicità in questa demo rigeneriamo la geometria rotaie ogni tot,
        // oppure usiamo un trucco: segmenti corti.
        // Qui: rimuovi vecchia mesh rotaie, crea nuova per il segmento visibile.
        // (Nota: costoso, ma ok per demo desktop).
        if (this.railsMesh) this.scene.remove(this.railsMesh);

        const curvePoints = [];
        for(let z = startZ; z < endZ; z+=5) {
            curvePoints.push(getTrackPoint(z));
        }
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        
        // Tubo Sinistro e Destro
        const railShape = new THREE.Shape();
        railShape.absarc(0,0, 0.15, 0, Math.PI*2);
        
        const extrudeSettings = { steps: 100, curveSegments: 4, extrudePath: curve };
        // Non possiamo fare due estrusioni parallele facilmente con ExtrudeGeometry standard su una singola curva centrale senza shader.
        // Metodo "bruto": TubeGeometry.
        
        // Facciamo una geometria custom "Nastro" che contiene le due rotaie
        // Per semplicità demo: Usiamo TubeGeometry sulla curva centrale e la scaliamo/spostiamo? No.
        // Creiamo punti offset.
        const ptsL = []; const ptsR = [];
        const railWidth = 1.4; // Metà scartamento
        
        for(let z = startZ; z < endZ; z+=2) {
            const p = getTrackPoint(z);
            const d = getTrackDerivative(z);
            const r = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0,1,0)).normalize().multiplyScalar(railWidth);
            ptsL.push(p.clone().add(r).add(new THREE.Vector3(0, 0.3, 0)));
            ptsR.push(p.clone().sub(r).add(new THREE.Vector3(0, 0.3, 0)));
        }
        
        const geoL = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsL), 100, 0.1, 4, false);
        const geoR = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsR), 100, 0.1, 4, false);
        
        // Merge
        const railsGeo = import('three/addons/utils/BufferGeometryUtils.js').then(({mergeGeometries}) => {
            // Async loading fix handling... Per semplicità, usiamo solo 2 mesh separate qui.
        });

        if(!this.railGroup) {
            this.railGroup = new THREE.Group();
            this.scene.add(this.railGroup);
        }
        this.railGroup.clear();
        
        const railMeshL = new THREE.Mesh(geoL, this.matIron);
        const railMeshR = new THREE.Mesh(geoR, this.matIron);
        this.railGroup.add(railMeshL, railMeshR);
    }
}