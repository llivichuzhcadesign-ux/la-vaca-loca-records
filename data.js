window.SITE_CONTENT = {
  settings: {
    brandName: 'La Vaca Loca Records',
    location: 'Gualaceo, Ecuador',
    whatsappNumber: '',
    whatsappText: 'Hola! Quiero hacer este pedido de La Vaca Loca Records:',
    orderFooter: 'Nombre:\nCiudad:\nEntrega o retiro:',
    pickupNotes: 'Retiro y entrega se confirman por WhatsApp.',
    deliveryNotes: 'Consulta disponibilidad de entrega según ciudad.',
    businessHours: 'Horario por confirmar',
    instagramUrl: '',
    currency: '$',
    storage: {
      imageProvider: 'local',
      audioProvider: 'local',
      imagesBasePath: 'assets/images',
      audioBasePath: 'assets/audio',
      cloudinaryBaseUrl: '',
      supabasePublicBaseUrl: '',
      youtubeChannelUrl: ''
    }
  },
  homepage: {
    hero: {
      title: 'SESSIONS',
      feature: 'La Vaca Loca Records',
      primaryEntry: 'ENTRAR A SESSIONS',
      secondaryEntry: '+ RECORD SHOP',
      libraryEntry: '+ ARCHIVO SESSIONS',
      media: {
        image: {source: 'local', path: 'assets/images/site/hero-store.jpg', url: '', alt: 'Interior de La Vaca Loca Records'}
      }
    },
    ticker: ['DISCOS','SESSIONS','GUALACEO','HI-FI','CULTURA','VINYL','ARCHIVO']
  },
  records: [
    {id:'LVL001',artist:'Night Drivers',title:'After Hours',genre:'House',price:28,stock:2,status:'IN STOCK',featured:true,featuredInPlayer:true,hideFromPublic:false,coverImage:'assets/images/records/lvl001-cover.jpg',audioPreview:'assets/audio/previews/lvl001-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl001-cover.jpg',url:'',alt:'Night Drivers - After Hours record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl001-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'After Hours preview'}},description:'Una selección nocturna para abrir la escucha y conectar con el sonido de la tienda.',condition:'VG+',label:'Independent',year:'2026'},
    {id:'LVL002',artist:'Circuit Saints',title:'Voltage',genre:'Techno',price:31,stock:1,status:'LAST COPY',featured:false,featuredInPlayer:true,hideFromPublic:false,coverImage:'assets/images/records/lvl002-cover.jpg',audioPreview:'assets/audio/previews/lvl002-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl002-cover.jpg',url:'',alt:'Circuit Saints - Voltage record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl002-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'Voltage preview'}},description:'Energía directa para pista, cabina y sesiones de alto voltaje.',condition:'NM',label:'Independent',year:'2026'},
    {id:'LVL003',artist:'Broken Signal',title:'Fragments',genre:'Breaks',price:26,stock:3,status:'IN STOCK',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'assets/images/records/lvl003-cover.jpg',audioPreview:'assets/audio/previews/lvl003-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl003-cover.jpg',url:'',alt:'Broken Signal - Fragments record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl003-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'Fragments preview'}},description:'Ritmos partidos, textura analógica y movimiento para digging profundo.',condition:'VG+',label:'Independent',year:'2025'},
    {id:'LVL004',artist:'Cloud Ritual',title:'Nocturne',genre:'Ambient',price:29,stock:0,status:'SOLD OUT',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'assets/images/records/lvl004-cover.jpg',audioPreview:'assets/audio/previews/lvl004-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl004-cover.jpg',url:'',alt:'Cloud Ritual - Nocturne record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl004-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'Nocturne preview'}},description:'Paisaje lento y atmosférico para sesiones de escucha tranquila.',condition:'NM',label:'Independent',year:'2025'},
    {id:'LVL005',artist:'Basement Heat',title:'Pressure',genre:'House',price:30,stock:2,status:'IN STOCK',featured:true,featuredInPlayer:true,hideFromPublic:false,coverImage:'assets/images/records/lvl005-cover.jpg',audioPreview:'assets/audio/previews/lvl005-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl005-cover.jpg',url:'',alt:'Basement Heat - Pressure record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl005-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'Pressure preview'}},description:'House cálido, físico y profundo para el sistema de la casa.',condition:'VG+',label:'Independent',year:'2026'},
    {id:'LVL006',artist:'Static Bloom',title:'Pulse',genre:'Techno',price:32,stock:1,status:'LAST COPY',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'assets/images/records/lvl006-cover.jpg',audioPreview:'assets/audio/previews/lvl006-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl006-cover.jpg',url:'',alt:'Static Bloom - Pulse record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl006-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'Pulse preview'}},description:'Pulsos densos, sintes tensos y sensación de cuarto oscuro.',condition:'NM',label:'Independent',year:'2026'},
    {id:'LVL007',artist:'Rupture Mode',title:'Cut Lines',genre:'Breaks',price:27,stock:2,status:'IN STOCK',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'assets/images/records/lvl007-cover.jpg',audioPreview:'assets/audio/previews/lvl007-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl007-cover.jpg',url:'',alt:'Rupture Mode - Cut Lines record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl007-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'Cut Lines preview'}},description:'Cortes rápidos, bajos secos y carácter de selector.',condition:'VG+',label:'Independent',year:'2025'},
    {id:'LVL008',artist:'Soft Current',title:'Drift',genre:'Ambient',price:25,stock:4,status:'IN STOCK',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'assets/images/records/lvl008-cover.jpg',audioPreview:'assets/audio/previews/lvl008-preview.mp3',audioType:'file',youtubeUrl:'',media:{artwork:{source:'local',path:'assets/images/records/lvl008-cover.jpg',url:'',alt:'Soft Current - Drift record cover'},audio:{sourceType:'file',path:'assets/audio/previews/lvl008-preview.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'Drift preview'}},description:'Corriente suave para bajar la velocidad y abrir espacio.',condition:'VG+',label:'Independent',year:'2025'}
  ],
  sessions: [
    {id:'S01',title:'Hi-Fi Listening Room',type:'Escucha guiada',date:'Próximamente',status:'Próximamente',featured:true,hideFromPublic:false,detail:'Selecciones profundas, sonido cálido y conversación alrededor del disco.',heroImage:'assets/images/sessions/s01-hero.jpg',audio:'',video:'',youtubeUrl:'',media:{hero:{source:'local',path:'assets/images/sessions/s01-hero.jpg',url:'',alt:'Hi-Fi Listening Room'},audio:{sourceType:'none',path:'',url:'',youtubeUrl:'',youtubeId:'',title:''},video:{sourceType:'youtube',path:'',url:'',youtubeUrl:'',youtubeId:'',title:'Hi-Fi Listening Room video'}},relatedRecords:['LVL001','LVL005']},
    {id:'S02',title:'Selectors de Gualaceo',type:'Invitados',date:'Archivo abierto',status:'En archivo',featured:false,hideFromPublic:false,detail:'DJs, coleccionistas y amigos compartiendo música desde la tienda.',heroImage:'assets/images/sessions/s02-hero.jpg',audio:'',video:'',youtubeUrl:'',media:{hero:{source:'local',path:'assets/images/sessions/s02-hero.jpg',url:'',alt:'Selectors de Gualaceo'},audio:{sourceType:'none',path:'',url:'',youtubeUrl:'',youtubeId:'',title:''},video:{sourceType:'youtube',path:'',url:'',youtubeUrl:'',youtubeId:'',title:'Selectors de Gualaceo video'}},relatedRecords:['LVL002','LVL003']},
    {id:'S03',title:'La Vaca Afterhours',type:'Set grabado',date:'En preparación',status:'En preparación',featured:false,hideFromPublic:false,detail:'Sesiones nocturnas para conectar la tienda con la escena local.',heroImage:'assets/images/sessions/s03-hero.jpg',audio:'',video:'',youtubeUrl:'',media:{hero:{source:'local',path:'assets/images/sessions/s03-hero.jpg',url:'',alt:'La Vaca Afterhours'},audio:{sourceType:'file',path:'assets/audio/sessions/s03-set.mp3',url:'',youtubeUrl:'',youtubeId:'',title:'La Vaca Afterhours audio'},video:{sourceType:'youtube',path:'',url:'',youtubeUrl:'',youtubeId:'',title:'La Vaca Afterhours video'}},relatedRecords:['LVL006','LVL007']}
  ],
  events: [
    {id:'E01',title:'Fiesta Caliente',date:'26.06.2026',place:'Cuenca',status:'Archivo',featured:true,hideFromPublic:false,posterImage:'assets/images/events/fiesta-caliente-poster.jpg',youtubeUrl:'',media:{poster:{source:'local',path:'assets/images/events/fiesta-caliente-poster.jpg',url:'',alt:'Fiesta Caliente poster'},video:{sourceType:'youtube',path:'',url:'',youtubeUrl:'',youtubeId:'',title:'Fiesta Caliente recap'}},detail:'Poster cultural, música y comunidad. El archivo de eventos crecerá desde aquí.'},
    {id:'E02',title:'Listening Weekend',date:'Próximo anuncio',place:'Gualaceo',status:'Próximamente',featured:false,hideFromPublic:false,posterImage:'assets/images/events/listening-weekend-poster.jpg',youtubeUrl:'',media:{poster:{source:'local',path:'assets/images/events/listening-weekend-poster.jpg',url:'',alt:'Listening Weekend poster'},video:{sourceType:'youtube',path:'',url:'',youtubeUrl:'',youtubeId:'',title:'Listening Weekend video'}},detail:'Entrada futura para sesiones de escucha, lanzamientos de discos e invitados.'}
  ],
  archiveItems: [
    {id:'A01',title:'La Casa',category:'Espacio / Hi-Fi',featured:true,hideFromPublic:false,image:'assets/images/archive/la-casa.jpg',media:{image:{source:'local',path:'assets/images/archive/la-casa.jpg',url:'',alt:'Interior, sistema, madera y plantas'}},detail:'Interior, sistema, madera, plantas y detalles de la tienda.',relatedSession:'',relatedEvent:''},
    {id:'A02',title:'Sessions',category:'Records / Cultura',featured:false,hideFromPublic:false,image:'assets/images/archive/sessions.jpg',media:{image:{source:'local',path:'assets/images/archive/sessions.jpg',url:'',alt:'Sessions y cultura de la tienda'}},detail:'Momentos de sets, invitados y conversaciones alrededor de la música.',relatedSession:'S01',relatedEvent:''},
    {id:'A03',title:'Posters',category:'Eventos / Memoria',featured:false,hideFromPublic:false,image:'assets/images/archive/posters.jpg',media:{image:{source:'local',path:'assets/images/archive/posters.jpg',url:'',alt:'Posters y flyers del archivo'}},detail:'Gráfica cultural, flyers y anuncios que construyen la identidad visual.',relatedSession:'',relatedEvent:'E01'}
  ]
};

(function setupMediaModel(){
  function youtubeId(value=''){
    const text=String(value||'').trim();
    if(!text)return '';
    const match=text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
    return match?match[1]:'';
  }
  function mediaUrl(entry={}){
    if(!entry)return '';
    if(entry.url)return entry.url;
    if(entry.path)return entry.path;
    if(entry.youtubeUrl)return entry.youtubeUrl;
    return '';
  }
  function normalizeAudio(item={}){
    const current=item.media&&item.media.audio?item.media.audio:{};
    const sourceType=item.audioType||current.sourceType||(item.youtubeUrl?'youtube':(item.audioPreview?'file':'none'));
    const youtubeUrl=item.youtubeUrl||current.youtubeUrl||'';
    const path=item.audioPreview||current.path||'';
    return Object.assign({sourceType,path,url:current.url||'',youtubeUrl,youtubeId:youtubeId(youtubeUrl),title:item.title||current.title||''},current,{sourceType,path,youtubeUrl,youtubeId:youtubeId(youtubeUrl)});
  }
  function normalizeContent(content){
    (content.records||[]).forEach(record=>{
      record.media=record.media||{};
      record.media.artwork=record.media.artwork||{source:'local',path:record.coverImage||'',url:'',alt:`${record.artist||''} ${record.title||''}`.trim()};
      record.media.audio=normalizeAudio(record);
      record.coverImage=mediaUrl(record.media.artwork)||record.coverImage||'';
      record.audioType=record.media.audio.sourceType||record.audioType||'none';
      record.audioPreview=record.media.audio.path||record.audioPreview||'';
      record.youtubeUrl=record.media.audio.youtubeUrl||record.youtubeUrl||'';
    });
    (content.sessions||[]).forEach(session=>{
      session.media=session.media||{};
      session.media.hero=session.media.hero||{source:'local',path:session.heroImage||'',url:'',alt:session.title||''};
      session.media.audio=session.media.audio||{sourceType:session.audio?'file':'none',path:session.audio||'',url:'',youtubeUrl:'',youtubeId:'',title:session.title||''};
      session.media.video=session.media.video||{sourceType:session.youtubeUrl?'youtube':'none',path:'',url:session.video||'',youtubeUrl:session.youtubeUrl||'',youtubeId:youtubeId(session.youtubeUrl),title:session.title||''};
      session.heroImage=mediaUrl(session.media.hero)||session.heroImage||'';
      session.audio=session.media.audio.path||session.audio||'';
      session.youtubeUrl=session.media.video.youtubeUrl||session.youtubeUrl||'';
    });
    (content.events||[]).forEach(event=>{
      event.media=event.media||{};
      event.media.poster=event.media.poster||{source:'local',path:event.posterImage||'',url:'',alt:event.title||''};
      event.media.video=event.media.video||{sourceType:event.youtubeUrl?'youtube':'none',path:'',url:'',youtubeUrl:event.youtubeUrl||'',youtubeId:youtubeId(event.youtubeUrl),title:event.title||''};
      event.posterImage=mediaUrl(event.media.poster)||event.posterImage||'';
      event.youtubeUrl=event.media.video.youtubeUrl||event.youtubeUrl||'';
    });
    (content.archiveItems||[]).forEach(item=>{
      item.media=item.media||{};
      item.media.image=item.media.image||{source:'local',path:item.image||'',url:'',alt:item.title||''};
      item.image=mediaUrl(item.media.image)||item.image||'';
    });
    return content;
  }
  window.LVL_MEDIA={youtubeId,mediaUrl,normalizeContent};
  window.SITE_CONTENT=normalizeContent(window.SITE_CONTENT||{});
})();

window.RECORDS = window.SITE_CONTENT.records;
window.SESSIONS = window.SITE_CONTENT.sessions;
window.EVENTS = window.SITE_CONTENT.events;
window.ARCHIVE_ITEMS = window.SITE_CONTENT.archiveItems;

(function setupWhatsAppRouting(){
  const settings=window.SITE_CONTENT&&window.SITE_CONTENT.settings?window.SITE_CONTENT.settings:{};
  const cleanNumber=String(settings.whatsappNumber||'').replace(/\D/g,'');
  const footer=String(settings.orderFooter||'').trim();
  function routedHref(currentHref){
    let text='';
    try{text=new URL(currentHref,window.location.href).searchParams.get('text')||''}catch{text=''}
    if(footer&&text&&!text.includes(footer))text=`${text}\n\n${footer}`;
    const base=cleanNumber?`https://wa.me/${cleanNumber}`:'https://wa.me/';
    return `${base}?text=${encodeURIComponent(text)}`;
  }
  function route(){
    const link=document.getElementById('whatsappCheckout');
    if(!link||!link.href)return;
    link.href=routedHref(link.href);
  }
  window.addEventListener('load',route);
  document.addEventListener('click',()=>setTimeout(route,0));
  setInterval(route,1000);
})();