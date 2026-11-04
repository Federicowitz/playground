import * as THREE from 'three';
import { getTerrainHeight, SeededRandom } from '../core/Utils.js';

export class MapGenerator {
    constructor(scene) {
        this.scene = scene;
        this.trackCurve = null;
        this.rng = new SeededRandom("default"); // Default
    }

    // Accetta un seed (stringa o numero)
    generate(seed = Date.now().toString()) {
        console.log("Generazione Procedurale con Seed:", seed);
        this.rng = new SeededRandom(seed);
    // ---------------------------------------------------------
    // 1. GENERAZIONE DELLA CURVA (SPLINE)
    // ---------------------------------------------------------
        const points = [];
        const radius = 200;
        
        // Creiamo un percorso circolare ma sinuoso
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            
            // Sostituito Math.random con this.rng.range
            const rVar = radius + (this.rng.range(-50, 50));
            
            const x = Math.cos(angle) * rVar;
            const z = Math.sin(angle) * rVar;
            const y = Math.sin(angle * 4) * 10 + 15; 
            
            points.push(new THREE.Vector3(x, y, z));
        }

        // Creiamo l'oggetto CatmullRomCurve3
        this.trackCurve = new THREE.CatmullRomCurve3(points);
        this.trackCurve.closed = true; 
        // Tension basso rende la curva più morbida evitando spigoli
        this.trackCurve.tension = 0.5; 

        // ---------------------------------------------------------
        // 2. COSTRUZIONE DEGLI ELEMENTI 3D
        // ---------------------------------------------------------
        this.createDoubleTracks();
        this.createSleepers();
        this.createTerrain();
        this.createWater();
    }

    createDoubleTracks() {
        if (!this.trackCurve) return;

        const railOffset = 1.5; 
        const divisions = 800; // Aumentato per curve più lisce
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4 });

        const createRail = (offsetDir) => {
            const offsetPoints = [];
            for(let i = 0; i <= divisions; i++) {
                // curve.closed è true, quindi t=0 e t=1 coincidono
                const t = (i / divisions); 
                // Usiamo getPointAt per una distribuzione uniforme lungo la lunghezza
                const pt = this.trackCurve.getPointAt(t % 1); 
                const tan = this.trackCurve.getTangentAt(t % 1);
                
                const up = new THREE.Vector3(0, 1, 0);
                const right = new THREE.Vector3().crossVectors(tan, up).normalize();
                
                const offsetPt = pt.clone().add(right.multiplyScalar(offsetDir * railOffset));
                offsetPoints.push(offsetPt);
            }
            
            const curve = new THREE.CatmullRomCurve3(offsetPoints);
            curve.closed = true; 

            const geo = new THREE.TubeGeometry(curve, divisions, 0.15, 6, true);
            const mesh = new THREE.Mesh(geo, mat);
            // Alziamo leggermente la rotaia sopra le traversine
            mesh.position.y = 0.35; 
            this.scene.add(mesh);
        };

        createRail(1);
        createRail(-1);
    }

    createSleepers() {
        if (!this.trackCurve) return;

        const count = 600; 
        const geo = new THREE.BoxGeometry(5, 0.3, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x3e2723 }); 
        
        const instancedMesh = new THREE.InstancedMesh(geo, mat, count);
        const dummy = new THREE.Object3D();

        for(let i = 0; i < count; i++) {
            const t = i / count;
            const pos = this.trackCurve.getPointAt(t);
            const tan = this.trackCurve.getTangentAt(t);
            
            dummy.position.copy(pos);
            dummy.lookAt(pos.clone().add(tan));
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        this.scene.add(instancedMesh);
    }

    createTerrain() {
        // Aumentiamo i segmenti per un terreno meno "blocky" vicino ai binari
        const segs = 150;
        const size = 600;
        const geometry = new THREE.PlaneGeometry(size, size, segs, segs);
        geometry.rotateX(-Math.PI / 2);

        const posAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            
            // 1. Altezza naturale del terreno (Noise)
            let naturalY = getTerrainHeight(vertex.x, vertex.z);
            
            // 2. Troviamo il punto sul binario corrispondente a questo vertice
            // Usiamo l'angolo polare per trovare il punto 't' approssimativo sulla curva
            // Nota: atan2 inverte gli assi rispetto a ThreeJS standard talvolta, 
            // ma per un loop semplice: z = sin, x = cos
            const angle = Math.atan2(vertex.z, vertex.x); 
            // Normalizziamo l'angolo da [-PI, PI] a [0, 1]
            let t = (angle >= 0 ? angle : (2 * Math.PI + angle)) / (2 * Math.PI);
            
            // Otteniamo la posizione esatta del binario a quell'angolo
            const trackPos = this.trackCurve.getPointAt(t);
            
            // Calcoliamo la distanza orizzontale reale tra il vertice e il binario
            const dist = Math.sqrt(Math.pow(vertex.x - trackPos.x, 2) + Math.pow(vertex.z - trackPos.z, 2));

            let finalY = naturalY;

            // 3. Logica di fusione Terreno-Binario (Trench & Embankment)
            const trackBedWidth = 5.0;   // Larghezza dove il terreno è piatto sotto il treno
            const blendWidth = 25.0;     // Larghezza della sfumatura (muri di neve o scarpata)

            if (dist < trackBedWidth) {
                // Sotto i binari: terreno perfettamente allineato (leggermente sotto per le traversine)
                finalY = trackPos.y - 1.2; 
            } else if (dist < trackBedWidth + blendWidth) {
                // Zona di transizione
                const factor = (dist - trackBedWidth) / blendWidth; // 0.0 vicinissimo, 1.0 lontano
                
                // Usiamo una curva "smoothstep" per rendere la transizione morbida (stile neve)
                const smoothFactor = factor * factor * (3 - 2 * factor);
                
                // Altezza bersaglio del binario (sempre -1.2 per la base)
                const targetH = trackPos.y - 1.2;

                // Interpoliamo tra l'altezza del binario e l'altezza naturale
                // Se naturalY è molto più alto -> crea trincea (muro di neve)
                // Se naturalY è molto più basso -> crea terrapieno
                finalY = targetH + (naturalY - targetH) * smoothFactor;
            }

            // Fondo del lago
            if (finalY < -5) finalY = -10;

            posAttribute.setY(i, finalY);
        }

        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true // Low poly look
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
    }

    createWater() {
        const waterGeo = new THREE.PlaneGeometry(600, 600);
        waterGeo.rotateX(-Math.PI / 2);
        const waterMat = new THREE.MeshStandardMaterial({ 
            color: 0x113355, 
            roughness: 0.0, 
            metalness: 0.8,
            transparent: true,
            opacity: 0.85
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = -4; 
        this.scene.add(water);
    }
}