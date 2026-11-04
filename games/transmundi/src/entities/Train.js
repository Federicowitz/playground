// src/entities/Train.js
import * as THREE from 'three';
import { Assets } from '../components/Assets.js';
import { SmokeSystem } from './SmokeSystem.js';

export class Train {
    constructor(scene, curve, numWagons, assets = Assets) {
        this.scene = scene;
        this.curve = curve;
        
        this.speed = 0;
        this.pressure = 0;       // Pressione attuale (0.0 a 1.0)
        this.targetPressure = 0; // Pressione target (per l'effetto ritardo)
        // Parametri Fisici
        this.mass = 2000; // kg fittizi
        this.gravity = 1.81;
        this.trackWidth = 3.0; // Distanza tra le ruote (scartamento)
        this.centerOfMassY = 2.5; // Baricentro alto (più è alto, più è instabile!)
        
        this.currentTiltAngle = 0; // Angolo di sollevamento attuale
        this.isDerailing = false;
        this.derailMomentum = new THREE.Vector3();

        // Setup Mesh (simile a prima ma con una struttura a pivot)
        this.wagons = []; // Conterrà oggetti { container, pivot, mesh, offset }
        
        // Creiamo i vagoni
        this.createTrainUnit(assets.createLocomotive(), 0, true);
        
        for(let i=0; i<numWagons; i++) {
            this.createTrainUnit(assets.createWagon(), (i+1) * 0.005, false);
        }

        this.progress = 0;
        this.smoke = new SmokeSystem(scene);
    }

    createTrainUnit(mesh, offset, isLoco) {
        // STRUTTURA GERARCHICA PER LA FISICA:
        // 1. Container: Segue la curva (Posizione e Rotazione binario)
        // 2. PivotGroup: Serve per spostare il punto di rotazione sulla ruota destra o sinistra
        // 3. Mesh: Il modello visivo del treno
        
        const container = new THREE.Group();
        const pivotGroup = new THREE.Group();
        
        pivotGroup.add(mesh);
        container.add(pivotGroup);
        this.scene.add(container);

        // Salviamo riferimento per aggiornarli
        this.wagons.push({
            container: container,
            pivot: pivotGroup,
            mesh: mesh,
            offset: offset,
            angle: 0,       // Angolo di sollevamento corrente di questo vagone
            velocity: 0     // Velocità angolare di ribaltamento
        });
        
        if(isLoco) this.locoRef = this.wagons[this.wagons.length-1];
    }

    addCoal() { 
    if(!this.isDerailing) {
        // Aggiunge pressione al target, massimo 100% (1.0)
        this.targetPressure = Math.min(this.targetPressure + 0.05, 1.0);
    }
}
    brake() { 
        this.speed *= 0.92;
        this.targetPressure *= 0.95;
    }
    animateProps() {
        const time = Date.now() * 0.001; // Tempo attuale in secondi

        this.wagons.forEach(wagon => {
            wagon.mesh.traverse((child) => {
                
                // --- ANIMAZIONI ESISTENTI ---
                if (child.userData.spinSpeed) {
                    const axis = child.userData.spinAxis || 'x';
                    child.rotation[axis] += child.userData.spinSpeed * (this.speed * 5 + 0.02);
                }
                if (child.userData.localSpin) {
                    child.rotation.z -= 0.02 * child.userData.localSpin; 
                }
                if (child.userData.spin) {
                    if(child.userData.spin.x) child.rotation.x += child.userData.spin.x;
                    if(child.userData.spin.y) child.rotation.y += child.userData.spin.y;
                    if(child.userData.spin.z) child.rotation.z += child.userData.spin.z;
                }

                // --- NUOVE ANIMAZIONI DIVINE (OMEGA-ZERO) ---

                // 1. FLUTTUAZIONE VERTICALE (Per le sfere/ancore)
                if (child.userData.isFloater) {
                    // Seno wave basata sul tempo + un offset randomico per non averle sincronizzate
                    // y originale (0.8) + oscillazione
                    child.position.y = 0.8 + Math.sin(time * 2 + child.userData.randomOffset) * 0.2;
                    // Ruota anche lentamente
                    child.rotation.y += 0.01;
                }

                // 2. PULSAZIONE / RESPIRO (Per le ali frattali)
                if (child.userData.isBreathing) {
                    // Scala su e giù leggermente
                    const scale = 1 + Math.sin(time * 3) * 0.05; 
                    child.scale.set(scale, scale, scale);
                    // Oscillazione leggera dell'ala
                    child.rotation.z = Math.sin(time) * 0.1;
                }

                // 3. SCIA DI LUCE PULSANTE (Per la croce frontale)
                if (child.userData.isPulse) {
                    // Cambia scala in modo erratico (effetto glitch energia)
                    child.scale.y = 1 + Math.sin(time * 15) * 0.2 * Math.random();
                }

                // 4. TEXTURE CHE SCORRE (Per lo scafo dati o il tesseratto esterno)
                if (child.material && child.material.map && child.userData.isTesseract) {
                     child.material.map.offset.x = time * 0.1;
                }
            });
        });
    }

    update() {
        // Se è deragliato, applica fisica di caduta libera
        if (this.isDerailing) {
            this.wagons.forEach(w => {
                // Applica il momento iniziale (spinta laterale)
                w.container.position.add(this.derailMomentum);
                
                // GRAVITÀ ACCELERATA
                // Spostiamo la y in giù progressivamente
                this.derailMomentum.y -= 0.02; 
                
                // Rotazione caotica su tutti gli assi
                w.container.rotation.x += 0.05;
                w.container.rotation.z += 0.03;
                w.container.rotation.y += 0.01;
            });
            
            // Restituiamo sempre la posizione del primo vagone (Locomotiva) per la camera
            return { 
                crashed: true, 
                reason: "DERAGLIATO!", 
                position: this.wagons[0].container.position 
            };
        }


        // Aggiorna posizione sul binario
        this.pressure += (this.targetPressure - this.pressure) * 0.02; // 0.01 determina quanto ci mette a salire

        // 2. Il target scende pianissimo (consumo carbone)
        if(this.targetPressure > 0) this.targetPressure -= 0.0005;

        // 3. La velocità è spinta dalla pressione
        // Più pressione = più accelerazione. 
        this.speed += this.pressure * 0.00015;


        this.speed *= 0.95; // Attrito
        this.progress += this.speed;
        
        let lapCompleted = false;
        
        // Se il progresso supera 1, torniamo a 0 e segnaliamo il giro
        if(this.progress >= 1) {
            this.progress = this.progress % 1; // Mantieni il resto per fluidità
            lapCompleted = true;
        }


        // --- CALCOLO FISICA CURVA ---
        
        // 1. Calcoliamo la curvatura e la direzione
        const pNow = this.curve.getPointAt(this.progress);
        const pNext = this.curve.getPointAt((this.progress + 0.005) % 1); // Lookahead
        
        const tan = this.curve.getTangentAt(this.progress);
        const tanNext = this.curve.getTangentAt((this.progress + 0.005) % 1);
        
        // Calcolo vettore Curvatura
        // Se il binario curva a sinistra, il vettore curvatura punta a sinistra
        const curvatureVec = tanNext.clone().sub(tan).normalize();
        
        // Calcolo direzione laterale locale (Destra del treno)
        const up = new THREE.Vector3(0, 1, 0);
        const rightVec = new THREE.Vector3().crossVectors(tan, up).normalize();
        
        // Prodotto scalare per capire se curviamo a Dx o Sx
        // Dot > 0: Curva a Destra (Forza centrifuga a Sinistra)
        // Dot < 0: Curva a Sinistra (Forza centrifuga a Destra)
        const curvatureDir = curvatureVec.dot(rightVec); 
        
        // Magnitudo della curvatura (approssimata dall'angolo tra tangenti)
        const angleDelta = tan.angleTo(tanNext);
        const curvatureStrength = angleDelta * 100; // Fattore arbitrario

        // 2. Forza Centrifuga (F = m * v^2 * r)
        // Spinge verso l'esterno della curva
        // Segno: + spinge a Destra, - spinge a Sinistra
        const centrifugalForce = (this.speed * 800) ** 2 * curvatureStrength * Math.sign(-curvatureDir);

        // 3. Applicazione Fisica su ogni vagone
        let maxTilt = 0;

        this.wagons.forEach((w, i) => {
            // Ritardo calcolo posizione per vagone
            let wProg = this.progress - w.offset;
            if(wProg < 0) wProg += 1;
            
            const wPos = this.curve.getPointAt(wProg);
            const wTan = this.curve.getTangentAt(wProg);

            w.container.position.copy(wPos);
            w.container.lookAt(wPos.clone().add(wTan));

            // --- SIMULAZIONE RIBALTAMENTO ---
            
            // Forza laterale relativa a questo vagone (assumiamo simile alla loco per semplicità
            // ma idealmente andrebbe calcolata sulla posizione del vagone)
            // Usiamo la forza globale calcolata sopra, ma potremmo modularla con oscillazioni
            
            const gForce = centrifugalForce * 0.03; // Scaling factor per il gioco
            
            // Coppia torcente (Torque)
            // Torque Centrifuga = Forza * Altezza Baricentro
            // Torque Gravità = Massa * G * (metà larghezza scartamento) - Momento raddrizzante
            
            // Semplificazione per gameplay:
            // w.angle è l'angolo di rotazione Z (rollio)
            // Cerchiamo un "angolo di equilibrio" dove Forza Lat = Forza Peso proiettata
            
            const targetAngle = gForce; // L'angolo a cui il treno VORREBBE stare data la velocità
            
            // Inerzia: il treno non scatta subito all'angolo, ci arriva
            w.angle += (targetAngle - w.angle) * 0.1; 

            // --- LOGICA DEL PIVOT (SOLLEVAMENTO RUOTA) ---
            // Se w.angle > 0 (Treno spinto a destra) -> Ruota attorno alla rotaia DESTRA
            // Se w.angle < 0 (Treno spinto a sinistra) -> Ruota attorno alla rotaia SINISTRA
            
            const halfTrack = this.trackWidth / 2;
            
            if (w.angle > 0.01) {
                // Ribaltamento verso destra -> Perno su (halfTrack, 0, 0)
                // Spostiamo la mesh a sinistra del pivot, ruotiamo il pivot, compensiamo visivamente
                w.pivot.position.set(halfTrack, 0, 0); 
                w.mesh.position.set(-halfTrack, 0, 0); 
            } else if (w.angle < -0.01) {
                // Ribaltamento verso sinistra -> Perno su (-halfTrack, 0, 0)
                w.pivot.position.set(-halfTrack, 0, 0);
                w.mesh.position.set(halfTrack, 0, 0);
            } else {
                // Piatto
                w.pivot.position.set(0,0,0);
                w.mesh.position.set(0,0,0);
            }
            
            // Applica rotazione
            w.pivot.rotation.z = -w.angle; // Negativo perché ThreeJS Z rotation rule

            // --- CONTROLLO DERAGLIAMENTO ---
            // Se l'angolo supera ~45 gradi (0.8 rad), il baricentro è fuori -> Cade
            if (Math.abs(w.angle) > 0.8) {
                this.isDerailing = true;
                // Calcoliamo il vettore di lancio basato sulla tangente e forza laterale
                this.derailMomentum = wTan.clone().cross(new THREE.Vector3(0,1,0))
                    .multiplyScalar(Math.sign(w.angle) * this.speed * 10); // Lancia a lato
            }
            
            if (Math.abs(w.angle) > Math.abs(maxTilt)) maxTilt = w.angle;
        });
        
        // --- ANIMAZIONE FUMO E PROPELLERI ---
        this.animateProps();
        // Fumo Loco
        const chimneyWorld = this.locoRef.mesh.localToWorld(new THREE.Vector3(0, 5, 2.5));
        this.smoke.emit(chimneyWorld, this.pressure);
        this.smoke.update();

        return { 
            crashed: false, 
            speed: this.speed, 
            pressure: this.pressure,
            tilt: maxTilt, 
            position: pNow,
            lapComplete: lapCompleted // NUOVO RETURN
        };
    }
}