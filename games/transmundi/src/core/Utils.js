import { MathUtils } from 'three';

// Semplice funzione pseudo-randomica deterministica
export function pseudoRandom(x, z) {
    return Math.sin(x * 12.9898 + z * 78.233) * 43758.5453 - Math.floor(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);
}

// Genera un'altezza "liscia" per il terreno
export function getTerrainHeight(x, z) {
    const scale = 0.05;
    const y = Math.sin(x * scale) * Math.cos(z * scale) * 10 
            + Math.sin(x * scale * 0.5 + z * scale * 0.5) * 20;
    return y; // Altezza base
}


// NUOVO: Carica immagine e restituisce contesto canvas
export function loadImageData(url) {
    return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // Estrae tutti i pixel: [R, G, B, A, R, G, B, A, ...]
                const data = ctx.getImageData(0, 0, img.width, img.height);
                resolve({
                    width: img.width,
                    height: img.height,
                    data: data.data,
                    // Helper per ottenere pixel (x,y) normalizzati 0-1
                    getPixel: function(x, y) {
                        // Mappa coordinate mondo (-300 a 300) a coordinate immagine (0 a width)
                        // Assumiamo che la mappa sia 600x600 unità mondo
                        const mapSize = 600;
                        
                        // Normalizza x,z da mondo a 0..1
                        let u = (x / mapSize) + 0.5;
                        let v = (y / mapSize) + 0.5; // y qui è la Z del mondo

                        // Clamp
                        u = Math.max(0, Math.min(1, u));
                        v = Math.max(0, Math.min(1, v));

                        const px = Math.floor(u * (this.width - 1));
                        const py = Math.floor(v * (this.height - 1));

                        const index = (py * this.width + px) * 4;
                        return {
                            r: this.data[index],
                            g: this.data[index + 1],
                            b: this.data[index + 2],
                            a: this.data[index + 3]
                        };
                    }
                });
            };
        img.onerror = reject;
    });
}

export class SeededRandom {
    constructor(seedStr) {
        // Crea un hash numerico dalla stringa
        let seed = 123456;
        if (typeof seedStr === 'string') {
            for (let i = 0; i < seedStr.length; i++) {
                seed = Math.imul(31, seed) + seedStr.charCodeAt(i) | 0;
            }
        } else {
            seed = seedStr;
        }
        this.a = seed;
    }

    // Restituisce numero tra 0 e 1
    next() {
        this.a += 0x6D2B79F5;
        let t = this.a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Restituisce numero tra min e max
    range(min, max) {
        return min + this.next() * (max - min);
    }
}