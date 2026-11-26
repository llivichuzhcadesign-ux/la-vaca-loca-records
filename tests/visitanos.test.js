const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

const pages=['index.html','discos.html','sessions.html','archivo.html','visitanos.html'];
for(const file of pages){
 const html=read(file);
 assert.doesNotMatch(html,/href="eventos\.html"/,'Old public Eventos link in '+file);
 assert.match(html,/visitanos\.html/,'Visítanos link missing in '+file);
}
assert.doesNotMatch(read('ios-header.js'),/eventos\.html/);
assert.doesNotMatch(read('footer-sign.js'),/eventos\.html/);
assert.doesNotMatch(read('app.js'),/eventos\.html/);
assert.doesNotMatch(read('admin/index.html'),/data-panel="events"/);
assert.match(read('admin/index.html'),/data-panel="visitanos"/);
assert.match(read('eventos.html'),/location\.replace/);

const visitHtml=read('visitanos.html');
const visitCss=read('visitanos.css');
assert.equal((visitHtml.match(/<h1\b/g)||[]).length,1,'One main heading');
assert.match(visitHtml,/id="visitAboutText"/,'One editable store biography');
assert.doesNotMatch(visitHtml,/visit-index|visit-about|id="visitInterest"/,'Remove repeated sections and reason dropdown');
assert.doesNotMatch(visitHtml,/FORMULARIO DE VISITA|Tu camino a LVL|Encuéntranos\./,'Remove secondary promotional headings');
for(const id of ['visitMap','visitGoogleMaps','visitAppleMaps','visitForm','visitName','visitDate','visitTime','visitGuests','visitNote']){
 assert.match(visitHtml,new RegExp('id="'+id+'"'),'Missing '+id);
}
assert.ok(visitCss.includes('--visit-pink:var(--lvl-pink'),'Share site accent color');
assert.ok(visitCss.includes('@media(max-width:680px)'),'Mobile layout');
assert.equal((visitCss.match(/\{/g)||[]).length,(visitCss.match(/\}/g)||[]).length,'Balanced CSS');

const script=read('visitanos.js');
new Function(script);
function el(){
 const handlers={};
 return {textContent:'',src:'',href:'',min:'',disabled:false,
  addEventListener(type,fn){handlers[type]=fn},handlers,
  classList:{remove(){}},removeAttribute(){},setAttribute(){},
  setCustomValidity(message){this.validationMessage=message},
  reportValidity(){return true}
 };
}
const elementNames=['visitAboutText','visitAddress','visitReference','visitMap','visitMapNote','visitGoogleMaps','visitAppleMaps','visitForm','visitDate','visitFormStatus','visitSubmit'];
function run(settings,fields={}){
 const elements=Object.fromEntries(elementNames.map(id=>[id,el()]));
 let redirectedTo='';
 const hostWindow={SITE_CONTENT:{settings},location:{assign(url){redirectedTo=url}}};
 const FormDataMock=function(){this.get=key=>fields[key]||''};
 new Function('window','document','FormData',script)(
  hostWindow,{getElementById:id=>elements[id]||null},FormDataMock
 );
 return {elements,redirected:()=>redirectedTo};
}
const configured=run({
 brandName:'La Vaca Loca Records',location:'Gualaceo, Ecuador',whatsappNumber:'593999888777',
 visitanos:{about:'Espacio de música',address:'Dirección verificada, Gualaceo, Ecuador',mapsQuery:'-2.88777,-78.78111',reference:'Esquina de la plaza'}
},{name:'Ana Pérez',date:'2099-01-02',time:'14:30',guests:'2',interest:'Explorar discos',note:'Primera visita'});
assert.match(configured.elements.visitGoogleMaps.href,/maps\/dir\/\?api=1&destination=/);
assert.match(configured.elements.visitAppleMaps.href,/maps\.apple\.com\/\?daddr=/);
assert.match(configured.elements.visitMap.src,/-2\.88777/);
assert.equal(configured.elements.visitAddress.textContent,'Dirección verificada, Gualaceo, Ecuador');
configured.elements.visitForm.handlers.submit({preventDefault(){}});
const link=configured.redirected();
assert.match(link,/^https:\/\/wa\.me\/593999888777\?text=/);
const message=decodeURIComponent(link.split('?text=')[1]);
for(const field of ['Ana Pérez','2 de enero de 2099','14:30','2','Primera visita'])assert.ok(message.includes(field),'WhatsApp message missing '+field);

const empty=run({location:'Gualaceo, Ecuador',whatsappNumber:'',visitanos:{}});
assert.equal(empty.elements.visitSubmit.disabled,true,'Must not send to unknown recipient');
assert.equal(empty.elements.visitGoogleMaps.href,'','Must not route to approximate city center');
assert.match(empty.elements.visitMap.src,/Gualaceo/);
assert.doesNotMatch(message,/Motivo: /,'Streamlined form must not send a deleted field');
assert.equal(configured.elements.visitMapNote.hidden,true,'Avoid repeated directions copy');
assert.match(configured.elements.visitAboutText.textContent,/Espacio de música/,'Admin custom bio preserved');
console.log('PASS: Visítanos navigation, map links, WhatsApp request and safe unconfigured state.');
