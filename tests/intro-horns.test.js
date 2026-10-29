const assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const art=fs.readFileSync(require.resolve('../assets/brand/lvl-laser-logo.svg'),'utf8');

// These are the two actual horn outlines; do not change source SVG coordinates.
for(const id of ['lvl-cow-horn','lvl-cow-horn-far','lvl-cow-head']){
 assert.ok(art.includes('id="'+id+'"'),'missing '+id+' from logo');
}
assert.match(art,/<use\b[^>]*\/><path\b[^>]*id="lvl-cow-horn"\s*\/>/);
assert.match(art,/<use\b[^>]*\/><path\b[^>]*id="lvl-cow-horn-far"\s*\/>/);

function shape(id,len){
 return {id,localName:'path',style:{},classList:{add(){}},
  getTotalLength:()=>len,closest:()=>null};
}
const first=shape('body',280),near=shape('lvl-cow-horn',140),
 far=shape('lvl-cow-horn-far',210),head=shape('lvl-cow-head',450),
 after=shape('face',120);
const nearTexture={localName:'use',style:{opacity:'0',removeProperty(key){delete this[key]}},closest:()=>null};
const farTexture={localName:'use',style:{opacity:'0',removeProperty(key){delete this[key]}},closest:()=>null};
near.previousElementSibling=nearTexture;
far.previousElementSibling=farTexture;
const original=[first,head,after,near,far];
const lookup={
 '#lvl-cow-horn':near,'#lvl-cow-horn-far':far,'#lvl-cow-head':head
};
const elements=[first,head,nearTexture,near,farTexture,far,after];
const svg={
 querySelector:key=>lookup[key],
 querySelectorAll:()=>elements
};
const timingStart=source.indexOf("const horns=[svg.querySelector('#lvl-cow-horn')");
const timingEnd=source.indexOf('if(!segments.length)',timingStart);
assert.ok(timingStart>0&&timingEnd>timingStart);
const timing=new Function('svg','shapes',source.slice(timingStart,timingEnd)+
 ';return {segments,horns,head,pairedHorns,totalWeight};');
const result=timing(svg,original);
assert.equal(result.pairedHorns,true);
const segment=el=>result.segments.find(part=>part.el===el);
const a=segment(near),b=segment(far),h=segment(head);
assert.ok(a&&b&&h);
assert.equal(a.start,b.start,'both horns must start together');
assert.equal(a.end,b.end,'both horns must finish together');
assert.equal(a.weight,b.weight,'horn reveal speeds use a shared envelope');
assert.equal(h.start,a.end,'head tracing follows the completed pair');
assert.deepEqual(result.segments.slice(1,4).map(s=>s.el.id),
 ['lvl-cow-horn','lvl-cow-horn-far','lvl-cow-head']);
for(const horn of [near,far]){
 assert.equal(Number(horn.style.strokeDashoffset),horn.getTotalLength());
 assert.equal(horn.style.fillOpacity,'0');
}

// The two source raster textures must be attached to their own horn paths,
// not to the adjacent head or face in the original SVG paint order.
const detailStart=source.indexOf('const segmentByElement=new Map(segments.map');
const detailEnd=source.indexOf('// Geometry within the SVG',detailStart);
assert.ok(detailStart>0&&detailEnd>detailStart);
const details=new Function('svg','segments','horns','pairedHorns','drawableSelector',
 source.slice(detailStart,detailEnd)+';return {detailsBySegment,segmentByElement};')(
 svg,result.segments,result.horns,true,'path,circle');
assert.deepEqual(details.detailsBySegment.get(a),[nearTexture]);
assert.deepEqual(details.detailsBySegment.get(b),[farTexture]);

const frameStart=source.indexOf('const local=Math.max(0,Math.min(1,(global-active.start)/active.weight))');
const frameEnd=source.indexOf('const point=pointOn(active,local);',frameStart);
assert.ok(frameStart>0&&frameEnd>frameStart);
const frame=new Function('global','active','pairedHorns','horns','segmentByElement',
 source.slice(frameStart,frameEnd));
for(const portion of [0,.1,.35,.5,.85,.99]){
 frame(a.start+a.weight*portion,a,true,result.horns,details.segmentByElement);
 assert.ok(Math.abs(1-Number(near.style.strokeDashoffset)/a.len-portion)<1e-10);
 assert.ok(Math.abs(1-Number(far.style.strokeDashoffset)/b.len-portion)<1e-10);
}

// At the same global boundary, both segments and their textures complete.
const completeStart=source.indexOf('function completeSegment(seg)');
const completeEnd=source.indexOf('function pointOn(',completeStart);
assert.ok(completeStart>0&&completeEnd>completeStart);
const completion=new Function('detailsBySegment','head','requestAnimationFrame','revealEyes',
 source.slice(completeStart,completeEnd)+';return completeSegment;')(
 details.detailsBySegment,head,fn=>fn(),()=>Promise.resolve());
for(const seg of result.segments){
 if(a.end>=seg.end)completion(seg);
}
assert.equal(a.done,true);assert.equal(b.done,true);
assert.equal(near.style.fillOpacity,'1');assert.equal(far.style.fillOpacity,'1');
assert.equal(nearTexture.style.opacity,undefined);
assert.equal(farTexture.style.opacity,undefined);

console.log('PASS: both SVG horns start, trace, fill and reveal texture together without changing head/eye timing');
