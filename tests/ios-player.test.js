const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../discos.js'),'utf8');
function node(){return {dataset:{},style:{setProperty(){}},classList:{remove(){},add(){}},setAttribute(k,v){this[k]=v},focus(){},querySelector(){return node()}}}
const sheet=node(),opener=node(),expand=node();
const context={window:{innerHeight:800},iosSheet:sheet,sheetPosition:'compact',document:{body:node(),querySelector:()=>opener},$:()=>expand,requestAnimationFrame:f=>f(),syncDeckTimeline(){},setTimeout:f=>f()};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function sheetHeights()'),source.indexOf("document.querySelectorAll('[data-disc-view]')")),context);
context.setSheetPosition('compact');assert.equal(sheet.inert,true);
context.openIosPlayer();assert.equal(sheet.dataset.position,'half');assert.equal(sheet.style.height,'416px');assert.equal(sheet.inert,false);assert.equal(opener['aria-expanded'],'true');
context.setSheetPosition('expanded');assert.equal(sheet.style.height,'688px');assert.equal(expand.textContent,'Reducir');
const handlers={};context.wireSheetDrag({addEventListener:(name,fn,capture)=>{handlers[name+(capture?'Capture':'')]=fn},setPointerCapture(){}});
handlers.pointerdown({button:0,clientY:100,pointerId:1});handlers.pointermove({clientY:360});assert.equal(sheet.style.height,'428px');handlers.pointerup({clientY:360});assert.equal(sheet.dataset.position,'half');
handlers.pointerdown({button:0,clientY:100,pointerId:2});handlers.pointermove({clientY:470});handlers.pointerup({clientY:470});assert.equal(sheet.dataset.position,'compact');assert.equal(sheet.inert,true);
context.setSheetPosition('half');handlers.pointerdown({button:0,clientY:300,pointerId:3});handlers.pointermove({clientY:120});handlers.pointercancel();assert.equal(sheet.style.height,'416px');
context.window.innerHeight=390;context.setSheetPosition('expanded');assert.equal(sheet.style.height,'326px');
assert(!source.slice(source.indexOf('function sheetHeights()'),source.indexOf('function updateSelectedInfo(')).includes('showModal'));
console.log('PASS: three positions, drag snapping, cancelled gestures, viewport resize, compact accessibility, nonmodal browsing');
