const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(require.resolve('../'+p),'utf8');
const source=read('editorial.js'),app=read('app.js'),home=read('index.html');
const data={sessions:[
{id:'old',title:'Earlier session',date:'2025-01-02',detail:'Earlier description'},
{id:'latest',title:'Latest <session>',artist:'Guest DJ',date:'03.02.2026',detail:'Description',media:{video:{youtubeUrl:'https://youtu.be/dQw4w9WgXcQ'},audio:{url:'https://example.test/audio.mp3'}},relatedRecords:['public','draft']},
{id:'hidden',title:'Hidden session',status:'Draft'},
{id:'undated',title:'Undated session',date:'Próximamente',media:{hero:{path:'demo.jpg'}}}
],records:[{id:'public',title:'Public record',artist:'Artist'},{id:'draft',title:'Draft record',status:'DRAFT'}],archiveItems:[
{id:'a',title:'A photograph',media:{image:{url:'https://example.test/photo.jpg',alt:'A room',caption:'Photo credit'}},detail:'Story',relatedSession:'latest'},
{id:'b',title:'Another entry',media:{image:{path:'demo.jpg'}}},
{id:'c',title:'Hidden archive',hideFromPublic:true}
]};
function render(page,search=''){
 const nodes={pageIndex:{},pageContent:{}};
 new Function('window','document','location','URL','URLSearchParams',source)({SITE_CONTENT:data},{body:{dataset:{page}},getElementById:id=>nodes[id]},{href:'https://example.test/'+page+'.html'+search,search,hash:''},URL,URLSearchParams);
 return nodes;
}
const session=render('sessions').pageContent.innerHTML;
assert.ok(session.indexOf('id="latest"')<session.indexOf('id="old"'));
assert.ok(session.indexOf('id="old"')<session.indexOf('id="undated"'));
assert.match(session,/youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
assert.match(session,/Guest DJ/);assert.match(session,/Latest &lt;session&gt;/);
assert.ok(session.indexOf('session-video')<session.indexOf('entry-description">Description'));
assert.match(session,/discos\.html\?disc=public/);
assert.doesNotMatch(session,/Draft record|Hidden session|demo\.jpg/);
const archive=render('archivo').pageContent.innerHTML;
assert.match(archive,/<figure class="editorial-photo">/);assert.match(archive,/<figcaption>Photo credit/);
assert.match(archive,/sessions\.html#latest/);assert.doesNotMatch(archive,/Hidden archive|demo\.jpg/);
const empty=render('sessions','?ui-preview=empty');
assert.equal(empty.pageIndex.hidden,true);assert.match(empty.pageContent.innerHTML,/VISTA DE DISEÑO/);
assert.doesNotMatch(empty.pageContent.innerHTML,/iframe|Latest/);
for(const id of ['lvlHeroPrevious','lvlHeroNext','lvlHeroPause','lvlHeroControls'])assert.match(home,new RegExp('id="'+id+'"'));
assert.match(home,/home-visit-strip/);
assert.match(app,/document\.addEventListener\('visibilitychange',syncHeroTimer\)/);
assert.match(app,/controls\.hidden=slideEls\.length<2/);
assert.match(app,/if\(!paused&&!document\.hidden&&slideEls\.length>1\)/);
assert.match(read('visitanos.js'),/Horario preferido \(Ecuador\)/);
console.log('PASS: chronological editorial entries, safe visible content, media-first sessions, related records, photographic captions, honest empty state and hero controls');
