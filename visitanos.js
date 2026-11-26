/* Visítanos: map links and client-side WhatsApp visit request. No visitor data is stored. */
(()=>{
 'use strict';
 const settings=window.SITE_CONTENT?.settings||{};
 const visit=settings.visitanos||{};
 const byId=id=>document.getElementById(id);
 const value=value=>String(value??'').trim();
 const address=value(visit.address);
 // Exact-address query or coordinates are set by the site administrator.
 const destination=value(visit.mapsQuery)||address;
 const name=value(settings.brandName)||'La Vaca Loca Records';
 const generalLocation=value(settings.location)||'Gualaceo, Ecuador';
 const legacyAbout='La Vaca Loca Records es un proyecto independiente en Gualaceo, Ecuador, dedicado a los discos, las sesiones y la cultura musical. Un lugar para explorar sonidos, compartir ideas y descubrir música.';
 const conciseAbout='La Vaca Loca Records es una tienda de discos independiente en Gualaceo, Ecuador. Un espacio dedicado al vinilo, la escucha y la cultura musical.';
 const about=value(visit.about);
 const displayAbout=about===legacyAbout?conciseAbout:about;
 const arrivalNotes=value(visit.reference);
 const phone=value(visit.whatsappNumber||settings.whatsappNumber).replace(/\D/g,'');
 const validPhone=/^[1-9]\d{7,14}$/.test(phone);
 const aboutNode=byId('visitAboutText');
 if(displayAbout&&aboutNode)aboutNode.textContent=displayAbout;
 const addressNode=byId('visitAddress');
 const referenceNode=byId('visitReference');
 if(addressNode)addressNode.textContent=address||generalLocation;
 if(referenceNode)referenceNode.textContent=arrivalNotes;
 const map=byId('visitMap'),mapNote=byId('visitMapNote');
 // Always show a usable regional reference map; never claim that the city-center is the store.
 const embedQuery=destination||generalLocation;
 if(map){
  map.src='https://maps.google.com/maps?q='+encodeURIComponent(embedQuery)+'&output=embed';
  map.title=destination?'Mapa de ubicación de '+name:'Mapa de referencia de '+generalLocation;
 }
 if(destination){
  if(mapNote)mapNote.hidden=true;
  const google='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(destination);
  const apple='https://maps.apple.com/?daddr='+encodeURIComponent(destination);
  for(const [id,url] of [['visitGoogleMaps',google],['visitAppleMaps',apple]]){
   const anchor=byId(id);if(!anchor)continue;
   anchor.href=url;
   anchor.target='_blank';
   anchor.rel='noopener noreferrer';
   anchor.classList.remove('is-unavailable');
   anchor.removeAttribute('aria-disabled');
   anchor.removeAttribute('tabindex');
  }
 }else{
  if(mapNote){mapNote.hidden=false;mapNote.textContent='El mapa muestra '+generalLocation+' como referencia. La ruta al local estará disponible cuando se publique la dirección exacta.';}
  for(const id of ['visitGoogleMaps','visitAppleMaps']){
   const link=byId(id);
   if(link)link.addEventListener('click',event=>event.preventDefault());
  }
 }
 const form=byId('visitForm'),dateInput=byId('visitDate'),status=byId('visitFormStatus'),submit=byId('visitSubmit');
 if(!form)return;
 const todayParts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const part=key=>todayParts.find(item=>item.type===key)?.value||'';
 if(dateInput)dateInput.min=part('year')+'-'+part('month')+'-'+part('day');
 if(!validPhone){
  if(status)status.textContent='Las solicitudes por WhatsApp estarán disponibles próximamente.';
  if(submit){submit.disabled=true;submit.title='Falta configurar el número de WhatsApp del negocio';}
  return;
 }
 const formatDate=iso=>{
  const [year,month,day]=String(iso).split('-').map(Number);
  if(!year||!month||!day)return iso;
  return new Intl.DateTimeFormat('es-EC',{dateStyle:'long',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day)));
 };
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const fields=new FormData(form);
  const preferredDate=value(fields.get('date'));
  if(preferredDate<dateInput.min){dateInput.setCustomValidity('Elige una fecha actual o futura.');dateInput.reportValidity();return}
  dateInput.setCustomValidity('');
  const lines=[
   'Hola, quisiera solicitar una visita a '+name+'.',
   '',
   'Nombre: '+value(fields.get('name')),
   'Fecha preferida: '+formatDate(preferredDate),
   'Horario preferido: '+value(fields.get('time')),
   'Personas: '+value(fields.get('guests'))
  ];
  const note=value(fields.get('note'));
  if(note)lines.push('Mensaje: '+note);
  lines.push('','¿Podemos confirmar disponibilidad? Gracias.');
  const url='https://wa.me/'+phone+'?text='+encodeURIComponent(lines.join('\n'));
  if(status)status.textContent='Se abrirá WhatsApp. Revisa el mensaje y pulsa Enviar para completar tu solicitud.';
  window.location.assign(url);
 });
 if(dateInput)dateInput.addEventListener('input',()=>dateInput.setCustomValidity(''));
})();
