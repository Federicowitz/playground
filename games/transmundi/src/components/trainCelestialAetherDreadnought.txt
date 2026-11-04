// src/components/Assets.js
import * as THREE from 'three';

/**
 * UTILS: Geometria Sacra e Funzioni di Supporto
 * Queste funzioni generano dettagli complessi riutilizzabili per aumentare
 * la densità poligonale e la bellezza del modello.
 */

// Genera un ingranaggio procedurale (Gear)
const createGear = (radius, teeth, material, holeRadius = 0.2) => {
    const shape = new THREE.Shape();
    const outerRadius = radius;
    const innerRadius = radius * 0.8;
    const hole = new THREE.Path();
    
    // Cerchio esterno dentato
    const steps = teeth * 2;
    const angleStep = (Math.PI * 2) / steps;
    
    shape.moveTo(outerRadius, 0);
    for (let i = 1; i <= steps; i++) {
        const angle = i * angleStep;
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    
    // Buco centrale
    hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    return new THREE.Mesh(geometry, material);
};

// Genera un tubo contorto (Spline Pipe) per il flusso di energia
const createEnergyPipe = (points, material, radius = 0.05) => {
    const path = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(path, 64, radius, 8, false);
    return new THREE.Mesh(geometry, material);
};

// Genera un cristallo di energia
const createCrystal = (height, width, material) => {
    const geo = new THREE.ConeGeometry(width, height, 6, 1, false);
    const mesh = new THREE.Mesh(geo, material);
    const bottom = mesh.clone();
    bottom.rotation.x = Math.PI;
    bottom.position.y = -height/2;
    mesh.position.y = height/2;
    
    const group = new THREE.Group();
    group.add(mesh);
    group.add(bottom);
    return group;
};

// -----------------------------------------------------------------------------
// ASSETS PRINCIPALE
// -----------------------------------------------------------------------------

export const Assets = {
    // PALETTE COLORI "DIVINA & ETEREA"
    // Usiamo MeshPhysicalMaterial per effetti avanzati di riflessione e vernice.
    materials: {
        // 1. Il Corpo: Un bianco perla iridescente con riflessi azzurri
        pearlBody: new THREE.MeshPhysicalMaterial({ 
            color: 0xf0f8ff,        // Alice Blue di base
            roughness: 0.2, 
            metalness: 0.1,
            clearcoat: 1.0,         // Vernice lucida
            clearcoatRoughness: 0.1,
            iridescence: 1.0,       // Effetto bolla di sapone
            iridescenceIOR: 1.3,
            sheen: 1.0,
            sheenColor: 0x00ffff    // Riflesso ciano sugli angoli
        }),

        // 2. Metallo Nobile: Oro Rosa Antico
        roseGold: new THREE.MeshStandardMaterial({ 
            color: 0xb76e79, 
            roughness: 0.15, 
            metalness: 1.0,
            emissive: 0x220011,
            emissiveIntensity: 0.2
        }),

        // 3. Struttura: Ossidiana lucida / Void Metal
        voidMetal: new THREE.MeshStandardMaterial({ 
            color: 0x150b20,        // Viola scurissimo quasi nero
            roughness: 0.4, 
            metalness: 0.8 
        }),

        // 4. Meccanica: Cromo Platinato
        platinum: new THREE.MeshStandardMaterial({ 
            color: 0xaaccff, 
            roughness: 0.2, 
            metalness: 0.9 
        }),

        // 5. Energia: Il "Cuore dell'Anima" (Emissivo)
        soulEnergy: new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00aaff, 
            emissiveIntensity: 5,
            transparent: true,
            opacity: 0.9
        }),
        
        // 6. Dettagli caldi: Ambra fusa
        moltenAmber: new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xff4400,
            emissiveIntensity: 2
        }),

        // 7. Vetri sacri
        stainedGlass: new THREE.MeshPhysicalMaterial({
            color: 0xee88ff, // Viola/Rosa trasparente
            roughness: 0.0,
            metalness: 0.1,
            transmission: 0.9, // Vetro fisico
            thickness: 0.5,
            transparent: true
        })
    },

    // -------------------------------------------------------
    // 1. RUOTA DEL DESTINO (Wheel System)
    // Una ruota complessa senza raggi dritti, ma archi gotici
    // -------------------------------------------------------
    createDivineWheel: function(radius) {
        const group = new THREE.Group();

        // Cerchione esterno in Oro Rosa
        const rimGeo = new THREE.TorusGeometry(radius, 0.15, 16, 48);
        const rim = new THREE.Mesh(rimGeo, this.materials.roseGold);
        group.add(rim);
        
        // Cerchione interno (Void Metal)
        const innerRimGeo = new THREE.TorusGeometry(radius * 0.85, 0.08, 16, 32);
        const innerRim = new THREE.Mesh(innerRimGeo, this.materials.voidMetal);
        group.add(innerRim);

        // Battistrada luminoso (Anello di energia tra metallo e terra)
        const treadGeo = new THREE.TorusGeometry(radius + 0.1, 0.02, 8, 32);
        const tread = new THREE.Mesh(treadGeo, this.materials.soulEnergy);
        group.add(tread);

        // Mozzo centrale complesso
        const hubBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16).rotateX(Math.PI/2),
            this.materials.platinum
        );
        
        const hubCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            this.materials.moltenAmber
        );
        hubCap.position.z = 0.25;
        
        const hubGear = createGear(0.45, 8, this.materials.voidMetal);
        hubGear.position.z = -0.1;

        const hubGroup = new THREE.Group();
        hubGroup.add(hubBase, hubCap, hubGear);
        group.add(hubGroup);

        // Raggi Arcuati (Curve Divine)
        // Invece di scatole, usiamo quarti di anello (Torus segments)
        const numSpokes = 6;
        for(let i=0; i<numSpokes; i++) {
            const angle = (i / numSpokes) * Math.PI * 2;
            
            const spokeContainer = new THREE.Group();
            spokeContainer.rotation.z = angle;
            
            // Creiamo una curva a "S" usando Torus parziali o curve
            // Qui usiamo cilindri curvati matematicamente (semplificati come cubi ruotati)
            
            const spoke1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, radius * 0.5, 0.05), this.materials.roseGold);
            spoke1.position.y = radius * 0.35;
            
            const spokeDetail = new THREE.Mesh(new THREE.BoxGeometry(0.05, radius * 0.8, 0.02), this.materials.platinum);
            spokeDetail.position.set(0.08, radius * 0.4, 0.02); // Offset
            
            spokeContainer.add(spoke1);
            spokeContainer.add(spokeDetail);
            
            // Decorazione sulla punta del raggio
            const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), this.materials.soulEnergy);
            jewel.position.y = radius * 0.75;
            spokeContainer.add(jewel);

            group.add(spokeContainer);
        }

        // Contrappeso a forma di Mezzaluna
        const weightGeo = new THREE.RingGeometry(radius * 0.5, radius * 0.7, 16, 1, 0, Math.PI);
        const weight = new THREE.Mesh(weightGeo, this.materials.platinum);
        weight.position.z = 0.1;
        weight.rotation.z = -Math.PI/2;
        group.add(weight);

        // *** IMPORTANTE: Rotazione per allineamento binari ***
        group.rotation.y = Math.PI / 2;

        return group;
    },

    // -------------------------------------------------------
    // 2. MOTORE QUANTICO (Locomotive)
    // -------------------------------------------------------
    createLocomotive: function() {
        const trainGroup = new THREE.Group();

        // ==============================
        // A. TELAIO "VOID WALKER"
        // ==============================
        const chassisGroup = new THREE.Group();
        
        // Blocco principale (trapezoidale simulato con più box)
        const chassisMain = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 14), this.materials.voidMetal);
        chassisGroup.add(chassisMain);
        
        // Piattaforma superiore (Perla)
        const deck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 14.2), this.materials.pearlBody);
        deck.position.y = 0.7;
        chassisGroup.add(deck);

        // Dettagli laterali (tubature idrauliche luminose)
        const pipePathL = [new THREE.Vector3(1.8, 0, 6), new THREE.Vector3(1.8, -0.2, 0), new THREE.Vector3(1.8, 0, -6)];
        const pipeL = createEnergyPipe(pipePathL, this.materials.soulEnergy, 0.08);
        chassisGroup.add(pipeL);

        const pipePathR = [new THREE.Vector3(-1.8, 0, 6), new THREE.Vector3(-1.8, -0.2, 0), new THREE.Vector3(-1.8, 0, -6)];
        const pipeR = createEnergyPipe(pipePathR, this.materials.soulEnergy, 0.08);
        chassisGroup.add(pipeR);

        chassisGroup.position.set(0, 1.6, 1.5);
        trainGroup.add(chassisGroup);

        // ==============================
        // B. ROSTRO FRONTALE "ANGELIC RAM"
        // (Al posto del cowcatcher)
        // ==============================
        const ramGroup = new THREE.Group();
        
        // Punta centrale dorata
        const ramSpike = createCrystal(2.5, 0.8, this.materials.roseGold);
        ramSpike.rotation.x = -Math.PI/2;
        ramGroup.add(ramSpike);

        // Ali laterali (Blade Wings)
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0,0); wingShape.lineTo(1.5, 1); wingShape.lineTo(1.2, -0.5); wingShape.lineTo(0,0);
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, {depth: 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness:0.05});
        
        const wingL = new THREE.Mesh(wingGeo, this.materials.pearlBody);
        wingL.position.set(0.5, 0, 0); wingL.rotation.y = 0.5;
        
        const wingR = new THREE.Mesh(wingGeo, this.materials.pearlBody);
        wingR.position.set(-0.5, 0, 0); wingR.rotation.y = Math.PI - 0.5; // Mirror
        
        ramGroup.add(wingL);
        ramGroup.add(wingR);

        ramGroup.position.set(0, 1.5, 9); // In punta
        trainGroup.add(ramGroup);

        // ==============================
        // C. REATTORE PRINCIPALE (Caldaia)
        // Non è un cilindro, è un reattore a confinamento.
        // ==============================
        const reactorGroup = new THREE.Group();

        // Nucleo di energia (Cilindro interno luminoso)
        const coreGeo = new THREE.CylinderGeometry(1.1, 1.1, 7, 32);
        coreGeo.rotateZ(Math.PI/2);
        const core = new THREE.Mesh(coreGeo, this.materials.soulEnergy);
        reactorGroup.add(core);

        // Gabbia di contenimento (Anelli e barre)
        // Barre longitudinali
        for(let i=0; i<8; i++) {
            const angle = (i/8)*Math.PI*2;
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7.2, 0.2), this.materials.voidMetal);
            bar.rotation.z = Math.PI/2;
            bar.position.set(Math.cos(angle)*1.3, Math.sin(angle)*1.3, 0);
            reactorGroup.add(bar);
        }

        // Anelli trasversali rotanti (statici ma visivamente dinamici)
        [-2, 0, 2].forEach((z, idx) => {
            // Anello esterno grosso
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.15, 16, 64), this.materials.roseGold);
            ring.rotation.y = Math.PI/2;
            ring.position.x = z;
            reactorGroup.add(ring);

            // Ingranaggio decorativo intorno all'anello
            const gearRing = createGear(1.8, 24, this.materials.platinum, 1.6);
            gearRing.rotation.y = Math.PI/2;
            gearRing.position.x = z;
            gearRing.rotation.z = idx * 0.2; // Offset rotazione
            reactorGroup.add(gearRing);
        });

        // Generator Shield (Cupola frontale)
        const frontDome = new THREE.Mesh(new THREE.SphereGeometry(1.45, 32, 32, 0, Math.PI*2, 0, Math.PI/2), this.materials.pearlBody);
        frontDome.rotation.y = Math.PI/2; // Punta in avanti
        frontDome.position.set(3.6, 0, 0);
        reactorGroup.add(frontDome);

        // Gemma frontale
        const frontGem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), this.materials.moltenAmber);
        frontGem.position.set(4.2, 0, 0);
        reactorGroup.add(frontGem);

        // Corrimano Etereo (Tubi di luce fluttuanti)
        const railPath = [
            new THREE.Vector3(3, 1.8, 1.2),
            new THREE.Vector3(0, 2.0, 1.5),
            new THREE.Vector3(-3, 1.8, 1.2)
        ];
        const lightRail = createEnergyPipe(railPath, this.materials.soulEnergy, 0.04);
        reactorGroup.add(lightRail);
        const lightRail2 = lightRail.clone();
        lightRail2.scale.z = -1; // Mirror
        reactorGroup.add(lightRail2);

        // Posizionamento Reattore
        reactorGroup.rotation.y = -Math.PI / 2;
        reactorGroup.position.set(0, 3.4, 1.5);
        trainGroup.add(reactorGroup);

        // ==============================
        // D. CATTEDRALE DI COMANDO (Cabina)
        // Stile Gotico-Futurista
        // ==============================
        const cathedralGroup = new THREE.Group();

        // Base cabina
        const cabBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4, 4), this.materials.pearlBody);
        cabBase.position.y = 2;
        cathedralGroup.add(cabBase);

        // Colonne d'angolo
        [1.7, -1.7].forEach(x => {
            [2, -2].forEach(z => {
                const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4.2, 8), this.materials.roseGold);
                pillar.position.set(x, 2, z);
                cathedralGroup.add(pillar);
            });
        });

        // Finestre Gotiche (Stained Glass)
        const winShape = new THREE.Shape(); // Arco acuto
        winShape.moveTo(-0.6, 0); 
        winShape.lineTo(0.6, 0); 
        winShape.lineTo(0.6, 1.5);
        winShape.quadraticCurveTo(0, 2.5, -0.6, 1.5); // Arco
        
        const winGeo = new THREE.ExtrudeGeometry(winShape, {depth: 0.2, bevelEnabled: false});
        
        // Finestre laterali
        [-1.71, 1.51].forEach((xVal, i) => {
            const winMesh = new THREE.Mesh(winGeo, this.materials.stainedGlass);
            winMesh.rotation.y = i === 0 ? -Math.PI/2 : Math.PI/2;
            winMesh.position.set(i === 0 ? 1.8 : -1.8, 1.5, 0); // Aggiustamento pos
            if(i===0) winMesh.position.x = 1.8; else winMesh.position.x = -1.6; // Fix manuale
            
            // Clona per entrambi i lati
            const wL = winMesh.clone(); wL.position.set(1.75, 1.5, 0.5); wL.rotation.y = Math.PI/2; cathedralGroup.add(wL);
            const wR = winMesh.clone(); wR.position.set(-1.75, 1.5, 0.5); wR.rotation.y = -Math.PI/2; cathedralGroup.add(wR);
        });

        // Tetto: Cupola o Spire? Tetto a mansarda complesso.
        const roofBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 1, 4, 1, false, Math.PI/4), this.materials.voidMetal);
        roofBase.position.y = 4.5;
        cathedralGroup.add(roofBase);
        
        // Guglie sul tetto (Spires)
        [1, -1].forEach(x => {
            const spire = createCrystal(2, 0.3, this.materials.roseGold);
            spire.position.set(x, 5, 1);
            cathedralGroup.add(spire);
            const spire2 = createCrystal(2, 0.3, this.materials.roseGold);
            spire2.position.set(x, 5, -1);
            cathedralGroup.add(spire2);
        });

        // Illuminazione sacra interna
        const holyLight = new THREE.PointLight(0xff00ff, 5, 10);
        holyLight.position.set(0, 3, 0);
        cathedralGroup.add(holyLight);

        cathedralGroup.position.set(0, 2.5, -3.5);
        trainGroup.add(cathedralGroup);

        // ==============================
        // E. SISTEMA DI SCARICO ETEREO (Ciminiera)
        // ==============================
        const stackGroup = new THREE.Group();
        // Base conica
        const stackBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1, 16), this.materials.voidMetal);
        stackGroup.add(stackBase);
        
        // Anelli fluttuanti (Halo rings)
        const halo1 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 32), this.materials.soulEnergy);
        halo1.position.y = 0.8; halo1.rotation.x = Math.PI/6; stackGroup.add(halo1);
        
        const halo2 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 8, 32), this.materials.soulEnergy);
        halo2.position.y = 1.2; halo2.rotation.x = -Math.PI/6; stackGroup.add(halo2);

        // Cristallo emettitore fumo
        const emitter = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), this.materials.moltenAmber);
        emitter.position.y = 0.8;
        // Animazione rudimentale (rotazione random salvata in userData se volessimo animare nel loop principale)
        stackGroup.add(emitter);

        stackGroup.position.set(0, 5.5, 4.8);
        trainGroup.add(stackGroup);


        // ==============================
        // F. PROPULSIONE DIVINA (Ruote & Meccanismi)
        // ==============================
        
        // Scatola Pistoni (Energy Condensers)
        const pistonBox = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1, 2), this.materials.pearlBody);
        pistonBox.position.set(0, 2.5, 5);
        // Dettagli oro
        const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.2, 2.1), this.materials.roseGold);
        pistonBox.add(goldTrim);
        trainGroup.add(pistonBox);

        // RUOTE GIGANTI
        const bigWheelR = 1.4;
        [0.5, 3.8].forEach(z => {
            const wL = this.createDivineWheel(bigWheelR);
            wL.position.set(1.8, bigWheelR, z);
            trainGroup.add(wL);

            const wR = this.createDivineWheel(bigWheelR);
            wR.position.set(-1.8, bigWheelR, z);
            wR.rotation.y = -Math.PI / 2;
            trainGroup.add(wR);
        });

        // RUOTE FRONTALI (Pilota)
        const smallWheelR = 0.8;
        [6.5, 8.2].forEach(z => {
            const wL = this.createDivineWheel(smallWheelR);
            wL.position.set(1.6, smallWheelR, z);
            trainGroup.add(wL);

            const wR = this.createDivineWheel(smallWheelR);
            wR.position.set(-1.6, smallWheelR, z);
            wR.rotation.y = -Math.PI / 2;
            trainGroup.add(wR);
        });

        // BIELLE DI FLUSSO (Floating Rods)
        // Bielle che non toccano, levitano magneticamente
        const rodGeo = new THREE.BoxGeometry(0.2, 5, 0.5); // Lunga
        const rodL = new THREE.Mesh(rodGeo, this.materials.platinum);
        rodL.rotation.x = Math.PI/2;
        rodL.position.set(2.2, 1.4, 2.2);
        // Glow sulle bielle
        const rodGlow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.1, 0.1), this.materials.soulEnergy);
        rodL.add(rodGlow);
        trainGroup.add(rodL);

        const rodR = rodL.clone();
        rodR.position.set(-2.2, 1.4, 2.2);
        trainGroup.add(rodR);

        // LUCI FRONTALI "EYE OF TRUTH"
        const eyeGroup = new THREE.Group();
        // Alloggiamento
        const eyeHouse = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 1, 6), this.materials.goldBody || this.materials.roseGold);
        eyeHouse.rotation.x = Math.PI/2;
        eyeGroup.add(eyeHouse);
        
        // Lente
        const lens = new THREE.Mesh(new THREE.SphereGeometry(0.35), this.materials.soulEnergy);
        lens.position.z = 0.4;
        eyeGroup.add(lens);

        eyeGroup.position.set(0, 5.5, 7.2);
        trainGroup.add(eyeGroup);

        // Spotlight reale
        const spot = new THREE.SpotLight(0x00ffff, 30, 100, 0.4, 0.8, 1);
        spot.position.set(0, 5.5, 7.5);
        spot.target.position.set(0, 0, 50);
        spot.castShadow = true;
        trainGroup.add(spot);
        trainGroup.add(spot.target);

        // Metadata per il sistema particellare del fumo
        trainGroup.userData.chimneyPos = new THREE.Vector3(0, 7, 4.8);
        
        return trainGroup;
    },

    // -------------------------------------------------------
    // 3. IL SANTUARIO ITINERANTE (Wagon)
    // -------------------------------------------------------
    createWagon: function() {
        const group = new THREE.Group();

        // 1. Telaio Sospeso (Magnetic Bogies simulated)
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1, 9), this.materials.voidMetal);
        chassis.position.y = 1.2;
        group.add(chassis);
        
        // Bordature luminose telaio
        const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 9), this.materials.soulEnergy); trimL.position.set(1.75, 1.2, 0); group.add(trimL);
        const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 9), this.materials.soulEnergy); trimR.position.set(-1.75, 1.2, 0); group.add(trimR);

        // 2. Corpo Principale "The Lounge of Spirits"
        const bodyGeo = new THREE.BoxGeometry(3.2, 3.5, 8);
        const body = new THREE.Mesh(bodyGeo, this.materials.pearlBody);
        body.position.y = 3.4;
        group.add(body);

        // 3. Colonne Esterne in Oro
        const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.6, 8);
        for(let z = -3.5; z <= 3.5; z+= 1.75) {
            [1.65, -1.65].forEach(x => {
                const p = new THREE.Mesh(pillarGeo, this.materials.roseGold);
                p.position.set(x, 3.4, z);
                group.add(p);
                
                // Capitelli
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15), this.materials.moltenAmber);
                cap.position.set(x, 5.2, z);
                group.add(cap);
            });
        }

        // 4. Tetto "Cielo Stellato"
        const roofGroup = new THREE.Group();
        
        // Parte curva
        const roofCurved = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 8.2, 16, 1, false, 0, Math.PI), this.materials.voidMetal);
        roofCurved.rotation.z = Math.PI/2;
        roofCurved.rotation.y = Math.PI/2;
        roofCurved.position.y = 5.2;
        roofCurved.scale.y = 0.7; // Schiacciato
        roofGroup.add(roofCurved);

        // Cresta centrale decorata
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 8), this.materials.roseGold);
        crest.position.y = 6.5;
        roofGroup.add(crest);
        
        // Punte sulla cresta
        for(let z = -3.5; z<=3.5; z+=1) {
            const spike = createCrystal(0.8, 0.2, this.materials.soulEnergy);
            spike.position.set(0, 6.7, z);
            roofGroup.add(spike);
        }
        group.add(roofGroup);

        // 5. Finestre a Oblò Olografico
        const windowGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
        windowGeo.rotateZ(Math.PI/2);
        
        for(let z = -2.5; z <= 2.5; z+= 1.8) {
            const wL = new THREE.Mesh(windowGeo, this.materials.stainedGlass);
            wL.position.set(1.6, 3.5, z);
            // Cornice oblò
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 32).rotateY(Math.PI/2), this.materials.roseGold);
            ring.position.set(1.65, 3.5, z);
            group.add(wL); group.add(ring);

            const wR = wL.clone();
            wR.position.set(-1.6, 3.5, z);
            const ringR = ring.clone();
            ringR.position.set(-1.65, 3.5, z);
            group.add(wR); group.add(ringR);
        }

        // 6. Terrazzino Posteriore "Infinity Balcony"
        const railCurve = new THREE.CurvePath();
        // Semplice semicerchio con Torus
        const balconyRail = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 8, 32, Math.PI).rotateZ(Math.PI/2).rotateX(Math.PI/2), this.materials.roseGold);
        balconyRail.position.set(0, 2.5, -4.2);
        group.add(balconyRail);

        // Pavimento terrazzo
        const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32, 1, false, 0, Math.PI), this.materials.voidMetal);
        floor.rotation.y = Math.PI/2;
        floor.position.set(0, 1.7, -4.2);
        group.add(floor);
        
        // Lampada fluttuante sul retro
        const backLamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), this.materials.moltenAmber);
        backLamp.position.set(0, 3.5, -4.2);
        group.add(backLamp);
        const lampLight = new THREE.PointLight(0xffaa00, 2, 4);
        lampLight.position.set(0, 3.5, -4.2);
        group.add(lampLight);


        // 7. Ruote (Carrelli Tripli per stabilità suprema)
        const wheelR = 0.7;
        [2.5, -2.5].forEach(zOffset => {
            // Copertura carrello (Parafango)
            const bogieCover = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 3.5), this.materials.voidMetal);
            bogieCover.position.set(0, 1, zOffset);
            group.add(bogieCover);

            // 3 Assi per carrello
            [-1, 0, 1].forEach(subZ => {
                const finalZ = zOffset + subZ;
                
                const wL = this.createDivineWheel(wheelR);
                wL.position.set(1.2, wheelR, finalZ);
                group.add(wL);

                const wR = this.createDivineWheel(wheelR);
                wR.position.set(-1.2, wheelR, finalZ);
                wR.rotation.y = -Math.PI / 2;
                group.add(wR);
            });
        });

        return group;
    }
};