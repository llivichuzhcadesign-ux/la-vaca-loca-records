function runtimeScript(content,meta={}){
  if(!content){
    return `window.LVL_CLOUD_BACKEND=Object.assign(window.LVL_CLOUD_BACKEND||{},${JSON.stringify(meta)});`;
  }
  const json=JSON.stringify(content).replace(/</g,'\\u003c');
  return `window.SITE_CONTENT=${json};
window.RECORDS=window.SITE_CONTENT.records||[];
window.SESSIONS=window.SITE_CONTENT.sessions||[];
window.EVENTS=window.SITE_CONTENT.events||[];
window.ARCHIVE_ITEMS=window.SITE_CONTENT.archiveItems||[];
window.LVL_CLOUD_BACKEND=${JSON.stringify(meta)};`;
}

export async function onRequestGet(context){
  const headers={
    'content-type':'application/javascript; charset=utf-8',
    'cache-control':'no-store, max-age=0',
    'x-content-type-options':'nosniff'
  };

  if(!context.env.MEDIA){
    return new Response(runtimeScript(null,{connected:false,reason:'missing-media-binding'}),{headers});
  }

  try{
    const object=await context.env.MEDIA.get('__content/site.json');
    if(!object){
      return new Response(runtimeScript(null,{connected:true,published:false}),{headers});
    }
    const text=await object.text();
    const content=JSON.parse(text);
    const publishedAt=object.customMetadata?.publishedAt||'';
    return new Response(runtimeScript(content,{connected:true,published:true,publishedAt}),{headers});
  }catch(error){
    return new Response(runtimeScript(null,{connected:false,reason:'content-read-failed'}),{headers});
  }
}
