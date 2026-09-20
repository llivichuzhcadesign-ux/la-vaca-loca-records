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
 (video?'<p><a href="'+esc(video)+'" target="_blank" rel="noopener noreferrer">Ver video ↗</a></p>':'')+
 (!audio&&!video?'<p class="availability">La grabación todavía no está disponible.</p>':'');
}
function related(item){
 const selected=records.filter(record=>(item.relatedRecords||[]).includes(record.id));
 return selected.length?'<p>Discos relacionados: '+selected.map(r=>esc(r.artist+' — '+r.title)).join(' · ')+'</p><p>'+link('index.html#shop','Explorar discos →')+'</p>':'';
}
const entries=page==='sessions'?sessions:archive;
document.getElementById('pageIndex').innerHTML=entries.map(item=>link('#'+encodeURIComponent(item.id),item.title)).join('');
document.getElementById('pageContent').innerHTML=entries.length?entries.map((item,index)=>{
 const isSession=page==='sessions';
 const photo=url(item.media?.image?.url||'');
 const associatedSession=sessions.find(s=>s.id===item.relatedSession);
 const associatedEvent=events.find(e=>e.id===item.relatedEvent);
 const details=isSession?
  '<details><summary>Sobre esta sesión</summary><p>'+esc(item.detail)+'</p>'+related(item)+'</details>'+media(item):
  '<p>'+esc(item.detail)+'</p>'+
  (photo?'<img src="'+esc(photo)+'" alt="'+esc(item.media?.image?.alt||item.title)+'" loading="lazy">':'<p class="availability">La colección de fotos y posters se publicará aquí.</p>')+
  (associatedSession?'<p>'+link('sessions.html#'+encodeURIComponent(associatedSession.id),'Ver sesión: '+associatedSession.title+' →')+'</p>':'')+
  (associatedEvent?'<details><summary>'+esc(associatedEvent.title)+'</summary><p>'+esc(associatedEvent.date+' · '+associatedEvent.place)+'</p><p>'+esc(associatedEvent.detail)+'</p></details>':'');
 return '<article class="entry" id="'+esc(item.id)+'"><div class="entry-number">'+String(index+1).padStart(2,'0')+'</div><div><p class="entry-meta">'+esc(isSession?item.type:item.category)+(isSession?'<span class="status">'+esc(item.status)+'</span>':'')+'</p><h2>'+esc(item.title)+'</h2>'+details+'</div></article>';
}).join(''):'<p>Próximamente: nuevas entradas de La Vaca Loca.</p>';
if(location.hash){const item=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(item)item.scrollIntoView();}
})();
