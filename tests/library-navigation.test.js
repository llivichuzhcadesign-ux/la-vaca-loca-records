const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../discos.js'),'utf8');
const fields={recordSearch:{value:'night'},genreFilter:{value:'House'},libraryPageTitle:{focus(){}}};
let mounted=0,played=0,rendered=0;
const context={libraryPage:{type:'collection',scope:'all',genre:'House'},libraryTrail:[],libraryScope:'all',collectionPanel:{scrollTop:180},$:id=>fields[id],setDiscView(){},saveLibraryHistory(){},renderGallery(){rendered++},URL,location:{href:'https://example.test/discos',hash:''},history:{replaceState(){},pushState(){}},window:{innerWidth:1200,addEventListener(){}},discView:'library',iosDiscView:false,isLoadingDisc:false,mountRecord(){mounted++},togglePlayback(){played++}};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function navigateLibrary('),source.indexOf('function syncLibraryPage(')),context);
vm.runInContext(source.slice(source.indexOf('function stageFromLibrary('),source.indexOf('function createReturnSleeveGhost(')),context);
const record={id:'disc-1'};
context.stageFromLibrary(record);
assert.equal(context.libraryPage.type,'disc');assert.equal(context.libraryPage.record,record);
assert.equal(mounted,0);assert.equal(played,0);
assert.equal(context.libraryTrail[0].genre,'House');assert.equal(context.libraryTrail[0].query,'night');assert.equal(context.libraryTrail[0].scroll,180);
context.navigateLibrary(context.libraryTrail.pop(),false);
assert.equal(context.libraryPage.type,'collection');assert.equal(fields.recordSearch.value,'night');assert.equal(fields.genreFilter.value,'House');assert.equal(context.collectionPanel.scrollTop,180);
context.openLibraryCollection('liked');assert.equal(context.libraryScope,'liked');assert.equal(fields.genreFilter.value,'');assert.equal(fields.recordSearch.value,'');
context.navigateLibrary({type:'home'});assert.equal(context.libraryScope,'all');assert.equal(context.libraryPage.type,'home');assert.equal(rendered,4);
context.iosDiscView=true;context.stageFromLibrary(record);assert.equal(context.libraryPage.type,'disc');assert.equal(mounted,0);
console.log('PASS: disc browsing preserves audio, back restores collection/search/scroll, favorites reset filters, mobile opens disc details');
context.location.href='https://example.test/discos?disc=disc-1';context.location.hash='';context.records=[record];assert.equal(context.libraryPageFromUrl().record,record);
context.location.href='https://example.test/discos?collection=liked&q=night';assert.equal(context.libraryPageFromUrl().scope,'liked');assert.equal(context.libraryPageFromUrl().query,'night');
let route;context.history.pushState=(state,unused,url)=>{route={state,url}};context.libraryPage={type:'disc',record};context.saveLibraryHistory(false);assert.equal(route.url.searchParams.get('disc'),'disc-1');assert.equal(route.state.lvlLibrary.record.id,'disc-1');
console.log('PASS: direct disc URLs, favorite search URLs and browser history state');
// Browser Back/Forward and the in-page Back button must share the same trail.
const entries=[],listeners={};let cursor=-1;
context.window.addEventListener=(name,handler)=>{listeners[name]=handler};
context.history={
 replaceState(state,unused,url){entries[cursor]={state:structuredClone(state),url:String(url)}},
 pushState(state,unused,url){entries.splice(++cursor);entries.push({state:structuredClone(state),url:String(url)})},
 back(){if(cursor>0){cursor--;restore()}},
 forward(){if(cursor<entries.length-1){cursor++;restore()}}
};
function restore(){context.location.href=entries[cursor].url;listeners.popstate({state:structuredClone(entries[cursor].state)})}
vm.runInContext(source.slice(source.indexOf('function navigateLibrary('),source.indexOf('function syncLibraryPage(')),context);
context.libraryPage={type:'home'};context.libraryTrail=[];fields.recordSearch.value='';fields.genreFilter.value='';context.collectionPanel.scrollTop=0;
context.saveLibraryHistory(false);
context.openLibraryCollection('all','House');fields.recordSearch.value='night';context.collectionPanel.scrollTop=180;
context.navigateLibrary({type:'disc',record});
assert.equal(context.libraryTrail.length,2);
context.history.back();assert.equal(context.libraryTrail.length,1);assert.equal(fields.recordSearch.value,'night');assert.equal(context.collectionPanel.scrollTop,180);
context.history.back();assert.equal(context.libraryTrail.length,0);assert.equal(context.libraryPage.type,'home');
context.history.forward();assert.equal(context.libraryTrail.length,1);
context.history.forward();assert.equal(context.libraryTrail.length,2);
context.goBackInLibrary();assert.equal(context.libraryPage.genre,'House');assert.equal(context.libraryTrail.length,1);
context.goBackInLibrary();assert.equal(context.libraryPage.type,'home');assert.equal(context.libraryTrail.length,0);
// Opening another disc after going back discards the abandoned forward branch.
context.navigateLibrary({type:'disc',record});assert.equal(context.libraryTrail.length,1);assert.equal(entries.length,2);
console.log('PASS: mixed browser/in-page navigation restores filters and scroll, forward restores trail, new navigation replaces forward branch');
