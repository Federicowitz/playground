// src/components/Assets.js
import * as THREE from 'three';

/**
 * ==========================================================================================
 * SYSTEM CORE: TEXTURE GENERATION & OPTIMIZATION UTILS
 * ==========================================================================================
 * Per risparmiare RAM e Network, generiamo texture 512x512 proceduralmente.
 * Questo evita il caricamento di asset esterni pesanti.
 */

const TextureFactory = {
    canvas: document.createElement('canvas'),
    ctx: null,

    init() {
        this.canvas.width = 512;
        this.canvas.height = 512;
        this.ctx = this.canvas.getContext('2d');
    },

    createMagmaTexture() {
        if (!this.ctx) this.init();
        const ctx = this.ctx;
        const w = 512, h = 512;

        // Sfondo scuro
        ctx.fillStyle = '#1a0500';
        ctx.fillRect(0, 0, w, h);

        // Vene di lava
        for (let i = 0; i < 400; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * w, Math.random() * h);
            ctx.bezierCurveTo(
                Math.random() * w, Math.random() * h,
                Math.random() * w, Math.random() * h,
                Math.random() * w, Math.random() * h
            );
            ctx.strokeStyle = `rgba(255, ${Math.floor(Math.random() * 100)}, 0, ${Math.random() * 0.5 + 0.2})`;
            ctx.lineWidth = Math.random() * 15 + 2;
            ctx.stroke();
        }
        
        // Rumore per crosta
        const imgData = ctx.getImageData(0,0,w,h);
        for(let i=0; i<imgData.data.length; i+=4) {
            if(Math.random() > 0.9) {
                const noise = Math.random() * 50;
                imgData.data[i] -= noise;
                imgData.data[i+1] -= noise;
                imgData.data[i+2] -= noise;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    },

    createRustTexture() {
        if (!this.ctx) this.init();
        const ctx = this.ctx;
        ctx.fillStyle = '#3b2618';
        ctx.fillRect(0,0,512,512);
        
        // Chiazze di ruggine
        for(let i=0; i<2000; i++){
            const x = Math.random()*512;
            const y = Math.random()*512;
            const r = Math.random()*5;
            ctx.fillStyle = Math.random() > 0.5 ? '#5e3a23' : '#8c4b2b';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fill();
        }
        const tex = new THREE.CanvasTexture(this.canvas);
        return tex;
    }
};

/**
 * Pool di Geometrie Condivise.
 * Invece di fare `new BoxGeometry` 100 volte, lo facciamo 1 volta qui.
 */
const GeometryPool = {
    box: new THREE.BoxGeometry(1, 1, 1),
    sphere: new THREE.SphereGeometry(1, 16, 16),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
    cone: new THREE.ConeGeometry(1, 1, 16),
    torus: new THREE.TorusGeometry(1, 0.3, 16, 32),
    
    // Geometria personalizzata per Spuntone Infernale
    hellSpike: (function() {
        const geo = new THREE.ConeGeometry(0.2, 1.5, 8);
        geo.translate(0, 0.75, 0); // Pivot alla base
        return geo;
    })(),
    
    // Geometria personalizzata per Anello Catena
    chainLink: (function() {
        const geo = new THREE.TorusGeometry(0.4, 0.12, 8, 16);
        geo.scale(1, 1.5, 1); // Allungato
        return geo;
    })(),

    dispose() {
        // Metodo per pulizia memoria se necessario
        Object.values(this).forEach(g => {
            if(g.dispose) g.dispose();
        });
    }
};

/**
 * Helper per distribuire Mesh istanziate (InstancedMesh).
 * Essenziale per le performance (1 draw call invece di 1000).
 */
const distributeSpikes = (targetGroup, count, surfaceFunction, material) => {
    const instancedMesh = new THREE.InstancedMesh(GeometryPool.hellSpike, material, count);
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
        const transform = surfaceFunction(i, count); // Ritorna { pos: Vector3, rot: Euler/Quaternion, scale: Vector3 }
        
        dummy.position.copy(transform.pos);
        if (transform.rot) dummy.rotation.copy(transform.rot);
        if (transform.lookAt) dummy.lookAt(transform.lookAt);
        
        // Variazione randomica per realismo infernale
        const scaleVar = 0.8 + Math.random() * 0.6;
        dummy.scale.set(scaleVar, scaleVar, scaleVar);
        
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    targetGroup.add(instancedMesh);
};


// ==========================================================================================
// ASSETS DEFINITION
// ==========================================================================================

export const Assets = {
    textures: {
        magma: null,
        rust: null
    },

    initResources() {
        if (!this.textures.magma) {
            this.textures.magma = TextureFactory.createMagmaTexture();
            this.textures.rust = TextureFactory.createRustTexture();
        }
    },

    materials: {
        // 1. Ossidiana Infernale (Nero profondo, lucido ma graffiato)
        obsidian: new THREE.MeshPhysicalMaterial({
            color: 0x050005,
            roughness: 0.4,
            metalness: 0.6,
            clearcoat: 1.0,
            clearcoatRoughness: 0.5,
        }),

        // 2. Metallo Arrugginito (Strutture portanti)
        rustedMetal: new THREE.MeshStandardMaterial({
            color: 0x5e3a23,
            roughness: 0.9,
            metalness: 0.3,
            map: null // Assegnato a runtime init
        }),

        // 3. Magma Pulsante (Cuore del treno)
        livingMagma: new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xff3300,
            emissiveIntensity: 4,
            emissiveMap: null, // Assegnato a runtime
            roughness: 0.8
        }),

        // 4. Ossa Antiche (Decorazioni)
        ancientBone: new THREE.MeshStandardMaterial({
            color: 0xdcd0b0,
            roughness: 0.6,
            metalness: 0.0
        }),

        // 5. Anime Sofferenti (Bagliore spettrale)
        soulEther: new THREE.MeshPhysicalMaterial({
            color: 0x88ffff,
            transparent: true,
            opacity: 0.6,
            transmission: 0.4,
            roughness: 0.2,
            emissive: 0x0044aa,
            emissiveIntensity: 2
        }),
        
        // 6. Corna di Balrog
        demonHorn: new THREE.MeshStandardMaterial({
            color: 0x220500,
            roughness: 0.7,
            emissive: 0xaa1100,
            emissiveIntensity: 0.2
        })
    },

    // -------------------------------------------------------
    // GENERAZIONE PROCEDURALE CORNA (Curva complessa)
    // -------------------------------------------------------
    createHornGeometry: function(length, thickBase, curveAmount) {
        // Creiamo una curva spline per il corno
        const points = [];
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = (t * length);
            const y = Math.pow(t, 2) * curveAmount; // Curvatura quadratica
            const z = Math.sin(t * Math.PI) * (curveAmount * 0.3); // Spirale leggera
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        
        // Geometria tubo con raggio variabile (Tapering)
        const geometry = new THREE.TubeGeometry(curve, 24, thickBase, 8, false);
        
        // Manipolazione diretta dei vertici per assottigliare la punta
        // TubeGeometry non supporta radius variabile nativamente in vecchie versioni,
        // quindi iteriamo sui vertici per scalarli.
        const pos = geometry.attributes.position;
        const count = pos.count;
        
        // Logica: i vertici sono ordinati per anelli lungo il tubo.
        // L'indice i avanza lungo il tubo.
        for (let i = 0; i < count; i++) {
            // Calcoliamo approssimativamente 't' in base all'indice
            // Questo è un'approssimazione, per precisione assoluta servirebbero UV mapping
            // Ma per un effetto visivo "caotico" va bene.
            const vertexIndex = Math.floor(i / (8 + 1)); // 8 segmenti radiali
            const t = vertexIndex / 24; // 24 segmenti tubolari
            
            const scale = 1 - t; // Da 1 (base) a 0 (punta)
            const clampedScale = Math.max(scale, 0.05); // Non farla sparire del tutto
            
            // Centro approssimativo dell'anello corrente sulla curva
            const pointOnCurve = curve.getPointAt(Math.min(t, 1));
            
            // Recupera posizione attuale
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            
            // Sposta verso il centro della curva
            pos.setXYZ(
                i,
                pointOnCurve.x + (x - pointOnCurve.x) * clampedScale,
                pointOnCurve.y + (y - pointOnCurve.y) * clampedScale,
                pointOnCurve.z + (z - pointOnCurve.z) * clampedScale
            );
        }
        
        geometry.computeVertexNormals();
        return geometry;
    },


    // -------------------------------------------------------
    // LOCOMOTIVA DELL'ADE
    // -------------------------------------------------------
    createLocomotive: function() {
        this.initResources();
        // Applichiamo texture ai materiali se non l'abbiamo già fatto
        if (!this.materials.rustedMetal.map) this.materials.rustedMetal.map = this.textures.rust;
        if (!this.materials.livingMagma.emissiveMap) {
            this.materials.livingMagma.emissiveMap = this.textures.magma;
            this.materials.livingMagma.map = this.textures.magma;
        }

        const trainGroup = new THREE.Group();

        // --- A. TELAIO PRINCIPALE (Vertebre di Drago) ---
        // Invece di una scatola, usiamo una "spina dorsale"
        const chassisLength = 14;
        const spineGeo = new THREE.CylinderGeometry(0.8, 0.6, 1.5, 8);
        spineGeo.rotateZ(Math.PI / 2);
        
        const chassisGroup = new THREE.Group();
        
        // Creazione Vertebre
        for(let x = -chassisLength/2; x < chassisLength/2; x += 1.6) {
            const vertebra = new THREE.Mesh(spineGeo, this.materials.ancientBone);
            vertebra.position.set(x, 0, 0);
            
            // Costole laterali (Ribcage)
            const ribGeo = new THREE.TorusGeometry(1.8, 0.15, 8, 16, Math.PI * 0.7);
            
            // Costola sinistra
            const ribL = new THREE.Mesh(ribGeo, this.materials.ancientBone);
            ribL.position.set(x, 0.5, 0);
            ribL.rotation.y = Math.PI / 2; // Orienta lungo asse Z
            ribL.rotation.z = -Math.PI / 3;
            
            // Costola destra
            const ribR = new THREE.Mesh(ribGeo, this.materials.ancientBone);
            ribR.position.set(x, 0.5, 0);
            ribR.rotation.y = Math.PI / 2;
            ribR.rotation.z = Math.PI + Math.PI / 3; // Specchio

            chassisGroup.add(vertebra);
            chassisGroup.add(ribL);
            chassisGroup.add(ribR);
        }
        chassisGroup.position.y = 1.8;
        trainGroup.add(chassisGroup);


        // --- B. MOTORE A FUSIONE D'ANIME (Caldaia) ---
        // Una sfera pulsante incatenata al centro
        const boilerGroup = new THREE.Group();
        const magmaCore = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 32), this.materials.livingMagma);
        // Animazione pulsazione verrà gestita nel game loop tramite userData
        magmaCore.userData.pulseSpeed = 2.0;
        
        // Gabbia di contenimento (Ferro arrugginito)
        const cageGeo = new THREE.IcosahedronGeometry(2.5, 1);
        const cageWire = new THREE.WireframeGeometry(cageGeo);
        // Trasformiamo wireframe in tubi spessi usando linea non funziona bene con luci
        // Usiamo trick: cloniamo icosaedro e usiamo materiale wireframe? No, instancing di tubi.
        // Per semplicità in ottimizzazione, usiamo Torus incrociati.
        const cageContainer = new THREE.Group();
        [0, Math.PI/4, Math.PI/2, Math.PI*0.75].forEach(angle => {
            const band = new THREE.Mesh(GeometryPool.torus, this.materials.rustedMetal);
            band.scale.set(2.6, 2.6, 2.6);
            band.rotation.y = angle;
            cageContainer.add(band);
        });

        boilerGroup.add(magmaCore);
        boilerGroup.add(cageContainer);
        boilerGroup.position.set(0, 3.5, 1.5);
        trainGroup.add(boilerGroup);

        // Catene che tengono la sfera
        // Generiamo istanze di catene
        const chainGroup = new THREE.Group();
        // 4 catene dagli angoli
        const chainCountPerLine = 8;
        const totalLinks = 4 * chainCountPerLine;
        const chainInstancer = new THREE.InstancedMesh(GeometryPool.chainLink, this.materials.rustedMetal, totalLinks);
        
        const anchorPoints = [
            { start: new THREE.Vector3(2, 1, 3), end: new THREE.Vector3(1.5, 3, 1.5) },
            { start: new THREE.Vector3(-2, 1, 3), end: new THREE.Vector3(-1.5, 3, 1.5) },
            { start: new THREE.Vector3(2, 1, -3), end: new THREE.Vector3(1.5, 3, 1.5) }, // Not quite accurate anchor but works visually
            { start: new THREE.Vector3(-2, 1, -3), end: new THREE.Vector3(-1.5, 3, 1.5) }
        ];

        let linkIdx = 0;
        const dummy = new THREE.Object3D();
        anchorPoints.forEach(pts => {
            const curve = new THREE.LineCurve3(pts.start, pts.end);
            for(let i=0; i<chainCountPerLine; i++) {
                const t = i / chainCountPerLine;
                const pos = curve.getPoint(t);
                dummy.position.copy(pos);
                dummy.lookAt(pts.end);
                if (i%2 === 0) dummy.rotateZ(Math.PI/2); // Alterna anelli
                dummy.updateMatrix();
                chainInstancer.setMatrixAt(linkIdx++, dummy.matrix);
            }
        });
        chainGroup.add(chainInstancer);
        chainGroup.position.y = 1; // Offset relativo al telaio
        trainGroup.add(chainGroup);


        // --- C. L'ARIETE CORNUTO (The Ram) ---
        const ramGroup = new THREE.Group();
        
        // Testa teschio centrale (Low poly procedurale)
        const skullBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1.8), this.materials.ancientBone);
        skullBase.position.set(0, 0, 0);
        // Jaw (Mascella)
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.5), this.materials.ancientBone);
        jaw.position.set(0, -1.2, 0.2);
        jaw.rotation.x = 0.4;
        
        // Orbite (Occhi) - Glow rosso
        const eyeGeo = new THREE.SphereGeometry(0.3);
        const eyeL = new THREE.Mesh(eyeGeo, this.materials.livingMagma); eyeL.position.set(0.4, 0.2, 0.9);
        const eyeR = new THREE.Mesh(eyeGeo, this.materials.livingMagma); eyeR.position.set(-0.4, 0.2, 0.9);
        
        ramGroup.add(skullBase, jaw, eyeL, eyeR);

        // GENERAZIONE CORNA EPICA
        const hornGeoL = this.createHornGeometry(4, 0.5, 3);
        const hornL = new THREE.Mesh(hornGeoL, this.materials.demonHorn);
        // Posizionamento Corno Sinistro
        hornL.position.set(0.8, 0.8, 0);
        hornL.rotation.y = 0.5; 
        hornL.rotation.z = -0.5;
        hornL.rotation.x = -0.2;
        
        const hornGeoR = hornGeoL.clone(); // Clone geometry per risparmiare ricalcolo
        // Non basta clonare la mesh, per specchiarla geometricamente usiamo scala negativa
        const hornR = new THREE.Mesh(hornGeoR, this.materials.demonHorn);
        hornR.position.set(-0.8, 0.8, 0);
        hornR.scale.x = -1; // Specchia geometria
        hornR.rotation.y = -0.5;
        hornR.rotation.z = 0.5;
        hornR.rotation.x = -0.2;

        ramGroup.add(hornL);
        ramGroup.add(hornR);

        ramGroup.position.set(0, 2.5, 8.5); // Fronte treno
        trainGroup.add(ramGroup);


        // --- D. SPUNTONI OVUNQUE (Optimization Magic) ---
        // Usiamo l'helper distributeSpikes per riempire il telaio di punte
        const spikeHolder = new THREE.Group();
        distributeSpikes(spikeHolder, 150, (i, total) => {
            // Funzione di distribuzione lungo il telaio laterale
            // Lato: -1 o 1
            const side = Math.random() > 0.5 ? 1 : -1;
            const z = (Math.random() - 0.5) * 12 + 1; // Lunghezza telaio
            
            const pos = new THREE.Vector3(
                side * 1.8, // Larghezza
                1.5 + Math.random() * 0.5, 
                z
            );
            
            const lookAt = new THREE.Vector3(side * 5, 1.5, z); // Punta in fuori
            const rot = new THREE.Euler(0, 0, side * -Math.PI/2); // Orienta orizzontalmente
            
            return { pos, lookAt: null, rot }; // Usiamo rot manuale
        }, this.materials.obsidian);
        trainGroup.add(spikeHolder);


        // --- E. CABINA DEL TRONO (Cab) ---
        const cabGroup = new THREE.Group();
        
        // Pavimento ossidiana
        const floor = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 4), this.materials.obsidian);
        cabGroup.add(floor);
        
        // Colonne di basalto
        [1.6, -1.6].forEach(x => {
            [1.8, -1.8].forEach(z => {
                // Colonna ruvida
                const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 4, 5), this.materials.obsidian);
                col.position.set(x, 2, z);
                col.rotation.y = Math.random(); // Rotazione casuale per varietà
                cabGroup.add(col);
                
                // Torce in cima
                const fire = new THREE.PointLight(0xff4400, 2, 5);
                fire.position.set(x, 4.2, z);
                cabGroup.add(fire);
            });
        });
        
        // Tetto Gotico (Punte)
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 2, 4), this.materials.rustedMetal);
        roof.position.y = 5;
        roof.rotation.y = Math.PI/4;
        cabGroup.add(roof);
        
        cabGroup.position.set(0, 2.5, -4.5);
        trainGroup.add(cabGroup);


        // --- F. SISTEMA DI SCARICO (Balrog Smoke Emitters) ---
        const stackGroup = new THREE.Group();
        // 3 ciminiere inclinate aggressive
        for(let i=0; i<3; i++) {
            const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2, 8), this.materials.obsidian);
            stack.position.set(0, 0, i * 1.2);
            stack.rotation.x = -Math.PI / 6; // Inclinate indietro
            
            // Anello di fuoco alla bocca
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 16), this.materials.livingMagma);
            ring.position.y = 1;
            ring.rotation.x = Math.PI/2;
            stack.add(ring);
            
            stackGroup.add(stack);
        }
        stackGroup.position.set(0, 5.5, 3);
        trainGroup.add(stackGroup);
        trainGroup.userData.chimneyPos = new THREE.Vector3(0, 7, 3); // Per le particelle fumo esterne


        // --- G. RUOTE "MACINATRICI" (Grinders) ---
        // Non ruote normali, ma seghe circolari
        const createGrinderWheel = (radius) => {
            const gGroup = new THREE.Group();
            // Disco centrale
            const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.4, 12), this.materials.rustedMetal);
            disc.rotation.x = Math.PI/2;
            gGroup.add(disc);
            
            // Denti della sega (Instancing circolare)
            const teethCount = 12;
            const iTeeth = new THREE.InstancedMesh(GeometryPool.cone, this.materials.obsidian, teethCount);
            const tDummy = new THREE.Object3D();
            
            for(let k=0; k<teethCount; k++) {
                const angle = (k/teethCount) * Math.PI*2;
                tDummy.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                );
                tDummy.rotation.z = angle - Math.PI/2; // Punta in fuori
                tDummy.scale.set(0.3, 0.6, 0.2); // Dente piatto
                tDummy.updateMatrix();
                iTeeth.setMatrixAt(k, tDummy.matrix);
            }
            gGroup.add(iTeeth);
            
            // Glow centrale
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8), this.materials.livingMagma);
            cap.rotation.x = Math.PI/2;
            gGroup.add(cap);
            
            // Orientamento binari
            gGroup.rotation.y = Math.PI/2;
            return gGroup;
        };

        const bigWheelR = 1.4;
        [0, 3.5].forEach(z => {
            const wL = createGrinderWheel(bigWheelR); wL.position.set(1.8, bigWheelR, z); trainGroup.add(wL);
            const wR = createGrinderWheel(bigWheelR); wR.position.set(-1.8, bigWheelR, z); wR.rotation.y = -Math.PI/2; trainGroup.add(wR);
        });
        
        const smallWheelR = 0.7;
        [6, 8].forEach(z => {
            const wL = createGrinderWheel(smallWheelR); wL.position.set(1.6, smallWheelR, z); trainGroup.add(wL);
            const wR = createGrinderWheel(smallWheelR); wR.position.set(-1.6, smallWheelR, z); wR.rotation.y = -Math.PI/2; trainGroup.add(wR);
        });

        // Luce Demoniaca Frontale
        const headlight = new THREE.SpotLight(0xff0000, 20, 80, 0.5, 0.5);
        headlight.position.set(0, 4, 8);
        headlight.target.position.set(0, 0, 40);
        headlight.castShadow = true;
        // Texture di proiezione? Sarebbe bello ma costoso.
        trainGroup.add(headlight);
        trainGroup.add(headlight.target);

        return trainGroup;
    },


    // -------------------------------------------------------
    // IL VAGONE "PRIGIONE DELLE ANIME"
    // -------------------------------------------------------
    createWagon: function() {
        const group = new THREE.Group();

        // 1. Pianale di Metallo Bruciato
        const baseGeo = new THREE.BoxGeometry(3.2, 0.8, 9);
        const base = new THREE.Mesh(baseGeo, this.materials.rustedMetal);
        base.position.y = 1.2;
        group.add(base);

        // Dettaglio Texture pianale (Griglie)
        const gridTex = TextureFactory.ctx ? new THREE.CanvasTexture(TextureFactory.canvas) : null; // Riutilizza magma come griglia sporca
        if(gridTex) {
            base.material = base.material.clone(); // Clone per non rovinare l'originale globale
            // Non facciamo nulla di complesso per non caricare RAM
        }

        // 2. Gabbia delle Anime (Costruita con InstancedMesh di ossa)
        // Abbiamo sbarre verticali che sembrano femori o spine
        const barCountX = 6; // Per lato
        const barCountZ = 12; // Lungo il vagone
        const totalBars = (barCountX * 2 + barCountZ * 2); 
        
        // Usiamo GeometryPool.cylinder scalato
        const barsInstancer = new THREE.InstancedMesh(GeometryPool.cylinder, this.materials.ancientBone, 50);
        
        let barIdx = 0;
        const dummy = new THREE.Object3D();
        
        // Barre laterali
        for(let z = -4; z <= 4; z += 1.5) {
            // Sinistra
            dummy.position.set(1.5, 3, z);
            dummy.scale.set(0.15, 3.5, 0.15); // Femore sottile
            dummy.rotation.set(0,0,0);
            dummy.updateMatrix();
            barsInstancer.setMatrixAt(barIdx++, dummy.matrix);
            
            // Destra
            dummy.position.set(-1.5, 3, z);
            dummy.updateMatrix();
            barsInstancer.setMatrixAt(barIdx++, dummy.matrix);
        }
        group.add(barsInstancer);

        // 3. Contenitore Etereo Interno (Le anime)
        // Un blocco trasparente dentro la gabbia con materiale MeshPhysicalMaterial
        const soulBoxGeo = new THREE.BoxGeometry(2.8, 3, 8.5);
        const soulBox = new THREE.Mesh(soulBoxGeo, this.materials.soulEther);
        soulBox.position.y = 3;
        // Animazione "Respiro" souls nel loop principale
        soulBox.userData.isSouls = true; 
        group.add(soulBox);
        
        // Anime fluttuanti (Particelle interne simulate con sfere instanziate)
        // Piccoli globi luminosi dentro il blocco
        const soulParticles = new THREE.InstancedMesh(GeometryPool.sphere, new THREE.MeshBasicMaterial({color: 0xffffff}), 20);
        for(let k=0; k<20; k++) {
            dummy.position.set(
                (Math.random()-0.5)*2,
                3 + (Math.random()-0.5)*2,
                (Math.random()-0.5)*7
            );
            dummy.scale.set(0.1, 0.1, 0.1);
            dummy.updateMatrix();
            soulParticles.setMatrixAt(k, dummy.matrix);
        }
        group.add(soulParticles);


        // 4. Tetto di Scaglie (Spuntoni verso l'alto)
        const roofBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 9.2), this.materials.obsidian);
        roofBase.position.y = 5;
        group.add(roofBase);
        
        // Instancing di punte sul tetto
        const roofSpikes = new THREE.InstancedMesh(GeometryPool.hellSpike, this.materials.demonHorn, 60);
        for(let k=0; k<60; k++) {
            const x = (Math.random() - 0.5) * 3;
            const z = (Math.random() - 0.5) * 9;
            dummy.position.set(x, 5.2, z);
            dummy.scale.set(0.5, 0.5 + Math.random()*0.5, 0.5);
            dummy.rotation.set((Math.random()-0.5)*0.5, 0, (Math.random()-0.5)*0.5); // Leggermente storte
            dummy.updateMatrix();
            roofSpikes.setMatrixAt(k, dummy.matrix);
        }
        group.add(roofSpikes);

        // 5. Ruote e Carrelli (Carrozzeria pesante)
        const createBogie = (zPos) => {
            const bogieGr = new THREE.Group();
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 3.5), this.materials.obsidian);
            chassis.position.set(0, 1, zPos);
            
            // Punte laterali al carrello
            const sL = new THREE.Mesh(GeometryPool.hellSpike, this.materials.rustedMetal);
            sL.rotation.z = Math.PI/2; sL.position.set(1.3, 0, 0);
            chassis.add(sL);
            const sR = new THREE.Mesh(GeometryPool.hellSpike, this.materials.rustedMetal);
            sR.rotation.z = -Math.PI/2; sR.position.set(-1.3, 0, 0);
            chassis.add(sR);

            bogieGr.add(chassis);

            // Ruote dentate piccole
            const wR = 0.7;
            [-1, 1].forEach(offset => {
                const wL_mesh = new THREE.Mesh(new THREE.CylinderGeometry(wR, wR, 0.3, 12), this.materials.rustedMetal);
                wL_mesh.rotation.z = Math.PI/2; wL_mesh.position.set(1.2, wR, zPos + offset);
                bogieGr.add(wL_mesh);
                
                const wR_mesh = wL_mesh.clone();
                wR_mesh.position.set(-1.2, wR, zPos + offset);
                bogieGr.add(wR_mesh);
            });
            return bogieGr;
        };

        group.add(createBogie(2.5));
        group.add(createBogie(-2.5));
        
        // Luce soffusa interna bluastra (la disperazione)
        const despairLight = new THREE.PointLight(0x0044ff, 3, 10);
        despairLight.position.set(0, 3, 0);
        group.add(despairLight);

        return group;
    },

    /**
     * Funzione per pulire le risorse quando si cambia scena/livello
     * Importante per la gestione RAM.
     */
    dispose() {
        GeometryPool.dispose();
        Object.values(this.materials).forEach(mat => {
            if(mat.dispose) mat.dispose();
        });
        Object.values(this.textures).forEach(tex => {
            if(tex) tex.dispose();
        });
    }
};