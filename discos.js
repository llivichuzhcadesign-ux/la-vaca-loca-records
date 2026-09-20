(function(){
'use strict';
const visible=r=>!r.hideFromPublic&&!['DRAFT','PRIVATE LISTING','HIDDEN'].includes(String(r.status||'').toUpperCase());
const filterRecords=(records,query,genre)=>records.filter(r=>(!genre||r.genre===genre)&&[r.title,r.artist,r.label].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
function audioUrl(r,base){const s=String(r.audioPreview||r.media?.audio?.url||r.media?.audio?.path||'').trim();if(/^data:audio\/[\w.+-]+;base64,[a-z0-9+/=]+$/i.test(s))return s;try{const u=new URL(s,base);return s&&['http:','https:'].includes(u.protocol)&&!/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname)?u.href:'';}catch{return '';}}
function time(s){return Number.isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';}
if(typeof module!=='undefined')module.exports={visible,filterRecords,audioUrl,time};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id),content=window.SITE_CONTENT||{},settings=content.settings||{},records=(content.records||[]).filter(visible);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const audio=$('recordAudio'),deck=$('turntable'),gallery=$('discGallery');
let selected=null,results=records,selection=0,rx=27,ry=-8,demoPlaying=false;
audio.volume=.7;
const price=r=>(settings.currency||'$')+Number(r.price||0).toFixed(2);
const cover=r=>window.CalendarContent.imageUrl(r.coverImage||r.media?.artwork?.url||r.media?.artwork?.path,document.baseURI);
function notice(text){$('playerNotice').textContent=text;}
function playing(on){deck.classList.toggle('playing',on);$('playRecord').textContent=on?'Pausar Ⅱ':'Escuchar ▶';$('playRecord').setAttribute('aria-pressed',String(on));}
function renderGallery(){
 results=filterRecords(records,$('recordSearch').value,$('genreFilter').value);
 $('resultCount').textContent=results.length+' discos en la selección';
 const colors=['#864833','#35493f','#827451','#493d57','#a25439','#394c5a'];
 gallery.innerHTML=results.map((r,i)=>'<button class="sleeve" data-index="'+records.indexOf(r)+'" aria-pressed="'+(r===selected)+'" aria-label="Seleccionar '+escape(r.artist+' — '+r.title)+'"><span class="sleeve-art" style="--sleeve-color:'+colors[i%colors.length]+'"><span class="fallback-type">'+escape(r.title)+'</span><span class="fallback-code">'+escape(r.id)+' / LVL RECORDS</span>'+(cover(r)?'<img src="'+escape(cover(r))+'" alt="" loading="lazy">':'')+'</span><span class="sleeve-meta"><strong>'+escape(r.artist)+'</strong><small>'+escape(r.title)+' · '+escape(r.genre)+'</small><span class="sleeve-price">'+escape(price(r))+'<span class="sleeve-status">'+escape(r.status)+'</span></span></span></button>').join('')||'<p>No hay discos con estos filtros.</p>';
 gallery.querySelectorAll('img').forEach(img=>img.onerror=()=>img.remove());
 gallery.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>select(records[+b.dataset.index]));
 $('previousRecord').disabled=$('nextRecord').disabled=results.length<2;
}
function select(r){
 if(!r)return;selection++;selected=r;demoPlaying=false;audio.pause();audio.removeAttribute('src');audio.load();playing(false);
 deck.classList.add('loaded');$('seek').value=0;$('seek').disabled=true;$('elapsed').textContent='0:00 / 0:00';
 $('recordTitle').textContent=r.title;$('recordArtist').textContent=r.artist;
 $('recordInfo').textContent=[r.genre,r.label,r.year,r.condition].filter(Boolean).join(' / ');
 $('recordDescription').textContent=r.description||'';$('recordPrice').textContent=price(r);
 $('discLabel').textContent=r.title;
 const label=document.querySelector('.disc-label');label.style.backgroundImage='';
 const src=cover(r),version=selection;
 if(src){const image=new Image();image.onload=()=>{if(version===selection){label.style.backgroundImage='url('+JSON.stringify(src)+')';$('discLabel').textContent='';}};image.src=src;}
 const sound=audioUrl(r,document.baseURI);$('playRecord').disabled=false;if(sound)audio.src=sound;
 notice(sound?'Pulsa Escuchar para cargar el preview.':'Sin audio todavía. Pulsa Escuchar para ver el tocadiscos en modo visual.');
 const phone=String(settings.whatsappNumber||'').replace(/\D/g,''),link=$('recordInquiry');
 link.hidden=!phone;link.textContent=Number(r.stock)===0?'Consultar disponibilidad ↗':'Consultar este disco ↗';
 if(phone)link.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Hola! Me interesa '+r.artist+' — '+r.title+' ('+r.id+'). ¿Está disponible?');
 renderGallery();
}
$('playRecord').onclick=async()=>{if(!selected)return;const sound=audioUrl(selected,document.baseURI);if(!sound){demoPlaying=!demoPlaying;playing(demoPlaying);notice(demoPlaying?'Modo visual: el plato está girando y la aguja está sobre el disco.':'Modo visual en pausa.');return;}demoPlaying=false;if(!audio.paused){audio.pause();return;}const version=selection;notice('Cargando preview…');try{await audio.play();if(version===selection)notice('Escuchando '+selected.artist+' — '+selected.title);}catch{if(version===selection){playing(false);notice('No se pudo reproducir el preview. Comprueba el archivo de audio en Admin → Records.');}}};
audio.addEventListener('playing',()=>{demoPlaying=false;playing(true)});audio.addEventListener('pause',()=>playing(false));
audio.addEventListener('ended',()=>{playing(false);notice('Preview terminado. Sigue explorando la colección.');});
audio.addEventListener('error',()=>{if(!audio.getAttribute('src'))return;playing(false);notice('Preview no disponible. El archivo de audio puede faltar o no ser compatible.');});
audio.addEventListener('loadedmetadata',()=>{$('seek').disabled=!Number.isFinite(audio.duration)||audio.duration<=0;});
audio.addEventListener('timeupdate',()=>{$('elapsed').textContent=time(audio.currentTime)+' / '+time(audio.duration);if(Number.isFinite(audio.duration)&&audio.duration>0)$('seek').value=audio.currentTime/audio.duration*100;});
$('seek').oninput=()=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number($('seek').value)/100;};
$('volume').oninput=()=>audio.volume=Number($('volume').value);
function step(dir){if(!results.length)return;const i=results.indexOf(selected);select(results[(i+dir+results.length)%results.length]);}
$('previousRecord').onclick=()=>step(-1);$('nextRecord').onclick=()=>step(1);
[...new Set(records.map(r=>r.genre).filter(Boolean))].sort().forEach(genre=>{const option=document.createElement('option');option.value=genre;option.textContent=genre;$('genreFilter').append(option);});
$('recordSearch').oninput=renderGallery;$('genreFilter').onchange=renderGallery;
function angle(){deck.style.setProperty('--rx',rx+'deg');deck.style.setProperty('--ry',ry+'deg');}
const stage=$('deckStage');let drag=null;
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,rx,ry};stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;ry=Math.max(-30,Math.min(30,drag.ry+(e.clientX-drag.x)*.15));rx=Math.max(5,Math.min(48,drag.rx-(e.clientY-drag.y)*.15));angle();});
['pointerup','pointercancel','lostpointercapture'].forEach(name=>stage.addEventListener(name,()=>drag=null));
stage.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')ry-=3;if(e.key==='ArrowRight')ry+=3;if(e.key==='ArrowUp')rx+=3;if(e.key==='ArrowDown')rx-=3;ry=Math.max(-30,Math.min(30,ry));rx=Math.max(5,Math.min(48,rx));angle();});
$('resetView').onclick=()=>{rx=27;ry=-8;angle();};
if(records.length)select(records[0]);else{renderGallery();notice('La colección estará disponible próximamente.');}
})();
