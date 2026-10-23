const STORAGE_KEY='lvl-admin-draft-v1';
const original=window.SITE_CONTENT||{};
let draft=loadDraft();
const MEDIA_DB_NAME='lvl-admin-media-v1';
const MEDIA_STORE='files';

const heroPreviewUrls=new Map();
let cloudState={available:false,mediaBinding:false,publishedContent:false,publishedAt:null,authenticated:false,role:''};
let liveSnapshot=null;
let publishBusy=false;
let publishError=false;
let editRevision=0;
let cloudChecked=false;
let publishPhase='publishing';
let publishSuccessUntil=0;
let publishSuccessTimer=null;
let diffCacheRevision=-1;
let diffCacheLive=null;
let diffCacheValue=true;
function hasUnpublishedChanges(){
 if(liveSnapshot===null)return true;
 if(diffCacheRevision!==editRevision||diffCacheLive!==liveSnapshot){
  diffCacheValue=contentSnapshot(publishableDraft())!==liveSnapshot;
  diffCacheRevision=editRevision;
  diffCacheLive=liveSnapshot;
 }
 return diffCacheValue;
}
function updatePublishHistory(animate=false){
 const tab=byId('publishHistory'),time=byId('publishHistoryTime');
 if(!tab||!time)return;
 const date=cloudState.publishedAt?new Date(cloudState.publishedAt):null;
 if(!date||!Number.isFinite(date.getTime())){tab.hidden=true;return}
 const readable=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(date);
 const full=new Intl.DateTimeFormat(undefined,{dateStyle:'full',timeStyle:'long'}).format(date);
 time.dateTime=date.toISOString();
 time.textContent=readable;
 tab.title='Last published: '+full;
 tab.hidden=false;
 if(animate){
  tab.classList.remove('just-published');
  void tab.offsetWidth;
  tab.classList.add('just-published');
 }
}
function resetPublishFill(){
 const fill=byId('publishFill');
 if(fill){fill.style.animation='';fill.style.width=''}
}
async function completePublishFill(){
 const fill=byId('publishFill'),button=byId('publishButton');
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!fill||!button||reduced)return;
 const width=button.getBoundingClientRect().width;
 const current=width?Math.min(90,Math.max(3,fill.getBoundingClientRect().width/width*100)):3;
 fill.style.animation='none';
 fill.style.width=current+'%';
 publishPhase='finishing';
 updatePublishStatus();
 void fill.offsetWidth;
 fill.style.width='100%';
 await new Promise(resolve=>setTimeout(resolve,360));
}
function showPublishSuccess(){
 clearTimeout(publishSuccessTimer);
 publishSuccessUntil=Date.now()+1600;
 publishSuccessTimer=setTimeout(()=>{publishSuccessUntil=0;updatePublishStatus()},1600);
 updatePublishHistory(true);
}

function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
function contentSnapshot(content){return JSON.stringify(canonical(content))}
function calendarDefaults(){draft.settings=draft.settings||{};const c=CalendarContent.artwork(original.settings);draft.settings.calendar={image:c.image,imageAlt:c.alt,showTitle:c.showTitle,...(draft.settings.calendar||{})};}
function homepageDefaults(){
  draft.homepage=draft.homepage||{};
  const published=clone(original.homepage?.hero||{});
  const hero=draft.homepage.hero=draft.homepage.hero||published;
  hero.kicker=hero.kicker||published.kicker||'LA VACA LOCA RECORDS · GUALACEO, ECUADOR';
  hero.title=hero.title||published.title||'LVL';
  hero.tagline=hero.tagline||published.tagline||'Discos, sonido, sesiones y cultura.';
  hero.primaryLabel=hero.primaryLabel||published.primaryLabel||'EXPLORAR DISCOS';
  hero.primaryHref=hero.primaryHref||published.primaryHref||'discos.html';
  hero.secondaryLabel=hero.secondaryLabel||published.secondaryLabel||'SESSIONS';
  hero.secondaryHref=hero.secondaryHref||published.secondaryHref||'sessions.html';
  hero.intervalSeconds=Number(hero.intervalSeconds||published.intervalSeconds||6);
  hero.slides=Array.isArray(hero.slides)&&hero.slides.length?hero.slides:clone(published.slides||[]);
}
calendarDefaults();
homepageDefaults();
let dirty=false;
let lastSavedAt=localStorage.getItem(`${STORAGE_KEY}-saved-at`)||'';

const STATUS_OPTIONS={
  records:['DRAFT','IN STOCK','LAST COPY','SOLD OUT','COMING SOON','RESERVED','PRIVATE LISTING'],
  sessions:['Draft','Próximamente','En archivo','En preparación','Live','Hidden'],
  events:['Draft','Próximamente','Archivo','Live','Cancelled','Hidden']
};

function clone(value){return JSON.parse(JSON.stringify(value||{}))}
function loadDraft(){try{return clone(JSON.parse(localStorage.getItem(STORAGE_KEY))||original)}catch{return clone(original)}}
function byId(id){return document.getElementById(id)}
function escapeText(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function getValue(path){return path.split('.').reduce((obj,key)=>obj&&obj[key],draft)}
function setValue(path,value){const parts=path.split('.');let target=draft;while(parts.length>1){const key=parts.shift();target[key]=target[key]||{};target=target[key]}target[parts[0]]=value;markDirty()}
let publishStatusUpdateTimer=0;
function schedulePublishStatus(){
 if(publishStatusUpdateTimer)return;
 publishStatusUpdateTimer=setTimeout(()=>{publishStatusUpdateTimer=0;updatePublishStatus()},120);
}
function markDirty(){dirty=true;editRevision++;publishError=false;schedulePublishStatus()}
function showToast(message){const toast=byId('adminToast');if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),1800)}
function cloudAdminKey(){return cloudState.authenticated?'session':''}
function cloudScope(path='site'){const root=String(path).split('.')[0]||'site';if(root==='homepage')return'hero';if(root==='records')return'records';if(root==='sessions')return'sessions';if(root==='events')return'events';if(root==='archiveItems')return'archive';return'site'}
async function readCloudResponse(response){let data={};try{data=await response.json()}catch{}if(!response.ok)throw new Error(data.error||`Cloudflare request failed (${response.status})`);return data}
function updateCloudUi(){
 const pill=byId('cloudStatus'),hint=byId('cloudSetupHint');
 let label='Connecting',message='Checking the Cloudflare connection…';
 if(!cloudState.available){label='Cloudflare unavailable';message='Open the admin on your Cloudflare Pages domain.'}
 else if(!cloudState.mediaBinding){label='R2 binding needed';message='Bind the R2 bucket as MEDIA in Cloudflare Pages.'}
 else if(cloudState.authenticated){label='Cloudflare connected';message='Signed in securely. Publishing and media uploads are available.'}
 else{label='Login required';message='Your session has expired. Sign in again.'}
 if(pill){pill.textContent=label;pill.classList.toggle('cloud-ok',cloudState.authenticated)}
 if(hint)hint.textContent=message;
 updatePublishStatus();
}
async function checkCloudStatus(){
 try{
  const [status,me]=await Promise.all([fetch('../api/status',{cache:'no-store'}),fetch('../api/auth/me',{cache:'no-store'})]);
  if(!status.ok)throw Error('status unavailable');
  const data=await status.json();
  const user=me.ok?await me.json():null;
  cloudState={...cloudState,available:!!data.cloudflare,mediaBinding:!!data.mediaBinding,publishedContent:!!data.publishedContent,authenticated:me.ok,role:user?.role||''};
  if(!me.ok){location.replace('login.html');return}
  if(cloudState.mediaBinding){
   const live=await fetch('../api/admin/content',{cache:'no-store'});
   if(live.ok){
    const result=await live.json();
    cloudState.publishedContent=!!result.content;
    cloudState.publishedAt=result.publishedAt||null;
    liveSnapshot=result.content?contentSnapshot(result.content):null;
   }else{liveSnapshot=null}
  }
 }catch{cloudState={...cloudState,available:false,authenticated:false};liveSnapshot=null}
 cloudChecked=true;
 diffCacheRevision=-1;
 updatePublishHistory();
 updateCloudUi();
}
async function uploadOriginalToCloudflare(file,scope='site'){
  const key=cloudAdminKey();
  if(!key)throw new Error('Connect Cloudflare publishing first.');
  const form=new FormData();form.append('file',file,file.name);form.append('scope',scope);
  const response=await fetch('../api/admin/media',{method:'POST',body:form});
  return readCloudResponse(response);
}
async function publishCloudContent(){
 if(publishBusy)return;
 if(!cloudState.authenticated||!cloudState.mediaBinding){showToast('Cloudflare is not connected. Check your session and R2 binding.');return}
 if(cloudState.role==='editor'){showToast('Editors cannot publish live content.');return}
 syncMediaAliases();
 const payload=publishableDraft();
 const snapshot=contentSnapshot(payload);
 const revisionAtStart=editRevision;
 publishBusy=true;publishError=false;publishPhase='publishing';
 publishSuccessUntil=0;clearTimeout(publishSuccessTimer);
 resetPublishFill();
 updatePublishStatus();
 try{
  const response=await fetch('../api/admin/content',{
   method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify(payload)
  });
  const data=await readCloudResponse(response);
  // The server confirmed the R2 write; only now can the fill finish.
  liveSnapshot=snapshot;
  diffCacheRevision=-1;
  cloudState.publishedContent=true;
  cloudState.publishedAt=data.publishedAt||null;
  if(editRevision===revisionAtStart){
   dirty=false;lastSavedAt=new Date().toLocaleString();
   try{localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));localStorage.setItem(`${STORAGE_KEY}-saved-at`,lastSavedAt)}catch{}
  }
  await completePublishFill();
  publishBusy=false;
  resetPublishFill();
  showPublishSuccess();
  updateCloudUi();
  showToast('Published successfully');
  return data;
 }catch(error){
  publishError=true;
  resetPublishFill();
  showToast(error.message||'Publish failed');
 }finally{
  publishBusy=false;
  updateCloudUi();
 }
}
function syncMediaAliases(){
  (draft.records||[]).forEach(r=>{r.media=r.media||{};r.media.artwork={...(r.media.artwork||{}),type:'image',provider:r.coverImage&&r.coverImage.startsWith('data:')?'browser-draft':((r.media.artwork||{}).provider||'local'),url:r.coverImage||((r.media.artwork||{}).url||''),alt:(r.media.artwork||{}).alt||`${r.artist||'Record'} — ${r.title||'cover'}`};r.media.audio={...(r.media.audio||{}),type:(r.media.audio||{}).type||'file',provider:(r.media.audio||{}).provider||'local',url:r.audioPreview||((r.media.audio||{}).url||'')}});
  (draft.sessions||[]).forEach(s=>{s.media=s.media||{};s.media.hero={...(s.media.hero||{}),type:'image',provider:s.heroImage&&s.heroImage.startsWith('data:')?'browser-draft':((s.media.hero||{}).provider||'local'),url:s.heroImage||((s.media.hero||{}).url||''),alt:(s.media.hero||{}).alt||`${s.title||'Session'} image`};s.media.audio={...(s.media.audio||{}),type:(s.media.audio||{}).type||'file',provider:(s.media.audio||{}).provider||'local',url:s.audio||((s.media.audio||{}).url||'')};s.media.video={...(s.media.video||{}),type:(s.media.video||{}).type||'youtube',provider:(s.media.video||{}).provider||'youtube',url:s.video||((s.media.video||{}).url||'')}});
  (draft.events||[]).forEach(ev=>{ev.media=ev.media||{};ev.media.poster={...(ev.media.poster||{}),type:'image',provider:ev.posterImage&&ev.posterImage.startsWith('data:')?'browser-draft':((ev.media.poster||{}).provider||'local'),url:ev.posterImage||((ev.media.poster||{}).url||''),alt:(ev.media.poster||{}).alt||`${ev.title||'Event'} poster`};ev.media.video={...(ev.media.video||{}),type:(ev.media.video||{}).type||'youtube',provider:(ev.media.video||{}).provider||'youtube',url:ev.video||((ev.media.video||{}).url||'')}});
  (draft.archiveItems||[]).forEach(a=>{a.media=a.media||{};a.media.image={...(a.media.image||{}),type:'image',provider:a.image&&a.image.startsWith('data:')?'browser-draft':((a.media.image||{}).provider||'local'),url:a.image||((a.media.image||{}).url||''),alt:(a.media.image||{}).alt||`${a.title||'Archive'} image`}});
}
function saveDraft(refreshEditors=true){
 syncMediaAliases();
 try{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));
  lastSavedAt=new Date().toLocaleString();
  localStorage.setItem(`${STORAGE_KEY}-saved-at`,lastSavedAt);
 }catch{
  showToast('Browser storage is full. Download data.js to keep your edits, or use a smaller image.');
  return false;
 }
 dirty=false;
 diffCacheRevision=-1;
 // Manual saves and previews keep existing desktop/mobile inputs, cursor and open cards intact.
 // Structural edits (new/deleted/reordered items or media uploads) can request a full refresh.
 if(refreshEditors)refreshAll();
 else renderExport();
 showToast('Draft saved');
 return true;
}
function resetDraft(){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(`${STORAGE_KEY}-saved-at`);draft=clone(original);calendarDefaults();homepageDefaults();lastSavedAt='';dirty=false;refreshAll();showToast('Local draft reset')}
function field(path,label,value,type='text',hint=''){
  const tag=type==='textarea'?'textarea':'input';
  const attr=tag==='input'?`type="${type}" value="${escapeText(value??'')}"`:'';
  const body=tag==='textarea'?`${escapeText(value??'')}`:'';
  return `<div class="field ${type==='textarea'?'full':''}"><label for="${escapeText(path)}">${label}</label><${tag} id="${escapeText(path)}" ${attr} data-path="${path}">${body}</${tag}>${hint?`<small>${hint}</small>`:''}</div>`;
}
function mediaField(path,label,value,hint=''){
  const safe=escapeText(value||'');
  const previewSrc=escapeText(CalendarContent.imageUrl(value,new URL('../',document.baseURI)));
  const preview=value?`<div class="media-preview has-image"><img src="${previewSrc}" alt="${escapeText(label)} preview" onerror="this.parentElement.classList.add('broken')"></div>`:`<div class="media-preview"><span>No image yet</span></div>`;
  return `<div class="field media-field full" data-media-field="${escapeText(path)}"><label>${label}</label><div class="media-row">${preview}<div class="media-controls"><label class="upload-button">From files<input type="file" accept="image/*" data-upload-path="${escapeText(path)}"></label><button class="admin-action secondary" type="button" data-gallery-path="${escapeText(path)}">From gallery</button><button class="admin-action secondary" type="button" data-clear-media="${escapeText(path)}">Remove image</button><small>${hint||'Choose the original file. When Cloudflare publishing is connected, it uploads unchanged to private R2 storage.'}</small><details class="advanced-media"><summary>Advanced URL/path</summary><input type="text" value="${safe}" data-path="${escapeText(path)}" placeholder="assets/images/example.jpg or https://..."><button class="admin-action secondary" type="button" data-copy-path="${escapeText(path)}">Copy path</button></details></div></div></div>`;
}
function openMediaDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(MEDIA_DB_NAME,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(MEDIA_STORE))db.createObjectStore(MEDIA_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Could not open local media storage'))})}
async function putOriginalFile(key,file){const db=await openMediaDb();return new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).put(file,key);tx.oncomplete=()=>{db.close();resolve(key)};tx.onerror=()=>{db.close();reject(tx.error||new Error('Could not save original image'))}})}
async function getOriginalFile(key){if(!key)return null;const db=await openMediaDb();return new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,'readonly');const request=tx.objectStore(MEDIA_STORE).get(key);request.onsuccess=()=>{db.close();resolve(request.result||null)};request.onerror=()=>{db.close();reject(request.error||new Error('Could not load original image'))}})}
async function deleteOriginalFile(key){if(!key)return;const db=await openMediaDb();return new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).delete(key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error||new Error('Could not remove original image'))}})}
function humanBytes(bytes=0){const n=Number(bytes)||0;if(n<1024)return `${n} B`;if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;return `${(n/1024/1024).toFixed(2)} MB`}
async function hydrateHeroPreviews(){
  const hero=draft.homepage?.hero;
  if(!hero)return;
  for(const img of document.querySelectorAll('[data-hero-preview-index]')){
    const index=Number(img.dataset.heroPreviewIndex);
    const slide=hero.slides?.[index];
    if(!slide||!slide.draftBlobKey)continue;
    try{
      const blob=await getOriginalFile(slide.draftBlobKey);
      if(!blob)continue;
      const old=heroPreviewUrls.get(slide.draftBlobKey);if(old)URL.revokeObjectURL(old);
      const url=URL.createObjectURL(blob);heroPreviewUrls.set(slide.draftBlobKey,url);img.src=url;
    }catch(error){console.warn('Hero draft image could not load',error)}
  }
}
function heroSlideCard(slide,index,total){
  const published=slide.src?CalendarContent.imageUrl(slide.src,new URL('../',document.baseURI)):'';
  const fileNote=slide.draftBlobKey?`Original draft: ${escapeText(slide.fileName||'image')} · ${humanBytes(slide.originalBytes)} · unchanged`:'Using published image/path';
  return `<article class="hero-admin-card">
    <div class="hero-admin-preview">${published?`<img data-hero-preview-index="${index}" src="${escapeText(published)}" alt="${escapeText(slide.alt||'Hero image')}" style="object-position:${escapeText(slide.position||'center center')}">`:`<img data-hero-preview-index="${index}" alt="${escapeText(slide.alt||'Hero image')}" style="object-position:${escapeText(slide.position||'center center')}">`}</div>
    <div class="hero-admin-fields">
      <div class="hero-admin-top"><strong>IMAGE ${String(index+1).padStart(2,'0')}</strong><span>${fileNote}</span></div>
      <button class="admin-action secondary" type="button" data-gallery-path="homepage.hero.slides.${index}.src">From gallery</button><label class="upload-button hero-upload">From files<input type="file" accept="image/*" data-hero-upload="${index}"></label>
      <div class="field-grid">
        ${field(`homepage.hero.slides.${index}.alt`,'Image description',slide.alt||'')}
        ${field(`homepage.hero.slides.${index}.position`,'Crop position',slide.position||'center center','text','CSS object position, e.g. center 48% or 40% center.')}
        ${field(`homepage.hero.slides.${index}.src`,'Published path / URL',slide.src||'','text','Used by the live site after permanent storage/publishing is connected.')}
      </div>
      <div class="hero-order-actions">
        <button class="admin-action secondary" type="button" data-hero-move="${index}" data-direction="-1" ${index===0?'disabled':''}>Move up</button>
        <button class="admin-action secondary" type="button" data-hero-move="${index}" data-direction="1" ${index===total-1?'disabled':''}>Move down</button>
        ${slide.draftBlobKey?`<button class="admin-action secondary" type="button" data-hero-clear-draft="${index}">Clear draft upload</button>`:''}
        <button class="admin-action danger" type="button" data-hero-remove="${index}">Remove slide</button>
      </div>
    </div>
  </article>`;
}
function renderHomepage(){
  homepageDefaults();
  const h=draft.homepage.hero;
  const root=byId('homepageHeroEditor');if(!root)return;
  root.innerHTML=`<div class="form-card hero-copy-card"><h3>Hero text</h3><div class="field-grid">
    ${field('homepage.hero.kicker','Kicker',h.kicker)}
    ${field('homepage.hero.title','Main mark',h.title)}
    ${field('homepage.hero.tagline','Tagline',h.tagline)}
    ${field('homepage.hero.intervalSeconds','Seconds per image',h.intervalSeconds,'number','Recommended: 5–8 seconds.')}
    ${field('homepage.hero.primaryLabel','Primary button',h.primaryLabel)}
    ${field('homepage.hero.primaryHref','Primary link',h.primaryHref)}
    ${field('homepage.hero.secondaryLabel','Secondary button',h.secondaryLabel)}
    ${field('homepage.hero.secondaryHref','Secondary link',h.secondaryHref)}
  </div></div>
  <div class="hero-admin-list">${(h.slides||[]).map((slide,index)=>heroSlideCard(slide,index,h.slides.length)).join('')||'<div class="empty">No hero images yet. Add an image to begin.</div>'}</div>
  <div class="card-actions"><button class="admin-action" data-save-draft>Save draft</button><a class="admin-action secondary" href="../index.html?preview=admin-draft" target="_blank" rel="noopener">Preview homepage</a></div>`;
  requestAnimationFrame(hydrateHeroPreviews);
}
async function handleHeroUpload(input){
  const file=input.files&&input.files[0];if(!file)return;
  if(!file.type.startsWith('image/')){showToast('Please choose an image file');return}
  homepageDefaults();
  const index=Number(input.dataset.heroUpload);const slide=draft.homepage.hero.slides[index];if(!slide)return;
  try{
    if(cloudAdminKey()){
      showToast('Uploading original to Cloudflare…');
      const uploaded=await uploadOriginalToCloudflare(file,'hero');
      if(slide.draftBlobKey){try{await deleteOriginalFile(slide.draftBlobKey)}catch{}}
      slide.src=uploaded.url;slide.draftBlobKey='';slide.fileName=file.name;slide.mimeType=file.type;slide.originalBytes=file.size;
      markDirty();saveDraft();showToast('Original uploaded unchanged to Cloudflare');
      return;
    }
    showToast('Saving original image locally…');
    if(slide.draftBlobKey)await deleteOriginalFile(slide.draftBlobKey);
    const key=`hero-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await putOriginalFile(key,file);
    slide.draftBlobKey=key;slide.fileName=file.name;slide.mimeType=file.type;slide.originalBytes=file.size;
    markDirty();saveDraft();showToast('Original saved locally; connect Cloudflare to publish it');
  }catch(error){showToast(error.message||'Image upload failed')}
}
async function clearHeroDraft(index){
  const slide=draft.homepage?.hero?.slides?.[index];if(!slide)return;
  if(slide.draftBlobKey){try{await deleteOriginalFile(slide.draftBlobKey)}catch{}}
  delete slide.draftBlobKey;delete slide.fileName;delete slide.mimeType;delete slide.originalBytes;markDirty();saveDraft();showToast('Draft upload cleared');
}
function addHeroSlide(){homepageDefaults();draft.homepage.hero.slides.push({id:`hero-${Date.now()}`,src:'',alt:'',position:'center center',draftBlobKey:''});markDirty();saveDraft()}
async function removeHeroSlide(index){homepageDefaults();const slide=draft.homepage.hero.slides[index];if(!slide)return;if(slide.draftBlobKey){try{await deleteOriginalFile(slide.draftBlobKey)}catch{}}draft.homepage.hero.slides.splice(index,1);markDirty();saveDraft()}
function moveHeroSlide(index,direction){homepageDefaults();const next=index+direction;if(next<0||next>=draft.homepage.hero.slides.length)return;[draft.homepage.hero.slides[index],draft.homepage.hero.slides[next]]=[draft.homepage.hero.slides[next],draft.homepage.hero.slides[index]];markDirty();saveDraft()}
function selectField(path,label,value,options){return `<div class="field"><label>${label}</label><select data-path="${path}">${options.map(option=>`<option value="${escapeText(option)}" ${option===value?'selected':''}>${escapeText(option)}</option>`).join('')}</select></div>`}
function visibilityField(path,hidden,collection,status){
 const blocked=collection==='records'&&['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(status||'').toUpperCase());
 const hint=blocked?'This record is also excluded by its catalog status. Change that status before showing it publicly.':'Changes appear on the public site after Publish Live.';
 return `<div class="field visibility-field"><label>Website visibility</label><select data-visibility-path="${escapeText(path)}" aria-label="Website visibility"><option value="visible" ${!hidden?'selected':''}>Visible on website</option><option value="hidden" ${hidden?'selected':''}>Hidden from website</option></select><small>${hint}</small></div>`;
}
function toggleField(path,label,value,hint=''){return `<div class="field toggle-field"><label>${label}</label><button type="button" class="toggle ${value?'on':''}" data-toggle-path="${path}" aria-pressed="${value?'true':'false'}"><span>${value?'ON':'OFF'}</span></button>${hint?`<small>${hint}</small>`:''}</div>`}
function card(collection,index,title,subtitle,status,fields,item={}){const state=item.hideFromPublic?'Hidden':(collection==='records'&&['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(status||'').toUpperCase())?'Unlisted by status':'Visible after publishing');const feature=item.featured?' · Featured':'';return `<details class="editor-card"><summary><div class="summary-title"><strong>${escapeText(title)}</strong><small>${escapeText(subtitle)}</small></div><span class="summary-status">${escapeText(status||'Draft')} · ${state}${feature}</span></summary><div class="field-grid">${fields}</div><div class="card-actions"><button class="admin-action" data-save-draft>Save draft</button><button class="admin-action danger" data-remove="${collection}.${index}">Remove</button></div></details>`}
function visibleCount(list=[],collection=''){return list.filter(item=>!item.hideFromPublic&&(collection!=='records'||!['DRAFT','PRIVATE LISTING','HIDDEN'].includes(String(item.status||'').toUpperCase()))).length}
function mediaUrl(item,legacyKey,mediaKey){return item?.[legacyKey]||item?.media?.[mediaKey]?.url||''}
function counts(){
  const records=draft.records||[],sessions=draft.sessions||[],events=draft.events||[],archive=draft.archiveItems||[];
  const media=[...records.map(r=>mediaUrl(r,'coverImage','artwork')),...sessions.map(s=>mediaUrl(s,'heroImage','hero')),...events.map(e=>mediaUrl(e,'posterImage','poster')),...archive.map(a=>mediaUrl(a,'image','image'))].filter(Boolean).length;
  const hidden=[...records,...sessions,...events,...archive].filter(item=>item.hideFromPublic).length;
  return {records,sessions,events,archive,media,hidden};
}
function renderStats(){const c=counts();byId('stats').innerHTML=[['Records',`${visibleCount(c.records,'records')} / ${c.records.length}`],['Sessions',`${visibleCount(c.sessions)} / ${c.sessions.length}`],['Events',`${visibleCount(c.events)} / ${c.events.length}`],['Images used',c.media]].map(([label,value])=>`<article class="stat-card"><strong>${value}</strong><span>${label}</span></article>`).join('')}
function renderRecords(){const list=draft.records||[];byId('recordsList').innerHTML=list.length?list.map((r,i)=>card('records',i,r.artist||'Untitled record',`${r.id||'NO ID'} / ${r.genre||'Genre'}`,r.status,[field(`records.${i}.id`,'ID',r.id),field(`records.${i}.artist`,'Artist',r.artist),field(`records.${i}.title`,'Title',r.title),field(`records.${i}.genre`,'Genre',r.genre),field(`records.${i}.price`,'Price',r.price,'number'),field(`records.${i}.stock`,'Stock',r.stock,'number'),selectField(`records.${i}.status`,'Status',r.status,STATUS_OPTIONS.records),toggleField(`records.${i}.featured`,'Featured',!!r.featured,'Use for homepage or highlighted store sections later.'),toggleField(`records.${i}.featuredInPlayer`,'Featured in player',!!r.featuredInPlayer,'Can be used for random/player recommendations.'),visibilityField(`records.${i}.hideFromPublic`,!!r.hideFromPublic,'records',r.status),field(`records.${i}.condition`,'Condition',r.condition),field(`records.${i}.label`,'Label',r.label),field(`records.${i}.year`,'Year',r.year),mediaField(`records.${i}.coverImage`,'Artwork',mediaUrl(r,'coverImage','artwork'),'Upload or replace the record cover from files/camera roll.'),field(`records.${i}.audioPreview`,'Audio preview',r.audioPreview||r.media?.audio?.url||'','text','Upload an original MP3/M4A below or paste an existing audio URL.'),field(`records.${i}.description`,'Description',r.description,'textarea')].join(''),r)).join(''):'<div class="empty">No records yet.</div>'}
function renderSessions(){const list=draft.sessions||[];byId('sessionsList').innerHTML=list.length?list.map((s,i)=>card('sessions',i,s.title||'Untitled session',`${s.id||'NO ID'} / ${s.type||'Type'}`,s.status,[field(`sessions.${i}.id`,'ID',s.id),field(`sessions.${i}.title`,'Title',s.title),field(`sessions.${i}.type`,'Type',s.type),field(`sessions.${i}.date`,'Date',s.date),selectField(`sessions.${i}.status`,'Status',s.status,STATUS_OPTIONS.sessions),toggleField(`sessions.${i}.featured`,'Featured',!!s.featured),visibilityField(`sessions.${i}.hideFromPublic`,!!s.hideFromPublic,'sessions',s.status),mediaField(`sessions.${i}.heroImage`,'Session image',mediaUrl(s,'heroImage','hero'),'Upload the main session photo from files/camera roll.'),field(`sessions.${i}.audio`,'Session audio',s.audio||s.media?.audio?.url||'','text','Upload audio below, or use the video field for long-form YouTube sessions.'),field(`sessions.${i}.video`,'YouTube / video link',s.video||s.media?.video?.url||'','url','Paste a YouTube link for sessions, interviews, or long sets.'),field(`sessions.${i}.relatedRecords`,'Related records',Array.isArray(s.relatedRecords)?s.relatedRecords.join(', '):s.relatedRecords,'text','Comma-separated record IDs.'),field(`sessions.${i}.detail`,'Description',s.detail,'textarea')].join(''),s)).join(''):'<div class="empty">No sessions yet.</div>'}
function renderCalendarSettings(){const c=draft.settings.calendar;byId('calendarSettings').innerHTML='<h3>Calendar artwork</h3><div class="field-grid">'+mediaField('settings.calendar.image','Featured calendar image',c.image,'Replace the pin-up with your own image. Landscape 3:2 recommended; keep the left side clear for the title. Upload is included in the data.js export.')+field('settings.calendar.imageAlt','Image description',c.imageAlt)+toggleField('settings.calendar.showTitle','Show text over artwork',c.showTitle!==false,'Turn off if your image already contains text.')+'</div><div class="card-actions"><button class="admin-action" data-save-draft>Save draft</button></div>';}
function renderEvents(){const list=draft.events||[];byId('eventsList').innerHTML=list.length?list.map((ev,i)=>card('events',i,ev.title||'Untitled event',`${ev.date||'Date'} / ${ev.place||'Place'}`,ev.status,[field(`events.${i}.id`,'ID',ev.id),field(`events.${i}.title`,'Title',ev.title),field(`events.${i}.date`,'Calendar date',CalendarContent.dateInput(ev.date),'date','Leave blank if the date is not announced.'),field(`events.${i}.time`,'Time (local to venue)',ev.time||'','time'),field(`events.${i}.place`,'Place',ev.place),selectField(`events.${i}.status`,'Status',ev.status,STATUS_OPTIONS.events),toggleField(`events.${i}.featured`,'Featured',!!ev.featured),visibilityField(`events.${i}.hideFromPublic`,!!ev.hideFromPublic,'events',ev.status),mediaField(`events.${i}.posterImage`,'Event poster',mediaUrl(ev,'posterImage','poster'),'Upload a flyer or event poster from files/camera roll.'),field(`events.${i}.video`,'YouTube / video link',ev.video||ev.media?.video?.url||'','url'),field(`events.${i}.detail`,'Description',ev.detail,'textarea')].join(''),ev)).join(''):'<div class="empty">No events yet.</div>'}
function renderArchive(){const list=draft.archiveItems||[];byId('archiveList').innerHTML=list.length?list.map((a,i)=>card('archiveItems',i,a.title||'Untitled archive item',`${a.id||'NO ID'} / ${a.category||'Category'}`,a.relatedSession||a.relatedEvent||'archive',[field(`archiveItems.${i}.id`,'ID',a.id),field(`archiveItems.${i}.title`,'Title',a.title),field(`archiveItems.${i}.category`,'Category',a.category),toggleField(`archiveItems.${i}.featured`,'Featured',!!a.featured),visibilityField(`archiveItems.${i}.hideFromPublic`,!!a.hideFromPublic,'archive',null),mediaField(`archiveItems.${i}.image`,'Archive photo',mediaUrl(a,'image','image'),'Upload a store photo, poster, culture image, or memory.'),field(`archiveItems.${i}.relatedSession`,'Related session',a.relatedSession),field(`archiveItems.${i}.relatedEvent`,'Related event',a.relatedEvent),field(`archiveItems.${i}.detail`,'Description',a.detail,'textarea')].join(''),a)).join(''):'<div class="empty">No archive items yet.</div>'}
function renderSettings(){draft.settings=draft.settings||{};const s=draft.settings;const clean=String(s.whatsappNumber||'').replace(/\D/g,'');const preview=clean?`https://wa.me/${clean}`:'Waiting for number';byId('settingsForm').innerHTML=`<div class="settings-note"><strong>WhatsApp routing</strong><span>${preview}</span><p>Use country code and number only. Ecuador example: 593999999999. USA example: 19175551212.</p></div><div class="field-grid">${field('settings.brandName','Brand name',s.brandName)}${field('settings.location','Location',s.location)}${field('settings.currency','Currency',s.currency)}${field('settings.whatsappNumber','WhatsApp number',s.whatsappNumber,'tel','Country code + number, no plus sign needed.')}${field('settings.instagramUrl','Instagram link',s.instagramUrl,'url')}${field('settings.businessHours','Business hours',s.businessHours)}${field('settings.pickupNotes','Pickup notes',s.pickupNotes,'textarea')}${field('settings.deliveryNotes','Delivery notes',s.deliveryNotes,'textarea')}${field('settings.whatsappText','WhatsApp intro',s.whatsappText,'textarea')}${field('settings.orderFooter','Order message footer',s.orderFooter,'textarea','Customer fields added after the bag total.')}</div><div class="card-actions"><button class="admin-action" data-save-draft>Save draft</button></div>`}
function publishableDraft(){const output=clone(draft);(output.homepage?.hero?.slides||[]).forEach(slide=>{delete slide.draftBlobKey;delete slide.fileName;delete slide.mimeType;delete slide.originalBytes});return output}
function makeDataJs(){syncMediaAliases();const output=publishableDraft();return `window.SITE_CONTENT = ${JSON.stringify(output,null,2)};\n\nwindow.RECORDS = window.SITE_CONTENT.records;\nwindow.SESSIONS = window.SITE_CONTENT.sessions;\nwindow.EVENTS = window.SITE_CONTENT.events;\nwindow.ARCHIVE_ITEMS = window.SITE_CONTENT.archiveItems;\n\n(function setupWhatsAppRouting(){\n  const settings=window.SITE_CONTENT&&window.SITE_CONTENT.settings?window.SITE_CONTENT.settings:{};\n  const cleanNumber=String(settings.whatsappNumber||'').replace(/\\D/g,'');\n  const footer=String(settings.orderFooter||'').trim();\n  function routedHref(currentHref){\n    let text='';\n    try{text=new URL(currentHref,window.location.href).searchParams.get('text')||''}catch{text=''}\n    if(footer&&text&&!text.includes(footer))text=\`${'${text}'}\\n\\n${'${footer}'}\`;\n    const base=cleanNumber?\`https://wa.me/${'${cleanNumber}'}\`:'https://wa.me/';\n    return \`${'${base}'}?text=${'${encodeURIComponent(text)}'}\`;\n  }\n  function route(){const link=document.getElementById('whatsappCheckout');if(!link||!link.href)return;link.href=routedHref(link.href)}\n  window.addEventListener('load',route);document.addEventListener('click',()=>setTimeout(route,0));setInterval(route,1000);\n})();\n`}
function renderExport(){
 const out=byId('jsonOutput');
 // Avoid serializing the entire content model for every mobile keystroke.
 if(out&&byId('export')?.classList.contains('active'))out.value=makeDataJs();
 schedulePublishStatus();
}
function updatePublishStatus(){
 const c=counts(),status=byId('draftStatus'),summary=byId('publishSummary'),liveBadge=byId('liveStatus');
 const control=byId('publishControl'),button=byId('publishButton'),label=byId('publishButtonText');
 const connected=cloudState.authenticated&&cloudState.available&&cloudState.mediaBinding;
 const live=connected&&cloudState.publishedContent;
 const pending=live?hasUnpublishedChanges():true;
 const inSync=live&&liveSnapshot!==null&&!pending;
 const recentlyPublished=Date.now()<publishSuccessUntil;
 const state=!cloudChecked?'checking':publishBusy?publishPhase:recentlyPublished?'success':!connected?'offline':publishError?'error':inSync?'idle':'changes';
 const siteLabel=!cloudState.available?'CHECKING':!connected?'OFFLINE':live?'LIVE':'NOT LIVE';
 if(status){
  const draftLabel=dirty?'UNSAVED DRAFT':lastSavedAt?'DRAFT SAVED':'LOCAL DRAFT';
  status.textContent=draftLabel;
  status.title=lastSavedAt?'Last saved locally: '+lastSavedAt:'This browser has no saved draft';
  status.classList.toggle('dirty',dirty);
 }
 if(liveBadge){
  liveBadge.textContent=siteLabel;
  liveBadge.classList.toggle('is-live',live);
  liveBadge.classList.toggle('not-live',!live);
  liveBadge.setAttribute('aria-label','Website publication: '+siteLabel);
 }
 if(control)control.dataset.publishState=state;
 if(button){
  const wording=state==='changes'?(live?'PUBLISH CHANGES':'PUBLISH LIVE'):({checking:'CHECKING…',publishing:'PUBLISHING…',finishing:'PUBLISHING…',success:'LIVE',offline:'UNAVAILABLE',error:'RETRY PUBLISH',idle:'NO CHANGES'}[state]||'PUBLISH CHANGES');
  if(label)label.textContent=wording;
  button.disabled=state==='checking'||state==='offline'||state==='idle'||state==='publishing'||state==='finishing'||state==='success'||cloudState.role==='editor';
  button.setAttribute('aria-label',state==='idle'?'No unpublished changes':state==='success'?'Published successfully — live':wording);
  button.setAttribute('aria-busy',String(publishBusy));
  button.title=state==='idle'?'Content matches the published website':
   cloudState.role==='editor'?'Only owners and administrators may publish':
   state==='offline'?'Cloudflare connection required':
   state==='changes'&&dirty?'Unsaved edits can be published; save a draft to retain a local copy':
   state==='error'?'Previous publication failed. Retry publishing.':
   'Publish the current site content';
 }
 if(summary){
  const current=publishBusy?'Publishing…':live?'LIVE':'Not published';
  const changeText=pending?(dirty?'Unsaved changes':'Unpublished draft'):live?'Up to date':'Draft only';
  const publishedAt=cloudState.publishedAt?new Date(cloudState.publishedAt):null;
  const validDate=publishedAt&&Number.isFinite(publishedAt.getTime());
  summary.innerHTML=`<article><strong class="${live?'text-live':''}">${current}</strong><span>Website</span></article><article><strong>${changeText}</strong><span>Local work</span></article><article><strong>${validDate?escapeText(publishedAt.toLocaleDateString()):'—'}</strong><span>Last published</span></article><article><strong>${c.hidden}</strong><span>Hidden items</span></article>`;
 }
}
function refreshAll(){
 // Refreshing a draft should not collapse the form the editor is currently working in.
 const expanded=new Map();
 document.querySelectorAll('.admin-content .panel').forEach(panel=>{
  const sections=Array.from(panel.querySelectorAll('details'));
  expanded.set(panel.id,sections.flatMap((element,index)=>element.open?[index]:[]));
 });
 renderStats();renderHomepage();renderRecords();renderSessions();renderCalendarSettings();renderEvents();renderArchive();renderSettings();renderExport();
 for(const [id,indices] of expanded){
  const sections=Array.from(byId(id)?.querySelectorAll('details')||[]);
  indices.forEach(index=>{if(sections[index])sections[index].open=true});
 }
}
function addItem(type){const templates={records:{id:`LVL${String((draft.records||[]).length+1).padStart(3,'0')}`,artist:'New Artist',title:'New Release',genre:'House',price:0,stock:1,status:'DRAFT',featured:false,featuredInPlayer:false,hideFromPublic:true,coverImage:'',audioPreview:'',description:'',condition:'',label:'',year:'',media:{artwork:{type:'image',provider:'local',url:'',alt:''},audio:{type:'file',provider:'local',url:''}}},sessions:{id:`S${String((draft.sessions||[]).length+1).padStart(2,'0')}`,title:'New Session',type:'Escucha',date:'Próximamente',status:'Draft',featured:false,hideFromPublic:true,detail:'',heroImage:'',audio:'',video:'',relatedRecords:[],media:{hero:{type:'image',provider:'local',url:'',alt:''},audio:{type:'file',provider:'local',url:''},video:{type:'youtube',provider:'youtube',url:''}}},events:{id:`E${String((draft.events||[]).length+1).padStart(2,'0')}`,title:'New Event',date:'Próximamente',place:'Gualaceo',status:'Draft',featured:false,hideFromPublic:true,posterImage:'',video:'',detail:'',media:{poster:{type:'image',provider:'local',url:'',alt:''},video:{type:'youtube',provider:'youtube',url:''}}},archiveItems:{id:`A${String((draft.archiveItems||[]).length+1).padStart(2,'0')}`,title:'New Archive Item',category:'Archive',featured:false,hideFromPublic:true,image:'',detail:'',relatedSession:'',relatedEvent:'',media:{image:{type:'image',provider:'local',url:'',alt:''}}}};draft[type]=draft[type]||[];if(type==='events'){templates.events.id='E'+Date.now().toString(36);templates.events.time='';}draft[type].push(templates[type]);saveDraft()}
function applyFieldChange(input){if(!input)return;let value=input.value;if(input.type==='number')value=Number(input.value);if(input.dataset.path&&input.dataset.path.endsWith('relatedRecords'))value=String(input.value).split(',').map(x=>x.trim()).filter(Boolean);if(/^events\.\d+\.date$/.test(input.dataset.path))value=CalendarContent.storedDate(value);
setValue(input.dataset.path,value);renderStats();renderExport();updateMediaPreview(input)}
function updateMediaPreview(input){const wrap=input.closest('.media-field');if(!wrap)return;const preview=wrap.querySelector('.media-preview');const value=input.value.trim();if(!preview)return;if(value){preview.className='media-preview has-image';preview.innerHTML=`<img src="${escapeText(CalendarContent.imageUrl(value,new URL('../',document.baseURI)))}" alt="Media preview" onerror="this.parentElement.classList.add('broken')">`}else{preview.className='media-preview';preview.innerHTML='<span>No image yet</span>'}}
async function handleImageUpload(input){
  const file=input.files&&input.files[0];if(!file)return;
  if(!file.type.startsWith('image/')){showToast('Please choose an image file');return}
  if(!cloudAdminKey()){showToast('Connect Cloudflare publishing before uploading site images');return}
  try{
    showToast('Uploading original to Cloudflare…');
    const uploaded=await uploadOriginalToCloudflare(file,cloudScope(input.dataset.uploadPath));
    setValue(input.dataset.uploadPath,uploaded.url);
    if(saveDraft())showToast('Original image uploaded unchanged');
  }catch(error){showToast(error.message||'Image upload failed')}
}
function clearMedia(path){setValue(path,'');saveDraft();showToast('Image removed')}
function downloadDataJs(){const blob=new Blob([makeDataJs()],{type:'text/javascript'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='data.js';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('data.js downloaded')}
async function copyDataJs(){
 const content=makeDataJs();
 try{await navigator.clipboard.writeText(content);showToast('Full data.js copied')}
 catch{
  const out=byId('jsonOutput');
  if(!out){showToast('Unable to copy data.js');return}
  out.value=content;
  out.select();
  const copied=document.execCommand('copy');
  showToast(copied?'Full data.js copied':'Select and copy the generated data.js');
 }
}
function injectAdminEnhancements(){const style=document.createElement('style');style.textContent=`.admin-header-actions{display:flex;align-items:center;gap:10px}.admin-action.compact{padding:8px 10px}.status-pill.dirty{background:var(--pink);color:var(--ink);border-color:var(--pink)}.status-pill.cloud-ok{background:transparent;color:var(--muted);border-color:var(--line)}.cloud-key-row{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:10px;margin:12px 0}.cloud-key-row input{margin:0;background:#090908;color:var(--paper);border:1px solid var(--line);padding:11px}.cloud-connect-card code{font-size:11px}.publish-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.publish-bar article,.publish-card{background:var(--panel);border:1px solid var(--line);padding:16px}.publish-bar strong,.publish-card strong{display:block;font-size:22px;line-height:.95;letter-spacing:-.04em}.publish-bar span{display:block;color:var(--muted);font-size:10px;font-weight:900;text-transform:uppercase;margin-top:8px}.publish-card ol{margin:14px 0 0;padding-left:20px;color:var(--muted);line-height:1.65}.toast{position:fixed;right:18px;bottom:18px;z-index:90;background:var(--pink);color:var(--ink);padding:12px 14px;font-size:12px;font-weight:900;opacity:0;transform:translateY(10px);pointer-events:none;transition:.2s}.toast.show{opacity:1;transform:none}.field select{width:100%;background:#090908;color:var(--paper);border:1px solid var(--line);padding:11px}.toggle{width:100%;background:#090908;color:var(--muted);border:1px solid var(--line);padding:11px;font-weight:900;cursor:pointer}.toggle.on{background:var(--pink);color:var(--ink);border-color:var(--pink)}.media-field{background:rgba(255,90,167,.045);border:1px solid rgba(255,90,167,.16);padding:14px}.media-row{display:grid;grid-template-columns:140px 1fr;gap:14px;align-items:stretch}.media-preview{min-height:140px;background:#090908;border:1px solid var(--line);display:grid;place-items:center;color:var(--muted);font-size:11px;text-transform:uppercase;font-weight:900;overflow:hidden}.media-preview img{width:100%;height:100%;object-fit:cover;display:block}.media-preview.broken{background:repeating-linear-gradient(45deg,#190b0b,#190b0b 8px,#2b1010 8px,#2b1010 16px)}.media-preview.broken:after{content:'Image not loading';color:#ffb5b5;background:#090908;padding:8px}.media-preview.broken img{display:none}.media-controls{display:flex;flex-direction:column;gap:9px}.media-controls input{margin:0}.upload-button{display:inline-flex;align-items:center;justify-content:center;width:max-content;background:var(--pink);color:var(--ink);border:1px solid var(--pink);padding:11px 13px;font-size:11px;font-weight:900;cursor:pointer;text-transform:uppercase}.upload-button input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px}.advanced-media{border-top:1px solid var(--line);padding-top:8px}.advanced-media summary{cursor:pointer;color:var(--muted);font-size:10px;font-weight:900;text-transform:uppercase}.advanced-media input{margin:9px 0}.copy-flash{outline:2px solid var(--pink)}@media(max-width:900px){.publish-bar{grid-template-columns:repeat(2,1fr)}.admin-header-actions{gap:6px}.admin-action.compact{font-size:10px}}@media(max-width:700px){.media-row,.publish-bar{grid-template-columns:1fr}.media-preview{min-height:210px}.admin-header{height:auto;min-height:68px;gap:10px}.admin-header-actions{flex-wrap:wrap;justify-content:flex-end}.status-pill{font-size:8px}}`;document.head.appendChild(style)}
function injectHomepageAdminStyles(){const style=document.createElement('style');style.textContent=`.hero-copy-card{margin-bottom:18px}.hero-admin-list{display:grid;gap:16px}.hero-admin-card{display:grid;grid-template-columns:minmax(220px,.72fr) 1.28fr;border:1px solid var(--line);background:var(--panel);overflow:hidden}.hero-admin-preview{min-height:300px;background:#090908;overflow:hidden}.hero-admin-preview img{display:block;width:100%;height:100%;min-height:300px;object-fit:cover}.hero-admin-fields{padding:18px}.hero-admin-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.hero-admin-top strong{font-size:22px;letter-spacing:-.04em}.hero-admin-top span{max-width:330px;color:var(--muted);font-size:10px;line-height:1.4;text-align:right}.hero-upload{margin-bottom:16px}.hero-order-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.hero-order-actions button:disabled{opacity:.35;cursor:not-allowed}@media(max-width:850px){.hero-admin-card{grid-template-columns:1fr}.hero-admin-preview,.hero-admin-preview img{min-height:260px}.hero-admin-top{display:block}.hero-admin-top span{display:block;text-align:left;margin-top:6px}}`;document.head.appendChild(style)}

document.addEventListener('input',e=>applyFieldChange(e.target.closest('[data-path]')));
document.addEventListener('change',e=>{const visibility=e.target.closest('[data-visibility-path]');if(visibility){const hidden=visibility.value==='hidden';setValue(visibility.dataset.visibilityPath,hidden);const label=visibility.closest('.editor-card')?.querySelector('.summary-status');if(label){const parts=label.textContent.split(' · ');if(parts.length>1){parts[1]=hidden?'Hidden':(['DRAFT','HIDDEN','PRIVATE LISTING'].includes(String(parts[0]).toUpperCase())&&visibility.dataset.visibilityPath.startsWith('records.'))?'Unlisted by status':'Visible after publishing';label.textContent=parts.join(' · ')}}renderStats();renderExport();return}const heroUpload=e.target.closest('[data-hero-upload]');if(heroUpload){handleHeroUpload(heroUpload);return}const upload=e.target.closest('[data-upload-path]');if(upload){handleImageUpload(upload);return}applyFieldChange(e.target.closest('[data-path]'))});
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-panel]');if(nav){document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));nav.classList.add('active');document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===nav.dataset.panel));if(nav.dataset.panel==='export')renderExport();return}
  const clear=e.target.closest('[data-clear-media]');if(clear){clearMedia(clear.dataset.clearMedia);return}
  const copy=e.target.closest('[data-copy-path]');if(copy){const input=copy.closest('.advanced-media')?.querySelector('[data-path]');if(input){navigator.clipboard&&navigator.clipboard.writeText(input.value);copy.classList.add('copy-flash');setTimeout(()=>copy.classList.remove('copy-flash'),500);showToast('Path copied')}return}
  const toggle=e.target.closest('[data-toggle-path]');if(toggle){const path=toggle.dataset.togglePath;const next=toggle.getAttribute('aria-pressed')!=='true';setValue(path,next);toggle.classList.toggle('on',next);toggle.setAttribute('aria-pressed',next?'true':'false');toggle.querySelector('span').textContent=next?'ON':'OFF';renderStats();renderExport();return}
  
  if(e.target.closest('[data-cloud-publish]')){publishCloudContent();return}
  if(e.target.closest('[data-copy-datajs]')){copyDataJs();return}
  if(e.target.closest('[data-download-datajs]')){downloadDataJs();return}
  if(e.target.closest('[data-save-draft]')){saveDraft(false);return}
  if(e.target.closest('[data-reset-draft]')){if(confirm('Discard your local edits and restore the published content?'))resetDraft();return}
  if(e.target.closest('[data-refresh-json]')){renderExport();showToast('data.js refreshed');return}
  if(e.target.closest('[data-add-hero-slide]')){addHeroSlide();return}
  const heroMove=e.target.closest('[data-hero-move]');if(heroMove){moveHeroSlide(Number(heroMove.dataset.heroMove),Number(heroMove.dataset.direction));return}
  const heroClear=e.target.closest('[data-hero-clear-draft]');if(heroClear){clearHeroDraft(Number(heroClear.dataset.heroClearDraft));return}
  const heroRemove=e.target.closest('[data-hero-remove]');if(heroRemove){if(confirm('Remove this hero image from the draft?'))removeHeroSlide(Number(heroRemove.dataset.heroRemove));return}
  if(e.target.closest('[data-add-record]')){addItem('records');return}
  if(e.target.closest('[data-add-session]')){addItem('sessions');return}
  if(e.target.closest('[data-add-event]')){addItem('events');return}
  if(e.target.closest('[data-add-archive]')){addItem('archiveItems');return}
  const remove=e.target.closest('[data-remove]');if(remove){const [collection,index]=remove.dataset.remove.split('.');if(confirm('Remove this item from your draft?')){draft[collection].splice(Number(index),1);saveDraft()}}
});
window.LVLAdminCloud={
  uploadOriginalToCloudflare,
  cloudAdminKey,
  saveDraft,
  setValue,
  showToast
};
injectAdminEnhancements();
injectHomepageAdminStyles();
refreshAll();
checkCloudStatus();
byId('adminLogout')?.addEventListener('click',async()=>{await fetch('../api/auth/logout',{method:'POST'});location.replace('login.html')});
