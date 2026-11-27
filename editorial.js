(function(){
'use strict';
const data=window.SITE_CONTENT||{};
const page=document.body.dataset.page;
const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const visible=items=>(Array.isArray(items)?items:[]).filter(item=>item&&!item.hideFromPublic&&!['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(item.status||'').trim().toUpperCase()));
// Dates are optional: preserve the published order of undated archive entries.
function dateKey(value){
 const text=String(value||'').trim();
 const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text),local=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
 if(!iso&&!local)return null;
 const [year,month,day]=iso?iso.slice(1).map(Number):[Number(local[3]),Number(local[2]),Number(local[1])];
 const d=new Date(Date.UTC(year,month-1,day));
 return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?d.getTime():null;
}
function chronological(items){
 return items.map((item,index)=>({item,index,key:dateKey(item.date)})).sort((a,b)=>{
  if(a.key!==null&&b.key!==null)return b.key-a.key||a.index-b.index;
  if(a.key!==null)return -1;if(b.key!==null)return 1;return a.index-b.index;
 }).map(x=>x.item);
}
function dateLabel(value){const key=dateKey(value);return key===null?String(value||'').trim():new Intl.DateTimeFormat('es-EC',{dateStyle:'long',timeZone:'UTC'}).format(new Date(key));}
const sessions=visible(data.sessions);
const archive=visible(data.archiveItems);
const records=visible(data.records);

const url=value=>{if(!value||!String(value).trim())return '';try{const parsed=new URL(value,location.href);return ['http:','https:'].includes(parsed.protocol)?parsed.href:''}catch{return ''}};
const link=(href,label)=>'<a href="'+esc(href)+'">'+esc(label)+'</a>';
// Accept only known YouTube hosts and valid video IDs, not arbitrary iframe URLs.
function youtubeVideoId(value){
 const raw=String(value||'').trim();
 const valid=id=>/^[A-Za-z0-9_-]{11}$/.test(id||'')?id:'';
 if(valid(raw))return raw;
 try{
  const parsed=new URL(raw);
  if(!['https:','http:'].includes(parsed.protocol))return '';
  const host=parsed.hostname.toLowerCase();
  const parts=parsed.pathname.split('/').filter(Boolean);
  if(host==='youtu.be'||host==='www.youtu.be')return valid(parts[0]);
  if(!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))return '';
  if(parts[0]==='watch')return valid(parsed.searchParams.get('v'));
  if(['embed','shorts','live','v'].includes(parts[0]))return valid(parts[1]);
 }catch{}
 return '';
}
// Use the admin's published media URLs, never local demo placeholders.
function photoMarkup(item,kind){
 const image=item.media?.[kind]||{},source=url(image.url);
 if(!source)return '';
 const caption=String(image.caption||'').trim();
 const alt=String(image.alt||item.title||'').trim();
 return '<figure class="editorial-photo"><img src="'+esc(source)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async">'+(caption?'<figcaption>'+esc(caption)+'</figcaption>':'')+'</figure>';
}
function sessionMedia(item){
 const m=item.media||{};
 const audio=url(m.audio?.url||'');
 const video=url(m.video?.youtubeUrl||m.video?.url||item.youtubeUrl||'');
 const id=[m.video?.youtubeUrl,m.video?.url,item.youtubeUrl,m.video?.youtubeId].map(youtubeVideoId).find(Boolean);
 const player=id?'<div class="session-video"><iframe src="https://www.youtube-nocookie.com/embed/'+id+'" title="'+esc('Video: '+(item.title||'Sesión de La Vaca Loca'))+'" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe></div>':'';
 const photo=player?'':photoMarkup(item,'hero');
 const audioPlayer=audio?'<div class="session-audio"><span>Escuchar sesión</span><audio controls preload="none" src="'+esc(audio)+'">Tu navegador no permite reproducir audio.</audio></div>':'';
 const external=!id&&video?'<a class="editorial-action" href="'+esc(video)+'" target="_blank" rel="noopener noreferrer">Ver video</a>':'';
 const fallback=!player&&!audio&&!external?'<p class="availability">La grabación todavía no está disponible.</p>':'';
 return {markup:player+photo+audioPlayer,notes:external+fallback};
}
function related(item){
 const ids=Array.isArray(item.relatedRecords)?item.relatedRecords:[];
 const selected=records.filter(record=>ids.includes(record.id));
 return selected.length?'<aside class="editorial-related" aria-label="Discos relacionados"><h3>Discos relacionados</h3><ul>'+selected.map(r=>'<li>'+link('discos.html?disc='+encodeURIComponent(r.id),[r.artist,r.title].filter(Boolean).join(' — '))+'</li>').join('')+'</ul></aside>':'';
}
const designEmpty=new URLSearchParams(location.search).get('ui-preview')==='empty';
const entries=designEmpty?[]:chronological(page==='sessions'?sessions:archive);
const index=document.getElementById('pageIndex');
index.innerHTML=entries.map(item=>link('#'+encodeURIComponent(item.id),item.title)).join('');
index.hidden=entries.length<2;
document.getElementById('pageContent').innerHTML=entries.length?entries.map((item,index)=>{
 const isSession=page==='sessions';
 const date=dateLabel(item.date),type=String(isSession?item.type||'':item.category||'').trim();
 const meta=[type,isSession?item.artist:'',date].filter(Boolean).map(esc).join(' · ');
 const status=isSession&&item.status&&item.status!==item.date?'<span class="entry-status">'+esc(item.status)+'</span>':'';
 const description=item.detail?'<p class="entry-description">'+esc(item.detail)+'</p>':'';
 const associatedSession=sessions.find(s=>s.id===item.relatedSession);
 const session=isSession?sessionMedia(item):null;
 const visual=isSession?session.markup:photoMarkup(item,'image');
 const extras=isSession?session.notes+related(item):associatedSession?'<p class="entry-associated">'+link('sessions.html#'+encodeURIComponent(associatedSession.id),'Ver sesión: '+associatedSession.title)+'</p>':'';
 const title='<header class="entry-heading"><p class="entry-meta">'+meta+status+'</p><h2>'+esc(item.title)+'</h2></header>';
 return '<article class="entry '+(isSession?'session-entry':'archive-entry')+(visual?' has-editorial-media':'')+'" id="'+esc(item.id)+'"><div class="entry-number" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</div><div class="entry-body">'+title+(visual?'<div class="entry-visual">'+visual+'</div>':'')+'<div class="entry-story">'+description+extras+'</div></div></article>';
}).join(''):(()=>{
 const isSession=page==='sessions';
 const heading=isSession?'Las próximas sesiones están tomando forma.':'El archivo está en construcción.';
 const summary=isSession
  ?'Próximamente reuniremos aquí nuestras escuchas, invitados y grabaciones, con un espacio para cada encuentro.'
  :'Este espacio reunirá fotografías, carteles y recuerdos de la vida musical de La Vaca Loca.';
 const title=isSession?'SESSIONS / LA VACA LOCA':'MEMORIA VIVA / ARCHIVO';
 const next=isSession?'Explorar discos':'Explorar sesiones';
 const nextUrl=isSession?'discos.html':'sessions.html';
 const previewNote=designEmpty?'<p class="editorial-empty-preview">VISTA DE DISEÑO · SIN CONTENIDO</p>':'';
 return '<section class="editorial-empty" aria-labelledby="editorialEmptyTitle">'+
  '<div class="editorial-empty-art" aria-hidden="true"><span class="editorial-empty-art-label">'+title+'</span><span class="editorial-empty-symbol">LVL</span><span class="editorial-empty-art-caption">GUALACEO / ECUADOR</span></div>'+
  '<div class="editorial-empty-copy">'+previewNote+'<p class="editorial-empty-kicker">PRÓXIMAMENTE</p><h2 id="editorialEmptyTitle">'+heading+'</h2><p>'+summary+'</p>'+
  '<div class="editorial-empty-actions"><a href="'+nextUrl+(designEmpty?'?ui-preview=empty':'')+'">'+next+' <span aria-hidden="true">↗</span></a><a href="index.html'+(designEmpty?'?ui-preview=empty':'')+'">Volver al inicio</a></div></div></section>';
})();
if(location.hash){try{const item=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(item)item.scrollIntoView()}catch{}}
})();
