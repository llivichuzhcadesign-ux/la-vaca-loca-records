const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('functions/media/[[path]].js','utf8');
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const bytes=Buffer.from('0123456789');let requested;
 const env={MEDIA:{head:async()=>({size:10}),get:async(key,options)=>{requested=options?.range;return {size:10,httpEtag:'test',writeHttpMetadata(h){h.set('content-type','audio/mpeg')},body:requested?bytes.subarray(requested.offset,requested.offset+requested.length):bytes}}}};
 async function request(range,method='GET'){return onRequest({request:new Request('https://site.test/media/uploads/audio/test.mp3',{method,headers:range?{range}:undefined}),params:{path:['uploads','audio','test.mp3']},env})}
 let r=await request('bytes=3-6');assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 3-6/10');assert.equal(r.headers.get('content-length'),'4');assert.equal(await r.text(),'3456');
 r=await request('bytes=-3');assert.equal(await r.text(),'789');
 r=await request('bytes=6-');assert.equal(await r.text(),'6789');
 assert.equal((await request('bytes=12-')).status,416);
 r=await request();assert.equal(r.status,200);assert.equal(r.headers.get('accept-ranges'),'bytes');assert.equal(await r.text(),'0123456789');
 r=await request('bytes=2-4','HEAD');assert.equal(r.status,206);assert.equal(await r.text(),'');
 console.log('PASS: audio byte ranges, suffix, open end, invalid ranges, full response and HEAD');
})().catch(e=>{console.error(e);process.exitCode=1});
