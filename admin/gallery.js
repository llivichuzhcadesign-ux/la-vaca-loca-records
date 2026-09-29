(()=>{
  let photos=[],cursor=null,loaded=false,loading=false,targetPath='',uploading=false,failed=[];
  const picker=byId('galleryPicker');
  function render(){
    for(const [gridId,searchId,moreId] of [['galleryGrid','gallerySearch','galleryMore'],['galleryPickerGrid','galleryPickerSearch','galleryPickerMore']]){
      const query=byId(searchId).value.trim().toLowerCase();
      const matches=photos.filter(photo=>photo.name.toLowerCase().includes(query));
      byId(gridId).innerHTML=matches.map(photo=>`<button type="button" class="gallery-photo" data-gallery-key="${escapeText(photo.key)}" aria-label="${escapeText(gridId==='galleryPickerGrid'?'Select '+photo.name:photo.name)}"><img src="${escapeText(photo.url)}" alt="" loading="lazy"><strong>${escapeText(photo.name)}</strong><small>${humanBytes(photo.size)}</small></button>`).join('')||`<p class="empty">${loading?'Loading photos…':loaded?(query?'No matching photos.':'No photos yet. Upload photos to start.'): 'Connect Cloudflare from Dashboard to load your gallery.'}</p>`;
      byId(moreId).hidden=!cursor;byId(moreId).disabled=loading;
    }
  }
  async function load(reset=false){
    if(loading)return;
    if(!cloudAdminKey()){render();byId('galleryPickerStatus').textContent='Connect Cloudflare from Dashboard first.';return}
    loading=true;if(reset){cursor=null;loaded=false;photos=[]}render();
    try{
      const response=await fetch('../api/admin/media'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{headers:{'X-Admin-Key':cloudAdminKey()},cache:'no-store'});
      const data=await readCloudResponse(response);
      const merged=new Map(photos.map(photo=>[photo.key,photo]));for(const photo of data.items)merged.set(photo.key,photo);
      photos=[...merged.values()].sort((a,b)=>b.uploadedAt.localeCompare(a.uploadedAt));cursor=data.cursor;loaded=true;
      byId('galleryPickerStatus').textContent='';
    }catch(error){byId('galleryProgress').textContent=error.message;byId('galleryPickerStatus').textContent=error.message}
    finally{loading=false;render()}
  }
  async function upload(files){
    if(uploading)return;
    if(!cloudAdminKey()){showToast('Connect Cloudflare from Dashboard first');return}
    uploading=true;byId('galleryUpload').disabled=true;failed=[];byId('galleryFailures').innerHTML='';let success=0;
    try{
      for(let i=0;i<files.length;i++){
        const file=files[i];byId('galleryProgress').textContent=`Uploading ${i+1} / ${files.length}: ${file.name}`;
        try{if(!file.type.startsWith('image/'))throw new Error('Please choose an image file');const photo=await uploadOriginalToCloudflare(file,'gallery');photos.unshift({...photo,uploadedAt:new Date().toISOString()});success++;render()}
        catch(error){failed.push({file,error:error.message})}
      }
      byId('galleryProgress').textContent=`${success} photo${success===1?'':'s'} uploaded${failed.length?`; ${failed.length} failed`:''}.`;
      byId('galleryFailures').innerHTML=failed.length?`<ul>${failed.map(item=>`<li>${escapeText(item.file.name)}: ${escapeText(item.error)}</li>`).join('')}</ul><button type="button" class="admin-action secondary" id="galleryRetry">Retry failed uploads</button>`:'';
    }finally{uploading=false;byId('galleryUpload').disabled=false;byId('galleryUpload').value='';loaded=true;render()}
  }
  document.addEventListener('click',event=>{
    const open=event.target.closest('[data-gallery-path]');
    if(open){targetPath=open.dataset.galleryPath;byId('galleryPickerSearch').value='';picker.showModal();render();if(!loaded)load(true);return}
    const photo=event.target.closest('[data-gallery-key]');
    if(photo){const selected=photos.find(item=>item.key===photo.dataset.galleryKey);if(!selected)return;
      if(picker.open&&targetPath){setValue(targetPath,selected.url);if(targetPath.startsWith('homepage.hero.slides.')){const slide=getValue(targetPath.replace(/\.src$/,''));if(slide.draftBlobKey)deleteOriginalFile(slide.draftBlobKey).catch(()=>{});delete slide.draftBlobKey;slide.fileName=selected.name;slide.originalBytes=selected.size}saveDraft();picker.close();showToast('Gallery photo selected')}
      else{targetPath='';byId('galleryPickerSearch').value='';picker.showModal();render()}
    }
    if(event.target.closest('[data-panel="gallery"]')&&!loaded)load(true);
    if(event.target.closest('#galleryRetry'))upload(failed.map(item=>item.file));
  });
  byId('galleryUpload').addEventListener('change',event=>upload(Array.from(event.target.files||[])));
  byId('galleryRefresh').addEventListener('click',()=>load(true));
  for(const id of ['galleryMore','galleryPickerMore'])byId(id).addEventListener('click',()=>load());
  for(const id of ['gallerySearch','galleryPickerSearch'])byId(id).addEventListener('input',render);
  byId('galleryPickerClose').addEventListener('click',()=>picker.close());
  picker.addEventListener('click',event=>{if(event.target===picker)picker.close()});
  document.addEventListener('gallery-updated',()=>{loaded=false;load(true)});
  render();
})();
