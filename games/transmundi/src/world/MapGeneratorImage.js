import * as THREE from 'three';
import { getTerrainHeight, loadImageData } from '../core/Utils.js';

export class MapGeneratorImage {
    constructor(scene) {
        this.scene = scene;
        this.trackCurve = null;
        this.mapData = null; 
        this.worldSize = 600; // Dimensione del mondo di gioco
   // Parametri di calibrazione altezze
    this.LEVEL_WATER = 1.0;
    this.LEVEL_FLOOR = 3.0; // Livello base del terreno bianco
    this.LEVEL_RAIL  = 5.0; // I binari sono leggermente sopraelevati
    
    this.hasWater = false; // Flag per capire se serve generare l'oceano
}

async generate(imageUrl) {
    try {
        this.mapData = await loadImageData(imageUrl);
        this.createPathFromImage(); // Genera curve
        this.buildWorld();          // Genera mesh
        return true;
    } catch (e) {
        console.error("Errore caricamento mappa immagine:", e);
        return false;
    }
}

createPathFromImage() {
    const w = this.mapData.width;
    const h = this.mapData.height;
    const points = [];
    const visited = new Set();
    const idx = (x, y) => (y * w + x) * 4;

    // 1. TROVA START (Nero)
    let cx = -1, cy = -1;
    searchStart:
    for(let y = 0; y < h; y += 5) {
        for(let x = 0; x < w; x += 5) {
            const i = idx(x, y);
            if(this.mapData.data[i] < 50 && this.mapData.data[i+1] < 50 && this.mapData.data[i+2] < 50) {
                cx = x; cy = y;
                break searchStart;
            }
        }
    }

    if (cx === -1) throw new Error("Nessun tracciato nero trovato!");

    // 2. CAMMINA SUL TRACCIATO
    const step = 15; 
    let looking = true;
    
    while(looking) {
        const wx = (cx / w - 0.5) * this.worldSize;
        const wz = (cy / h - 0.5) * this.worldSize;
        
        // Altezza binari fissa e sicura
        points.push(new THREE.Vector3(wx, this.LEVEL_RAIL, wz));

        for(let vy = cy - step; vy < cy + step; vy++) {
            for(let vx = cx - step; vx < cx + step; vx++) {
                visited.add(vy * w + vx);
            }
        }

        let foundNext = false;
        let bestX = -1, bestY = -1;
        const range = step + 5;

        for(let y = cy - range; y <= cy + range; y+=2) {
            for(let x = cx - range; x <= cx + range; x+=2) {
                if(x < 0 || y < 0 || x >= w || y >= h) continue;
                if(visited.has(y * w + x)) continue;

                const dist = Math.sqrt((x-cx)**2 + (y-cy)**2);
                if(dist < step || dist > range) continue;

                const i = idx(x, y);
                if(this.mapData.data[i] < 50) {
                    foundNext = true;
                    bestX = x; bestY = y;
                    break; 
                }
            }
            if(foundNext) break;
        }

        if(foundNext) {
            cx = bestX;
            cy = bestY;
        } else {
            looking = false;
        }
    }

    this.trackCurve = new THREE.CatmullRomCurve3(points);
    this.trackCurve.closed = true; 
    this.trackCurve.tension = 0.2; 
}

buildWorld() {
    // Resetta flag acqua
    this.hasWater = false;
    
    this.createTerrainFromColors();
    this.createDoubleTracks();
    this.createSleepers();
    
    // Crea l'acqua SOLO se abbiamo trovato pixel blu durante la generazione terreno
    if (this.hasWater) {
        this.createWaterPlane();
    }
}

createTerrainFromColors() {
    const segs = 150; 
    const geo = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const posAttr = geo.attributes.position;
    const vec = new THREE.Vector3();
    const treePositions = [];

    for(let i=0; i<posAttr.count; i++) {
        vec.fromBufferAttribute(posAttr, i);

        // Lettura pixel precisa
        const pixel = this.mapData.getPixel(vec.x, vec.z);
        
        const isBlack = pixel.r < 80 && pixel.g < 80 && pixel.b < 80;
        // Blu tollerante: deve avere più Blu che Rosso/Verde
        const isBlue  = pixel.b > pixel.r + 20 && pixel.b > pixel.g + 20;
        
        let h = this.LEVEL_FLOOR;

        if (isBlack) {
            // ROTAIA: Creiamo una massicciata solida sotto il binario
            h = this.LEVEL_RAIL - 1.0; 
        } 
        else if (isBlue) {
            // ACQUA: Scaviamo profondo
            h = -2.0; 
            this.hasWater = true; // Segna che serve l'acqua
        } 
        else {
            // TERRENO BIANCO (Default)
            // Usiamo il noise ma MOLTO più gentile
            let noise = getTerrainHeight(vec.x, vec.z);
            
            // Moltiplicatore basso (0.4) per fare colline dolci invece di montagne
            let variation = noise * 0.4; 
            
            h = this.LEVEL_FLOOR + variation;

            // FIX IMPORTANTE:
            // Impediamo che il terreno bianco scenda sotto l'acqua
            // Se variazione è negativa, la blocchiamo a un minimo
            h = Math.max(h, this.LEVEL_WATER + 0.5);

            // Alberi: Solo se non è binario e non è acqua
            // Aumentata leggermente la densità (0.02)
            if(Math.random() < 0.02) {
                treePositions.push(new THREE.Vector3(vec.x, h, vec.z));
            }
        }

        posAttr.setY(i, h);
    }

    geo.computeVertexNormals();
    
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, roughness: 0.9, flatShading: true 
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    this.spawnTrees(treePositions);
}

spawnTrees(positions) {
    if(positions.length === 0) return;
    
    // Albero: tronco marrone + chioma verde
    // Per performance usiamo un solo colore (verde scuro) per tutto l'albero low poly
    const treeGeo = new THREE.ConeGeometry(2.5, 9, 5);
    treeGeo.translate(0, 4.5, 0); 
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x1a331a, flatShading: true });
    
    const mesh = new THREE.InstancedMesh(treeGeo, treeMat, positions.length);
    const dummy = new THREE.Object3D();

    positions.forEach((pos, i) => {
        dummy.position.copy(pos);
        const s = 0.7 + Math.random() * 0.5;
        dummy.scale.set(s, s * (0.8 + Math.random()*0.4), s); // Varia altezza
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    });
    this.scene.add(mesh);
}

createWaterPlane() {
    const geo = new THREE.PlaneGeometry(this.worldSize, this.worldSize);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x0044aa, roughness: 0.0, metalness: 0.8,
        transparent: true, opacity: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = this.LEVEL_WATER; 
    this.scene.add(mesh);
}

createDoubleTracks() {
    if (!this.trackCurve) return;
    const railOffset = 1.5; const divisions = 1000;
    const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4 });

    const createRail = (dir) => {
        const pts = [];
        for(let i=0; i<=divisions; i++) {
            const t = (i/divisions) % 1;
            const p = this.trackCurve.getPointAt(t);
            const tan = this.trackCurve.getTangentAt(t);
            const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0,1,0)).normalize();
            pts.push(p.clone().add(right.multiplyScalar(dir * railOffset)));
        }
        const curve = new THREE.CatmullRomCurve3(pts); curve.closed = true;
        const geo = new THREE.TubeGeometry(curve, divisions, 0.15, 5, true);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.35; // Offset per centrare sul binario
        this.scene.add(mesh);
    };
    createRail(1); createRail(-1);
}

createSleepers() {
    const count = 1500;
    const geo = new THREE.BoxGeometry(5, 0.3, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    
    for(let i=0; i<count; i++) {
        const t = i/count;
        const p = this.trackCurve.getPointAt(t);
        const tan = this.trackCurve.getTangentAt(t);
        dummy.position.copy(p);
        dummy.lookAt(p.clone().add(tan));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(mesh);
}
}