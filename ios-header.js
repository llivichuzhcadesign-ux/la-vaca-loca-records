(()=>{
 const header=document.querySelector('.site-header,.editorial-header');
 if(!header)return;
 const brand=header.querySelector(':scope > .lvl-brand-trigger');
 if(!brand)return;
 const appleTouch=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(appleTouch)document.documentElement.classList.add('ios-header');

 // The logo is the navigation trigger on every device. Desktop keeps its inline links.
 const oldMenu=header.querySelector('.mobile-menu-toggle,.public-menu-toggle');
 oldMenu?.remove();
 document.body.classList.remove('nav-open');
 header.classList.remove('ios-menu-open','public-menu-open');
 const existingNav=header.querySelector(':scope > .main-nav,:scope > nav[aria-label="Principal"]');
 existingNav?.setAttribute('aria-label','Navegación principal');

 const pages=[
  ['Inicio','index.html','home'],
  ['Discos','discos.html','discos'],
  ['Sessions','sessions.html','sessions'],
  ['Eventos','eventos.html','eventos'],
  ['Archivo','archivo.html','archivo']
 ];
 const current=document.body.dataset.page||'home';
 const dropdown=document.createElement('div');
 dropdown.className='lvl-header-dropdown';
 dropdown.id='lvlHeaderDropdown';
 dropdown.hidden=true;
 dropdown.innerHTML='<div class="lvl-header-dropdown-inner"><p class="lvl-header-dropdown-kicker">LA VACA LOCA / EXPLORAR</p><nav aria-label="Explorar el sitio">'+pages.map(([title,url,key],i)=>'<a href="'+url+'"'+(key===current?' aria-current="page"':'')+'><span class="lvl-header-nav-number">0'+(i+1)+'</span><span class="lvl-header-nav-title">'+title+'</span><span class="lvl-header-nav-arrow" aria-hidden="true">↗</span></a>').join('')+'</nav></div>';
 header.append(dropdown);
 brand.setAttribute('aria-controls',dropdown.id);
 brand.setAttribute('aria-expanded','false');
 const closeMenu=()=>{
  dropdown.hidden=true;
  brand.setAttribute('aria-expanded','false');
  brand.setAttribute('aria-label','Abrir menú de navegación');
  header.classList.remove('lvl-menu-open');
 };
 const toggleMenu=()=>{
  const open=dropdown.hidden;
  dropdown.hidden=!open;
  brand.setAttribute('aria-expanded',String(open));
  brand.setAttribute('aria-label',open?'Cerrar menú de navegación':'Abrir menú de navegación');
  header.classList.toggle('lvl-menu-open',open);
 };
 brand.addEventListener('click',toggleMenu);
 // Keyboard users can enter the navigation immediately with ArrowDown.
 brand.addEventListener('keydown',event=>{
  if(event.key!=='ArrowDown')return;
  event.preventDefault();
  if(dropdown.hidden)toggleMenu();
  dropdown.querySelector('a')?.focus();
 });
 dropdown.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
 document.addEventListener('click',event=>{
  if(!brand.contains(event.target)&&!dropdown.contains(event.target))closeMenu();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!dropdown.hidden){closeMenu();brand.focus()}
 });
 window.closeLVLHeaderMenu=closeMenu;

 // Shared favorite and shopping-bag actions, including non-Apple phones.
 const right=document.createElement('div');
 right.className='lvl-header-actions ios-header-actions';
 const heart=document.createElement('button');
 heart.type='button';
 heart.className='ios-heart';
 heart.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
 heart.setAttribute('aria-label','Ver discos favoritos');
 let bag=header.querySelector('#cartButton,.header-bag');
 if(!bag){
  bag=document.createElement('a');
  bag.href='index.html?bag=1';
  bag.className='header-bag';
  bag.setAttribute('aria-label','Abrir bolsa de compras');
  bag.innerHTML='<img src="assets/brand/shopping-bag.svg" alt="">';
 }
 bag.classList.add('ios-basket');
 bag.querySelector('svg')?.remove();
 let bagImage=bag.querySelector('img');
 if(!bagImage){bagImage=document.createElement('img');bag.prepend(bagImage)}
 bagImage.src='assets/brand/shopping-bag.svg';
 bagImage.alt='';
 right.append(heart,bag);
 header.append(right);
 // Content scripts can be deferred on inner pages. Never freeze the initial (possibly empty) list.
 const availableRecords=()=>{
  const source=window.SITE_CONTENT?.records||window.RECORDS||[];
  return (Array.isArray(source)?source:[]).filter(r=>!r.hideFromPublic&&!['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(r.status||'').toUpperCase()));
 };
 let saved;try{saved=new Set(JSON.parse(localStorage.getItem('lvl-liked-discs')||'[]'))}catch{saved=new Set()}
 const dialog=document.createElement('dialog');dialog.className='ios-liked-dialog';document.body.append(dialog);
 let all=false;
 function render(){dialog.replaceChildren();const head=document.createElement('div');head.className='ios-liked-head';const title=document.createElement('h2');title.textContent=all?'Discos':'Favoritos';const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Cerrar favoritos');close.onclick=()=>dialog.close();head.append(title,close);dialog.append(head);
 const toggle=document.createElement('button');toggle.className='ios-liked-toggle';toggle.textContent=all?'Ver mis favoritos':'Elegir discos';toggle.onclick=()=>{all=!all;render()};dialog.append(toggle);
 const list=document.createElement('div');list.className='ios-liked-list';dialog.append(list);
 const shown=availableRecords().filter(r=>all||saved.has(r.id));if(!shown.length){const empty=document.createElement('p');empty.textContent='Todavía no tienes discos favoritos.';list.append(empty)}
 shown.forEach(r=>{const row=document.createElement('div');row.className='ios-liked-row';const link=document.createElement('a');link.href='discos.html#'+encodeURIComponent(r.id);const img=document.createElement('img');const url=r.media?.cover?.url||r.coverImage; if(url){img.src=url;img.alt='';link.append(img)}const text=document.createElement('span');text.textContent=r.title+' · '+r.artist;link.append(text);const like=document.createElement('button');like.innerHTML='<svg viewBox="0 0 24 24" fill="'+(saved.has(r.id)?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';like.setAttribute('aria-label',(saved.has(r.id)?'Quitar de favoritos: ':'Guardar favorito: ')+r.title);like.setAttribute('aria-pressed',String(saved.has(r.id)));like.onclick=()=>{saved.has(r.id)?saved.delete(r.id):saved.add(r.id);localStorage.setItem('lvl-liked-discs',JSON.stringify([...saved]));render()};row.append(link,like);list.append(row)});
 }
 heart.onclick=()=>{try{saved=new Set(JSON.parse(localStorage.getItem('lvl-liked-discs')||'[]'))}catch{saved=new Set()}all=false;render();dialog.showModal()};dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
 if(new URLSearchParams(location.search).has('bag'))document.getElementById('cartButton')?.click();
})();
