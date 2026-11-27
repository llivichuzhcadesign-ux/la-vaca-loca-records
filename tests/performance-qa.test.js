const assert=require('node:assert/strict'),fs=require('node:fs');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
const html=read('index.html'),app=read('app.js'),collage=read('home-collage.js'),cursor=read('site-cursor.js'),footer=read('footer-sign.js'),discos=read('discos.js');
assert.match(html,/id="lvlIntroSkip"/);assert.match(html,/event\.key==='Escape'/);assert.match(html,/setTimeout\(dismiss,12000\)/);
assert.match(html,/lvl-intro-dismiss/);assert.match(app,/signal:controller.signal/);assert.match(app,/controller.abort\(\)/);
assert.match(app,/if\(dismissed\|\|!loader.isConnected\)\{resolve\(\);return\}/);
assert.match(app,/if\(rect.bottom<0\|\|rect.top>vh\)return/);
assert.match(html,/id="memoryMotionToggle"/);assert.match(collage,/document.hidden\|\|!onScreen\|\|userPaused\|\|motion.matches/);
assert.match(cursor,/if\(!moveFrame\)moveFrame=requestAnimationFrame/);
assert.match(footer,/Math.sqrt\(2000000\/\(rect.width\*rect.height\)\)/);
assert.match(discos,/if\(iosDiscView&&!sheetResizeFrame\)sheetResizeFrame=requestAnimationFrame/);
assert.doesNotMatch(discos,/resize',\(\)=>\{if\(iosDiscView\)focusRecordView/);
for(const page of ['index.html','discos.html','sessions.html','archivo.html','visitanos.html']){
 const markup=read(page);assert.match(markup,/site-cursor\.js\?v=20261126-qa-v1/);assert.match(markup,/footer-sign\.js\?v=20261126-qa-v1/);
 for(const match of markup.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))\?v=[^"]+"/g)){const asset=match[1];if(!/^https?:/.test(asset))assert.ok(fs.existsSync(require.resolve('../'+asset)),page+': '+asset)}
}
for(const file of ['app.js','home-collage.js','site-cursor.js','footer-sign.js','discos.js','media-runtime.js'])new Function(read(file));
console.log('PASS: intro escape and timeout, offscreen motion, frame-limited updates, asset references');
