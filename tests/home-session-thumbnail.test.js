const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(require.resolve('../'+p),'utf8');
const app=read('app.js'),css=read('home-flow.refinements.css'),html=read('index.html');
const visible=app.slice(app.indexOf('const visibleItems='),app.indexOf('const recordsSource='));
const code=app.slice(app.indexOf('function youtubeVideoId('),app.indexOf('function enhancePublicSite('));
const data=[{id:'draft',status:'DRAFT',youtubeUrl:'https://youtu.be/aaaaaaaaaaa'},{id:'hidden',hideFromPublic:true,youtubeUrl:'https://youtu.be/bbbbbbbbbbb'},{id:'first',media:{video:{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}}},{id:'later',youtubeUrl:'https://youtu.be/ccccccccccc'}];
function run(items,empty=false){
 const photo={style:{setProperty(k,v){photo[k]=v}},classList:{add(c){photo.className=c}}};
 const images=[];
 class Image{constructor(){images.push(this)}set src(value){this.url=value}}
 const api=new Function('document','SESSIONS','uiEmptyPreview','Image','URL',visible+code+';return {youtubeVideoId,homeSessionThumbnail,setupSessionThumbnail}')({querySelector:()=>photo},items,empty,Image,URL);
 api.setupSessionThumbnail();
 return {api,photo,images};
}
let x=run(data);
assert.equal(x.api.homeSessionThumbnail(data).session.id,'first');
assert.equal(x.api.youtubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=15'),'dQw4w9WgXcQ');
assert.equal(x.api.youtubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
assert.equal(x.api.youtubeVideoId('https://evil.test/watch?v=dQw4w9WgXcQ'),'');
assert.equal(x.images[0].url,'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
x.images[0].naturalWidth=120;x.images[0].naturalHeight=90;x.images[0].onload();
assert.match(x.images[1].url,/sddefault.jpg$/);
x.images[1].onerror();assert.match(x.images[2].url,/hqdefault.jpg$/);
x.images[2].naturalWidth=480;x.images[2].naturalHeight=360;x.images[2].onload();
assert.equal(x.photo.className,'has-session-thumbnail');
assert.match(x.photo['--home-session-thumbnail'],/hqdefault.jpg/);
assert.equal(run(data,true).images.length,0);
assert.equal(run([{id:'no-video'}]).images.length,0);
assert.equal(run([{id:'no-video'},data[2]]).api.homeSessionThumbnail([{id:'no-video'},data[2]]).session.id,'first');
assert.match(css,/sessions-photo.has-session-thumbnail\{background-image:.*var\(--home-session-thumbnail\)/);
assert.match(html,/app\.js\?v=20261126-session-thumb-v1/);
console.log('PASS: first public YouTube session, safe video IDs, thumbnail quality fallback and no-content fallback');
