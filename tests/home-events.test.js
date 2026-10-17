const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');const context={};vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function upcomingHomeEvent('),source.indexOf('function renderRecordPreview(')),context);
const pick=context.upcomingHomeEvent,today='2026-10-17';
const soon={id:'soon',date:'Próximo anuncio',status:'Próximamente'},next={id:'next',date:'18.10.2026'},later={id:'later',date:'2026-11-01'};
assert.equal(pick([soon,later,next,{id:'past',date:'01.01.2026'},{id:'hidden',date:'17.10.2026',hideFromPublic:true}],today).id,'next');
assert.equal(pick([{date:'18.10.2026',status:'Archivo'},soon],today).id,'soon');
assert.equal(pick([{date:'18.10.2026',status:'Cancelado'}],today),null);
console.log('PASS: nearest upcoming event, unpublished/past/cancelled exclusion, undated fallback');
