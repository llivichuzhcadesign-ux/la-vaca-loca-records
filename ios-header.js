(()=>{
 if(!/iPhone|iPad|iPod/.test(navigator.userAgent)&&!(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return;
 document.documentElement.classList.add('ios-header');
 const header=document.querySelector('.site-header,.editorial-header');if(!header)return;
 const brand=header.querySelector('.brand');brand.innerHTML='<img src="assets/brand/cow-symbol.svg" alt="La Vaca Loca Records">';brand.href='index.html';
 let menu=header.querySelector('.mobile-menu-toggle');if(!menu){menu=document.createElement('button');menu.className='mobile-menu-toggle';menu.innerHTML='<span></span><span></span><span></span>';menu.setAttribute('aria-label','Abrir menú');menu.onclick=()=>{const open=header.classList.toggle('ios-menu-open');menu.setAttribute('aria-expanded',String(open))};header.prepend(menu)}
 const right=document.createElement('div');right.className='ios-header-actions';
 const heart=document.createElement('button');heart.className='ios-heart';heart.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';heart.setAttribute('aria-label','Ver discos favoritos');right.append(heart);
 let bag=header.querySelector('#cartButton');if(!bag){bag=document.createElement('a');bag.href='index.html?bag=1';bag.className='ios-basket';bag.setAttribute('aria-label','Abrir canasta de compras');bag.innerHTML='<img src="assets/brand/carrizo-basket.svg" alt="">'}if(bag.id==='cartButton'){bag.querySelector('svg')?.remove();const image=document.createElement('img');image.src='assets/brand/carrizo-basket.svg';image.alt='';bag.prepend(image)}right.append(bag);header.append(right);
 const records=(window.SITE_CONTENT?.records||window.RECORDS||[]).filter(r=>!r.hideFromPublic&&!['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(r.status||'').toUpperCase()));
 let saved;try{saved=new Set(JSON.parse(localStorage.getItem('lvl-liked-discs')||'[]'))}catch{saved=new Set()}
 const dialog=document.createElement('dialog');dialog.className='ios-liked-dialog';document.body.append(dialog);
 let all=false;
 function render(){dialog.replaceChildren();const head=document.createElement('div');head.className='ios-liked-head';const title=document.createElement('h2');title.textContent=all?'Discos':'Favoritos';const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Cerrar favoritos');close.onclick=()=>dialog.close();head.append(title,close);dialog.append(head);
 const toggle=document.createElement('button');toggle.className='ios-liked-toggle';toggle.textContent=all?'Ver mis favoritos':'Elegir discos';toggle.onclick=()=>{all=!all;render()};dialog.append(toggle);
 const list=document.createElement('div');list.className='ios-liked-list';dialog.append(list);
 const shown=records.filter(r=>all||saved.has(r.id));if(!shown.length){const empty=document.createElement('p');empty.textContent='Todavía no tienes discos favoritos.';list.append(empty)}
 shown.forEach(r=>{const row=document.createElement('div');row.className='ios-liked-row';const link=document.createElement('a');link.href='discos.html#'+encodeURIComponent(r.id);const img=document.createElement('img');const url=r.media?.cover?.url||r.coverImage; if(url){img.src=url;img.alt='';link.append(img)}const text=document.createElement('span');text.textContent=r.title+' · '+r.artist;link.append(text);const like=document.createElement('button');like.textContent=saved.has(r.id)?'♥':'♡';like.setAttribute('aria-label',(saved.has(r.id)?'Quitar de favoritos: ':'Guardar favorito: ')+r.title);like.setAttribute('aria-pressed',String(saved.has(r.id)));like.onclick=()=>{saved.has(r.id)?saved.delete(r.id):saved.add(r.id);localStorage.setItem('lvl-liked-discs',JSON.stringify([...saved]));render()};row.append(link,like);list.append(row)});
 }
 heart.onclick=()=>{try{saved=new Set(JSON.parse(localStorage.getItem('lvl-liked-discs')||'[]'))}catch{saved=new Set()}all=false;render();dialog.showModal()};dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
 if(new URLSearchParams(location.search).has('bag'))document.getElementById('cartButton')?.click();
})();
