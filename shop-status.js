(function(){
  const records=window.RECORDS||window.SITE_CONTENT?.records||[];
  const settings=window.SITE_CONTENT?.settings||{};

  function byId(id){return records.find(record=>record.id===id)}
  function cleanStatus(value=''){return String(value).trim().toUpperCase()}
  function money(value){return `${settings.currency||'$'}${value||0}`}
  function whatsappHref(message){
    const number=String(settings.whatsappNumber||'').replace(/\D/g,'');
    const base=number?`https://wa.me/${number}`:'https://wa.me/';
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  function actionFor(record){
    const status=cleanStatus(record.status);
    const stock=Number(record.stock||0);
    if(status==='SOLD OUT'||stock<=0)return {label:'ASK RESTOCK',mode:'inquiry',note:'Agotado · preguntar por restock'};
    if(status==='COMING SOON'||status==='DRAFT')return {label:'ASK ETA',mode:'inquiry',note:'Próximamente · preguntar fecha'};
    if(status==='RESERVED')return {label:'ASK STATUS',mode:'inquiry',note:'Reservado · consultar disponibilidad'};
    if(status==='LAST COPY'||stock===1)return {label:'+ BAG',mode:'cart',note:'Última copia'};
    return {label:'+ BAG',mode:'cart',note:`${stock} disponibles`};
  }
  function decorateCards(){
    document.querySelectorAll('.record-card[data-id]').forEach(card=>{
      const record=byId(card.dataset.id);
      if(!record)return;
      const status=cleanStatus(record.status);
      const action=actionFor(record);
      card.dataset.stockState=status.toLowerCase().replace(/\s+/g,'-');
      const add=card.querySelector('[data-add]');
      if(add){
        add.textContent=action.label;
        add.dataset.shopAction=action.mode;
        add.disabled=false;
        add.classList.toggle('inquiry-action',action.mode==='inquiry');
      }
      let note=card.querySelector('.record-shop-note');
      if(!note){
        note=document.createElement('div');
        note.className='record-shop-note';
        card.querySelector('.record-meta')?.insertBefore(note,card.querySelector('.record-actions'));
      }
      note.textContent=action.note;
      const badge=card.querySelector('.badge');
      if(badge)badge.textContent=record.status||'';
    });
  }
  function openInquiry(record){
    const message=`Hola! Quiero preguntar por este disco:\n\n${record.artist} — ${record.title}\n${record.id} / ${record.genre}\nStatus: ${record.status}\nPrecio: ${money(record.price)}\n\n¿Está disponible o puede conseguirse?`;
    window.open(whatsappHref(message),'_blank','noopener');
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-add][data-shop-action="inquiry"]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const card=button.closest('.record-card');
    const modalButton=button.closest('.modal-actions');
    const id=button.dataset.add||card?.dataset.id;
    const record=byId(id);
    if(record)openInquiry(record);
  },true);

  const style=document.createElement('style');
  style.textContent=`.record-shop-note{margin:10px 0 12px;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#6a5c4d}.record-card[data-stock-state="last-copy"] .record-shop-note{color:var(--pink)}.record-card[data-stock-state="sold-out"]{opacity:.76}.record-card[data-stock-state="sold-out"] .cover{filter:grayscale(.35)}.record-actions button.inquiry-action{background:var(--ink)!important;color:var(--paper)!important;border-color:var(--ink)!important}.record-actions button.inquiry-action:hover{background:var(--pink)!important;color:var(--ink)!important;border-color:var(--pink)!important}`;
  document.head.appendChild(style);

  decorateCards();
  const grid=document.getElementById('recordGrid');
  if(grid)new MutationObserver(decorateCards).observe(grid,{childList:true,subtree:true});
})();
