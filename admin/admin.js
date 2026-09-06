const STORAGE_KEY='lvl-admin-draft-v1';
const original=window.SITE_CONTENT||{};
let draft=loadDraft();

function clone(value){return JSON.parse(JSON.stringify(value||{}))}
function loadDraft(){
  try{return clone(JSON.parse(localStorage.getItem(STORAGE_KEY))||original)}catch{return clone(original)}
}
function saveDraft(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));
  refreshAll();
}
function resetDraft(){
  localStorage.removeItem(STORAGE_KEY);
  draft=clone(original);
  refreshAll();
}
function byId(id){return document.getElementById(id)}
function escapeText(value=''){return String(value).replace(/[&<>'\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','\"':'&quot;'}[char]))}
function setValue(path,value){
  const parts=path.split('.');
  let target=draft;
  while(parts.length>1)target=target[parts.shift()];
  target[parts[0]]=value;
}
function field(path,label,value,type='text',hint=''){
  const tag=type==='textarea'?'textarea':'input';
  const attr=tag==='input'?`type="${type}" value="${escapeText(value??'')}"`:'';
  const body=tag==='textarea'?`${escapeText(value??'')}`:'';
  return `<div class="field ${type==='textarea'?'full':''}"><label>${label}</label><${tag} ${attr} data-path="${path}">${body}</${tag}>${hint?`<small>${hint}</small>`:''}</div>`;
}
function card(collection,index,title,subtitle,status,fields){
  return `<details class="editor-card"><summary><div class="summary-title"><strong>${escapeText(title)}</strong><small>${escapeText(subtitle)}</small></div><span class="summary-status">${escapeText(status||'draft')}</span></summary><div class="field-grid">${fields}</div><div class="card-actions"><button class="admin-action" data-save-draft>Save draft</button><button class="admin-action danger" data-remove="${collection}.${index}">Remove</button></div></details>`;
}
function renderStats(){
  const records=draft.records||[];
  const sessions=draft.sessions||[];
  const events=draft.events||[];
  const archive=draft.archiveItems||[];
  byId('stats').innerHTML=[
    ['Records',records.length],
    ['Sessions',sessions.length],
    ['Events',events.length],
    ['Archive items',archive.length]
  ].map(([label,value])=>`<article class="stat-card"><strong>${value}</strong><span>${label}</span></article>`).join('');
}
function renderRecords(){
  const list=draft.records||[];
  byId('recordsList').innerHTML=list.length?list.map((r,i)=>card('records',i,r.artist||'Untitled record',`${r.id||'NO ID'} / ${r.genre||'Genre'}`,r.status,[
    field(`records.${i}.id`,'ID',r.id),field(`records.${i}.artist`,'Artist',r.artist),field(`records.${i}.title`,'Title',r.title),field(`records.${i}.genre`,'Genre',r.genre),field(`records.${i}.price`,'Price',r.price,'number'),field(`records.${i}.stock`,'Stock',r.stock,'number'),field(`records.${i}.status`,'Status',r.status),field(`records.${i}.condition`,'Condition',r.condition),field(`records.${i}.label`,'Label',r.label),field(`records.${i}.year`,'Year',r.year),field(`records.${i}.coverImage`,'Cover image path',r.coverImage),field(`records.${i}.audioPreview`,'Audio preview path',r.audioPreview),field(`records.${i}.description`,'Description',r.description,'textarea')
  ])).join(''):'<div class="empty">No records yet.</div>';
}
function renderSessions(){
  const list=draft.sessions||[];
  byId('sessionsList').innerHTML=list.length?list.map((s,i)=>card('sessions',i,s.title||'Untitled session',`${s.id||'NO ID'} / ${s.type||'Type'}`,s.status,[
    field(`sessions.${i}.id`,'ID',s.id),field(`sessions.${i}.title`,'Title',s.title),field(`sessions.${i}.type`,'Type',s.type),field(`sessions.${i}.date`,'Date',s.date),field(`sessions.${i}.status`,'Status',s.status),field(`sessions.${i}.heroImage`,'Hero image path',s.heroImage),field(`sessions.${i}.audio`,'Audio path',s.audio),field(`sessions.${i}.video`,'Video path',s.video),field(`sessions.${i}.detail`,'Description',s.detail,'textarea')
  ])).join(''):'<div class="empty">No sessions yet.</div>';
}
function renderEvents(){
  const list=draft.events||[];
  byId('eventsList').innerHTML=list.length?list.map((e,i)=>card('events',i,e.title||'Untitled event',`${e.date||'Date'} / ${e.place||'Place'}`,e.status,[
    field(`events.${i}.id`,'ID',e.id),field(`events.${i}.title`,'Title',e.title),field(`events.${i}.date`,'Date',e.date),field(`events.${i}.place`,'Place',e.place),field(`events.${i}.status`,'Status',e.status),field(`events.${i}.posterImage`,'Poster image path',e.posterImage),field(`events.${i}.detail`,'Description',e.detail,'textarea')
  ])).join(''):'<div class="empty">No events yet.</div>';
}
function renderArchive(){
  const list=draft.archiveItems||[];
  byId('archiveList').innerHTML=list.length?list.map((a,i)=>card('archiveItems',i,a.title||'Untitled archive item',`${a.id||'NO ID'} / ${a.category||'Category'}`,a.relatedSession||a.relatedEvent||'archive',[
    field(`archiveItems.${i}.id`,'ID',a.id),field(`archiveItems.${i}.title`,'Title',a.title),field(`archiveItems.${i}.category`,'Category',a.category),field(`archiveItems.${i}.image`,'Image path',a.image),field(`archiveItems.${i}.relatedSession`,'Related session',a.relatedSession),field(`archiveItems.${i}.relatedEvent`,'Related event',a.relatedEvent),field(`archiveItems.${i}.detail`,'Description',a.detail,'textarea')
  ])).join(''):'<div class="empty">No archive items yet.</div>';
}
function renderSettings(){
  draft.settings=draft.settings||{};
  const s=draft.settings;
  const clean=String(s.whatsappNumber||'').replace(/\D/g,'');
  const preview=clean?`https://wa.me/${clean}`:'Waiting for number';
  byId('settingsForm').innerHTML=`
    <div class="settings-note"><strong>WhatsApp routing</strong><span>${preview}</span><p>Use country code and number only. Ecuador example: 593999999999. USA example: 19175551212.</p></div>
    <div class="field-grid">
      ${field('settings.brandName','Brand name',s.brandName)}
      ${field('settings.location','Location',s.location)}
      ${field('settings.currency','Currency',s.currency)}
      ${field('settings.whatsappNumber','WhatsApp number',s.whatsappNumber,'tel','Country code + number, no plus sign needed.')}
      ${field('settings.instagramUrl','Instagram link',s.instagramUrl,'url')}
      ${field('settings.businessHours','Business hours',s.businessHours)}
      ${field('settings.pickupNotes','Pickup notes',s.pickupNotes,'textarea')}
      ${field('settings.deliveryNotes','Delivery notes',s.deliveryNotes,'textarea')}
      ${field('settings.whatsappText','WhatsApp intro',s.whatsappText,'textarea')}
      ${field('settings.orderFooter','Order message footer',s.orderFooter,'textarea','Customer fields added after the bag total.')}
    </div>
    <div class="card-actions"><button class="admin-action" data-save-draft>Save draft</button></div>`;
}
function renderExport(){byId('jsonOutput').value=JSON.stringify(draft,null,2)}
function refreshAll(){renderStats();renderRecords();renderSessions();renderEvents();renderArchive();renderSettings();renderExport()}

function addItem(type){
  const templates={
    records:{id:`LVL${String((draft.records||[]).length+1).padStart(3,'0')}`,artist:'New Artist',title:'New Release',genre:'House',price:0,stock:1,status:'DRAFT',coverImage:'',audioPreview:'',description:'',condition:'',label:'',year:''},
    sessions:{id:`S${String((draft.sessions||[]).length+1).padStart(2,'0')}`,title:'New Session',type:'Escucha',date:'Próximamente',status:'Draft',detail:'',heroImage:'',audio:'',video:'',relatedRecords:[]},
    events:{id:`E${String((draft.events||[]).length+1).padStart(2,'0')}`,title:'New Event',date:'Próximamente',place:'Gualaceo',status:'Draft',posterImage:'',detail:''},
    archiveItems:{id:`A${String((draft.archiveItems||[]).length+1).padStart(2,'0')}`,title:'New Archive Item',category:'Archive',image:'',detail:'',relatedSession:'',relatedEvent:''}
  };
  draft[type]=draft[type]||[];
  draft[type].push(templates[type]);
  saveDraft();
}

document.addEventListener('input',e=>{
  const input=e.target.closest('[data-path]');
  if(!input)return;
  const value=input.type==='number'?Number(input.value):input.value;
  setValue(input.dataset.path,value);
  renderExport();
});
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-panel]');
  if(nav){document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));nav.classList.add('active');document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===nav.dataset.panel));return}
  if(e.target.closest('[data-save-draft]')){saveDraft();return}
  if(e.target.closest('[data-reset-draft]')){resetDraft();return}
  if(e.target.closest('[data-refresh-json]')){renderExport();return}
  if(e.target.closest('[data-add-record]')){addItem('records');return}
  if(e.target.closest('[data-add-session]')){addItem('sessions');return}
  if(e.target.closest('[data-add-event]')){addItem('events');return}
  if(e.target.closest('[data-add-archive]')){addItem('archiveItems');return}
  const remove=e.target.closest('[data-remove]');
  if(remove){const [collection,index]=remove.dataset.remove.split('.');draft[collection].splice(Number(index),1);saveDraft()}
});
refreshAll();
