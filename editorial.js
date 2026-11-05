(function(){
'use strict';
const data=window.SITE_CONTENT||{};
const page=document.body.dataset.page;
const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const visible=items=>(items||[]).filter(item=>!item.hideFromPublic);
const sessions=visible(data.sessions);
const archive=visible(data.archiveItems);
const records=visible(data.records);
const events=visible(data.events);
const url=value=>{if(!value||!String(value).trim())return '';try{const parsed=new URL(value,location.href);return ['http:','https:'].includes(parsed.protocol)?parsed.href:''}catch{return ''}};
const link=(href,label)=>'<a href="'+esc(href)+'">'+esc(label)+'</a>';
// Only configured remote media is shown; unfinished local placeholders stay out of these pages.
function media(item){
 const m=item.media||{};
 const audio=url(m.audio?.url||'');
 const video=url(m.video?.youtubeUrl||m.video?.url||item.youtubeUrl||'');
 return (audio?'<audio controls preload="none" src="'+esc(audio)+'">Tu navegador no permite reproducir audio.</audio>':'')+
 (video?'<p><a href="'+esc(video)+'" target="_blank" rel="noopener noreferrer">Ver video</a></p>':'')+
 (!audio&&!video?'<p class="availability">La grabación todavía no está disponible.</p>':'');
}
function related(item){
 const selected=records.filter(record=>(item.relatedRecords||[]).includes(record.id));
 return selected.length?'<p>Discos relacionados: '+selected.map(r=>esc(r.artist+' — '+r.title)).join(' · ')+'</p><p>'+link('index.html#shop','Explorar discos')+'</p>':'';
}
const designEmpty=new URLSearchParams(location.search).get('ui-preview')==='empty';
const entries=designEmpty?[]:(page==='sessions'?sessions:archive);
const index=document.getElementById('pageIndex');
index.innerHTML=entries.map(item=>link('#'+encodeURIComponent(item.id),item.title)).join('');
index.hidden=!entries.length;
document.getElementById('pageContent').innerHTML=entries.length?entries.map((item,index)=>{
 const isSession=page==='sessions';
 const photo=url(item.media?.image?.url||'');
 const associatedSession=sessions.find(s=>s.id===item.relatedSession);
 const associatedEvent=events.find(e=>e.id===item.relatedEvent);
 const details=isSession?
  '<details><summary>Sobre esta sesión</summary><p>'+esc(item.detail)+'</p>'+related(item)+'</details>'+media(item):
  '<p>'+esc(item.detail)+'</p>'+
  (photo?'<img src="'+esc(photo)+'" alt="'+esc(item.media?.image?.alt||item.title)+'" loading="lazy">':'<p class="availability">La colección de fotos y posters se publicará aquí.</p>')+
  (associatedSession?'<p>'+link('sessions.html#'+encodeURIComponent(associatedSession.id),'Ver sesión: '+associatedSession.title)+'</p>':'')+
  (associatedEvent?'<details><summary>'+esc(associatedEvent.title)+'</summary><p>'+esc(associatedEvent.date+' · '+associatedEvent.place)+'</p><p>'+esc(associatedEvent.detail)+'</p></details>':'');
 return '<article class="entry" id="'+esc(item.id)+'"><div class="entry-number">'+String(index+1).padStart(2,'0')+'</div><div><p class="entry-meta">'+esc(isSession?item.type:item.category)+(isSession?'<span class="status">'+esc(item.status)+'</span>':'')+'</p><h2>'+esc(item.title)+'</h2>'+details+'</div></article>';
}).join(''):(()=>{
 const isSession=page==='sessions';
 const heading=isSession?'Las próximas sesiones están tomando forma.':'El archivo está en construcción.';
 const summary=isSession
  ?'Próximamente reuniremos aquí nuestras escuchas, invitados y grabaciones, con un espacio para cada encuentro.'
  :'Este espacio reunirá fotografías, carteles y recuerdos de la vida musical de La Vaca Loca.';
 const title=isSession?'SESSIONS / LA VACA LOCA':'MEMORIA VIVA / ARCHIVO';
 const next=isSession?'Explorar discos':'Explorar sesiones';
 const nextUrl=isSession?'discos.html':'sessions.html';
 const previewNote=designEmpty?'<p class="editorial-empty-preview">VISTA DE DISEÑO · SIN CONTENIDO</p>':'';
 return '<section class="editorial-empty" aria-labelledby="editorialEmptyTitle">'+
  '<div class="editorial-empty-art" aria-hidden="true"><span class="editorial-empty-art-label">'+title+'</span><span class="editorial-empty-symbol">LVL</span><span class="editorial-empty-art-caption">GUALACEO / ECUADOR</span></div>'+
  '<div class="editorial-empty-copy">'+previewNote+'<p class="editorial-empty-kicker">PRÓXIMAMENTE</p><h2 id="editorialEmptyTitle">'+heading+'</h2><p>'+summary+'</p>'+
  '<div class="editorial-empty-actions"><a href="'+nextUrl+(designEmpty?'?ui-preview=empty':'')+'">'+next+' <span aria-hidden="true">↗</span></a><a href="index.html'+(designEmpty?'?ui-preview=empty':'')+'">Volver al inicio</a></div></div></section>';
})();
if(location.hash){const item=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(item)item.scrollIntoView();}
})();
