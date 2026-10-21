(()=>{
 const nav=document.getElementById('teamNav'),list=document.getElementById('teamList'),create=document.getElementById('teamCreate'),status=document.getElementById('teamStatus');
 const dialog=document.getElementById('teamResetDialog'),resetForm=document.getElementById('teamResetForm'),resetStatus=document.getElementById('teamResetStatus');
 if(!nav||!list||!create||!dialog)return;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const message=(el,text,isError=false)=>{el.textContent=text;el.classList.toggle('error',isError)};
 const api=async(method='GET',body)=>{
  const r=await fetch('../api/admin/users',{method,headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const type=r.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw Error('The admin service is unavailable. Check the Cloudflare deployment.');
  const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data;
 };
 const option=(name,current)=>`<option value="${name}" ${current===name?'selected':''}>${name==='admin'?'Administrator':name[0].toUpperCase()+name.slice(1)}</option>`;
 async function load(){
  try{
   const {users}=await api();
   list.innerHTML=users.map(user=>`<article class="team-card">
    <div class="team-card-top"><h3 class="team-email">${escape(user.email)}</h3>
     <div class="team-meta"><span class="team-badge">${escape(user.role)}</span><span class="team-badge ${user.active?'active':'inactive'}">${user.active?'Active':'Inactive'}</span></div></div>
    <div class="team-card-controls"><div class="team-field"><label for="team-role-${escape(user.id)}">Account role</label>
     <select id="team-role-${escape(user.id)}" data-role="${escape(user.id)}">${option('owner',user.role)}${option('admin',user.role)}${option('editor',user.role)}</select></div>
    <div class="team-actions"><button type="button" class="team-button" data-reset="${escape(user.id)}" data-email="${escape(user.email)}">Reset password</button>
     <button type="button" class="team-button ${user.active?'danger':''}" data-toggle="${escape(user.id)}" data-active="${user.active?1:0}">${user.active?'Deactivate':'Reactivate'}</button></div></div></article>`).join('')||'<p class="team-hint">No accounts found.</p>';
  }catch(error){message(status,error.message,true)}
 }
 async function update(payload,method='PATCH'){
  message(status,'Saving changes…');
  try{await api(method,payload);message(status,'Changes saved.');await load();return true}
  catch(error){message(status,error.message,true);await load();return false}
 }
 document.addEventListener('change',e=>{const select=e.target.closest('[data-role]');if(select)update({id:select.dataset.role,role:select.value})});
 document.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-toggle]');
  if(toggle){update({id:toggle.dataset.toggle,active:toggle.dataset.active!=='1'});return}
  const reset=e.target.closest('[data-reset]');
  if(reset){resetForm.reset();resetStatus.textContent='';document.getElementById('teamResetId').value=reset.dataset.reset;document.getElementById('teamResetEmail').textContent=reset.dataset.email;dialog.showModal();document.getElementById('teamNewPassword').focus()}
  if(e.target.closest('[data-reset-cancel]'))dialog.close();
 });
 resetForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const password=document.getElementById('teamNewPassword').value,confirm=document.getElementById('teamConfirmPassword').value;
  if(password!==confirm){message(resetStatus,'Passwords do not match.',true);return}
  if(password.length<14){message(resetStatus,'Use a password of at least 14 characters.',true);return}
  const button=resetForm.querySelector('[type="submit"]');button.disabled=true;
  try{
   await api('DELETE',{id:document.getElementById('teamResetId').value,password});
   dialog.close();resetForm.reset();message(status,'Password changed. Existing sessions for this account were revoked.');await load();
  }catch(error){message(resetStatus,error.message,true)}
  finally{button.disabled=false}
 });
 create.addEventListener('submit',async e=>{
  e.preventDefault();const button=create.querySelector('[type="submit"]');button.disabled=true;
  try{message(status,'Creating account…');await api('POST',Object.fromEntries(new FormData(create)));create.reset();message(status,'Account created successfully.');await load()}
  catch(error){message(status,error.message,true)}
  finally{button.disabled=false}
 });
 fetch('../api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(user=>{
  if(!user.ok)return;
  if(user.role==='owner'){nav.hidden=false;load()}
  if(user.role==='editor'){
   document.querySelectorAll('[data-cloud-publish]').forEach(b=>{b.disabled=true;b.title='Editors cannot publish'});
   document.querySelectorAll('#galleryUpload,input[type="file"]').forEach(b=>{b.disabled=true;b.title='Editors cannot upload media'});
  }
 }).catch(()=>{});
})();