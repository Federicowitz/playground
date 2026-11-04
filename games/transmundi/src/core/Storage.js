export const Storage = {
    KEY: 'trans_siberian_scores_v1',

    // Ottiene tutti i dati
    getAll() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : {};
    },

    // Ottiene il record per una specifica mappa
    getRecord(mapId) {
        const all = this.getAll();
        return all[mapId] || null;
    },

    // Salva un nuovo punteggio (solo se è migliore)
    saveScore(mapId, totalTime, laps, bestLap) {
        const all = this.getAll();
        const current = all[mapId];

        // Se esiste già un record e il nuovo tempo totale è peggiore (più alto), non fare nulla
        // A meno che non abbiamo fatto più giri nello stesso tempo (improbabile)
        // Logica: Vince chi sopravvive di più o chi fa X giri in meno tempo?
        // Assumiamo Time Attack: A parità di giri (o se finisci), vince il tempo minore.
        // Ma qui è sopravvivenza: vince chi ha fatto PIÙ giri.
        
        let isNewRecord = false;

        if (!current) {
            isNewRecord = true;
        } else {
            // Logica Record: 
            // 1. Priorità ai Giri (chi ha fatto più giri è più bravo)
            // 2. A parità di giri, vince chi ha impiegato MENO tempo (se completati) o PIÙ tempo (se sopravvivenza)?
            // Facciamo semplice: Miglior tempo sul giro (Best Lap) e Maggior numero di giri totali.
            
            if (laps > current.laps) isNewRecord = true;
            else if (laps === current.laps && totalTime < current.totalTime) isNewRecord = true; // Più veloce a parità di giri
        }

        if (isNewRecord) {
            all[mapId] = {
                id: mapId,
                totalTime: totalTime,
                laps: laps,
                bestLap: bestLap,
                date: new Date().toISOString()
            };
            localStorage.setItem(this.KEY, JSON.stringify(all));
        }

        return isNewRecord;
    },

    // Genera un ID univoco per le immagini (Hash semplice)
    generateImageHash(dataUrl) {
        let hash = 0;
        if (dataUrl.length === 0) return hash;
        for (let i = 0; i < dataUrl.length; i++) {
            const char = dataUrl.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return "IMG_" + Math.abs(hash);
    }
};