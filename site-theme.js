/* Small-screen menu for public pages; the existing Apple header keeps its controls. */
(()=>{
 if(document.documentElement.classList.contains('ios-header'))return;
 const header=document.querySelector('.editorial-header'),nav=header?.querySelector(':scope > nav');
 if(!header||!nav)return;
 const button=document.createElement('button');
 button.type='button';button.className='public-menu-toggle';
 button.setAttribute('aria-label','Abrir menú');button.setAttribute('aria-expanded','false');
 nav.id=nav.id||'publicNavigation';button.setAttribute('aria-controls',nav.id);
 button.innerHTML='<span></span><span></span><span></span>';
 const close=()=>{header.classList.remove('public-menu-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Abrir menú')};
 button.addEventListener('click',()=>{const open=header.classList.toggle('public-menu-open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
 nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});
 header.addEventListener('keydown',e=>{if(e.key==='Escape'){close();button.focus()}});
 window.matchMedia('(min-width:801px)').addEventListener('change',close);
 header.append(button);
})();
