const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/playground.js'), 'utf8');

// Run the shared navigation with a minimal DOM; no WebGL or network required.
function setup(page = '/', touch = true, storage = new Map()) {
  const elements = [], handlers = new Map(), navigations = [];
  class Element {
    constructor(tag) {this.tagName = tag.toUpperCase(); this.children = new Map(); this.dataset = {}; this.open = false; this.classList = {add(){},remove(){}}; elements.push(this);}
    setAttribute() {}
    append() {}
    addEventListener() {}
    querySelector(selector) {if (!this.children.has(selector)) this.children.set(selector, new Element('div')); return this.children.get(selector);}
    showModal() {this.open = true;}
    close() {this.open = false;}
  }
  const document = {
    title:'Test · Playground', body:new Element('body'), currentScript:{src:'https://example.test/assets/playground.js'},
    documentElement:{hasAttribute:()=>false}, createElement:tag=>new Element(tag),
    addEventListener:(name,handler)=>handlers.set(name,handler)
  };
  const location = new URL(page, 'https://example.test'); location.assign = url => navigations.push(url);
  vm.runInNewContext(source, {URL, document, location, window:{addEventListener(){}},
    matchMedia:()=>({matches:touch}), setTimeout:()=>1, clearTimeout(){}, requestAnimationFrame:callback=>callback(),
    sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}});
  return {
    navigations, storage,
    get warning() {return elements.find(element=>element.id === 'pg-desktop-warning');},
    direct() {handlers.get('DOMContentLoaded')();},
    click(url, extra = {}) {
      const link = {href:new URL(url,location).href, dataset:{}};
      const event = {target:{closest:()=>link}, button:0, preventDefault(){this.defaultPrevented = true;}, ...extra};
      handlers.get('click')(event); return event;
    }
  };
}
const desktopPaths = ['games/starship-adventure/', 'games/procedural-worlds/procedural-world-cartoon-generator.html', 'games/procedural-worlds/procedural-world-cube.html'];
for (const target of desktopPaths) {
  test(`Touch link warns before navigation: ${target}`, () => {
    const app = setup(); app.click(target);
    assert.equal(app.warning.open, true); assert.equal(app.navigations.length, 0);
    app.warning.querySelector('[data-action="back"]').onclick();
    assert.equal(app.warning.open, false); assert.equal(app.navigations.length, 0);
    app.click(target); app.warning.querySelector('[data-action="try"]').onclick();
    assert.equal(app.warning.open, false); assert.deepEqual(app.navigations, ['https://example.test/'+target]);
  });
  test(`Direct mobile access warns: ${target}`, () => {
    const app = setup('/'+target); app.direct(); assert.equal(app.warning.open, true);
    app.warning.querySelector('[data-action="back"]').onclick();
    assert.deepEqual(app.navigations, ['https://example.test/index.html']);
  });
  test(`Desktop access stays unimpeded: ${target}`, () => {
    const app = setup('/',false); app.click(target); assert.equal(app.warning, undefined); assert.equal(app.navigations.length,1);
    const direct = setup('/'+target,false); direct.direct(); assert.equal(direct.warning, undefined);
  });
}
for (const target of ['games/lagoondrift/', 'games/transmundi/']) {
  test(`Touch-enabled game has no warning: ${target}`, () => {
    const app = setup(); app.click(target); assert.equal(app.warning, undefined); assert.equal(app.navigations.length,1);
    const direct = setup('/'+target); direct.direct(); assert.equal(direct.warning, undefined);
  });
}
test('Direct index alias and query parameters are covered', () => {
  const app = setup('/games/starship-adventure/index.html?test=1#game'); app.direct(); assert.equal(app.warning.open,true);
  app.warning.querySelector('[data-action="try"]').onclick(); assert.equal(app.warning.open,false); assert.equal(app.navigations.length,0);
});
test('New-tab clicks keep native behavior; the destination handles its own warning', () => {
  const app = setup(); const event = app.click('games/starship-adventure/',{ctrlKey:true});
  assert.equal(event.defaultPrevented,undefined); assert.equal(app.warning,undefined);
});
test('Escape dismisses the link warning without navigating', () => {
  const app = setup(); app.click('games/starship-adventure/');
  app.warning.oncancel({preventDefault(){}}); assert.equal(app.warning.open,false); assert.equal(app.navigations.length,0);
});
test('Continuing from the catalog skips only the next destination warning', () => {
  const app = setup(); app.click('games/starship-adventure/');
  app.warning.querySelector('[data-action="try"]').onclick();
  const destination = setup('/games/starship-adventure/',true,app.storage); destination.direct();
  assert.equal(destination.warning,undefined);
  const laterVisit = setup('/games/starship-adventure/',true,app.storage); laterVisit.direct();
  assert.equal(laterVisit.warning.open,true);
});
