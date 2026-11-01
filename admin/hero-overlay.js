/* Live controls for the homepage text-contrast shadow, globally and per hero image. */
(()=>{
 'use strict';
 const root=document.getElementById('homepageHeroEditor');
 if(!root||!window.LVLCrop)return;
 const crop=window.LVLCrop;
 let previewRequest=0;

 function hero(){return draft.homepage?.hero||{}}
 function currentSlide(index){return hero().slides?.[index]||null}
 function val(value){return crop.clamp(Number(value)||0,0,100)}
 function effective(slide){return crop.slideOverlayStrength(hero(),slide)}
 function paintSlide(index){
  const slide=currentSlide(index);if(!slide)return;
  const value=effective(slide);
  const shade=root.querySelector('[data-hero-overlay-shade="'+index+'"]');
  if(shade)shade.style.opacity=String(value/100);
  const input=root.querySelector('[data-hero-overlay-index="'+index+'"]');
  if(input)input.value=String(value);
  const output=root.querySelector('[data-hero-overlay-value="'+index+'"]');
  if(output)output.textContent=value+'%';
  const custom=slide.overlayStrength!==undefined&&slide.overlayStrength!==null&&slide.overlayStrength!=='';
  const mode=root.querySelector('[data-hero-overlay-mode="'+index+'"]');
  if(mode)mode.textContent=custom?'Custom image setting':'Using homepage default';
  const reset=root.querySelector('[data-hero-overlay-reset="'+index+'"]');
  if(reset)reset.disabled=!custom;
 }
 function paintWatermark(){
  const strength=crop.watermarkOpacity(hero());
  const input=root.querySelector('[data-hero-watermark-opacity]');
  if(input)input.value=String(strength);
  const output=root.querySelector('#heroWatermarkOpacityValue');
  if(output)output.textContent=strength+'%';
  const placement=crop.watermarkPlacement(hero());
  const placementInput=root.querySelector('#heroWatermarkPlacement');
  if(placementInput)placementInput.value=placement;
  root.querySelectorAll('.hero-overlay-preview-watermark,.hero-admin-watermark').forEach(el=>{
   el.style.opacity=String(strength/100);
   el.dataset.placement=placement;
  });
 }
 function paintPreviewShadow(){
  const select=root.querySelector('#heroOverlayPreviewSlide');
  const previewShade=root.querySelector('#heroOverlayPreviewShade');
  if(!select||!previewShade)return;
  const slide=currentSlide(Number(select.value));
  previewShade.style.opacity=String((slide?effective(slide):crop.overlayStrength(hero()))/100);
  const note=root.querySelector('#heroOverlayPreviewNote');
  if(note&&slide){
   const override=slide.overlayStrength!==undefined&&slide.overlayStrength!==null&&slide.overlayStrength!=='';
   note.textContent=(override?'This image uses a custom shadow value.':'This image uses the homepage default.')+' Changes appear immediately; publish to update the live website.';
  }
 }
 async function renderPreview(){
  const select=root.querySelector('#heroOverlayPreviewSlide');
  const deviceInput=root.querySelector('#heroOverlayPreviewDevice');
  const element=root.querySelector('#heroOverlayPreviewImage');
  const frame=root.querySelector('.hero-overlay-preview');
  if(!select||!deviceInput||!element||!frame)return;
  const ticket=++previewRequest;
  const index=Number(select.value),slide=currentSlide(index),device=deviceInput.value;
  frame.dataset.heroOverlayPreviewDevice=device;
  element.removeAttribute('src');
  element.style.filter='none';
  paintPreviewShadow();
  if(!slide)return;
  const source=crop.mediaForDevice(slide,device);
  const framing=crop.forDevice(slide,device);
  element.style.objectPosition=framing.x+'% '+framing.y+'%';
  element.style.transform='scale('+framing.zoom+')';
  element.style.filter=crop.filterCSS(crop.filterForDevice(slide,device));
  let url=source.src?CalendarContent.imageUrl(source.src,new URL('../',document.baseURI)):'';
  if(source.draftBlobKey){
   try{url=await getHeroPreviewUrl(source.draftBlobKey)}catch(error){console.warn('Overlay preview image unavailable',error)}
  }
  if(ticket!==previewRequest||!element.isConnected)return;
  if(url)element.src=url;
 }
 function refresh(){
  const global=root.querySelector('#heroOverlayStrength');
  if(!global)return;
  const strength=crop.overlayStrength(hero());
  global.value=String(strength);
  const output=root.querySelector('#heroOverlayStrengthValue');
  if(output)output.textContent=strength+'%';
  (hero().slides||[]).forEach((slide,index)=>paintSlide(index));
  paintWatermark();
  renderPreview();
 }
 root.addEventListener('input',event=>{
  if(event.target.matches('[data-hero-watermark-opacity]')){
   setValue('homepage.hero.watermarkOpacity',val(event.target.value));
   paintWatermark();
   return;
  }
  if(event.target.matches('[data-hero-overlay-global]')){
   const value=val(event.target.value);
   setValue('homepage.hero.overlayStrength',value);
   const output=root.querySelector('#heroOverlayStrengthValue');
   if(output)output.textContent=value+'%';
   (hero().slides||[]).forEach((slide,index)=>paintSlide(index));
   paintPreviewShadow();
  }
  const indexInput=event.target.closest('[data-hero-overlay-index]');
  if(indexInput){
   const index=Number(indexInput.dataset.heroOverlayIndex);
   if(!currentSlide(index))return;
   setValue('homepage.hero.slides.'+index+'.overlayStrength',val(indexInput.value));
   paintSlide(index);
   paintPreviewShadow();
  }
 });
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-hero-overlay-reset]');
  if(!button)return;
  const index=Number(button.dataset.heroOverlayReset);
  const slide=currentSlide(index);if(!slide)return;
  delete slide.overlayStrength;
  markDirty();
  paintSlide(index);
  paintPreviewShadow();
 });
 root.addEventListener('change',event=>{
  if(event.target.matches('[data-hero-watermark-placement]')){
   const choice=event.target.value;
   setValue('homepage.hero.watermarkPlacement',['edge','full','upper'].includes(choice)?choice:'edge');
   paintWatermark();
   return;
  }
  if(event.target.matches('#heroOverlayPreviewSlide,#heroOverlayPreviewDevice'))renderPreview();
 });
 window.LVLHeroOverlay={refresh};
 refresh();
})();
