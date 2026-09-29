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
function decode(value=''){return String(value).replace(/&quot;/g,'"').replace(/&#(?:39|x27);/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))}
export function parsePublicPost(html,code){
  let found;
  function walk(value,depth=0){
    if(!value||typeof value!=='object'||depth>80||found)return;
    if((value.shortcode===code||value.code===code)&&(value.display_url||value.image_versions2||value.carousel_media||value.edge_sidecar_to_children)){found=value;return}
    for(const child of Object.values(value))walk(child,depth+1);
  }
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){try{walk(JSON.parse(match[1]))}catch{}}
  if(found){
    const children=found.carousel_media||found.edge_sidecar_to_children?.edges?.map(edge=>edge.node)||[found];
    const photos=children.filter(item=>!item.is_video&&item.media_type!==2).map((item,index)=>({id:String(item.id||index),url:item.display_url||item.image_versions2?.candidates?.[0]?.url})).filter(item=>item.url);
    const caption=found.caption?.text||found.edge_media_to_caption?.edges?.[0]?.node?.text||'';
    if(photos.length)return{id:code,caption,photos,url:`https://www.instagram.com/p/${code}/`,warnings:[],source:'public'};
  }
  const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(match=>{
    const attrs={};for(const attr of match[0].matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g))attrs[attr[1].toLowerCase()]=decode(attr[3]);return attrs;
  });
  const meta=name=>tags.find(tag=>tag.property===name||tag.name===name)?.content||'';
  const image=meta('og:image');let caption=meta('og:description')||meta('description');
  if(!image||!caption||/^(?:Instagram|Login|Log in|Sign up)$/i.test(meta('og:title').trim()))return null;
  const quoted=caption.match(/:\s*["“]([\s\S]*)["”]\.?$/);if(quoted)caption=quoted[1];
  return{id:code,caption,photos:[{id:'cover',url:image}],url:`https://www.instagram.com/p/${code}/`,source:'public',warnings:['Instagram exposed a preview only. The caption may be shortened and additional carousel photos may be missing. Review before creating the event.']};
}
async function publicPost(code){
  let preview;
  for(const suffix of ['', 'embed/captioned/']){
    try{
    const response=await fetch(`https://www.instagram.com/p/${code}/${suffix}`,{redirect:'error',headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html'},signal:AbortSignal.timeout(15000)});
    if(!response.ok)continue;
    const html=await response.text();if(html.length>12000000)throw new Error('Instagram page is too large to import.');
    const post=parsePublicPost(html,code);if(post&&!post.warnings.length)return post;if(post)preview=post;
    }catch{}
  }
  return preview||null;
}
export async function providerPost(env,code){
  const cacheKey=`__imports/instagram/${code}.json`;
  const cached=await env.MEDIA.get(cacheKey);
  if(cached){try{const value=await cached.json();if(value.savedAt>Date.now()-86400000)return value.post}catch{}}
  const response=await fetch('https://api.apify.com/v2/actors/apify~instagram-post-scraper/run-sync-get-dataset-items?timeout=60&clean=true',{method:'POST',headers:{Authorization:`Bearer ${env.APIFY_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({username:[`https://www.instagram.com/p/${code}/`],resultsLimit:1,dataDetailLevel:'detailedData'}),signal:AbortSignal.timeout(70000)});
  if(!response.ok)throw new Error('Public Instagram extraction failed. Check the Apify API key and available credits, then retry.');
  const items=await response.json();
  const item=Array.isArray(items)?items.find(value=>value.shortCode===code||postCode(value.url)===code):null;
  if(!item||item.error)throw new Error('The extraction service could not read this public post.');
  const children=item.childPosts||[];
  const urls=children.length?children.filter(child=>child.type!=='Video').map(child=>child.displayUrl):item.type==='Video'?[]:item.images?.length?item.images:[item.displayUrl];
  const photos=[...new Set(urls.filter(Boolean))].map((url,index)=>({id:String(index),url}));
  if(!photos.length)throw new Error('The post has no downloadable photos.');
  const post={id:code,caption:item.caption||'',photos,url:`https://www.instagram.com/p/${code}/`,source:'public-service',warnings:[]};
  await env.MEDIA.put(cacheKey,JSON.stringify({savedAt:Date.now(),post}),{httpMetadata:{contentType:'application/json'}});
  return post;
}
export async function onRequestGet(){return json({ok:true,publicImport:true})}
export async function onRequestPost(context){
  const env=context.env;
  if(!env.MEDIA)return json({ok:false,error:'Media storage is not configured.'},503);
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
  const code=postCode(body.url);if(!code)return json({ok:false,error:'Paste an Instagram post or reel link.'},400);
  try{
    let post;try{post=await publicPost(code)}catch{}
    if((!post||post.warnings.length)&&env.APIFY_API_TOKEN)post=await providerPost(env,code);
    if(!post&&env.INSTAGRAM_ACCESS_TOKEN&&env.INSTAGRAM_USER_ID){const item=await findPost(env,code);if(item)post={id:item.id,caption:item.caption||'',photos:await photosFor(env,item),url:item.permalink,source:'connected',warnings:[]}}
    if(!post)return json({ok:false,error:'Public import is not connected: Instagram blocked direct extraction. Configure the Cloudflare secret APIFY_API_TOKEN to enable the public-post extraction service. No Instagram login is required.'},422);
    let photos=post.photos;
    if(!photos.length)return json({ok:false,error:'This post has no photos to import. Video-only posts are not supported.'},422);
    if(body.save===true){
      const saved=[];
      for(const [index,photo] of photos.entries()){
        const key=`uploads/instagram/${code}/${index}.jpg`;
        if(!await env.MEDIA.head(key)){
          const url=new URL(photo.url);
          if(url.protocol!=='https:'||!/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname))throw new Error('Instagram returned an unsupported image host.');
          const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
          if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw new Error('A photo could not be downloaded. Retry the import.');
          const bytes=await response.arrayBuffer();if(bytes.byteLength>50*1024*1024)throw new Error('A photo exceeds the 50 MB upload limit.');
          await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:response.headers.get('content-type')},customMetadata:{originalName:`Instagram ${code} ${index+1}.jpg`,uploadedAt:new Date().toISOString(),mediaKind:'image',originalBytes:String(bytes.byteLength)}});
        }
        saved.push({id:photo.id,url:new URL(`/media/${key}`,context.request.url).href});
      }
      photos=saved;
    }
    const caption=post.caption||'';
    return json({ok:true,id:code,url:post.url,caption,title:caption.split('\n').find(line=>line.trim())?.trim().slice(0,100)||'Instagram event',photos,source:post.source,warnings:post.warnings});
  }catch(error){return json({ok:false,error:error.name==='TimeoutError'?'Instagram took too long to respond. Retry the import.':error.message||'Instagram import failed.'},502)}
}
