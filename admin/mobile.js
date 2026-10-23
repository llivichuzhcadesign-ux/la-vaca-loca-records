/* Mobile navigation for LVL Admin; desktop navigation is unchanged. */
(()=>{
  const menu=document.getElementById('adminMenuToggle');
  const aside=document.getElementById('adminNavigation');
  const overlay=document.getElementById('adminNavBackdrop');
  const closeButton=document.getElementById('adminNavClose');
  if(!menu||!aside||!overlay)return;

  const mobile=window.matchMedia('(max-width: 900px)');
  const navItems=()=>Array.from(aside.querySelectorAll('.nav-item:not([hidden])')).filter(item=>item.getClientRects().length);
  let opened=false;
  let swipeStart=null;

  function syncNavAccessibility(){
    if(mobile.matches){
      if(!opened)aside.setAttribute('inert','');
      else aside.removeAttribute('inert');
      overlay.hidden=!opened;
    }else{
      aside.removeAttribute('inert');
      overlay.hidden=true;
    }
    menu.setAttribute('aria-expanded',String(opened&&mobile.matches));
    menu.setAttribute('aria-label',opened?'Close admin navigation':'Open admin navigation');
  }

  function openMenu(){
    if(!mobile.matches||opened)return;
    opened=true;
    document.body.classList.add('admin-nav-open');
    syncNavAccessibility();
    const selected=navItems().find(item=>item.classList.contains('active'))||navItems()[0];
    (selected||closeButton)?.focus({preventScroll:true});
  }

  function closeMenu(restoreFocus=true){
    if(!opened)return;
    opened=false;
    document.body.classList.remove('admin-nav-open');
    syncNavAccessibility();
    if(restoreFocus&&mobile.matches)menu.focus({preventScroll:true});
  }

  menu.addEventListener('click',()=>opened?closeMenu():openMenu());
  closeButton?.addEventListener('click',()=>closeMenu());
  overlay.addEventListener('click',()=>closeMenu());

  aside.addEventListener('click',event=>{
    const nav=event.target.closest('button[data-panel]');
    if(!nav)return;
    closeMenu(false);
    aside.querySelectorAll('[data-panel]').forEach(item=>{
      if(item===nav)item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    });
    if(mobile.matches){
      window.scrollTo(0,0);
      const panel=document.getElementById(nav.dataset.panel);
      const heading=panel?.querySelector('h1,h2');
      if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
    }
  });

  document.getElementById('adminMobileLogout')?.addEventListener('click',()=>{
    closeMenu(false);
    document.getElementById('adminLogout')?.click();
  });

  document.addEventListener('keydown',event=>{
    if(!opened||!mobile.matches)return;
    if(event.key==='Escape'){event.preventDefault();closeMenu();return}
    if(event.key!=='Tab')return;
    const focusable=[closeButton,...navItems()].filter(el=>el&&!el.disabled);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });

  aside.addEventListener('touchstart',event=>{
    const touch=event.touches[0];
    swipeStart=touch?{x:touch.clientX,y:touch.clientY}:null;
  },{passive:true});
  aside.addEventListener('touchend',event=>{
    if(!swipeStart||!opened)return;
    const touch=event.changedTouches[0];
    if(touch){
      const dx=touch.clientX-swipeStart.x,dy=touch.clientY-swipeStart.y;
      if(dx< -75&&Math.abs(dx)>Math.abs(dy)*1.5)closeMenu();
    }
    swipeStart=null;
  },{passive:true});

  const onBreakpointChange=()=>{
    opened=false;
    document.body.classList.remove('admin-nav-open');
    syncNavAccessibility();
  };
  mobile.addEventListener('change',onBreakpointChange);
  aside.querySelector('.nav-item.active')?.setAttribute('aria-current','page');
  syncNavAccessibility();
})();