const assert=require('node:assert/strict');
const {filterLibraryRecords}=require('../discos.js');
const records=[{id:'1',title:'Night',artist:'First',label:'LVL',genre:'House'},{id:'2',title:'Pulse',artist:'Second',label:'LVL',genre:'Techno'},{id:'3',title:'Night Drive',artist:'Third',genre:'House'}];
assert.deepEqual(filterLibraryRecords(records,'','').map(r=>r.id),['1','2','3']);
assert.deepEqual(filterLibraryRecords(records,'','',new Set(['2','3'])).map(r=>r.id),['2','3']);
assert.deepEqual(filterLibraryRecords(records,'night','House',new Set(['2','3'])).map(r=>r.id),['3']);
assert.deepEqual(filterLibraryRecords(records,'','Techno',new Set(['3'])),[]);
assert.deepEqual(filterLibraryRecords(records,'','',new Set()),[]);
console.log('PASS: full Biblioteca, liked discs, combined search/genre filtering, empty favorites');
