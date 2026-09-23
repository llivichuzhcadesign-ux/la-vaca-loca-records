function safeSegment(value='media'){
  return String(value)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,100)||'media';
}

function mediaKind(file){
  const type=String(file.type||'').toLowerCase();
  const name=String(file.name||'').toLowerCase();
  if(type.startsWith('image/'))return'image';
  if(type.startsWith('audio/')||/\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(name))return'audio';
  return'';
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

  const kind=mediaKind(file);
  if(!kind){
    return Response.json({ok:false,error:'Only image and audio uploads are enabled here.'},{status:415});
  }

  const maxBytes=50*1024*1024;
  if(file.size>maxBytes){
    return Response.json({ok:false,error:'File is larger than the 50 MB admin upload limit. Use a shorter audio preview or an external video/audio link for long sessions.'},{status:413});
  }

  const scope=safeSegment(form.get('scope')||kind);
  const originalName=safeSegment(file.name||kind);
  const id=crypto.randomUUID();
  const key=`uploads/${scope}/${Date.now()}-${id}-${originalName}`;

  await context.env.MEDIA.put(key,file.stream(),{
    httpMetadata:{contentType:file.type||'application/octet-stream'},
    customMetadata:{
      originalName:file.name||originalName,
      uploadedAt:new Date().toISOString(),
      originalBytes:String(file.size),
      mediaKind:kind
    }
  });

  return Response.json({
    ok:true,
    key,
    url:new URL(`/media/${key}`,context.request.url).href,
    name:file.name||originalName,
    type:file.type||'',
    kind,
    size:file.size,
    preservedOriginal:true
  },{
    headers:{'cache-control':'no-store'}
  });
}
