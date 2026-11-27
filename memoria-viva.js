/* Memoria Viva: an edge-to-edge justified photographic wall. */
(function(){
'use strict';
// Choose contiguous rows that balance natural image ratios and a comfortable viewport-scale height.
function justifiedRows(ratios,width,viewportHeight){
 if(!ratios.length||width<=0)return [];
 const aspect=ratios.map(r=>Number.isFinite(r)&&r>0?Math.max(.08,Math.min(20,r)):1.5);
 const target=Math.min(width<600?width*.56:width<1024?width*.36:width*.27,Math.max(140,viewportHeight*.52),440);
 const maxHeight=Math.max(100,viewportHeight);
 const maxItems=width<600?3:width<1024?5:7;
 const n=aspect.length,cost=Array(n+1).fill(Infinity),next=Array(n);cost[n]=0;
 for(let i=n-1;i>=0;i--){
  let sum=0;
  for(let j=i;j<Math.min(n,i+maxItems);j++){
   sum+=aspect[j];const height=width/sum;
   const score=Math.pow(Math.log(height/target),2)+Math.pow(Math.max(0,height/maxHeight-1),2)*2+(j===i&&i!==n-1?.12:0);
   if(score+cost[j+1]<cost[i]){cost[i]=score+cost[j+1];next[i]=j+1}
  }
 }
 const rows=[];
 for(let i=0;i<n;){
  const end=next[i]||i+1,items=aspect.slice(i,end),sum=items.reduce((a,b)=>a+b,0),naturalHeight=width/sum;
  rows.push({start:i,end,height:Math.min(naturalHeight,maxHeight),naturalHeight,weights:items.map(r=>r/sum)});i=end;
 }
 return rows;
}
// Alternate a lead photograph with a vertical pair, then a quieter strip.
// Use the real proportions of the images to choose the best orientation.
function editorialBands(ratios,width,viewportHeight){
 if(!ratios.length||width<=0)return [];
 const aspect=ratios.map(r=>Number.isFinite(r)&&r>0?Math.max(.08,Math.min(20,r)):1.5);
 const heightLimit=Math.max(100,viewportHeight),bands=[];
 const strip=(start,end)=>{
  for(const row of justifiedRows(aspect.slice(start,end),width,viewportHeight)){
   bands.push({...row,type:'row',start:start+row.start,end:start+row.end});
  }
 };
 function mosaic(start,preferRight){
  const a=aspect.slice(start,start+3);
  const candidate=right=>{
   const hero=right?2:0,pair=right?[0,1]:[1,2];
   const stackAspect=1/(1/a[pair[0]]+1/a[pair[1]]);
   const naturalHeight=width/(a[hero]+stackAspect);
   const heroWeight=a[hero]/(a[hero]+stackAspect);
   const pairWeights=pair.map(i=>stackAspect/a[i]);
   // A tall or extremely narrow photograph should never be forced into a tiny sliver.
   const score=Math.abs(heroWeight-.66)+Math.max(0,naturalHeight/heightLimit-1)*.38+
    (Math.min(...pairWeights)<.16?.35:0)+(right===preferRight?0:.055);
   return {type:'mosaic',start,end:start+3,hero:start+hero,pair:pair.map(i=>start+i),right,heroWeight,pairWeights,naturalHeight,height:Math.min(naturalHeight,heightLimit),score};
  };
  const left=candidate(false),right=candidate(true),best=left.score<=right.score?left:right;
  if(best.heroWeight<.43||best.heroWeight>.86||Math.min(...best.pairWeights)<.12)return false;
  bands.push(best);return true;
 }
 let start=0,beat=0;
 while(start<aspect.length){
  const remaining=aspect.length-start;
  if(remaining<3){strip(start,aspect.length);break}
  // Preserve a broad panoramic image as a full-width editorial moment.
  if(aspect[start]>=2.65&&remaining>=4){
   bands.push({type:'row',start,end:start+1,weights:[1],naturalHeight:width/aspect[start],height:Math.min(width/aspect[start],heightLimit)});
   start++;beat++;continue;
  }
  if(beat%3!==1||remaining===3){
   if(mosaic(start,beat%2===1)){start+=3;beat++;continue}
  }
  const count=Math.min(remaining,width<600?2:3);
  strip(start,start+count);start+=count;beat++;
 }
 return bands;
}
function imageUrl(value,base){
 if(!value)return '';
 try{const u=new URL(value,base);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}
}
function collectPhotos(archive,gallery,base){
 const photos=[],seen=new Set();
 const add=(raw,metadata)=>{const src=imageUrl(raw,base);if(!src||seen.has(src))return;seen.add(src);photos.push({src,...metadata})};
 for(const item of Array.isArray(archive)?archive:[]){
  if(!item||item.hideFromPublic||['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(item.status||'').trim().toUpperCase()))continue;
  const image=item.media?.image||{};
  add(image.url,{title:String(item.title||''),alt:String(image.alt||item.title||''),caption:String(image.caption||item.detail||''),story:String(item.id||''),ratio:Number(image.width)/Number(image.height)});
 }
 for(const item of Array.isArray(gallery)?gallery:[])add(item?.url,{title:String(item?.title||''),alt:String(item?.alt||''),caption:String(item?.caption||''),story:'',ratio:Number(item?.width)/Number(item?.height)});
 return photos;
}
if(typeof module!=='undefined')module.exports={justifiedRows,editorialBands,collectPhotos};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);
const gallery=$('memoryGallery'),grid=$('memoryGalleryGrid');if(!gallery||!grid)return;
const params=new URLSearchParams(location.search),designEmpty=params.get('ui-preview')==='empty',preview=params.get('gallery-preview')==='1';
const dialog=$('memoryLightbox'),large=$('memoryLightboxImage');
let photos=[],tiles=[],opener=null,currentIndex=0,oldOverflow='',layoutFrame=0,lastWidth=0,lastViewport=0;
function availableHeight(){
 const header=document.querySelector('.editorial-header')?.getBoundingClientRect().height||0;
 return Math.max(100,window.innerHeight-header);
}
function layout(){
 layoutFrame=0;
 if(!tiles.length)return;
 const width=grid.clientWidth,viewport=availableHeight();if(!width)return;
 lastWidth=width;lastViewport=viewport;
 const rows=editorialBands(tiles.map(t=>t.ratio),width,viewport);
 const focused=document.activeElement;
 const fragment=document.createDocumentFragment();
 for(const row of rows){
  const wrapper=document.createElement('div');wrapper.className='memory-gallery-row';wrapper.style.height=row.height+'px';
  if(row.type==='mosaic'){
   wrapper.classList.add('memory-gallery-mosaic');
   const hero=tiles[row.hero].figure;hero.style.flex=row.heroWeight+' 1 0px';
   const stack=document.createElement('div');stack.className='memory-gallery-stack';stack.style.flex=(1-row.heroWeight)+' 1 0px';
   row.pair.forEach((index,k)=>{const tile=tiles[index].figure;tile.style.flex=row.pairWeights[k]+' 1 0px';stack.append(tile)});
   if(row.right)wrapper.append(stack,hero);else wrapper.append(hero,stack);
  }else{
   row.weights.forEach((weight,k)=>{const tile=tiles[row.start+k];tile.figure.style.flex=weight+' 1 0px';wrapper.append(tile.figure)});
  }
  fragment.append(wrapper);
 }
 grid.replaceChildren(fragment);
 if(focused&&grid.contains(focused)&&document.activeElement!==focused)focused.focus({preventScroll:true});
}
function scheduleLayout(){if(!layoutFrame)layoutFrame=requestAnimationFrame(layout)}
if('ResizeObserver' in window)new ResizeObserver(()=>{if(grid.clientWidth!==lastWidth||availableHeight()!==lastViewport)scheduleLayout()}).observe(grid);
window.addEventListener('resize',scheduleLayout,{passive:true});
function label(photo,i){return photo.title||'Fotografía '+String(i+1).padStart(2,'0')}
function render(items){
 // Published archive photos are inserted first; a later gallery response only appends new images.
 for(const photo of items){
  if(photos.some(p=>p.src===photo.src))continue;
  const i=photos.length;photos.push(photo);
  const figure=document.createElement('figure');figure.className='memory-gallery-tile';
  const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Ampliar '+label(photo,i));
  const img=document.createElement('img');img.alt=photo.alt||label(photo,i);img.loading=i<8?'eager':'lazy';img.decoding='async';
  const tile={figure,button,img,photo,ratio:Number.isFinite(photo.ratio)&&photo.ratio>0?photo.ratio:1.5};
  tiles.push(tile);
  const syncRatio=()=>{if(img.naturalWidth&&img.naturalHeight){const ratio=img.naturalWidth/img.naturalHeight;if(Math.abs(ratio-tile.ratio)>.001){tile.ratio=ratio;scheduleLayout()}}};
  img.addEventListener('load',syncRatio);
  img.addEventListener('error',()=>{figure.classList.add('is-unavailable');button.disabled=true});
  img.src=photo.src;if(img.complete)syncRatio();
  button.append(img);button.onclick=()=>openPhoto(i,button);figure.append(button);
 }
 gallery.hidden=!photos.length;
 $('memoryGalleryCount').textContent=photos.length+(photos.length===1?' fotografía':' fotografías');
 // Keep editorial stories accessible without repeating photographs already in the wall.
 const content=$('pageContent'),stories=content?.querySelectorAll('.archive-entry')||[];
 for(const photo of photos){if(photo.story)document.getElementById(photo.story)?.classList.add('memory-story-in-gallery')}
 if(content)content.hidden=photos.length>0&&!stories.length;
 if(photos.length)scheduleLayout();
}
function showPhoto(index){
 if(!photos.length)return;
 currentIndex=(index+photos.length)%photos.length;
 const photo=photos[currentIndex];large.alt=photo.alt||label(photo,currentIndex);large.src=photo.src;
 $('memoryLightboxTitle').textContent=label(photo,currentIndex);$('memoryLightboxCaption').textContent=photo.caption;
 $('memoryLightboxPosition').textContent=String(currentIndex+1).padStart(2,'0')+' / '+String(photos.length).padStart(2,'0');
 const story=$('memoryLightboxStory');story.hidden=!photo.story;
 if(photo.story)story.href='#'+encodeURIComponent(photo.story);else story.removeAttribute('href');
 $('memoryLightboxPrev').disabled=photos.length<2;$('memoryLightboxNext').disabled=photos.length<2;
}
function openPhoto(index,button){opener=button;showPhoto(index);oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();$('memoryLightboxClose').focus()}
$('memoryLightboxClose').onclick=()=>dialog.close();
$('memoryLightboxPrev').onclick=()=>showPhoto(currentIndex-1);
$('memoryLightboxNext').onclick=()=>showPhoto(currentIndex+1);
$('memoryLightboxStory').onclick=()=>dialog.close();
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showPhoto(currentIndex+(event.key==='ArrowLeft'?-1:1))}});
dialog.addEventListener('close',()=>{document.documentElement.style.overflow=oldOverflow;large.removeAttribute('src');opener?.focus({preventScroll:true})});
let touchStart=null;
large.addEventListener('touchstart',event=>{const p=event.changedTouches[0];touchStart=p?{x:p.clientX,y:p.clientY}:null},{passive:true});
large.addEventListener('touchend',event=>{const p=event.changedTouches[0],start=touchStart;touchStart=null;if(!p||!start)return;const dx=p.clientX-start.x,dy=p.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)showPhoto(currentIndex+(dx<0?1:-1))},{passive:true});
async function load(){
 if(designEmpty&&!preview)return;
 const archive=window.SITE_CONTENT?.archiveItems||[];
 if(preview){
  $('memoryPreviewNote').hidden=false;
  render([1,2,3].map(i=>({src:'assets/images/site/hero/lvl-hero-0'+i+'.webp',title:'',alt:'Fotografía de referencia '+i,caption:'Vista de diseño',story:''})));
  return;
 }
 render(collectPhotos(archive,[],location.href));
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);
 let remote=[];
 try{const response=await fetch('api/gallery',{signal:controller.signal});if(response.ok){const data=await response.json();remote=Array.isArray(data.items)?data.items:[]}}catch{}finally{clearTimeout(timeout)}
 render(collectPhotos(archive,remote,location.href));
}
load();
})();
