window.SITE_CONTENT = {
  settings: {
    brandName: 'La Vaca Loca Records',
    location: 'Gualaceo, Ecuador',
    whatsappText: 'Hola! Quiero hacer este pedido de La Vaca Loca Records:',
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
    {id:'LVL001',artist:'Night Drivers',title:'After Hours',genre:'House',price:28,stock:2,status:'IN STOCK',coverImage:'',audioPreview:'',description:'Una selección nocturna para abrir la escucha y conectar con el sonido de la tienda.',condition:'VG+',label:'Independent',year:'2026'},
    {id:'LVL002',artist:'Circuit Saints',title:'Voltage',genre:'Techno',price:31,stock:1,status:'LAST COPY',coverImage:'',audioPreview:'',description:'Energía directa para pista, cabina y sesiones de alto voltaje.',condition:'NM',label:'Independent',year:'2026'},
    {id:'LVL003',artist:'Broken Signal',title:'Fragments',genre:'Breaks',price:26,stock:3,status:'IN STOCK',coverImage:'',audioPreview:'',description:'Ritmos partidos, textura analógica y movimiento para digging profundo.',condition:'VG+',label:'Independent',year:'2025'},
    {id:'LVL004',artist:'Cloud Ritual',title:'Nocturne',genre:'Ambient',price:29,stock:0,status:'SOLD OUT',coverImage:'',audioPreview:'',description:'Paisaje lento y atmosférico para sesiones de escucha tranquila.',condition:'NM',label:'Independent',year:'2025'},
    {id:'LVL005',artist:'Basement Heat',title:'Pressure',genre:'House',price:30,stock:2,status:'IN STOCK',coverImage:'',audioPreview:'',description:'House cálido, físico y profundo para el sistema de la casa.',condition:'VG+',label:'Independent',year:'2026'},
    {id:'LVL006',artist:'Static Bloom',title:'Pulse',genre:'Techno',price:32,stock:1,status:'LAST COPY',coverImage:'',audioPreview:'',description:'Pulsos densos, sintes tensos y sensación de cuarto oscuro.',condition:'NM',label:'Independent',year:'2026'},
    {id:'LVL007',artist:'Rupture Mode',title:'Cut Lines',genre:'Breaks',price:27,stock:2,status:'IN STOCK',coverImage:'',audioPreview:'',description:'Cortes rápidos, bajos secos y carácter de selector.',condition:'VG+',label:'Independent',year:'2025'},
    {id:'LVL008',artist:'Soft Current',title:'Drift',genre:'Ambient',price:25,stock:4,status:'IN STOCK',coverImage:'',audioPreview:'',description:'Corriente suave para bajar la velocidad y abrir espacio.',condition:'VG+',label:'Independent',year:'2025'}
  ],
  sessions: [
    {id:'S01',title:'Hi-Fi Listening Room',type:'Escucha guiada',date:'Próximamente',status:'Próximamente',detail:'Selecciones profundas, sonido cálido y conversación alrededor del disco.',heroImage:'assets/images/archive-sign.jpg',audio:'',video:'',relatedRecords:['LVL001','LVL005']},
    {id:'S02',title:'Selectors de Gualaceo',type:'Invitados',date:'Archivo abierto',status:'En archivo',detail:'DJs, coleccionistas y amigos compartiendo música desde la tienda.',heroImage:'assets/images/archive-sign.jpg',audio:'',video:'',relatedRecords:['LVL002','LVL003']},
    {id:'S03',title:'La Vaca Afterhours',type:'Set grabado',date:'En preparación',status:'En preparación',detail:'Sesiones nocturnas para conectar la tienda con la escena local.',heroImage:'assets/images/archive-sign.jpg',audio:'',video:'',relatedRecords:['LVL006','LVL007']}
  ],
  events: [
    {id:'E01',title:'Fiesta Caliente',date:'26.06.2026',place:'Cuenca',status:'Archivo',posterImage:'',detail:'Poster cultural, música y comunidad. El archivo de eventos crecerá desde aquí.'},
    {id:'E02',title:'Listening Weekend',date:'Próximo anuncio',place:'Gualaceo',status:'Próximamente',posterImage:'',detail:'Entrada futura para sesiones de escucha, lanzamientos de discos e invitados.'}
  ],
  archiveItems: [
    {id:'A01',title:'La Casa',category:'Espacio / Hi-Fi',image:'assets/images/hero-store-hq.jpg',detail:'Interior, sistema, madera, plantas y detalles de la tienda.',relatedSession:'',relatedEvent:''},
    {id:'A02',title:'Sessions',category:'Records / Cultura',image:'assets/images/archive-sign.jpg',detail:'Momentos de sets, invitados y conversaciones alrededor de la música.',relatedSession:'S01',relatedEvent:''},
    {id:'A03',title:'Posters',category:'Eventos / Memoria',image:'',detail:'Gráfica cultural, flyers y anuncios que construyen la identidad visual.',relatedSession:'',relatedEvent:'E01'}
  ]
};

window.RECORDS = window.SITE_CONTENT.records;
window.SESSIONS = window.SITE_CONTENT.sessions;
window.EVENTS = window.SITE_CONTENT.events;
window.ARCHIVE_ITEMS = window.SITE_CONTENT.archiveItems;

(function applyIOSCheckoutSafeArea(){
  const style=document.createElement('style');
  style.textContent=`
    :root{--player-safe-height:calc(84px + env(safe-area-inset-bottom,0px))}
    body{padding-bottom:var(--player-safe-height)!important}
    .player{height:var(--player-safe-height)!important;min-height:var(--player-safe-height)!important;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;z-index:160!important}
    .cart-panel{z-index:150!important;height:100dvh!important;max-height:100dvh!important;padding-bottom:calc(var(--player-safe-height) + 18px)!important}
    .cart-items{min-height:0;padding-bottom:14px!important}
    .cart-footer{position:sticky!important;bottom:0!important;background:var(--paper)!important;padding-top:14px!important;padding-bottom:calc(var(--player-safe-height) + 14px)!important;border-top:1px solid rgba(9,9,7,.16);z-index:3!important}
    .cart-footer .primary,.cart-footer .full,#whatsappCheckout{display:flex!important;align-items:center!important;justify-content:center!important;min-height:48px!important;width:100%!important;position:relative!important;z-index:4!important}
    .scrim{z-index:120!important}
    .record-modal{padding-bottom:calc(var(--player-safe-height) + 24px)!important}
    @media(max-width:560px){:root{--player-safe-height:calc(92px + env(safe-area-inset-bottom,0px))}.cart-panel{padding:18px 16px calc(var(--player-safe-height) + 20px)!important}.cart-footer{padding-bottom:calc(var(--player-safe-height) + 16px)!important}.player{grid-template-columns:auto 42px 1fr!important}}
  `;
  document.head.appendChild(style);
})();