const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../discos.js'),media=require('../calendar-content.js');
assert.equal(api.visible({status:'DRAFT'}),false);assert.equal(api.visible({status:'PRIVATE LISTING'}),false);assert.equal(api.visible({hideFromPublic:true}),false);assert.equal(api.visible({status:'SOLD OUT'}),true);
const records=[{id:'1',title:'After Hours',artist:'Night Drivers',genre:'House',price:28,audioPreview:'preview.mp3'},{id:'2',title:'Pulse',artist:'Static',genre:'Techno',price:32}];
assert.equal(api.filterRecords(records,'NIGHT','House').length,1);assert.equal(api.filterRecords(records,'night','Techno').length,0);
assert.equal(api.audioUrl({audioPreview:'javascript:alert(1)'},'https://example.test/'),'');
assert.equal(api.audioUrl({audioPreview:'https://youtu.be/123'},'https://example.test/'),'');
assert.equal(api.audioUrl(records[0],'https://example.test/'),'https://example.test/preview.mp3');
assert.equal(api.time(65),'1:05');assert.equal(api.time(NaN),'0:00');
const nodes=new Map(),listeners={};let plays=0;
function element(id){if(!nodes.has(id))nodes.set(id,{value:id==='volume'?'.7':'',textContent:'',innerHTML:'',dataset:{},disabled:false,style:{setProperty(){}},classList:{add(){},toggle(){}},append(){},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k]||null;},removeAttribute(k){delete this[k];},querySelectorAll(){return [];},addEventListener(name,fn){listeners[id+':'+name]=fn;},pause(){this.paused=true;},load(){},play(){plays++;this.paused=false;return Promise.resolve();},paused:true});return nodes.get(id);}
const ctx={document:{baseURI:'https://example.test/discos.html',getElementById:element,querySelector:()=>element('label'),createElement:()=>element('option')},window:{SITE_CONTENT:{settings:{},records},CalendarContent:media},URL,Image:class{},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('discos.js','utf8'),ctx);
assert.equal(element('recordTitle').textContent,'After Hours');assert.equal(plays,0);
assert.equal(element('recordInquiry').hidden,true);assert.equal(element('playRecord').disabled,false);
element('nextRecord').onclick();assert.equal(element('recordTitle').textContent,'Pulse');assert.equal(element('playRecord').disabled,true);
assert.match(element('playerNotice').textContent,/no tiene/);
element('recordSearch').value='nonexistent';element('recordSearch').oninput();assert.match(element('discGallery').innerHTML,/No hay discos/);
console.log('PASS: visibility, filters, safe audio URLs, metadata, no autoplay, selection, unavailable audio, empty results');

