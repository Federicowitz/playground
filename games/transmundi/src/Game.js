import * as THREE from 'three';
import { MapGenerator } from './world/MapGenerator.js';
import { MapGeneratorImage } from './world/MapGeneratorImage.js';
import { Train } from './entities/Train.js';
import { Storage } from './core/Storage.js'; // NUOVO IMPORT

export class Game {
    constructor() {
        // ... (Costruttore invariato) ...
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xddeeff);
        this.scene.fog = new THREE.FogExp2(0xddeeff, 0.008); 

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
        
        const ambient = new THREE.AmbientLight(0x404040, 2); 
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(100, 200, 100);
        this.scene.add(sun);

        this.mapGen = null;
        this.train = null;
        this.isRunning = false;

        this.raceStarted = false;
        this.isDying = false; 
        this.startTime = 0;
        this.elapsedTime = 0;
        this.currentLap = 1;
        this.lapHistory = [];
        
        this.currentSession = { wagons: 3, mapConfig: null };
        this.currentMapId = "UNKNOWN"; // ID per lo storage

        window.addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
        });
        this.setupInput();
        
        this.miniCanvas = document.getElementById('minimap');
        this.miniCtx = this.miniCanvas.getContext('2d');
        this.miniCanvas.width = 200; 
        this.miniCanvas.height = 200;
        
        window.gameInstance = this; 
    }

    // ... (setupInput invariato) ...
    setupInput() {
        window.addEventListener('keydown', (e) => {
            if(!this.isRunning || !this.train || this.isDying) return;
            if(['Space', 'ArrowDown'].includes(e.code)) e.preventDefault();
            if(e.code === 'Space') this.train.addCoal();
            if(e.code === 'KeyS' || e.code === 'ArrowDown') this.train.brake();
        });
        const btnCoal = document.getElementById('btn-coal');
        const btnBrake = document.getElementById('btn-brake');
        if(btnCoal) btnCoal.addEventListener('click', () => { if(this.isRunning && !this.isDying) this.train?.addCoal() });
        if(btnBrake) btnBrake.addEventListener('click', () => { if(this.isRunning && !this.isDying) this.train?.brake() });
    }

    async start(wagons, mapConfig, trainAssets) {
        console.log("Avvio gioco...", mapConfig);
        
        this.currentSession = { wagons, mapConfig, trainAssets };

        // 1. DETERMINA ID MAPPA PER STORICO
        if (mapConfig.type === 'image') {
            // Genera hash dall'immagine
            this.currentMapId = Storage.generateImageHash(mapConfig.data);
        } else {
            // Usa il seed (o generane uno se manca)
            const seed = mapConfig.data || "DEFAULT_MAP";
            // Normalizziamo il seed in maiuscolo
            this.currentMapId = seed.toUpperCase(); 
            // Aggiorniamo il config per usare questo seed specifico se era random
            mapConfig.data = this.currentMapId; 
        }

        console.log("ID Mappa Corrente:", this.currentMapId);

        // RESET STATO
        this.isDying = false;
        this.raceStarted = false;
        this.isRunning = false; 
        this.totalElapsedTime = 0;
        this.currentLapTime = 0;
        this.currentLap = 1;
        this.lapHistory = [];
        
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('laps-panel').style.display = 'block';
        this.updateLapsUI();
        this.updateHUD(0, 0);

        // Reset Scena
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }
        
        const ambient = new THREE.AmbientLight(0x404040, 2); 
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(100, 200, 100);
        this.scene.add(sun);

        // Generazione Mappa
        if (mapConfig.type === 'image' && mapConfig.data) {
            this.mapGen = new MapGeneratorImage(this.scene);
            const success = await this.mapGen.generate(mapConfig.data);
            if (!success) {
                this.mapGen = new MapGenerator(this.scene);
                this.mapGen.generate("fallback");
                this.currentMapId = "FALLBACK";
            }
        } else {
            this.mapGen = new MapGenerator(this.scene);
            this.mapGen.generate(this.currentMapId);
        }

        if (!this.mapGen.trackCurve) return;

        this.createStartFinishLine();

        this.train = new Train(this.scene, this.mapGen.trackCurve, wagons, trainAssets);
        this.isRunning = true;
    }

    // ... (createStartFinishLine invariato) ...
    createStartFinishLine() {
        const pt = this.mapGen.trackCurve.getPointAt(0);
        const tan = this.mapGen.trackCurve.getTangentAt(0);
        const group = new THREE.Group();
        group.position.copy(pt);
        group.lookAt(pt.clone().add(tan));
        const poleGeo = new THREE.BoxGeometry(0.5, 8, 0.5);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const poleL = new THREE.Mesh(poleGeo, poleMat); poleL.position.set(-3, 4, 0);
        const poleR = new THREE.Mesh(poleGeo, poleMat); poleR.position.set(3, 4, 0);
        const bannerGeo = new THREE.BoxGeometry(7, 1, 0.2);
        const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, 7.5, 0);
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white'; ctx.fillRect(0,0,64,64);
        ctx.fillStyle = 'black'; ctx.fillRect(0,0,32,32); ctx.fillRect(32,32,32,32);
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        banner.material.map = tex;
        group.add(poleL, poleR, banner);
        this.scene.add(group);
    }

    update() {
        if((!this.isRunning && !this.isDying) || !this.train) return;

        const status = this.train.update();

        if(status.crashed) {
            if (!this.isDying) {
                this.isDying = true; 
                
                // SALVATAGGIO PUNTEGGIO
                const bestLap = this.lapHistory.length > 0 ? Math.min(...this.lapHistory) : 0;
                // Giri completati è currentLap - 1 (perché currentLap è quello in corso che non hai finito)
                const lapsCompleted = Math.max(0, this.currentLap - 1);
                
                const isRecord = Storage.saveScore(
                    this.currentMapId, 
                    this.totalElapsedTime, 
                    lapsCompleted, 
                    bestLap
                );

                setTimeout(() => {
                    this.isRunning = false; 
                    this.isDying = false;
                    this.showGameOverScreen(status.reason, isRecord);
                }, 2500);
            }
            this.camera.lookAt(status.position);
            return; 
        }
        
        if (!this.raceStarted && status.speed > 0.0001) {
            this.raceStarted = true;
            this.gameStartTime = Date.now();
            this.lapStartTime = Date.now();
        }

        if (this.raceStarted) {
            this.totalElapsedTime = Date.now() - this.gameStartTime;
            this.currentLapTime = Date.now() - this.lapStartTime;
        }

        if (status.lapComplete && this.raceStarted) {
            this.lapHistory.push(this.currentLapTime);
            this.currentLap++;
            this.lapStartTime = Date.now();
            this.currentLapTime = 0;
            this.updateLapsUI();
        }

        const tPos = status.position;
        this.camera.position.lerp(new THREE.Vector3(tPos.x + 30, tPos.y + 30, tPos.z + 30), 0.1);
        this.camera.lookAt(tPos);

        this.updateHUD(status.speed, status.pressure);
        this.drawMinimap(status.position);
    }

    showGameOverScreen(reason, isRecord) {
        document.getElementById('game-over').style.display = 'flex';
        document.getElementById('fail-reason').innerText = reason;
        
        const bestLap = this.lapHistory.length > 0 ? this.formatTime(Math.min(...this.lapHistory)) : "--:--";
        const lapsDone = Math.max(0, this.currentLap - 1);
        
        let html = `Giri Completati: ${lapsDone}<br>Tempo Totale: ${this.formatTime(this.totalElapsedTime)}<br>Miglior Giro: ${bestLap}`;
        
        if(isRecord) {
            html += `<br><strong style="color:gold; font-size:1.2em; text-shadow:0 0 10px gold;">🏆 NUOVO RECORD!</strong>`;
        }

        document.getElementById('final-time').innerHTML = html;
        
        // Al ritorno al menu, ricarichiamo i dati della UI per aggiornare il record visualizzato
        if(window.updateMenuUI) window.updateMenuUI(this.currentMapId);
    }

    retry() {
        this.start(this.currentSession.wagons, this.currentSession.mapConfig, this.currentSession.trainAssets);
    }

    goToMenu() {
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        
        this.isRunning = false;
        this.isDying = false;
        
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    formatTime(ms) {
        if (!ms) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centis = Math.floor((ms % 1000) / 10); 
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
    }

    // ... (updateLapsUI, updateHUD, drawMinimap RIMANGONO UGUALI) ...
    updateLapsUI() {
        const list = document.getElementById('laps-list');
        list.innerHTML = '';
        this.lapHistory.forEach((time, index) => {
            const div = document.createElement('div');
            div.className = 'lap-row';
            div.innerHTML = `<span>LAP ${index + 1}</span> <span class="lap-time">${this.formatTime(time)}</span>`;
            list.appendChild(div);
        });
        const currentDiv = document.createElement('div');
        currentDiv.className = 'lap-row current';
        currentDiv.id = 'current-lap-row';
        currentDiv.innerHTML = `<span>LAP ${this.currentLap}</span> <span class="lap-time">--:--.--</span>`;
        list.appendChild(currentDiv);
    }

    updateHUD(speed, pressure) {
        const maxSpeedRef = 0.006; 
        const speedPercent = Math.min((speed / maxSpeedRef) * 100, 100);
        const speedBar = document.getElementById('speed-bar');
        if(speedBar) {
            speedBar.style.width = speedPercent + '%';
            if(speedPercent > 85) speedBar.style.backgroundColor = 'red'; 
            else if(speedPercent > 50) speedBar.style.backgroundColor = '#ffaa00'; 
            else speedBar.style.backgroundColor = '#00ff00'; 
        }
        const pressurePercent = pressure * 100;
        const heatBar = document.getElementById('heat-bar'); 
        if(heatBar) {
            heatBar.style.width = pressurePercent + '%';
            if(pressure < 0.3) heatBar.style.backgroundColor = '#00aaff'; 
            else if(pressure < 0.75) heatBar.style.backgroundColor = '#ffaa00'; 
            else heatBar.style.backgroundColor = '#ff3300'; 
        }
        const speedVal = document.getElementById('speed-val');
        const pressureVal = document.getElementById('pressure-val');
        if(speedVal) speedVal.innerText = Math.round(speed * 75000) + " km/h"; 
        if(pressureVal) pressureVal.innerText = (pressure * 10).toFixed(1) + " Bar";

        const timerEl = document.getElementById('timer-val');
        const lapEl = document.getElementById('lap-val');
        if(timerEl) timerEl.innerText = this.formatTime(this.totalElapsedTime);
        if(lapEl) lapEl.innerText = this.currentLap;
        const currentLapRow = document.getElementById('current-lap-row');
        if (currentLapRow) {
            const timeSpan = currentLapRow.querySelector('.lap-time');
            if (timeSpan) timeSpan.innerText = this.formatTime(this.currentLapTime);
        }
    }

    drawMinimap(trainPos) {
        if(!this.mapGen || !this.mapGen.trackCurve) return;
        const ctx = this.miniCtx;
        const w = this.miniCanvas.width;
        const h = this.miniCanvas.height;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath();
        const points = this.mapGen.trackCurve.getPoints(50);
        points.forEach((p, i) => {
            const mx = (p.x / 600 + 0.5) * w;
            const my = (p.z / 600 + 0.5) * h;
            if(i===0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
        });
        ctx.stroke();
        const startP = this.mapGen.trackCurve.getPointAt(0);
        const sx = (startP.x / 600 + 0.5) * w;
        const sy = (startP.z / 600 + 0.5) * h;
        ctx.fillStyle = 'white'; ctx.fillRect(sx-2, sy-2, 4, 4);
        const tx = (trainPos.x / 600 + 0.5) * w;
        const ty = (trainPos.z / 600 + 0.5) * h;
        ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI*2); ctx.fill();
    }
}
