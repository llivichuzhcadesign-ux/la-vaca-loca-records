const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');

const eventsCode=read('eventos.js');
const now=new Date(),date='15.'+String(now.getMonth()+1).padStart(2,'0')+'.'+now.getFullYear();
const nodes={};
for(const id of ['monthTitle','calendarGrid','monthNote','calendarMobileEvents','previousMonth','nextMonth','todayMonth','closeEvent','eventAgenda','eventDetails','eventDialog']){
 nodes[id]={innerHTML:'',textContent:'',hidden:false,querySelectorAll:()=>[],showModal(){this.open=true},close(){this.open=false}};
}
const context={
 window:{SITE_CONTENT:{events:[{id:'gig-1',title:'Noches de Vinilo',date,time:'21:00',place:'Gualaceo',status:'Live',detail:'Escucha'}]},
  CalendarContent:{visibleEvent:event=>!event.hideFromPublic,imageUrl:()=>''}},
 document:{getElementById:id=>nodes[id],querySelectorAll:()=>[],baseURI:'https://test.example/eventos.html'},
 Date
};
vm.runInNewContext(eventsCode,context);
assert.match(nodes.calendarMobileEvents.innerHTML,/mobile-event-card/);
assert.match(nodes.calendarMobileEvents.innerHTML,/Noches de Vinilo/);
assert.match(nodes.calendarMobileEvents.innerHTML,/data-event-index="0"/);
assert.match(nodes.calendarGrid.innerHTML,/has-event/);
assert.equal(nodes.calendarMobileEvents.hidden,false);
nodes.nextMonth.onclick();
assert.equal(nodes.calendarMobileEvents.hidden,true);
nodes.previousMonth.onclick();
assert.equal(nodes.calendarMobileEvents.hidden,false);

const calCss=read('eventos.css'),homeCss=read('home-flow.css'),footerCss=read('footer-sign.css'),theme=read('site-theme.css');
const collage=read('home-collage.js'),footer=read('footer-sign.js');
for(const css of [calCss,homeCss,footerCss,theme])assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
assert.match(calCss,/\.calendar-mobile-events:not\(\[hidden\]\)/);
assert.match(calCss,/\.date-cell\.has-event::after/);
assert.match(calCss,/min-height:44px/);
assert.match(homeCss,/\.memory-collage\.is-paused \.memory-track/);
assert.match(collage,/phoneLayout\.matches\?2:3/);
assert.match(collage,/IntersectionObserver/);
assert.match(collage,/visibilitychange/);
assert.match(footer,/coarsePointer\.matches\?90:/);
assert.match(footer,/coarsePointer\.matches\?30:15/);
assert.match(footer,/syncSocialLinks\(\)/);
assert.match(footer,/DOMContentLoaded',syncSocialLinks/);
assert.match(footerCss,/min-height:44px/);
assert.match(theme,/font-size:16px;min-height:44px/);
console.log('PASS: mobile event cards, month navigation, typography, offscreen image pause, coarse-pointer effects and footer links');
