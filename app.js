const state={cart:[]};
const grid=document.getElementById('recordGrid');
const cartPanel=document.getElementById('cartPanel');
const scrim=document.getElementById('scrim');
const cartCount=document.getElementById('cartCount');
const cartItems=document.getElementById('cartItems');
const cartTotal=document.getElementById('cartTotal');
const playerTitle=document.getElementById('playerTitle');
const whatsapp=document.getElementById('whatsappCheckout');

function renderRecords(filter='all'){
  const records=window.RECORDS.filter(r=>filter==='all'||r.genre===filter);
  grid.innerHTML=records.map(r=>`<article class="record-card" data-id="${r.id}">
    <div class="cover"><span class="badge">${r.status}</span></div>
    <div class="record-meta">
      <div class="topline"><div><h3>${r.artist}</h3><p>${r.title} · ${r.genre}</p></div><strong>$${r.price}</strong></div>
      <div class="record-actions">
        <button data-listen="${r.id}">▶ Listen</button>
        <button data-add="${r.id}" ${r.stock===0?'disabled':''}>${r.stock===0?'Lo quiero':'+ Bag'}</button>
      </div>
    </div>
  </article>`).join('');
}

function addToCart(id){
  const record=window.RECORDS.find(r=>r.id===id);
  if(!record||record.stock===0)return;
  state.cart.push(record);
  renderCart();
}

function renderCart(){
  cartCount.textContent=state.cart.length;
  cartItems.innerHTML=state.cart.length?state.cart.map((r,i)=>`<div class="cart-item"><div><strong>${r.artist}</strong><br><small>${r.title}</small></div><div><strong>$${r.price}</strong><br><button data-remove="${i}" style="background:none;border:0;color:#aaa;cursor:pointer">remove</button></div></div>`).join(''):'<p style="color:#aaa">Tu bag está vacío.</p>';
  const total=state.cart.reduce((sum,r)=>sum+r.price,0);
  cartTotal.textContent=`$${total}`;
  const lines=state.cart.map(r=>`1x ${r.artist} — ${r.title} — $${r.price}`);
  const message=`Hola! Quiero hacer este pedido de La Vaca Loca Records:\n\n${lines.join('\n')}\n\nTotal: $${total}`;
  whatsapp.href=`https://wa.me/?text=${encodeURIComponent(message)}`;
}

function openCart(){cartPanel.classList.add('open');scrim.classList.add('show');cartPanel.setAttribute('aria-hidden','false')}
function closeCart(){cartPanel.classList.remove('open');scrim.classList.remove('show');cartPanel.setAttribute('aria-hidden','true')}

document.addEventListener('click',e=>{
  const add=e.target.closest('[data-add]');
  if(add)addToCart(add.dataset.add);
  const listen=e.target.closest('[data-listen]');
  if(listen){const r=window.RECORDS.find(x=>x.id===listen.dataset.listen);playerTitle.textContent=`${r.artist} — ${r.title}`}
  const remove=e.target.closest('[data-remove]');
  if(remove){state.cart.splice(Number(remove.dataset.remove),1);renderCart()}
  const filter=e.target.closest('[data-filter]');
  if(filter){document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));filter.classList.add('active');renderRecords(filter.dataset.filter)}
});

document.getElementById('cartButton').addEventListener('click',openCart);
document.getElementById('closeCart').addEventListener('click',closeCart);
scrim.addEventListener('click',closeCart);
document.getElementById('playerToggle').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='▶'?'Ⅱ':'▶'});
renderRecords();renderCart();
