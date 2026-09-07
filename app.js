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
const content=window.SITE_CONTENT||{};
const state={cart:[],current:null,playing:false};
const visibleItems=list=>(list||[]).filter(item=>!item.hideFromPublic);
const recordsSource=visibleItems(content.records||window.RECORDS||[]);
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

function renderRecords(filter='all'){
 const records=window.RECORDS.filter(r=>filter==='all'||r.genre===filter);
 grid.innerHTML=records.map((r,index)=>`<article class="record-card reveal-item" style="--delay:${Math.min(index,7)*55}ms" data-id="${r.id}" tabindex="0" role="button" aria-label="Abrir detalles de ${escapeText(r.artist)} - ${escapeText(r.title)}"><div class="cover"><span class="badge">${r.status}</span><span class="cover-code">${r.id} / ${r.genre.toUpperCase()}</span></div><div class="record-meta"><div class="topline"><div><h3>${r.artist}</h3><p>${r.title} · ${r.genre}</p></div><strong>${money(r.price)}</strong></div><div class="record-actions"><button data-listen="${r.id}"><span class="mini-play" aria-hidden="true"></span> ESCUCHAR</button><button data-detail="${r.id}">DETALLES</button><button data-add="${r.id}" ${r.stock===0?'disabled':''}>${r.stock===0?'LO QUIERO':'+ BAG'}</button></div></div></article>`).join('');
 requestAnimationFrame(()=>document.querySelectorAll('.reveal-item').forEach(el=>el.classList.add('is-visible')));
}
function addToCart(id){const r=getRecord(id);if(!r||r.stock===0)return;state.cart.push(r);renderCart();openCart()}
function renderCart(){cartCount.textContent=state.cart.length;cartItems.innerHTML=state.cart.length?state.cart.map((r,i)=>`<div class="cart-item"><div><strong>${r.artist}</strong><br><small>${r.title}</small></div><div><strong>${money(r.price)}</strong><br><button data-remove="${i}" style="background:none;border:0;color:#777;cursor:pointer">remove</button></div></div>`).join(''):'<p style="color:#777">Tu bag está vacío.</p>';const total=state.cart.reduce((s,r)=>s+r.price,0);cartTotal.textContent=money(total);const lines=state.cart.map(r=>`1x ${r.artist} — ${r.title} — ${money(r.price)}`);whatsapp.href=`https://wa.me/?text=${encodeURIComponent(`${settings.whatsappText||'Hola! Quiero hacer este pedido de La Vaca Loca Records:'}\n\n${lines.join('\n')}\n\nTotal: ${money(total)}`)}`}
function openCart(){cartPanel.classList.add('open');scrim.classList.add('show');cartPanel.setAttribute('aria-hidden','false')}
function closeCart(){cartPanel.classList.remove('open');if(!recordModal.classList.contains('open'))scrim.classList.remove('show');cartPanel.setAttribute('aria-hidden','true')}
function updatePlayerControl(){playerToggle.classList.toggle('is-playing',state.playing);playerToggle.setAttribute('aria-label',state.playing?'Pausar':'Reproducir');player.classList.toggle('playing',state.playing);player.classList.toggle('has-current',!!state.current)}
function selectRecord(r,autoplay=true){if(!r)return;state.current=r;state.playing=autoplay;playerTitle.textContent=`${r.artist} — ${r.title}`;playerSub.textContent=`${r.genre.toUpperCase()} · ${r.id} · ${settings.location||'GUALACEO'}`;updatePlayerControl();player.animate([{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});document.querySelectorAll('[data-listen]').forEach(btn=>{btn.classList.toggle('is-active',btn.dataset.listen===r.id)})}
function randomRecord(){return window.RECORDS[Math.floor(Math.random()*window.RECORDS.length)]}
function dig(mood){document.querySelectorAll('[data-mood]').forEach(b=>b.classList.toggle('active',b.dataset.mood===mood));const r=randomRecord();selectRecord(r,true);openRecordModal(r)}

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
  sessionsCopy.insertAdjacentHTML('beforeend',`<div class="session-cards">${SESSIONS.map(item=>`<button class="session-card" data-session="${item.id}"><small>${item.type}</small><strong>${item.title}</strong><span>${item.status}</span></button>`).join('')}</div>`);
 }
 const gallery=document.getElementById('gallery');
 if(gallery&&!document.querySelector('.archive-index')){
  gallery.insertAdjacentHTML('afterend',`<section class="archive-index motion-section"><p class="eyebrow">ARCHIVO / ENTRADAS</p><div class="archive-index-grid">${ARCHIVE_ITEMS.map(item=>`<article class="archive-index-card"><small>${item.category||item.tag}</small><strong>${item.title}</strong><p>${item.detail}</p></article>`).join('')}</div></section>`);
 }
 const archiveSection=document.querySelector('.archive-section');
 if(archiveSection&&!document.querySelector('.events-section')){
  archiveSection.insertAdjacentHTML('beforebegin',`<section class="events-section motion-section" id="events"><div class="events-copy motion-copy"><p class="eyebrow">05 / AGENDA</p><h2>EVENTOS<br>Y POSTERS</h2><p>Una entrada clara para futuras fiestas, listening sessions, lanzamientos y posters culturales.</p></div><div class="event-list motion-object">${EVENTS.map(event=>`<article class="event-card" data-event="${event.id}"><small>${event.date} · ${event.place}</small><strong>${event.title}</strong><p>${event.detail}</p><a href="#shop">VER DISCOS</a></article>`).join('')}</div></section>`);
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
  document.querySelector('main').insertAdjacentHTML('afterend',`<footer class="site-footer"><div><strong>${settings.brandName||'LA VACA LOCA RECORDS'}</strong><span>${settings.location||'Gualaceo, Ecuador'} · discos · sessions · cultura</span></div><nav><a href="#shop">Discos</a><a href="#sessions">Sessions</a><a href="#events">Eventos</a><a href="#archive">Archivo</a></nav></footer>`);
 }
 const nav=document.querySelector('.main-nav');
 if(nav&&!nav.querySelector('[href="#events"]'))nav.insertAdjacentHTML('beforeend','<a href="#events">EVENTOS</a>');
}
function showSessionDetail(id){
 const item=SESSIONS.find(x=>x.id===id);
 const card=document.querySelector('.sessions-photo-card');
 if(!item||!card)return;
 card.innerHTML=`<span>${item.type.toUpperCase()} / ${item.status.toUpperCase()}</span><strong>${item.title.toUpperCase()}</strong><span>${item.detail}</span><br><a class="sessions-button" href="#archive">VER ARCHIVO →</a>`;
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
.session-cards{display:grid;gap:10px;margin-top:28px;max-width:560px}.session-card{text-align:left;background:rgba(238,229,211,.08);color:var(--paper);border:1px solid rgba(238,229,211,.25);padding:14px 15px;cursor:pointer}.session-card small,.session-card span{display:block;font-size:9px;font-weight:900;letter-spacing:.08em;color:var(--pink)}.session-card strong{display:block;margin:5px 0;font-size:19px;line-height:.95}.session-card:hover{background:var(--pink);color:var(--ink);border-color:var(--pink)}.session-card:hover small,.session-card:hover span{color:var(--ink)}
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
 const filter=e.target.closest('[data-filter]');if(filter){document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));filter.classList.add('active');renderRecords(filter.dataset.filter);return}
 const mood=e.target.closest('[data-mood]');if(mood){dig(mood.dataset.mood);return}
 const session=e.target.closest('[data-session]');if(session)showSessionDetail(session.dataset.session);
});
document.addEventListener('keydown',e=>{const card=e.target.closest&&e.target.closest('.record-card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openRecordModal(card.dataset.id)}});
document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link)return;const target=document.querySelector(link.getAttribute('href'));if(target){e.preventDefault();closeMobileNav();target.scrollIntoView({behavior:'smooth',block:'start'})}});
document.getElementById('cartButton').addEventListener('click',openCart);document.getElementById('closeCart').addEventListener('click',closeCart);scrim.addEventListener('click',()=>{closeCart();closeRecordModal();closeMobileNav()});
const digRandomButton=document.getElementById('digRandom');
if(digRandomButton)digRandomButton.addEventListener('click',()=>dig(''));
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
enhancePublicSite();
setupMobileNavigation();
renderRecords();renderCart();