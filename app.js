const ADMIN_DRAFT_KEY='lvl-admin-draft-v1';
const previewMode=new URLSearchParams(window.location.search).get('preview')==='admin-draft';
if(previewMode){
 try{
  const savedDraft=JSON.parse(localStorage.getItem(ADMIN_DRAFT_KEY)||'null');
  if(savedDraft&&typeof savedDraft==='object'){
   window.SITE_CONTENT=savedDraft;
   document.documentElement.classList.add('draft-preview');
  }
 }catch(error){console.warn('Admin draft preview could not load',error)}
}
async function setupHomepageIntro(){
 const loader=document.getElementById('lvlIntroLoader');
 if(!loader)return;

 const SESSION_KEY='lvl-home-intro-laser-v11';
 let seen=false;
 try{seen=sessionStorage.getItem(SESSION_KEY)==='1'}catch(error){}
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const skip=seen||reduceMotion||previewMode||document.documentElement.classList.contains('lvl-intro-skip');

 if(skip){
  document.documentElement.classList.add('lvl-intro-skip');
  document.body.classList.remove('intro-active');
  loader.remove();
  return;
 }

 const wrap=document.getElementById('lvlIntroSvgWrap');
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

 function finishIntro(markSeen=true){
  loader.classList.add('is-exiting');
  document.body.classList.remove('intro-active');
  if(markSeen)try{sessionStorage.setItem(SESSION_KEY,'1')}catch(error){}
  setTimeout(()=>loader.remove(),920);
 }

 try{
  const response=await fetch('assets/brand/lvl-laser-logo.svg?v=full-art-20260927',{cache:'force-cache'});
  if(!response.ok)throw new Error('Intro SVG could not load');
  const svgText=await response.text();
  wrap.innerHTML=svgText;

  const svg=wrap.querySelector('svg');
  if(!svg)throw new Error('Intro SVG markup missing');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.removeAttribute('width');
  svg.removeAttribute('height');

  // The original SVG layers raster shading and the heart tail over its vector
  // shapes. Keep each detail hidden until the laser completes its base shape.
  const details=[...svg.querySelectorAll('use')];
  details.forEach(el=>{
   el.classList.add('lvl-logo-detail');
   el.style.opacity='0';
  });

  // Keep the laser in the artwork's coordinate space. Mobile Safari can report
  // screen coordinates differently while the outer artwork is transforming.
  const svgNS='http://www.w3.org/2000/svg';
  const defs=svg.querySelector('defs')||svg.insertBefore(document.createElementNS(svgNS,'defs'),svg.firstChild);
  const glow=document.createElementNS(svgNS,'radialGradient');
  glow.id='lvlIntroBeamGlow';
  for(const [offset,color,opacity] of [['0','#fff','.95'],['.24','#ffe3bc','.82'],['.53','#ff966b','.48'],['1','#e5532e','0']]){
   const stop=document.createElementNS(svgNS,'stop');
   stop.setAttribute('offset',offset);
   stop.setAttribute('stop-color',color);
   stop.setAttribute('stop-opacity',opacity);
   glow.appendChild(stop);
  }
  defs.appendChild(glow);
  // A few fading motes follow the tracing tip, in the same SVG coordinates as
  // the beam. Reuse the circles instead of adding nodes on every frame.
  const smokeGradient=document.createElementNS(svgNS,'radialGradient');
  smokeGradient.id='lvlIntroLaserSmoke';
  for(const [offset,color,opacity] of [['0','#f7e8dd','.65'],['.48','#d5aa9a','.28'],['1','#d5aa9a','0']]){
   const stop=document.createElementNS(svgNS,'stop');
   stop.setAttribute('offset',offset);
   stop.setAttribute('stop-color',color);
   stop.setAttribute('stop-opacity',opacity);
   smokeGradient.appendChild(stop);
  }
  defs.appendChild(smokeGradient);
  const smoke=document.createElementNS(svgNS,'g');
  smoke.setAttribute('class','lvl-laser-smoke');
  const smokeMotes=Array.from({length:8},(_,index)=>{
   const circle=document.createElementNS(svgNS,'circle');
   circle.setAttribute('fill','url(#lvlIntroLaserSmoke)');
   smoke.appendChild(circle);
   return {circle,index,birth:-Infinity,x:0,y:0};
  });
  svg.appendChild(smoke);

  const beam=document.createElementNS(svgNS,'g');
  beam.setAttribute('class','lvl-intro-beam');
  const tail=document.createElementNS(svgNS,'line');
  tail.setAttribute('class','lvl-intro-beam-tail');
  const halo=document.createElementNS(svgNS,'circle');
  halo.setAttribute('class','lvl-intro-beam-halo');
  halo.setAttribute('fill','url(#lvlIntroBeamGlow)');
  halo.setAttribute('r','9');
  const core=document.createElementNS(svgNS,'circle');
  core.setAttribute('class','lvl-intro-beam-core');
  core.setAttribute('r','2.25');
  beam.append(tail,halo,core);
  svg.appendChild(beam);

  const nearEye=[svg.querySelector('#lvl-cow-eye-near'),svg.querySelector('#lvl-cow-eye-near-outline')];
  const farEye=svg.querySelector('#lvl-cow-eye-far');
  if(nearEye.some(el=>!el)||!farEye)throw new Error('Intro SVG eye shapes missing');
  const eyeShapes=new Set([...nearEye,farEye]);
  eyeShapes.forEach(el=>el.classList.add('lvl-cow-eye'));

  const drawableSelector='path,circle,ellipse,rect,line,polyline,polygon';
  const shapes=[...svg.querySelectorAll(drawableSelector)].filter(el=>{
   if(el.closest('defs,clipPath,mask,pattern,.lvl-intro-beam,.lvl-laser-smoke')||eyeShapes.has(el))return false;
   if(typeof el.getTotalLength!=='function')return false;
   try{return el.getTotalLength()>.35}catch(error){return false}
  });

  if(!shapes.length)throw new Error('Intro SVG has no drawable paths');

  // Both horns sit last in the source SVG. Trace them with the cow's head so
  // their silhouettes are present while the character comes into view.
  const horns=svg.querySelectorAll('#lvl-cow-horn,#lvl-cow-horn-far');
  const head=svg.querySelector('#lvl-cow-head');
  for(const horn of horns){
   const hornIndex=shapes.indexOf(horn);
   if(hornIndex>=0&&shapes.includes(head)){
    shapes.splice(hornIndex,1);
    shapes.splice(shapes.indexOf(head),0,horn);
   }
  }

  const segments=[];
  let totalWeight=0;

  for(const el of shapes){
   let len=0;
   try{len=Math.max(.5,el.getTotalLength())}catch(error){continue}
   const weight=Math.max(16,Math.min(260,Math.sqrt(len)*12));
   totalWeight+=weight;

   el.classList.add('lvl-laser-draw');
   el.style.strokeDasharray=String(len);
   el.style.strokeDashoffset=String(len);
   el.style.fillOpacity='0';
   el.style.strokeOpacity='1';

   segments.push({el,len,weight,start:totalWeight-weight,end:totalWeight,done:false});
  }

  if(!segments.length)throw new Error('Intro SVG paths could not be measured');

  // The source places each image detail after the vector artwork it shades.
  // Pair by paint order, so the heart, body shading and face texture develop
  // with their respective laser strokes instead of popping in at the end.
  const segmentByElement=new Map(segments.map(seg=>[seg.el,seg]));
  const detailsBySegment=new Map();
  let detailAnchor=segments[0];
  for(const el of svg.querySelectorAll(`${drawableSelector},use`)){
   if(el.closest('defs,clipPath,mask,pattern,.lvl-intro-beam,.lvl-laser-smoke'))continue;
   const seg=segmentByElement.get(el);
   if(seg){detailAnchor=seg;continue}
   if(el.localName==='use'){
    if(!detailsBySegment.has(detailAnchor))detailsBySegment.set(detailAnchor,[]);
    detailsBySegment.get(detailAnchor).push(el);
   }
  }

  // Geometry within the SVG is fixed; measure once rather than forcing layout
  // for every path on every animation frame.
  const rootMatrix=svg.getCTM();
  if(!rootMatrix)throw new Error('Intro SVG is not laid out');
  const rootInverse=rootMatrix.inverse();
  for(const seg of segments){
   const matrix=seg.el.getCTM();
   seg.matrix=matrix ? rootInverse.multiply(matrix) : null;
  }

  // Give the eyes their own timing envelope, independent of the SVG source
  // order. The second opens after the first has settled.
  let eyeSequence=null;
  async function revealEyes(){
   await delay(90);
   nearEye.forEach(el=>el.classList.add('is-visible'));
   await delay(440);
   farEye.classList.add('is-visible');
   await delay(380);
  }

  function completeSegment(seg){
   if(seg.done)return;
   seg.done=true;
   seg.el.style.strokeDashoffset='0';
   seg.el.classList.add('lvl-laser-done');
   requestAnimationFrame(()=>{
    seg.el.style.fillOpacity='1';
    detailsBySegment.get(seg)?.forEach(el=>el.style.removeProperty('opacity'));
   });
   if(seg.el===head&&!eyeSequence)eyeSequence=revealEyes();
  }

  function pointOn(seg,fraction){
   if(!seg.matrix)return null;
   try{
    const p=seg.el.getPointAtLength(seg.len*Math.max(0,Math.min(1,fraction)));
    const pt=svg.createSVGPoint();
    pt.x=p.x;pt.y=p.y;
    const local=pt.matrixTransform(seg.matrix);
    return Number.isFinite(local.x)&&Number.isFinite(local.y) ? local : null;
   }catch(error){return null}
  }

  loader.classList.add('is-running');
  await delay(180);

  const TRACE_DURATION=3800;
  // The larger artwork can take longer to paint on tablets and desktops.
  // Limit catch-up after a late frame so the laser does not jump across large
  // areas, while allowing slow devices to finish the intro promptly.
  let traceTime=0;
  let previousFrameTime=null;
  let previousPoint=null;
  let previousSegment=null;
  let lastSmokeAt=-Infinity;
  let smokeIndex=0;

  function updateLaserSmoke(now,point){
   if(point&&now-lastSmokeAt>=82){
    const mote=smokeMotes[smokeIndex++%smokeMotes.length];
    mote.birth=now;
    mote.x=point.x;
    mote.y=point.y;
    lastSmokeAt=now;
   }
   for(const mote of smokeMotes){
    const age=(now-mote.birth)/640;
    if(age<0||age>=1){mote.circle.style.opacity='0';continue}
    mote.circle.setAttribute('cx',mote.x+(mote.index%2 ? 1 : -1)*age*3);
    mote.circle.setAttribute('cy',mote.y-age*7);
    mote.circle.setAttribute('r',2.8+age*3.4);
    mote.circle.style.opacity=String(.68*Math.pow(1-age,1.4));
   }
  }

  await new Promise(resolve=>{
   function frame(now){
    if(previousFrameTime!==null){
     traceTime=Math.min(TRACE_DURATION,traceTime+Math.min(80,Math.max(0,now-previousFrameTime)));
    }
    previousFrameTime=now;
    const progress=traceTime/TRACE_DURATION;
    const eased=progress-.16*Math.sin(2*Math.PI*progress)/(2*Math.PI);
    const global=eased*totalWeight;

    let active=segments[segments.length-1];
    for(const seg of segments){
     if(global>=seg.end){
      completeSegment(seg);
      continue;
     }
     if(global>=seg.start){
      active=seg;
      break;
     }
     active=seg;
     break;
    }

    const local=Math.max(0,Math.min(1,(global-active.start)/active.weight));
    active.el.style.strokeDashoffset=String(active.len*(1-local));

    const point=pointOn(active,local);
    if(point){
     halo.setAttribute('cx',point.x);
     halo.setAttribute('cy',point.y);
     core.setAttribute('cx',point.x);
     core.setAttribute('cy',point.y);
     const dx=previousPoint&&previousSegment===active ? point.x-previousPoint.x : 0;
     const dy=previousPoint&&previousSegment===active ? point.y-previousPoint.y : 0;
     const distance=Math.hypot(dx,dy);
     const trail=distance>0 ? Math.min(18,distance)/distance : 0;
     tail.setAttribute('x1',point.x-dx*trail);
     tail.setAttribute('y1',point.y-dy*trail);
     tail.setAttribute('x2',point.x);
     tail.setAttribute('y2',point.y);
     beam.style.opacity='1';
     previousPoint=point;
     previousSegment=active;
    }else{
     beam.style.opacity='0';
     previousPoint=null;
    }
    updateLaserSmoke(now,point);

    if(traceTime<TRACE_DURATION){
     requestAnimationFrame(frame);
    }else{
     segments.forEach(completeSegment);
     beam.style.opacity='0';
     smoke.style.opacity='0';
     resolve();
    }
   }
   requestAnimationFrame(frame);
  });

  if(!eyeSequence)eyeSequence=revealEyes();
  await eyeSequence;

  // Restore the artwork's original vector strokes once the laser has completed them.
  await delay(260);
  segments.forEach(({el})=>{
   el.style.removeProperty('stroke-dasharray');
   el.style.removeProperty('stroke-dashoffset');
   el.style.removeProperty('stroke-opacity');
  });

  loader.classList.add('is-complete');
  await delay(2200);
  finishIntro();
 }catch(error){
  console.warn('LVL laser intro could not run',error);
  // Keep a visible mark if an older Safari build cannot trace SVG geometry.
  wrap.querySelectorAll('.lvl-laser-draw').forEach(el=>{
   el.classList.remove('lvl-laser-draw');
   el.style.removeProperty('stroke-dasharray');
   el.style.removeProperty('stroke-dashoffset');
   el.style.removeProperty('fill-opacity');
   el.style.removeProperty('stroke-opacity');
  });
  wrap.querySelectorAll('.lvl-cow-eye').forEach(el=>el.classList.remove('lvl-cow-eye'));
  wrap.querySelectorAll('.lvl-logo-detail').forEach(el=>el.style.removeProperty('opacity'));
  wrap.style.opacity='1';
  await delay(500);
  finishIntro(false);
 }
}

setupHomepageIntro();

const content=window.SITE_CONTENT||{};
const visibleItems=list=>(list||[]).filter(item=>!item.hideFromPublic);
const recordsSource=visibleItems(content.records||window.RECORDS||[]);
let savedCart=[];try{const ids=JSON.parse(localStorage.getItem('lvl-cart-discs')||'[]');if(Array.isArray(ids))savedCart=ids.map(id=>recordsSource.find(r=>r.id===id)).filter(r=>r&&!r.hideFromPublic&&Number(r.stock)!==0)}catch{}
const state={cart:savedCart,current:null,playing:false};
const settings=content.settings||{};
const SESSIONS=visibleItems(content.sessions||window.SESSIONS||[]);
const EVENTS=visibleItems(content.events||window.EVENTS||[]);
const ARCHIVE_ITEMS=visibleItems(content.archiveItems||window.ARCHIVE_ITEMS||[]);
window.RECORDS=recordsSource;

const grid=document.getElementById('recordGrid');
const cartPanel=document.getElementById('cartPanel');
const scrim=document.getElementById('scrim');
const cartCount=document.getElementById('cartCount');
const cartItems=document.getElementById('cartItems');
const cartTotal=document.getElementById('cartTotal');
const player=document.getElementById('player');
const playerTitle=document.getElementById('playerTitle');
const playerSub=document.getElementById('playerSub');
const playerToggle=document.getElementById('playerToggle');
const whatsapp=document.getElementById('whatsappCheckout');

function money(value){return `${settings.currency||'$'}${value}`}
function getRecord(id){return window.RECORDS.find(x=>x.id===id)}
function escapeText(value=''){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]))}

const HERO_MEDIA_DB='lvl-admin-media-v1';
const HERO_MEDIA_STORE='files';
const heroObjectUrls=[];
function openHeroMediaDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(HERO_MEDIA_DB,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(HERO_MEDIA_STORE))db.createObjectStore(HERO_MEDIA_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Could not open draft media'))})}
async function getHeroDraftBlob(key){if(!key)return null;const db=await openHeroMediaDb();return new Promise((resolve,reject)=>{const tx=db.transaction(HERO_MEDIA_STORE,'readonly');const request=tx.objectStore(HERO_MEDIA_STORE).get(key);request.onsuccess=()=>{db.close();resolve(request.result||null)};request.onerror=()=>{db.close();reject(request.error||new Error('Could not load draft media'))}})}
function setHeroText(id,value){const el=document.getElementById(id);if(el&&value!==undefined&&value!==null)el.textContent=String(value)}
async function setupHomepageHero(){
 const gallery=document.getElementById('lvlHeroGallery');if(!gallery)return;
 const hero=content.homepage?.hero||{};
 setHeroText('lvlHeroKicker',hero.kicker);
 setHeroText('lvlHeroTitle',hero.title||'LVL');
 setHeroText('lvlHeroTagline',hero.tagline);
 const primary=document.getElementById('lvlHeroPrimary');if(primary){if(hero.primaryLabel)primary.textContent=hero.primaryLabel;if(hero.primaryHref)primary.href=hero.primaryHref}
 const secondary=document.getElementById('lvlHeroSecondary');if(secondary){if(hero.secondaryLabel)secondary.textContent=hero.secondaryLabel;if(hero.secondaryHref)secondary.href=hero.secondaryHref}
 const slides=(Array.isArray(hero.slides)?hero.slides:[]).filter(slide=>slide&&(slide.src||slide.draftBlobKey));
 if(!slides.length)return;
 gallery.innerHTML='';
 const slideEls=slides.map((slide,index)=>{
  const el=document.createElement('div');el.className='lvl-slide'+(index===0?' is-active':'');el.style.backgroundPosition=slide.position||'center center';
  if(slide.src)el.style.backgroundImage=`url("${String(slide.src).replace(/"/g,'\\\"')}")`;
  gallery.appendChild(el);return el;
 });
 const current=document.getElementById('lvlHeroCurrent');const total=document.getElementById('lvlHeroTotal');
 if(total)total.textContent=String(slides.length).padStart(2,'0');
 let active=0;
 const show=index=>{active=index;slideEls.forEach((el,i)=>el.classList.toggle('is-active',i===active));if(current)current.textContent=String(active+1).padStart(2,'0')};
 show(0);
 if(previewMode){
  slides.forEach(async(slide,index)=>{
   if(!slide.draftBlobKey)return;
   try{const blob=await getHeroDraftBlob(slide.draftBlobKey);if(!blob)return;const url=URL.createObjectURL(blob);heroObjectUrls.push(url);slideEls[index].style.backgroundImage=`url("${url}")`}catch(error){console.warn('Hero draft image could not load',error)}
  });
 }
 const reduceHeroMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const interval=Math.max(2,Number(hero.intervalSeconds)||6)*1000;
 if(!reduceHeroMotion&&slideEls.length>1)setInterval(()=>show((active+1)%slideEls.length),interval);
}
window.addEventListener('beforeunload',()=>heroObjectUrls.forEach(url=>URL.revokeObjectURL(url)));

function renderRecordPreview(){
 if(!grid)return;
 const publicRecords=window.RECORDS.filter(r=>!['DRAFT','PRIVATE LISTING','HIDDEN'].includes(String(r.status||'').toUpperCase()));
 const records=publicRecords.sort((a,b)=>Number(b.year||0)-Number(a.year||0)||Number(!!b.featured)-Number(!!a.featured)).slice(0,5);
 const colors=['#864833','#35493f','#827451','#493d57','#a25439'];
 const section=document.getElementById('shop');
 const feature=section.querySelector('.showcase-feature');
 const dialog=document.getElementById('showcaseDialog');
 if(!records.length){feature.hidden=true;grid.innerHTML='<p class="showcase-empty">Próximamente.</p>';return}

 const artMarkup='<span class="showcase-art-title"></span><span class="showcase-art-code"></span><img alt="" hidden>';
 grid.innerHTML=records.map((r,index)=>`<button class="showcase-thumb" type="button" data-showcase-index="${index}" aria-label="Ver portada de ${escapeText(r.artist)} — ${escapeText(r.title)}" aria-pressed="false"><span class="showcase-art showcase-thumb-art">${artMarkup}</span><span class="showcase-thumb-caption"><strong>${escapeText(r.title)}</strong><small>${escapeText(r.artist)}</small></span></button>`).join('');

 function setArtwork(container,record,index){
  container.style.setProperty('--sleeve-color',colors[index%colors.length]);
  container.querySelector('.showcase-art-title').textContent=record.title||'';
  container.querySelector('.showcase-art-code').textContent=`${record.id||'LVL'} / LVL RECORDS`;
  const img=container.querySelector('img');
  const source=record.coverImage||record.media?.artwork?.url||record.media?.artwork?.path||'';
  const url=source&&window.CalendarContent?.imageUrl(source,document.baseURI);
  img.hidden=true;
  img.onload=()=>{if(img.dataset.requested===url)img.hidden=false};
  img.onerror=()=>{img.hidden=true};
  img.dataset.requested=url||'';
  if(url){img.src=url;if(img.complete&&img.naturalWidth)img.hidden=false}
  else img.removeAttribute('src');
 }

 grid.querySelectorAll('.showcase-thumb').forEach((button,index)=>{
  setArtwork(button.querySelector('.showcase-art'),records[index],index);
  button.addEventListener('click',()=>show(index));
 });

 let selected=0;
 function show(index){
  selected=(index+records.length)%records.length;
  const record=records[selected];
  const position=`${String(selected+1).padStart(2,'0')} / ${String(records.length).padStart(2,'0')}`;
  setArtwork(document.getElementById('showcaseArt'),record,selected);
  setArtwork(document.getElementById('showcaseDialogArt'),record,selected);
  document.getElementById('showcaseTitle').textContent=record.title||'';
  document.getElementById('showcaseArtist').textContent=record.artist||'';
  document.getElementById('showcaseGenre').textContent=record.genre||'';
  document.getElementById('showcaseYear').textContent=record.year||'';
  document.getElementById('showcasePrice').textContent=money(Number(record.price||0).toFixed(2));
  document.getElementById('showcaseNumber').textContent=position;
  document.getElementById('showcasePosition').textContent=position.replace(' / ',' — ');
  document.getElementById('showcaseDialogCaption').textContent=`${record.artist||''} — ${record.title||''}`;
  document.getElementById('showcaseRecordLink').href=`discos.html#${encodeURIComponent(String(record.id))}`;
  document.getElementById('showcaseOpenArt').setAttribute('aria-label',`Ampliar portada de ${record.artist} — ${record.title}`);
  grid.querySelectorAll('.showcase-thumb').forEach((button,i)=>{
   button.classList.toggle('is-active',i===selected);
   button.setAttribute('aria-pressed',String(i===selected));
  });
 }
 document.querySelectorAll('[data-showcase-prev]').forEach(button=>button.addEventListener('click',()=>show(selected-1)));
 document.querySelectorAll('[data-showcase-next]').forEach(button=>button.addEventListener('click',()=>show(selected+1)));
 document.getElementById('showcaseOpenArt').addEventListener('click',()=>dialog.showModal());
 document.getElementById('showcaseDialogClose').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'){event.preventDefault();show(selected-1)}
  if(event.key==='ArrowRight'){event.preventDefault();show(selected+1)}
 });
 show(0);
}
function addToCart(id){const r=getRecord(id);if(!r||r.stock===0)return;state.cart.push(r);renderCart();openCart()}
function renderCart(){localStorage.setItem('lvl-cart-discs',JSON.stringify(state.cart.map(r=>r.id)));cartCount.textContent=state.cart.length;cartItems.innerHTML=state.cart.length?state.cart.map((r,i)=>`<div class="cart-item"><div><strong>${r.artist}</strong><br><small>${r.title}</small></div><div><strong>${money(r.price)}</strong><br><button data-remove="${i}" style="background:none;border:0;color:#777;cursor:pointer">remove</button></div></div>`).join(''):'<p style="color:#777">Tu bag está vacío.</p>';const total=state.cart.reduce((s,r)=>s+r.price,0);cartTotal.textContent=money(total);const lines=state.cart.map(r=>`1x ${r.artist} — ${r.title} — ${money(r.price)}`);whatsapp.href=`https://wa.me/?text=${encodeURIComponent(`${settings.whatsappText||'Hola! Quiero hacer este pedido de La Vaca Loca Records:'}\n\n${lines.join('\n')}\n\nTotal: ${money(total)}`)}`}
function openCart(){cartPanel.classList.add('open');scrim.classList.add('show');cartPanel.setAttribute('aria-hidden','false')}
function closeCart(){cartPanel.classList.remove('open');if(!recordModal.classList.contains('open'))scrim.classList.remove('show');cartPanel.setAttribute('aria-hidden','true')}
function updatePlayerControl(){playerToggle.classList.toggle('is-playing',state.playing);playerToggle.setAttribute('aria-label',state.playing?'Pausar':'Reproducir');player.classList.toggle('playing',state.playing);player.classList.toggle('has-current',!!state.current)}
function selectRecord(r,autoplay=true){if(!r)return;state.current=r;state.playing=autoplay;playerTitle.textContent=`${r.artist} — ${r.title}`;playerSub.textContent=`${r.genre.toUpperCase()} · ${r.id} · ${settings.location||'GUALACEO'}`;updatePlayerControl();player.animate([{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});document.querySelectorAll('[data-listen]').forEach(btn=>{btn.classList.toggle('is-active',btn.dataset.listen===r.id)})}
function randomRecord(){return window.RECORDS[Math.floor(Math.random()*window.RECORDS.length)]}

function createRecordModal(){
 const modal=document.createElement('div');
 modal.className='record-modal';
 modal.setAttribute('aria-hidden','true');
 modal.innerHTML='<div class="record-modal-card" role="dialog" aria-modal="true" aria-label="Detalle del disco"><button class="modal-close" data-close-modal>CERRAR</button><div class="modal-cover"><span></span></div><div class="modal-copy" id="modalCopy"></div></div>';
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close-modal]'))closeRecordModal()});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeRecordModal();closeMobileNav()}});
 return modal;
}
const recordModal=createRecordModal();
const modalCopy=document.getElementById('modalCopy');
function openRecordModal(record){
 const r=typeof record==='string'?getRecord(record):record;
 if(!r)return;
 const description=r.description||'Una ficha rápida para explorar el disco antes de pedirlo. Más adelante esta pantalla podrá incluir fotos reales, audio, notas del selector, sello, año y condición.';
 const facts=[r.status,r.stock>0?`${r.stock} disponible(s)`:'Agotado',money(r.price),r.condition,r.label,r.year].filter(Boolean);
 modalCopy.innerHTML=`<p class="eyebrow">${r.id} / ${r.genre}</p><h3>${r.artist}</h3><h4>${r.title}</h4><p>${description}</p><div class="modal-facts">${facts.map(f=>`<span>${escapeText(f)}</span>`).join('')}</div><div class="modal-actions"><button data-listen="${r.id}">${state.current&&state.current.id===r.id&&state.playing?'REPRODUCIENDO':'ESCUCHAR'}</button><button data-add="${r.id}" ${r.stock===0?'disabled':''}>${r.stock===0?'LO QUIERO':'AGREGAR AL BAG'}</button></div>`;
 recordModal.classList.add('open');
 recordModal.setAttribute('aria-hidden','false');
 scrim.classList.remove('show');
 document.body.classList.add('modal-open');
 document.querySelectorAll('[data-listen]').forEach(btn=>btn.classList.toggle('is-active',state.current&&btn.dataset.listen===state.current.id));
}
function closeRecordModal(){recordModal.classList.remove('open');recordModal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}

function enhancePublicSite(){
 document.querySelectorAll('#how,.how-section,.buying-section').forEach(section=>section.remove());
 document.querySelectorAll('.main-nav a,.site-footer a').forEach(link=>{
  const href=link.getAttribute('href')||'';
  const label=(link.textContent||'').trim().toUpperCase();
  if(href==='#how'||href==='#buying'||label==='COMPRAR'||label==='CÓMO COMPRAR'||label==='COMO COMPRAR')link.remove();
 });
 const sessionsCopy=document.querySelector('.sessions-copy');
 if(sessionsCopy&&!document.querySelector('.session-cards')){
  sessionsCopy.insertAdjacentHTML('beforeend',`<div class="session-cards">${SESSIONS.map(item=>`<a class="session-card" href="sessions.html#${encodeURIComponent(item.id)}"><small>${item.type}</small><strong>${item.title}</strong><span>${item.status}</span></a>`).join('')}</div>`);
 }
 const archiveSection=document.querySelector('.archive-section');
 if(archiveSection&&!document.querySelector('.events-section')){
  archiveSection.insertAdjacentHTML('beforebegin',`<section class="events-section motion-section" id="events"><div class="events-copy motion-copy"><p class="eyebrow">03 / PRÓXIMOS ENCUENTROS</p><h2>Buenas <em>noches.</em></h2><a href="eventos.html" style="display:inline-block;margin-top:24px;font-weight:900;text-underline-offset:6px">ABRIR EL CALENDARIO ↗</a></div><a href="eventos.html" aria-label="Explorar el calendario de eventos" class="home-calendar-art" style="display:block;overflow:hidden"><img data-calendar-image src="assets/images/events/calendar-pinup.jpg" alt="Pin-up vintage en una tienda de discos" loading="lazy" width="1536" height="1024" style="display:block;width:100%;height:100%;object-fit:cover"></a></section>`);
 }
 const panel=document.getElementById('cartPanel');
 if(panel&&!panel.classList.contains('bag-experience')){
  panel.classList.add('bag-experience');
  const head=panel.querySelector('.cart-head');
  if(head&&!head.querySelector('.bag-subtitle'))head.insertAdjacentHTML('beforeend','<p class="bag-subtitle">Revisa tu selección y envía el pedido directo por WhatsApp.</p>');
  const footer=panel.querySelector('.cart-footer');
  if(footer&&!footer.querySelector('.bag-checklist'))footer.insertAdjacentHTML('afterbegin','<div class="bag-checklist"><span>Stock se confirma por mensaje</span><span>Retiro / entrega se coordina después</span><span>Pago no automático todavía</span></div>');
  const checkout=document.getElementById('whatsappCheckout');
  if(checkout)checkout.textContent='ENVIAR BAG POR WHATSAPP';
 }
 if(!document.querySelector('.site-footer')){
  document.querySelector('main').insertAdjacentHTML('afterend',`<footer class="site-footer"><div><a class="store-signature" href="index.html" aria-label="La Vaca Loca Records — inicio"><img src="assets/brand/footer-signature.svg?v=white-type-20260929" alt="La Vaca Loca Record Store" width="274" height="312" loading="lazy"></a><span>${settings.location||'Gualaceo, Ecuador'} · discos · sessions · cultura</span></div><nav><a href="discos.html">Discos</a><a href="sessions.html">Sessions</a><a href="eventos.html">Eventos</a><a href="archivo.html">Archivo</a></nav></footer>`);
 }
 const nav=document.querySelector('.main-nav');
 if(nav&&!nav.querySelector('[href="eventos.html"]'))nav.insertAdjacentHTML('beforeend','<a href="eventos.html">EVENTOS</a>');
}
function showSessionDetail(id){
 const item=SESSIONS.find(x=>x.id===id);
 const card=document.querySelector('.sessions-photo-card');
 if(!item||!card)return;
 card.innerHTML=`<span>${item.type.toUpperCase()} / ${item.status.toUpperCase()}</span><strong>${item.title.toUpperCase()}</strong><span>${item.detail}</span><br><a class="sessions-button" href="archivo.html">VER ARCHIVO →</a>`;
 card.animate([{transform:'translateY(10px)',opacity:.7},{transform:'translateY(0)',opacity:1}],{duration:240,easing:'ease-out'});
}
function setupMobileNavigation(){
 const header=document.querySelector('.site-header');
 const nav=document.querySelector('.main-nav');
 if(!header||!nav)return;
 if(!document.querySelector('.mobile-menu-toggle')){
  const button=document.createElement('button');
  button.className='mobile-menu-toggle';
  button.type='button';
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-label','Abrir menú');
  button.innerHTML='<span></span><span></span><span></span>';
  header.insertBefore(button,nav);
 }
 const button=document.querySelector('.mobile-menu-toggle');
 button.addEventListener('click',()=>{
  const open=!document.body.classList.contains('nav-open');
  document.body.classList.toggle('nav-open',open);
  button.setAttribute('aria-expanded',open?'true':'false');
  button.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
 });
 nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMobileNav));
}
function closeMobileNav(){
 const button=document.querySelector('.mobile-menu-toggle');
 document.body.classList.remove('nav-open');
 if(button){button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Abrir menú')}
}
function setupDraftPreviewBanner(){
 if(!previewMode)return;
 const banner=document.createElement('div');
 banner.className='draft-preview-banner';
 banner.innerHTML='<strong>ADMIN DRAFT PREVIEW</strong><span>This view is using the saved browser draft. It is not published.</span><a href="admin/">Back to admin</a>';
 document.body.appendChild(banner);
 const style=document.createElement('style');
 style.textContent='.draft-preview-banner{position:fixed;z-index:999;left:16px;bottom:92px;max-width:360px;background:var(--pink,#ff5aa7);color:var(--ink,#090907);padding:12px 14px;box-shadow:7px 7px 0 rgba(9,9,7,.85);font-size:11px;font-weight:900}.draft-preview-banner strong,.draft-preview-banner span,.draft-preview-banner a{display:block}.draft-preview-banner span{font-weight:700;margin:4px 0 7px}.draft-preview-banner a{text-decoration:underline}@media(max-width:560px){.draft-preview-banner{left:12px;right:12px;bottom:88px;max-width:none}}';
 document.head.appendChild(style);
}
function injectInteractionStyles(){
 const style=document.createElement('style');
 style.textContent=`
.player{z-index:120!important}.record-card{cursor:pointer}.record-card:focus{outline:2px solid var(--pink);outline-offset:5px}.record-actions{display:flex;flex-wrap:wrap;gap:8px}.record-actions button[data-detail]{background:transparent;color:var(--ink)}button[data-listen].is-active{background:var(--pink)!important;color:var(--ink)!important;border-color:var(--pink)!important}.player.has-current{box-shadow:0 -14px 34px rgba(255,90,167,.18)}
.record-modal{position:fixed;inset:0;z-index:82;background:rgba(9,9,7,.72);display:none;align-items:center;justify-content:center;padding:20px 20px 108px;backdrop-filter:blur(8px)}.record-modal.open{display:flex}.record-modal-card{position:relative;width:min(900px,100%);background:var(--paper);color:var(--ink);display:grid;grid-template-columns:.86fr 1.14fr;border:1.5px solid var(--ink);box-shadow:12px 12px 0 var(--pink);max-height:calc(86vh - 72px);overflow:auto}.modal-close{position:absolute;right:12px;top:12px;z-index:3;background:var(--ink);color:var(--paper);border:0;padding:9px 11px;font-size:10px;font-weight:900}.modal-cover{min-height:420px;background:linear-gradient(135deg,#1a1713,#6d4027 50%,#ff5aa7);display:flex;align-items:flex-end;padding:24px}.modal-cover span{display:block;width:62%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,var(--paper) 0 8%,var(--ink) 9% 52%,#2d2d2d 53% 61%,var(--ink) 62%)}.modal-copy{padding:56px 32px 32px}.modal-copy h3{font-size:clamp(40px,6vw,78px);line-height:.82;letter-spacing:-.06em;margin:0}.modal-copy h4{font-size:clamp(24px,3vw,42px);line-height:.9;margin:8px 0 20px}.modal-copy p{line-height:1.55;color:#54483c}.modal-facts{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0}.modal-facts span{border:1px solid var(--ink);padding:8px 10px;font-size:10px;font-weight:900}.modal-actions{display:flex;gap:10px;flex-wrap:wrap}.modal-actions button{background:var(--pink);border:1.5px solid var(--ink);padding:12px 14px;font-size:10px;font-weight:900}.modal-actions button:first-child{background:var(--ink);color:var(--paper)}
.session-cards{display:grid;gap:10px;margin-top:28px;max-width:560px}.session-card{display:block;text-align:left;background:rgba(238,229,211,.08);color:var(--paper);border:1px solid rgba(238,229,211,.25);padding:14px 15px;cursor:pointer}.session-card small,.session-card span{display:block;font-size:9px;font-weight:900;letter-spacing:.08em;color:var(--pink)}.session-card strong{display:block;margin:5px 0;font-size:19px;line-height:.95}.session-card:hover{background:var(--pink);color:var(--ink);border-color:var(--pink)}.session-card:hover small,.session-card:hover span{color:var(--ink)}
.archive-index{padding:42px 4vw;background:var(--ink);color:var(--paper)}.archive-index-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.archive-index-card{border:1px solid rgba(238,229,211,.22);padding:20px;min-height:170px;background:#11100d}.archive-index-card small{font-size:9px;color:var(--pink);font-weight:900;letter-spacing:.09em}.archive-index-card strong{display:block;margin:12px 0;font-size:30px;line-height:.88}.archive-index-card p{font-size:13px;line-height:1.45;color:#cfc4b2}
.events-section{display:grid;grid-template-columns:.86fr 1.14fr;background:var(--paper);color:var(--ink);border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink)}.events-copy{padding:72px 5vw}.events-copy h2{font-size:clamp(56px,7vw,110px);line-height:.78;letter-spacing:-.08em}.events-copy p:last-child{max-width:480px;line-height:1.5}.event-list{display:grid;grid-template-columns:1fr 1fr}.event-card{min-height:360px;padding:28px;border-left:1.5px solid var(--ink);display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(140deg,#e5532e,#eee5d3 62%)}.event-card:nth-child(2){background:linear-gradient(140deg,#321d13,#6d4027);color:var(--paper)}.event-card small{font-size:10px;font-weight:900;letter-spacing:.08em}.event-card strong{display:block;font-size:clamp(34px,4vw,62px);line-height:.82;letter-spacing:-.06em;margin:16px 0}.event-card p{line-height:1.45}.event-card a{align-self:flex-start;margin-top:12px;background:var(--pink);color:var(--ink);padding:10px 12px;font-size:10px;font-weight:900}
.bag-experience{box-shadow:-20px 0 50px rgba(9,9,7,.18)}.bag-subtitle{width:100%;margin:8px 0 0;color:#6a5c4d;font-size:11px;line-height:1.35;font-weight:800}.bag-checklist{display:grid;gap:7px;margin-bottom:14px;padding:12px;border:1px solid rgba(9,9,7,.16);background:rgba(255,90,167,.07)}.bag-checklist span{font-size:10px;font-weight:900;letter-spacing:.02em;text-transform:uppercase;color:#4c4036}.bag-checklist span:before{content:'• ';color:var(--pink);font-size:14px}.cart-footer .primary.full{font-size:12px;letter-spacing:.03em}
.site-footer{background:var(--ink);color:var(--paper);padding:30px 4vw 104px;display:flex;justify-content:space-between;gap:20px;border-top:1px solid rgba(238,229,211,.24)}.site-footer strong,.site-footer span{display:block}.site-footer span{font-size:12px;color:#cfc4b2;margin-top:6px}.site-footer nav{display:flex;gap:14px;flex-wrap:wrap}.site-footer a{font-size:11px;font-weight:900;color:var(--paper)}
.mobile-menu-toggle{display:none;background:transparent;border:1px solid rgba(238,229,211,.55);width:42px;height:36px;align-items:center;justify-content:center;gap:4px;flex-direction:column}.mobile-menu-toggle span{display:block;width:18px;height:2px;background:var(--paper);transition:.22s}.nav-open .mobile-menu-toggle span:nth-child(1){transform:translateY(6px) rotate(45deg)}.nav-open .mobile-menu-toggle span:nth-child(2){opacity:0}.nav-open .mobile-menu-toggle span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
@media(max-width:900px){.record-modal-card{grid-template-columns:1fr}.modal-cover{min-height:240px}.archive-index-grid,.event-list{grid-template-columns:1fr}.events-section{grid-template-columns:1fr}.site-footer{display:block}.site-footer nav{margin-top:18px}.main-nav{overflow:auto;white-space:nowrap}}
@media(max-width:800px){.mobile-menu-toggle{display:flex;position:relative;z-index:71}.site-header{gap:10px}.main-nav{position:fixed;z-index:70;left:0;right:0;top:68px;background:rgba(9,9,7,.98);border-bottom:1px solid rgba(238,229,211,.22);display:grid!important;gap:0;padding:0 18px 18px;max-height:0;overflow:hidden;transition:max-height .28s ease, padding .28s ease}.main-nav a{display:block;padding:15px 0;border-top:1px solid rgba(238,229,211,.16);font-size:13px}.nav-open .main-nav{max-height:380px;padding:4px 18px 18px}.cart-button{position:relative;z-index:71}.record-modal{padding-top:82px}.record-modal-card{max-height:calc(82vh - 76px)}}
@media(max-width:560px){.record-modal{padding:82px 12px 108px}.record-modal-card{box-shadow:7px 7px 0 var(--pink);max-height:calc(82vh - 76px)}.modal-copy{padding:48px 20px 24px}.archive-index{padding:34px 18px}.events-copy{padding:54px 18px}.event-card{min-height:290px;padding:22px}.site-footer{padding:26px 18px 104px}}
`;
 document.head.appendChild(style);
}

document.addEventListener('click',e=>{
 const add=e.target.closest('[data-add]');if(add){e.stopPropagation();addToCart(add.dataset.add);return}
 const listen=e.target.closest('[data-listen]');if(listen){e.stopPropagation();selectRecord(getRecord(listen.dataset.listen),true);if(recordModal.classList.contains('open'))openRecordModal(listen.dataset.listen);return}
 const detail=e.target.closest('[data-detail]');if(detail){e.stopPropagation();openRecordModal(detail.dataset.detail);return}
 const card=e.target.closest('.record-card');if(card&&!e.target.closest('button'))openRecordModal(card.dataset.id);
 const remove=e.target.closest('[data-remove]');if(remove){state.cart.splice(Number(remove.dataset.remove),1);renderCart();return}
 const session=e.target.closest('[data-session]');if(session)showSessionDetail(session.dataset.session);
});
document.addEventListener('keydown',e=>{const card=e.target.closest&&e.target.closest('.record-card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openRecordModal(card.dataset.id)}});
document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link)return;const target=document.querySelector(link.getAttribute('href'));if(target){e.preventDefault();closeMobileNav();target.scrollIntoView({behavior:'smooth',block:'start'})}});
document.getElementById('cartButton').addEventListener('click',openCart);document.getElementById('closeCart').addEventListener('click',closeCart);scrim.addEventListener('click',()=>{closeCart();closeRecordModal();closeMobileNav()});
playerToggle.addEventListener('click',()=>{if(!state.current){selectRecord(randomRecord(),true);return}state.playing=!state.playing;updatePlayerControl()});

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion){
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}})},{threshold:.18,rootMargin:'0px 0px -8%'});
 document.querySelectorAll('.motion-section').forEach(section=>observer.observe(section));
 let ticking=false;
 const updateScrollMotion=()=>{
  const y=window.scrollY;
  const vh=window.innerHeight;
  document.documentElement.style.setProperty('--scrollY',`${y}px`);
  document.querySelectorAll('.motion-section.in-view').forEach(section=>{
   const rect=section.getBoundingClientRect();
   const progress=Math.max(-1,Math.min(1,(vh*.5-(rect.top+rect.height*.5))/vh));
   section.style.setProperty('--section-progress',progress.toFixed(3));
  });
  ticking=false;
 };
 window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateScrollMotion);ticking=true}},{passive:true});
 updateScrollMotion();
}else{
 document.querySelectorAll('.motion-section').forEach(section=>section.classList.add('in-view'));
}

const brand=document.querySelector('.brand');
if(brand){
 brand.innerHTML='<img src="assets/brand/horizontal-logo-black.svg" alt="La Vaca Loca Records">';
 const brandStyle=document.createElement('style');
 brandStyle.textContent='.brand{display:flex;align-items:center;height:100%;min-width:0}.brand img{display:block;width:min(270px,36vw);height:auto;max-height:52px;object-fit:contain;object-position:left center}@media(max-width:800px){.brand img{width:min(220px,48vw);max-height:46px}}@media(max-width:520px){.brand img{width:min(190px,49vw);max-height:40px}}';
 document.head.appendChild(brandStyle);
}

injectInteractionStyles();
setupDraftPreviewBanner();
setupHomepageHero();
enhancePublicSite();
setupMobileNavigation();
renderRecordPreview();renderCart();

(function addDesignCredit(){
 const footer=document.querySelector(".site-footer");
 if(!footer||footer.querySelector(".design-credit"))return;
 footer.insertAdjacentHTML("beforeend",'<p class="design-credit"><a href="https://www.instagram.com/semiotice/" target="_blank" rel="noopener noreferrer">Website Design by Sebastian Llivichuzhca</a></p>');
 const style=document.createElement("style");
 style.textContent=".site-footer{flex-wrap:wrap}.site-footer .design-credit{flex-basis:100%;margin:24px 0 0;padding-top:18px;border-top:1px solid rgba(238,229,211,.24);text-align:center;line-height:1.6}.site-footer .design-credit a{display:inline-block;padding:8px 0;font-weight:400;color:#cfc4b2;text-underline-offset:4px}.site-footer .design-credit a:hover{text-decoration:underline;color:var(--paper)}.site-footer .design-credit a:focus-visible{outline:2px solid var(--pink);outline-offset:4px}";
 document.head.appendChild(style);
})();

if(new URLSearchParams(location.search).has('bag'))openCart();
