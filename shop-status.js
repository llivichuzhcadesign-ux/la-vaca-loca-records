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
  function applyAction(button,record){
    if(!button||!record)return;
    const action=actionFor(record);
    button.textContent=action.label;
    button.dataset.shopAction=action.mode;
    button.disabled=false;
    button.classList.toggle('inquiry-action',action.mode==='inquiry');
  }
  function decorateCards(){
    document.querySelectorAll('.record-card[data-id]').forEach(card=>{
      const record=byId(card.dataset.id);
      if(!record)return;
      const status=cleanStatus(record.status);
      const action=actionFor(record);
      card.dataset.stockState=status.toLowerCase().replace(/\s+/g,'-');
      applyAction(card.querySelector('[data-add]'),record);
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
  function decorateModal(){
    const modal=document.querySelector('.record-modal.open');
    const button=modal&&modal.querySelector('.modal-actions [data-add]');
    if(!button)return;
    const record=byId(button.dataset.add);
    if(!record)return;
    applyAction(button,record);
    let note=modal.querySelector('.modal-stock-note');
    if(!note){
      note=document.createElement('p');
      note.className='modal-stock-note';
      modal.querySelector('.modal-actions')?.insertAdjacentElement('beforebegin',note);
    }
    note.textContent=actionFor(record).note;
  }
  function decorateAll(){decorateCards();decorateModal()}
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
    const id=button.dataset.add||card?.dataset.id;
    const record=byId(id);
    if(record)openInquiry(record);
  },true);

  const style=document.createElement('style');
  style.textContent=`.record-shop-note,.modal-stock-note{margin:10px 0 12px;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#6a5c4d}.record-card[data-stock-state="last-copy"] .record-shop-note,.modal-stock-note{color:var(--pink)}.record-card[data-stock-state="sold-out"]{opacity:.76}.record-card[data-stock-state="sold-out"] .cover{filter:grayscale(.35)}.record-actions button.inquiry-action,.modal-actions button.inquiry-action{background:var(--ink)!important;color:var(--paper)!important;border-color:var(--ink)!important}.record-actions button.inquiry-action:hover,.modal-actions button.inquiry-action:hover{background:var(--pink)!important;color:var(--ink)!important;border-color:var(--pink)!important}`;
  document.head.appendChild(style);

  decorateAll();
  const grid=document.getElementById('recordGrid');
  if(grid)new MutationObserver(decorateCards).observe(grid,{childList:true,subtree:true});
  const modalObserver=new MutationObserver(decorateModal);
  modalObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
