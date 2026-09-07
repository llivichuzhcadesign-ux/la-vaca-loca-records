(function(){
  const AUDIO_SELECTORS='input[data-path$=".audioPreview"],input[data-path$=".audio"]';
  const MAX_AUDIO_MB=12;
  const objectUrls=new Map();

  function showToast(message){
    const toast=document.getElementById('adminToast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200);
  }
  function escapeText(value=''){
    return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }
  function readFileAsDataUrl(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('Could not read audio file'));
      reader.onload=()=>resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
  function playerFor(path){
    const panel=document.querySelector(`[data-audio-panel="${CSS.escape(path)}"]`);
    return panel&&panel.querySelector('.audio-preview-player');
  }
  function statusFor(path){
    const panel=document.querySelector(`[data-audio-panel="${CSS.escape(path)}"]`);
    return panel&&panel.querySelector('.audio-status');
  }
  function setStatus(path,message){
    const status=statusFor(path);
    if(status)status.textContent=message||'';
  }
  function setPlayerSource(path,src){
    const player=playerFor(path);
    if(!player)return;
    player.pause();
    player.removeAttribute('src');
    player.load();
    if(src){
      player.src=src;
      player.hidden=false;
      player.load();
    }else{
      player.hidden=true;
    }
  }
  function createAudioTools(input){
    if(!input||input.dataset.audioEnhanced)return;
    input.dataset.audioEnhanced='true';
    const value=input.value||'';
    const wrap=document.createElement('div');
    wrap.className='audio-upload-panel';
    wrap.dataset.audioPanel=input.dataset.path;
    wrap.innerHTML=`
      <div class="audio-row">
        <label class="upload-button audio-upload-button">Choose audio<input type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg" data-audio-upload-for="${escapeText(input.dataset.path)}"></label>
        <button class="admin-action secondary" type="button" data-clear-audio="${escapeText(input.dataset.path)}">Remove audio</button>
      </div>
      <audio class="audio-preview-player" controls preload="metadata" ${value?'':'hidden'} src="${escapeText(value)}"></audio>
      <small class="audio-status">${value?'Audio loaded. Press play to test it.':'No audio selected yet.'}</small>
      <small>For record previews, use short MP3/M4A clips. This stores a browser-draft preview now; Cloudinary or Supabase should store the final file later.</small>`;
    input.insertAdjacentElement('afterend',wrap);
    input.closest('.field')?.classList.add('audio-field');
  }
  function enhanceAudioFields(){
    document.querySelectorAll(AUDIO_SELECTORS).forEach(createAudioTools);
  }
  function updateField(path,value,previewSrc=value){
    const input=document.querySelector(`input[data-path="${CSS.escape(path)}"]`);
    if(!input)return;
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    setPlayerSource(path,previewSrc);
    setStatus(path,value?'Audio loaded. Press play to test it.':'No audio selected yet.');
  }
  async function handleAudioUpload(file,path){
    if(!file)return;
    if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name||'')){
      showToast('Please choose an audio file');
      setStatus(path,'This is not a supported audio file.');
      return;
    }
    const sizeMb=file.size/1024/1024;
    if(sizeMb>MAX_AUDIO_MB){
      showToast(`Audio is too large for draft preview. Keep it under ${MAX_AUDIO_MB} MB.`);
      setStatus(path,`Too large for browser draft preview: ${sizeMb.toFixed(1)} MB.`);
      return;
    }
    showToast('Preparing audio preview...');
    setStatus(path,'Preparing audio preview...');
    try{
      if(objectUrls.has(path))URL.revokeObjectURL(objectUrls.get(path));
      const objectUrl=URL.createObjectURL(file);
      objectUrls.set(path,objectUrl);
      setPlayerSource(path,objectUrl);
      setStatus(path,`Ready: ${file.name}. Press play to test.`);
      const dataUrl=await readFileAsDataUrl(file);
      const input=document.querySelector(`input[data-path="${CSS.escape(path)}"]`);
      if(input){
        input.value=dataUrl;
        input.dispatchEvent(new Event('input',{bubbles:true}));
      }
      showToast('Audio ready for draft preview');
    }catch(error){
      showToast(error.message||'Audio upload failed');
      setStatus(path,error.message||'Audio upload failed');
    }
  }

  document.addEventListener('change',event=>{
    const upload=event.target.closest('[data-audio-upload-for]');
    if(!upload)return;
    handleAudioUpload(upload.files&&upload.files[0],upload.dataset.audioUploadFor);
  });
  document.addEventListener('click',event=>{
    const clear=event.target.closest('[data-clear-audio]');
    if(!clear)return;
    const path=clear.dataset.clearAudio;
    if(objectUrls.has(path)){URL.revokeObjectURL(objectUrls.get(path));objectUrls.delete(path)}
    updateField(path,'','');
    showToast('Audio removed');
  });
  document.addEventListener('error',event=>{
    const player=event.target.closest&&event.target.closest('.audio-preview-player');
    if(!player)return;
    const panel=player.closest('[data-audio-panel]');
    if(panel)setStatus(panel.dataset.audioPanel,'This browser could not play this file. Try MP3 or M4A.');
  },true);
  document.addEventListener('canplay',event=>{
    const player=event.target.closest&&event.target.closest('.audio-preview-player');
    if(!player)return;
    const panel=player.closest('[data-audio-panel]');
    if(panel&&!statusFor(panel.dataset.audioPanel).textContent.includes('Ready:'))setStatus(panel.dataset.audioPanel,'Audio loaded. Press play to test it.');
  },true);

  const style=document.createElement('style');
  style.textContent=`.audio-field{background:rgba(238,229,211,.035);border:1px solid rgba(238,229,211,.12);padding:14px}.audio-upload-panel{display:grid;gap:9px;margin-top:10px}.audio-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.audio-preview-player{width:100%;height:42px;display:block}.audio-preview-player[hidden]{display:none}.audio-upload-button{background:var(--pink);color:var(--ink)}.audio-status{color:var(--pink)!important;font-weight:900!important}.audio-field>input{font-family:monospace;font-size:10px}.audio-field>input[value^="data:"]{color:transparent;text-shadow:0 0 0 var(--muted)}`;
  document.head.appendChild(style);

  enhanceAudioFields();
  const observer=new MutationObserver(()=>enhanceAudioFields());
  observer.observe(document.body,{childList:true,subtree:true});
})();
