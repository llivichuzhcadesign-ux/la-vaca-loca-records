export async function onRequestGet({env}){
  if(!env.MEDIA)return Response.json({items:[]});
  const page=await env.MEDIA.list({prefix:'uploads/gallery/',limit:100,include:['httpMetadata','customMetadata']});
  const items=page.objects.filter(o=>o.httpMetadata?.contentType?.startsWith('image/')||o.customMetadata?.mediaKind==='image').sort((a,b)=>b.uploaded-a.uploaded).map(o=>({url:'/media/'+o.key}));
  return Response.json({items},{headers:{'cache-control':'public, max-age=60'}});
}
