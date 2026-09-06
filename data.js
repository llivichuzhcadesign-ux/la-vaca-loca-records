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
    currency: '$'
  },
  homepage: {
    hero: {
      title: 'SESSIONS',
      feature: 'La Vaca Loca Records',
      primaryEntry: 'ENTRAR A SESSIONS',
      secondaryEntry: '+ RECORD SHOP',
      libraryEntry: '+ ARCHIVO SESSIONS'
    },
    ticker: [
      'DISCOS',
      'SESSIONS',
      'GUALACEO',
      'HI-FI',
      'CULTURA',
      'VINYL',
      'ARCHIVO'
    ]
  },
  records: [
    {id:'LVL001',artist:'Night Drivers',title:'After Hours',genre:'House',price:28,stock:2,status:'IN STOCK',featured:true,featuredInPlayer:true,hideFromPublic:false,coverImage:'',audioPreview:'',description:'Una selección nocturna para abrir la escucha y conectar con el sonido de la tienda.',condition:'VG+',label:'Independent',year:'2026'},
    {id:'LVL002',artist:'Circuit Saints',title:'Voltage',genre:'Techno',price:31,stock:1,status:'LAST COPY',featured:false,featuredInPlayer:true,hideFromPublic:false,coverImage:'',audioPreview:'',description:'Energía directa para pista, cabina y sesiones de alto voltaje.',condition:'NM',label:'Independent',year:'2026'},
    {id:'LVL003',artist:'Broken Signal',title:'Fragments',genre:'Breaks',price:26,stock:3,status:'IN STOCK',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'',audioPreview:'',description:'Ritmos partidos, textura analógica y movimiento para digging profundo.',condition:'VG+',label:'Independent',year:'2025'},
    {id:'LVL004',artist:'Cloud Ritual',title:'Nocturne',genre:'Ambient',price:29,stock:0,status:'SOLD OUT',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'',audioPreview:'',description:'Paisaje lento y atmosférico para sesiones de escucha tranquila.',condition:'NM',label:'Independent',year:'2025'},
    {id:'LVL005',artist:'Basement Heat',title:'Pressure',genre:'House',price:30,stock:2,status:'IN STOCK',featured:true,featuredInPlayer:true,hideFromPublic:false,coverImage:'',audioPreview:'',description:'House cálido, físico y profundo para el sistema de la casa.',condition:'VG+',label:'Independent',year:'2026'},
    {id:'LVL006',artist:'Static Bloom',title:'Pulse',genre:'Techno',price:32,stock:1,status:'LAST COPY',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'',audioPreview:'',description:'Pulsos densos, sintes tensos y sensación de cuarto oscuro.',condition:'NM',label:'Independent',year:'2026'},
    {id:'LVL007',artist:'Rupture Mode',title:'Cut Lines',genre:'Breaks',price:27,stock:2,status:'IN STOCK',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'',audioPreview:'',description:'Cortes rápidos, bajos secos y carácter de selector.',condition:'VG+',label:'Independent',year:'2025'},
    {id:'LVL008',artist:'Soft Current',title:'Drift',genre:'Ambient',price:25,stock:4,status:'IN STOCK',featured:false,featuredInPlayer:false,hideFromPublic:false,coverImage:'',audioPreview:'',description:'Corriente suave para bajar la velocidad y abrir espacio.',condition:'VG+',label:'Independent',year:'2025'}
  ],
  sessions: [
    {id:'S01',title:'Hi-Fi Listening Room',type:'Escucha guiada',date:'Próximamente',status:'Próximamente',featured:true,hideFromPublic:false,detail:'Selecciones profundas, sonido cálido y conversación alrededor del disco.',heroImage:'assets/images/archive-sign.jpg',audio:'',video:'',relatedRecords:['LVL001','LVL005']},
    {id:'S02',title:'Selectors de Gualaceo',type:'Invitados',date:'Archivo abierto',status:'En archivo',featured:false,hideFromPublic:false,detail:'DJs, coleccionistas y amigos compartiendo música desde la tienda.',heroImage:'assets/images/archive-sign.jpg',audio:'',video:'',relatedRecords:['LVL002','LVL003']},
    {id:'S03',title:'La Vaca Afterhours',type:'Set grabado',date:'En preparación',status:'En preparación',featured:false,hideFromPublic:false,detail:'Sesiones nocturnas para conectar la tienda con la escena local.',heroImage:'assets/images/archive-sign.jpg',audio:'',video:'',relatedRecords:['LVL006','LVL007']}
  ],
  events: [
    {id:'E01',title:'Fiesta Caliente',date:'26.06.2026',place:'Cuenca',status:'Archivo',featured:true,hideFromPublic:false,posterImage:'',detail:'Poster cultural, música y comunidad. El archivo de eventos crecerá desde aquí.'},
    {id:'E02',title:'Listening Weekend',date:'Próximo anuncio',place:'Gualaceo',status:'Próximamente',featured:false,hideFromPublic:false,posterImage:'',detail:'Entrada futura para sesiones de escucha, lanzamientos de discos e invitados.'}
  ],
  archiveItems: [
    {id:'A01',title:'La Casa',category:'Espacio / Hi-Fi',featured:true,hideFromPublic:false,image:'assets/images/hero-store-hq.jpg',detail:'Interior, sistema, madera, plantas y detalles de la tienda.',relatedSession:'',relatedEvent:''},
    {id:'A02',title:'Sessions',category:'Records / Cultura',featured:false,hideFromPublic:false,image:'assets/images/archive-sign.jpg',detail:'Momentos de sets, invitados y conversaciones alrededor de la música.',relatedSession:'S01',relatedEvent:''},
    {id:'A03',title:'Posters',category:'Eventos / Memoria',featured:false,hideFromPublic:false,image:'',detail:'Gráfica cultural, flyers y anuncios que construyen la identidad visual.',relatedSession:'',relatedEvent:'E01'}
  ]
};

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
