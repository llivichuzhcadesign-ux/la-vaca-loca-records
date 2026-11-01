/* Drag images directly into device-specific hero slots or onto the add-slides area. */
(()=>{
 'use strict';
 const root=document.getElementById('homepageHeroEditor');
 if(!root)return;
 const isFileDrag=event=>Array.from(event.dataTransfer?.types||[]).includes('Files');
 function targetFor(event){
  return event.target.closest?.('[data-hero-drop-device],[data-hero-create-drop],[data-hero-slide-card]')||null;
 }
 function clearHighlights(){
  root.querySelectorAll('.is-hero-dragover').forEach(node=>node.classList.remove('is-hero-dragover'));
 }
 root.addEventListener('dragenter',event=>{
  if(!isFileDrag(event))return;
  const target=targetFor(event);
  if(!target)return;
  event.preventDefault();
  clearHighlights();
  target.classList.add('is-hero-dragover');
 });
 root.addEventListener('dragover',event=>{
  if(!isFileDrag(event))return;
  const target=targetFor(event);
  if(!target)return;
  event.preventDefault();
  event.dataTransfer.dropEffect='copy';
  if(!target.classList.contains('is-hero-dragover')){
   clearHighlights();target.classList.add('is-hero-dragover');
  }
 });
 root.addEventListener('dragleave',event=>{
  if(!root.contains(event.relatedTarget))clearHighlights();
 });
 root.addEventListener('drop',async event=>{
  if(!isFileDrag(event))return;
  const target=targetFor(event);
  if(!target)return;
  event.preventDefault();
  event.stopPropagation();
  clearHighlights();
  const files=Array.from(event.dataTransfer?.files||[]);
  const images=files.filter(file=>file.type.startsWith('image/'));
  if(!images.length){showToast('Drop a JPG, PNG, WEBP, or other image file.');return}
  if(target.hasAttribute('data-hero-create-drop')){
   const firstIndex=draft.homepage.hero.slides.length;
   for(const file of images){
    const index=addHeroSlide(false);
    await uploadHeroFile(index,'desktop',file);
   }
   focusHeroSlide(firstIndex);
   return;
  }
  const slot=target.closest('[data-hero-drop-device]');
  const card=target.closest('[data-hero-slide-card]');
  const index=Number(slot?.dataset.heroDropIndex??card?.dataset.heroSlideCard);
  const device=slot?.dataset.heroDropDevice||'desktop';
  if(!Number.isInteger(index)||index<0)return;
  if(images.length>1)showToast('This slot accepts one photo; using the first image.');
  await uploadHeroFile(index,device,images[0]);
 });
 // Prevent dropping image files onto empty portions of the hero panel from opening
 // the file in the current tab. Only defined drop zones perform an upload.
 root.addEventListener('dragover',event=>{
  if(isFileDrag(event))event.preventDefault();
 });
 root.addEventListener('drop',event=>{
  if(isFileDrag(event))event.preventDefault();
 });
 document.addEventListener('dragend',clearHighlights);
})();
