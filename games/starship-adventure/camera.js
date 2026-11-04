function switchCameraView() {
    // Aggiungiamo questa variabile globale all'inizio del file JavaScript:
    // let cameraMode = 0; // 0 = dietro, 1 = cockpit, 2 = visuale dall'alto, 3 = libera

    // Incrementa la modalità della camera e resetta se supera il massimo
    cameraMode = (cameraMode + 1) % 4;

    // Aggiorna il testo della modalità camera
    updateCameraText();
}

// Funzione per aggiornare la posizione della camera in base alla modalità
function updateCamera() {
    switch (cameraMode) {
        case 0: // Visuale da dietro (default)
            camera.position.set(
                spaceship.position.x - direction.x * 15,
                spaceship.position.y + 10,
                spaceship.position.z - direction.z * 15
            );
            camera.lookAt(spaceship.position);
            break;

        case 1: // Visuale cockpit (prima persona)
            // Posiziona la camera leggermente davanti alla navicella nella direzione di movimento
            const cockpitPos = spaceship.position.clone().add(direction.clone().multiplyScalar(3));
            cockpitPos.y += 0.5; // Leggermente sopra per simulare la cabina di pilotaggio
            camera.position.copy(cockpitPos);

            // Guarda nella direzione di movimento
            const lookAtPos = spaceship.position.clone().add(direction.clone().multiplyScalar(100));
            camera.lookAt(lookAtPos);
            break;

        case 2: // Visuale dall'alto
            camera.position.set(
                spaceship.position.x,
                spaceship.position.y + 30,
                spaceship.position.z
            );
            camera.lookAt(spaceship.position);
            break;

        case 3: // Visuale libera/laterale
            // Calcola una posizione laterale rispetto alla navicella
            const rightVector = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
            camera.position.set(
                spaceship.position.x + rightVector.x * 20,
                spaceship.position.y + 5,
                spaceship.position.z + rightVector.z * 20
            );
            camera.lookAt(spaceship.position);
            break;
    }
}

// Funzione per aggiornare il testo della modalità camera
function updateCameraText() {
    const cameraNames = ["Posteriore", "Cockpit", "Dall'alto", "Laterale"];
    document.getElementById('cameraMode').textContent = cameraNames[cameraMode];
}

function checkPlanetaryInfluence() {
    // Pulisci lo stato attuale
    let closestPlanet = null;
    let closestDistance = Infinity;
    let canOrbit = false;
    let optimalOrbitApproach = false;

    // Controlla ogni pianeta
    for (let planet of planets) {
        const distance = new THREE.Vector3().subVectors(planet.position, spaceship.position).length();

        // Trova il pianeta più vicino
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPlanet = planet;
        }

        // Ottieni il vettore dalla navicella al pianeta
        const toPlanet = new THREE.Vector3().subVectors(planet.position, spaceship.position).normalize();

        // Calcola l'angolo tra la direzione di movimento e il vettore verso il pianeta
        const angleToOrbit = direction.clone().angleTo(toPlanet);

        // Converti in gradi
        const angleInDegrees = angleToOrbit * (180 / Math.PI);

        // Verifica se siamo nella zona orbitale e ci stiamo avvicinando quasi perpendicolarmente
        // (angoli tra 70° e 110° sono considerati buoni per l'orbita - perpendicolari al pianeta)
        const isApproachingCorrectly = (angleInDegrees > 70 && angleInDegrees < 110);

        // Verifica se possiamo entrare in orbita (siamo nella zona orbitale)
        if (distance < planet.orbitRadius * 3 && distance > planet.orbitRadius) {
            canOrbit = true;

            // Controlla se la velocità è appropriata per l'orbita
            // (ogni pianeta richiede una velocità specifica basata sulla sua massa)
            const optimalVelocity = planet.mass / 100; // Velocità ottimale proporzionale alla massa
            const velocityIsInRange = Math.abs(currentSpeed - optimalVelocity) < 0.5;

            // Per entrare in orbita, dobbiamo avere sia l'angolo corretto che la velocità giusta
            optimalOrbitApproach = isApproachingCorrectly && velocityIsInRange;
        }

        // Se siamo troppo vicini, attrazione gravitazionale
        if (distance < planet.orbitRadius) {
            const direction = new THREE.Vector3().subVectors(planet.position, spaceship.position).normalize();
            const forceMagnitude = (planet.mass / (distance * distance)) * 0.00003;

            // Aggiungi la forza gravitazionale
            velocity.add(direction.multiplyScalar(forceMagnitude));

            // Se siamo troppo vicini, game over
            if (distance < planet.geometry.parameters.radius + 2) {
                velocity.set(0, 0, 0);
                currentSpeed = 0;
                alert(`Sei stato catturato dalla gravità di ${planet.name}!`);
                resetGame();
                return;
            }
        }
    }

    // Aggiorna lo stato dell'interfaccia
    let statusText = "Navigazione libera";

    // Se stiamo orbitando
    if (orbitingPlanet) {
        statusText = `In orbita attorno a ${orbitingPlanet.name}`;

        // Controlla se siamo usciti dall'orbita (troppo distanti)
        const orbitDistance = new THREE.Vector3().subVectors(orbitingPlanet.position, spaceship.position).length();
        if (orbitDistance > orbitingPlanet.orbitRadius * 3.5) {
            orbitingPlanet = null;
            // Mantieni la velocità attuale quando esci dall'orbita
        }
        // Se premiamo spazio o C durante l'orbita, usciamo dall'orbita
        else if (keys.space || keys.c) {
            orbitingPlanet = null;
            // Dai una piccola velocità nella direzione attuale della navicella
            direction = new THREE.Vector3(
                spaceship.position.x - orbitingPlanet.position.x,
                spaceship.position.y - orbitingPlanet.position.y,
                spaceship.position.z - orbitingPlanet.position.z
            ).normalize();
            currentSpeed = 0.8;
        }
    }
    // Se non stiamo orbitando ma possiamo entrare in orbita
    else if (canOrbit && closestDistance < closestPlanet.orbitRadius * 2.5) {
        if (optimalOrbitApproach) {
            statusText = `Condizioni orbitali ottimali per ${closestPlanet.name} (Premi O)`;
        } else {
            statusText = `Vicino a ${closestPlanet.name} - Orbita possibile`;
        }

        // Se premiamo O E le condizioni sono ottimali, entriamo in orbita
        if (keys.o && optimalOrbitApproach) {
            orbitingPlanet = closestPlanet;
            orbitAngle = Math.atan2(
                spaceship.position.z - orbitingPlanet.position.z,
                spaceship.position.x - orbitingPlanet.position.x
            );
        }
    }
    // Se siamo vicini a un pianeta ma non abbastanza per orbitare
    else if (closestDistance < closestPlanet.orbitRadius * 4) {
        statusText = `Vicino a ${closestPlanet.name}`;
    }

    document.getElementById('status').textContent = statusText;
}
