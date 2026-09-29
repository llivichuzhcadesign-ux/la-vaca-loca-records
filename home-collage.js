(()=>{
 const host=document.getElementById('memoryCollage');if(!host)return;
 const fallback=['assets/images/site/hero/lvl-hero-01.webp','assets/images/site/hero/lvl-hero-02.webp','assets/images/site/hero/lvl-hero-03.webp'];
 function render(urls){
  host.replaceChildren();
  for(let row=0;row<3;row++){
   const track=document.createElement('div');track.className='memory-track';
   const group=document.createElement('div');group.className='memory-group';
   const count=Math.max(8,Math.ceil(urls.length/3));
   for(let i=0;i<count;i++){
    const link=document.createElement('a');link.className='memory-photo';link.href='archivo.html';link.setAttribute('aria-label','Ver fotografía en el archivo');
    const img=document.createElement('img');img.src=urls[(i*3+row)%urls.length];img.alt='';img.loading='lazy';img.decoding='async';
    img.addEventListener('error',()=>{if(!img.dataset.fallback){img.dataset.fallback='true';img.src=fallback[(i+row)%fallback.length]}});
    link.append(img);group.append(link);
   }
   const copy=group.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.querySelectorAll('a').forEach(a=>a.tabIndex=-1);
   track.append(group,copy);host.append(track);
  }
 }
 render(fallback);
 fetch('api/gallery').then(r=>r.ok?r.json():null).then(data=>{const urls=[...new Set((data?.items||[]).map(p=>p.url).filter(Boolean))];if(urls.length)render(urls)}).catch(()=>{});
})();
