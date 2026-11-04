import * as THREE from 'three';

export class SmokeSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        
        // Geometria semplice
        const geometry = new THREE.IcosahedronGeometry(1, 0);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x888888, // Grigio scuro base
            transparent: true, 
            opacity: 0.0 
        });
        
        // Pool di particelle aumentato per gestire fumo denso
        for(let i=0; i<80; i++) {
            const mesh = new THREE.Mesh(geometry, material.clone()); // Materiale clonato per gestire opacità singole
            mesh.visible = false;
            this.scene.add(mesh);
            this.particles.push({ mesh: mesh, life: 0, active: false, velocity: new THREE.Vector3() });
        }
    }

    emit(position, pressure) {
        // Se non c'è pressione, niente fumo
        if(pressure <= 0.0005) return;

        // La frequenza di emissione dipende dalla pressione
        // Pressione 1.0 = emette quasi sempre. Pressione 0.1 = emette raramente.
        if(Math.random() > pressure*10) return;

        const p = this.particles.find(p => !p.active);
        if(p) {
            p.active = true;
            p.life = 1.0;
            p.mesh.visible = true;
            p.mesh.position.copy(position);
            
            // Dimensione iniziale dipende dalla pressione
            const startScale = 0.5 + pressure * 0.5;
            p.mesh.scale.set(startScale, startScale, startScale);
            
            // Colore: più pressione = fumo più scuro/nero
            const gray = 0.8 - (pressure * 0.6); // Da 0.8 (grigio chiaro) a 0.2 (grigio scuro)
            p.mesh.material.color.setScalar(gray);
            p.mesh.material.opacity = 0.4 + (pressure * 0.4);

            // Velocità di espulsione
            p.velocity.set(
                (Math.random() - 0.5) * 0.5,
                0.2 + (pressure * 0.8), // Più pressione = spinta verticale più forte
                (Math.random() - 0.5) * 0.5
            ); 
        }
    }

    update() {
        this.particles.forEach(p => {
            if(p.active) {
                p.life -= 0.01; // Durata fumo
                p.mesh.position.add(p.velocity);
                
                // Espansione fumo
                const s = p.mesh.scale.x + 0.05;
                p.mesh.scale.set(s, s, s);
                
                // Fade out
                p.mesh.material.opacity = p.life * 0.5;

                if(p.life <= 0) {
                    p.active = false;
                    p.mesh.visible = false;
                }
            }
        });
    }
}