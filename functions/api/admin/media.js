function safeSegment(value='image'){
  return String(value)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,100)||'image';
}

export async function onRequestPost(context){
  if(!context.env.MEDIA){
    return Response.json({ok:false,error:'R2 binding MEDIA is not configured.'},{status:503});
  }

  let form;
  try{form=await context.request.formData()}
  catch{return Response.json({ok:false,error:'Upload must use multipart/form-data.'},{status:400})}

  const file=form.get('file');
  if(!file||typeof file==='string'||typeof file.arrayBuffer!=='function'){
    return Response.json({ok:false,error:'No file was uploaded.'},{status:400});
  }

  if(!String(file.type||'').startsWith('image/')){
    return Response.json({ok:false,error:'Only image uploads are enabled here.'},{status:415});
  }

  if(file.size>25*1024*1024){
    return Response.json({ok:false,error:'Image is larger than the 25 MB admin limit.'},{status:413});
  }

  const scope=safeSegment(form.get('scope')||'site');
  const originalName=safeSegment(file.name||'image');
  const id=crypto.randomUUID();
  const key=`uploads/${scope}/${Date.now()}-${id}-${originalName}`;

  await context.env.MEDIA.put(key,file.stream(),{
    httpMetadata:{contentType:file.type||'application/octet-stream'},
    customMetadata:{
      originalName:file.name||originalName,
      uploadedAt:new Date().toISOString(),
      originalBytes:String(file.size)
    }
  });

  return Response.json({
    ok:true,
    key,
    url:`/media/${key}`,
    name:file.name||originalName,
    type:file.type||'',
    size:file.size,
    preservedOriginal:true
  },{
    headers:{'cache-control':'no-store'}
  });
}
