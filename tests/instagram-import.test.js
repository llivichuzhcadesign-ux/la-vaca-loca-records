const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {postCode,parsePublicPost,onRequestPost}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('functions/api/admin/instagram.js','utf8')).toString('base64'));
 assert.equal(postCode('https://www.instagram.com/p/ABC_123/?igsh=x'),'ABC_123');for(const url of ['https://evil.test/p/abc/','http://instagram.com/p/abc/','https://www.instagram.com/accounts/login/'])assert.equal(postCode(url),'');
 const make=(body,env)=>({request:new Request('https://site.test/api/admin/instagram',{method:'POST',body:JSON.stringify(body)}),env});
 assert.equal((await onRequestPost(make({url:'https://instagram.com/p/abc/'},{}))).status,503);
 assert.equal(parsePublicPost('<html>Login</html>','abc'),null);const partial=parsePublicPost('<meta property="og:image" content="https://scontent.cdninstagram.com/a.jpg"><meta property="og:description" content="Caption &amp; more">','abc');assert.equal(partial.caption,'Caption & more');assert.equal(partial.warnings.length,1);
 const writes=[];const env={INSTAGRAM_ACCESS_TOKEN:'test-token',INSTAGRAM_USER_ID:'123',MEDIA:{head:async()=>null,put:async(key,bytes,options)=>writes.push({key,bytes,options})}};
 const original=global.fetch;
 global.fetch=async(url,options)=>{
  url=new URL(url);
  if(url.hostname==='www.instagram.com')return new Response('<script type="application/json">'+JSON.stringify({data:{shortcode:'abc',caption:{text:'Party night\nFull caption'},carousel_media:[{id:'2',media_type:1,image_versions2:{candidates:[{url:'https://scontent.cdninstagram.com/a.jpg'}]}},{id:'3',media_type:1,image_versions2:{candidates:[{url:'https://scontent.cdninstagram.com/b.jpg'}]}},{id:'4',media_type:2}]}})+'</script>');
  if(url.hostname==='graph.instagram.com'){
   assert.equal(options.headers.Authorization,'Bearer test-token');assert.equal(url.searchParams.has('access_token'),false);
   return Response.json(url.pathname.endsWith('/children')?{data:[{id:'2',media_type:'IMAGE',media_url:'https://scontent.cdninstagram.com/a.jpg'},{id:'3',media_type:'IMAGE',media_url:'https://scontent.cdninstagram.com/b.jpg'},{id:'4',media_type:'VIDEO',media_url:'https://scontent.cdninstagram.com/c.mp4'}]}:{data:[{id:'1',caption:'Party night\nFull caption',media_type:'CAROUSEL_ALBUM',permalink:'https://www.instagram.com/p/abc/'}]});
  }
  return new Response('photo',{headers:{'content-type':'image/jpeg'}});
 };
 try{
  let data=await (await onRequestPost(make({url:'https://instagram.com/p/abc/'},env))).json();assert.equal(data.caption,'Party night\nFull caption');assert.equal(data.photos.length,2);assert.equal(writes.length,0);
  data=await (await onRequestPost(make({url:'https://instagram.com/p/abc/',save:true},env))).json();assert.equal(writes.length,2);assert.equal(data.photos[0].url,'https://site.test/media/uploads/instagram/abc/0.jpg');assert.equal(writes[0].options.customMetadata.mediaKind,'image');
  env.MEDIA.head=async()=>({});await onRequestPost(make({url:'https://instagram.com/p/abc/',save:true},env));assert.equal(writes.length,2);
 }finally{global.fetch=original}
 console.log('PASS: URL validation, storage gate, public caption/carousel preview, image persistence and retry deduplication');
})().catch(error=>{console.error(error);process.exitCode=1});
