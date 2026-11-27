const assert=require('node:assert/strict'),fs=require('node:fs');
const {flightProgress,settleProgress,collectPhotos,coverRect}=require('../memoria-viva.js');
let last=-1;
for(let i=0;i<=100;i++){const value=flightProgress(i/100);assert.ok(value>=last);last=value}
assert.equal(flightProgress(0),0);
assert.ok(flightProgress(.4)-flightProgress(.3)>flightProgress(.1)-flightProgress(0));
assert.ok(flightProgress(1)-flightProgress(.9)<flightProgress(.5)-flightProgress(.4));
assert.equal(settleProgress(0),0);assert.equal(settleProgress(.64),0);assert.equal(settleProgress(1),1);
const archive=[{id:'a',title:'La Casa',media:{image:{url:'https://example.test/a.jpg',caption:'Caption'}}},{id:'b',hideFromPublic:true,media:{image:{url:'https://example.test/b.jpg'}}},{id:'c',status:'Draft',media:{image:{url:'https://example.test/c.jpg'}}},{id:'d',media:{image:{path:'demo.jpg'}}}];
const photos=collectPhotos(archive,[{url:'https://example.test/a.jpg'},{url:'https://example.test/e.jpg'},{url:'javascript:alert(1)'}],'https://example.test/');
assert.equal(photos.length,2);assert.equal(photos[0].caption,'Caption');assert.equal(photos[0].story,'a');assert.equal(photos[1].story,'');
assert.deepEqual(coverRect(800,600,400,300),{sx:0,sy:0,sw:800,sh:600});
assert.deepEqual(coverRect(800,600,300,300),{sx:100,sy:0,sw:600,sh:600});
const html=fs.readFileSync(require.resolve('../archivo.html'),'utf8'),source=fs.readFileSync(require.resolve('../memoria-viva.js'),'utf8');
for(const id of ['memoryGallery','memoryGalleryGrid','memoryFlight','memoryFlightCanvas','memoryFlightSkip','memoryReplay','memoryLightbox'])assert.match(html,new RegExp('id="'+id+'"'));
assert.match(source,/prefers-reduced-motion/);assert.match(source,/designEmpty&&!preview/);assert.match(source,/canvas.width=canvas.height=1/);assert.match(source,/fetch\('api\/gallery'/);
assert.match(source,/if\(!manual&&\(interacted/);
console.log('PASS: continuous flight, deceleration and landing, published-photo deduplication, crop geometry, motion and preview safeguards');
