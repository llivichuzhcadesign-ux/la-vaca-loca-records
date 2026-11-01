/* LVL responsive, non-destructive image framing shared by the public hero and admin. */
(function(root){
 'use strict';
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 const numeric=(n,fallback)=>Number.isFinite(Number(n))?Number(n):fallback;
 function parsePosition(value){
  const tokens=String(value||'center center').toLowerCase().trim().split(/\s+/);
  let x=50,y=50;
  const get=(v,axis)=>{
   if(v==='center')return 50;
   if(v==='left'||v==='top')return 0;
   if(v==='right'||v==='bottom')return 100;
   if(v.endsWith('%'))return clamp(numeric(v.slice(0,-1),50),0,100);
   return axis===0?50:50;
  };
  if(tokens.length===1){
   if(['top','bottom'].includes(tokens[0]))y=get(tokens[0],1);
   else x=get(tokens[0],0);
  }else{
   if(['top','bottom'].includes(tokens[0])){
    y=get(tokens[0],1);x=get(tokens[1],0);
   }else{x=get(tokens[0],0);y=get(tokens[1],1)}
  }
  return {x,y,zoom:1};
 }
 function normalize(value,fallback){
  const base=fallback||{x:50,y:50,zoom:1};
  return {
   x:clamp(numeric(value?.x,base.x),0,100),
   y:clamp(numeric(value?.y,base.y),0,100),
   zoom:clamp(numeric(value?.zoom,base.zoom),1,2.5)
  };
 }
 function deviceForWidth(width){
  return width<=560?'phone':width<=900?'tablet':'desktop';
 }
 function forDevice(slide,device){
  const fallback=parsePosition(slide?.position);
  const value=slide?.crops?.[device];
  return normalize(value,fallback);
 }
 // Each slide can have a desktop original plus optional tablet/phone originals.
 // An unassigned device automatically inherits the desktop photo.
 function mediaForDevice(slide,device){
  const desktop={src:slide?.src||'',draftBlobKey:slide?.draftBlobKey||'',fileName:slide?.fileName||'',originalBytes:slide?.originalBytes||0};
  const tablet=slide?.deviceImages?.tablet||{};
  const phone=slide?.deviceImages?.phone||{};
  const candidates=device==='phone'?[['phone',phone],['desktop',desktop],['tablet',tablet]]:
    device==='tablet'?[['tablet',tablet],['desktop',desktop],['phone',phone]]:
    [['desktop',desktop],['tablet',tablet],['phone',phone]];
  const match=candidates.find(([,item])=>item&&(item.src||item.draftBlobKey));
  return match?{...match[1],device:match[0]}:{...desktop,device:'desktop'};
 }
 function hasMedia(slide){
  return !!(slide?.src||slide?.draftBlobKey||Object.values(slide?.deviceImages||{}).some(item=>item?.src||item?.draftBlobKey));
 }
 // Filter choices are presentation-only; uploaded original images are never changed.
 const IMAGE_FILTERS=Object.freeze({none:'none',grayscale:'grayscale(1)',sepia:'sepia(1)'});
 function filterName(value){
  return Object.prototype.hasOwnProperty.call(IMAGE_FILTERS,value)?value:'none';
 }
 function filterForDevice(slide,device){
  return filterName(slide?.filters?.[device]);
 }
 function filterCSS(value){
  return IMAGE_FILTERS[filterName(value)];
 }
 // 0 removes the text-contrast shadow; 100 restores the original full-strength overlay.
 function overlayStrength(hero){
  if(hero?.overlayStrength===undefined||hero?.overlayStrength===null||hero?.overlayStrength==='')return 25;
  const value=Number(hero.overlayStrength);
  return Number.isFinite(value)?clamp(value,0,100):25;
 }
 // Watermark intensity, stored as a percentage. Zero hides the decorative mark.
 // Restricted placement presets keep the emblem legible across breakpoints.
 function watermarkPlacement(hero){
  const placement=hero?.watermarkPlacement;
  return placement==='full'||placement==='upper' ? placement : 'edge';
 }
 function watermarkOpacity(hero){
  if(hero?.watermarkOpacity===undefined||hero?.watermarkOpacity===null||hero?.watermarkOpacity==='')return 26;
  const value=Number(hero.watermarkOpacity);
  return Number.isFinite(value)?clamp(value,0,100):26;
 }
 function slideOverlayStrength(hero,slide){
  const custom=slide?.overlayStrength;
  if(custom===undefined||custom===null||custom==='')return overlayStrength(hero);
  const value=Number(custom);
  return Number.isFinite(value)?clamp(value,0,100):overlayStrength(hero);
 }
 function layout(frame,img,crop){
  if(!frame||!img||!img.naturalWidth||!img.naturalHeight)return;
  const w=frame.clientWidth,h=frame.clientHeight;
  if(w<=0||h<=0)return;
  const pos=normalize(crop);
  const zoom=pos.zoom;
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight)*zoom;
  const imageW=img.naturalWidth*scale,imageH=img.naturalHeight*scale;
  img.style.width=imageW.toFixed(3)+'px';
  img.style.height=imageH.toFixed(3)+'px';
  img.style.left=(-(imageW-w)*pos.x/100).toFixed(3)+'px';
  img.style.top=(-(imageH-h)*pos.y/100).toFixed(3)+'px';
  img.style.maxWidth='none';
  return {overflowX:Math.max(0,imageW-w),overflowY:Math.max(0,imageH-h)};
 }
 // Use an actual img so the crop is predictable even when zoom introduces new overflow.
 function mount(frame,img,selectCrop){
  if(!frame||!img)return ()=>{};
  let removed=false;
  const update=()=>{if(!removed)layout(frame,img,typeof selectCrop==='function'?selectCrop():selectCrop)};
  img.addEventListener('load',update);
  let observer=null;
  if(typeof ResizeObserver!=='undefined'){
   observer=new ResizeObserver(update);observer.observe(frame);
  }else root.addEventListener('resize',update,{passive:true});
  if(img.complete)update();
  return {update,destroy(){
   removed=true;img.removeEventListener('load',update);
   if(observer)observer.disconnect();
   else root.removeEventListener('resize',update);
  }};
 }
 root.LVLCrop=Object.freeze({clamp,parsePosition,normalize,deviceForWidth,mediaForDevice,hasMedia,forDevice,filterName,filterForDevice,filterCSS,overlayStrength,slideOverlayStrength,watermarkOpacity,watermarkPlacement,layout,mount});
})(window);
