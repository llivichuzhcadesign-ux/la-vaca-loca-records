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
 grid.innerHTML=records.map(r=>`<article class="record-card" data-id="${r.id}"><div class="cover"><span class="badge">${r.status}</span><span class="cover-code">${r.id} / ${r.genre.toUpperCase()}</span></div><div class="record-meta"><div class="topline"><div><h3>${r.artist}</h3><p>${r.title} · ${r.genre}</p></div><strong>$${r.price}</strong></div><div class="record-actions"><button data-listen="${r.id}">▶ ESCUCHAR</button><button data-add="${r.id}" ${r.stock===0?'disabled':''}>${r.stock===0?'LO QUIERO':'+ BAG'}</button></div></div></article>`).join('');
}
function addToCart(id){const r=window.RECORDS.find(x=>x.id===id);if(!r||r.stock===0)return;state.cart.push(r);renderCart()}
function renderCart(){cartCount.textContent=state.cart.length;cartItems.innerHTML=state.cart.length?state.cart.map((r,i)=>`<div class="cart-item"><div><strong>${r.artist}</strong><br><small>${r.title}</small></div><div><strong>$${r.price}</strong><br><button data-remove="${i}" style="background:none;border:0;color:#777;cursor:pointer">remove</button></div></div>`).join(''):'<p style="color:#777">Tu bag está vacío.</p>';const total=state.cart.reduce((s,r)=>s+r.price,0);cartTotal.textContent=`$${total}`;const lines=state.cart.map(r=>`1x ${r.artist} — ${r.title} — $${r.price}`);whatsapp.href=`https://wa.me/?text=${encodeURIComponent(`Hola! Quiero hacer este pedido de La Vaca Loca Records:\n\n${lines.join('\n')}\n\nTotal: $${total}`)}`}
function openCart(){cartPanel.classList.add('open');scrim.classList.add('show');cartPanel.setAttribute('aria-hidden','false')}
function closeCart(){cartPanel.classList.remove('open');scrim.classList.remove('show');cartPanel.setAttribute('aria-hidden','true')}
function selectRecord(r,autoplay=true){if(!r)return;state.current=r;state.playing=autoplay;playerTitle.textContent=`${r.artist} — ${r.title}`;playerSub.textContent=`${r.genre.toUpperCase()} · ${r.id} · GUALACEO`;playerToggle.textContent=state.playing?'Ⅱ':'▶';player.classList.toggle('playing',state.playing)}
function randomRecord(){return window.RECORDS[Math.floor(Math.random()*window.RECORDS.length)]}
function dig(mood){document.querySelectorAll('[data-mood]').forEach(b=>b.classList.toggle('active',b.dataset.mood===mood));const r=randomRecord();selectRecord(r,true);document.getElementById('player').animate([{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:260});}
document.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add)addToCart(add.dataset.add);const listen=e.target.closest('[data-listen]');if(listen)selectRecord(window.RECORDS.find(x=>x.id===listen.dataset.listen),true);const remove=e.target.closest('[data-remove]');if(remove){state.cart.splice(Number(remove.dataset.remove),1);renderCart()}const filter=e.target.closest('[data-filter]');if(filter){document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));filter.classList.add('active');renderRecords(filter.dataset.filter)}const mood=e.target.closest('[data-mood]');if(mood)dig(mood.dataset.mood)});
document.getElementById('cartButton').addEventListener('click',openCart);document.getElementById('closeCart').addEventListener('click',closeCart);scrim.addEventListener('click',closeCart);document.getElementById('digRandom').addEventListener('click',()=>dig(''));
playerToggle.addEventListener('click',()=>{if(!state.current){selectRecord(randomRecord(),true);return}state.playing=!state.playing;playerToggle.textContent=state.playing?'Ⅱ':'▶';player.classList.toggle('playing',state.playing)});
renderRecords();renderCart();