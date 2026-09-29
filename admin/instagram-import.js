(()=>{
 let preview=null,busy=false;
 const status=byId('instagramImportStatus'),container=byId('instagramImportPreview'),button=byId('instagramPreviewButton');
 async function request(url,save=false){
   if(!cloudAdminKey())throw new Error('Connect Cloudflare from Dashboard first.');
   return readCloudResponse(await fetch('../api/admin/instagram',{method:'POST',headers:{'content-type':'application/json','X-Admin-Key':cloudAdminKey()},body:JSON.stringify({url,save})}));
 }
 byId('instagramImportForm').addEventListener('submit',async event=>{
   event.preventDefault();if(busy)return;busy=true;button.disabled=true;preview=null;container.innerHTML='';status.textContent='Reading Instagram post…';
   try{preview=await request(byId('instagramPostUrl').value.trim());container.innerHTML=`<div class="field"><label for="instagramEventTitle">Event title</label><input id="instagramEventTitle" value="${escapeText(preview.title)}"></div><div class="instagram-photos">${preview.photos.map(photo=>`<img src="${escapeText(photo.url)}" alt="Instagram post photo">`).join('')}</div><p class="instagram-caption">${escapeText(preview.caption||'No caption on this post.')}</p><button class="admin-action" id="instagramCreateEvent" type="button">Create draft event</button>`;status.textContent=(preview.warnings||[]).join(' ')+' '+`${preview.photos.length} photo${preview.photos.length===1?'':'s'} found. Review the title and create a draft; then set the event date and venue.`}
   catch(error){status.textContent=error.message}
   finally{busy=false;button.disabled=false}
 });
 byId('instagramPostUrl').addEventListener('input',()=>{if(!busy){preview=null;container.innerHTML='';status.textContent=''}});
 document.addEventListener('click',async event=>{
   const create=event.target.closest('#instagramCreateEvent');if(!create||!preview||busy)return;
   const existing=(draft.events||[]).find(item=>item.instagramMediaId===preview.id);
   if(existing){status.textContent='This post already has an event in this draft.';return}
   busy=true;create.disabled=true;button.disabled=true;status.textContent='Saving photos to Gallery and creating event…';
   const title=byId('instagramEventTitle').value.trim()||preview.title;
   try{
     const data=await request(preview.url,true);draft.events=draft.events||[];
     const item={id:'E'+crypto.randomUUID(),title,date:'Próximo anuncio',time:'',place:'',status:'Draft',featured:false,hideFromPublic:true,detail:data.caption,posterImage:data.photos[0].url,photos:data.photos.slice(1),instagramUrl:data.url,instagramMediaId:data.id,media:{poster:{type:'image',provider:'cloudflare',url:data.photos[0].url,alt:title}}};
     draft.events.push(item);markDirty();const saved=saveDraft();
     const cards=byId('eventsList').querySelectorAll('.editor-card');const card=cards[cards.length-1];if(card){card.open=true;card.scrollIntoView({behavior:'smooth',block:'start'})}
     document.dispatchEvent(new Event('gallery-updated'));
     status.textContent=saved?'Draft event created. Set the date and venue, then Publish live when ready.':'Event created in this editor, but browser storage is full. Download your backup before leaving.';
     preview=null;container.innerHTML='';showToast('Instagram event created as a draft');
   }catch(error){status.textContent=error.message;create.disabled=false}
   finally{busy=false;button.disabled=false}
 });
})();
