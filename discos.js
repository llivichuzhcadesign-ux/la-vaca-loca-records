(function(){
'use strict';

const visible=r=>!r.hideFromPublic&&!['DRAFT','PRIVATE LISTING','HIDDEN'].includes(String(r.status||'').toUpperCase());
const filterRecords=(records,query,genre)=>records.filter(r=>(!genre||r.genre===genre)&&[r.title,r.artist,r.label].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
function filterLibraryRecords(records,query,genre,liked=null){const result=filterRecords(records,query,genre);return liked===null?result:result.filter(r=>liked.has(r.id))}
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
if(typeof module!=='undefined')module.exports={visible,filterRecords,filterLibraryRecords,audioUrl,time};
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

function notice(text){$('playerNotice').textContent=text;const feedback=$('libraryPlaybackStatus');if(feedback)feedback.textContent=/no disponible|no se pudo|sin preview/i.test(text)?text:'';const status=$('iosPlaybackStatus');if(status)status.textContent=text}

function playerControlIcon(kind){
 const paths={play:'<path d="M9 5.5 19 12 9 18.5Z" fill="currentColor" stroke-linejoin="round"/>',pause:'<path d="M9 6v12M15 6v12" stroke-width="3"/>',previous:'<path d="m14.5 6-6 6 6 6M9 12h11"/>',next:'<path d="m9.5 6 6 6-6 6M15 12H4"/>',down:'<path d="m6 9 6 6 6-6"/>'};
 return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[kind]+'</svg>';
}
function paintPlayerButton(button,on,label){
 button.innerHTML=playerControlIcon(on?'pause':'play');button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(on));button.title=label;
}
function playing(on){
 if(on&&iosDiscView&&selected)iosStartedId=selected.id;
 const miniPlay=$('libraryPlayerPlay');if(miniPlay){miniPlay.textContent=miniPlay.disabled?'Sin preview':on?'Pausar':'Reproducir';miniPlay.setAttribute('aria-label',on?'Pausar':'Reproducir');miniPlay.setAttribute('aria-pressed',String(on))}
  if(miniPlay)paintPlayerButton(miniPlay,on,miniPlay.disabled?'Sin preview de audio':on?'Pausar':'Reproducir');
  if(iosDiscView&&iosSheet)syncIosJackets(pendingRecord||selected,on);
  deck.classList.toggle('playing',on);
  miniPlayer?.classList.toggle('is-playing',on);
  syncLibraryCardStates();
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
  const miniTime=$('miniPlayerTime');if(miniTime)miniTime.textContent=time(safeCurrent)+' / '+time(safeDuration);
  $('deckCurrent').textContent=time(safeCurrent);
  $('deckDuration').textContent=time(safeDuration);
  $('seek').value=progress;
  const miniSeek=$('miniPlayerSeek');if(miniSeek){miniSeek.value=progress;miniSeek.style.setProperty('--progress',progress+'%');miniSeek.disabled=!safeDuration;miniSeek.setAttribute('aria-valuetext',time(safeCurrent)+' de '+time(safeDuration))}
  $('seek').style.setProperty('--seek-progress',progress+'%');
  window.drawVinylWaveform?.(progress);
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
  if(!selectionPanel||!collectionPanel||!libraryColumn||document.getElementById('iosPlayerSheet'))return;
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

function storedIds(key){try{const list=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(list)?list:[]}catch{return []}}
function syncRecordActions(r){
 $('recordBag').dataset.recordId=r.id;
 const liked=storedIds('lvl-liked-discs').includes(r.id),bagged=storedIds('lvl-cart-discs').includes(r.id);
 $('recordLike').setAttribute('aria-pressed',String(liked));$('recordLike').setAttribute('aria-label',(liked?'Quitar de favoritos: ':'Guardar favorito: ')+r.title);
 $('recordBag').disabled=Number(r.stock)===0&&!bagged;$('recordBag').classList.toggle('is-added',bagged);$('recordBag').setAttribute('aria-label',bagged?'Ver canasta':'Añadir a la canasta: '+r.title);
}
$('recordLike').onclick=()=>{const r=pendingRecord||selected;if(!r)return;const saved=new Set(storedIds('lvl-liked-discs'));saved.has(r.id)?saved.delete(r.id):saved.add(r.id);localStorage.setItem('lvl-liked-discs',JSON.stringify([...saved]));syncRecordActions(r);renderGallery();notice(saved.has(r.id)?'Disco guardado en favoritos.':'Disco eliminado de favoritos.')};
$('recordBag').onclick=()=>{const r=pendingRecord||selected;if(!r)return;const ids=storedIds('lvl-cart-discs');if(ids.includes(r.id)){location.href='index.html?bag=1';return}if(Number(r.stock)===0)return;ids.push(r.id);localStorage.setItem('lvl-cart-discs',JSON.stringify(ids));syncRecordActions(r);notice('Disco añadido a la canasta.');$('recordBag').animate?.([{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],{duration:260})};
window.addEventListener('storage',()=>{if(pendingRecord||selected)syncRecordActions(pendingRecord||selected)});
document.addEventListener('lvl-bag-change',()=>{if(pendingRecord||selected)syncRecordActions(pendingRecord||selected)});

// Use the same library-first player on all phone-sized screens, not only Apple devices.
const appleTouch=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const iosDiscView=appleTouch||window.matchMedia('(max-width:950px)').matches;
if(iosDiscView)document.documentElement.classList.add('mobile-disc-view');
const viewStorageKey=iosDiscView?'lvl-ios-disc-view':'lvl-disc-view';
const playbackTimeline=document.querySelector('.deck-playback-timeline');
const timelineDeck=document.querySelector('.deck-area');
let discView='player',libraryScope='all';
let libraryPage={type:'home'},libraryTrail=history.state?.lvlLibraryTrail||[];
let libraryShelfObserver=null;
const miniPlayer=document.querySelector('.library-mini-player');
let iosSheet=null,sheetTurntable=false,sheetPosition='compact',iosStartedId=null;
let savedDocumentOverflow=null;
function syncIosPlayerScrollLock(open){
 if(!iosDiscView)return;
 document.body.classList[open?'add':'remove']('ios-player-expanded');
 const rootStyle=document.documentElement?.style;
 if(!rootStyle)return;
 if(open&&savedDocumentOverflow===null){
  savedDocumentOverflow=rootStyle.overflow||'';
  rootStyle.overflow='hidden';
 }else if(!open&&savedDocumentOverflow!==null){
  rootStyle.overflow=savedDocumentOverflow;
  savedDocumentOverflow=null;
 }
}
function setDiscView(view){
 if(iosDiscView){
  discView='library';document.body.classList.add('expanded-library','layered-ios-player');if(miniPlayer)miniPlayer.hidden=false;
  if(iosSheet&&view==='player'){setSheetMode(true);openIosPlayer()}
  return;
 }
 discView=view==='library'?'library':'player';document.body.classList.toggle('expanded-library',discView==='library');
 document.querySelectorAll('[data-disc-view]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.discView===discView));
  if(button.dataset.discView==='player')button.setAttribute('aria-label',discView==='player'?'Ocultar tocadiscos':'Mostrar tocadiscos');
 });
 if(miniPlayer)miniPlayer.hidden=false;
 const rail=document.querySelector('.biblioteca-sidebar');
 if(rail){if(discView==='player')document.querySelector('.room-layout').prepend(rail);else collectionPanel.prepend(rail)}
 document.body.classList.toggle('desktop-turntable',discView==='player');
 try{localStorage.setItem(viewStorageKey,discView)}catch{}
}
function setSheetMode(turntable){
 sheetTurntable=turntable;iosSheet.classList.toggle('show-turntable',turntable);
 iosSheet.querySelector('.ios-sheet-controls').prepend(playbackTimeline);
 requestAnimationFrame(()=>syncDeckTimeline());
 $('iosTurntableToggle').setAttribute('aria-pressed',String(turntable));$('iosTurntableToggle').setAttribute('aria-label',turntable?'Ver portada':'Ver tocadiscos');
}
function sheetHeights(){const height=window.visualViewport?.height||window.innerHeight;const headerHeight=document.querySelector('.editorial-header')?.getBoundingClientRect().height||62;return {compact:0,expanded:Math.max(0,height-headerHeight-8)}}
function sizeIosSheet(height){
 const viewport=window.visualViewport;
 iosSheet.style.height=height+'px';
 iosSheet.style.setProperty('--player-height',sheetHeights().expanded+'px');
 iosSheet.style.top=((viewport?.offsetTop||0)+(viewport?.height||window.innerHeight)-8-height)+'px';
}
function setSheetPosition(position){
 if(!iosSheet)return;
 sheetPosition=position;const height=sheetHeights()[position];
 iosSheet.dataset.position=position;sizeIosSheet(height);iosSheet.classList.remove('is-dragging');
 iosSheet.inert=position==='compact';iosSheet.setAttribute('aria-hidden',String(position==='compact'));
 document.body.dataset.playerPosition=position;
 syncIosPlayerScrollLock(position==='expanded');
 document.body.style.setProperty('--player-space','104px');
 const opener=document.querySelector('.mini-player-open');opener?.setAttribute('aria-expanded',String(position!=='compact'));
 requestAnimationFrame(()=>syncDeckTimeline());
}
function openIosPlayer(){setSheetPosition('expanded');iosSheet.querySelector('.ios-sheet-handle').focus({preventScroll:true})}
function wireSheetDrag(target){
 let drag=null,suppressClick=false;
 target.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={y:e.clientY,height:sheetHeights()[sheetPosition],moved:false};target.setPointerCapture(e.pointerId)});
 target.addEventListener('pointermove',e=>{if(!drag)return;const delta=drag.y-e.clientY;if(Math.abs(delta)>6)drag.moved=true;if(!drag.moved)return;iosSheet.classList.add('is-dragging');iosSheet.inert=false;iosSheet.setAttribute('aria-hidden','false');sizeIosSheet(Math.max(0,Math.min(sheetHeights().expanded,drag.height+delta)))});
 const finish=e=>{if(!drag)return;const moved=drag.moved;const height=drag.height+drag.y-e.clientY;drag=null;if(moved){suppressClick=true;const heights=sheetHeights();const next=Object.keys(heights).reduce((a,b)=>Math.abs(heights[a]-height)<Math.abs(heights[b]-height)?a:b);setSheetPosition(next);setTimeout(()=>{suppressClick=false},0)}};
 target.addEventListener('pointerup',finish);
 target.addEventListener('pointercancel',()=>{drag=null;setSheetPosition(sheetPosition)});target.addEventListener('lostpointercapture',()=>{if(drag){drag=null;setSheetPosition(sheetPosition)}});
 target.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation()}},true);
}
document.querySelectorAll('[data-disc-view]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.discView==='player'&&!iosDiscView)setDiscView(discView==='player'?'library':'player');else if(button.dataset.discView==='player'&&sheetPosition==='expanded'&&sheetTurntable)setSheetPosition('compact');else setDiscView(button.dataset.discView);renderGallery()}));
$('libraryPlayerPlay').onclick=()=>deckPlay?.click();
if(iosDiscView){
 // An expanded sheet blocks background swipes but preserves scrolling inside itself.
 document.addEventListener('touchmove',event=>{
  if(sheetPosition==='expanded'&&iosSheet&&!iosSheet.contains(event.target))event.preventDefault();
 },{passive:false});
 window.closeLVLPlayer=()=>setSheetPosition('compact');
 iosSheet=document.createElement('section');iosSheet.id='iosPlayerSheet';iosSheet.className='ios-player-sheet';iosSheet.setAttribute('aria-label','Reproductor');iosSheet.setAttribute('role','region');
 iosSheet.innerHTML='<div class="ios-sheet-head"><button type="button" class="ios-sheet-handle" aria-label="Cambiar tamaño del reproductor"><span></span></button><button type="button" class="ios-sheet-close" aria-label="Minimizar reproductor">'+playerControlIcon('down')+'</button></div><div class="ios-sheet-content"></div><div class="ios-sheet-controls"><button type="button" id="iosCurrentTrack" class="ios-current-track" aria-label="Ver disco en reproducción"></button><span id="iosPlaybackStatus" role="status"></span><div class="ios-transport"><button type="button" id="iosPrevious" aria-label="Ver disco anterior">'+playerControlIcon('previous')+'</button><button type="button" id="iosSheetPlay" aria-label="Reproducir">'+playerControlIcon('play')+'</button><button type="button" id="iosNext" aria-label="Ver disco siguiente">'+playerControlIcon('next')+'</button></div></div>';
 document.body.append(iosSheet);selectionPanel.querySelector('.now-playing-copy').append(selectionPanel.querySelector('.record-actions'));const head=iosSheet.querySelector('.ios-sheet-head');head.append($('iosTurntableToggle'));const content=iosSheet.querySelector('.ios-sheet-content');content.append(selectionPanel,timelineDeck);
 const close=()=>{setSheetPosition('compact');document.querySelector('.mini-player-open').focus({preventScroll:true})};iosSheet.querySelector('.ios-sheet-close').onclick=close;iosSheet.querySelector('.ios-sheet-handle').onclick=close;iosSheet.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
 $('iosCurrentTrack').onclick=()=>{if(selected)browseIosRecord(selected)};$('iosSheetPlay').onclick=playBrowsedRecord;$('iosPrevious').onclick=()=>stepIosJacket(-1);$('iosNext').onclick=()=>stepIosJacket(1);$('iosTurntableToggle').onclick=()=>setSheetMode(!sheetTurntable);
 const openButton=document.createElement('button');openButton.type='button';openButton.className='mini-player-open';openButton.setAttribute('aria-label','Expandir reproductor');openButton.setAttribute('aria-controls','iosPlayerSheet');const artwork=document.createElement('img');artwork.id='miniPlayerArtwork';artwork.alt='';artwork.hidden=true;openButton.append(artwork,miniPlayer.querySelector('div'));miniPlayer.prepend(openButton);wireSheetDrag(openButton);openButton.onclick=openIosPlayer;
 miniPlayer.querySelector('[data-disc-view]').remove();const miniSeek=document.createElement('input');miniSeek.type='range';miniSeek.id='miniPlayerSeek';miniSeek.min=0;miniSeek.max=100;miniSeek.step=.1;miniSeek.disabled=true;miniSeek.setAttribute('aria-label','Posición del audio');miniSeek.oninput=()=>{$('seek').value=miniSeek.value;$('seek').dispatchEvent(new Event('input',{bubbles:true}))};miniPlayer.append(miniSeek);
 wireSheetDrag(iosSheet.querySelector('.ios-sheet-handle'));window.visualViewport?.addEventListener('resize',()=>setSheetPosition(sheetPosition));
 window.visualViewport?.addEventListener('scroll',()=>setSheetPosition(sheetPosition));
 window.addEventListener('resize',()=>setSheetPosition(sheetPosition));
 const fitDeck=()=>{if(!sheetTurntable||sheetPosition==='compact')return;const stage=$('deckStage'),box=timelineDeck.getBoundingClientRect();const width=Math.max(0,Math.min(box.width-24,(box.height-12)*1.15,480));stage.style.width=width+'px';stage.style.height=(width/1.15)+'px'};
 if(window.ResizeObserver)new ResizeObserver(fitDeck).observe(timelineDeck);
 iosSheet.addEventListener('transitionend',fitDeck);
 setSheetPosition('compact');
 setSheetMode(false);setDiscView('library');buildIosJackets();
}else{
 const openButton=document.createElement('button');openButton.type='button';openButton.className='mini-player-open';openButton.setAttribute('aria-label','Abrir disco en reproducción');
 const artwork=document.createElement('img');artwork.id='miniPlayerArtwork';artwork.alt='';openButton.append(artwork,miniPlayer.querySelector('div'));miniPlayer.prepend(openButton);openButton.onclick=()=>{if(selected)navigateLibrary({type:'disc',record:selected})};
 const transport=document.createElement('div');transport.className='mini-transport';
 [-1,1].forEach(direction=>{const b=document.createElement('button');b.type='button';b.id=direction<0?'miniPrevious':'miniNext';b.setAttribute('aria-label',direction<0?'Reproducir disco anterior':'Reproducir disco siguiente');b.innerHTML=playerControlIcon(direction<0?'previous':'next');b.onclick=()=>{const queue=records.filter(r=>audioUrl(r,document.baseURI)),index=queue.indexOf(selected),r=queue[index+direction];if(r){mountRecord(r);togglePlayback()}};transport.append(b)});
 transport.insertBefore($('libraryPlayerPlay'),transport.lastChild);miniPlayer.append(transport);
 miniPlayer.append(playbackTimeline);
 const opener=miniPlayer.querySelector('[data-disc-view]');opener.innerHTML=$('iosTurntableToggle').innerHTML;opener.classList.add('desktop-deck-toggle');opener.setAttribute('aria-label','Abrir tocadiscos');setDiscView('library')}

const feedback=document.createElement('span');feedback.id='libraryPlaybackStatus';feedback.setAttribute('role','status');miniPlayer.append(feedback);


function buildIosJackets(){
 const rail=document.createElement('div');rail.id='iosJacketRail';rail.className='ios-jacket-rail';rail.setAttribute('aria-label','Explorar portadas');
 rail.innerHTML=records.map((r,i)=>'<button type="button" class="ios-jacket" data-jacket="'+i+'" aria-label="Ver '+escape(r.artist+' — '+r.title)+'" style="--jacket-color:'+recordColor(r)+'"><span class="ios-jacket-disc" aria-hidden="true"><i></i></span><span class="sleeve-art"><span class="fallback-type">'+escape(r.title)+'</span><span class="fallback-code">'+escape(r.id)+'</span>'+(cover(r)?'<img src="'+escape(cover(r))+'" alt="" loading="lazy">':'')+'</span></button>').join('');
 iosSheet.querySelector('.ios-sheet-content').prepend(rail);
 rail.querySelectorAll('img').forEach(img=>img.onerror=()=>img.remove());
 rail.querySelectorAll('[data-jacket]').forEach(button=>button.onclick=()=>browseIosRecord(records[Number(button.dataset.jacket)]));
 let timer;rail.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>{const bounds=rail.getBoundingClientRect(),center=bounds.left+bounds.width/2;let closest=null,distance=Infinity;rail.querySelectorAll('[data-jacket]').forEach(button=>{const b=button.getBoundingClientRect(),d=Math.abs(b.left+b.width/2-center);if(d<distance){distance=d;closest=button}});if(closest){const record=records[Number(closest.dataset.jacket)];if(record!==(pendingRecord||selected))browseIosRecord(record,false)}},130)});
}
function syncIosJackets(r,on=!audio.paused){
 if(!r||!$('iosJacketRail'))return;
 $('iosJacketRail').querySelectorAll('[data-jacket]').forEach(button=>{const item=records[Number(button.dataset.jacket)];button.setAttribute('aria-pressed',String(item===r));button.classList.toggle('is-loaded',item===selected&&iosStartedId===item.id);button.classList.toggle('is-spinning',item===selected&&on)});
 const index=records.indexOf(r);$('iosPrevious').disabled=index<=0;$('iosNext').disabled=index>=records.length-1;
 const button=$('iosSheetPlay'),available=!!audioUrl(r,document.baseURI),active=r===selected&&on;
 button.disabled=!available;paintPlayerButton(button,active,available?(active?'Pausar':'Reproducir '+r.title):'Sin preview de audio');
 iosSheet.classList.toggle('is-browsing',r!==selected);
 iosSheet.classList.toggle('is-playing',!!on);
 const current=$('iosCurrentTrack');
 if(current){current.hidden=!selected;current.textContent=selected?((on?'Reproduciendo · ':'En el plato · ')+selected.artist+' — '+selected.title):'';current.setAttribute('aria-label',selected?'Ver disco en el plato: '+selected.title:'Sin disco');current.classList.toggle('can-return',r!==selected)}
 $('iosPlaybackStatus').textContent=r!==selected?(available?'Pulsa reproducir para escuchar':'Sin preview de audio'):(available?(on?'Escuchando '+r.title:'Listo para escuchar'):'Sin preview de audio');
}
function browseIosRecord(r,center=true){
 if(!r)return;updateSelectedInfo(r,true);
 if(center){const button=$('iosJacketRail').querySelector('[data-jacket="'+records.indexOf(r)+'"]');if(button)$('iosJacketRail').scrollTo({left:button.offsetLeft-($('iosJacketRail').clientWidth-button.offsetWidth)/2,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
}
function stepIosJacket(direction){const index=records.indexOf(pendingRecord||selected);browseIosRecord(records[Math.max(0,Math.min(records.length-1,index+direction))])}
function playBrowsedRecord(){
 const record=pendingRecord||selected;if(!record||!audioUrl(record,document.baseURI))return;
 if(record!==selected)mountRecord(record);
 // Start audio within the Play gesture; the jacket animates when playback succeeds.
 togglePlayback();
}

function updateSelectedInfo(r,browsing=false){
  if(!r)return;
  pendingRecord=r;
  $('recordTitle').textContent=r.title;
  $('recordArtist').textContent=r.artist;
  if(!browsing){
  const queue=records.filter(item=>audioUrl(item,document.baseURI)),queueIndex=queue.indexOf(r);if($('miniPrevious'))$('miniPrevious').disabled=queueIndex<=0;if($('miniNext'))$('miniNext').disabled=queueIndex<0||queueIndex>=queue.length-1;
  $('libraryPlayerTitle').textContent=r.title;
  $('libraryPlayerArtist').textContent=r.artist;
  const miniArt=$('miniPlayerArtwork');if(miniArt){
   const fallback='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="'+recordColor(r)+'"/><circle cx="56" cy="65" r="27" fill="none" stroke="#e6d1a6" stroke-opacity=".2" stroke-width="10"/><text x="8" y="23" fill="#eee3cf" font-size="13" font-family="sans-serif">LVL</text></svg>');
   miniArt.onerror=()=>{miniArt.onerror=null;miniArt.src=fallback};miniArt.src=cover(r)||fallback;miniArt.hidden=false;
  }
  for(const id of ['libraryPlayerPlay','iosSheetPlay']){const control=$(id);if(control){control.disabled=!audioUrl(r,document.baseURI);paintPlayerButton(control,!audio.paused,control.disabled?'Sin preview de audio':(!audio.paused?'Pausar':'Reproducir'))}}
  }
  $('recordInfo').innerHTML=[['Sello',r.label],['Año',r.year],['Género',r.genre],['Estado',r.condition]].filter(([,value])=>value).map(([name,value])=>'<div><dt>'+name+'</dt><dd>'+escape(String(value))+'</dd></div>').join('');
  $('recordDescription').textContent=r.description||'';
  $('recordPrice').textContent=price(r);
  $('recordStock').textContent=String(r.status||((Number(r.stock)||0)>0?'IN STOCK':'SOLD OUT'));

  syncRecordActions(r);
  if(iosDiscView)syncIosJackets(r);
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
  $('artworkOpen').hidden=!src;
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
  link.textContent=Number(r.stock)===0?'Consultar disponibilidad':'Consultar este disco';
  if(phone)link.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Hola! Me interesa '+r.artist+' — '+r.title+' ('+r.id+'). ¿Está disponible?');
}

const artworkDialog=$('artworkDialog');
const artworkStage=$('artworkStage');
function resetArtworkZoom(){artworkStage.classList.remove('is-zoomed');$('artworkZoom').setAttribute('aria-pressed','false');$('artworkZoom').textContent='Ampliar';artworkStage.scrollTop=0;artworkStage.scrollLeft=0}
$('artworkOpen').onclick=()=>{
  const record=pendingRecord||selected,src=record&&cover(record);if(!src)return;
  resetArtworkZoom();$('artworkCaption').textContent=record.artist+' — '+record.title;
  $('artworkFull').src=src;$('artworkFull').alt='Portada de '+record.title+' — '+record.artist;
  artworkDialog.showModal();
};
$('artworkClose').onclick=()=>artworkDialog.close();
$('artworkZoom').onclick=()=>{const zoom=artworkStage.classList.toggle('is-zoomed');$('artworkZoom').setAttribute('aria-pressed',String(zoom));$('artworkZoom').textContent=zoom?'Ajustar':'Ampliar'};
artworkDialog.addEventListener('click',e=>{if(e.target===artworkDialog){const box=artworkDialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)artworkDialog.close()}});
artworkDialog.addEventListener('close',()=>{resetArtworkZoom();$('artworkFull').removeAttribute('src');(libraryPage.type==='disc'?$('libraryArtworkOpen'):$('artworkOpen'))?.focus()});

function libraryRecordCards(items){return items.map((r,i)=>{
    const detail=[r.genre,r.year].filter(Boolean).join(' · ');
    const soldOut=Number(r.stock)===0;
    return '<button class="sleeve" data-index="'+records.indexOf(r)+'" aria-label="Abrir '+escape(r.artist+' — '+r.title)+'"><span class="sleeve-art" style="--sleeve-color:'+recordColor(r)+'"><span class="fallback-type">'+escape(r.title)+'</span><span class="fallback-code">'+escape(r.id)+' / LVL RECORDS</span>'+(cover(r)?'<img src="'+escape(cover(r))+'" alt="" loading="lazy">':'')+'<span class="sleeve-listening" aria-hidden="true"><i></i><i></i><i></i></span><span class="sleeve-saved" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></span></span><span class="sleeve-meta"><strong>'+escape(r.title)+'</strong><small>'+escape(r.artist)+'</small><span class="sleeve-footer"><span class="sleeve-detail">'+escape(soldOut?'Agotado':detail)+'</span><span class="sleeve-price">'+escape(price(r))+'</span></span></span></button>';
  }).join('');
}

function renderGallery(){
  results=filterLibraryRecords(records,$('recordSearch').value,$('genreFilter').value,libraryScope==='liked'?new Set(storedIds('lvl-liked-discs')):null);
  document.querySelectorAll('#libraryGenres button').forEach(button=>button.setAttribute('aria-pressed',String(libraryPage.type==='collection'&&libraryPage.scope==='all'&&button.dataset.genre===$('genreFilter').value)));


  $('resultCount').textContent=results.length+(results.length===1?' disco':' discos');
  syncLibraryPage();
  if(discView==='library'&&libraryPage.type==='home'&&!$('recordSearch').value){
    const shelf=(title,items,genre='')=>'<section class="record-shelf"><div class="record-shelf-heading"><h2>'+escape(title)+'</h2><button type="button" data-open-collection="'+escape(genre)+'">Ver todos <span aria-hidden="true">›</span></button></div><div class="record-shelf-row">'+libraryRecordCards(items)+'</div></section>';
    gallery.innerHTML=shelf('Discos',records);
    gallery.querySelectorAll('[data-open-collection]').forEach(button=>button.onclick=()=>openLibraryCollection('all',button.dataset.openCollection));
  }else{
    const searching=!!$('recordSearch').value.trim();
    const emptyFavorites=libraryScope==='liked'&&!storedIds('lvl-liked-discs').length;
    gallery.innerHTML=libraryRecordCards(results)||'<div class="library-empty"><h2>'+(emptyFavorites?'Guarda tus discos favoritos':'No encontramos discos')+'</h2><p>'+(emptyFavorites?'Usa el corazón en cada disco para reunirlos aquí.':searching?'Prueba otra búsqueda dentro de esta colección.':'No hay discos disponibles en esta selección.')+'</p><button type="button" id="libraryEmptyBrowse">'+(searching&&!emptyFavorites?'Borrar búsqueda':'Explorar discos')+'</button></div>';
    if($('libraryEmptyBrowse'))$('libraryEmptyBrowse').onclick=searching&&!emptyFavorites?clearLibrarySearch:()=>openLibraryCollection('all');
  }
  syncLibraryCardStates();
  wireLibraryShelves();
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
  if(deckPlay)deckPlay.disabled=!sound;
  if(sound){
    audio.preload='auto';
    audio.src=sound;
    audio.load();
    scratchSound?.prepare(false)?.catch(()=>{});
  }
  notice(iosDiscView&&!sound?'Sin preview de audio':'Disco listo en el plato.');

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
  if(discView==='library'){navigateLibrary({type:'disc',record:r});return}
  if(iosDiscView){browseIosRecord(r);openIosPlayer();return}

  updateSelectedInfo(r,true);
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
    playing(false);notice('Sin preview de audio');
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
      playing(false);notice('No se pudo cargar el preview. Intenta de nuevo.');
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

function navigateLibrary(page,push=true){
 if(push){saveLibraryHistory(true);}
 if(push)libraryTrail.push({...libraryPage,query:$('recordSearch').value,scroll:collectionPanel.scrollTop});
 libraryPage=page;libraryScope=page.scope||'all';
 setDiscView('library');
 $('recordSearch').value=page.query||'';$('genreFilter').value=page.genre||'';
 renderGallery();
 collectionPanel.scrollTop=page.scroll||0;
 if(push)saveLibraryHistory(false);
 if(push&&window.innerWidth<=950)collectionPanel.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 $('libraryPageTitle').focus({preventScroll:true});
}
function saveLibraryHistory(replace){
 const page={...libraryPage,query:$('recordSearch').value,scroll:collectionPanel.scrollTop};
 const url=new URL(location.href);['disc','collection','genre','q'].forEach(key=>url.searchParams.delete(key));url.hash='';
 if(page.type==='disc')url.searchParams.set('disc',page.record.id);
 else if(page.type==='collection'){url.searchParams.set('collection',page.scope||'all');if(page.genre)url.searchParams.set('genre',page.genre)}
 if(page.query)url.searchParams.set('q',page.query);
 history[replace?'replaceState':'pushState']({lvlLibrary:page,lvlLibraryTrail:[...libraryTrail]},'',url);
}
function libraryPageFromUrl(){
 const params=new URL(location.href).searchParams;let hash='';try{hash=decodeURIComponent(location.hash.slice(1))}catch{}const record=records.find(r=>r.id===(params.get('disc')||hash));
 if(record)return {type:'disc',record};
 if(params.has('collection')||params.has('q'))return {type:'collection',scope:params.get('collection')==='liked'?'liked':'all',genre:params.get('genre')||'',query:params.get('q')||''};
 return {type:'home'};
}
window.addEventListener('popstate',e=>{
 libraryTrail=e.state?.lvlLibraryTrail||[];
 navigateLibrary(e.state?.lvlLibrary||libraryPageFromUrl(),false);
});
function goBackInLibrary(){
 if(libraryTrail.length)history.back();
 else navigateLibrary({type:'home'});
}
function openLibraryCollection(scope,genre=''){navigateLibrary({type:'collection',scope,genre})}
function syncLibraryPage(){
 const home=libraryPage.type==='home',detail=libraryPage.type==='disc';
 document.body.classList.toggle('library-home',home);document.body.classList.toggle('library-searching',!!$('recordSearch').value);
 document.body.classList.toggle('library-detail-open',detail);
 document.body.classList.toggle('library-collection-open',!home&&!detail);
 $('libraryPageTitle').textContent=detail?'Biblioteca':$('recordSearch').value?'Resultados':home?'Biblioteca':libraryPage.scope==='liked'?'Discos que te gustan':libraryPage.genre||'Todos los discos';
 const searching=!!$('recordSearch').value;
 $('librarySearchClear').hidden=!searching;
 const summary=$('librarySearchSummary');summary.hidden=detail||(!searching&&home);
 summary.textContent=results.length+(results.length===1?' disco':' discos')+(searching?' · '+(libraryPage.scope==='liked'?'Tus favoritos':libraryPage.genre||'Toda la biblioteca'):'');
 $('libraryBack').hidden=home;
 $('libraryNavHome').setAttribute('aria-pressed',String(home&&discView==='library'));
 $('libraryNavAll').setAttribute('aria-pressed',String(!home&&!detail&&libraryPage.scope==='all'&&!libraryPage.genre));
 $('libraryNavLiked').setAttribute('aria-pressed',String(!home&&!detail&&libraryPage.scope==='liked'));
 $('libraryDiscDetail').hidden=!detail;
 libraryToggle.querySelector('.eyebrow').textContent=home?'Explora los discos':'Discos';
 if(detail)renderLibraryDisc(libraryPage.record);
}
function renderLibraryDisc(r){
 const liked=storedIds('lvl-liked-discs').includes(r.id),bagged=storedIds('lvl-cart-discs').includes(r.id);
 const available=!!audioUrl(r,document.baseURI);
 $('libraryDiscDetail').innerHTML='<div class="library-disc-hero"><button type="button" id="libraryArtworkOpen" aria-label="Ampliar portada" '+(!cover(r)?'disabled':'')+' class="sleeve-art" style="--sleeve-color:'+recordColor(r)+'"><span class="fallback-type">'+escape(r.title)+'</span>'+(cover(r)?'<img src="'+escape(cover(r))+'" alt="Portada de '+escape(r.title)+'"><span class="artwork-expand-cue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></span>':'')+'</button><div class="library-disc-copy"><p class="library-disc-kind">'+escape([r.genre,r.year].filter(Boolean).join(' · '))+'</p><h2>'+escape(r.title)+'</h2><p class="library-disc-artist">'+escape(r.artist)+'</p><p class="library-disc-label">'+escape(r.label||'La Vaca Loca Records')+'</p><button type="button" id="libraryListeningContext" class="library-listening-context" hidden></button><div class="library-disc-buttons"><button id="libraryDiscPlay" type="button" '+(!available?'disabled':'')+'>'+playerControlIcon('play')+'<span>'+ (available?'Reproducir preview':'Sin preview')+'</span></button><button id="libraryDiscTurntable" type="button">'+$('iosTurntableToggle').innerHTML+'<span>Tocadiscos</span></button></div><div class="library-disc-purchase"><div class="library-disc-price"><strong>'+escape(price(r))+'</strong><span>'+ (Number(r.stock)>0?'Disponible':'Agotado')+'</span></div><button id="libraryDiscLike" type="button" aria-label="'+(liked?'Quitar de favoritos':'Guardar en favoritos')+'" aria-pressed="'+liked+'">'+'<svg viewBox="0 0 24 24" fill="'+(liked?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>'+(liked?'Guardado':'Guardar')+'</span>'+'</button><button class="library-add-button" type="button" '+(bagged?'id="libraryDiscBag"':'data-add="'+escape(r.id)+'"')+' '+(Number(r.stock)===0&&!bagged?'disabled':'')+'><img src="assets/brand/carrizo-basket.svg" alt=""><span>'+(bagged?'En tu canasta':Number(r.stock)===0?'Agotado':'Añadir a canasta')+'</span></button></div></div></div><div class="library-disc-information"><p>'+escape(r.description||'')+'</p><dl>'+[['Sello',r.label],['Catálogo',r.id],['Condición',r.condition]].filter(([,v])=>v).map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+escape(v)+'</dd></div>').join('')+'</dl></div>';
 $('libraryDiscDetail').querySelectorAll('img').forEach(img=>img.onerror=()=>img.remove());
 $('libraryArtworkOpen').onclick=()=>{resetArtworkZoom();$('artworkCaption').textContent=r.artist+' — '+r.title;$('artworkFull').src=cover(r);$('artworkFull').alt='Portada de '+r.title;artworkDialog.showModal()};
 $('libraryListeningContext').onclick=()=>{if(selected)navigateLibrary({type:'disc',record:selected})};
 $('libraryDiscPlay').onclick=()=>{if(r!==selected)mountRecord(r);togglePlayback()};
 $('libraryDiscTurntable').onclick=()=>{if(iosDiscView){browseIosRecord(r);setDiscView('player')}else{setDiscView('player');stageFromLibrary(r)}};
 $('libraryDiscLike').onclick=()=>{const ids=new Set(storedIds('lvl-liked-discs'));ids.has(r.id)?ids.delete(r.id):ids.add(r.id);localStorage.setItem('lvl-liked-discs',JSON.stringify([...ids]));renderGallery();if(pendingRecord||selected)syncRecordActions(pendingRecord||selected);$('libraryDiscLike').focus()};
 if($('libraryDiscBag'))$('libraryDiscBag').onclick=()=>window.openLVLBag?.();
 syncLibraryDiscPlayback();
}
function syncLibraryDiscPlayback(){
 const button=$('libraryDiscPlay');if(!button||libraryPage.type!=='disc')return;
 const on=libraryPage.record===selected&&!audio.paused;
 const context=$('libraryListeningContext');
 if(context){context.hidden=audio.paused||!selected;context.disabled=on;context.textContent=on?'En reproducción':selected?'Escuchando: '+selected.artist+' — '+selected.title:'';context.classList.toggle('is-current',on);context.setAttribute('aria-label',on?'Este disco está en reproducción':'Volver al disco en reproducción: '+(selected?.title||''))}
 $('libraryDiscDetail').classList.toggle('is-playing',on);
 button.innerHTML=playerControlIcon(on?'pause':'play')+'<span>'+(button.disabled?'Sin preview':on?'Pausar':'Reproducir preview')+'</span>';
}
audio.addEventListener('play',syncLibraryDiscPlayback);audio.addEventListener('pause',syncLibraryDiscPlayback);audio.addEventListener('ended',syncLibraryDiscPlayback);

function syncLibraryCardStates(){
 const saved=new Set(storedIds('lvl-liked-discs'));
 gallery.querySelectorAll('[data-index]').forEach(card=>{
  const r=records[Number(card.dataset.index)];if(!r)return;
  const on=r===selected&&!audio.paused&&!audio.ended,liked=saved.has(r.id);
  card.classList.toggle('is-listening',on);card.classList.toggle('is-saved',liked);
  card.setAttribute('aria-label','Abrir '+r.artist+' — '+r.title+(on?' · En reproducción':'')+(liked?' · Guardado en favoritos':''));
 });
}
function wireLibraryShelves(){
 if(!libraryShelfObserver&&window.ResizeObserver)libraryShelfObserver=new ResizeObserver(entries=>entries.forEach(entry=>entry.target.updateShelfControls?.()));
 libraryShelfObserver?.disconnect();
 document.querySelectorAll('.library-cover-row,.record-shelf-row').forEach(row=>{
  const heading=row.previousElementSibling;if(!heading)return;
  if(!row.updateShelfControls){
   const controls=document.createElement('span');controls.className='shelf-controls';
   [-1,1].forEach(direction=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',direction<0?'Portadas anteriores':'Más portadas');button.innerHTML=playerControlIcon(direction<0?'previous':'next');button.onclick=()=>row.scrollBy({left:direction*row.clientWidth*.8,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});controls.append(button)});
   heading.append(controls);
   row.updateShelfControls=()=>{controls.firstChild.disabled=row.scrollLeft<=1;controls.lastChild.disabled=row.scrollLeft+row.clientWidth>=row.scrollWidth-2;controls.hidden=row.scrollWidth<=row.clientWidth+2};
   row.addEventListener('scroll',row.updateShelfControls,{passive:true});
  }
  libraryShelfObserver?.observe(row);requestAnimationFrame(row.updateShelfControls);
 });
}

function renderLibraryCovers(){
 const genres=[...new Set(records.map(r=>r.genre).filter(Boolean))].sort();
 const heart='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
 const spotify='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M6 9c4-1.5 8-1.2 12 1M7 12.5c3.4-1.2 6.8-.9 10 1M8 16c2.6-.8 5.2-.5 7.8.8"/></svg>';
 const face=(title,type,index,icon='')=>'<span class="library-cover-face cover-'+type+'" style="--cover-index:'+index+'"><span class="cover-edition">LA VACA LOCA / '+String(index+1).padStart(2,'0')+'</span><span class="cover-geometry" aria-hidden="true"></span><img class="cover-cow" src="assets/brand/cow-symbol.svg" alt="">'+(icon?'<span class="cover-symbol">'+icon+'</span>':'')+'<span class="cover-title">'+escape(title)+'</span><span class="cover-imprint">GUALACEO · RECORDS</span></span>';
 $('libraryCoverRow').innerHTML='<a class="library-cover-card" href="https://open.spotify.com/playlist/10DUSYdwJrUocKuKjTqCgN" target="_blank" rel="noopener noreferrer" aria-label="Abrir playlist de La Vaca Loca en Spotify">'+face('La selección','spotify',0,spotify)+'<span class="cover-card-caption">La Vaca Loca en Spotify <span class="lvl-decorative-glyph" aria-hidden="true">↗</span></span></a><button class="library-cover-card" type="button" data-cover-liked aria-label="Ver discos que te gustan">'+face('Tus favoritos','liked',1,heart)+'<span class="cover-card-caption">Discos que te gustan</span></button>'+genres.map((genre,i)=>'<button class="library-cover-card" type="button" data-cover-genre="'+escape(genre)+'" aria-label="Explorar '+escape(genre)+'">'+face(genre,'genre genre-'+(i%4),i+2)+'<span class="cover-card-caption">'+escape(genre)+'</span></button>').join('');
 $('libraryCoverRow').querySelector('[data-cover-liked]').onclick=()=>openLibraryCollection('liked');
 $('libraryCoverRow').querySelectorAll('[data-cover-genre]').forEach(button=>button.onclick=()=>openLibraryCollection('all',button.dataset.coverGenre));
}

function setLibraryScope(scope){
 libraryScope=scope;$('libraryNavAll').setAttribute('aria-pressed',String(scope==='all'));$('libraryNavLiked').setAttribute('aria-pressed',String(scope==='liked'));
 libraryToggle.querySelector('.eyebrow').textContent=scope==='liked'?'DISCOS QUE TE GUSTAN':'BIBLIOTECA';renderGallery();
}
renderLibraryCovers();
$('libraryNavHome').onclick=()=>navigateLibrary({type:'home'});
$('libraryBack').onclick=goBackInLibrary;
let libraryScrollTimer=0;
collectionPanel.addEventListener('scroll',()=>{
 if(discView!=='library')return;
 clearTimeout(libraryScrollTimer);
 libraryScrollTimer=setTimeout(()=>{if(discView==='library')saveLibraryHistory(true)},180);
},{passive:true});
$('libraryNavAll').onclick=()=>openLibraryCollection('all');
$('libraryNavLiked').onclick=()=>openLibraryCollection('liked');
$('libraryNavBag').onclick=()=>window.openLVLBag?.();
['',...[...new Set(records.map(r=>r.genre).filter(Boolean))].sort()].forEach(genre=>{const button=document.createElement('button');button.type='button';button.dataset.genre=genre;button.textContent=genre||'Todos los géneros';button.setAttribute('aria-pressed',String(!genre));button.onclick=()=>openLibraryCollection('all',genre);$('libraryGenres').append(button)});
window.addEventListener('storage',()=>renderGallery());
document.addEventListener('lvl-bag-change',()=>{if(libraryScope==='liked'||libraryPage.type==='disc')renderGallery()});
function clearLibrarySearch(){
 $('recordSearch').value='';renderGallery();saveLibraryHistory(true);$('recordSearch').focus();
}
$('librarySearchClear').onclick=clearLibrarySearch;
$('recordSearch').onkeydown=e=>{if(e.key==='Escape'&&$('recordSearch').value){e.preventDefault();clearLibrarySearch()}};
$('recordSearch').oninput=()=>{renderGallery();saveLibraryHistory(true)};
$('genreFilter').onchange=()=>openLibraryCollection('all',$('genreFilter').value);
if(libraryToggle)libraryToggle.onclick=()=>{if(discView!=='library')focusRecordView(false)};
window.addEventListener('resize',()=>{if(window.innerWidth<=950)focusRecordView(false)});

function angle(){
  deck.style.setProperty('--rx',rx+'deg');
  deck.style.setProperty('--ry',ry+'deg');
}

// Turn the vinyl to scrub; dragging the surrounding deck still tilts it.
const interactiveVinyl=document.querySelector('.vinyl');
let vinylDrag=null;
const scratchSound=window.createVinylScratch?.(audio);
if(deckPlay)deckPlay.addEventListener('pointerdown',()=>scratchSound?.prepare()?.catch(()=>{}));
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
  vinylDrag={id:e.pointerId,angle:pointerAngle(e),rotation,lastMove:performance.now(),resume:!audio.paused,demo:demoPlaying,selection};
  scratchSound?.prepare()?.catch(()=>{});
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
  const movement=delta/(2*Math.PI)*8;
  const now=performance.now(),elapsed=Math.max(.008,(now-vinylDrag.lastMove)/1000);vinylDrag.lastMove=now;
  scrubTo(scrubCurrent()+movement);
  scratchSound?.move(scrubCurrent(),movement/elapsed);
 });
 function finishVinylDrag(e){
  if(!vinylDrag||e.pointerId!==vinylDrag.id)return;const drag=vinylDrag;vinylDrag=null;scratchSound?.stop();
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
  libraryPage=libraryPageFromUrl();
  const restoredPage=history.state?.lvlLibrary;
  if(restoredPage)libraryPage={...libraryPage,scroll:restoredPage.scroll||0};
  navigateLibrary(libraryPage,false);saveLibraryHistory(true);
}else{
  if(deckPlay)deckPlay.disabled=true;
  renderGallery();
  notice('La colección estará disponible próximamente.');
}
})();
