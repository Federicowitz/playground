# Playground · Federico Lelli

Giochi e laboratori personali da provare nel browser. Sito statico HTML, CSS e JavaScript: nessuna compilazione richiesta.

## Pagine e URL

`index.html` resta la landing. Ogni gioco autonomo ha la propria cartella con un `index.html`, così un hosting statico può servirlo con un URL di cartella:

- `games/lagoondrift/` — esplorazione, relax e rafting a tempo; nato dall’ispirazione di uno sfondo desktop Windows.
- `games/transmundi/` — Iron & Aether, prototipo ferroviario single player nato per divertimento. Multiplayer 1vs1 su percorsi speculari: idea futura, non disponibile oggi.
- `games/starship-adventure/` — Space Explorer, prototipo di volo e orbite.
- `games/procedural-worlds/` — pagina di scelta per due laboratori nella stessa cartella. Ciascuno mantiene il proprio file HTML e un collegamento diretto dalla landing.

Il vecchio `games/lagoondrift/lagoondrift.html` rimanda alla nuova pagina senza interrompere i vecchi collegamenti. Sull’hosting definitivo si potrà sostituire con un redirect HTTP permanente.

## Navigazione e caricamento

`assets/playground.js` e `assets/playground.css` condividono schermata di attesa e menu Playground fra le pagine. Il menu in basso a destra permette di cambiare gioco o tornare alla landing. I link restano normali link HTML, anche per apertura in nuova scheda.

La landing non avvia né importa i giochi. Le copertine sono immagini statiche locali, caricate quando le card si avvicinano allo schermo; il 3D della hero è differito e si ferma fuori schermo. Il caricamento mostra un’attesa indeterminata, senza percentuali fittizie, e offre riprova/ritorno al catalogo dopo 15 secondi. Iron & Aether segnala quando la prima locomotiva è pronta. Il ripristino dalla cache del browser gestisce anche il ritorno Indietro.

Le copertine SVG in `assets/previews/` sono **illustrazioni provvisorie, non screenshot**. Sostituirle con schermate reali compresse dei cinque esperimenti e aggiornare `img` nel catalogo della landing. Le prove UI sono state interrotte dallo strumento browser; non tutti i flussi sono stati verificati visivamente.

## Modificare il catalogo

L’array `GAMES` dentro `index.html` contiene titolo, tipo, genere/stato, descrizione, URL e copertina. `game` indica un’esperienza giocabile; `project` un laboratorio. `soon: true` indica novità non ancora disponibili. Per aggiungere un’esperienza aggiornare anche il menu in `assets/playground.js` e `sitemap.xml`.

## Esecuzione e verifiche

Servire la cartella con un server HTTP statico; aprire i file con `file://` non basta per i moduli dei giochi. Three.js e alcuni font arrivano da CDN: serve Internet. Non avviare un server se non necessario per prove e chiuderlo sempre al termine.

Eseguire `node scripts/check.cjs` per verificare sintassi JavaScript, metadati e riferimenti locali. Il controllo non sostituisce prove WebGL, touch e gameplay su browser reali.

## Pubblicazione e posizionamento

La radice pubblica prevista è `https://playground.federicolelli.com/`: caricare qui il contenuto del repository, mantenendo le cartelle. L’hosting deve supportare gli indici di directory e il MIME JavaScript dei file `.js`. Non servono riscritture SPA.

Titoli, descrizioni, canonical, robots e sitemap sono predisposti per quel dominio. Nessuna pubblicazione o configurazione Search Console è stata eseguita. Prima del lancio: verificare URL pubblici e HTTPS, configurare Search Console e inviare la sitemap. Il posizionamento editoriale proposto è «giochi ed esperimenti personali per il browser», raccontando origine, meccaniche e stato reale dei progetti.

In Search Console, una proprietà Dominio già verificata per `federicolelli.com` comprende anche il sottodominio. Per seguirlo separatamente si può aggiungere una proprietà Prefisso URL `https://playground.federicolelli.com/`. Riferimento: [documentazione Google](https://support.google.com/webmasters/answer/34592?hl=it).

Git è locale; nessun repository remoto o invio a GitHub è configurato automaticamente.
