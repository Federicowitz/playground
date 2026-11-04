// src/components/Assets.js
import * as THREE from 'three';

/**
 * ============================================================================
 * QUANTUM FABRICATOR: TEXTURES & SHADERS
 * ============================================================================
 * Generazione procedurale di materiali ad alta tecnologia.
 */

const TextureSynthesizer = {
    canvas: document.createElement('canvas'),
    ctx: null,

    init(size = 512) {
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d');
        return this.ctx;
    },

    // 1. GRID ESAGONALE (Energy Shields)
    generateHexGrid() {
        const ctx = this.init(512);
        const size = 512;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Disegna esagoni
        const hexRadius = 30;
        const hexHeight = Math.sqrt(3) * hexRadius;
        const w = 2 * hexRadius;
        const h = hexHeight;
        
        for (let y = -1; y < size / h + 1; y++) {
            for (let x = -1; x < size / w * 1.5 + 1; x++) {
                const cx = x * w * 1.5;
                const cy = y * h + (x % 2) * (h / 2);
                
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = 2 * Math.PI / 6 * i;
                    const x_i = cx + hexRadius * Math.cos(angle);
                    const y_i = cy + hexRadius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x_i, y_i);
                    else ctx.lineTo(x_i, y_i);
                }
                ctx.closePath();
                ctx.stroke();
                
                // Glow interno random
                if(Math.random() > 0.8) {
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                    ctx.fill();
                }
            }
        }
        
        const tex = new THREE.CanvasTexture(this.canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        return tex;
    },

    // 2. CIRCUITRY (Scafo Hi-Tech)
    generateTechPanel() {
        const ctx = this.init(512);
        ctx.fillStyle = '#1a1a1a'; // Base grigio scuro
        ctx.fillRect(0, 0, 512, 512);
        
        // Linee di pannellatura
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        
        for(let i=0; i<20; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const w = Math.random() * 100 + 50;
            const h = Math.random() * 100 + 50;
            ctx.strokeRect(x, y, w, h);
            
            // Dettagli interni (piccoli led)
            if(Math.random() > 0.5) {
                ctx.fillStyle = Math.random()>0.5 ? '#00ccff' : '#ff3300';
                ctx.fillRect(x+5, y+5, 4, 4);
            }
        }
        return new THREE.CanvasTexture(this.canvas);
    },

    // 3. GRADIENTE FOTONICO
    generatePhotonCore() {
        const ctx = this.init(64);
        const grd = ctx.createRadialGradient(32,32,0, 32,32,32);
        grd.addColorStop(0, '#ffffff'); // Core bianco
        grd.addColorStop(0.4, '#00ffff'); // Mid Blu
        grd.addColorStop(1, '#000033'); // Fade scuro
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,64,64);
        return new THREE.CanvasTexture(this.canvas);
    }
};

export const Assets = {
    cache: {
        tex: {},
        geo: {}
    },

    materials: {
        // Scafo in Nanocarbonio Bianco
        hullWhite: new THREE.MeshPhysicalMaterial({
            color: 0xeeeeff,
            roughness: 0.2,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            reflectivity: 1.0
        }),

        // Parti Meccaniche Scure
        hullDark: new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.4,
            metalness: 0.8,
            map: null // Assegnato runtime
        }),

        // Motori Fotonici (Emissive super bright)
        photonDrive: new THREE.MeshBasicMaterial({
            color: 0x00ffff,
        }),
        
        // Scia di plasma (Trasparente + Glow)
        plasmaTrail: new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        }),

        // Vetro Cockpit (Physical Transmission)
        starGlass: new THREE.MeshPhysicalMaterial({
            color: 0x000022,
            metalness: 0.9,
            roughness: 0.0,
            transmission: 0.9, // Trasparente come vetro
            thickness: 0.5,
            transparent: true,
            opacity: 1.0
        }),
        
        // Scudo Energetico (Wireframe effect)
        energyShield: new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            map: null, // Hex grid
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    },

    initResources() {
        if(!this.cache.tex.hex) {
            this.cache.tex.hex = TextureSynthesizer.generateHexGrid();
            this.materials.energyShield.map = this.cache.tex.hex;
        }
        if(!this.cache.tex.panel) {
            this.cache.tex.panel = TextureSynthesizer.generateTechPanel();
            this.materials.hullDark.map = this.cache.tex.panel;
        }
    },

    // ------------------------------------------------------------------------
    // GEOMETRY BUILDERS: AERODYNAMICS & LIGHT
    // ------------------------------------------------------------------------

    /**
     * Genera un motore anulare (stile Dyson fan)
     */
    createThruster(radius) {
        const group = new THREE.Group();
        
        // Anello esterno
        const housing = new THREE.Mesh(new THREE.TorusGeometry(radius, radius*0.2, 16, 48), this.materials.hullWhite);
        housing.scale.set(1, 1, 2); // Allungato
        group.add(housing);
        
        // Interno incandescente
        const core = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.7, radius*0.5, radius*3, 32, 1, true), this.materials.energyShield);
        core.rotation.x = Math.PI/2;
        group.add(core);
        
        // Particelle/Anelli di spinta (Shock diamonds)
        for(let i=0; i<5; i++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(radius*(0.6 - i*0.05), 0.05, 8, 32), this.materials.photonDrive);
            ring.position.z = radius + i * 0.8;
            ring.scale.z = 0.1; // Piatto
            group.add(ring);
        }
        
        // Luce interna
        const light = new THREE.PointLight(0x00ffff, 2, 10);
        group.add(light);

        return group;
    },

    /**
     * Sostituisce le ruote: Cuscinetti a Levitazione Magnetica
     */
    createGravLevitationPad(length) {
        const group = new THREE.Group();
        
        // Piastra magnetica
        const padGeo = new THREE.BoxGeometry(1, 0.5, length);
        // Chamfer box (smussato) è complesso, usiamo cilindro schiacciato + box
        const pad = new THREE.Mesh(padGeo, this.materials.hullDark);
        group.add(pad);
        
        // Emettitori blu sotto
        const emitterGeo = new THREE.PlaneGeometry(0.8, length * 0.9);
        const emitter = new THREE.Mesh(emitterGeo, this.materials.photonDrive);
        emitter.rotation.x = Math.PI/2;
        emitter.position.y = -0.26; // Appena sotto
        group.add(emitter);

        // Effetto ripple/glow sotto il pad (fake shadow)
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, length + 1), this.materials.plasmaTrail);
        glow.rotation.x = -Math.PI/2;
        glow.position.y = -0.8; // Distante dal pad (sul binario virtuale)
        glow.material = glow.material.clone(); 
        glow.material.opacity = 0.2;
        group.add(glow);

        return group;
    },


    // ------------------------------------------------------------------------
    // STARSHIP LOCOMOTIVE: "THE HORIZON"
    // ------------------------------------------------------------------------

    createLocomotive: function() {
        this.initResources();
        const ship = new THREE.Group();

        // --- 1. FUSOLIERA PRINCIPALE (AERODINAMICA PURA) ---
        // Usiamo LatheGeometry per una forma a goccia perfetta allungata
        const points = [];
        // Disegniamo il profilo laterale (Punta -> Coda)
        // Y è il raggio, X è la lunghezza (ma in Lathe Y è asse rotazione, X è raggio)
        // ThreeJS Lathe ruota attorno a Y.
        for (let i = 0; i <= 20; i++) {
            const t = i / 20; 
            // Forma a proiettile complesso
            const x = Math.sin(t * Math.PI) * 1.8; // Spessore (gobba centrale)
            const y = (t - 0.5) * 16; // Lunghezza (da -8 a +8)
            
            // Flatten bottom: Riduciamo X se siamo nella metà "sotto" ? No, Lathe è simmetrico radiale.
            // Usiamo scaling dopo.
            points.push(new THREE.Vector2(x, y));
        }
        
        const fuselageGeo = new THREE.LatheGeometry(points, 32);
        const fuselage = new THREE.Mesh(fuselageGeo, this.materials.hullWhite);
        fuselage.rotation.x = Math.PI/2; // Orienta lungo Z
        fuselage.scale.set(1, 0.7, 1); // Appiattisci per renderlo un veicolo, non un missile tondo
        fuselage.position.y = 2.5;
        ship.add(fuselage);

        // Dettaglio: Tagli laterali luminosi (Tron Lines)
        // Creiamo tubi che corrono lungo la fusoliera
        const linePath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(1.6, 2.5, 7),
            new THREE.Vector3(2.0, 2.5, 0),
            new THREE.Vector3(1.2, 2.5, -7)
        ]);
        const lineGeo = new THREE.TubeGeometry(linePath, 64, 0.05, 8, false);
        const lineL = new THREE.Mesh(lineGeo, this.materials.photonDrive);
        ship.add(lineL);
        const lineR = lineL.clone();
        lineR.scale.x = -1;
        ship.add(lineR);


        // --- 2. CABINA DI PILOTAGGIO (Cockpit Bubble) ---
        const cockpitGroup = new THREE.Group();
        // Forma ovoidale
        const bubbleGeo = new THREE.SphereGeometry(1.4, 32, 32);
        bubbleGeo.scale(0.8, 0.5, 1.5);
        const cockpit = new THREE.Mesh(bubbleGeo, this.materials.starGlass);
        cockpit.position.set(0, 3.8, 2);
        cockpitGroup.add(cockpit);
        
        // Sedile pilota interno (appena visibile)
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 1), this.materials.hullDark);
        seat.position.set(0, 3.2, 2);
        cockpitGroup.add(seat);
        
        // HUD Olografici (Piani trasparenti fluttuanti)
        const hudGeo = new THREE.PlaneGeometry(0.5, 0.3);
        const hudL = new THREE.Mesh(hudGeo, this.materials.energyShield);
        hudL.position.set(0.4, 3.8, 3.0); hudL.rotation.set(0, -0.5, 0);
        cockpitGroup.add(hudL);
        
        ship.add(cockpitGroup);


        // --- 3. MOTORI A IMPULSO (Nacelles) ---
        // Due grandi motori staccati dal corpo, collegati magneticamente o con ali sottili
        const engineL = this.createThruster(0.8);
        engineL.position.set(2.5, 2.5, -6); // Retro e lato
        ship.add(engineL);

        const engineR = this.createThruster(0.8);
        engineR.position.set(-2.5, 2.5, -6);
        ship.add(engineR);

        // Ali di raccordo (Pylons) - curve
        const pylonShape = new THREE.Shape();
        pylonShape.moveTo(0,0); pylonShape.quadraticCurveTo(1, 0.5, 2, 0);
        const pylonGeo = new THREE.ExtrudeGeometry(pylonShape, {depth: 2, bevelEnabled:false});
        
        const pL = new THREE.Mesh(pylonGeo, this.materials.hullWhite);
        pL.position.set(0.8, 2.5, -5);
        pL.scale.set(1, 0.2, 1); // Sottili
        ship.add(pL);
        
        const pR = new THREE.Mesh(pylonGeo, this.materials.hullWhite);
        pR.position.set(-0.8, 2.5, -5); // Specchio
        pR.scale.set(-1, 0.2, 1); 
        ship.add(pR);

        // Motore Centrale (Main Drive) integrato in coda
        const mainExhaust = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1, 32, 1, true), this.materials.hullDark);
        mainExhaust.rotation.x = -Math.PI/2; // Punta indietro
        mainExhaust.position.set(0, 2.5, -8);
        ship.add(mainExhaust);
        
        const mainGlow = new THREE.Mesh(new THREE.SphereGeometry(0.8), this.materials.photonDrive);
        mainGlow.position.set(0, 2.5, -8.2);
        mainGlow.scale.z = 2; // Allungato
        ship.add(mainGlow);


        // --- 4. SISTEMA MAG-LEV (Sotto scafo) ---
        // Sostituzione ruote con pad gravitazionali
        const padPositions = [4, 0, -4];
        padPositions.forEach(z => {
            // Pad Sinistro
            const padL = this.createGravLevitationPad(2);
            padL.position.set(2.0, 0.8, z);
            ship.add(padL);
            
            // Pad Destro
            const padR = this.createGravLevitationPad(2);
            padR.position.set(-2.0, 0.8, z);
            ship.add(padR);
            
            // Connessione meccanica allo scafo (braccetto idraulico tech)
            const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5), this.materials.hullDark);
            armL.rotation.z = Math.PI/4; // Inclinato
            armL.position.set(1.2, 1.6, z);
            ship.add(armL);
            
            const armR = armL.clone();
            armR.rotation.z = -Math.PI/4;
            armR.position.set(-1.2, 1.6, z);
            ship.add(armR);
        });


        // --- 5. SENSOR ARRAY (Muso) ---
        // Antenna/Sensore frontale
        const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 4), this.materials.hullDark);
        needle.rotation.x = -Math.PI/2;
        needle.position.set(0, 2.5, 9);
        ship.add(needle);
        
        // Emettitore sulla punta
        const tip = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1), this.materials.photonDrive);
        tip.position.set(0, 2.5, 11);
        ship.add(tip);
        
        // SpotLight "Fari" laser
        const laserLight = new THREE.SpotLight(0x00ffff, 10, 80, 0.3, 0.5);
        laserLight.position.set(0, 2.5, 8);
        laserLight.target.position.set(0, 2.5, 50);
        ship.add(laserLight);
        ship.add(laserLight.target);


        // --- 6. SCUDI DEFLETTORI (Mesh esterna) ---
        // Un guscio leggermente più grande trasparente con esagoni
        const shieldGeo = fuselageGeo.clone();
        const shield = new THREE.Mesh(shieldGeo, this.materials.energyShield);
        shield.rotation.x = Math.PI/2;
        shield.scale.set(1.1, 0.8, 1.05); // Appena più grande
        shield.position.y = 2.5;
        
        // Animazione rotazione texture (da gestire in update ma salviamo ref)
        shield.userData.isShield = true; 
        ship.add(shield);

        ship.userData.chimneyPos = new THREE.Vector3(0, 2.5, -8); // Per particelle motore
        
        return ship;
    },


    // ------------------------------------------------------------------------
    // STARSHIP CARGO: "STASIS MODULE"
    // ------------------------------------------------------------------------
    
    createWagon: function() {
        const group = new THREE.Group();

        // --- 1. TELAIO FLUTTUANTE ---
        // Barra centrale energetica invece che telaio solido
        const spineGeo = new THREE.BoxGeometry(1, 0.5, 10);
        const spine = new THREE.Mesh(spineGeo, this.materials.hullDark);
        spine.position.y = 1.2;
        group.add(spine);
        
        // Nucleo energetico spina dorsale
        const energySpine = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 10.1), this.materials.photonDrive);
        energySpine.position.y = 1.2;
        group.add(energySpine);

        // --- 2. CAPSULA DI CARICO (CILINDRO SOSPESO) ---
        const podGroup = new THREE.Group();
        
        // Guscio esterno bianco
        // Cilindro con bordi arrotondati (CapsuleGeometry o Lathe)
        const capGeo = new THREE.CapsuleGeometry(1.8, 6, 8, 16);
        capGeo.rotateX(Math.PI/2);
        const pod = new THREE.Mesh(capGeo, this.materials.hullWhite);
        podGroup.add(pod);

        // Finestre laterali lunghe (Boolean o semplici mesh nere sovrapposte)
        // Simuliamo vetrate nere
        const windowGeo = new THREE.CylinderGeometry(1.81, 1.81, 5, 32, 1, true, 0, Math.PI/3);
        windowGeo.rotateZ(Math.PI/2); // Sdraiato
        
        const wL = new THREE.Mesh(windowGeo, this.materials.starGlass);
        wL.position.y = 0.5;
        wL.rotation.y = Math.PI/2; // Lato
        podGroup.add(wL);
        
        const wR = wL.clone();
        wR.rotation.y = -Math.PI/2;
        podGroup.add(wR);

        // Interno visibile (Cryo Chambers?)
        // Creiamo alcune colonne luminose dentro
        for(let z=-2; z<=2; z+=1.5) {
            const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16), this.materials.energyShield);
            chamber.position.set(0, 0, z);
            chamber.rotation.x = Math.PI/2; // Verticali? No, lungo Z
            // Anzi facciamoli verticali nel pod
            chamber.rotation.x = 0;
            podGroup.add(chamber);
        }

        // Anelli di contenimento gravitazionale
        [3, -3].forEach(z => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.15, 16, 48), this.materials.hullDark);
            ring.position.z = z;
            // Dettagli luci rosse sugli anelli
            const dot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 0.2), this.materials.photonDrive);
            dot.position.z = z;
            podGroup.add(dot); // Vertical stripe light
            podGroup.add(ring);
        });

        podGroup.position.y = 3.5;
        group.add(podGroup);

        // --- 3. LEVITATION PADS ---
        [2.5, -2.5].forEach(z => {
            const padL = this.createGravLevitationPad(2); padL.position.set(2, 0.8, z); group.add(padL);
            const padR = this.createGravLevitationPad(2); padR.position.set(-2, 0.8, z); group.add(padR);
            
            // Connettori magnetici fluttuanti (non toccano la capsula)
            // Emettitori dal pad verso il pod
            const beamL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), this.materials.energyShield);
            beamL.position.set(2, 2, z); 
            group.add(beamL);
            const beamR = beamL.clone(); beamR.position.set(-2, 2, z);
            group.add(beamR);
        });

        return group;
    },
    
    // Cleanup
    dispose() {
        // Dispose basic resources
    }
};