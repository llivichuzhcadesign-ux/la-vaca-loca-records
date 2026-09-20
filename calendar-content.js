(function(root){
  'use strict';
  const defaultImage='assets/images/events/calendar-pinup.jpg';
  function imageUrl(value,base){
    const s=String(value||'').trim();
    if(/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(s))return s;
    try{const u=new URL(s,base||'https://example.invalid/');return s&&['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}
  }
  function dateInput(value){const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value||'');return m?m[3]+'-'+m[2]+'-'+m[1]:'';}
  function storedDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)?value.split('-').reverse().join('.'):'Próximo anuncio';}
  function visibleEvent(e){return !e.hideFromPublic&&!['draft','hidden'].includes(String(e.status||'').toLowerCase());}
  function artwork(settings){const c=settings?.calendar||{};return {image:c.image===undefined?defaultImage:c.image,alt:c.imageAlt||'Imagen del calendario de La Vaca Loca',showTitle:c.showTitle!==false};}
  const api={imageUrl,dateInput,storedDate,visibleEvent,artwork};
  if(typeof module!=='undefined')module.exports=api;
  root.CalendarContent=api;
  if(typeof document==='undefined')return;
  if(new URLSearchParams(location.search).get('preview')==='admin-draft'){
    try{const saved=JSON.parse(localStorage.getItem('lvl-admin-draft-v1')||'null');if(saved&&Array.isArray(saved.events)){root.SITE_CONTENT=saved;root.EVENTS=saved.events;
      document.addEventListener('DOMContentLoaded',()=>{if(!document.querySelector('.calendar-preview-note')){const note=document.createElement('p');note.className='calendar-preview-note';note.textContent='Vista previa del borrador — estos cambios aún no están publicados.';note.style.cssText='padding:14px;background:#ffdc88;color:#201e19;margin:0;text-align:center;font:14px Arial';document.body.prepend(note);}
      document.querySelectorAll('a[href="eventos.html"],a[href="index.html"]').forEach(a=>a.search='?preview=admin-draft');
    });}}catch{console.warn('No se pudo cargar el borrador del calendario.');}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const config=artwork(root.SITE_CONTENT?.settings),src=imageUrl(config.image,document.baseURI);
    document.querySelectorAll('[data-calendar-image]').forEach(img=>{img.hidden=!src;img.style.display=src?'':'none';if(src)img.src=src;else img.removeAttribute('src');img.alt=config.alt;img.onerror=()=>{img.style.display='none';};});
    document.querySelectorAll('.art-title,.art-stamp').forEach(el=>el.hidden=!config.showTitle);
    const art=document.querySelector('.calendar-art');if(art){art.style.minHeight='280px';art.style.background='#bd3928';}
  });
})(typeof window!=='undefined'?window:globalThis);
