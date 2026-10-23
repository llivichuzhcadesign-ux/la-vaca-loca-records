/* Swipeable admin tabs for phones; desktop sidebar stays unchanged. */
(()=>{
 const tabs=document.getElementById('adminNavigation');
 const mobileLogout=document.getElementById('adminMobileHeaderLogout');
 if(!tabs)return;
 const mobile=window.matchMedia('(max-width: 900px)');
 const items=()=>Array.from(tabs.querySelectorAll('button[data-panel]:not([hidden])'));

 function revealTab(tab,behavior='smooth'){
  if(!mobile.matches||!tab)return;
  const container=tabs.getBoundingClientRect();
  const rect=tab.getBoundingClientRect();
  // Center the selected tab without scrolling the entire page vertically.
  const target=tabs.scrollLeft+(rect.left-container.left)-(container.width-rect.width)/2;
  tabs.scrollTo({left:Math.max(0,target),behavior});
 }

 function selectTab(tab){
  if(!tab)return;
  items().forEach(item=>{
   if(item===tab)item.setAttribute('aria-current','page');
   else item.removeAttribute('aria-current');
  });
  if(mobile.matches){
   revealTab(tab);
   window.scrollTo({top:0,behavior:'instant'});
  }
 }

 tabs.addEventListener('click',event=>{
  const tab=event.target.closest('button[data-panel]');
  if(tab)selectTab(tab);
 });

 tabs.addEventListener('keydown',event=>{
  if(!mobile.matches||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const buttons=items();
  const current=buttons.indexOf(document.activeElement);
  if(current<0)return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
   Math.min(buttons.length-1,Math.max(0,current+(event.key==='ArrowLeft'?-1:1)));
  buttons[next]?.focus({preventScroll:true});
  revealTab(buttons[next]);
 });

 mobileLogout?.addEventListener('click',()=>document.getElementById('adminLogout')?.click());

 function syncTab(){
  const active=tabs.querySelector('button[data-panel].active');
  if(active)selectTabWithoutPageMovement(active);
 }
 function selectTabWithoutPageMovement(tab){
  items().forEach(item=>{
   if(item===tab)item.setAttribute('aria-current','page');
   else item.removeAttribute('aria-current');
  });
  revealTab(tab,'instant');
 }
 mobile.addEventListener('change',syncTab);
 syncTab();
})();
