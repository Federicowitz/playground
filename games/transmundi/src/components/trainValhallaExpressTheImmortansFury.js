// src/components/Assets.js
import * as THREE from 'three';

/**
 * ============================================================================
 * THE WASTELAND FORGE: PROCEDURAL MAD MAX ASSETS
 * ============================================================================
 * Generazione di texture sporche, metalli ossidati e geometrie aggressive.
 * "WITNESS ME!"
 */

const WastelandTextures = {
    canvas: document.createElement('canvas'),
    ctx: null,

    getCtx(size) {
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d');
        return this.ctx;
    },

    // 1. RUGGINE E GRASSO (Diffuse Map)
    generateRustAndGrease() {
        const size = 512;
        const ctx = this.getCtx(size);
        
        // Base marrone scuro
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(0,0,size,size);
        
        // Chiazze di ruggine arancione
        for(let i=0; i<800; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 20 + 5;
            
            const rad = ctx.createRadialGradient(x, y, 0, x, y, r);
            rad.addColorStop(0, 'rgba(190, 60, 10, 0.8)'); // Ruggine viva
            rad.addColorStop(1, 'rgba(190, 60, 10, 0.0)');
            ctx.fillStyle = rad;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        }

        // Colate di olio nero
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 4;
        for(let i=0; i<50; i++) {
            const x = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.bezierCurveTo(x + Math.random()*40, size/2, x - Math.random()*40, size, x, size);
            ctx.stroke();
        }

        // Graffi metallici
        ctx.strokeStyle = 'rgba(200,200,200,0.3)';
        ctx.lineWidth = 1;
        for(let i=0; i<1000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random()-0.5)*50, y + (Math.random()-0.5)*50);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(this.canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    },

    // 2. CHROME SHINY (Environment Map fake)
    generateDirtyChrome() {
        const ctx = this.getCtx(256);
        const grd = ctx.createLinearGradient(0,0,0,256);
        grd.addColorStop(0, '#888888');
        grd.addColorStop(0.5, '#ffffff'); // Orizzonte
        grd.addColorStop(0.51, '#444444'); // Terra
        grd.addColorStop(1, '#222222');
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,256,256);
        
        // Sporco sopra il cromo
        ctx.fillStyle = 'rgba(100, 50, 0, 0.2)';
        for(let i=0; i<100; i++) {
            ctx.fillRect(Math.random()*256, Math.random()*256, Math.random()*20, Math.random()*20);
        }
        return new THREE.CanvasTexture(this.canvas);
    },

    // 3. SIMBOLO DEL TESCHIO (Stencil)
    generateSkullSymbol() {
        const ctx = this.getCtx(256);
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0,0,256,256);
        
        ctx.fillStyle = '#ffffff';
        // Teschio stilizzato Immortan
        ctx.beginPath();
        ctx.arc(128, 100, 60, 0, Math.PI*2); // Cranio
        ctx.rect(90, 150, 76, 60); // Mascella
        ctx.fill();
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(105, 100, 15, 0, Math.PI*2); // Occhio sx
        ctx.arc(151, 100, 15, 0, Math.PI*2); // Occhio dx
        ctx.rect(118, 130, 20, 25); // Naso
        
        // Denti
        for(let i=0; i<4; i++) {
            ctx.rect(95 + i*18, 160, 10, 40);
        }
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
        return new THREE.CanvasTexture(this.canvas);
    }
};


// ============================================================================
// GEOMETRY FACTORY: PROCEDURAL DESTRUCTION
// ============================================================================

export const Assets = {
    cache: {
        textures: {},
        geometries: {}
    },

    materials: {
        // Ruggine: Base del treno
        rustySteel: new THREE.MeshStandardMaterial({ 
            color: 0x8b4513, 
            roughness: 0.9, 
            metalness: 0.3,
            map: null // Generato runtime
        }),
        
        // Cromo: Per dettagli "Witness Me"
        shinyChrome: new THREE.MeshStandardMaterial({ 
            color: 0xaaaaaa, 
            roughness: 0.2, 
            metalness: 1.0,
            emissive: 0x111111
        }),

        // Vernice Nera da Guerra
        warBlack: new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 0.8, 
            metalness: 0.5 
        }),
        
        // Gomma pneumatici/cingoli
        tireRubber: new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 1.0,
            metalness: 0.0
        }),

        // Sangue secco / Vernice rossa
        bloodPaint: new THREE.MeshStandardMaterial({
            color: 0x660000,
            roughness: 0.6
        }),

        // Emissive Fire
        engineFire: new THREE.MeshBasicMaterial({
            color: 0xff5500
        }),
        
        skullDecal: new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            alphaTest: 0.5
        })
    },

    initResources() {
        if (!this.cache.textures.rust) {
            this.cache.textures.rust = WastelandTextures.generateRustAndGrease();
            this.materials.rustySteel.map = this.cache.textures.rust;
            this.materials.rustySteel.bumpMap = this.cache.textures.rust; // Self bump
            this.materials.rustySteel.bumpScale = 0.05;
        }
        if (!this.cache.textures.chrome) {
            this.cache.textures.chrome = WastelandTextures.generateDirtyChrome();
            this.materials.shinyChrome.envMap = null; // Useremo un fake reflection se servisse, per ora roughness basta
        }
        if (!this.cache.textures.skull) {
            this.cache.textures.skull = WastelandTextures.generateSkullSymbol();
            this.materials.skullDecal.map = this.cache.textures.skull;
            this.materials.skullDecal.alphaMap = this.cache.textures.skull;
        }

        // Geometry Pools per Instancing
        // Spuntone (Spike)
        const spikeGeo = new THREE.ConeGeometry(0.1, 1.2, 8);
        spikeGeo.translate(0, 0.6, 0); // Pivot base
        this.cache.geometries.spike = spikeGeo;
        
        // Piastra Bullonata (Armor Plate)
        this.cache.geometries.plate = new THREE.BoxGeometry(1, 1, 0.1);
    },

    // --- Helpers Geometrici ---

    /**
     * Genera una ruota dentata stile "Mad Max" (lama di sega o cingolo)
     */
    createSawWheel(radius, teeth) {
        const shape = new THREE.Shape();
        const outerR = radius;
        const innerR = radius * 0.7;
        
        const steps = teeth * 2;
        const stepAngle = (Math.PI * 2) / steps;
        
        shape.moveTo(outerR, 0);
        for(let i=1; i<=steps; i++) {
            // Dente a sega (inclinato)
            const r = (i % 2 === 0) ? outerR : innerR;
            // Modifica angolo per rendere il dente aggressivo (inclinato in avanti)
            const angleBias = (i % 2 !== 0) ? 0.1 : 0; 
            const a = i * stepAngle + angleBias;
            shape.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }

        // Foro centrale esagonale
        const hole = new THREE.Path();
        const holeR = radius * 0.2;
        for(let i=0; i<6; i++) {
            const a = (i/6)*Math.PI*2;
            if(i===0) hole.moveTo(Math.cos(a)*holeR, Math.sin(a)*holeR);
            else hole.lineTo(Math.cos(a)*holeR, Math.sin(a)*holeR);
        }
        shape.holes.push(hole);

        const geo = new THREE.ExtrudeGeometry(shape, {depth: 0.3, bevelEnabled: false});
        return new THREE.Mesh(geo, this.materials.rustySteel);
    },

    /**
     * Crea uno scarico marmitta verticale (Zoomies)
     */
    createExhaustPipe() {
        // Tubo curvato in alto e all'esterno
        const path = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.5, 1, 0),
            new THREE.Vector3(1.5, 3, 0)
        ]);
        const tube = new THREE.Mesh(
            new THREE.TubeGeometry(path, 8, 0.2, 8, false),
            this.materials.shinyChrome
        );
        return tube;
    },

    /**
     * Piazza spuntoni casuali su una superficie
     */
    addSpikesToSurface(targetGroup, count, bounds) {
        const mesh = new THREE.InstancedMesh(this.cache.geometries.spike, this.materials.shinyChrome, count);
        const dummy = new THREE.Object3D();
        
        for(let i=0; i<count; i++) {
            // Distribuzione casuale nei bound
            const x = (Math.random()-0.5) * bounds.x;
            const y = (Math.random()-0.5) * bounds.y;
            const z = (Math.random()-0.5) * bounds.z;

            dummy.position.set(x, y, z);
            
            // Punta verso l'esterno (approssimativo, dal centro)
            const dir = new THREE.Vector3(x, y, z).normalize();
            const target = new THREE.Vector3(x,y,z).add(dir);
            dummy.lookAt(target);
            dummy.rotateX(Math.PI/2); // Correggi orientamento cono

            // Random scale
            const s = 0.5 + Math.random();
            dummy.scale.set(s, s, s);
            
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        targetGroup.add(mesh);
    },


    // ============================================================================
    // LOCOMOTIVE BUILDER: "THE WAR RIG LOCO"
    // ============================================================================
    
    createLocomotive: function() {
        this.initResources();
        const group = new THREE.Group();

        // --- 1. TELAIO MASSICCIO E SPORCO ---
        const chassisGeo = new THREE.BoxGeometry(4, 1.5, 14);
        const chassis = new THREE.Mesh(chassisGeo, this.materials.warBlack);
        chassis.position.set(0, 1.5, 2);
        group.add(chassis);
        
        // --- 2. LO SPALANEVE "THE MAW" (ARIETE FRONTALE) ---
        // Un enorme cuneo fatto di piastre saldate
        const plowGroup = new THREE.Group();
        
        // Forma principale cuneo
        const wedgeShape = new THREE.Shape();
        wedgeShape.moveTo(-2.5, 0);
        wedgeShape.lineTo(2.5, 0);
        wedgeShape.lineTo(0, 3); // Punta alta
        const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, {depth: 2, bevelEnabled: false});
        const plow = new THREE.Mesh(wedgeGeo, this.materials.rustySteel);
        plow.rotation.x = -Math.PI/2; // Sdraiato
        plow.position.z = 2;
        plow.scale.set(1, 1.5, 1);
        plowGroup.add(plow);

        // Grata frontale "Teeth"
        for(let i=-3; i<=3; i+=1.5) {
            const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2, 4), this.materials.shinyChrome);
            tooth.rotation.x = Math.PI/2;
            tooth.position.set(i*0.6, 0.5, 4.5);
            plowGroup.add(tooth);
        }

        plowGroup.position.set(0, 1.0, 9);
        group.add(plowGroup);

        // --- 3. CALDAIA "ARMOR CLAD" ---
        // Non un cilindro liscio, ma pieno di piastre saldate sopra
        const boilerGroup = new THREE.Group();
        const boilerCore = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 8, 16).rotateX(Math.PI/2), this.materials.rustySteel);
        boilerGroup.add(boilerCore);

        // Aggiungiamo piastre di armatura irregolari (Instanced)
        const platesCount = 40;
        const plateInst = new THREE.InstancedMesh(this.cache.geometries.plate, this.materials.warBlack, platesCount);
        const dummy = new THREE.Object3D();
        for(let i=0; i<platesCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const z = (Math.random() - 0.5) * 7;
            const r = 1.85; // Appena sopra la superficie

            dummy.position.set(Math.cos(angle)*r, Math.sin(angle)*r, z);
            dummy.lookAt(0, 0, z); // Guarda il centro (normale invertita?)
            dummy.rotateY(Math.PI); // Gira fuori
            
            // Randomize
            dummy.scale.set(1 + Math.random(), 1 + Math.random(), 0.5);
            dummy.rotation.z += (Math.random()-0.5); 
            
            dummy.updateMatrix();
            plateInst.setMatrixAt(i, dummy.matrix);
        }
        boilerGroup.add(plateInst);

        // MOTORE V8 A VISTA SOPRA LA CALDAIA (SUPERCHARGER)
        const engineBlock = new THREE.Group();
        const blockMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3), this.materials.shinyChrome);
        blockMesh.position.y = 2;
        engineBlock.add(blockMesh);

        // Presa d'aria (Bugcatcher intake)
        const intakePoints = [
             new THREE.Vector2(0, 0), new THREE.Vector2(0.8, 0), new THREE.Vector2(0.8, 0.5),
             new THREE.Vector2(0.6, 1), new THREE.Vector2(0, 1)
        ]; // Mezzo profilo
        const intakeShape = new THREE.LatheGeometry(intakePoints, 16, 0, Math.PI); // Semicerchio
        const intake = new THREE.Mesh(intakeShape, this.materials.shinyChrome);
        intake.rotation.x = -Math.PI/2; // Verso fronte
        intake.rotation.z = -Math.PI/2;
        intake.position.set(0, 2.8, 1);
        intake.scale.set(1.5, 1.5, 2);
        engineBlock.add(intake);

        // Farfalle aspirazione (Red flaps)
        const flap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16), this.materials.bloodPaint);
        flap.rotation.x = Math.PI/2; flap.rotation.z = Math.PI/2;
        flap.position.set(0, 2.8, 1.5);
        // Animazione flap
        flap.userData.flap = true; 
        engineBlock.add(flap);

        // Scarichi laterali (Zoomies) che sputano fuoco
        for(let side=-1; side<=1; side+=2) {
            if(side===0) continue;
            for(let k=0; k<4; k++) {
                const pipe = this.createExhaustPipe();
                pipe.position.set(side * 0.8, 2.0, -1 + k * 0.8);
                // Orienta fuori
                pipe.rotation.y = side * Math.PI / 2; 
                pipe.rotation.z = side * 0.5; // Angolati su
                engineBlock.add(pipe);

                // Fuoco statico (diventerà dinamico se vuoi)
                const flame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.8), this.materials.engineFire);
                flame.position.set(side * 2, 3.5, 0); // Approx fine tubo
                pipe.add(flame);
            }
        }
        boilerGroup.add(engineBlock);

        // TESCHIO FRONTALE CALDAIA
        const skullPlate = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), this.materials.warBlack);
        skullPlate.position.set(0, 0, 4.1);
        boilerGroup.add(skullPlate);
        // Decalcomania Teschio
        const skullDecal = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), this.materials.skullDecal);
        skullDecal.position.set(0, 0, 4.2);
        boilerGroup.add(skullDecal);
        
        boilerGroup.position.set(0, 3.5, 2);
        group.add(boilerGroup);


        // --- 4. CABINA DI GUIDA (WAR BUNKER) ---
        const cabGroup = new THREE.Group();
        
        // Bunker squadrato e basso
        const bunkerGeo = new THREE.BoxGeometry(4, 2.5, 4);
        const bunker = new THREE.Mesh(bunkerGeo, this.materials.rustySteel);
        bunker.position.y = 1.25;
        cabGroup.add(bunker);

        // Finestre a fessura (Slits)
        const slitGeo = new THREE.BoxGeometry(3.8, 0.4, 4.1);
        const slits = new THREE.Mesh(slitGeo, new THREE.MeshBasicMaterial({color:0x000000}));
        slits.position.y = 1.8;
        cabGroup.add(slits); // Semplice sovrapposizione nera per simulare buco

        // Tetto con altoparlanti (Doof wagon style)
        const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 4.2), this.materials.warBlack);
        roof.position.y = 2.6;
        cabGroup.add(roof);

        // Stack di altoparlanti posteriori
        const speakerGeo = new THREE.CylinderGeometry(0.6, 0.2, 0.5, 16);
        speakerGeo.rotateX(Math.PI/2);
        for(let x=-1.5; x<=1.5; x+=1.5) {
            for(let y=0; y<3; y++) {
                const spk = new THREE.Mesh(speakerGeo, this.materials.warBlack);
                spk.position.set(x, 3.5 + y*0.8, -1.5);
                cabGroup.add(spk);
                // Cono interno cromato
                const spkIn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.1), this.materials.shinyChrome);
                spkIn.rotation.x = Math.PI/2;
                spkIn.position.set(x, 3.5 + y*0.8, -1.2);
                cabGroup.add(spkIn);
            }
        }

        cabGroup.position.set(0, 3, -4);
        group.add(cabGroup);


        // --- 5. RUOTE (SAW BLADES) ---
        const bigWheelR = 1.6;
        [0, 4].forEach(z => {
            const wL = this.createSawWheel(bigWheelR, 24); 
            wL.position.set(2.2, bigWheelR, z); 
            wL.rotation.y = Math.PI/2; 
            group.add(wL);

            const wR = this.createSawWheel(bigWheelR, 24); 
            wR.position.set(-2.2, bigWheelR, z); 
            wR.rotation.y = -Math.PI/2; // Faccia esterna corretta
            group.add(wR);

            // Spuntoni sui mozzi (Hub spikes)
            const spike = new THREE.Mesh(this.cache.geometries.spike, this.materials.shinyChrome);
            spike.scale.set(2, 2, 2);
            spike.rotation.x = Math.PI/2; // Fuori
            
            const sL = spike.clone(); sL.position.copy(wL.position); sL.position.x += 0.2;
            group.add(sL);
            const sR = spike.clone(); sR.position.copy(wR.position); sR.position.x -= 0.2; sR.rotation.x = -Math.PI/2;
            group.add(sR);
        });
        
        // Ruote anteriori cingolate (Fake tracks)
        const trackGroup = new THREE.Group();
        // Creiamo una forma triangolare di ruote
        const tPos = [[0,0], [1.5,0], [0.75, 0.8]];
        tPos.forEach(p => {
            const w = this.createSawWheel(0.6, 12);
            w.position.set(0, p[1], p[0]);
            trackGroup.add(w);
        });
        // Mesh del cingolo avvolgente (semplificata)
        const trackBelt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 2.5), this.materials.tireRubber);
        trackBelt.position.set(0, 0.4, 0.75);
        trackBelt.rotation.x = Math.PI/6; // Inclinata
        trackBelt.visible = false; // Placeholder se volessimo geometry complessa
        
        const trackL = trackGroup.clone(); trackL.position.set(2, 0.6, 8); trackL.rotation.y = Math.PI/2;
        group.add(trackL);
        
        const trackR = trackGroup.clone(); trackR.position.set(-2, 0.6, 8); trackR.rotation.y = -Math.PI/2;
        group.add(trackR);


        // --- 6. ARMI E DETTAGLI FINALI ---
        // Arpioni laterali
        const harpoon = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3), this.materials.rustySteel);
        harpoon.rotation.z = Math.PI/4;
        harpoon.position.set(2.5, 4, 5);
        group.add(harpoon);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6), this.materials.shinyChrome);
        tip.position.y = 1.5; tip.userData.kill = true;
        harpoon.add(tip);

        const harpoon2 = harpoon.clone();
        harpoon2.rotation.z = -Math.PI/4;
        harpoon2.position.set(-2.5, 4, 5);
        group.add(harpoon2);

        // Metadata fumo
        group.userData.chimneyPos = new THREE.Vector3(0, 6, 2); 
        // Non una ciminiera, ma i tubi. Mettiamo fumo centrale generale.

        return group;
    },


    // ============================================================================
    // WAGON: "THE GUZZOLINE TANKER"
    // ============================================================================
    
    createWagon: function() {
        const group = new THREE.Group();

        // 1. Telaio
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1, 10), this.materials.warBlack);
        chassis.position.y = 1.5;
        group.add(chassis);

        // 2. Cisterna Carburante (Cilindro orizzontale allungato)
        const tankGeo = new THREE.CylinderGeometry(1.6, 1.6, 9, 32);
        tankGeo.rotateX(Math.PI/2); // Lungo Z
        const tank = new THREE.Mesh(tankGeo, this.materials.shinyChrome); // "Shiny and Chrome"
        tank.position.y = 3.5;
        group.add(tank);
        
        // Fasce di rinforzo arrugginite
        for(let z=-4; z<=4; z+=2) {
            const band = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.1, 8, 32), this.materials.rustySteel);
            band.position.set(0, 3.5, z);
            group.add(band);
        }

        // 3. Torretta Difensiva sul retro
        const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.5), this.materials.warBlack);
        turretBase.position.set(0, 5.5, -3);
        group.add(turretBase);
        
        // Nido di spuntoni attorno alla torretta
        const spikeNest = new THREE.Group();
        this.addSpikesToSurface(spikeNest, 30, new THREE.Vector3(2, 0.5, 2));
        spikeNest.position.set(0, 5.8, -3);
        group.add(spikeNest);

        // Lanciafiamme posteriore
        const flameThrower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2).rotateX(Math.PI/2), this.materials.rustySteel);
        flameThrower.position.set(0, 6.5, -3);
        group.add(flameThrower);


        // 4. Tamburi da guerra (War Drums) sul fronte vagone
        // (Simulati con cilindri e pelle)
        const drumGeo = new THREE.CylinderGeometry(0.6, 0.5, 0.8, 16);
        const skinMat = new THREE.MeshStandardMaterial({color: 0xccaa88, roughness: 1});
        
        [1.5, -1.5].forEach(x => {
            const drum = new THREE.Mesh(drumGeo, this.materials.rustySteel);
            drum.position.set(x, 4, 3);
            drum.rotation.x = 0.2; // Inclinati
            
            const skin = new THREE.Mesh(new THREE.CircleGeometry(0.6), skinMat);
            skin.rotation.x = -Math.PI/2;
            skin.position.y = 0.41;
            drum.add(skin);
            group.add(drum);
        });

        // 5. Ruote (6 per lato, piccole)
        const wR = 0.8;
        for(let z=-4; z<=4; z+=1.6) {
            const wL = this.createSawWheel(wR, 16); 
            wL.position.set(1.8, wR, z); wL.rotation.y = Math.PI/2;
            group.add(wL);

            const wR_m = this.createSawWheel(wR, 16); 
            wR_m.position.set(-1.8, wR, z); wR_m.rotation.y = -Math.PI/2;
            group.add(wR_m);
        }

        // Piattaforma camminabile sopra cisterna (grata)
        const walkway = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 8), this.materials.rustySteel);
        walkway.position.set(0, 5.2, 1);
        group.add(walkway);

        return group;
    },

    dispose() {
        // Cleanup memoria
        Object.values(this.cache.geometries).forEach(g => g.dispose());
        Object.values(this.materials).forEach(m => m.dispose && m.dispose());
        Object.values(this.cache.textures).forEach(t => t && t.dispose());
    }
};