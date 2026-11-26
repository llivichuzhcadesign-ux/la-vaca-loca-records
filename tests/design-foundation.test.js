const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const token=read('site-theme.tokens.css');
for(const name of ['font-ui','font-editorial','type-label','type-meta','type-control','type-body','type-section','type-page','target','gutter','section-space']){
 assert.match(token,new RegExp('--lvl-'+name+':'));
}
const pages=['index.html','discos.html','sessions.html','archivo.html','visitanos.html'];
for(const page of pages){
 const html=read(page);
 assert.match(html,/site-theme\.tokens\.css\?v=20261126-foundation-v1/);
 assert.match(html,/horizontal-logo-gold\.svg/);
 assert.match(html,/site-cursor\.js/);
}
const check=(file,pattern)=>assert.match(read(file),pattern,file);
check('discos.library.css',/\.expanded-library \.sleeve-meta strong\{font-size:var\(--lvl-type-body\)/);
check('discos.deck.css',/\.browse-tools input,\.browse-tools select\{[^}]*font-size:var\(--lvl-type-body\)/);
check('visitanos.css',/\.visit-field input,\.visit-field select,\.visit-field textarea\{[^}]*font-size:var\(--lvl-type-body\)/);
check('site-theme.header.css',/font-size:var\(--lvl-type-meta\)!important/);
check('home-flow.refinements.css',/font-size:var\(--lvl-type-section\)!important/);
check('editorial.js',/youtube-nocookie\.com\/embed\//);
console.log('PASS: LVL shared typography, controls, public theme and retained branding/player integration');
