function cleanForPublish(value){
  if(Array.isArray(value))return value.map(cleanForPublish);
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const [key,item] of Object.entries(value)){
    if(['draftBlobKey','fileName','mimeType','originalBytes'].includes(key))continue;
    out[key]=cleanForPublish(item);
  }
  return out;
}

export async function onRequestPost(context){
  if(!context.env.MEDIA){
    return Response.json({ok:false,error:'R2 binding MEDIA is not configured.'},{status:503});
  }

  let content;
  try{content=await context.request.json()}
  catch{return Response.json({ok:false,error:'Invalid JSON body.'},{status:400})}

  if(!content||typeof content!=='object'||Array.isArray(content)){
    return Response.json({ok:false,error:'Site content must be a JSON object.'},{status:400});
  }

  const clean=cleanForPublish(content);
  const payload=JSON.stringify(clean);
  if(payload.length>2_000_000){
    return Response.json({ok:false,error:'Site content is too large. Media files must be uploaded separately.'},{status:413});
  }

  const publishedAt=new Date().toISOString();
  await context.env.MEDIA.put('__content/site.json',payload,{
    httpMetadata:{contentType:'application/json; charset=utf-8'},
    customMetadata:{publishedAt}
  });

  return Response.json({ok:true,publishedAt,bytes:new TextEncoder().encode(payload).byteLength},{
    headers:{'cache-control':'no-store'}
  });
}
