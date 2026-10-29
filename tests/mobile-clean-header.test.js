const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(require.resolve('../'+path),'utf8');

const css=read('site-theme.css');
const nav=read('ios-header.js');
const home=read('index.html');
const events=read('eventos.html');
const discs=read('discos.html');
const eventJs=read('eventos.js');
const discosJs=read('discos.js');
const bag=read('bag.js');

assert.match(css,/@media\(max-width:950px\)/);
assert.match(css,/html body header \.lvl-header-dropdown-kicker,/);
assert.match(css,/html body header \.lvl-header-nav-number,/);
assert.match(css,/html body header \.lvl-header-nav-arrow\{display:none!important\}/);
assert.match(css,/\.lvl-header-nav-title\{\s*font:600 12px\/1\.4 Arial/);
assert.match(css,/\.lvl-decorative-glyph\{display:none!important\}/);
assert.match(css,/\.lvl-mobile-link-text\{display:inline!important/);
assert.match(css,/\.lvl-header-dropdown nav a\[aria-current="page"\] \.lvl-header-nav-title/);
assert.match(nav,/brand\.addEventListener\('click',toggleMenu\)/);
assert.match(nav,/event\.key==='Escape'/);
assert.match(nav,/like\.innerHTML='<svg/);
assert.doesNotMatch(nav,/like\.textContent=saved\.has\(r\.id\)\?'♥':'♡'/);

assert.equal((home.match(/class="lvl-control-arrow"/g)||[]).length,4);
assert.equal((events.match(/class="lvl-control-arrow"/g)||[]).length,2);
assert.match(home,/class="lvl-mobile-link-text">Archivo/);
assert.match(discs,/id="libraryBack"[^>]*><svg class="lvl-control-arrow"/);
assert.doesNotMatch(discs,/>← Volver/);
assert.doesNotMatch(eventJs,/●/);
assert.doesNotMatch(eventJs,/mobile-event-arrow" aria-hidden="true">↗/);
assert.doesNotMatch(discosJs,/Consultar este disco ↗/);
assert.doesNotMatch(bag,/Ordenar por WhatsApp ↗/);

for(const file of ['app.js','bag.js','discos.js','editorial.js','eventos.js','ios-header.js']){
 new Function(read(file));
}
for(const file of ['site-theme.css','discos.css','eventos.css']){
 const source=read(file);
 assert.equal((source.match(/{/g)||[]).length,(source.match(/}/g)||[]).length,file+' balanced');
}
console.log('PASS: phone menu follows header styling; no text hearts or decorative arrows in phone UI; SVG controls and syntax valid');
