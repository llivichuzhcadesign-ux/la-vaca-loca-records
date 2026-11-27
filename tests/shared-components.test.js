const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const header=read('ios-header.js'),css=read('site-theme.header.css'),cursor=read('site-cursor.js'),cursorCss=read('site-cursor.css');
assert.match(header,/lvl-header-ready/);
assert.match(header,/if\(!header\.classList\.contains\('lvl-tabs-fit'\)\)brand\.setAttribute\('aria-expanded'/);
assert.match(header,/aria-labelledby','lvlFavoritesTitle/);
assert.match(css,/lvl-header-ready:not\(\.lvl-tabs-fit\):not\(\.lvl-nav-measuring\)/);
assert.match(css,/flex:0 0 var\(--lvl-target,44px\)/);
assert.match(cursor,/clearTarget\(\);root\.classList\.remove/);
assert.match(cursorCss,/\.lvl-cursor-active \.lvl-cursor-target/);
assert.doesNotMatch(cursorCss,/\.lvl-cursor-active body \*/);
assert.match(read('bag.js'),/Tu bolsa/);
assert.match(read('visitanos.css'),/min-height:max\(46px,var\(--lvl-target,44px\)\)/);
for(const page of ['index.html','discos.html','sessions.html','archivo.html','visitanos.html']){const html=read(page);assert.match(html,/site-theme\.header\.css\?v=20261126-components-v1/);assert.match(html,/site-cursor\.js\?v=20261126-qa-v1/);}
for(const js of ['ios-header.js','site-cursor.js','bag.js'])new Function(read(js));
console.log('PASS: adaptive shared header, favorites accessibility, scoped cursor and consistent public controls');
