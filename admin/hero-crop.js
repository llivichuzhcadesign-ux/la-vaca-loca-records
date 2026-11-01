/* Non-destructive, device-specific homepage hero crop editor. */
(()=>{
 'use strict';
 const dialog=document.getElementById('heroCropDialog');
 const frame=document.getElementById('heroCropFrame');
 const img=document.getElementById('heroCropImage');
 if(!dialog||!frame||!img||!window.LVLCrop)return;
 const crop=window.LVLCrop;
 const devices=['desktop','tablet','phone'];
 const dimensions={desktop:'1440 × 810',tablet:'768 × 1024',phone:'390 × 844'};
 const names={desktop:'Desktop',tablet:'Tablet',phone:'Phone'};
 const inputX=document.getElementById('heroCropX');
 const inputY=document.getElementById('heroCropY');
 const inputZoom=document.getElementById('heroCropZoom');
 const outputX=document.getElementById('heroCropXValue');
 const outputY=document.getElementById('heroCropYValue');
 const outputZoom=document.getElementById('heroCropZoomValue');
 const message=document.getElementById('heroCropMessage');
 const showText=document.getElementById('heroCropShowText');
 const apply=document.getElementById('heroCropApply');
 let slideIndex=-1,device='desktop',working=null,workingFilters=null,previewHandle=null,temporaryUrl=null,openNumber=0,drag=null;
 const getSlide=()=>slideIndex>=0?getValue('homepage.hero.slides.'+slideIndex):null;
 const current=()=>working?.[device];
 const showMessage=(value)=>{message.textContent=value||''};
 const safeNumber=(value,defaultValue)=>Number.isFinite(Number(value))?Number(value):defaultValue;

 function render(){
  if(!working)return;
  const value=current();
  frame.classList.remove(...devices.map(name=>'device-'+name));
  frame.classList.add('device-'+device);
  document.querySelectorAll('[data-crop-device]').forEach(button=>{
   const selected=button.dataset.cropDevice===device;
   button.setAttribute('aria-pressed',String(selected));
   button.classList.toggle('selected',selected);
  });
  document.getElementById('heroCropControlsTitle').textContent=names[device]+' framing';
  document.getElementById('heroCropDeviceLabel').textContent=names[device]+' view';
  document.getElementById('heroCropDimensions').textContent=dimensions[device];
  inputX.value=String(Math.round(value.x));
  inputY.value=String(Math.round(value.y));
  inputZoom.value=String(Math.round(value.zoom*100));
  outputX.textContent=Math.round(value.x)+'%';
  outputY.textContent=Math.round(value.y)+'%';
  outputZoom.textContent=Math.round(value.zoom*100)+'%';
  document.getElementById('heroCropWebsiteCopy').hidden=!showText.checked;
  const shade=frame.querySelector('.hero-crop-shade');
  const slide=getSlide();
  if(shade)shade.style.opacity=String((slide?crop.slideOverlayStrength(draft.homepage?.hero,slide):crop.overlayStrength(draft.homepage?.hero))/100);
  const watermark=frame.querySelector('.hero-crop-brand-watermark');
  if(watermark)watermark.style.opacity=String((crop.watermarkOpacity(draft.homepage?.hero))/100);
  const filter=workingFilters?.[device]||'none';
  img.style.filter=crop.filterCSS(filter);
  dialog.querySelectorAll('[data-crop-filter]').forEach(button=>{
   const active=button.dataset.cropFilter===filter;
   button.setAttribute('aria-pressed',String(active));
   button.classList.toggle('selected',active);
  });
  crop.layout(frame,img,value);
 }

 let sourceRevision=0;
 async function loadDeviceImage(){
  const slide=getSlide();if(!slide||!working)return;
  const version=++sourceRevision;
  const media=crop.mediaForDevice(slide,device);
  img.removeAttribute('src');
  if(temporaryUrl){URL.revokeObjectURL(temporaryUrl);temporaryUrl=null}
  apply.disabled=false;
  showMessage('');
  try{
   let source=media.src?CalendarContent.imageUrl(media.src,new URL('../',document.baseURI)):'';
   if(media.draftBlobKey){
    const blob=await getOriginalFile(media.draftBlobKey);
    if(version!==sourceRevision||!dialog.open)return;
    if(blob){temporaryUrl=URL.createObjectURL(blob);source=temporaryUrl}
   }
   if(version!==sourceRevision||!dialog.open)return;
   if(!source){
    showMessage('Choose a photo for this device or provide a fallback image before adjusting its crop.');
    apply.disabled=true;
   }else{
    img.src=source;
    if(img.complete)previewHandle?.update?.();
   }
  }catch(error){
   if(version===sourceRevision){
    showMessage('The image could not be loaded. Check the source and try again.');
    apply.disabled=true;
   }
  }
 }
 function selectDevice(next){
  if(!devices.includes(next)||!working)return;
  device=next;render();loadDeviceImage();
 }
 async function openCrop(index,initialDevice){
  const slide=getValue('homepage.hero.slides.'+index);
  if(!slide)return;
  openNumber++;
  sourceRevision++;
  if(temporaryUrl){URL.revokeObjectURL(temporaryUrl);temporaryUrl=null}
  if(previewHandle){previewHandle.destroy();previewHandle=null}
  img.removeAttribute('src');
  slideIndex=index;
  working=Object.fromEntries(devices.map(name=>[name,crop.forDevice(slide,name)]));
  workingFilters=Object.fromEntries(devices.map(name=>[name,crop.filterForDevice(slide,name)]));
  device=devices.includes(initialDevice)?initialDevice:crop.deviceForWidth(window.innerWidth);
  showText.checked=true;
  apply.disabled=false;
  showMessage('');
  const hero=draft.homepage?.hero||{};
  document.getElementById('heroCropKicker').textContent=hero.kicker||'LA VACA LOCA RECORDS';
  document.getElementById('heroCropTagline').textContent=hero.tagline||'Discos, sonido, sesiones y cultura.';
  dialog.showModal();
  render();
  previewHandle=crop.mount(frame,img,()=>current());
  await loadDeviceImage();
 }

 function closeCrop(){
  openNumber++;
  sourceRevision++;
  drag=null;
  if(previewHandle){previewHandle.destroy();previewHandle=null}
  img.removeAttribute('src');
  if(temporaryUrl){URL.revokeObjectURL(temporaryUrl);temporaryUrl=null}
  slideIndex=-1;working=null;workingFilters=null;
  if(dialog.open)dialog.close();
 }

 document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-hero-crop-index]');
  if(trigger)openCrop(Number(trigger.dataset.heroCropIndex),trigger.dataset.heroCropDevice);
 });

 dialog.querySelectorAll('[data-crop-device]').forEach(button=>button.addEventListener('click',()=>selectDevice(button.dataset.cropDevice)));
 dialog.querySelectorAll('[data-crop-filter]').forEach(button=>button.addEventListener('click',()=>{
  if(!workingFilters)return;
  workingFilters[device]=crop.filterName(button.dataset.cropFilter);
  render();
  showMessage('');
 }));
 document.getElementById('heroCropClose').addEventListener('click',closeCrop);
 document.getElementById('heroCropCancel').addEventListener('click',closeCrop);
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeCrop()});
 dialog.addEventListener('click',event=>{if(event.target===dialog)closeCrop()});

 showText.addEventListener('change',render);
 for(const [input,key,convert] of [[inputX,'x',n=>n],[inputY,'y',n=>n],[inputZoom,'zoom',n=>n/100]]){
  input.addEventListener('input',()=>{
   if(!working)return;
   current()[key]=convert(safeNumber(input.value,key==='zoom'?100:50));
   render();
  });
 }

 document.getElementById('heroCropReset').addEventListener('click',()=>{
  if(!working)return;
  working[device]=crop.parsePosition(getSlide()?.position);
  workingFilters[device]='none';
  render();showMessage(names[device]+' framing and filter reset to original.');
 });

 frame.addEventListener('pointerdown',event=>{
  if(!working||!img.complete||!img.naturalWidth||event.button>0)return;
  const value=current();
  const extents=crop.layout(frame,img,value);
  if(!extents)return;
  drag={pointer:event.pointerId,device,startX:event.clientX,startY:event.clientY,
   x:value.x,y:value.y,overflowX:extents.overflowX,overflowY:extents.overflowY};
  frame.setPointerCapture(event.pointerId);
  frame.classList.add('is-dragging');
  event.preventDefault();
 });
 frame.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointer||!working||device!==drag.device)return;
  const value=current();
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(drag.overflowX>0.5)value.x=crop.clamp(drag.x-dx/drag.overflowX*100,0,100);
  if(drag.overflowY>0.5)value.y=crop.clamp(drag.y-dy/drag.overflowY*100,0,100);
  render();
  event.preventDefault();
 });
 function stopDrag(event){
  if(!drag||drag.pointer!==event.pointerId)return;
  drag=null;frame.classList.remove('is-dragging');
  if(frame.hasPointerCapture(event.pointerId))frame.releasePointerCapture(event.pointerId);
 }
 frame.addEventListener('pointerup',stopDrag);
 frame.addEventListener('pointercancel',stopDrag);
 frame.addEventListener('lostpointercapture',()=>{drag=null;frame.classList.remove('is-dragging')});

 apply.addEventListener('click',()=>{
  const slide=getSlide();if(!slide||!working||!workingFilters)return;
  const index=slideIndex;
  const normalized=Object.fromEntries(devices.map(name=>[name,crop.normalize(working[name])]));
  const filters=Object.fromEntries(devices.map(name=>[name,crop.filterName(workingFilters[name])]));
  const cropsChanged=JSON.stringify(slide.crops||{})!==JSON.stringify(normalized);
  const filtersChanged=JSON.stringify(slide.filters||{})!==JSON.stringify(filters);
  if(cropsChanged||filtersChanged){
   if(cropsChanged)setValue('homepage.hero.slides.'+index+'.crops',normalized);
   if(filtersChanged)setValue('homepage.hero.slides.'+index+'.filters',filters);
   // Saving only local data prevents re-rendering the gallery while the editor is open.
   if(!saveDraft(false)){showMessage('Could not save image settings. Check browser storage.');return}
  }
  const activeDevice=crop.deviceForWidth(window.innerWidth);
  const activeCrop=normalized[activeDevice];
  const activeFilter=crop.filterCSS(filters[activeDevice]);
  const thumb=document.querySelector('[data-hero-preview-index="'+index+'"]');
  if(thumb){
   thumb.style.objectPosition=activeCrop.x+'% '+activeCrop.y+'%';
   thumb.style.transform='scale('+activeCrop.zoom+')';
   thumb.style.filter=activeFilter;
  }
  document.querySelectorAll('[data-hero-source-index="'+index+'"]').forEach(source=>{
   const d=source.dataset.heroSourceDevice;
   source.style.filter=crop.filterCSS(filters[d]);
  });
  showToast(cropsChanged||filtersChanged?'Image adjustments saved. Publish changes to go live.':'No image adjustments changed.');
  closeCrop();
 });

 window.addEventListener('resize',()=>{
  if(dialog.open&&working)render();
 },{passive:true});
})();
