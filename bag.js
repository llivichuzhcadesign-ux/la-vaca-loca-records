(()=>{
 const key='lvl-cart-discs',settings=window.SITE_CONTENT?.settings||{};
 const records=(window.SITE_CONTENT?.records||window.RECORDS||[]).filter(r=>!r.hideFromPublic&&!['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(r.status||'').toUpperCase()));
 const record=id=>records.find(r=>r.id===id),stock=r=>Math.max(0,Math.floor(Number(r?.stock)||0));
 function read(){try{const ids=JSON.parse(localStorage.getItem(key)||'[]');const counts=new Map();return (Array.isArray(ids)?ids:[]).filter(id=>{const r=record(id),n=(counts.get(id)||0)+1;counts.set(id,n);return r&&n<=stock(r)})}catch{return []}}
 let ids=read(),opener=null,scrollY=0,styles=null;
 const dialog=document.createElement('dialog');dialog.className='shared-bag';dialog.setAttribute('aria-labelledby','sharedBagTitle');
 dialog.innerHTML='<div class="shared-bag-head"><h2 id="sharedBagTitle">Tu canasta</h2><button type="button" data-bag-close aria-label="Cerrar canasta">Cerrar ×</button></div><div class="shared-bag-items"></div><div class="shared-bag-footer"><div><span>Total</span><strong></strong></div><a target="_blank" rel="noopener noreferrer">Ordenar por WhatsApp ↗</a><p role="status" aria-live="polite"></p></div>';document.body.append(dialog);
 const items=dialog.querySelector('.shared-bag-items'),total=dialog.querySelector('.shared-bag-footer strong'),checkout=dialog.querySelector('.shared-bag-footer a'),status=dialog.querySelector('[role="status"]');
 const money=value=>(settings.currency||'$')+Number(value||0).toFixed(2);
 function save(){localStorage.setItem(key,JSON.stringify(ids));document.dispatchEvent(new Event('lvl-bag-change'));render()}
 function render(){
  items.replaceChildren();const counts=new Map();ids.forEach(id=>counts.set(id,(counts.get(id)||0)+1));let sum=0;const lines=[];
  for(const [id,qty] of counts){const r=record(id);sum+=Number(r.price||0)*qty;lines.push(qty+'x '+r.artist+' — '+r.title+' — '+money(Number(r.price||0)*qty));
   const row=document.createElement('div');row.className='shared-bag-item';const copy=document.createElement('div'),title=document.createElement('strong'),artist=document.createElement('span'),price=document.createElement('span');title.textContent=r.title;artist.textContent=r.artist;price.textContent=qty+' × '+money(r.price);copy.append(title,artist,price);
   const controls=document.createElement('div');const remove=document.createElement('button');remove.type='button';remove.textContent='−';remove.setAttribute('aria-label','Quitar una copia de '+r.title);remove.onclick=()=>{ids.splice(ids.indexOf(id),1);save()};const amount=document.createElement('span');amount.textContent=qty;const add=document.createElement('button');add.type='button';add.textContent='+';add.disabled=qty>=stock(r);add.setAttribute('aria-label','Añadir una copia de '+r.title);add.onclick=()=>{ids.push(id);save()};controls.append(remove,amount,add);row.append(copy,controls);items.append(row);
  }
  if(!ids.length){const empty=document.createElement('p');empty.textContent='Tu canasta está vacía.';items.append(empty)}
  total.textContent=money(sum);const phone=String(settings.whatsappNumber||'').replace(/\D/g,'');checkout.setAttribute('aria-disabled',String(!ids.length||!phone));
  if(ids.length&&phone)checkout.href='https://wa.me/'+phone+'?text='+encodeURIComponent((settings.whatsappText||'Hola! Quiero hacer este pedido de La Vaca Loca Records:')+'\n\n'+lines.join('\n')+'\n\nTotal: '+money(sum));else checkout.removeAttribute('href');
  status.textContent=!phone?'La tienda todavía no ha configurado su número de WhatsApp.':'';
  document.querySelectorAll('.bag-count').forEach(count=>{count.textContent=ids.length;count.hidden=!ids.length});document.querySelectorAll('#cartButton,.header-bag,.ios-basket').forEach(button=>button.setAttribute('aria-label','Abrir canasta: '+ids.length+' '+(ids.length===1?'disco':'discos')));
 }
 function refresh(){ids=read();save()}
 function open(){refresh();if(dialog.open)return;opener=document.activeElement;scrollY=window.scrollY;styles={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};Object.assign(document.body.style,{position:'fixed',top:-scrollY+'px',width:'100%',overflow:'hidden'});dialog.showModal()}
 dialog.querySelector('[data-bag-close]').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}});
 dialog.addEventListener('close',()=>{if(styles)Object.assign(document.body.style,styles);const behavior=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,scrollY);document.documentElement.style.scrollBehavior=behavior;opener?.focus({preventScroll:true})});
 function add(id){ids=read();const r=record(id);if(!r||ids.filter(v=>v===id).length>=stock(r)){open();status.textContent='Ya tienes todas las copias disponibles de este disco.';return}ids.push(id);save();open()}
 document.addEventListener('click',e=>{const trigger=e.target.closest('#cartButton,.header-bag,.ios-basket,[data-add],#recordBag');if(!trigger)return;e.preventDefault();e.stopImmediatePropagation();if(trigger.hasAttribute('data-add'))add(trigger.dataset.add);else if(trigger.id==='recordBag'){const id=trigger.dataset.recordId;ids=read();if(id&&!ids.includes(id))add(id);else open()}else open()},true);
 window.openLVLBag=open;window.addEventListener('pageshow',refresh);window.addEventListener('storage',e=>{if(e.key===key)refresh()});
 window.closeCart?.();document.getElementById('cartPanel')?.setAttribute('hidden','');document.querySelectorAll('#cartButton,.header-bag,.ios-basket').forEach(button=>{let badge=button.querySelector('#cartCount,.bag-count');if(!badge){badge=document.createElement('span');button.append(badge)}badge.classList.add('bag-count');badge.setAttribute('aria-hidden','true')});save();if(new URLSearchParams(location.search).has('bag'))open();
})();
