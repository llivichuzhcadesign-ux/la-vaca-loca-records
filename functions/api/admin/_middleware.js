function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
}

function sameString(a,b){
  a=String(a||''); b=String(b||'');
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

export async function onRequest(context){
  const expected=context.env.ADMIN_API_KEY;
  if(!expected)return json({ok:false,error:'Cloudflare ADMIN_API_KEY secret is not configured.'},503);

  const requestOrigin=context.request.headers.get('Origin');
  const ownOrigin=new URL(context.request.url).origin;
  if(requestOrigin&&requestOrigin!==ownOrigin){
    return json({ok:false,error:'Cross-origin admin requests are not allowed.'},403);
  }

  const provided=context.request.headers.get('X-Admin-Key');
  if(!sameString(provided,expected)){
    return json({ok:false,error:'Invalid admin key.'},401);
  }

  return context.next();
}
