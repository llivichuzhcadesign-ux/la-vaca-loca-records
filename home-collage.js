(()=>{
 const host=document.getElementById('memoryCollage');if(!host)return;
 const designEmpty=new URLSearchParams(location.search).get('ui-preview')==='empty';
 if(designEmpty)host.setAttribute('aria-label','Vista de diseño de Memoria Viva sin fotografías');
 const fallback=['assets/images/site/hero/lvl-hero-01.webp','assets/images/site/hero/lvl-hero-02.webp','assets/images/site/hero/lvl-hero-03.webp'];
 const phoneLayout=window.matchMedia('(max-width:700px)');
 let currentUrls=fallback;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),toggle=document.getElementById('memoryMotionToggle');
 let userPaused=motion.matches;
 function render(urls){
  currentUrls=urls;
  host.replaceChildren();
  const rowCount=phoneLayout.matches?2:3;
  const perRow=phoneLayout.matches?Math.max(6,Math.min(8,Math.ceil(urls.length/2))):Math.max(8,Math.ceil(urls.length/3));
  for(let row=0;row<rowCount;row++){
   const track=document.createElement('div');track.className='memory-track';
   const group=document.createElement('div');group.className='memory-group';
   for(let i=0;i<perRow;i++){
    if(designEmpty){
     const block=document.createElement('div');
     block.className='memory-photo memory-placeholder';
     block.setAttribute('aria-hidden','true');
     block.innerHTML='<span class="memory-placeholder-label">MEMORIA VIVA</span><span class="memory-placeholder-mark">LVL</span><span class="memory-placeholder-foot">GUALACEO · ARCHIVO</span>';
     group.append(block);
     continue;
    }
    const link=document.createElement('a');link.className='memory-photo';link.href='archivo.html';link.setAttribute('aria-label','Ver fotografía en el archivo');link.tabIndex=-1;
    const img=document.createElement('img');img.src=urls[(i*rowCount+row)%urls.length];img.alt='';img.loading='lazy';img.decoding='async';
    img.addEventListener('error',()=>{if(!img.dataset.fallback){img.dataset.fallback='true';img.src=fallback[(i+row)%fallback.length]}});
    link.append(img);group.append(link);
   }
   const copy=group.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.querySelectorAll('a').forEach(a=>a.tabIndex=-1);
   // Cloned nodes do not inherit listeners, so mirrored images need their own fallback.
   copy.querySelectorAll('img').forEach((img,i)=>img.addEventListener('error',()=>{
    if(!img.dataset.fallback){img.dataset.fallback='true';img.src=fallback[(i+row)%fallback.length]}
   }));
   track.append(group,copy);host.append(track);
  }
 }
 // Pause drifting images while the section is offscreen or the tab is hidden.
 let onScreen=true;
 function syncMotion(){
  host.classList.toggle('is-paused',document.hidden||!onScreen||userPaused||motion.matches);
  if(toggle){toggle.disabled=motion.matches;toggle.setAttribute('aria-pressed',String(userPaused||motion.matches));toggle.textContent=userPaused||motion.matches?'Reanudar galería':'Pausar galería'}
 }
 if('IntersectionObserver' in window){
  onScreen=false;syncMotion();
  new IntersectionObserver(entries=>{
   onScreen=entries.some(entry=>entry.isIntersecting);
   syncMotion();
  },{rootMargin:'120px 0px 120px 0px',threshold:0}).observe(host);
 }
 document.addEventListener('visibilitychange',syncMotion);
 if(toggle)toggle.onclick=()=>{userPaused=!userPaused;syncMotion()};
 motion.addEventListener?.('change',event=>{userPaused=event.matches;syncMotion()});
 syncMotion();
 const onWidthChange=()=>render(currentUrls);
 if(phoneLayout.addEventListener)phoneLayout.addEventListener('change',onWidthChange);
 else phoneLayout.addListener?.(onWidthChange);
 render(fallback);
 if(!designEmpty)fetch('api/gallery').then(r=>r.ok?r.json():null).then(data=>{const urls=[...new Set((data?.items||[]).map(p=>p.url).filter(Boolean))];if(urls.length)render(urls)}).catch(()=>{});
})();
