(()=>{
 const nav=document.getElementById('teamNav');
 const list=document.getElementById('teamList');
 const inviteForm=document.getElementById('teamInvite');
 const inviteList=document.getElementById('teamInvitations');
 const inviteLinkBox=document.getElementById('teamInviteLinkBox');
 const inviteLink=document.getElementById('teamInviteLink');
 const copyInvite=document.getElementById('teamCopyInvite');
 const copyStatus=document.getElementById('teamInviteCopyStatus');
 const status=document.getElementById('teamStatus');
 const resetRequests=document.getElementById('teamResetRequests');
 const resetLinkBox=document.getElementById('teamResetLinkBox');
 const resetLinkInput=document.getElementById('teamResetLink');
 const resetCopy=document.getElementById('teamCopyReset');
 const resetCopyStatus=document.getElementById('teamResetCopyStatus');
 const resetDialog=document.getElementById('teamResetDialog');
 const resetForm=document.getElementById('teamResetForm');
 const resetStatus=document.getElementById('teamResetStatus');
 const deleteDialog=document.getElementById('teamDeleteDialog');
 const deleteForm=document.getElementById('teamDeleteForm');
 const deleteStatus=document.getElementById('teamDeleteStatus');
 if(!nav||!list||!inviteForm||!inviteList||!resetDialog||!deleteDialog)return;

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
  const reset=own
   ? `<button type="button" class="team-button" data-reset="${id}" data-email="${email}" data-self="1">Change my password</button>`
   : !primary
   ? `<button type="button" class="team-button" data-generate-reset="${id}" data-email="${email}">Generate reset link</button>`
   : '';
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
   await loadInvitations();
   await loadResetRequests();
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
  const generate=event.target.closest('[data-generate-reset]');
  if(generate){generateResetLink({action:'direct',userId:generate.dataset.generateReset},generate);return}
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

 const inviteApi=async(method='GET',payload)=>{
  const response=await fetch('../api/admin/invitations',{
   method,
   headers:payload?{'content-type':'application/json'}:{},
   body:payload?JSON.stringify(payload):undefined,
   cache:'no-store'
  });
  if(!(response.headers.get('content-type')||'').includes('application/json'))
   throw Error('Invitation service unavailable. Check the Cloudflare deployment.');
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Invitation request failed');
  return data;
 };

 async function loadInvitations(){
  try{
   const {invitations}=await inviteApi();
   const now=Date.now();
   const pending=(invitations||[]).filter(i=>!i.used_at&&!i.revoked_at&&Number(i.expires_at)>now);
   inviteList.innerHTML=pending.length?pending.map(invite=>{
    const date=new Date(invite.expires_at);
    const expires=Number.isFinite(date.getTime())?date.toLocaleString():'Soon';
    const role=invite.role==='admin'?'Administrator':invite.role==='owner'?'Owner':'Editor';
    return `<article class="team-invite-item">
      <div class="team-invite-info"><strong>${escape(invite.email)}</strong><span>${escape(role)} · Expires ${escape(expires)}</span></div>
      <button type="button" class="team-button team-invite-revoke" data-revoke-invite="${escape(invite.id)}" data-invite-email="${escape(invite.email)}">Revoke</button>
    </article>`;
   }).join(''):'<p class="team-hint">No pending invitations.</p>';
  }catch(error){
   inviteList.textContent=error.message;
  }
 }

 inviteForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=inviteForm.querySelector('[type="submit"]');
  button.disabled=true;
  inviteLinkBox.hidden=true;
  inviteLink.value='';
  message(copyStatus,'');
  try{
   message(status,'Generating secure invitation…');
   const {inviteUrl,email}=await inviteApi('POST',Object.fromEntries(new FormData(inviteForm)));
   inviteLink.value=inviteUrl;
   inviteLinkBox.hidden=false;
   message(status,'Invitation ready for '+email+'. Copy the private link and send it directly.');
   inviteForm.reset();
   await loadInvitations();
  }catch(error){message(status,error.message,true)}
  finally{button.disabled=false}
 });

 copyInvite.addEventListener('click',async()=>{
  if(!inviteLink.value)return;
  try{
   if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(inviteLink.value);
   else{
    inviteLink.focus();inviteLink.select();inviteLink.setSelectionRange(0,inviteLink.value.length);
    if(!document.execCommand('copy'))throw Error('Copy not supported');
   }
   message(copyStatus,'Link copied. Share it privately with the invited person.');
  }catch(error){
   inviteLink.focus();inviteLink.select();
   message(copyStatus,'Select and copy the link manually.',true);
  }
 });

 inviteList.addEventListener('click',async event=>{
  const button=event.target.closest('[data-revoke-invite]');
  if(!button)return;
  if(!window.confirm('Revoke the invitation for '+button.dataset.inviteEmail+'? The link will stop working.'))return;
  button.disabled=true;
  try{
   await inviteApi('DELETE',{id:button.dataset.revokeInvite});
   message(status,'Invitation revoked.');
   inviteLinkBox.hidden=true;
   inviteLink.value='';
   await loadInvitations();
  }catch(error){message(status,error.message,true);button.disabled=false}
 });


 const resetApi=async(method='GET',payload)=>{
  const response=await fetch('../api/admin/password-resets',{
   method,headers:payload?{'content-type':'application/json'}:{},
   body:payload?JSON.stringify(payload):undefined,cache:'no-store'
  });
  if(!(response.headers.get('content-type')||'').includes('application/json'))
   throw Error('Password recovery service unavailable. Check Cloudflare deployment.');
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Password recovery request failed');
  return data;
 };

 async function loadResetRequests(){
  if(!resetRequests)return;
  try{
   const {requests}=await resetApi();
   const now=Date.now();
   resetRequests.innerHTML=requests.length?requests.map(item=>{
    const when=new Date(item.requested_at).toLocaleString();
    const valid=!!item.approved_at&&Number(item.expires_at)>now;
    const expiry=valid?new Date(item.expires_at).toLocaleString():'';
    const label=valid?'Link issued · Expires '+expiry:item.approved_at?'Previous link expired · Generate another':'Awaiting owner approval';
    return `<article class="team-invite-item">
      <div class="team-invite-info">
       <strong>${escape(item.email)}</strong>
       <span>${escape(label)} · Requested ${escape(when)}</span>
      </div>
      <div class="team-recovery-actions">
       <button class="team-button" type="button" data-approve-reset="${escape(item.id)}">${item.approved_at?'New link':'Generate reset link'}</button>
       <button class="team-button team-invite-revoke" type="button" data-revoke-reset="${escape(item.id)}">Revoke</button>
      </div>
     </article>`;
   }).join(''):'<p class="team-hint">No pending password reset requests.</p>';
  }catch(error){resetRequests.textContent=error.message}
 }

 async function generateResetLink(payload,button){
  if(button)button.disabled=true;
  if(resetLinkBox)resetLinkBox.hidden=true;
  if(resetLinkInput)resetLinkInput.value='';
  message(resetCopyStatus,'');
  try{
   const data=await resetApi('POST',payload);
   resetLinkInput.value=data.resetUrl;
   resetLinkBox.hidden=false;
   message(status,'Password reset link created for '+data.email+'. Copy it and send it privately; it expires in 30 minutes.');
   await loadResetRequests();
   resetLinkBox.scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(error){message(status,error.message,true)}
  finally{if(button)button.disabled=false}
 }

 resetRequests?.addEventListener('click',async event=>{
  const approve=event.target.closest('[data-approve-reset]');
  if(approve){await generateResetLink({action:'approve',id:approve.dataset.approveReset},approve);return}
  const revoke=event.target.closest('[data-revoke-reset]');
  if(!revoke)return;
  if(!window.confirm('Revoke this password reset request and invalidate its link?'))return;
  revoke.disabled=true;
  try{
   await resetApi('DELETE',{id:revoke.dataset.revokeReset});
   resetLinkInput.value='';
   resetLinkBox.hidden=true;
   message(status,'Password reset request revoked.');
   await loadResetRequests();
  }catch(error){message(status,error.message,true);revoke.disabled=false}
 });

 resetCopy?.addEventListener('click',async()=>{
  if(!resetLinkInput.value)return;
  try{
   if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(resetLinkInput.value);
   else{
    resetLinkInput.focus();resetLinkInput.select();resetLinkInput.setSelectionRange(0,resetLinkInput.value.length);
    if(!document.execCommand('copy'))throw Error('Copy unavailable');
   }
   message(resetCopyStatus,'Link copied. Send it privately to the account holder.');
  }catch(error){
   resetLinkInput.focus();resetLinkInput.select();
   message(resetCopyStatus,'Please select and copy the link manually.',true);
  }
 });
 document.getElementById('teamRefreshResets')?.addEventListener('click',loadResetRequests);

 document.getElementById('teamRefreshInvites')?.addEventListener('click',loadInvitations);

 fetch('../api/auth/me',{cache:'no-store'}).then(response=>response.json()).then(user=>{
  if(!user.ok)return;
  if(user.role==='owner'){nav.hidden=false;load()}
  if(user.role==='editor'){
   document.querySelectorAll('[data-cloud-publish]').forEach(button=>{button.disabled=true;button.title='Editors cannot publish'});
   document.querySelectorAll('#galleryUpload,input[type="file"]').forEach(input=>{input.disabled=true;input.title='Editors cannot upload media'});
  }
 }).catch(()=>{});
})();