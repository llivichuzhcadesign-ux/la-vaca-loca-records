/* Dates use local calendar days, avoiding timezone shifts. */
(function(){
'use strict';
function parseDate(value){const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value||'');if(!m)return null;const d=new Date(+m[3],+m[2]-1,+m[1]);return d.getFullYear()===+m[3]&&d.getMonth()===+m[2]-1&&d.getDate()===+m[1]?d:null;}
function monthCells(year,month){const offset=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();return Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>i>=offset&&i<offset+days?i-offset+1:null);}
if(typeof module!=='undefined')module.exports={parseDate,monthCells};
if(typeof document==='undefined')return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const events=(window.SITE_CONTENT?.events||[]).filter(e=>!e.hideFromPublic);
const now=new Date();let view=new Date(now.getFullYear(),now.getMonth(),1);
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const grid=document.getElementById('calendarGrid'),dialog=document.getElementById('eventDialog');
function inMonth(e){const d=parseDate(e.date);return d&&d.getFullYear()===view.getFullYear()&&d.getMonth()===view.getMonth();}
function openEvents(items){
 document.getElementById('eventDetails').innerHTML=items.map((e,i)=>'<section><p class="calendar-kicker">'+esc(e.status||'Evento')+'</p><h2'+(i===0?' id="eventTitle"':'')+'>'+esc(e.title)+'</h2><p><strong>'+esc(e.date)+' · '+esc(e.place)+'</strong><br>'+esc(e.time||'Horario por confirmar')+'</p><p>'+esc(e.detail)+'</p></section>').join('');
 if(!dialog.open)dialog.showModal();
}
function render(){
 const year=view.getFullYear(),month=view.getMonth(),items=events.filter(inMonth),cells=monthCells(year,month);
 document.getElementById('monthTitle').innerHTML=months[month]+' <span>'+year+'</span>';
 let out='<table class="month-grid" aria-label="'+months[month]+' '+year+'"><thead><tr>'+['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d=>'<th scope="col">'+d+'</th>').join('')+'</tr></thead><tbody>';
 cells.forEach((day,i)=>{if(i%7===0)out+='<tr>';out+='<td>';if(day){const matches=items.filter(e=>parseDate(e.date).getDate()===day),today=day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear();const tag=matches.length?'button':'span';out+='<'+tag+' class="date-cell'+(today?' today':'')+(matches.length?' has-event':'')+'"'+(matches.length?' data-day="'+day+'" aria-label="'+day+' de '+months[month]+': '+esc(matches.map(e=>e.title).join(', '))+'"':'')+(today?' aria-current="date"':'')+'><b>'+day+'</b>'+(matches.length?'<small>● '+esc(matches[0].title)+(matches.length>1?' +'+(matches.length-1):'')+'</small>':'')+'</'+tag+'>';}out+='</td>';if(i%7===6)out+='</tr>';});
 grid.innerHTML=out+'</tbody></table>';
 document.getElementById('monthNote').textContent=items.length?'Selecciona una fecha marcada para conocer los detalles.':'Sin eventos anunciados para este mes. Las próximas fechas se publicarán aquí.';
 grid.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>openEvents(items.filter(e=>parseDate(e.date).getDate()===+b.dataset.day))));
}
document.getElementById('previousMonth').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render();};
document.getElementById('nextMonth').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render();};
document.getElementById('todayMonth').onclick=()=>{view=new Date(now.getFullYear(),now.getMonth(),1);render();};
document.getElementById('closeEvent').onclick=()=>dialog.close();
const agenda=document.getElementById('eventAgenda');
agenda.innerHTML=events.map((e,i)=>'<button class="agenda-item" data-index="'+i+'"><span><small>'+esc(e.date)+' / '+esc(e.place)+' / '+esc(e.status)+'</small><strong>'+esc(e.title)+'</strong></span><span aria-hidden="true">↗</span></button>').join('')||'<p>Próximas fechas por anunciar.</p>';
agenda.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>{const event=events[+b.dataset.index],date=parseDate(event.date);if(date){view=new Date(date.getFullYear(),date.getMonth(),1);render();}openEvents([event]);});
render();
})();
