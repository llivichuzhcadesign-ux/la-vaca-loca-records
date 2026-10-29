const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');

const js=read('discos.js'),css=read('discos.css'),theme=read('site-theme.css'),header=read('ios-header.js');
const from=js.indexOf('const appleTouch='),to=js.indexOf('const viewStorageKey=',from);
assert.ok(from>=0&&to>from,'mobile device gate exists');
const gate=js.slice(from,to);
function evaluate(userAgent,phoneWidth){
 const classes=[];
 const context={
  navigator:{userAgent,platform:'',maxTouchPoints:0},
  window:{matchMedia:query=>({matches:query.includes('max-width')?phoneWidth:false})},
  document:{documentElement:{classList:{add:name=>classes.push(name)}}}
 };
 vm.createContext(context);vm.runInContext(gate,context);
 return {selected:vm.runInContext('iosDiscView',context),classes};
}
assert.equal(evaluate('Mozilla/5.0 (Linux; Android 15)',true).selected,true);
assert.deepEqual(evaluate('Mozilla/5.0 (Linux; Android 15)',true).classes,['mobile-disc-view']);
assert.equal(evaluate('Mozilla/5.0 (Linux; Android 15)',false).selected,false);
assert.equal(evaluate('Mozilla/5.0 (iPhone; CPU iPhone OS 18)',false).selected,true);
assert.equal(evaluate('Mozilla/5.0 (Windows NT 10.0)',true).selected,true);
assert.equal(evaluate('Mozilla/5.0 (Windows NT 10.0)',false).selected,false);

// Every former Apple-only player layout selector has a platform-neutral equivalent.
assert.ok((css.match(/:is\(\.ios-header,\.mobile-disc-view\)/g)||[]).length>=70);
assert.match(css,/:is\(\.ios-header,\.mobile-disc-view\) \.layered-ios-player \.library-mini-player/);
assert.match(css,/:is\(\.ios-header,\.mobile-disc-view\) \.expanded-library \.biblioteca-sidebar/);
assert.match(css,/footer\.illuminated-footer\{\s*padding-bottom:calc\(128px/);
assert.match(css,/\.library-cover-card\{\s*flex:0 0 clamp\(112px,34vw,152px\)/);
assert.match(js,/if\(push&&window\.innerWidth<=950\)collectionPanel\.scrollIntoView/);
assert.match(theme,/@media\(min-width:801px\) and \(max-width:950px\)/);
assert.match(theme,/header \.lvl-brand-trigger::after/);
assert.match(header,/event\.key!=='ArrowDown'/);
assert.match(header,/dropdown\.querySelector\('a'\)\?\.focus\(\)/);
console.log('PASS: iOS and Android use one mobile player, consistent CSS and responsive header, safe footer and no initial page jump');
