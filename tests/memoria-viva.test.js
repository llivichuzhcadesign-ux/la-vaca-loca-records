const assert=require('node:assert/strict'),fs=require('node:fs');
const {justifiedRows,collectPhotos}=require('../memoria-viva.js');
const mixed=[1.5,.65,1,2.2,.8,1.6,3,.5,1.2];
for(const width of [320,390,768,1024,1440,1920]){
 const viewport=width<600?680:820,rows=justifiedRows(mixed,width,viewport);
 let offset=0;
 for(const row of rows){
  assert.equal(row.start,offset);offset=row.end;
  assert.ok(Math.abs(row.weights.reduce((a,b)=>a+b,0)-1)<1e-10,'every row spans viewport');
  assert.ok(row.height<=viewport,'never taller than available viewport');
  for(let i=0;i<row.weights.length;i++)assert.ok(Math.abs(row.weights[i]*width/row.naturalHeight-mixed[row.start+i])<1e-9,'natural proportions before viewport cap');
 }
 assert.equal(offset,mixed.length);
}
assert.deepEqual(justifiedRows([],800,600),[]);
assert.equal(justifiedRows([.5],1000,700)[0].height,700);
assert.equal(justifiedRows([1.5],1000,700)[0].naturalHeight,1000/1.5);
const archive=[{id:'a',title:'La Casa',media:{image:{url:'https://example.test/a.jpg',caption:'Caption',width:800,height:600}}},{id:'b',hideFromPublic:true,media:{image:{url:'https://example.test/b.jpg'}}},{id:'c',status:'Draft',media:{image:{url:'https://example.test/c.jpg'}}}];
const photos=collectPhotos(archive,[{url:'https://example.test/a.jpg'},{url:'https://example.test/e.jpg'},{url:'javascript:alert(1)'}],'https://example.test/');
assert.equal(photos.length,2);assert.equal(photos[0].ratio,4/3);assert.equal(photos[0].caption,'Caption');assert.equal(photos[0].story,'a');
const html=fs.readFileSync(require.resolve('../archivo.html'),'utf8'),source=fs.readFileSync(require.resolve('../memoria-viva.js'),'utf8'),css=fs.readFileSync(require.resolve('../memoria-viva.css'),'utf8');
assert.doesNotMatch(html,/memoryFlight|memoryReplay/);assert.doesNotMatch(source,/startFlight|canvas|flightProgress/);
assert.match(css,/\.memory-gallery\{width:100%;max-width:none;margin:0;padding:0/);assert.match(css,/\.memory-gallery-row\{display:flex;width:100%;gap:0/);
assert.match(source,/img.naturalWidth\/img.naturalHeight/);assert.match(source,/ResizeObserver/);
assert.match(css,/memory-lightbox-stage img\{[^}]*object-fit:contain/);
console.log('PASS: gapless justified rows, natural ratios, viewport height cap, deduplicated photos and no intro');
