const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('functions/api/admin/media.js','utf8');
 const {onRequestGet}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 let options;
 const result=await onRequestGet({request:new Request('https://site.test/api/admin/media?cursor=next-page'),env:{MEDIA:{list:async value=>{options=value;return{objects:[{key:'uploads/gallery/a.jpg',size:45,uploaded:new Date('2026-09-29'),customMetadata:{mediaKind:'image',originalName:'Photo.jpg'}},{key:'uploads/audio/a.mp3',size:45,uploaded:new Date(),customMetadata:{mediaKind:'audio'}},{key:'uploads/hero/b.png',size:30,uploaded:new Date('2026-09-28'),httpMetadata:{contentType:'image/png'}}],truncated:true,cursor:'page-2'}}}}});
 const data=await result.json();assert.equal(options.cursor,'next-page');assert.equal(options.prefix,'uploads/');assert.equal(data.items.length,2);assert.equal(data.items[0].name,'Photo.jpg');assert.equal(data.items[0].url,'https://site.test/media/uploads/gallery/a.jpg');assert.equal(data.cursor,'page-2');assert.equal(result.headers.get('cache-control'),'no-store');
 assert.equal((await onRequestGet({env:{}})).status,503);
 console.log('PASS: persistent gallery listing, image filtering, pagination and missing storage');
})().catch(error=>{console.error(error);process.exitCode=1});
