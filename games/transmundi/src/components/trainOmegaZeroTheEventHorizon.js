// src/components/Assets.js
import * as THREE from 'three';

/**
 * ============================================================================
 * THE SINGULARITY ENGINE: DIMENSIONAL TEXTURES
 * ============================================================================
 * Generazione di texture che rappresentano il tessuto dello spaziotempo strappato.
 */

const CosmicForge = {
    canvas: document.createElement('canvas'),
    ctx: null,

    getContext(size = 512) {
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d');
        return this.ctx;
    },

    // 1. RUMORE QUANTISTICO (Base per effetti di glitch)
    generateQuantumNoise() {
        const ctx = this.getContext(256);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 256, 256);

        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const w = Math.random() * 50;
            
            const grd = ctx.createLinearGradient(x, y, x + w, y);
            grd.addColorStop(0, 'rgba(0, 255, 255, 0.0)');
            grd.addColorStop(0.5, 'rgba(255, 0, 255, 0.8)');
            grd.addColorStop(1, 'rgba(0, 255, 255, 0.0)');
            
            ctx.fillStyle = grd;
            ctx.fillRect(x, y, w, 1); // Strisce orizzontali "Stringhe"
        }
        return new THREE.CanvasTexture(this.canvas);
    },

    // 2. EVENT HORIZON (Anello radiante)
    generateEventHorizon() {
        const size = 512;
        const ctx = this.getContext(size);
        const cx = size/2, cy = size/2;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0,0,size,size);

        // Raggi tachionici
        for(let i=0; i<360; i+=0.5) {
            const angle = (i * Math.PI) / 180;
            const len = 100 + Math.random() * 150;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle)*len, cy + Math.sin(angle)*len);
            ctx.strokeStyle = `rgba(${100+Math.random()*155}, ${200+Math.random()*55}, 255, ${Math.random()*0.2})`;
            ctx.stroke();
        }

        // Buco nero centrale
        const grd = ctx.createRadialGradient(cx, cy, 50, cx, cy, 150);
        grd.addColorStop(0, '#000000'); // Singolarità
        grd.addColorStop(0.5, '#000000');
        grd.addColorStop(0.6, '#ff00ff'); // Disco di accrescimento
        grd.addColorStop(0.7, '#00ffff'); 
        grd.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx,cy,256,0,Math.PI*2); ctx.fill();

        return new THREE.CanvasTexture(this.canvas);
    }
};

export const Assets = {
    cache: { 
        materials: {}, 
        geometries: {},
        textures: {}
    },

    // --- MATERIALI TRASCENDENTALI ---
    materials: {
        // "NULL MATTER": Nero assoluto che divora la luce, ma con bordo lucido
        voidMatter: new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            roughness: 0.0,
            metalness: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            emissive: 0x220044,
            emissiveIntensity: 0.5 // Bagliore oscuro
        }),

        // "SOLID LIGHT": Vetro tachionico
        tachyonCrystal: new THREE.MeshPhysicalMaterial({
            color: 0xaaffff,
            transmission: 0.95, // Completamente trasparente
            opacity: 1,
            metalness: 0.1,
            roughness: 0.0,
            ior: 2.5, // Indice rifrazione diamante extraterrestre
            thickness: 1.5,
            attenuationColor: 0xff00ff, // Assorbe luce magenta
            attenuationDistance: 1.0,
            emissive: 0x00ffff,
            emissiveIntensity: 0.8
        }),

        // "DATA STREAM": Filamenti di pura energia (Wireframe)
        stringTheory: new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        }),

        // "STAR PLASMA": Per particelle
        plasma: new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: null, // Assegnato runtime
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    },

    init() {
        if(!this.cache.textures.quantum) {
            this.cache.textures.quantum = CosmicForge.generateQuantumNoise();
            this.cache.textures.horizon = CosmicForge.generateEventHorizon();
            this.materials.plasma.map = this.cache.textures.horizon; // Riutilizziamo il gradiente
        }
        
        // Geometria Sacra Base
        this.cache.geometries.tetra = new THREE.TetrahedronGeometry(1, 0);
        this.cache.geometries.octa = new THREE.OctahedronGeometry(1, 0);
        this.cache.geometries.ico = new THREE.IcosahedronGeometry(1, 1);
    },

    // --- GENERATORI GEOMETRICI TRASCENDENTALI ---

    /**
     * Crea un TESSERATTO (Ipercubo) annidato
     * Non un cubo, ma strutture dentro strutture che ruotano.
     */
    createHyperCube() {
        const group = new THREE.Group();
        
        // Struttura Esterna (Wireframe)
        const outerGeo = new THREE.BoxGeometry(3, 3, 3);
        const outer = new THREE.Mesh(outerGeo, this.materials.stringTheory);
        group.add(outer);

        // Cubo "Fantasma" intermedio (Cristallo)
        const midGeo = new THREE.BoxGeometry(2, 2, 2);
        const mid = new THREE.Mesh(midGeo, this.materials.tachyonCrystal);
        mid.userData.spin = { x: 0.01, y: 0.02, z: 0.01 };
        group.add(mid);

        // Nucleo (Materia Oscura)
        const coreGeo = new THREE.IcosahedronGeometry(0.8, 1);
        const core = new THREE.Mesh(coreGeo, this.materials.voidMatter);
        core.userData.spin = { x: -0.05, y: -0.05, z: 0.0 };
        // Aggiungi anelli orbitali al nucleo
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.02, 16, 100), this.materials.plasma);
        core.add(ring);
        const ring2 = ring.clone(); ring2.rotation.x = Math.PI/2; core.add(ring2);

        mid.add(core); // Core dentro cristallo
        
        return group;
    },

    /**
     * Genera "Ali Frattali" (Sierpinski-ish tetrahedron arrays)
     * Usando InstancedMesh per migliaia di frammenti.
     */
    createFractalWing(length) {
        const count = 60;
        const mesh = new THREE.InstancedMesh(this.cache.geometries.tetra, this.materials.tachyonCrystal, count);
        const dummy = new THREE.Object3D();

        // Algoritmo spirale frattale
        for(let i=0; i<count; i++) {
            const t = i / count;
            // Coordinate polari + offset Z
            const angle = t * Math.PI * 6; // 3 giri
            const radius = 0.5 + t * 1.5;
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = t * length; // Lunghezza ala

            dummy.position.set(x, y, -z);
            dummy.rotation.set(Math.random(), Math.random(), Math.random());
            const scale = (1 - t) * 0.8 + 0.1; // Da grande a piccolo
            dummy.scale.set(scale, scale, scale);
            
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.userData.isBreathing = true; // Per farla pulsare
        return mesh;
    },

    /**
     * Genera i "Nodi di Ancoraggio Temporale" (Ruote alternative)
     * Sono sfere di energia pulsante che non toccano terra.
     */
    createTimeAnchor() {
        const group = new THREE.Group();
        
        // Sfera centrale che deforma la luce
        const anchor = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 2), this.materials.tachyonCrystal);
        group.add(anchor);
        
        // Onde d'urto (Anelli piatti)
        const waveGeo = new THREE.RingGeometry(0.8, 1.0, 32);
        const wave1 = new THREE.Mesh(waveGeo, this.materials.plasma);
        wave1.rotation.x = -Math.PI/2;
        group.add(wave1);
        
        const wave2 = new THREE.Mesh(waveGeo, this.materials.stringTheory);
        wave2.rotation.x = -Math.PI/2;
        wave2.position.y = 0.2;
        wave2.scale.set(0.8, 0.8, 0.8);
        group.add(wave2);
        group.userData.isFloater = true; 
        group.userData.randomOffset = Math.random() * 100;
        return group;
    },


    // ------------------------------------------------------------------------
    // ENTITY BUILDER: "OMEGA-ZERO" (The Loco)
    // ------------------------------------------------------------------------
    createLocomotive: function() {
        this.init();
        const entity = new THREE.Group();

        // 1. NUCLEO CENTRALE "THE BRAIN" (Ipercubo)
        const hypercube = this.createHyperCube();
        hypercube.position.set(0, 3.5, 2);
        hypercube.scale.set(1.2, 1.2, 1.2);
        entity.add(hypercube);
        // Per l'animazione nel loop principale
        hypercube.userData.isTesseract = true;

        // 2. CORPO FLUTTUANTE "DATA STREAM" (Scia solida)
        // Non un telaio, ma frammenti che galleggiano in formazione
        const fragmentCount = 100;
        const bodyFragments = new THREE.InstancedMesh(this.cache.geometries.octa, this.materials.voidMatter, fragmentCount);
        const dummy = new THREE.Object3D();
        
        for(let i=0; i<fragmentCount; i++) {
            // Distribuzione nuvola ellissoidale allungata
            const t = i/fragmentCount;
            const angle = t * Math.PI * 10;
            const radius = 0.8 + Math.sin(t*10)*0.3;
            
            const z = (t - 0.5) * 14; // Lunghezza
            const x = Math.cos(angle) * radius * (1.0 + t); // Si allarga
            const y = Math.sin(angle) * radius;

            dummy.position.set(x, y + 3.0, z);
            dummy.lookAt(0, 3.0, z + 1); // Guarda avanti
            const s = 0.2 + Math.random() * 0.5;
            dummy.scale.set(s, s*2, s); // Allungati come schegge
            
            dummy.updateMatrix();
            bodyFragments.setMatrixAt(i, dummy.matrix);
        }
        entity.add(bodyFragments);


        // 3. ALI DI DISTORSIONE REALTA' (Frattali)
        const wingLeft = this.createFractalWing(8);
        wingLeft.position.set(2.5, 3.0, 4); // Start front
        entity.add(wingLeft);
        
        const wingRight = this.createFractalWing(8);
        wingRight.position.set(-2.5, 3.0, 4);
        // Mirror geometry matrix inversion not easy on instanced without recalc
        // Just rotate group
        wingRight.scale.x = -1; 
        // Note: scale -1 might invert faces (culling), for translucent mat it looks cool (glitchy)
        entity.add(wingRight);


        // 4. ANCORAGGI AL SUOLO (No ruote)
        const anchorPos = [4, 0, -4];
        anchorPos.forEach(z => {
            const aL = this.createTimeAnchor();
            aL.position.set(2, 0.8, z);
            // Random floating offset managed by physics or baked visual? Baked visual in update
            aL.userData.floatOffset = Math.random() * Math.PI; 
            entity.add(aL);

            const aR = this.createTimeAnchor();
            aR.position.set(-2, 0.8, z);
            aR.userData.floatOffset = Math.random() * Math.PI;
            entity.add(aR);
        });


        // 5. ILLUMINAZIONE TRASCENDENTE
        // Un raggio frontale che non è un cono, ma piani di luce paralleli
        const beamGeo = new THREE.PlaneGeometry(1, 20);
        const beam = new THREE.Mesh(beamGeo, this.materials.plasma);
        beam.userData.isPulse = true; 
        beam.rotation.x = -Math.PI/2; // Orizzontale
        beam.position.set(0, 3.5, 12);
        entity.add(beam);
        
        const beam2 = beam.clone();
        beam2.userData.isPulse = true; 
        beam2.rotation.z = Math.PI/2; // Verticale (Croce di luce)
        entity.add(beam2);

        // Point light potentissima al centro
        const singLight = new THREE.PointLight(0xff00ff, 10, 20);
        singLight.position.set(0, 3.5, 2);
        entity.add(singLight);

        // Particle trail dummy location
        entity.userData.chimneyPos = new THREE.Vector3(0, 3.5, -6);

        return entity;
    },

    // ------------------------------------------------------------------------
    // MEMORY FRAGMENT (Wagon)
    // ------------------------------------------------------------------------
    createWagon: function() {
        const group = new THREE.Group();
        
        // Il vagone è un Prisma sospeso che contiene "ricordi"
        // Prisma triangolare lungo
        const prismGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 3);
        prismGeo.rotateZ(Math.PI/2); // Sdraiato
        const prism = new THREE.Mesh(prismGeo, this.materials.tachyonCrystal);
        prism.position.y = 3.5;
        prism.rotation.x = Math.PI; // Punta in giu' o su
        group.add(prism);
        
        // Gabbia di contenimento esterna (Void Matter)
        // Anelli che ruotano attorno al prisma
        for(let z=-3; z<=3; z+=1.5) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.05, 4, 4), this.materials.stringTheory); // Ring quadrato
            ring.position.set(0, 3.5, z);
            ring.rotation.z = Math.PI/4;
            group.add(ring);

            // Connettori energetici al centro
            const spike = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), this.materials.voidMatter);
            spike.position.set(0, 3.5, z);
            group.add(spike);
        }

        // Contenuto del vagone: Nuvola di particelle (Souls/Data)
        // Usiamo PointsMaterial
        const particlesGeo = new THREE.BufferGeometry();
        const pCount = 200;
        const positions = [];
        for(let i=0; i<pCount; i++) {
            const r = Math.random() * 1.0;
            const ang = Math.random() * Math.PI * 2;
            positions.push(Math.cos(ang)*r, Math.sin(ang)*r, (Math.random()-0.5)*7);
        }
        particlesGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const particleMat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.1,
            transparent: true,
            blending: THREE.AdditiveBlending,
            map: this.cache.textures.quantum // Use texture for glitched particles
        });
        
        const particleSystem = new THREE.Points(particlesGeo, particleMat);
        particleSystem.position.y = 3.5;
        // Ruota la nuvola internamente
        particleSystem.userData.localSpin = 0.5;
        group.add(particleSystem);


        // Levitatori laterali (Ali delta inverse)
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0,0); wingShape.lineTo(1, -0.5); wingShape.lineTo(1, 0.5);
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, {depth: 6, bevelEnabled: false});
        
        const wL = new THREE.Mesh(wingGeo, this.materials.voidMatter);
        wL.position.set(1.8, 3.5, -3);
        group.add(wL);
        
        const wR = wL.clone();
        wR.scale.x = -1; // Flip X (potrebbe invertire normali, ma voidMatter è nero...)
        wR.position.set(-1.8, 3.5, -3);
        group.add(wR);

        // Base ancoraggio (Energia pura)
        [3, -3].forEach(z => {
             const anc = this.createTimeAnchor();
             anc.position.set(0, 0.8, z);
             anc.scale.set(1.5, 1, 1.5); // Grande ancora centrale
             group.add(anc);
        });

        return group;
    },

    dispose() {
        // Clean
    }
};