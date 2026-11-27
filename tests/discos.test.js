const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../discos.js'),media=require('../calendar-content.js');
assert.equal(api.visible({status:'DRAFT'}),false);assert.equal(api.visible({status:'PRIVATE LISTING'}),false);assert.equal(api.visible({hideFromPublic:true}),false);assert.equal(api.visible({status:'SOLD OUT'}),true);
const records=[{id:'1',title:'After Hours',artist:'Night Drivers',genre:'House',price:28,audioPreview:'preview.mp3'},{id:'2',title:'Pulse',artist:'Static',genre:'Techno',price:32}];
assert.equal(api.filterRecords(records,'NIGHT','House').length,1);assert.equal(api.filterRecords(records,'night','Techno').length,0);
assert.equal(api.audioUrl({audioPreview:'javascript:alert(1)'},'https://example.test/'),'');
assert.equal(api.audioUrl({audioPreview:'https://youtu.be/123'},'https://example.test/'),'');
assert.equal(api.audioUrl(records[0],'https://example.test/'),'https://example.test/preview.mp3');
assert.equal(api.time(65),'1:05');assert.equal(api.time(NaN),'0:00');
// Current UI interactions are tested in library-navigation, ios-player, responsive-layout and discos-experience.
// The pre-modular mock no longer represented the real DOM; keep the pure playback contract here.
assert.equal(api.audioUrl({media:{audio:{url:'https://example.test/media/audio.mp3'}}},'https://example.test/'),'https://example.test/media/audio.mp3?audioSeek=2');
assert.equal(api.audioUrl({},'https://example.test/'),'');
assert.equal(api.visible({status:'HIDDEN'}),false);
assert.equal(api.stockCount({stock:0}),0);
console.log('PASS: visibility, filters, safe audio URLs, time and stock');
