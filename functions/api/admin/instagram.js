const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
export function postCode(value){try{const url=new URL(value);if(url.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(url.hostname)||url.username||url.password)return'';return /^\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname)?.[1]||''}catch{return''}}
async function graph(env,path,params={}){
  const url=new URL(`https://graph.instagram.com/v24.0/${path}`);
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  const response=await fetch(url,{headers:{Authorization:`Bearer ${env.INSTAGRAM_ACCESS_TOKEN}`},signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(!response.ok||data.error)throw new Error('Instagram could not read this account. Check the API token, account ID, and media permissions.');
  return data;
}
async function findPost(env,code){
  let after;
  for(let page=0;page<10;page++){
    const data=await graph(env,`${env.INSTAGRAM_USER_ID}/media`,{fields:'id,caption,media_type,media_url,thumbnail_url,permalink',limit:'100',...(after?{after}:{})});
    const post=data.data?.find(item=>postCode(item.permalink)===code);
    if(post)return post;
    if(!data.paging?.next||!data.paging?.cursors?.after)break;after=data.paging.cursors.after;
  }
  return null;
}
async function photosFor(env,post){
  if(post.media_type==='CAROUSEL_ALBUM'){
    const items=[];let after;
    do{const data=await graph(env,`${post.id}/children`,{fields:'id,media_type,media_url,thumbnail_url',limit:'100',...(after?{after}:{})});items.push(...(data.data||[]));after=data.paging?.next?data.paging?.cursors?.after:null;}while(after&&items.length<100);
    return items.filter(item=>item.media_type==='IMAGE'&&item.media_url).map(item=>({id:item.id,url:item.media_url}));
  }
  return post.media_type==='IMAGE'&&post.media_url?[{id:post.id,url:post.media_url}]:[];
}
export async function onRequestGet(context){return json({ok:true,configured:!!(context.env.INSTAGRAM_ACCESS_TOKEN&&context.env.INSTAGRAM_USER_ID)})}
export async function onRequestPost(context){
  const env=context.env;
  if(!env.INSTAGRAM_ACCESS_TOKEN||!env.INSTAGRAM_USER_ID)return json({ok:false,error:'Instagram is not connected yet. Configure INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in Cloudflare for the Instagram professional account.'},503);
  if(!env.MEDIA)return json({ok:false,error:'Media storage is not configured.'},503);
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
  const code=postCode(body.url);if(!code)return json({ok:false,error:'Paste an Instagram post or reel link.'},400);
  try{
    const post=await findPost(env,code);if(!post)return json({ok:false,error:'Post not found in the connected account’s latest 1,000 posts. Use a link from that account.'},404);
    let photos=await photosFor(env,post);
    if(!photos.length)return json({ok:false,error:'This post has no photos to import. Video-only posts are not supported.'},422);
    if(body.save===true){
      const saved=[];
      for(const photo of photos){
        if(!/^\d+$/.test(String(post.id))||!/^\d+$/.test(String(photo.id)))throw new Error('Instagram returned an invalid media ID.');
        const key=`uploads/instagram/${post.id}/${photo.id}.jpg`;
        if(!await env.MEDIA.head(key)){
          const url=new URL(photo.url);
          if(url.protocol!=='https:'||!/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname))throw new Error('Instagram returned an unsupported image host.');
          const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
          if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw new Error('A photo could not be downloaded. Retry the import.');
          const bytes=await response.arrayBuffer();if(bytes.byteLength>50*1024*1024)throw new Error('A photo exceeds the 50 MB upload limit.');
          await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:response.headers.get('content-type')},customMetadata:{originalName:`Instagram ${code} ${photo.id}.jpg`,uploadedAt:new Date().toISOString(),mediaKind:'image',originalBytes:String(bytes.byteLength)}});
        }
        saved.push({id:photo.id,url:new URL(`/media/${key}`,context.request.url).href});
      }
      photos=saved;
    }
    const caption=post.caption||'';
    return json({ok:true,id:post.id,url:post.permalink,caption,title:caption.split('\n').find(line=>line.trim())?.trim().slice(0,100)||'Instagram event',photos});
  }catch(error){return json({ok:false,error:error.name==='TimeoutError'?'Instagram took too long to respond. Retry the import.':error.message||'Instagram import failed.'},502)}
}
