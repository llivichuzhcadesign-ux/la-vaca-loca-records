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
      const action=actionFor(record);
      card.dataset.stockState=cleanStatus(record.status).toLowerCase().replace(/\s+/g,'-');
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
  function removeBuySection(){
    document.querySelectorAll('#how,.how-section,.buying-section').forEach(section=>section.remove());
    document.querySelectorAll('.main-nav a,.site-footer a').forEach(link=>{
      const href=link.getAttribute('href')||'';
      const label=(link.textContent||'').trim().toUpperCase();
      if(href==='#how'||href==='#buying'||label==='COMPRAR'||label==='CÓMO COMPRAR'||label==='COMO COMPRAR')link.remove();
    });
  }
  function enhanceBag(){
    const panel=document.getElementById('cartPanel');
    if(!panel)return;
    panel.classList.add('bag-experience');
    const head=panel.querySelector('.cart-head');
    if(head&&!head.querySelector('.bag-subtitle')){
      head.insertAdjacentHTML('beforeend','<p class="bag-subtitle">Revisa tu selección y envía el pedido directo por WhatsApp.</p>');
    }
    const footer=panel.querySelector('.cart-footer');
    if(footer&&!footer.querySelector('.bag-checklist')){
      footer.insertAdjacentHTML('afterbegin','<div class="bag-checklist"><span>Stock se confirma por mensaje</span><span>Retiro / entrega se coordina después</span><span>Pago no automático todavía</span></div>');
    }
    const checkout=document.getElementById('whatsappCheckout');
    if(checkout)checkout.textContent='ENVIAR BAG POR WHATSAPP';
  }
  function openInquiry(record){
    const message=`Hola! Quiero preguntar por este disco:\n\n${record.artist} — ${record.title}\n${record.id} / ${record.genre}\nStatus: ${record.status}\nPrecio: ${money(record.price)}\n\n¿Está disponible o puede conseguirse?`;
    window.open(whatsappHref(message),'_blank','noopener');
  }
  function runClean(){
    removeBuySection();
    enhanceBag();
    decorateCards();
    decorateModal();
  }

  document.addEventListener('click',event=>{
    const inquiryButton=event.target.closest('[data-add][data-shop-action="inquiry"]');
    if(inquiryButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      const card=inquiryButton.closest('.record-card');
      const id=inquiryButton.dataset.add||card?.dataset.id;
      const record=byId(id);
      if(record)openInquiry(record);
      return;
    }
    setTimeout(decorateModal,40);
  },true);

  const style=document.createElement('style');
  style.textContent=`.record-shop-note,.modal-stock-note{margin:10px 0 12px;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#6a5c4d}.record-card[data-stock-state="last-copy"] .record-shop-note,.modal-stock-note{color:var(--pink)}.record-card[data-stock-state="sold-out"]{opacity:.76}.record-card[data-stock-state="sold-out"] .cover{filter:grayscale(.35)}.record-actions button.inquiry-action,.modal-actions button.inquiry-action{background:var(--ink)!important;color:var(--paper)!important;border-color:var(--ink)!important}.record-actions button.inquiry-action:hover,.modal-actions button.inquiry-action:hover{background:var(--pink)!important;color:var(--ink)!important;border-color:var(--pink)!important}.bag-experience{box-shadow:-20px 0 50px rgba(9,9,7,.18)}.bag-subtitle{width:100%;margin:8px 0 0;color:#6a5c4d;font-size:11px;line-height:1.35;font-weight:800}.bag-checklist{display:grid;gap:7px;margin-bottom:14px;padding:12px;border:1px solid rgba(9,9,7,.16);background:rgba(255,90,167,.07)}.bag-checklist span{font-size:10px;font-weight:900;letter-spacing:.02em;text-transform:uppercase;color:#4c4036}.bag-checklist span:before{content:'• ';color:var(--pink);font-size:14px}.cart-footer .primary.full{font-size:12px;letter-spacing:.03em}`;
  document.head.appendChild(style);

  runClean();
  setTimeout(runClean,80);
  setTimeout(runClean,400);
})();
