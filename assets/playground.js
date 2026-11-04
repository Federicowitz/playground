(() => {
  'use strict';
  // Resolve from this script, so previews in a subfolder work without rewrites.
  const root = new URL('../', document.currentScript.src);
  const home = new URL('index.html', root);
  const games = [
    ['Lagoon Drift', 'games/lagoondrift/'],
    ['Iron & Aether', 'games/transmundi/'],
    ['Space Explorer', 'games/starship-adventure/', true],
    ['Cartoon World Generator', 'games/procedural-worlds/procedural-world-cartoon-generator.html', true],
    ['Cube World', 'games/procedural-worlds/procedural-world-cube.html', true]
  ];
  const touchOnly = () => matchMedia('(pointer: coarse) and (hover: none)').matches;
  const desktopGame = url => games.find(([, path, desktop]) => {
    const target = new URL(path, root);
    return desktop && url.origin === target.origin && url.pathname.replace(/index\.html$/, '') === target.pathname;
  });
  let warning;
  function warnDesktop(name, proceed, cancel) {
    if (warning?.open) return;
    if (!warning) {
      warning = document.createElement('dialog');
      warning.id = 'pg-desktop-warning';
      warning.setAttribute('aria-labelledby', 'pg-warning-title');
      warning.setAttribute('aria-describedby', 'pg-warning-description');
      warning.innerHTML = '<h2 id="pg-warning-title">Qui servono mouse e tastiera</h2><p id="pg-warning-description"></p><div class="pg-warning-actions"><button type="button" data-action="back" autofocus>Torna indietro</button><button type="button" data-action="try">Prova comunque</button></div>';
      ['pointerdown', 'keydown', 'keyup'].forEach(type => warning.addEventListener(type, event => event.stopPropagation()));
      document.body.append(warning);
    }
    warning.querySelector('p').textContent = `${name} non ha ancora controlli touch. Ti consigliamo di aprirlo da computer; da telefono o tablet potresti non riuscire a giocare.`;
    const dismiss = () => {warning.close(); cancel?.();};
    warning.querySelector('[data-action="back"]').onclick = dismiss;
    warning.querySelector('[data-action="try"]').onclick = () => {warning.close(); proceed();};
    warning.oncancel = event => {event.preventDefault(); dismiss();};
    warning.showModal();
  }
  const loader = document.createElement('div');
  loader.id = 'pg-loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  loader.innerHTML = `<div class="pg-loading-box"><span class="pg-loading-mark" aria-hidden="true">✦</span><h2></h2><p>Un attimo, prepariamo il prossimo mondo.</p><div class="pg-loading-track" aria-hidden="true"></div><div class="pg-loading-actions" hidden><a href="">Riprova</a><a class="pg-home">Torna al Playground</a></div></div>`;
  document.body.append(loader);
  ['pointerdown', 'keydown', 'keyup'].forEach(type => loader.addEventListener(type, event => event.stopPropagation()));
  loader.querySelector('.pg-home').href = home.href;
  const title = loader.querySelector('h2');
  title.textContent = location.pathname === root.pathname || location.pathname === home.pathname ? 'Benvenuto al Playground' : document.title.split(' · ')[0];
  let timer, leaving = false;
  const slow = () => {
    loader.querySelector('p').textContent = 'Ci stiamo mettendo più del previsto. Puoi attendere, riprovare o tornare al catalogo.';
    loader.querySelector('.pg-loading-actions').hidden = false;
  };
  const show = text => {
    clearTimeout(timer);
    title.textContent = text;
    loader.querySelector('p').textContent = 'Un attimo, prepariamo il prossimo mondo.';
    loader.querySelector('.pg-loading-actions').hidden = true;
    loader.hidden = false;
    loader.classList.remove('pg-leaving');
    timer = setTimeout(slow, 15000);
  };
  const hide = () => {
    clearTimeout(timer);
    loader.classList.add('pg-leaving');
    setTimeout(() => { if (!leaving) loader.hidden = true; }, 300);
  };
  timer = setTimeout(slow, 15000);
  let failed = false, loaded = false, ready = !document.documentElement.hasAttribute('data-pg-manual-ready');
  const finish = () => { if (loaded && ready && !failed) requestAnimationFrame(() => requestAnimationFrame(hide)); };
  window.addEventListener('load', () => { loaded = true; finish(); }, {once:true});
  window.addEventListener('playground:ready', () => { ready = true; finish(); });
  window.addEventListener('playground:error', () => { failed = true; clearTimeout(timer); slow(); });
  window.addEventListener('error', event => {
    if (!loader.hidden && (event.error || event.target?.tagName === 'SCRIPT')) {
      failed = true; clearTimeout(timer); slow();
    }
  }, true);
  if (location.pathname !== root.pathname && location.pathname !== home.pathname) {
    const nav = document.createElement('details');
    nav.id = 'pg-nav';
    const summary = document.createElement('summary');
    summary.textContent = '✦ Playground';
    const links = document.createElement('nav');
    links.className = 'pg-links'; links.setAttribute('aria-label', 'Cambia gioco');
    [['← Tutti i giochi', 'index.html'], ...games].forEach(([name, path, desktop]) => {
      const link = document.createElement('a'); link.href = new URL(path, root).href;
      link.textContent = name; link.dataset.pgTitle = name;
      if (desktop) {
        const badge = document.createElement('small'); badge.className = 'pg-desktop-badge'; badge.textContent = 'Desktop'; link.append(' ', badge);
      }
      const targetPath = new URL(link.href).pathname;
      if (targetPath === location.pathname || targetPath + 'index.html' === location.pathname) link.setAttribute('aria-current', 'page');
      links.append(link);
    });
    nav.append(summary, links); document.body.append(nav);
    nav.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Escape') {nav.open = false; summary.focus();} });
    ['pointerdown', 'keyup'].forEach(type => nav.addEventListener(type, event => event.stopPropagation()));
    document.addEventListener('pointerdown', event => {if (!nav.contains(event.target)) nav.open = false;});
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.download || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
    event.preventDefault(); if (leaving) return;
    const navigate = () => {
      if (leaving) return;
      leaving = true;
      show(link.dataset.pgTitle || 'Si riparte!');
      requestAnimationFrame(() => requestAnimationFrame(() => location.assign(url.href)));
    };
    const desktop = desktopGame(url);
    if (touchOnly() && desktop) warnDesktop(desktop[0], () => {
      // One-use acknowledgment prevents a second prompt on the destination.
      try { sessionStorage.setItem('pg-touch-approved', desktop[1]); } catch {}
      navigate();
    });
    else navigate();
  });
  // Covers direct URLs, new tabs and links opened without the catalog.
  document.addEventListener('DOMContentLoaded', () => {
    const desktop = desktopGame(new URL(location.href));
    let approved;
    try {
      approved = sessionStorage.getItem('pg-touch-approved');
      sessionStorage.removeItem('pg-touch-approved');
    } catch {}
    if (touchOnly() && desktop && approved !== desktop[1]) warnDesktop(desktop[0], () => {}, () => location.assign(home.href));
  }, {once:true});
  // The browser may restore a page with its departure overlay still visible.
  window.addEventListener('pageshow', event => {
    leaving = false;
    if (event.persisted) {show('Bentornato!'); requestAnimationFrame(() => requestAnimationFrame(hide));}
  });
})();
