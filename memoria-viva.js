/* Memoria Viva: the photographs themselves are the time tunnel.
   No WebGL, no synthetic photographs, and no motion if reduced-motion is enabled. */
(function(){
'use strict';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
function flightProgress(t){t=clamp(t);const v=12;if(t<.2)return v*t*t/.4;if(t<.64)return v*(t-.1);const u=(t-.64)/.36;return v*.54+v*.36*(u-u*u/2)}
function settleProgress(t){return 1-Math.pow(1-clamp((t-.64)/.36),3)}
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
  add(image.url,{title:String(item.title||''),alt:String(image.alt||item.title||''),caption:String(image.caption||item.detail||''),story:String(item.id||'')});
 }
 for(const item of Array.isArray(gallery)?gallery:[])add(item?.url,{title:String(item?.title||''),alt:String(item?.alt||''),caption:String(item?.caption||''),story:''});
 return photos;
}
function coverRect(iw,ih,w,h){const scale=Math.max(w/iw,h/ih);return {sx:(iw-w/scale)/2,sy:(ih-h/scale)/2,sw:w/scale,sh:h/scale}}
if(typeof module!=='undefined')module.exports={flightProgress,settleProgress,collectPhotos,coverRect};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);
const gallery=$('memoryGallery'),grid=$('memoryGalleryGrid');if(!gallery||!grid)return;
const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
const params=new URLSearchParams(location.search),designEmpty=params.get('ui-preview')==='empty',preview=params.get('gallery-preview')==='1';
const replay=$('memoryReplay'),overlay=$('memoryFlight'),canvas=$('memoryFlightCanvas'),skip=$('memoryFlightSkip');
const dialog=$('memoryLightbox'),large=$('memoryLightboxImage'),progress=$('memoryFlightProgress');
const started=performance.now();
let photos=[],tiles=[],active=null,waiting=false,sequence=0,interacted=false,opener=null,currentIndex=0,oldOverflow='';
const noteInteraction=()=>{interacted=true};
window.addEventListener('scroll',noteInteraction,{passive:true});
window.addEventListener('pointerdown',noteInteraction,{passive:true});
window.addEventListener('keydown',noteInteraction);
function label(photo,i){return photo.title||'Fotografía '+String(i+1).padStart(2,'0')}
function render(items){
 photos=items;tiles=[];grid.replaceChildren();gallery.hidden=!items.length;
 $('memoryGalleryCount').textContent=items.length+(items.length===1?' fotografía':' fotografías');
 replay.hidden=motion.matches||items.length<2;
 items.forEach((photo,i)=>{
  const figure=document.createElement('figure');figure.className='memory-gallery-tile';
  const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Ampliar '+label(photo,i));
  const img=document.createElement('img');img.alt=photo.alt||label(photo,i);img.loading=i<6?'eager':'lazy';img.decoding='async';
  img.addEventListener('error',()=>{figure.classList.add('is-unavailable');button.disabled=true});
  img.src=photo.src;
  button.append(img);button.onclick=()=>openPhoto(i,button);
  const cap=document.createElement('figcaption'),name=document.createElement('span'),number=document.createElement('span');
  name.textContent=label(photo,i);number.textContent=String(i+1).padStart(2,'0');number.setAttribute('aria-hidden','true');cap.append(name,number);
  figure.append(button,cap);grid.append(figure);tiles.push({button,img,photo});
 });
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
function openPhoto(index,button){finishFlight();opener=button;showPhoto(index);oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();$('memoryLightboxClose').focus()}
$('memoryLightboxClose').onclick=()=>dialog.close();
$('memoryLightboxPrev').onclick=()=>showPhoto(currentIndex-1);
$('memoryLightboxNext').onclick=()=>showPhoto(currentIndex+1);
$('memoryLightboxStory').onclick=()=>dialog.close();
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showPhoto(currentIndex+(event.key==='ArrowLeft'?-1:1))}});
dialog.addEventListener('close',()=>{document.documentElement.style.overflow=oldOverflow;large.removeAttribute('src');opener?.focus({preventScroll:true})});
let touchStart=null;
large.addEventListener('touchstart',event=>{const p=event.changedTouches[0];touchStart=p?{x:p.clientX,y:p.clientY}:null},{passive:true});
large.addEventListener('touchend',event=>{const p=event.changedTouches[0],start=touchStart;touchStart=null;if(!p||!start)return;const dx=p.clientX-start.x,dy=p.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)showPhoto(currentIndex+(dx<0?1:-1))},{passive:true});
function finishFlight(restoreFocus=false){
 sequence++;waiting=false;
 if(!active){overlay.hidden=true;return}
 cancelAnimationFrame(active.frame);active=null;overlay.hidden=true;overlay.classList.remove('is-landing');
 canvas.width=canvas.height=1;progress.style.transform='scaleX(0)';
 if(restoreFocus&&!replay.hidden)replay.focus({preventScroll:true});
}
function readyImage(img){if(img.complete)return Promise.resolve(img.naturalWidth>0);return new Promise(resolve=>{const done=()=>{img.removeEventListener('load',done);img.removeEventListener('error',done);resolve(img.naturalWidth>0)};img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});setTimeout(done,850)})}
function paint(ctx,img,x,y,w,h,alpha=1){
 if(w<1||h<1||!img.naturalWidth)return;
 const c=coverRect(img.naturalWidth,img.naturalHeight,w,h);ctx.globalAlpha=clamp(alpha);
 ctx.drawImage(img,c.sx,c.sy,c.sw,c.sh,x,y,w,h);ctx.globalAlpha=1;
}
function visibleTargets(){
 const w=window.innerWidth,h=window.innerHeight;
 return tiles.map((tile,index)=>({tile,index,rect:tile.button.getBoundingClientRect()})).filter(({rect})=>rect.width>0&&rect.bottom>32&&rect.top<h-32&&rect.right>0&&rect.left<w).slice(0,9);
}
async function startFlight(manual=false){
 if(active||waiting||motion.matches||document.hidden||photos.length<2||dialog.open)return;
 if(!manual&&(interacted||performance.now()-started>2600||window.scrollY>30||location.hash))return;
 if(manual){gallery.scrollIntoView({block:'start',behavior:'instant'})}
 waiting=true;const ticket=++sequence;
 const targets=visibleTargets();
 if(!targets.length){waiting=false;return}
 // Load only photographs that can be seen in the opening composition.
 const pool=[...new Set([...targets.map(t=>t.tile),...tiles.slice(0,9)])].slice(0,9);
 await Promise.all(pool.map(({img})=>readyImage(img)));
 if(ticket!==sequence)return;
 waiting=false;
 if(motion.matches||document.hidden||dialog.open||(!manual&&(interacted||window.scrollY>30||performance.now()-started>3000)))return;
 const loaded=pool.filter(({img})=>img.complete&&img.naturalWidth);
 const landing=visibleTargets().filter(({tile})=>tile.img.complete&&tile.img.naturalWidth);
 if(loaded.length<2||!landing.length)return;
 let ctx;try{ctx=canvas.getContext('2d',{alpha:true})}catch{return}if(!ctx)return;
 const W=window.innerWidth,H=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(2200000/(W*H)));
 canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
 const cx=W*.5,cy=H*.46,base=Math.min(W,H);
 const count=W<700?15:25;
 const particles=Array.from({length:count},(_,i)=>({img:loaded[i%loaded.length].img,angle:i*2.399963+(.11*(i%3)),radius:.28+(i%5)*.115,phase:i/count,ratio:1.24+(i%3)*.16}));
 overlay.hidden=false;overlay.classList.remove('is-landing');
 // Paint the first background before the next frame to avoid an unpainted overlay.
 ctx.fillStyle='#0d0b09';ctx.fillRect(0,0,W,H);
 const flightStart=performance.now(),duration=3200;
 active={frame:0};
 function frame(now){
  if(!active)return;
  const t=clamp((now-flightStart)/duration),settle=settleProgress(t),travel=flightProgress(t);
  ctx.clearRect(0,0,W,H);
  ctx.globalAlpha=1-settle;ctx.fillStyle='#0d0b09';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  const radial=ctx.createRadialGradient(cx,cy,0,cx,cy,base*.85);
  radial.addColorStop(0,'rgba(132,101,65,.24)');radial.addColorStop(1,'rgba(12,9,7,0)');
  ctx.globalAlpha=(1-settle)*.8;ctx.fillStyle=radial;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  const speed=t<.2?ease(t/.2):t<.64?1:1-settle;
  const projected=particles.map(p=>{
   const z=1-((p.phase+travel*.31)%1),perspective=1/(.16+z*1.5);
   const rad=base*p.radius*perspective;
   return {...p,z,x:cx+Math.cos(p.angle)*rad,y:cy+Math.sin(p.angle)*rad,w:base*.18*perspective,h:base*.18*perspective/p.ratio};
  }).sort((a,b)=>b.z-a.z);
  for(const p of projected){
   const alpha=clamp((1-p.z)*3)*clamp(p.z*7)*(1-settle)*ease(t/.12)*.9;
   if(alpha<.01)continue;
   // Gold-tinted traces suggest velocity without a strobe or white flashes.
   ctx.globalAlpha=alpha*speed*.25;ctx.strokeStyle='#c8a56c';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(mix(cx,p.x,.65),mix(cy,p.y,.65));ctx.lineTo(p.x,p.y);ctx.stroke();ctx.globalAlpha=1;
   paint(ctx,p.img,p.x-p.w/2,p.y-p.h/2,p.w,p.h,alpha);
  }
  if(t>.56){
   const appear=ease((t-.56)/.13);
   landing.forEach(({tile,rect},i)=>{
    const a=i*2.399963+.3,dist=base*(.22+(i%3)*.13),initialW=base*.14;
    const x=mix(cx+Math.cos(a)*dist-initialW/2,rect.left,settle);
    const y=mix(cy+Math.sin(a)*dist-initialW*.375,rect.top,settle);
    paint(ctx,tile.img,x,y,mix(initialW,rect.width,settle),mix(initialW*.75,rect.height,settle),appear*(1-ease((t-.94)/.06)));
   });
  }
  progress.style.transform='scaleX('+t.toFixed(3)+')';
  if(t>.7)overlay.classList.add('is-landing');
  if(t>=1){finishFlight();return}
  active.frame=requestAnimationFrame(safeFrame);
 }
 function safeFrame(now){try{frame(now)}catch{finishFlight()}}
 active.frame=requestAnimationFrame(safeFrame);
}
replay.onclick=()=>startFlight(true);
skip.onclick=()=>finishFlight(true);
window.addEventListener('keydown',event=>{if((active||waiting)&&(event.key==='Escape'||event.key==='Tab')){event.preventDefault();finishFlight(true)}});
window.addEventListener('resize',()=>{if(active||waiting)finishFlight()},{passive:true});
window.addEventListener('scroll',()=>{if(active)finishFlight()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)finishFlight()});
motion.addEventListener?.('change',()=>{if(motion.matches)finishFlight();replay.hidden=motion.matches||photos.length<2});
async function load(){
 if(designEmpty&&!preview)return;
 const archive=window.SITE_CONTENT?.archiveItems||[];
 if(preview){
  $('memoryPreviewNote').hidden=false;
  render([1,2,3].map(i=>({src:'assets/images/site/hero/lvl-hero-0'+i+'.webp',title:'',alt:'Fotografía de referencia '+i,caption:'Vista de diseño',story:''})));
  startFlight();return;
 }
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),1400);
 let remote=[];
 try{const response=await fetch('api/gallery',{signal:controller.signal});if(response.ok){const data=await response.json();remote=Array.isArray(data.items)?data.items:[]}}catch{}finally{clearTimeout(timeout)}
 render(collectPhotos(archive,remote,location.href));startFlight();
}
load();
})();
