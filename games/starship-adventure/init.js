// ---- Configurazione di base ----
let scene, camera, renderer;
let spaceship;
let planets = [];
let energy = 100;
let velocity = new THREE.Vector3(0, 0, 0);
let direction = new THREE.Vector3(0, 0, -1); // Direzione iniziale (avanti)
let currentSpeed = 0;
let orbitingPlanet = null;
let orbitAngle = 0;
// Aggiungi queste variabili globali
let cameraMode = 0; // 0 = dietro, 1 = cockpit, 2 = visuale dall'alto, 3 = laterale
let orbitSpeed = null; // Velocità orbitale corrente
const lastKeys = { w: false, a: false, s: false, d: false, space: false, c: false }; // Per tracciare i cambiamenti di tasto

const MAX_ENERGY = 100;
const ENERGY_CONSUMPTION = 2;
const ENERGY_RECOVERY = 0.05;
const THRUST_POWER = 0.005;
const MAX_SPEED = 0.5;

// Minimap
let minimapCanvas, minimapContext;

// Controlli
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    c: false
};

function init() {
    // Scena, camera e renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.body.appendChild(renderer.domElement);

    // Minimap
    minimapCanvas = document.getElementById('minimapCanvas');
    minimapContext = minimapCanvas.getContext('2d');
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;

    // Luci
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Stelle (sfondo)
    createStars();

    // Navicella spaziale
    createSpaceship();

    // Pianeti
    createPlanets();

    // Posizione iniziale
    spaceship.position.set(0, 0, 50);
    camera.position.set(0, 10, 65);
    camera.lookAt(spaceship.position);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Avvia il loop di rendering
    animate();
}

// Creazione dello sfondo stellato
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const y = (Math.random() - 0.5) * 1000;
        const z = (Math.random() - 0.5) * 1000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Creazione della navicella spaziale migliorata
function createSpaceship() {
    spaceship = new THREE.Group();

    // Corpo principale
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.8, 3, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    spaceship.add(body);

    // Cabina di pilotaggio
    const cockpitGeometry = new THREE.SphereGeometry(0.6, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ color: 0x6699cc, flatShading: true, transparent: true, opacity: 0.8 });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0, 1.2);
    cockpit.rotation.x = Math.PI;
    spaceship.add(cockpit);

    // Pannelli solari
    const panelGeometry = new THREE.BoxGeometry(3, 0.05, 1);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff, flatShading: true });

    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-2, 0, 0);
    spaceship.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(2, 0, 0);
    spaceship.add(rightPanel);

    // Strutture di collegamento pannelli
    const connectorGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
    const connectorMaterial = new THREE.MeshPhongMaterial({ color: 0x666666, flatShading: true });

    const leftConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    leftConnector.position.set(-1.5, 0, 0);
    spaceship.add(leftConnector);

    const rightConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    rightConnector.position.set(1.5, 0, 0);
    spaceship.add(rightConnector);

    // Motori
    const engineGeometry = new THREE.CylinderGeometry(0.3, 0.5, 0.5, 8);
    const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true });

    const mainEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    mainEngine.position.set(0, 0, -1.7);
    mainEngine.rotation.x = Math.PI / 2;
    spaceship.add(mainEngine);

    // Motori laterali
    const sideEngineGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.3, 8);

    const leftEngine = new THREE.Mesh(sideEngineGeometry, engineMaterial);
    leftEngine.position.set(-0.7, 0, -1.5);
    leftEngine.rotation.x = Math.PI / 2;
    spaceship.add(leftEngine);

    const rightEngine = new THREE.Mesh(sideEngineGeometry, engineMaterial);
    rightEngine.position.set(0.7, 0, -1.5);
    rightEngine.rotation.x = Math.PI / 2;
    spaceship.add(rightEngine);

    // Antenne
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
    const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true });

    const antenna1 = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna1.position.set(0.3, 0.8, 0.5);
    spaceship.add(antenna1);

    const antenna2 = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna2.position.set(-0.3, 0.8, 0.5);
    spaceship.add(antenna2);

    scene.add(spaceship);
}

// Creazione dei pianeti
function createPlanets() {
    // Sole (al centro)
    const sunGeometry = new THREE.IcosahedronGeometry(15, 2); // Ingrandito da 10
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00, flatShading: true });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(20, 2000, 0);
    sun.mass = 100;
    sun.orbitRadius = 35; // Aumentato da 25
    sun.name = "Sole";
    planets.push(sun);
    scene.add(sun);

    // Pianeta blu (Terra)
    const planet1Geometry = new THREE.IcosahedronGeometry(9, 2); // Ingrandito da 6
    const planet1Material = new THREE.MeshPhongMaterial({ color: 0x3399ff, flatShading: true });
    const planet1 = new THREE.Mesh(planet1Geometry, planet1Material);
    planet1.position.set(-60, 10, -80);
    planet1.mass = 50;
    planet1.orbitRadius = 20; // Aumentato da 15
    planet1.name = "Terra";
    planets.push(planet1);
    scene.add(planet1);

    // Pianeta rosso (Marte)
    const planet2Geometry = new THREE.IcosahedronGeometry(7.5, 2); // Ingrandito da 5
    const planet2Material = new THREE.MeshPhongMaterial({ color: 0xff6666, flatShading: true });
    const planet2 = new THREE.Mesh(planet2Geometry, planet2Material);
    planet2.position.set(100, -20, -120);
    planet2.mass = 40;
    planet2.orbitRadius = 17; // Aumentato da 12
    planet2.name = "Marte";
    planets.push(planet2);
    scene.add(planet2);

    // Pianeta verde (Venere)
    const planet3Geometry = new THREE.IcosahedronGeometry(10.5, 2); // Ingrandito da 7
    const planet3Material = new THREE.MeshPhongMaterial({ color: 0x66cc66, flatShading: true });
    const planet3 = new THREE.Mesh(planet3Geometry, planet3Material);
    planet3.position.set(50, 30, 50);
    planet3.mass = 60;
    planet3.orbitRadius = 22; // Aumentato da 17
    planet3.name = "Venere";
    planets.push(planet3);
    scene.add(planet3);

    // Pianeta giallo (Saturno)
    const planet4Geometry = new THREE.IcosahedronGeometry(12, 2); // Ingrandito da 8
    const planet4Material = new THREE.MeshPhongMaterial({ color: 0xcccc66, flatShading: true });
    const planet4 = new THREE.Mesh(planet4Geometry, planet4Material);
    planet4.position.set(-100, -40, 80);
    planet4.mass = 70;
    planet4.orbitRadius = 25; // Aumentato da 20
    planet4.name = "Saturno";
    planets.push(planet4);
    scene.add(planet4);

    // Anello per Saturno
    const ringGeometry = new THREE.RingGeometry(15, 22, 32); // Ingrandito da 10,15
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xddddaa,
        flatShading: true,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planet4.add(ring);
}      
