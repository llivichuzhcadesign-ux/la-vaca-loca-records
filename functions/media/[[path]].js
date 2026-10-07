function notFound(){
  return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
}

export async function onRequest(context){
  if(!['GET','HEAD'].includes(context.request.method)){
    return new Response('Method not allowed',{status:405,headers:{allow:'GET, HEAD'}});
  }
  if(!context.env.MEDIA)return notFound();

  const parts=Array.isArray(context.params.path)?context.params.path:[context.params.path];
  const key=parts.filter(Boolean).join('/');
  if(!key||key.startsWith('__content/'))return notFound();

  const rangeHeader=context.request.headers.get('range');
  let range;
  let metadata;
  if(rangeHeader){
    metadata=await context.env.MEDIA.head(key);
    if(!metadata)return notFound();
    const match=/^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'content-range':`bytes */${metadata.size}`,'accept-ranges':'bytes'}});
    const start=match[1]?Number(match[1]):Math.max(0,metadata.size-Number(match[2]));
    const end=match[1]?(match[2]?Math.min(Number(match[2]),metadata.size-1):metadata.size-1):metadata.size-1;
    if(start>=metadata.size||end<start)return new Response(null,{status:416,headers:{'content-range':`bytes */${metadata.size}`,'accept-ranges':'bytes'}});
    range={offset:start,length:end-start+1};
  }
  const object=await context.env.MEDIA.get(key,range?{range}:undefined);
  if(!object)return notFound();

  const headers=new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag',object.httpEtag);
  headers.set('accept-ranges','bytes');
  headers.set('content-length',String(range?range.length:object.size));
  if(range)headers.set('content-range',`bytes ${range.offset}-${range.offset+range.length-1}/${metadata.size}`);
  headers.set('cache-control','public, max-age=31536000, immutable');
  headers.set('x-content-type-options','nosniff');

  if(context.request.method==='HEAD')return new Response(null,{status:range?206:200,headers});
  return new Response(object.body,{status:range?206:200,headers});
}
