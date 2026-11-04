(() => {
  'use strict';
  // Resolve from this script, so previews in a subfolder work without rewrites.
  const root = new URL('../', document.currentScript.src);
  const home = new URL('index.html', root);
  const games = [
    ['Lagoon Drift', 'games/lagoondrift/'],
    ['Iron & Aether', 'games/transmundi/'],
    ['Space Explorer', 'games/starship-adventure/'],
    ['Cartoon World Generator', 'games/procedural-worlds/procedural-world-cartoon-generator.html'],
    ['Cube World', 'games/procedural-worlds/procedural-world-cube.html']
  ];
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
    [['← Tutti i giochi', 'index.html'], ...games].forEach(([name, path]) => {
      const link = document.createElement('a'); link.href = new URL(path, root).href;
      link.textContent = name; link.dataset.pgTitle = name;
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
    leaving = true;
    show(link.dataset.pgTitle || 'Si riparte!');
    requestAnimationFrame(() => requestAnimationFrame(() => location.assign(url.href)));
  });
  // The browser may restore a page with its departure overlay still visible.
  window.addEventListener('pageshow', event => {
    leaving = false;
    if (event.persisted) {show('Bentornato!'); requestAnimationFrame(() => requestAnimationFrame(hide));}
  });
})();
