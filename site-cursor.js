/* Shared public-site contextual pointer. Never intercept input or clicks. */
(function(){
 'use strict';
 const root=document.documentElement;
 if(!document.body||!window.matchMedia||!window.PointerEvent||root.classList.contains('lvl-cursor-installed'))return;
 const capability=window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const forced=window.matchMedia('(forced-colors: active)');
 const enabled=()=>capability.matches&&!reduced.matches&&!forced.matches;
 const cursor=document.createElement('div');
 cursor.className='lvl-cursor';
 cursor.dataset.state='orbit';
 cursor.setAttribute('aria-hidden','true');
 cursor.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
 <defs>
  <g id="lvl-pointer-orbit"><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="1.6" fill="#eee5d3" stroke="#141310" stroke-width=".75"/></g>
  <g id="lvl-pointer-link"><circle cx="24" cy="24" r="15"/><path d="M19 29 29 19M22 19H29V26"/></g>
  <g id="lvl-pointer-drag"><circle cx="24" cy="24" r="15" stroke-dasharray="2.5 3.5"/><path d="M13 24H35M24 13V35M17 20 13 24 17 28M31 20 35 24 31 28M20 17 24 13 28 17M20 31 24 35 28 31"/></g>
 </defs>
 <g data-glyph="orbit" fill="none" stroke-linecap="round"><use href="#lvl-pointer-orbit" stroke="#141310" stroke-width="3.2"/><use href="#lvl-pointer-orbit" stroke="#eee5d3" stroke-width="1.35"/></g>
 <g data-glyph="link" fill="none" stroke-linecap="round" stroke-linejoin="round"><use href="#lvl-pointer-link" stroke="#141310" stroke-width="3.4"/><use href="#lvl-pointer-link" stroke="#eee5d3" stroke-width="1.5"/></g>
 <g data-glyph="record"><circle cx="24" cy="24" r="17" fill="#161513" stroke="#141310" stroke-width="3"/><circle cx="24" cy="24" r="17" fill="none" stroke="#eee5d3" stroke-width="1.4"/><g class="lvl-cursor-grooves" fill="none" stroke="#eee5d3" stroke-width=".65" opacity=".63"><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="14"/><path d="M24 10A14 14 0 0 1 38 24M24 35A11 11 0 0 1 13 24" stroke-width="1.6"/></g><circle cx="24" cy="24" r="5" fill="#eee5d3"/><circle cx="24" cy="24" r="1.4" fill="#161513"/></g>
 <g data-glyph="drag" fill="none" stroke-linecap="round" stroke-linejoin="round"><use href="#lvl-pointer-drag" stroke="#141310" stroke-width="3.3"/><use href="#lvl-pointer-drag" stroke="#eee5d3" stroke-width="1.35"/></g>
 </svg>`;
 document.body.appendChild(cursor);
 root.classList.add('lvl-cursor-installed');
 const nativeSelector='input,textarea,select,option,label,iframe,video,audio,canvas,[contenteditable]:not([contenteditable="false"]),dialog,[role="dialog"],[role="textbox"],[role="spinbutton"],[role="combobox"],[draggable="true"],#libraryArtworkOpen,.artwork-open,.artwork-dialog-stage,.deck-seek,#miniPlayerSeek,[aria-disabled="true"],:disabled,[inert]';
 const recordSelector='.sleeve,.ios-jacket,.record-card,.showcase-record-link,.sleeve-zone.is-ready';
 const interactiveSelector='a[href],button,summary,[role="button"],[role="link"],[data-listen],[data-detail]';
 const textSelector='p,h1,h2,h3,h4,h5,h6,blockquote,pre,code,li,dt,dd,span,strong,small,em,b,i';
 let pressed=false, drag=false, cursorTarget=null;
 const clearTarget=()=>{cursorTarget?.classList.remove('lvl-cursor-target');cursorTarget=null;};
 const hide=()=>{clearTarget();root.classList.remove('lvl-cursor-active');cursor.classList.remove('is-pressed');pressed=false;drag=false;};
 function stateFor(target){
  if(!(target instanceof Element)||target.closest(nativeSelector))return null;
  if(document.fullscreenElement||document.querySelector('dialog[open]'))return null;
  if(target.closest('.vinyl'))return 'drag';
  if(target.closest('[role="slider"],[role="scrollbar"]'))return null;
  if(target.closest(interactiveSelector)){
   if(target.closest(recordSelector))return 'record';
   return 'link';
  }
  if(target.closest(recordSelector))return 'record';
  if(target.closest('.deck-stage'))return 'drag';
  const text=target.closest(textSelector);
  if(text&&text.textContent.trim()&&getComputedStyle(text).userSelect!=='none')return null;
  return null;
 }
 function position(e){
  if(e.pointerType!=='mouse'||!enabled()){hide();return;}
  const state=drag?'drag':stateFor(e.target);
  if(!state||!(e.target instanceof Element)){hide();return;}
  if(cursorTarget!==e.target){clearTarget();cursorTarget=e.target;cursorTarget.classList.add('lvl-cursor-target');}
  cursor.dataset.state=state;
  cursor.style.transform='translate3d('+e.clientX+'px,'+e.clientY+'px,0)';
  cursor.classList.toggle('is-pressed',pressed);
  root.classList.add('lvl-cursor-active');
 }
 window.addEventListener('pointermove',position,{passive:true});
 window.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||!enabled()){hide();return;}
  if(e.button!==0)return;
  const state=stateFor(e.target);
  if(!state){hide();return;}
  pressed=true;drag=state==='drag';position(e);
 },{passive:true});
 window.addEventListener('pointerup',e=>{pressed=false;drag=false;position(e);},{passive:true});
 window.addEventListener('pointercancel',hide,{passive:true});
 window.addEventListener('pointerout',e=>{if(!e.relatedTarget||e.relatedTarget instanceof Element&&e.relatedTarget.closest('iframe'))hide();},{passive:true});
 window.addEventListener('blur',hide);
 window.addEventListener('pagehide',hide);
 document.addEventListener('visibilitychange',hide);
 document.addEventListener('fullscreenchange',hide);
 document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key==='Escape')hide();});
 [capability,reduced,forced].forEach(query=>{if(query.addEventListener)query.addEventListener('change',hide);else if(query.addListener)query.addListener(hide);});
})();
