(()=>{
 const nav=document.getElementById('teamNav');
 const list=document.getElementById('teamList');
 const create=document.getElementById('teamCreate');
 const status=document.getElementById('teamStatus');
 const resetDialog=document.getElementById('teamResetDialog');
 const resetForm=document.getElementById('teamResetForm');
 const resetStatus=document.getElementById('teamResetStatus');
 const deleteDialog=document.getElementById('teamDeleteDialog');
 const deleteForm=document.getElementById('teamDeleteForm');
 const deleteStatus=document.getElementById('teamDeleteStatus');
 if(!nav||!list||!create||!resetDialog||!deleteDialog)return;

 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const message=(node,value,isError=false)=>{node.textContent=value;node.classList.toggle('error',isError)};
 const api=async(method='GET',body)=>{
  const response=await fetch('../api/admin/users',{
   method,headers:body?{'content-type':'application/json'}:{},
   body:body?JSON.stringify(body):undefined,cache:'no-store'
  });
  if(!(response.headers.get('content-type')||'').includes('application/json'))
   throw Error('The admin service is unavailable. Check the Cloudflare deployment.');
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Request failed');
  return data;
 };
 const option=(name,current)=>
  `<option value="${name}" ${current===name?'selected':''}>${name==='admin'?'Administrator':name[0].toUpperCase()+name.slice(1)}</option>`;

 function renderAccount(user){
  const id=escape(user.id),email=escape(user.email);
  const primary=!!user.protected,own=!!user.self;
  const controls=primary
   ? `<div class="team-protected-role" title="This permanent account is protected by the server"><span class="team-lock-symbol" aria-hidden="true">◆</span> Owner role protected</div>`
   : `<div class="team-field"><label for="team-role-${id}">Account role</label><select id="team-role-${id}" data-role="${id}" ${own?'disabled title="You cannot change your own Owner role"':''}>${option('owner',user.role)}${option('admin',user.role)}${option('editor',user.role)}</select></div>`;
  const canReset=!primary||own;
  const reset=canReset?`<button type="button" class="team-button" data-reset="${id}" data-email="${email}" data-self="${own?1:0}">Reset password</button>`:'';
  const deactivate=!primary&&!own?`<button type="button" class="team-button ${user.active?'danger':''}" data-toggle="${id}" data-active="${user.active?1:0}">${user.active?'Deactivate':'Reactivate'}</button>`:'';
  const deleteButton=!primary&&!own?`<button type="button" class="team-button team-delete-button" data-delete="${id}" data-email="${email}">Delete account</button>`:'';
  return `<article class="team-card ${primary?'team-card-primary':''}">
   <div class="team-card-top">
    <div class="team-account-heading">
     <h3 class="team-email">${email}</h3>
     ${primary?'<p class="team-primary-detail">Permanent website designer account · Cannot be deactivated, deleted, or demoted.</p>':''}
    </div>
    <div class="team-meta">
     ${primary?'<span class="team-badge team-badge-primary">PRIMARY DESIGNER</span>':''}
     <span class="team-badge">${escape(user.role)}</span>
     <span class="team-badge ${user.active?'active':'inactive'}">${user.active?'Active':'Inactive'}</span>
    </div>
   </div>
   <div class="team-card-controls">
    ${controls}
    <div class="team-actions">${reset}${deactivate}${deleteButton}</div>
   </div>
  </article>`;
 }

 async function load(){
  try{
   const {users}=await api();
   list.innerHTML=users.map(renderAccount).join('')||'<p class="team-hint">No accounts found.</p>';
  }catch(error){message(status,error.message,true)}
 }

 async function update(payload,method='PATCH'){
  message(status,'Saving changes…');
  try{await api(method,payload);message(status,'Changes saved.');await load();return true}
  catch(error){message(status,error.message,true);await load();return false}
 }

 list.addEventListener('change',event=>{
  const select=event.target.closest('[data-role]');
  if(select)update({id:select.dataset.role,role:select.value});
 });

 list.addEventListener('click',event=>{
  const toggle=event.target.closest('[data-toggle]');
  if(toggle){
   update({id:toggle.dataset.toggle,active:toggle.dataset.active!=='1'});
   return;
  }
  const reset=event.target.closest('[data-reset]');
  if(reset){
   resetForm.reset();
   message(resetStatus,'');
   document.getElementById('teamResetId').value=reset.dataset.reset;
   document.getElementById('teamResetEmail').textContent=reset.dataset.email;
   resetForm.dataset.self=reset.dataset.self;
   resetDialog.showModal();
   document.getElementById('teamNewPassword').focus();
   return;
  }
  const remove=event.target.closest('[data-delete]');
  if(remove){
   deleteForm.reset();
   message(deleteStatus,'');
   document.getElementById('teamDeleteId').value=remove.dataset.delete;
   document.getElementById('teamDeleteEmail').textContent=remove.dataset.email;
   deleteForm.dataset.email=remove.dataset.email.toLowerCase();
   deleteForm.querySelector('[type="submit"]').disabled=true;
   deleteDialog.showModal();
   document.getElementById('teamDeleteEmailConfirm').focus();
  }
 });

 document.querySelector('[data-reset-cancel]')?.addEventListener('click',()=>resetDialog.close());
 document.querySelector('[data-delete-cancel]')?.addEventListener('click',()=>deleteDialog.close());

 resetForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const password=document.getElementById('teamNewPassword').value;
  const confirm=document.getElementById('teamConfirmPassword').value;
  if(password!==confirm){message(resetStatus,'Passwords do not match.',true);return}
  if(password.length<14){message(resetStatus,'Use a password of at least 14 characters.',true);return}
  const button=resetForm.querySelector('[type="submit"]');
  button.disabled=true;
  try{
   await api('PUT',{id:document.getElementById('teamResetId').value,password});
   const own=resetForm.dataset.self==='1';
   resetDialog.close();
   resetForm.reset();
   if(own){location.replace('login.html');return}
   message(status,'Password changed. Previous sessions for this account were revoked.');
   await load();
  }catch(error){message(resetStatus,error.message,true)}
  finally{button.disabled=false}
 });

 function updateDeleteValidity(){
  const email=document.getElementById('teamDeleteEmailConfirm').value.trim().toLowerCase();
  const word=document.getElementById('teamDeleteConfirmWord').value.trim();
  deleteForm.querySelector('[type="submit"]').disabled=!(email===deleteForm.dataset.email&&word==='DELETE');
 }
 deleteForm.addEventListener('input',updateDeleteValidity);

 deleteForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const email=document.getElementById('teamDeleteEmailConfirm').value.trim().toLowerCase();
  const confirm=document.getElementById('teamDeleteConfirmWord').value.trim();
  if(email!==deleteForm.dataset.email||confirm!=='DELETE'){
   message(deleteStatus,'Enter the exact email and DELETE to confirm.',true);
   return;
  }
  const button=deleteForm.querySelector('[type="submit"]');
  button.disabled=true;
  try{
   await api('DELETE',{id:document.getElementById('teamDeleteId').value,email,confirm});
   deleteDialog.close();
   deleteForm.reset();
   message(status,'Administrator permanently deleted. Their active sessions have been revoked.');
   await load();
  }catch(error){
   message(deleteStatus,error.message,true);
   updateDeleteValidity();
  }
 });

 create.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=create.querySelector('[type="submit"]');
  button.disabled=true;
  try{
   message(status,'Creating account…');
   await api('POST',Object.fromEntries(new FormData(create)));
   create.reset();
   message(status,'Account created successfully.');
   await load();
  }catch(error){message(status,error.message,true)}
  finally{button.disabled=false}
 });

 fetch('../api/auth/me',{cache:'no-store'}).then(response=>response.json()).then(user=>{
  if(!user.ok)return;
  if(user.role==='owner'){nav.hidden=false;load()}
  if(user.role==='editor'){
   document.querySelectorAll('[data-cloud-publish]').forEach(button=>{button.disabled=true;button.title='Editors cannot publish'});
   document.querySelectorAll('#galleryUpload,input[type="file"]').forEach(input=>{input.disabled=true;input.title='Editors cannot upload media'});
  }
 }).catch(()=>{});
})();