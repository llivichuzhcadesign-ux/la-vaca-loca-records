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

  const object=await context.env.MEDIA.get(key);
  if(!object)return notFound();

  const headers=new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag',object.httpEtag);
  headers.set('cache-control','public, max-age=31536000, immutable');
  headers.set('x-content-type-options','nosniff');

  if(context.request.method==='HEAD')return new Response(null,{headers});
  return new Response(object.body,{headers});
}
