export async function onRequestGet(context){
  const hasBucket=!!context.env.MEDIA;
  const hasAdminSecret=!!context.env.ADMIN_API_KEY;
  let hasPublishedContent=false;

  if(hasBucket){
    try{
      hasPublishedContent=!!(await context.env.MEDIA.head('__content/site.json'));
    }catch{}
  }

  return Response.json({
    ok:true,
    cloudflare:true,
    mediaBinding:hasBucket,
    adminSecret:hasAdminSecret,
    publishedContent:hasPublishedContent
  },{
    headers:{'cache-control':'no-store'}
  });
}
