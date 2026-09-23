(function(){
'use strict';
if(new URLSearchParams(location.search).get('preview')!=='admin-draft')return;
try{
  const raw=localStorage.getItem('lvl-admin-draft-v1');
  if(!raw)return;
  const draft=JSON.parse(raw);
  if(!draft||typeof draft!=='object')return;
  window.SITE_CONTENT=draft;
  window.RECORDS=draft.records||[];
  window.SESSIONS=draft.sessions||[];
  window.EVENTS=draft.events||[];
  window.ARCHIVE_ITEMS=draft.archiveItems||[];
  document.documentElement.dataset.adminDraftPreview='true';
}catch(error){
  console.warn('Admin draft preview could not load',error);
}
})();