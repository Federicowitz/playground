// src/components/Assets.js
import * as THREE from 'three';

export const Assets = {
    materials: {
        // ORO SATINATO: Per il corpo principale (meno riflettente per vedere le forme)
        goldBody: new THREE.MeshStandardMaterial({ 
            color: 0xffcc00, 
            roughness: 0.3, 
            metalness: 0.9 
        }),
        // ORO LUCIDO: Per anelli, cupole e finiture
        goldPolished: new THREE.MeshStandardMaterial({ 
            color: 0xffd700, 
            roughness: 0.1, 
            metalness: 1.0,
            emissive: 0x221100,
            emissiveIntensity: 0.2
        }),
        // ACCIAIO/PLATINO: Per le ruote e bielle (per stacco visivo)
        platinum: new THREE.MeshStandardMaterial({ 
            color: 0xaaccff, 
            roughness: 0.4, 
            metalness: 0.9 
        }),
        // VELLUTO ROSSO: Per il tetto e interni (tocco regale)
        royalRed: new THREE.MeshStandardMaterial({ 
            color: 0x880000, 
            roughness: 0.8, 
            metalness: 0.1 
        }),
        // NERO OPACO: Per il telaio inferiore (contrasto)
        matteDark: new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 0.9 
        }),
        glass: new THREE.MeshStandardMaterial({ 
            color: 0xffffee, 
            transparent: true, 
            opacity: 0.5, 
            metalness: 0.9 
        }),
        glow: new THREE.MeshStandardMaterial({ 
            color: 0xffaa00, 
            emissive: 0xffaa00, 
            emissiveIntensity: 5 
        })
    },

    // --- RUOTA REGALE DETTAGLIATA ---
    createDetailedWheel: function(radius) {
        const group = new THREE.Group();
        
        // 1. Cerchione Dorato
        const rimGeo = new THREE.TorusGeometry(radius, 0.12, 8, 32);
        const rim = new THREE.Mesh(rimGeo, this.materials.goldPolished);
        group.add(rim);

        // 2. Centro in Platino
        const hubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
        hubGeo.rotateX(Math.PI/2);
        const hub = new THREE.Mesh(hubGeo, this.materials.platinum);
        group.add(hub);

        // 3. Raggi Curvi (Stile Liberty) - Simulati con box ruotati
        const spokesCount = 12; // Più raggi per maggiore dettaglio
        for(let i=0; i<spokesCount; i++){
            const spokeGeo = new THREE.BoxGeometry(0.08, radius * 1.7, 0.05);
            const spoke = new THREE.Mesh(spokeGeo, this.materials.goldBody);
            spoke.rotation.z = (Math.PI * i) / (spokesCount / 2);
            group.add(spoke);
            
            // Aggiungo un bullone decorativo alla fine del raggio
            const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.06), this.materials.goldPolished);
            const angle = (Math.PI * i) / (spokesCount / 2);
            bolt.position.set(Math.cos(angle+1.57)*(radius-0.2), Math.sin(angle+1.57)*(radius-0.2), 0.05);
            group.add(bolt);
        }

        // 4. Contrappeso e Perno Biella
        const weightGeo = new THREE.CylinderGeometry(radius*0.7, radius*0.7, 0.15, 8, 1, false, 0, 2);
        weightGeo.rotateX(Math.PI/2);
        const weight = new THREE.Mesh(weightGeo, this.materials.platinum);
        weight.position.set(0, 0, 0.05);
        weight.rotation.z = 0.5;
        group.add(weight);

        // Perno esagonale
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 6), this.materials.goldPolished);
        pin.rotateX(Math.PI/2);
        pin.position.set(0, radius*0.5, 0.15);
        group.add(pin);

        // *** ORIENTAMENTO CORRETTO LUNGO I BINARI ***
        group.rotation.y = Math.PI / 2;

        return group;
    },

    createLocomotive: function() {
        const trainGroup = new THREE.Group();

        // --- 1. TELAIO RINFORZATO ---
        // Base principale nera (per far risaltare l'oro)
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 13), this.materials.matteDark);
        chassis.position.set(0, 1.6, 1.5);
        
        // Bordo dorato del telaio (Trim)
        const trim = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 13.1), this.materials.goldPolished);
        trim.position.set(0, 0.6, 0); // Relativo allo chassis
        chassis.add(trim);
        
        trainGroup.add(chassis);

        // Scaccia-pietre "Royal" (Griglia verticale dorata con sfondo rosso)
        const cowGroup = new THREE.Group();
        const cowBack = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.5, 3).rotateX(-Math.PI/5), this.materials.royalRed);
        cowBack.scale.set(1,1,0.5);
        cowGroup.add(cowBack);
        
        // Barre verticali oro
        for(let i=-6; i<=6; i++) {
            const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8), this.materials.goldPolished);
            bar.position.set(i*0.18, 0, 0.3);
            bar.rotation.x = -Math.PI/5;
            cowGroup.add(bar);
        }
        cowGroup.position.set(0, 1, 8.2);
        trainGroup.add(cowGroup);


        // --- 2. CALDAIA E DETTAGLI ---
        const boilerGroup = new THREE.Group();
        
        // Corpo caldaia Oro Satinato
        const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 7.5, 32).rotateZ(Math.PI/2), this.materials.goldBody);
        boilerGroup.add(boiler);
        
        // Smokebox anteriore (Oro Lucido)
        const smokebox = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 1.8, 32).rotateZ(Math.PI/2), this.materials.goldPolished);
        smokebox.position.set(3, 0, 0);
        boilerGroup.add(smokebox);

        // Bande decorative (Fasce)
        [-2.5, -1, 1, 2.2].forEach(x => {
            const band = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.08, 4, 64).rotateY(Math.PI/2), this.materials.royalRed);
            band.position.set(x, 0, 0);
            boilerGroup.add(band);
        });

        // --- NUOVO DETTAGLIO: CORRIMANO (Handrails) ---
        const handrailGeo = new THREE.CylinderGeometry(0.05, 0.05, 7);
        handrailGeo.rotateZ(Math.PI/2);
        
        // Corrimano Sinistro
        const railL = new THREE.Mesh(handrailGeo, this.materials.platinum);
        railL.position.set(0, 0.5, 1.6); // Fuori dalla caldaia
        boilerGroup.add(railL);
        // Supporti corrimano
        [-3, 0, 3].forEach(x => {
            const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3).rotateX(Math.PI/2), this.materials.goldPolished);
            holder.position.set(x, 0.5, 1.45);
            boilerGroup.add(holder);
        });

        // Corrimano Destro
        const railR = railL.clone();
        railR.position.set(0, 0.5, -1.6);
        boilerGroup.add(railR);
        [-3, 0, 3].forEach(x => {
            const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3).rotateX(Math.PI/2), this.materials.goldPolished);
            holder.position.set(x, 0.5, -1.45);
            boilerGroup.add(holder);
        });

        // Cupole (Domes) elaborate
        const domeGeo = new THREE.SphereGeometry(0.65, 32, 16, 0, Math.PI*2, 0, Math.PI/2);
        // Sand Dome (Sabbiiera)
        const dome1 = new THREE.Mesh(domeGeo, this.materials.goldPolished);
        dome1.position.set(0.8, 1.3, 0);
        dome1.scale.y = 1.5;
        boilerGroup.add(dome1);
        
        // Steam Dome (Vapore)
        const dome2 = new THREE.Mesh(domeGeo, this.materials.goldBody);
        dome2.position.set(-1.5, 1.3, 0);
        dome2.scale.set(1.2, 1.2, 1.2);
        boilerGroup.add(dome2);

        // Fischietto a vapore (Whistle)
        const whistle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6), this.materials.goldPolished);
        whistle.position.set(-2.5, 1.5, 0);
        boilerGroup.add(whistle);

        boilerGroup.rotation.y = -Math.PI / 2;
        boilerGroup.position.set(0, 3.4, 1.5);
        trainGroup.add(boilerGroup);


        // --- 3. CABINA DI LUSSO ---
        const cabGroup = new THREE.Group();
        
        // Pareti cabina
        const cabWall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.5, 3.6), this.materials.goldBody);
        cabWall.position.set(0, 1.75, 0);
        cabGroup.add(cabWall);

        // Tetto spiovente rosso
        const roofShape = new THREE.CylinderGeometry(0, 2.8, 4, 4, 1, false, Math.PI/4); // Piramide schiacciata
        roofShape.rotateY(Math.PI/2);
        const roof = new THREE.Mesh(roofShape, this.materials.royalRed);
        roof.scale.set(1.2, 0.4, 1.2);
        roof.position.set(0, 4.2, 0);
        cabGroup.add(roof);

        // Decorazione tetto
        const roofTop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), this.materials.goldPolished);
        roofTop.position.set(0, 4.6, 0);
        cabGroup.add(roofTop);

        // Finestre laterali con cornici
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.5, 1.5), this.materials.goldPolished);
        winFrame.position.set(0, 2.5, 0);
        cabGroup.add(winFrame);
        
        // Luce interna calda
        const cabLight = new THREE.PointLight(0xffaa00, 4, 8);
        cabLight.position.set(0, 3, 0);
        cabGroup.add(cabLight);

        cabGroup.position.set(0, 3, -3.5);
        trainGroup.add(cabGroup);


        // --- 4. CIMINIERA "DIAMOND STACK" ---
        const chimGroup = new THREE.Group();
        const chimBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 16), this.materials.goldBody);
        
        // Parte superiore svasata (Diamond stack) tipica dei treni western/lusso
        const chimCone = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.5, 1.2, 16), this.materials.goldPolished);
        chimCone.position.y = 1.2;
        
        // Bordo rosso cima
        const chimRim = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.1, 4, 16).rotateX(Math.PI/2), this.materials.royalRed);
        chimRim.position.y = 1.8;

        chimGroup.add(chimBase, chimCone, chimRim);
        chimGroup.position.set(0, 4.8, 4.8);
        trainGroup.add(chimGroup);


        // --- 5. PISTONI CILINDRI (Nuovo Dettaglio) ---
        // Le grosse scatole sopra le ruote anteriori
        const pistonGeo = new THREE.BoxGeometry(3.8, 0.8, 1.5);
        const pistonBox = new THREE.Mesh(pistonGeo, this.materials.goldPolished);
        pistonBox.position.set(0, 2.2, 5);
        trainGroup.add(pistonBox);


        // --- 6. LUCI ---
        const hlGroup = new THREE.Group();
        // Lanterna elaborata
        const lanternBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.8), this.materials.goldPolished);
        const lanternRim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 16), this.materials.royalRed);
        lanternRim.position.z = 0.4;
        
        const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), this.materials.glow);
        bulb.position.z = 0.41;
        
        hlGroup.add(lanternBox, lanternRim, bulb);
        hlGroup.position.set(0, 5.5, 6.2);
        trainGroup.add(hlGroup);

        const spot = new THREE.SpotLight(0xffddaa, 25, 80, 0.5, 0.5, 1);
        spot.position.set(0, 5.5, 6.5);
        spot.target.position.set(0, 0, 40);
        spot.castShadow = true;
        trainGroup.add(spot);
        trainGroup.add(spot.target);


        // --- 7. RUOTE E MECCANICA ---
        const bigWheelR = 1.3;
        const drivePositions = [0.5, 3.5]; 
        
        drivePositions.forEach(z => {
            const wL = this.createDetailedWheel(bigWheelR);
            wL.position.set(1.7, bigWheelR, z);
            trainGroup.add(wL);

            const wR = this.createDetailedWheel(bigWheelR);
            wR.position.set(-1.7, bigWheelR, z);
            wR.rotation.y = -Math.PI / 2; // Fix lato destro
            trainGroup.add(wR);
        });

        const smallWheelR = 0.7;
        [5.8, 7.5].forEach(z => {
            const wL = this.createDetailedWheel(smallWheelR);
            wL.position.set(1.5, smallWheelR, z);
            trainGroup.add(wL);
            const wR = this.createDetailedWheel(smallWheelR);
            wR.position.set(-1.5, smallWheelR, z);
            wR.rotation.y = -Math.PI / 2;
            trainGroup.add(wR);
        });

        // Bielle (Connecting Rods) in Platino
        const rodGeo = new THREE.BoxGeometry(0.15, 0.4, 4.5);
        const rodL = new THREE.Mesh(rodGeo, this.materials.platinum);
        rodL.position.set(2.0, 1.3, 2); 
        rodL.rotation.x = Math.PI/2; // Piatte
        trainGroup.add(rodL);
        
        const rodR = rodL.clone();
        rodR.position.set(-2.0, 1.3, 2);
        trainGroup.add(rodR);

        // Punto emissione fumo
        trainGroup.userData.chimneyPos = new THREE.Vector3(0, 6.6, 4.8);
        
        return trainGroup;
    },

    createWagon: function() {
        const group = new THREE.Group();

        // 1. Telaio
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 8), this.materials.matteDark);
        chassis.position.y = 1.2;
        
        // Decorazione laterale telaio
        const trim = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.1, 8.1), this.materials.goldPolished);
        trim.position.y = 0.4; // Relativo chassis
        chassis.add(trim);
        
        group.add(chassis);

        // 2. Corpo Carrozza VIP
        const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 7), this.materials.goldBody);
        body.position.y = 3.2;
        group.add(body);

        // 3. Tetto "Skyline" (Con lucernario centrale rialzato)
        // Base tetto
        const roofBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 7.4), this.materials.royalRed);
        roofBase.position.y = 4.9;
        group.add(roofBase);
        
        // Rialzo centrale (Clerestory)
        const roofTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 6.5), this.materials.goldBody);
        roofTop.position.y = 5.3;
        group.add(roofTop);
        
        // Copertura finale
        const roofCap = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6.6, 2).rotateZ(Math.PI/2), this.materials.royalRed);
        roofCap.position.y = 5.6;
        roofCap.scale.x = 0.3; // Schiaccia
        group.add(roofCap);

        // 4. Colonne e Decorazioni laterali
        for(let z = -3; z <= 3; z+= 1.5) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.2, 0.3), this.materials.goldPolished);
            pillar.position.set(0, 3.2, z);
            group.add(pillar);
        }

        // 5. Finestre Grandi
        const winGeo = new THREE.PlaneGeometry(0.8, 1.4);
        for(let z = -2.2; z <= 2.2; z+= 1.1) {
            const wL = new THREE.Mesh(winGeo, this.materials.glass);
            wL.position.set(1.51, 3.3, z); wL.rotation.y = Math.PI/2; group.add(wL);
            
            const wR = new THREE.Mesh(winGeo, this.materials.glass);
            wR.position.set(-1.51, 3.3, z); wR.rotation.y = -Math.PI/2; group.add(wR);
        }

        // 6. Balconcino posteriore (Observation Deck)
        // Ringhiera
        const railGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
        const deckZ = -4.0;
        
        // Base balcone
        const deckBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 1), this.materials.matteDark);
        deckBase.position.set(0, 1.7, deckZ);
        group.add(deckBase);

        // Corrimano
        const railTop = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 4, 16, Math.PI).rotateZ(Math.PI/2), this.materials.goldPolished);
        railTop.position.set(0, 2.5, deckZ);
        railTop.rotation.y = Math.PI/2;
        group.add(railTop);

        // Barre verticali ringhiera
        [-1.2, -0.6, 0, 0.6, 1.2].forEach(x => {
            const bar = new THREE.Mesh(railGeo, this.materials.goldPolished);
            bar.position.set(x, 2.1, deckZ - 0.4 + Math.abs(x)*0.1); // Curva leggera
            group.add(bar);
        });


        // 7. Ruote (Carrelli)
        const wheelR = 0.65;
        [2.5, -2.5].forEach(zOffset => {
            const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.8), this.materials.matteDark);
            bogie.position.set(0, 0.8, zOffset);
            group.add(bogie);

            [-0.9, 0.9].forEach(subZ => {
                const wL = this.createDetailedWheel(wheelR);
                wL.position.set(1.1, wheelR, zOffset + subZ);
                group.add(wL);

                const wR = this.createDetailedWheel(wheelR);
                wR.position.set(-1.1, wheelR, zOffset + subZ);
                wR.rotation.y = -Math.PI / 2;
                group.add(wR);
            });
        });

        return group;
    }
};