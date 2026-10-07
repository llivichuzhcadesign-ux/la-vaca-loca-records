(function(){
'use strict';

const visible=r=>!r.hideFromPublic&&!['DRAFT','PRIVATE LISTING','HIDDEN'].includes(String(r.status||'').toUpperCase());
const filterRecords=(records,query,genre)=>records.filter(r=>(!genre||r.genre===genre)&&[r.title,r.artist,r.label].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
function audioUrl(r,base){
  const s=String(r.media?.audio?.url||r.audioPreview||r.media?.audio?.path||'').trim();
  if(/^data:audio\/[\w.+-]+;base64,[a-z0-9+/=]+$/i.test(s))return s;
  try{
    const u=new URL(s,base);
    if(u.origin===new URL(base).origin&&u.pathname.startsWith('/media/'))u.searchParams.set('audioSeek','2');
    return s&&['http:','https:'].includes(u.protocol)&&!/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname)?u.href:'';
  }catch{return ''}
}
function time(s){return Number.isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00'}
if(typeof module!=='undefined')module.exports={visible,filterRecords,audioUrl,time};
if(typeof document==='undefined')return;

const $=id=>document.getElementById(id);
const contentData=window.SITE_CONTENT||{};
const settings=contentData.settings||{};
const records=(contentData.records||[]).filter(visible);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const audio=$('recordAudio');
const deck=$('turntable');
const gallery=$('discGallery');
const libraryColumn=document.querySelector('.library-column');
const libraryToggle=$('libraryToggle');
const tempoFader=$('tempoFader');
const tempoValue=$('tempoValue');
const tempoReset=$('tempoReset');
const tempoModule=$('tempoFaderModule');
const deckPlay=$('deckPlay');
const deckLight=$('deckLight');
const sleeveZone=$('sleeveZone');
const sleeveDiscPreview=$('sleeveDiscPreview');
const sleeveDiscLabel=$('sleeveDiscLabel');
const transportDisc=$('transportDisc');
const transportDiscLabel=$('transportDiscLabel');
const platter=document.querySelector('.platter');

if(sleeveZone){
  sleeveZone.tabIndex=0;
  sleeveZone.setAttribute('role','button');
}

const colors=['#864833','#35493f','#827451','#493d57','#a25439','#394c5a'];

let selected=null;
let pendingRecord=null;
let results=records;
let selection=0;
let rx=8;
let ry=0;
let demoPlaying=false;
let tempoPercent=0;
let demoTime=0;
let demoDuration=30;
let demoFrame=0;
let demoLast=0;
let isLoadingDisc=false;

audio.volume=.7;

const price=r=>(settings.currency||'$')+Number(r.price||0).toFixed(2);
const cover=r=>window.CalendarContent.imageUrl(r.coverImage||r.media?.artwork?.url||r.media?.artwork?.path,document.baseURI);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function notice(text){$('playerNotice').textContent=text}

function playing(on){
  deck.classList.toggle('playing',on);
  if(deckPlay){
    deckPlay.setAttribute('aria-pressed',String(on));
    deckPlay.setAttribute('aria-label',on?'Pausar disco':'Iniciar disco');
  }
}

function applyTempo(value){
  tempoPercent=Math.max(-8,Math.min(8,Number(value)||0));
  const rate=1+(tempoPercent/100);
  audio.playbackRate=rate;
  if('preservesPitch' in audio)audio.preservesPitch=false;
  if('mozPreservesPitch' in audio)audio.mozPreservesPitch=false;
  if('webkitPreservesPitch' in audio)audio.webkitPreservesPitch=false;
  deck.style.setProperty('--spin-duration',(1.8/rate).toFixed(4)+'s');
  if(tempoFader)tempoFader.value=String(tempoPercent);
  if(tempoValue)tempoValue.textContent=(tempoPercent>0?'+':'')+tempoPercent.toFixed(1)+'%';
  if(tempoModule)tempoModule.classList.toggle('is-center',Math.abs(tempoPercent)<.05);
}

function setTimeline(current,duration){
  const safeDuration=Number.isFinite(duration)&&duration>0?duration:0;
  const safeCurrent=Math.max(0,Math.min(Number.isFinite(current)?current:0,safeDuration||0));
  const progress=safeDuration?safeCurrent/safeDuration*100:0;
  $('deckCurrent').textContent=time(safeCurrent);
  $('deckDuration').textContent=time(safeDuration);
  $('seek').value=progress;
  $('seek').style.setProperty('--seek-progress',progress+'%');
  $('seek').setAttribute('aria-valuetext',time(safeCurrent)+' de '+time(safeDuration));
  const vinyl=document.querySelector('.vinyl');if(vinyl){vinyl.setAttribute('aria-valuemin','0');vinyl.setAttribute('aria-valuemax',String(safeDuration));vinyl.setAttribute('aria-valuenow',String(Math.round(safeCurrent)));vinyl.setAttribute('aria-valuetext',time(safeCurrent)+' de '+time(safeDuration))}
}

function stopDemoClock(){
  if(demoFrame){cancelAnimationFrame(demoFrame);demoFrame=0}
  demoLast=0;
}

function demoTick(now){
  if(!demoPlaying)return stopDemoClock();
  if(!demoLast)demoLast=now;
  const delta=(now-demoLast)/1000;
  demoLast=now;
  demoTime+=delta*(1+tempoPercent/100);
  if(demoTime>=demoDuration){
    demoTime=demoDuration;
    demoPlaying=false;
    playing(false);
    setTimeline(demoTime,demoDuration);
    stopDemoClock();
    return;
  }
  setTimeline(demoTime,demoDuration);
  demoFrame=requestAnimationFrame(demoTick);
}

function startDemoClock(){
  $('seek').disabled=false;
  if(demoTime>=demoDuration)demoTime=0;
  setTimeline(demoTime,demoDuration);
  stopDemoClock();
  demoPlaying=true;
  playing(true);
  demoFrame=requestAnimationFrame(demoTick);
}

function focusRecordView(){
  if(libraryColumn)libraryColumn.classList.remove('record-focus');
  if(libraryToggle)libraryToggle.setAttribute('aria-expanded','true');
}

// Desktop keeps selection details and the scrollable collection in one library.
const desktopLibrary=window.matchMedia?.('(min-width:951px)');
const selectionPanel=document.querySelector('.listening-panel');
const collectionPanel=document.querySelector('.collection');
function arrangeLibrary(){
  if(!selectionPanel||!collectionPanel||!libraryColumn)return;
  if(desktopLibrary?.matches){collectionPanel.insertBefore(selectionPanel,gallery)}
  else{libraryColumn.insertBefore(selectionPanel,collectionPanel)}
  focusRecordView();
}
arrangeLibrary();
desktopLibrary?.addEventListener('change',arrangeLibrary);

function recordColor(r){
  return colors[Math.max(0,records.indexOf(r))%colors.length];
}

function setSleeveDiscVisual(r){
  const src=cover(r);
  const color=recordColor(r);
  if(sleeveZone)sleeveZone.style.setProperty('--sleeve-label',color);
  if(sleeveDiscLabel){
    sleeveDiscLabel.style.backgroundImage=src?'url('+JSON.stringify(src)+')':'';
  }
}

function setTransportDiscVisual(r){
  const src=cover(r);
  const color=recordColor(r);
  if(transportDisc)transportDisc.style.setProperty('--transport-label',color);
  if(transportDiscLabel){
    transportDiscLabel.style.backgroundImage=src?'url('+JSON.stringify(src)+')':'';
  }
}

function syncSleeveReadyState(){
  if(!sleeveZone)return;
  const ready=!!pendingRecord&&pendingRecord!==selected&&!isLoadingDisc;
  sleeveZone.classList.toggle('is-ready',ready);
  sleeveZone.setAttribute('aria-disabled',String(!ready));
  sleeveZone.setAttribute('aria-label',ready
    ?'Colocar '+pendingRecord.artist+' — '+pendingRecord.title+' en el tocadiscos'
    :selected?'Disco actual: '+selected.artist+' — '+selected.title:'Disco no disponible');
}

function updateSelectedInfo(r){
  if(!r)return;
  pendingRecord=r;
  $('recordTitle').textContent=r.title;
  $('recordArtist').textContent=r.artist;
  $('recordInfo').textContent=[r.genre,r.label,r.year,r.condition].filter(Boolean).join(' / ');
  $('recordDescription').textContent=r.description||'';
  $('recordPrice').textContent=price(r);
  $('recordStock').textContent=String(r.status||((Number(r.stock)||0)>0?'IN STOCK':'SOLD OUT'));

  const selectedArt=$('selectedArtwork');
  const selectedImage=$('selectedArtworkImage');
  const selectedColor=recordColor(r);
  if(selectedArt)selectedArt.style.background='linear-gradient(145deg,'+selectedColor+',#35231f)';
  if(selectedImage){
    selectedImage.hidden=true;
    selectedImage.removeAttribute('src');
  }

  if(sleeveZone){
    sleeveZone.classList.remove('disc-on-deck','is-ejecting','is-flying','is-swapping');
  }
  setSleeveDiscVisual(r);
  syncSleeveReadyState();

  const src=cover(r);
  if(src){
    const image=new Image();
    image.onload=()=>{
      if(pendingRecord!==r&&selected!==r)return;
      if(selectedImage){
        selectedImage.src=src;
        selectedImage.hidden=false;
      }
    };
    image.onerror=()=>{
      if((pendingRecord===r||selected===r)&&selectedImage){
        selectedImage.hidden=true;
        selectedImage.removeAttribute('src');
      }
    };
    image.src=src;
  }

  const phone=String(settings.whatsappNumber||'').replace(/\D/g,'');
  const link=$('recordInquiry');
  link.hidden=!phone;
  link.textContent=Number(r.stock)===0?'Consultar disponibilidad ↗':'Consultar este disco ↗';
  if(phone)link.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Hola! Me interesa '+r.artist+' — '+r.title+' ('+r.id+'). ¿Está disponible?');
}

function renderGallery(){
  results=filterRecords(records,$('recordSearch').value,$('genreFilter').value);
  $('resultCount').textContent=results.length+' discos en la selección';
  gallery.innerHTML=results.map((r,i)=>{
    const detail=[r.genre,r.year].filter(Boolean).join(' · ');
    const status=String(r.status||'').trim();
    const active=pendingRecord||selected;
    return '<button class="sleeve" data-index="'+records.indexOf(r)+'" aria-pressed="'+(r===active)+'" aria-label="Seleccionar '+escape(r.artist+' — '+r.title)+'"><span class="sleeve-art" style="--sleeve-color:'+colors[i%colors.length]+'"><span class="fallback-type">'+escape(r.title)+'</span><span class="fallback-code">'+escape(r.id)+' / LVL RECORDS</span>'+(cover(r)?'<img src="'+escape(cover(r))+'" alt="" loading="lazy">':'')+'</span><span class="sleeve-meta"><strong>'+escape(r.artist)+'</strong><small>'+escape(r.title)+'</small><span class="sleeve-footer"><span class="sleeve-detail">'+escape(detail)+'</span><span class="sleeve-price">'+(status?'<i class="sleeve-status-dot" title="'+escape(status)+'"></i>':'')+escape(price(r))+'</span></span></span></button>';
  }).join('')||'<p>No hay discos con estos filtros.</p>';
  gallery.querySelectorAll('img').forEach(img=>img.onerror=()=>img.remove());
  gallery.querySelectorAll('[data-index]').forEach(button=>{
    button.onclick=()=>stageFromLibrary(records[+button.dataset.index]);
  });
}

function stopCurrentForSwap(){
  demoPlaying=false;
  stopDemoClock();
  demoTime=0;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  playing(false);
  $('seek').disabled=true;
  setTimeline(0,0);
}

function mountRecord(r,focusView=false,infoReady=false){
  if(!r)return;
  selection++;
  selected=r;
  pendingRecord=null;
  stopCurrentForSwap();
  applyTempo(tempoPercent);
  deck.classList.add('loaded');
  if(!infoReady)updateSelectedInfo(r);

  $('discLabel').textContent=r.title;
  const label=document.querySelector('.disc-label');
  label.style.backgroundImage='';
  const src=cover(r);
  const version=selection;
  if(src){
    const image=new Image();
    image.onload=()=>{
      if(version!==selection)return;
      label.style.backgroundImage='url('+JSON.stringify(src)+')';
      $('discLabel').textContent='';
    };
    image.src=src;
  }

  const sound=audioUrl(r,document.baseURI);
  if(deckPlay)deckPlay.disabled=false;
  if(sound)audio.src=sound;
  notice('Disco listo en el plato.');

  if(sleeveZone){
    sleeveZone.classList.remove('is-ejecting','is-flying','is-swapping');
    sleeveZone.classList.add('disc-on-deck');
  }
  syncSleeveReadyState();

  renderGallery();
  if(focusView)focusRecordView(true);
}

async function animateDiscTransfer(r){
  if(!sleeveZone||!sleeveDiscPreview||!transportDisc||!platter)return;
  setTransportDiscVisual(r);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  sleeveZone.classList.remove('disc-on-deck');
  sleeveZone.classList.add('is-ejecting');
  await wait(420);

  const from=sleeveDiscPreview.getBoundingClientRect();
  const to=platter.getBoundingClientRect();
  if(!from.width||!to.width)return;

  const startX=from.left+from.width/2;
  const startY=from.top+from.height/2;
  const endX=to.left+to.width/2;
  const endY=to.top+to.height/2;
  const midX=(startX+endX)/2;
  const midY=Math.min(startY,endY)-Math.max(70,Math.abs(endX-startX)*.08);
  const endScale=Math.max(1,Math.min(4,(to.width*.91)/from.width));

  transportDisc.style.width=from.width+'px';
  transportDisc.style.left=startX+'px';
  transportDisc.style.top=startY+'px';
  transportDisc.classList.add('is-visible');
  sleeveZone.classList.add('is-flying');
  deck.classList.add('disc-loading');

  const animation=transportDisc.animate([
    {left:startX+'px',top:startY+'px',transform:'translate(-50%,-50%) scale(1) rotate(0deg)',offset:0},
    {left:(startX+(midX-startX)*.58)+'px',top:(startY-72)+'px',transform:'translate(-50%,-50%) scale(1.08) rotate(72deg)',offset:.24},
    {left:midX+'px',top:midY+'px',transform:'translate(-50%,-50%) scale('+(endScale*.78)+') rotate(176deg)',offset:.63},
    {left:endX+'px',top:endY+'px',transform:'translate(-50%,-50%) scale('+endScale+') rotate(324deg)',offset:1}
  ],{
    duration:1120,
    easing:'cubic-bezier(.16,.78,.18,1)',
    fill:'forwards'
  });

  try{await animation.finished}catch{}
  transportDisc.classList.remove('is-visible');
  animation.cancel();
  sleeveZone.classList.remove('is-ejecting','is-flying');
}

function stageFromLibrary(r){
  if(!r||isLoadingDisc)return;

  updateSelectedInfo(r);
  focusRecordView(true);

  if(r===selected){
    pendingRecord=null;
    if(sleeveZone)sleeveZone.classList.add('disc-on-deck');
    syncSleeveReadyState();
    notice('Este disco ya está en el plato.');
  }else{
    notice('Disco seleccionado. Pasa sobre la funda y presiónala para colocarlo en el plato.');
  }

  renderGallery();
}

function createReturnSleeveGhost(r,rect){
  const ghost=document.createElement('div');
  ghost.className='return-sleeve-ghost';
  ghost.style.left=rect.left+'px';
  ghost.style.top=rect.top+'px';
  ghost.style.width=rect.width+'px';
  ghost.style.height=rect.height+'px';
  ghost.style.setProperty('--ghost-color',recordColor(r));

  const src=cover(r);
  if(src){
    const img=document.createElement('img');
    img.alt='';
    img.src=src;
    ghost.append(img);
  }

  document.body.append(ghost);
  requestAnimationFrame(()=>ghost.classList.add('is-visible'));
  return ghost;
}

async function animateDiscReturn(r){
  if(!r||!transportDisc||!platter||!sleeveZone)return;

  const jacket=$('selectedArtwork');
  if(!jacket)return;

  const from=platter.getBoundingClientRect();
  const to=jacket.getBoundingClientRect();
  if(!from.width||!to.width)return;

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ghost=createReturnSleeveGhost(r,to);

  if(reduced){
    await wait(80);
    ghost.remove();
    return;
  }

  setTransportDiscVisual(r);

  const baseWidth=to.width*.86;
  const startX=from.left+from.width/2;
  const startY=from.top+from.height/2;
  const targetX=to.left+to.width*.76;
  const targetY=to.top+to.height*.51;
  const midX=(startX+targetX)/2;
  const midY=Math.min(startY,targetY)-78;
  const startScale=Math.max(1,(from.width*.91)/baseWidth);

  transportDisc.style.width=baseWidth+'px';
  transportDisc.style.left=startX+'px';
  transportDisc.style.top=startY+'px';
  transportDisc.classList.add('is-visible');
  deck.classList.add('disc-unloading');

  const returnFlight=transportDisc.animate([
    {left:startX+'px',top:startY+'px',transform:'translate(-50%,-50%) scale('+startScale+') rotate(0deg)',opacity:1,offset:0},
    {left:midX+'px',top:midY+'px',transform:'translate(-50%,-50%) scale('+(Math.max(1,startScale*.64))+') rotate(-142deg)',opacity:1,offset:.58},
    {left:targetX+'px',top:targetY+'px',transform:'translate(-50%,-50%) scale(1) rotate(-286deg)',opacity:1,offset:1}
  ],{
    duration:900,
    easing:'cubic-bezier(.2,.72,.18,1)',
    fill:'forwards'
  });

  try{await returnFlight.finished}catch{}

  const tuck=transportDisc.animate([
    {left:targetX+'px',top:targetY+'px',transform:'translate(-50%,-50%) scale(1) rotate(-286deg)',opacity:1},
    {left:(to.left+to.width*.54)+'px',top:targetY+'px',transform:'translate(-50%,-50%) scale(.9) rotate(-302deg)',opacity:0}
  ],{
    duration:310,
    easing:'cubic-bezier(.4,0,.2,1)',
    fill:'forwards'
  });

  try{await tuck.finished}catch{}

  returnFlight.cancel();
  tuck.cancel();
  transportDisc.classList.remove('is-visible');

  ghost.classList.remove('is-visible');
  await wait(190);
  ghost.remove();
}

async function commitPendingRecord(){
  const next=pendingRecord;
  const current=selected;
  if(!next||next===current||isLoadingDisc)return;

  isLoadingDisc=true;
  syncSleeveReadyState();
  if(deckPlay)deckPlay.disabled=true;
  if(sleeveZone)sleeveZone.classList.add('is-swapping');

  // Stop first; the tonearm must visibly return before the record is touched.
  stopCurrentForSwap();
  deck.classList.add('arm-returning');

  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    await wait(980);
  }

  // Return the record currently on the platter to its own jacket.
  await animateDiscReturn(current);
  deck.classList.remove('arm-returning');

  // Reveal the staged jacket again, then let its record come out.
  if(sleeveZone)sleeveZone.classList.remove('is-swapping');
  setSleeveDiscVisual(next);
  await wait(180);

  await animateDiscTransfer(next);
  mountRecord(next,true,true);

  deck.classList.remove('disc-unloading','disc-loading','arm-returning');
  deck.classList.add('disc-arrived');
  setTimeout(()=>deck.classList.remove('disc-arrived'),520);

  isLoadingDisc=false;
  syncSleeveReadyState();
  if(deckPlay)deckPlay.disabled=false;
}

async function togglePlayback(){
  if(!selected||isLoadingDisc)return;

  if(demoPlaying){
    demoPlaying=false;
    stopDemoClock();
    playing(false);
    notice('Modo visual en pausa.');
    return;
  }

  const sound=audioUrl(selected,document.baseURI);
  if(!sound){
    startDemoClock();
    notice('Modo visual activo.');
    return;
  }

  if(!audio.paused){
    audio.pause();
    return;
  }

  const version=selection;
  notice('Cargando preview…');
  try{
    await audio.play();
    if(version===selection)notice('Escuchando '+selected.artist+' — '+selected.title);
  }catch{
    if(version===selection){
      startDemoClock();
      notice('Preview no disponible. Tocadiscos en modo visual.');
    }
  }
}

if(sleeveZone){
  sleeveZone.addEventListener('click',()=>commitPendingRecord());
  sleeveZone.addEventListener('keydown',e=>{
    if(!['Enter',' '].includes(e.key))return;
    e.preventDefault();
    commitPendingRecord();
  });
}

if(deckPlay)deckPlay.onclick=togglePlayback;

if(deckLight)deckLight.onclick=e=>{
  e.stopPropagation();
  const on=!deck.classList.contains('light-on');
  deck.classList.toggle('light-on',on);
  deckLight.setAttribute('aria-pressed',String(on));
  deckLight.setAttribute('aria-label',on?'Apagar luz del plato':'Encender luz del plato');
};

audio.addEventListener('playing',()=>{
  demoPlaying=false;
  stopDemoClock();
  playing(true);
});
audio.addEventListener('pause',()=>{if(!demoPlaying)playing(false)});
audio.addEventListener('ended',()=>{
  playing(false);
  notice('Preview terminado.');
});
audio.addEventListener('error',()=>{
  if(!audio.getAttribute('src')||demoPlaying)return;
  notice('Preview no disponible.');
});

function syncDeckTimeline(){
  const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
  const current=Number.isFinite(audio.currentTime)?audio.currentTime:0;
  setTimeline(current,duration);
}

audio.addEventListener('loadedmetadata',()=>{
  const ready=Number.isFinite(audio.duration)&&audio.duration>0;
  $('seek').disabled=!ready;
  syncDeckTimeline();
});
audio.addEventListener('timeupdate',syncDeckTimeline);
audio.addEventListener('durationchange',syncDeckTimeline);

$('seek').oninput=()=>{
  const progress=Number($('seek').value);
  const realDuration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
  if(realDuration){
    audio.currentTime=realDuration*progress/100;
    setTimeline(audio.currentTime,realDuration);
    return;
  }
  demoTime=demoDuration*progress/100;
  setTimeline(demoTime,demoDuration);
};

if(tempoFader)tempoFader.oninput=e=>applyTempo(e.target.value);
if(tempoReset)tempoReset.onclick=e=>{
  e.stopPropagation();
  applyTempo(0);
  tempoFader?.focus();
};
applyTempo(0);

[...new Set(records.map(r=>r.genre).filter(Boolean))].sort().forEach(genre=>{
  const option=document.createElement('option');
  option.value=genre;
  option.textContent=genre;
  $('genreFilter').append(option);
});

$('recordSearch').oninput=renderGallery;
$('genreFilter').onchange=renderGallery;
if(libraryToggle)libraryToggle.onclick=()=>focusRecordView(false);
window.addEventListener('resize',()=>{if(window.innerWidth<=950)focusRecordView(false)});

function angle(){
  deck.style.setProperty('--rx',rx+'deg');
  deck.style.setProperty('--ry',ry+'deg');
}

// Turn the vinyl to scrub; dragging the surrounding deck still tilts it.
const interactiveVinyl=document.querySelector('.vinyl');
let vinylDrag=null;
if(interactiveVinyl){
 interactiveVinyl.tabIndex=0;
 interactiveVinyl.setAttribute('role','slider');
 interactiveVinyl.setAttribute('aria-label','Girar disco para avanzar o retroceder el audio');
 function scrubDuration(){return Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:demoDuration}
 function scrubCurrent(){return Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime:demoTime}
 function scrubTo(value){
  const duration=scrubDuration();const current=Math.max(0,Math.min(duration,value));
  if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=current;else demoTime=current;
  setTimeline(current,duration);
 }
 function pointerAngle(e){const box=interactiveVinyl.getBoundingClientRect();return Math.atan2((e.clientY-box.top-box.height/2)/box.height,(e.clientX-box.left-box.width/2)/box.width)}
 interactiveVinyl.addEventListener('pointerdown',e=>{
  e.stopPropagation();if(isLoadingDisc||$('seek').disabled||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();
  const matrix=new DOMMatrix(getComputedStyle(interactiveVinyl).transform);
  const rotation=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
  vinylDrag={id:e.pointerId,angle:pointerAngle(e),rotation,resume:!audio.paused,demo:demoPlaying,selection};
  audio.pause();demoPlaying=false;stopDemoClock();
  interactiveVinyl.style.animation='none';interactiveVinyl.style.transform='rotate('+rotation+'deg)';
  interactiveVinyl.classList.add('is-scrubbing');interactiveVinyl.setPointerCapture(e.pointerId);
 });
 interactiveVinyl.addEventListener('pointermove',e=>{
  if(!vinylDrag||e.pointerId!==vinylDrag.id)return;e.preventDefault();e.stopPropagation();
  const angle=pointerAngle(e);let delta=angle-vinylDrag.angle;
  if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;
  vinylDrag.angle=angle;vinylDrag.rotation+=delta*180/Math.PI;
  interactiveVinyl.style.transform='rotate('+vinylDrag.rotation+'deg)';
  scrubTo(scrubCurrent()+delta/(2*Math.PI)*8);
 });
 function finishVinylDrag(e){
  if(!vinylDrag||e.pointerId!==vinylDrag.id)return;const drag=vinylDrag;vinylDrag=null;
  interactiveVinyl.classList.remove('is-scrubbing');interactiveVinyl.style.animation='';interactiveVinyl.style.transform='';
  const spinSeconds=1.8/(1+tempoPercent/100);interactiveVinyl.style.animationDelay=-(drag.rotation%360+360)%360/360*spinSeconds+'s';
  if(drag.selection!==selection)return;
  if(drag.resume)audio.play().catch(()=>playing(false));else if(drag.demo)startDemoClock();
 }
 ['pointerup','pointercancel','lostpointercapture'].forEach(event=>interactiveVinyl.addEventListener(event,finishVinylDrag));
 interactiveVinyl.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||$('seek').disabled)return;e.preventDefault();e.stopPropagation();
  scrubTo(e.key==='Home'?0:e.key==='End'?scrubDuration():scrubCurrent()+(e.key==='ArrowRight'?2:-2));
 });
}

const stage=$('deckStage');
let drag=null;
stage.addEventListener('pointerdown',e=>{
  if(e.target.closest('input,button,a'))return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,rx,ry};
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  ry=Math.max(-18,Math.min(18,drag.ry+(e.clientX-drag.x)*.12));
  rx=Math.max(-2,Math.min(24,drag.rx-(e.clientY-drag.y)*.12));
  angle();
});
['pointerup','pointercancel','lostpointercapture'].forEach(name=>stage.addEventListener(name,()=>drag=null));
stage.addEventListener('keydown',e=>{
  if(e.target!==stage)return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();
  if(e.key==='ArrowLeft')ry-=3;
  if(e.key==='ArrowRight')ry+=3;
  if(e.key==='ArrowUp')rx+=3;
  if(e.key==='ArrowDown')rx-=3;
  ry=Math.max(-18,Math.min(18,ry));
  rx=Math.max(-2,Math.min(24,rx));
  angle();
});

if(records.length){
  let requestedId='';
  try{requestedId=decodeURIComponent(location.hash.slice(1))}catch(error){}
  const initialRecord=records.find(record=>record.id===requestedId)||records[0];
  updateSelectedInfo(initialRecord);
  mountRecord(initialRecord,false,true);
}else{
  if(deckPlay)deckPlay.disabled=true;
  renderGallery();
  notice('La colección estará disponible próximamente.');
}
})();
