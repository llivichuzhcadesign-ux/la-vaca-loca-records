const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');

// Header initializes on some pages before deferred content scripts.
const header=read('ios-header.js');
const from=header.indexOf('const availableRecords=');
const to=header.indexOf('let saved;',from);
assert.ok(from>=0&&to>from);
const state={SITE_CONTENT:{records:[]}};
const available=new Function('window',header.slice(from,to)+';return availableRecords;')(state);
assert.equal(available().length,0);
state.SITE_CONTENT={records:[
 {id:'available',title:'Record'},
 {id:'draft',status:'DRAFT'},
 {id:'hidden',hideFromPublic:true}
]};
assert.deepEqual(available().map(record=>record.id),['available']);

// Touch artwork must leave ordinary vertical scrolling intact.
const footerCss=read('footer-sign.css');
const surface=footerCss.slice(footerCss.indexOf('.footer-touch-surface {'),footerCss.indexOf('@media (pointer:coarse)'));
assert.match(surface,/touch-action:pan-y/);
assert.doesNotMatch(surface,/touch-action:none/);

// The Back to Top handler does not depend on a #top element in page markup.
const footer=read('footer-sign.js');
assert.match(footer,/footer\.querySelector\('\.footer-back-top'\)\?\.addEventListener\('click'/);
assert.match(footer,/window\.scrollTo\(\{top:0,/);

// The player must use its explicit expanded state, not an unused [open] attribute.
const playerCss=read('discos.css');
const player=read('discos.js');
assert.match(playerCss,/body\.ios-player-expanded\{overflow:hidden/);
assert.doesNotMatch(playerCss,/body:has\(\.ios-player-sheet\[open\]\)/);
assert.match(player,/syncIosPlayerScrollLock\(position==='expanded'\)/);
assert.match(player,/!iosSheet\.contains\(event\.target\)\)event\.preventDefault\(\)/);
console.log('PASS: late favorites, native vertical scrolling, Back to Top, player expanded state');
