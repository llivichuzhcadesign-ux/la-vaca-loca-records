const state={cart:[],current:null,playing:false};
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

function renderRecords(filter='all'){
 const records=window.RECORDS.filter(r=>filter==='all'||r.genre===filter);
 grid.innerHTML=records.map((r,index)=>`<article class="record-card reveal-item" style="--delay:${Math.min(index,7)*55}ms" data-id="${r.id}"><div class="cover"><span class="badge">${r.status}</span><span class="cover-code">${r.id} / ${r.genre.toUpperCase()}</span></div><div class="record-meta"><div class="topline"><div><h3>${r.artist}</h3><p>${r.title} · ${r.genre}</p></div><strong>$${r.price}</strong></div><div class="record-actions"><button data-listen="${r.id}"><span class="mini-play" aria-hidden="true"></span> ESCUCHAR</button><button data-add="${r.id}" ${r.stock===0?'disabled':''}>${r.stock===0?'LO QUIERO':'+ BAG'}</button></div></div></article>`).join('');
 requestAnimationFrame(()=>document.querySelectorAll('.reveal-item').forEach(el=>el.classList.add('is-visible')));
}
function addToCart(id){const r=window.RECORDS.find(x=>x.id===id);if(!r||r.stock===0)return;state.cart.push(r);renderCart()}
function renderCart(){cartCount.textContent=state.cart.length;cartItems.innerHTML=state.cart.length?state.cart.map((r,i)=>`<div class="cart-item"><div><strong>${r.artist}</strong><br><small>${r.title}</small></div><div><strong>$${r.price}</strong><br><button data-remove="${i}" style="background:none;border:0;color:#777;cursor:pointer">remove</button></div></div>`).join(''):'<p style="color:#777">Tu bag está vacío.</p>';const total=state.cart.reduce((s,r)=>s+r.price,0);cartTotal.textContent=`$${total}`;const lines=state.cart.map(r=>`1x ${r.artist} — ${r.title} — $${r.price}`);whatsapp.href=`https://wa.me/?text=${encodeURIComponent(`Hola! Quiero hacer este pedido de La Vaca Loca Records:\n\n${lines.join('\n')}\n\nTotal: $${total}`)}`}
function openCart(){cartPanel.classList.add('open');scrim.classList.add('show');cartPanel.setAttribute('aria-hidden','false')}
function closeCart(){cartPanel.classList.remove('open');scrim.classList.remove('show');cartPanel.setAttribute('aria-hidden','true')}
function updatePlayerControl(){playerToggle.classList.toggle('is-playing',state.playing);playerToggle.setAttribute('aria-label',state.playing?'Pausar':'Reproducir');player.classList.toggle('playing',state.playing)}
function selectRecord(r,autoplay=true){if(!r)return;state.current=r;state.playing=autoplay;playerTitle.textContent=`${r.artist} — ${r.title}`;playerSub.textContent=`${r.genre.toUpperCase()} · ${r.id} · GUALACEO`;updatePlayerControl()}
function randomRecord(){return window.RECORDS[Math.floor(Math.random()*window.RECORDS.length)]}
function dig(mood){document.querySelectorAll('[data-mood]').forEach(b=>b.classList.toggle('active',b.dataset.mood===mood));const r=randomRecord();selectRecord(r,true);player.animate([{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});}

document.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add)addToCart(add.dataset.add);const listen=e.target.closest('[data-listen]');if(listen)selectRecord(window.RECORDS.find(x=>x.id===listen.dataset.listen),true);const remove=e.target.closest('[data-remove]');if(remove){state.cart.splice(Number(remove.dataset.remove),1);renderCart()}const filter=e.target.closest('[data-filter]');if(filter){document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));filter.classList.add('active');renderRecords(filter.dataset.filter)}const mood=e.target.closest('[data-mood]');if(mood)dig(mood.dataset.mood)});
document.getElementById('cartButton').addEventListener('click',openCart);document.getElementById('closeCart').addEventListener('click',closeCart);scrim.addEventListener('click',closeCart);document.getElementById('digRandom').addEventListener('click',()=>dig(''));
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
 brandStyle.textContent='.brand{display:flex;align-items:center;height:100%;min-width:0}.brand img{display:block;width:min(270px,36vw);height:auto;max-height:52px;object-fit:contain;object-position:left center}@media(max-width:800px){.brand img{width:min(220px,48vw);max-height:46px}}@media(max-width:520px){.brand img{width:min(205px,56vw);max-height:42px}}';
 document.head.appendChild(brandStyle);
}

renderRecords();renderCart();