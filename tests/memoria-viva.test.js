const assert=require('node:assert/strict'),fs=require('node:fs');
const {justifiedRows,editorialBands,collectPhotos,availableTiles,nextReadyIndex}=require('../memoria-viva.js');
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
assert.match(source,/tile.img.naturalWidth\/tile.img.naturalHeight/);assert.match(source,/ResizeObserver/);
assert.match(css,/memory-lightbox-stage img\{[^}]*object-fit:contain/);
console.log('PASS: gapless justified rows, natural ratios, viewport height cap, deduplicated photos and no intro');

for(const width of [320,390,768,1024,1440,1920]){
 const viewport=width<600?680:820;
 for(const sample of [mixed,[1.5,1.5,1.5],Array(12).fill(1.5),[3.2,.7,.8,1.2,1.7,1.6,.6,.9]]){
  const bands=editorialBands(sample,width,viewport);
  let end=0,seen=[];
  for(const band of bands){
   assert.equal(band.start,end);end=band.end;assert.ok(band.height>0&&band.height<=viewport);
   if(band.type==='mosaic'){
    assert.ok(band.heroWeight>=.43&&band.heroWeight<=.86);
    assert.ok(Math.abs(band.pairWeights.reduce((a,b)=>a+b,0)-1)<1e-10);
    seen.push(...(band.right?[...band.pair,band.hero]:[band.hero,...band.pair]));
    assert.ok(Math.abs(band.heroWeight*width/band.naturalHeight-sample[band.hero])<1e-9);
   }else{
    assert.ok(Math.abs(band.weights.reduce((a,b)=>a+b,0)-1)<1e-10);
    for(let i=band.start;i<band.end;i++)seen.push(i);
   }
  }
  assert.equal(end,sample.length);assert.deepEqual(seen,sample.map((_,i)=>i));
 }
 const equal=editorialBands([1.5,1.5,1.5],width,viewport);
 assert.equal(equal.length,1);assert.equal(equal[0].type,'mosaic');
 assert.ok(Math.abs(equal[0].heroWeight-2/3)<1e-10);
 const rhythm=editorialBands(Array(12).fill(1.5),width,viewport);
 assert.ok(rhythm.some(b=>b.type==='mosaic'));assert.ok(rhythm.some(b=>b.type==='row'));
}
assert.match(css,/\.memory-gallery-stack\{display:flex;flex-direction:column;gap:0/);
console.log('PASS: varied editorial bands, full-width mosaic and stack geometry, preserved order, six viewport widths');

assert.match(html,/<section class="page-intro memory-heading">[\s\S]*?<\/section>\s*<section class="memory-gallery"/);
assert.match(css,/#contenido>\.memory-heading\{[^}]*min-height:0[^}]*padding:4px/);
assert.match(css,/\.memory-heading-title h1\{[^}]*margin:0/);
assert.match(css,/\.memory-heading\+\.memory-gallery\{margin:0;padding:0\}/);

const attempts=[{index:0,state:'failed'},{index:1,state:'queued'},{index:2,state:'ready',ratio:1.5},{index:3,state:'failed'},{index:4,state:'ready',ratio:.8}];
assert.deepEqual(availableTiles(attempts).map(t=>t.index),[2,4]);
assert.equal(nextReadyIndex(attempts,2,1),4);assert.equal(nextReadyIndex(attempts,4,1),2);assert.equal(nextReadyIndex(attempts,2,-1),4);
assert.equal(nextReadyIndex([{index:0,state:'failed'}],0,1),-1);
assert.match(source,/editorialBands\(ready.map/);assert.match(source,/tile.state=ok\?'ready':'failed'/);assert.match(source,/inFlight<batchLimit/);
assert.doesNotMatch(css,/Imagen no disponible/);assert.match(html,/id="memoryGalleryMore"/);
console.log('PASS: failed and pending images excluded from the mosaic, viewer skips missing files, bounded progressive loading');

assert.match(css,/--memory-photo-crop:3%;--memory-photo-zoom:1\.065/);
assert.match(css,/\.memory-gallery-tile img\{[^}]*transform:scale\(var\(--memory-photo-zoom\)\)/);
assert.match(css,/\.memory-gallery-tile button\{[^}]*overflow:hidden/);
assert.match(css,/\.memory-lightbox-stage img\{[^}]*width:auto;height:auto[^}]*clip-path:inset\(var\(--memory-photo-crop\)\)/);
assert.match(html,/memoria-viva\.css\?v=20261126-photo-trim-v1/);
console.log('PASS: nondestructive scan-border crop in wall and viewer');
