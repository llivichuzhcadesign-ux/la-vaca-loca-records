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
 let slideIndex=-1,device='desktop',working=null,previewHandle=null,temporaryUrl=null,openNumber=0,drag=null;
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
  crop.layout(frame,img,value);
 }

 function selectDevice(next){
  if(!devices.includes(next)||!working)return;
  device=next;render();showMessage('');
 }

 async function openCrop(index){
  const slide=getValue('homepage.hero.slides.'+index);
  if(!slide)return;
  openNumber++;
  const ticket=openNumber;
  if(temporaryUrl){URL.revokeObjectURL(temporaryUrl);temporaryUrl=null}
  if(previewHandle){previewHandle.destroy();previewHandle=null}
  img.removeAttribute('src');
  slideIndex=index;
  working=Object.fromEntries(devices.map(name=>[name,crop.forDevice(slide,name)]));
  device=window.innerWidth<=560?'phone':window.innerWidth<=900?'tablet':'desktop';
  showText.checked=true;
  apply.disabled=false;
  showMessage('');
  const hero=draft.homepage?.hero||{};
  document.getElementById('heroCropKicker').textContent=hero.kicker||'LA VACA LOCA RECORDS';
  document.getElementById('heroCropMark').textContent=hero.title||'LVL';
  document.getElementById('heroCropTagline').textContent=hero.tagline||'Discos, sonido, sesiones y cultura.';
  dialog.showModal();
  render();
  previewHandle=crop.mount(frame,img,()=>current());
  try{
   let source=slide.src?CalendarContent.imageUrl(slide.src,new URL('../',document.baseURI)):'';
   if(slide.draftBlobKey){
    const blob=await getOriginalFile(slide.draftBlobKey);
    if(ticket!==openNumber)return;
    if(blob){temporaryUrl=URL.createObjectURL(blob);source=temporaryUrl}
   }
   if(ticket!==openNumber)return;
   if(!source){
    showMessage('Add an image from files or the gallery first, then adjust its framing.');
    apply.disabled=true;
   }else{
    img.src=source;
    if(img.complete)previewHandle?.update();
   }
  }catch(error){
   if(ticket===openNumber){
    showMessage('Image preview could not be loaded. Please check the source image.');
    apply.disabled=true;
   }
  }
 }

 function closeCrop(){
  openNumber++;
  drag=null;
  if(previewHandle){previewHandle.destroy();previewHandle=null}
  img.removeAttribute('src');
  if(temporaryUrl){URL.revokeObjectURL(temporaryUrl);temporaryUrl=null}
  slideIndex=-1;working=null;
  if(dialog.open)dialog.close();
 }

 document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-hero-crop-index]');
  if(trigger)openCrop(Number(trigger.dataset.heroCropIndex));
 });

 dialog.querySelectorAll('[data-crop-device]').forEach(button=>button.addEventListener('click',()=>selectDevice(button.dataset.cropDevice)));
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
  render();showMessage(names[device]+' framing reset to the original position.');
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
  const slide=getSlide();if(!slide||!working)return;
  const normalized=Object.fromEntries(devices.map(name=>[name,crop.normalize(working[name])]));
  if(JSON.stringify(slide.crops||{})!==JSON.stringify(normalized)){
   setValue('homepage.hero.slides.'+slideIndex+'.crops',normalized);
   // Apply commits to the local draft without rebuilding form fields.
   if(!saveDraft(false)){showMessage('Could not save your crop settings. Check browser storage.');return}
  }
  const desktop=normalized.desktop;
  const thumb=document.querySelector('[data-hero-preview-index="'+slideIndex+'"]');
  if(thumb)thumb.style.objectPosition=desktop.x+'% '+desktop.y+'%';
  showToast('Responsive image framing saved. Publish changes to go live.');
  closeCrop();
 });

 window.addEventListener('resize',()=>{
  if(dialog.open&&working)render();
 },{passive:true});
})();
