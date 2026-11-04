# Iron & Aether

Gioco ferroviario 3D in JavaScript e Three.js, senza fase di compilazione.

Aprire `index.html` attraverso un server HTTP statico. Three.js viene caricato da unpkg e richiede una connessione Internet.

## Deposito

Selezionare una delle nove locomotive, scegliere un codice mondo oppure disegnare/importare una mappa, scegliere 3, 6 o 12 vagoni e premere Partenza. Le varianti del convoglio cambiano locomotiva e vagoni; condividono la stessa fisica.

Spazio aggiunge carbone, S o freccia giù aziona il freno. I record vengono salvati nel browser.

Sui dispositivi touch, durante la partita compaiono due pulsanti laterali: Carbone a sinistra e Freno a destra. Ogni tocco aziona il comando corrispondente. Sono disponibili sia in verticale sia in orizzontale, senza blocco dell’orientamento.

I modelli originali `.txt` sono conservati come riferimenti. Il gioco importa le corrispondenti versioni `.js`; `src/Depot.js` contiene il catalogo e la presentazione.
