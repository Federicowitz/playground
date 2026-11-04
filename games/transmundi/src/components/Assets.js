// src/components/Assets.js

import * as THREE from 'three';

export const Assets = {
    // Materiali riutilizzabili
    materials: {
        body: new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.6 }), // Blu scuro/Grigio
        accent: new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 }), // Rosso
        metal: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 }),
        glass: new THREE.MeshStandardMaterial({ 
            color: 0xffcc00, 
            emissive: 0xffaa00, 
            emissiveIntensity: 2, 
            transparent: true, 
            opacity: 0.9 
        }),
        light: new THREE.MeshStandardMaterial({ color: 0xffffe0, emissive: 0xffffe0, emissiveIntensity: 5 })
    },

    createLocomotive: function() {
        const trainGroup = new THREE.Group();

        // 1. Caldaia (Cilindro orizzontale)
        const boilerGeo = new THREE.CylinderGeometry(1.2, 1.2, 5, 16);
        boilerGeo.rotateZ(Math.PI / 2);
        const boiler = new THREE.Mesh(boilerGeo, this.materials.body);
        boiler.position.set(0, 2.2, 1);
        trainGroup.add(boiler);

        // 2. Cabina (Cubo dietro)
        const cabGeo = new THREE.BoxGeometry(2.8, 3.5, 2.5);
        const cab = new THREE.Mesh(cabGeo, this.materials.body);
        cab.position.set(0, 3, -2);
        trainGroup.add(cab);

        // Tetto cabina
        const roofGeo = new THREE.BoxGeometry(3.2, 0.2, 3);
        const roof = new THREE.Mesh(roofGeo, this.materials.accent);
        roof.position.set(0, 4.8, -2);
        trainGroup.add(roof);

        // 3. Finestre Luminose
        const winGeo = new THREE.PlaneGeometry(1, 1);
        const winL = new THREE.Mesh(winGeo, this.materials.glass);
        winL.position.set(1.41, 3.5, -2);
        winL.rotation.y = Math.PI / 2;
        trainGroup.add(winL);

        const winR = winL.clone();
        winR.position.set(-1.41, 3.5, -2);
        winR.rotation.y = -Math.PI / 2;
        trainGroup.add(winR);

        // 4. Ciminiera (Punto di emissione fumo)
        const chimneyGeo = new THREE.CylinderGeometry(0.4, 0.3, 1.5);
        const chimney = new THREE.Mesh(chimneyGeo, this.materials.metal);
        chimney.position.set(0, 3.5, 2.5);
        trainGroup.add(chimney);
        
        // Faro frontale
        const lightGeo = new THREE.CylinderGeometry(0.4, 0.2, 0.5);
        lightGeo.rotateZ(Math.PI / 2);
        const lightBase = new THREE.Mesh(lightGeo, this.materials.metal);
        lightBase.position.set(0, 2.5, 3.6);
        trainGroup.add(lightBase);
        
        const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.3), this.materials.light);
        bulb.position.set(0, 2.5, 3.86);
        trainGroup.add(bulb);
        
        // Luce Spot reale per illuminare i binari
        const spotLight = new THREE.SpotLight(0xffaa00, 10, 40, 0.5, 0.5, 1);
        spotLight.position.set(0, 2.5, 3.8);
        spotLight.target.position.set(0, 0, 20);
        trainGroup.add(spotLight);
        trainGroup.add(spotLight.target);

        // 5. Scaccia-pietre (Cowcatcher)
        const cowGeo = new THREE.ConeGeometry(1.5, 1.5, 4); // Forma triangolare
        cowGeo.rotateX(-Math.PI / 4); // Inclinato
        const cowcatcher = new THREE.Mesh(cowGeo, this.materials.accent);
        cowcatcher.position.set(0, 0.8, 3.8);
        cowcatcher.scale.set(1, 1, 0.5);
        trainGroup.add(cowcatcher);

        // 6. Ruote (Create proceduralmente)
        const wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        
        const positions = [1.5, -0.5, -2.5];
        positions.forEach(z => {
            const wL = new THREE.Mesh(wheelGeo, this.materials.metal);
            wL.position.set(1.4, 0.8, z);
            trainGroup.add(wL);
            const wR = new THREE.Mesh(wheelGeo, this.materials.metal);
            wR.position.set(-1.4, 0.8, z);
            trainGroup.add(wR);
        });

        // Punto di ancoraggio per il fumo (salvato nei dati utente)
        trainGroup.userData.chimneyPos = new THREE.Vector3(0, 5, 2.5);

        return trainGroup;
    },

    createWagon: function() {
        const group = new THREE.Group();
        
        // Corpo
        const bodyGeo = new THREE.BoxGeometry(2.6, 2.5, 4.5);
        const body = new THREE.Mesh(bodyGeo, this.materials.body);
        body.position.set(0, 2.2, 0);
        group.add(body);

        // Tetto arrotondato
        const roofGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.6, 16, 1, true, 0, Math.PI);
        roofGeo.rotateZ(Math.PI/2);
        roofGeo.rotateY(Math.PI/2);
        const roof = new THREE.Mesh(roofGeo, this.materials.accent);
        roof.position.set(0, 3.5, 0);
        group.add(roof);

        // Ruote
        const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 10);
        wheelGeo.rotateZ(Math.PI/2);
        const wL1 = new THREE.Mesh(wheelGeo, this.materials.metal); wL1.position.set(1.3, 0.6, 1.5);
        const wL2 = new THREE.Mesh(wheelGeo, this.materials.metal); wL2.position.set(1.3, 0.6, -1.5);
        const wR1 = new THREE.Mesh(wheelGeo, this.materials.metal); wR1.position.set(-1.3, 0.6, 1.5);
        const wR2 = new THREE.Mesh(wheelGeo, this.materials.metal); wR2.position.set(-1.3, 0.6, -1.5);
        group.add(wL1); group.add(wL2); group.add(wR1); group.add(wR2);

        // Finestre laterali
        const winGeo = new THREE.PlaneGeometry(0.8, 0.8);
        for(let z of [-1.2, 0, 1.2]) {
             const wl = new THREE.Mesh(winGeo, this.materials.glass);
             wl.position.set(1.31, 2.5, z); wl.rotation.y = Math.PI/2;
             group.add(wl);
             
             const wr = new THREE.Mesh(winGeo, this.materials.glass);
             wr.position.set(-1.31, 2.5, z); wr.rotation.y = -Math.PI/2;
             group.add(wr);
        }

        return group;
    }
};