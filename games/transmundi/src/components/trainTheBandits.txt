// src/components/Assets.js
import * as THREE from 'three';

export const Assets = {
    materials: {
        body: new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.7, metalness: 0.2 }),
        brass: new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.2, metalness: 1.0 }),
        steel: new THREE.MeshStandardMaterial({ color: 0x8899a6, roughness: 0.4, metalness: 0.9 }),
        matteBlack: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 }),
        glass: new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6, roughness: 0.0, metalness: 0.9 }),
        ember: new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff1100, emissiveIntensity: 8 }),
        headlight: new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 10 })
    },

    // --- FIX RUOTE ---
    createDetailedWheel: function(radius) {
        const group = new THREE.Group();
        
        // 1. Cerchione
        const rimGeo = new THREE.TorusGeometry(radius, 0.15, 8, 24);
        const rim = new THREE.Mesh(rimGeo, this.materials.steel);
        group.add(rim);

        // 2. Mozzo centrale
        const hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
        hubGeo.rotateX(Math.PI/2);
        const hub = new THREE.Mesh(hubGeo, this.materials.steel);
        group.add(hub);

        // 3. Raggi
        const spokeGeo = new THREE.BoxGeometry(0.1, radius * 1.8, 0.05);
        const spokesCount = 8;
        for(let i=0; i<spokesCount; i++){
            const spoke = new THREE.Mesh(spokeGeo, this.materials.steel);
            spoke.rotation.z = (Math.PI * i) / (spokesCount / 2);
            group.add(spoke);
        }

        // 4. Contrappeso (Corretto con CylinderGeometry)
        const weightGeo = new THREE.CylinderGeometry(radius*0.8, radius*0.8, 0.2, 8, 1, false, 0, 1.5);
        weightGeo.rotateX(Math.PI/2);
        const weight = new THREE.Mesh(weightGeo, this.materials.steel);
        weight.position.set(0, 0, 0.05);
        weight.rotation.z = 0.5;
        group.add(weight);

        // *** FIX ORIENTAMENTO ***
        // Ruotiamo l'intero gruppo di 90 gradi sull'asse Y.
        // In questo modo la faccia della ruota si allinea ai binari (Asse Z).
        group.rotation.y = Math.PI / 2;

        return group;
    },

    createLocomotive: function() {
        const trainGroup = new THREE.Group();

        // 1. TELAIO
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1, 12), this.materials.matteBlack);
        chassis.position.set(0, 1.5, 1);
        trainGroup.add(chassis);

        // Scaccia-pietre
        const grillGroup = new THREE.Group();
        const cowcatcher = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.5, 3).rotateX(-Math.PI/5), this.materials.matteBlack);
        cowcatcher.scale.set(1,1,0.6);
        for(let i=-5; i<=5; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.05), this.materials.brass);
            bar.position.set(i*0.15, 0, 0.2);
            bar.rotation.x = -Math.PI/5;
            grillGroup.add(bar);
        }
        grillGroup.add(cowcatcher);
        grillGroup.position.set(0, 1, 7.5);
        trainGroup.add(grillGroup);

        // 2. CALDAIA
        const boilerGroup = new THREE.Group();
        const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 7, 32).rotateZ(Math.PI/2), this.materials.body);
        boilerGroup.add(boiler);
        
        const smokebox = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 1.5, 32).rotateZ(Math.PI/2), this.materials.matteBlack);
        smokebox.position.set(2.8, 0, 0);
        boilerGroup.add(smokebox);

        [-2, -0.5, 1, 2.1].forEach(x => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.31, 0.05, 4, 32).rotateY(Math.PI/2), this.materials.brass);
            ring.position.set(x, 0, 0);
            boilerGroup.add(ring);
        });

        const domeGeo = new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI*2, 0, Math.PI/2);
        const dome1 = new THREE.Mesh(domeGeo, this.materials.brass); dome1.position.set(0.5, 1.2, 0); boilerGroup.add(dome1);
        const dome2 = new THREE.Mesh(domeGeo, this.materials.body); dome2.scale.set(1.2, 1.5, 1.2); dome2.position.set(-1, 1.2, 0); boilerGroup.add(dome2);

        boilerGroup.rotation.y = -Math.PI / 2;
        boilerGroup.position.set(0, 3.2, 1.5);
        trainGroup.add(boilerGroup);

        // 3. CABINA
        const cabGroup = new THREE.Group();
        cabGroup.add(new THREE.Mesh(new THREE.BoxGeometry(3.2, 4, 3.5), this.materials.body).position.set(0,2,0) || cabGroup); // Cabina
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 4, 3, 1, false, 0, 3.14).rotateY(Math.PI/2).rotateX(Math.PI/2), this.materials.matteBlack);
        roof.scale.set(1, 0.5, 1); roof.position.set(0, 4.2, 0); cabGroup.add(roof);
        cabGroup.add(new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.2, 1.5), this.materials.brass).position.set(0, 2.5, 0) || cabGroup); // Finestre
        
        const fireLight = new THREE.PointLight(0xffaa00, 5, 10); fireLight.position.set(0, 2, -3); trainGroup.add(fireLight);
        const furnace = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.materials.ember); furnace.position.set(0, 2.5, -1.6); furnace.rotation.y = Math.PI; cabGroup.add(furnace);
        
        cabGroup.position.set(0, 2.5, -3);
        trainGroup.add(cabGroup);

        // 4. CIMINIERA
        const chimGroup = new THREE.Group();
        chimGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.5, 16), this.materials.matteBlack));
        const chimTop = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 16, 1, true), this.materials.matteBlack); chimTop.position.y = 1; chimTop.rotation.x = Math.PI; chimGroup.add(chimTop);
        chimGroup.position.set(0, 4.5, 4.5);
        trainGroup.add(chimGroup);

        // 5. LUCI
        const hlGroup = new THREE.Group();
        hlGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), this.materials.matteBlack));
        const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1).rotateX(Math.PI/2), this.materials.headlight); bulb.position.z = 0.3; hlGroup.add(bulb);
        hlGroup.position.set(0, 5.3, 5.8);
        trainGroup.add(hlGroup);
        
        const spot = new THREE.SpotLight(0xffffee, 20, 60, 0.6, 0.5, 1); spot.position.set(0, 5.3, 6); spot.target.position.set(0, 0, 30); trainGroup.add(spot); trainGroup.add(spot.target);

        // 6. RUOTE CORRETTE
        const bigWheelR = 1.2;
        [0.5, 3.5].forEach(z => {
            // Ruota Sinistra
            const wL = this.createDetailedWheel(bigWheelR);
            wL.position.set(1.6, bigWheelR, z);
            // wL ha già rotation.y = PI/2 dalla funzione, che punta verso sinistra (corretto)
            trainGroup.add(wL);

            // Ruota Destra
            const wR = this.createDetailedWheel(bigWheelR);
            wR.position.set(-1.6, bigWheelR, z);
            // Ruotiamo wR al contrario (-PI/2) così il contrappeso punta verso l'esterno destro
            wR.rotation.y = -Math.PI / 2; 
            trainGroup.add(wR);
        });

        const smallWheelR = 0.6;
        [5.5, 7].forEach(z => {
            const wL = this.createDetailedWheel(smallWheelR);
            wL.position.set(1.4, smallWheelR, z);
            trainGroup.add(wL);

            const wR = this.createDetailedWheel(smallWheelR);
            wR.position.set(-1.4, smallWheelR, z);
            wR.rotation.y = -Math.PI / 2;
            trainGroup.add(wR);
        });

        const rod = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 4.5), this.materials.steel);
        const rL = rod.clone(); rL.position.set(1.8, 1.2, 2); trainGroup.add(rL);
        const rR = rod.clone(); rR.position.set(-1.8, 1.2, 2); trainGroup.add(rR);

        trainGroup.userData.chimneyPos = new THREE.Vector3(0, 6, 4.5);
        return trainGroup;
    },

    createWagon: function() {
        const group = new THREE.Group();
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 7), this.materials.matteBlack); chassis.position.y = 1.2; group.add(chassis);
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3, 6.5), this.materials.body); body.position.y = 3.1; group.add(body);
        
        for(let z = -3; z <= 3; z+= 1.5) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.1, 0.2), this.materials.brass); p.position.set(0, 3.1, z); group.add(p);
        }
        
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7.2, 16, 1, false, 0, Math.PI).rotateZ(Math.PI/2).rotateY(Math.PI/2), this.materials.matteBlack);
        roof.position.y = 4.6; roof.scale.y = 0.8; group.add(roof);

        const winGeo = new THREE.PlaneGeometry(0.6, 1.2);
        for(let z = -2.2; z <= 2.2; z+= 1.1) {
            const wL = new THREE.Mesh(winGeo, this.materials.glass); wL.position.set(1.41, 3.2, z); wL.rotation.y = Math.PI/2; group.add(wL);
            const wR = new THREE.Mesh(winGeo, this.materials.glass); wR.position.set(-1.41, 3.2, z); wR.rotation.y = -Math.PI/2; group.add(wR);
        }

        const wheelR = 0.6;
        [2, -2].forEach(zOffset => {
            const bogie = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2.5), this.materials.matteBlack); bogie.position.set(0, 0.8, zOffset); group.add(bogie);
            [-0.8, 0.8].forEach(subZ => {
                // Ruote Vagoni
                const wL = this.createDetailedWheel(wheelR);
                wL.position.set(1.1, wheelR, zOffset + subZ);
                group.add(wL);

                const wR = this.createDetailedWheel(wheelR);
                wR.position.set(-1.1, wheelR, zOffset + subZ);
                wR.rotation.y = -Math.PI / 2; // Rotazione corretta per lato destro
                group.add(wR);
            });
        });

        const il = new THREE.PointLight(0xffaa00, 2, 6); il.position.set(0, 3, 0); group.add(il);
        return group;
    }
};