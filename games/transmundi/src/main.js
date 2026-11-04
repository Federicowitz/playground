import { Game } from './Game.js';
import { setupDepot, loadTrain } from './Depot.js';
const game = new Game();
setupDepot();
let starting = false;
window.addEventListener('game-start', async (e) => {
    if(starting) return;
    starting = true;
    const button = document.getElementById('depart-button');
    button.disabled = true;
    button.textContent = 'APERTURA DEI BINARI…';
    try {
        const assets = await loadTrain(e.detail.trainId);
        await game.start(e.detail.wagons, e.detail.mapConfig, assets);
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
    } catch(error) {
        document.getElementById('dispatch-error').textContent = 'Partenza non riuscita. Controlla la mappa e riprova.';
        console.error(error);
    } finally { starting = false; button.disabled = false; button.textContent = 'PARTENZA  →'; }
});
function animate() { requestAnimationFrame(animate); game.update(); game.render(); }
animate();
