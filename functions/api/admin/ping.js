export async function onRequestGet(context){
  return Response.json({
    ok:true,
    authenticated:true,
    mediaBinding:!!context.env.MEDIA
  },{
    headers:{'cache-control':'no-store'}
  });
}
