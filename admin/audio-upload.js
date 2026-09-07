(function(){
  const AUDIO_SELECTORS='input[data-path$=".audioPreview"],input[data-path$=".audio"]';
  const MAX_AUDIO_MB=12;

  function showToast(message){
    const toast=document.getElementById('adminToast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>toast.classList.remove('show'),2000);
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
      <audio class="audio-preview-player" controls ${value?'':'hidden'} src="${escapeText(value)}"></audio>
      <small>For record previews, use short MP3/M4A clips. This stores a browser-draft preview now; Cloudinary or Supabase should store the final file later.</small>`;
    input.insertAdjacentElement('afterend',wrap);
    input.closest('.field')?.classList.add('audio-field');
  }
  function enhanceAudioFields(){
    document.querySelectorAll(AUDIO_SELECTORS).forEach(createAudioTools);
  }
  function updateField(path,value){
    const input=document.querySelector(`input[data-path="${CSS.escape(path)}"]`);
    if(!input)return;
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    const panel=document.querySelector(`[data-audio-panel="${CSS.escape(path)}"]`);
    const player=panel&&panel.querySelector('.audio-preview-player');
    if(player){
      player.src=value;
      player.hidden=!value;
    }
  }
  async function handleAudioUpload(file,path){
    if(!file)return;
    if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name||'')){
      showToast('Please choose an audio file');
      return;
    }
    const sizeMb=file.size/1024/1024;
    if(sizeMb>MAX_AUDIO_MB){
      showToast(`Audio is too large for draft preview. Keep it under ${MAX_AUDIO_MB} MB.`);
      return;
    }
    showToast('Preparing audio preview...');
    try{
      const dataUrl=await readFileAsDataUrl(file);
      updateField(path,dataUrl);
      showToast('Audio ready for draft preview');
    }catch(error){
      showToast(error.message||'Audio upload failed');
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
    updateField(clear.dataset.clearAudio,'');
    showToast('Audio removed');
  });

  const style=document.createElement('style');
  style.textContent=`.audio-field{background:rgba(238,229,211,.035);border:1px solid rgba(238,229,211,.12);padding:14px}.audio-upload-panel{display:grid;gap:9px;margin-top:10px}.audio-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.audio-preview-player{width:100%;height:38px}.audio-upload-button{background:var(--pink);color:var(--ink)}.audio-field>input{font-family:monospace;font-size:10px}.audio-field>input[value^="data:"]{color:transparent;text-shadow:0 0 0 var(--muted)}`;
  document.head.appendChild(style);

  enhanceAudioFields();
  const observer=new MutationObserver(()=>enhanceAudioFields());
  observer.observe(document.body,{childList:true,subtree:true});
})();
