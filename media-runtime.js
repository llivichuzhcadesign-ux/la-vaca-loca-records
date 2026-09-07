(function(){
  const content=window.SITE_CONTENT||{};
  const records=window.RECORDS||content.records||[];
  const sessions=window.SESSIONS||content.sessions||[];
  const events=window.EVENTS||content.events||[];
  const archiveItems=window.ARCHIVE_ITEMS||content.archiveItems||[];

  function escapeText(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
  function mediaUrl(item,legacyKey,mediaKey){return item&&((item.media&&item.media[mediaKey]&&item.media[mediaKey].url)||item[legacyKey]||'')}
  function byId(list,id){return (list||[]).find(item=>item.id===id)}
  function isYoutube(url=''){return /youtu\.be|youtube\.com/.test(String(url))}
  function youtubeId(url=''){
    try{
      const parsed=new URL(url,window.location.href);
      if(parsed.hostname.includes('youtu.be'))return parsed.pathname.replace('/','');
      return parsed.searchParams.get('v')||parsed.pathname.split('/').filter(Boolean).pop()||'';
    }catch{return ''}
  }
  function embedUrl(url=''){const id=youtubeId(url);return id?`https://www.youtube.com/embed/${id}`:''}

  function decorateRecordImages(){
    document.querySelectorAll('.record-card[data-id]').forEach(card=>{
      const record=byId(records,card.dataset.id);
      const url=mediaUrl(record,'coverImage','artwork');
      const cover=card.querySelector('.cover');
      if(!url||!cover||cover.querySelector('.record-cover-image'))return;
      cover.classList.add('has-cover-image');
      cover.insertAdjacentHTML('afterbegin',`<img class="record-cover-image" src="${escapeText(url)}" alt="${escapeText(record.artist||'Record')} ${escapeText(record.title||'cover')}" loading="lazy">`);
    });
  }
  function decorateModalImage(recordId){
    const record=byId(records,recordId);
    const url=mediaUrl(record,'coverImage','artwork');
    const cover=document.querySelector('.record-modal.open .modal-cover');
    if(!cover)return;
    if(url){
      cover.classList.add('has-cover-image');
      cover.innerHTML=`<img src="${escapeText(url)}" alt="${escapeText(record.artist||'Record')} ${escapeText(record.title||'cover')}">`;
    }else{
      cover.classList.remove('has-cover-image');
    }
  }
  function decorateSessionMedia(){
    const featured=sessions.find(item=>item.featured)||sessions[0];
    const url=mediaUrl(featured,'heroImage','hero');
    const section=document.querySelector('.sessions-photo');
    if(url&&section)section.style.backgroundImage=`linear-gradient(90deg,rgba(9,9,7,.28),transparent 28%),url('${url}')`;
  }
  function decorateEventsMedia(){
    document.querySelectorAll('.event-card[data-event]').forEach(card=>{
      const event=byId(events,card.dataset.event);
      const poster=mediaUrl(event,'posterImage','poster');
      const video=event&&(event.video||(event.media&&event.media.video&&event.media.video.url));
      if(poster){card.classList.add('has-event-poster');card.style.backgroundImage=`linear-gradient(0deg,rgba(9,9,7,.72),rgba(9,9,7,.12)),url('${poster}')`}
      if(video&&isYoutube(video)&&!card.querySelector('.youtube-link'))card.insertAdjacentHTML('beforeend',`<a class="youtube-link" href="${escapeText(video)}" target="_blank" rel="noopener">VER VIDEO</a>`);
    });
  }
  function decorateArchiveMedia(){
    document.querySelectorAll('.archive-index-card').forEach((card,index)=>{
      const item=archiveItems[index];
      const url=mediaUrl(item,'image','image');
      if(url){card.classList.add('has-archive-image');card.style.backgroundImage=`linear-gradient(0deg,rgba(9,9,7,.82),rgba(9,9,7,.32)),url('${url}')`}
    });
  }
  function decoratePlayer(record){
    const art=document.getElementById('playerArt');
    const url=mediaUrl(record,'coverImage','artwork');
    if(!art)return;
    if(url){art.classList.add('has-cover-image');art.innerHTML=`<img src="${escapeText(url)}" alt="${escapeText(record.artist||'Record')} cover">`}
    else{art.classList.remove('has-cover-image');art.innerHTML='<span></span>'}
  }
  function decorateAll(){decorateRecordImages();decorateSessionMedia();decorateEventsMedia();decorateArchiveMedia()}

  let lastRecordId='';
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-detail],[data-listen],.record-card[data-id]');
    if(target)lastRecordId=target.dataset.detail||target.dataset.listen||target.dataset.id||lastRecordId;
    setTimeout(()=>{decorateAll();if(lastRecordId)decorateModalImage(lastRecordId);const current=byId(records,lastRecordId);if(current)decoratePlayer(current)},30);
  },true);
  document.addEventListener('keydown',event=>{const card=event.target.closest&&event.target.closest('.record-card[data-id]');if(card&&(event.key==='Enter'||event.key===' ')){lastRecordId=card.dataset.id;setTimeout(()=>decorateModalImage(lastRecordId),30)}});

  const style=document.createElement('style');
  style.textContent=`.cover.has-cover-image{position:relative;background:#090907;overflow:hidden}.record-cover-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}.cover.has-cover-image .badge,.cover.has-cover-image .cover-code{position:relative;z-index:2}.cover.has-cover-image:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(9,9,7,.58),transparent 48%);z-index:1}.modal-cover.has-cover-image{padding:0;background:#090907}.modal-cover.has-cover-image img{width:100%;height:100%;min-height:420px;object-fit:cover}.player-art.has-cover-image{overflow:hidden}.player-art.has-cover-image img{width:100%;height:100%;object-fit:cover;display:block}.event-card.has-event-poster{background-size:cover;background-position:center;color:var(--paper)}.event-card.has-event-poster a{position:relative;z-index:2}.youtube-link{margin-left:8px}.archive-index-card.has-archive-image{background-size:cover;background-position:center}.archive-index-card.has-archive-image>*{position:relative;z-index:2}`;
  document.head.appendChild(style);
  decorateAll();
})();
