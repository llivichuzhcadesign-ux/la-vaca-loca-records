(()=>{
 const nav=document.getElementById('teamNav'),list=document.getElementById('teamList'),form=document.getElementById('teamCreate'),status=document.getElementById('teamStatus');
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let role='';
 const api=async(method='GET',body)=>{const r=await fetch('../api/admin/users',{method,headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d};
 async function load(){try{const d=await api();list.innerHTML=d.users.map(u=>`<div class="publish-card" style="margin-bottom:12px"><strong>${escape(u.email)}</strong><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px"><select data-role="${escape(u.id)}"><option value="editor" ${u.role==='editor'?'selected':''}>Editor</option><option value="admin" ${u.role==='admin'?'selected':''}>Administrator</option><option value="owner" ${u.role==='owner'?'selected':''}>Owner</option></select><button type="button" class="admin-action secondary" data-toggle="${escape(u.id)}" data-active="${u.active?1:0}">${u.active?'Deactivate':'Reactivate'}</button><button class="admin-action secondary" type="button" data-reset="${escape(u.id)}">Reset password</button><small>${u.active?'Active':'Deactivated'}</small></div></div>`).join('')||'No accounts';}catch(e){status.textContent=e.message}}
 async function change(payload,method='PATCH'){try{status.textContent='Saving…';await api(method,payload);status.textContent='Changes saved';await load()}catch(e){status.textContent=e.message;await load()}}
 document.addEventListener('change',e=>{const x=e.target.closest('[data-role]');if(x)change({id:x.dataset.role,role:x.value})});
 document.addEventListener('click',e=>{const t=e.target.closest('[data-toggle]');if(t){change({id:t.dataset.toggle,active:t.dataset.active!=='1'});return}const reset=e.target.closest('[data-reset]');if(reset){const password=prompt('New password (minimum 14 characters):');if(password!==null)change({id:reset.dataset.reset,password},'DELETE')}});
 form.addEventListener('submit',async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(form));try{status.textContent='Creating account…';await api('POST',b);form.reset();status.textContent='Account created';await load()}catch(ex){status.textContent=ex.message}});
 fetch('../api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(d=>{
  if(!d.ok)return;role=d.role;
  if(role==='owner'){nav.hidden=false;load()}
  if(role==='editor'){
   document.querySelectorAll('[data-cloud-publish]').forEach(b=>{b.disabled=true;b.title='Editors cannot publish'});
   document.querySelectorAll('#galleryUpload, input[type="file"]').forEach(b=>{b.disabled=true;b.title='Editors cannot upload media'});
  }
 }).catch(()=>{});
})();
