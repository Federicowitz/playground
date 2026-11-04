// src/components/Assets.js
import * as THREE from 'three';

/**
 * ============================================================================
 * CHRONOS ENGINE: PROCEDURAL ASSET GENERATOR
 * ============================================================================
 * Un sistema complesso per generare macchine a vapore altamente dettagliate
 * ottimizzando le draw-calls tramite Instancing e Geometry Merging.
 */

// ----------------------------------------------------------------------------
// 1. TEXTURE & MATERIAL FABRICATORS
// ----------------------------------------------------------------------------

const MaterialForge = {
    canvas: null,
    ctx: null,

    getCanvas(size = 512) {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
        this.canvas.width = size;
        this.canvas.height = size;
        return this.ctx;
    },

    // Genera texture Legno di Mogano
    generateMahogany() {
        const ctx = this.getCanvas(512);
        
        // Base rossa scura
        ctx.fillStyle = '#4a2511';
        ctx.fillRect(0, 0, 512, 512);

        // Venature
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * 512;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.bezierCurveTo(
                x + (Math.random() - 0.5) * 50, 150,
                x + (Math.random() - 0.5) * 50, 350,
                x + (Math.random() - 0.5) * 100, 512
            );
            ctx.strokeStyle = `rgba(30, 10, 5, ${Math.random() * 0.3})`;
            ctx.lineWidth = 2 + Math.random() * 5;
            ctx.stroke();
        }
        
        const tex = new THREE.CanvasTexture(this.canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    },

    // Genera texture Ottone Spazzolato (Noise Map)
    generateBrushedMetal() {
        const ctx = this.getCanvas(256);
        const imgData = ctx.createImageData(256, 256);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const noise = Math.floor(Math.random() * 30 + 200); // Grigio chiaro
            imgData.data[i] = noise;
            imgData.data[i+1] = noise - 10; // Tinta giallina
            imgData.data[i+2] = noise - 40;
            imgData.data[i+3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        
        // Rigature orizzontali (Spazzolatura)
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for(let i=0; i<100; i++) {
            const y = Math.random() * 256;
            ctx.fillRect(0, y, 256, 1);
        }

        return new THREE.CanvasTexture(this.canvas);
    }
};

export const Assets = {
    // Repository risorse
    cache: {
        textures: {},
        geometries: {}
    },

    // DEFINIZIONE MATERIALI PBR "LUXURY STEAMPUNK"
    materials: {
        brass: new THREE.MeshStandardMaterial({ 
            color: 0xd4af37, 
            roughness: 0.3, 
            metalness: 1.0,
            envMapIntensity: 1.0
        }),
        
        dirtyCopper: new THREE.MeshStandardMaterial({ 
            color: 0xb87333, 
            roughness: 0.6, 
            metalness: 0.8,
        }),

        ironPlating: new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, 
            roughness: 0.7, 
            metalness: 0.5 
        }),

        mahoganyWood: new THREE.MeshStandardMaterial({ 
            color: 0x663311, 
            roughness: 0.5, 
            metalness: 0.0,
            map: null // Assegnato a runtime
        }),

        aetherGlass: new THREE.MeshPhysicalMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.2,
            transmission: 0.9,
            thickness: 1.0,
            emissive: 0x0044aa,
            emissiveIntensity: 0.5
        }),
        
        steamEmitter: new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0, // Invisibile, solo marker
        }),

        gaugeFace: new THREE.MeshBasicMaterial({
            color: 0xffffee
        }),

        needleRed: new THREE.MeshBasicMaterial({
            color: 0xaa0000
        })
    },

    initResources() {
        if (!this.cache.textures.wood) {
            this.cache.textures.wood = MaterialForge.generateMahogany();
            this.materials.mahoganyWood.map = this.cache.textures.wood;
        }
        if (!this.cache.textures.brassMap) {
            this.cache.textures.brassMap = MaterialForge.generateBrushedMetal();
            this.materials.brass.roughnessMap = this.cache.textures.brassMap;
        }
        
        // Pool Geometrie base per instancing
        this.cache.geometries.rivet = new THREE.SphereGeometry(0.05, 8, 8); // Rivetto emisferico
        this.cache.geometries.bolt = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6); // Bullone esagonale
    },

    // ------------------------------------------------------------------------
    // 2. PROCEDURAL GEOMETRY BUILDERS
    // ------------------------------------------------------------------------

    /**
     * Crea un Ingranaggio Parametrico reale (Estruso).
     */
     createCogGeometry(radius, teeth, depth, holeRadius) {
        const shape = new THREE.Shape();
        const outerR = radius;
        const innerR = radius * 0.85;
        
        const steps = teeth * 2;
        const stepAngle = (Math.PI * 2) / steps;

        shape.moveTo(outerR, 0);
        for (let i = 1; i <= steps; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const a = i * stepAngle;
            shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        
        // --- FIX: Aggiungiamo il buco SOLO se il raggio è valido ---
        if (holeRadius > 0.01) {
            const holePath = new THREE.Path();
            holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
            shape.holes.push(holePath);
        }
        
        // Fori di alleggerimento (Spokes holes)
        if (radius > 0.5) {
            const spokeCount = 4;
            const spokeR = radius * 0.4;
            const spokeSize = radius * 0.15;
            // Assicuriamoci che i fori decorativi non intersechino il centro se non c'è buco
            // ma per un ingranaggio grande va bene.
            for(let i=0; i<spokeCount; i++) {
                const ang = (i/spokeCount)*Math.PI*2;
                const sHole = new THREE.Path();
                const cx = Math.cos(ang)*spokeR;
                const cy = Math.sin(ang)*spokeR;
                sHole.absarc(cx, cy, spokeSize, 0, Math.PI*2, false);
                shape.holes.push(sHole);
            }
        }

        const extrudeSettings = { 
            depth: depth, 
            bevelEnabled: true, 
            bevelSegments: 1, 
            steps: 1, 
            bevelSize: 0.02, 
            bevelThickness: 0.02 
        };
        
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    },

    /**
     * Genera un manometro Steampunk
     */
    createPressureGauge(radius) {
        const group = new THREE.Group();
        
        // Cassa ottone
        const caseGeo = new THREE.CylinderGeometry(radius, radius, 0.1, 32);
        caseGeo.rotateX(Math.PI/2);
        const casing = new THREE.Mesh(caseGeo, this.materials.brass);
        group.add(casing);
        
        // Quadrante
        const faceGeo = new THREE.CircleGeometry(radius * 0.85, 32);
        const face = new THREE.Mesh(faceGeo, this.materials.gaugeFace);
        face.position.z = 0.06;
        group.add(face);
        
        // Lancetta
        const needleGeo = new THREE.BoxGeometry(radius * 0.05, radius * 0.7, 0.01);
        needleGeo.translate(0, radius * 0.2, 0); // Pivot alla base
        const needle = new THREE.Mesh(needleGeo, this.materials.needleRed);
        needle.position.z = 0.08;
        needle.rotation.z = -Math.PI / 4; // Posizione casuale iniziale
        
        // userData per animazione lancetta nel game loop
        needle.userData.isNeedle = true;
        group.add(needle);
        
        // Vetro
        const glassGeo = new THREE.SphereGeometry(radius * 0.9, 16, 16, 0, Math.PI*2, 0, Math.PI/6);
        const glass = new THREE.Mesh(glassGeo, this.materials.aetherGlass);
        glass.position.z = 0.02;
        glass.scale.z = 0.5; // Appiattito
        group.add(glass);

        return group;
    },

    /**
     * Genera un tubo di rame lungo un percorso Bezier
     */
    createSteamPipe(points, radius) {
        const path = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(path, 32, radius, 8, false);
        return new THREE.Mesh(geo, this.materials.dirtyCopper);
    },

    /**
     * Helper per piazzare migliaia di rivetti usando una singola Draw Call
     */
    createRivets(count, positionFunc) {
        const mesh = new THREE.InstancedMesh(this.cache.geometries.rivet, this.materials.brass, count);
        const dummy = new THREE.Object3D();
        
        for(let i=0; i<count; i++) {
            const data = positionFunc(i, count);
            dummy.position.copy(data.pos);
            if(data.rot) dummy.rotation.copy(data.rot);
            if(data.lookAt) dummy.lookAt(data.lookAt);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        return mesh;
    },


    // ------------------------------------------------------------------------
    // 3. ASSET ASSEMBLERS: LOCOMOTIVE "LEVIATHAN"
    // ------------------------------------------------------------------------

    createLocomotive: function() {
        this.initResources();
        const trainGroup = new THREE.Group();

        // --- 3.1 TELAIO "I-BEAM" (Base) ---
        // Un massiccio telaio d'acciaio e ferro
        const chassisGroup = new THREE.Group();
        const beamGeo = new THREE.BoxGeometry(4, 1, 16);
        const chassis = new THREE.Mesh(beamGeo, this.materials.ironPlating);
        chassis.position.y = 1.5;
        chassisGroup.add(chassis);

        // Dettagli Rivetti sul Telaio (Lato SX e DX)
        const rivetCount = 40;
        const rivetSet = this.createRivets(rivetCount * 2, (i, total) => {
            const side = i < total/2 ? 1 : -1;
            const idx = i % (total/2);
            const z = -7 + (idx / (total/2)) * 14;
            return {
                pos: new THREE.Vector3(2.01 * side, 1.5, z),
                rot: new THREE.Euler(0, 0, side * Math.PI/2)
            };
        });
        chassisGroup.add(rivetSet);
        
        // Paracolpi (Buffers) Anteriori e Posteriori
        [8, -8].forEach(z => {
            [1.2, -1.2].forEach(x => {
                const buff = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8), this.materials.ironPlating);
                buff.rotation.x = Math.PI/2;
                buff.position.set(x, 1.5, z + (z>0?0.4:-0.4));
                chassisGroup.add(buff);
                
                const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1), this.materials.dirtyCopper);
                plate.rotation.x = Math.PI/2;
                plate.position.set(x, 1.5, z + (z>0?0.8:-0.8));
                chassisGroup.add(plate);
            });
        });
        trainGroup.add(chassisGroup);


        // --- 3.2 CALDAIA PRINCIPALE (Multi-chambered Reactor) ---
        const boilerGroup = new THREE.Group();
        
        // Camera interna (Vetro Aether)
        const coreGeo = new THREE.CylinderGeometry(1.4, 1.4, 8, 32);
        coreGeo.rotateZ(Math.PI/2);
        const aetherCore = new THREE.Mesh(coreGeo, this.materials.aetherGlass);
        boilerGroup.add(aetherCore);

        // Liquido interno (cilindro più piccolo colorato)
        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 7.8, 32).rotateZ(Math.PI/2), new THREE.MeshBasicMaterial({color: 0x00ffff}));
        liquid.scale.set(0.9, 1, 0.9); // Leggermente più piccolo
        boilerGroup.add(liquid);

        // Corazza esterna (Segmenti di ottone)
        const segmentCount = 5;
        for(let i=0; i<segmentCount; i++) {
            // Fasce metalliche con buchi
            const bandWidth = 0.6;
            const zPos = -3 + (i * 1.5);
            
            const bandGeo = new THREE.CylinderGeometry(1.45, 1.45, bandWidth, 32, 1, true);
            bandGeo.rotateZ(Math.PI/2);
            const band = new THREE.Mesh(bandGeo, this.materials.brass);
            band.position.set(0, 0, zPos);
            
            // Lato opaco (DoubleSide trick simulato con spessore o backface? Usiamo mesh separate)
            const bandInner = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.44, bandWidth, 32).rotateZ(Math.PI/2), this.materials.ironPlating);
            bandInner.position.set(0, 0, zPos);
            
            boilerGroup.add(band);
            boilerGroup.add(bandInner);
            
            // Bulloni sulla fascia
            const boltGroup = this.createRivets(16, (k, t) => {
                const ang = (k/t) * Math.PI * 2;
                const y = Math.sin(ang) * 1.46;
                const x = Math.cos(ang) * 1.46; // Siccome ruotato su Z, X è altezza relativa in object space locale prima della rotazione? No.
                // Cilindro originale è verticale lungo Y. Ruotato 90 su Z => asse diventa X.
                // Quindi circonferenza è su piano YZ.
                return {
                    pos: new THREE.Vector3(0, Math.cos(ang)*1.46, Math.sin(ang)*1.46 + zPos), // Wait logic fix
                    lookAt: new THREE.Vector3(0, Math.cos(ang)*2, Math.sin(ang)*2 + zPos) // Point outward
                };
            });
            // Boiler orientation fix: Boiler is cylinder along X after rotation?
            // Let's restart coordinates logic:
            // CylinderGeometry defaults along Y. rotateZ(90) -> lies along X.
            // train logic uses Z as length.
            // We need Cylinder along Z. -> rotateX(90).
        }
        
        // Fix Boiler Orientation
        // Creiamo tutto "localmente" lungo Z, poi non ruotiamo il gruppo se non serve.
        // Geometry reset:
        const boilerLen = 8;
        const boilGeoZ = new THREE.CylinderGeometry(1.4, 1.4, boilerLen, 32).rotateX(Math.PI/2);
        const coreZ = new THREE.Mesh(boilGeoZ, this.materials.aetherGlass);
        
        const freshBoilerGrp = new THREE.Group();
        freshBoilerGrp.add(coreZ);

        // Fasce corrette
        for(let i=0; i<5; i++) {
            const z = -3 + i*1.5;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.1, 16, 32), this.materials.brass);
            ring.position.z = z;
            freshBoilerGrp.add(ring);
            
            // Scatola ingranaggi sopra la fascia
            if (i === 2) {
                 const gearbox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), this.materials.ironPlating);
                 gearbox.position.set(0, 1.8, z);
                 freshBoilerGrp.add(gearbox);
                 
                 // Ingranaggio che gira
                 const cogGeo = this.createCogGeometry(0.8, 12, 0.2, 0.3);
                 const cog = new THREE.Mesh(cogGeo, this.materials.dirtyCopper);
                 cog.position.set(0.7, 1.8, z);
                 cog.rotation.y = Math.PI/2;
                 // Anim userData
                 cog.userData.spinSpeed = 3.0; 
                 freshBoilerGrp.add(cog);
            }
        }

        // Manometri laterali (Pressure Gauges)
        [-1, 1].forEach(xSign => {
            const g1 = this.createPressureGauge(0.3);
            g1.position.set(1.3 * xSign, 0.5, 2);
            g1.rotation.y = xSign * Math.PI / 3;
            freshBoilerGrp.add(g1);
        });

        // Tubi di vapore contorti (Splines)
        const pipePoints = [
            new THREE.Vector3(0, 1.4, -3),
            new THREE.Vector3(1.5, 1.5, -1),
            new THREE.Vector3(1.5, 0, 1),
            new THREE.Vector3(0.5, -1, 2) // Verso i pistoni
        ];
        const pipe = this.createSteamPipe(pipePoints, 0.1);
        freshBoilerGrp.add(pipe);
        const pipe2 = pipe.clone();
        pipe2.scale.x = -1; // Specchia
        freshBoilerGrp.add(pipe2);

        freshBoilerGrp.position.set(0, 3.8, 1);
        trainGroup.add(freshBoilerGrp);


        // --- 3.3 CABINA "OSSERVATORIO VITTORIANO" ---
        const cabGroup = new THREE.Group();
        
        // Pavimento
        const floor = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.5, 5), this.materials.mahoganyWood);
        cabGroup.add(floor);

        // Pareti con finestre ad arco
        const wallShape = new THREE.Shape();
        wallShape.moveTo(0,0); wallShape.lineTo(1.5,0); wallShape.lineTo(1.5, 2.5);
        wallShape.absarc(0.75, 2.5, 0.75, 0, Math.PI, true); // Arco top
        wallShape.lineTo(0, 2.5); 
        const wallGeo = new THREE.ExtrudeGeometry(wallShape, {depth: 0.2, bevelEnabled:false});
        
        // Pareti laterali istanziate
        for(let z=-1.5; z<=1.5; z+=1.5) {
            const wL = new THREE.Mesh(wallGeo, this.materials.mahoganyWood);
            wL.rotation.y = Math.PI/2;
            wL.position.set(1.8, 0.5, z + 0.75);
            cabGroup.add(wL);

            const wR = wL.clone();
            wR.position.set(-1.8, 0.5, z - 0.75); // Offset per correggere rotazione
            wR.rotation.y = -Math.PI/2;
            cabGroup.add(wR);
        }

        // Tetto a cupola di rame
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 1, 4, 1, false, Math.PI/4), this.materials.dirtyCopper);
        roof.position.y = 4.5;
        cabGroup.add(roof);

        // Ringhiera del balcone posteriore
        const railGeo = new THREE.CylinderGeometry(0.05, 0.05, 1);
        for(let x=-1.5; x<=1.5; x+=0.5) {
            const post = new THREE.Mesh(railGeo, this.materials.brass);
            post.position.set(x, 1, 2.2);
            cabGroup.add(post);
        }
        const handRail = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.1), this.materials.mahoganyWood);
        handRail.position.set(0, 1.5, 2.2);
        cabGroup.add(handRail);

        cabGroup.position.set(0, 2.5, -4.5);
        trainGroup.add(cabGroup);


        // --- 3.4 FRONTE: LA TRIVELLA "VOID DRILL" (No cowcatcher) ---
        const drillGroup = new THREE.Group();
        
        // Crea spirale
        const spiralPts = [];
        for(let i=0; i<40; i++) {
            const t = i/40; // 0 to 1
            const angle = t * Math.PI * 8; // 4 giri
            const r = (1-t) * 1.5; // Da largo a punta
            const z = t * 4; // Lunghezza
            spiralPts.push(new THREE.Vector3(Math.cos(angle)*r, Math.sin(angle)*r, z));
        }
        const drillShape = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiralPts), 24, 0.15, 8, false);
        const drillMesh = new THREE.Mesh(drillShape, this.materials.ironPlating);
        // Centro solido conico
        const drillCore = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4, 16).rotateX(Math.PI/2).translate(0,0,2), this.materials.dirtyCopper);
        
        drillGroup.add(drillMesh);
        drillGroup.add(drillCore);
        
        // Animazione rotazione
        drillGroup.userData.spinSpeed = 5.0;
        drillGroup.userData.spinAxis = 'z';

        drillGroup.position.set(0, 1.5, 9);
        trainGroup.add(drillGroup);


        // --- 3.5 CIMINIERA "PIPE ORGAN" ---
        // Ciminiere multiple come canne d'organo
        const stackGroup = new THREE.Group();
        const stackPos = [
            {x:0, h:2.5}, {x:0.6, h:2.0}, {x:-0.6, h:2.0}
        ];
        stackPos.forEach(p => {
            const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, p.h), this.materials.brass);
            stack.position.set(p.x, p.h/2, 0);
            
            // Cima a tromba
            const flare = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 16, 1, true), this.materials.brass);
            flare.position.y = p.h/2;
            flare.rotation.x = Math.PI; // Capovolto
            stack.add(flare);
            
            stackGroup.add(stack);
        });
        stackGroup.position.set(0, 6, 4);
        trainGroup.add(stackGroup);
        trainGroup.userData.chimneyPos = new THREE.Vector3(0, 8.5, 4);


        // --- 3.6 RUOTE EPICICLOIDALI (Planetary Gears) ---
        const createPlanetaryWheel = (radius) => {
            const wheelGr = new THREE.Group();
            
            // Cerchione principale
            const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.2, 16, 40), this.materials.ironPlating);
            wheelGr.add(rim);
            
            // Ingranaggio solare centrale (fisso relativo alla ruota)
            const sunGearGeo = this.createCogGeometry(radius*0.3, 8, 0.3, 0.1);
            const sunGear = new THREE.Mesh(sunGearGeo, this.materials.brass);
            sunGear.position.z = -0.1;
            wheelGr.add(sunGear);
            
            // Ingranaggi planetari (satelliti)
            const planetRadius = radius * 0.25;
            const planetGeo = this.createCogGeometry(planetRadius, 6, 0.2, 0.1);
            const orbitRadius = radius * 0.6;
            
            for(let k=0; k<3; k++) {
                const ang = (k/3)*Math.PI*2;
                const planet = new THREE.Mesh(planetGeo, this.materials.dirtyCopper);
                planet.position.set(Math.cos(ang)*orbitRadius, Math.sin(ang)*orbitRadius, 0.1);
                // I pianeti ruotano su se stessi mentre la ruota gira (simulazione visiva)
                planet.userData.localSpin = 2.0; 
                wheelGr.add(planet);
            }
            
            wheelGr.rotation.y = Math.PI/2;
            return wheelGr;
        };

        // Ruote Motrici Enormi
        const bigR = 1.6;
        [0, 4].forEach(z => {
            const wL = createPlanetaryWheel(bigR); wL.position.set(2.1, bigR, z); trainGroup.add(wL);
            const wR = createPlanetaryWheel(bigR); wR.position.set(-2.1, bigR, z); wR.rotation.y = -Math.PI/2; trainGroup.add(wR);
        });

        // Carrello anteriore
        const smallR = 0.8;
        [7, 8.5].forEach(z => {
            const wL = createPlanetaryWheel(smallR); wL.position.set(1.8, smallR, z); trainGroup.add(wL);
            const wR = createPlanetaryWheel(smallR); wR.position.set(-1.8, smallR, z); wR.rotation.y = -Math.PI/2; trainGroup.add(wR);
        });

        // Bielle complesse (Pistoni)
        // Sistema articolato: Cylinder principale + Snodi
        const rodLength = 5;
        const rodGeo = new THREE.BoxGeometry(0.2, 0.4, rodLength);
        const rodL = new THREE.Mesh(rodGeo, this.materials.ironPlating);
        rodL.position.set(2.4, 1.5, 2);
        
        // Snodo pistone
        const joint = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3).rotateZ(Math.PI/2), this.materials.brass);
        joint.position.z = -rodLength/2 + 0.5; // Attacco ruota posteriore
        rodL.add(joint);
        const joint2 = joint.clone();
        joint2.position.z = rodLength/2 - 0.5;
        rodL.add(joint2);

        trainGroup.add(rodL);
        const rodR = rodL.clone();
        rodR.position.set(-2.4, 1.5, 2);
        trainGroup.add(rodR);

        // Fari
        const headlight = new THREE.SpotLight(0xffaa00, 20, 60, 0.5, 0.5);
        headlight.position.set(0, 3, 9.5);
        headlight.target.position.set(0, 0, 30);
        trainGroup.add(headlight);
        trainGroup.add(headlight.target);
        
        const lampMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6).rotateX(Math.PI/2), this.materials.brass);
        lampMesh.position.copy(headlight.position);
        trainGroup.add(lampMesh);

        return trainGroup;
    },


    // ------------------------------------------------------------------------
    // 4. WAGON ASSEMBLER: "THE TIME VAULT"
    // ------------------------------------------------------------------------
    createWagon: function() {
        const group = new THREE.Group();

        // Base Pesante
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1, 10), this.materials.ironPlating);
        chassis.position.y = 1.2;
        group.add(chassis);

        // Corpo carrozza Blindato
        const bodyGeo = new THREE.BoxGeometry(3.4, 3.5, 9);
        const body = new THREE.Mesh(bodyGeo, this.materials.mahoganyWood);
        body.position.y = 3.5;
        group.add(body);

        // Rinforzi angolari (Corner Brackets)
        const corners = [
            [1.75, 3.5, 4.55], [-1.75, 3.5, 4.55],
            [1.75, 3.5, -4.55], [-1.75, 3.5, -4.55]
        ];
        corners.forEach(pos => {
            const brace = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.6, 0.5), this.materials.brass);
            brace.position.set(...pos);
            group.add(brace);
        });

        // Porta blindata rotonda (Come un caveau)
        const doorGroup = new THREE.Group();
        const doorFrame = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.2, 8, 16), this.materials.ironPlating);
        doorGroup.add(doorFrame);
        
        const doorBlade = this.createCogGeometry(1.1, 16, 0.2, 0);
        const door = new THREE.Mesh(doorBlade, this.materials.dirtyCopper);
        door.position.z = 0.1;
        doorGroup.add(door);
        
        // Maniglia rotante
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 8), this.materials.brass);
        handle.position.z = 0.3;
        doorGroup.add(handle);

        doorGroup.position.set(0, 3.5, 0);
        doorGroup.rotation.y = Math.PI/2; // Sui lati
        
        const dLeft = doorGroup.clone(); dLeft.position.x = 1.75;
        const dRight = doorGroup.clone(); dRight.position.x = -1.75; dRight.rotation.y = -Math.PI/2;
        
        group.add(dLeft);
        group.add(dRight);

        // Tetto con lucernari
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 9.2, 4, 1, false, Math.PI/4), this.materials.ironPlating);
        roof.position.y = 5.3;
        roof.rotation.y = Math.PI/2;
        roof.rotation.z = Math.PI/2; // Lungo Z
        group.add(roof);

        // Generatori Tesla sul tetto
        [2, -2].forEach(z => {
            const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16), this.materials.dirtyCopper);
            coil.position.set(0, 6.5, z);
            // Anelli di energia
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 16), this.materials.aetherGlass);
            ring.position.y = 0.5; ring.rotation.x = Math.PI/2;
            coil.add(ring);
            group.add(coil);
            
            // Archi elettrici (simulati con fili)
            // (omessi per risparmio CPU, si possono aggiungere particle)
        });

        // Carrelli a 3 assi per il peso
        const createTriBogie = (zPos) => {
            const bogie = new THREE.Group();
            const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 4), this.materials.ironPlating);
            frame.position.set(0, 0.8, zPos);
            bogie.add(frame);
            
            const wR = 0.7;
            [-1.2, 0, 1.2].forEach(subZ => {
                // Ruote piene pesanti
                const wL = new THREE.Mesh(new THREE.CylinderGeometry(wR, wR, 0.4, 16).rotateZ(Math.PI/2), this.materials.ironPlating);
                wL.position.set(1.3, wR, zPos+subZ);
                bogie.add(wL);
                const wR_m = wL.clone();
                wR_m.position.set(-1.3, wR, zPos+subZ);
                bogie.add(wR_m);
            });
            return bogie;
        };

        group.add(createTriBogie(2.5));
        group.add(createTriBogie(-2.5));

        // Lanterne posteriori
        const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), this.materials.aetherGlass);
        lamp.position.set(1.5, 3, -4.6);
        group.add(lamp);
        const l2 = lamp.clone(); l2.position.set(-1.5, 3, -4.6); group.add(l2);
        const rl = new THREE.PointLight(0x00ffff, 2, 5); rl.position.set(0, 3, -5); group.add(rl);

        return group;
    },

    dispose() {
        Object.values(this.cache.geometries).forEach(g => g.dispose());
        Object.values(this.materials).forEach(m => m.dispose && m.dispose());
        Object.values(this.cache.textures).forEach(t => t && t.dispose());
    }
};