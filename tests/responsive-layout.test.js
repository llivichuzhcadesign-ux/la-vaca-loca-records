const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../discos.js'),'utf8');
const from=source.indexOf('function applyResponsiveLayout('),to=source.indexOf('applyResponsiveLayout(iosDiscView,true)',from);
const calls=[],classes=new Set(),style={removeProperty(){}};
function node(name){return {name,hidden:false,style,contains:()=>false,querySelector:()=>node('child'),append:(...items)=>calls.push(name+':append:'+items.map(x=>x.name).join(',')),prepend(){},after:x=>calls.push(name+':after:'+x.name),insertBefore(){},setAttribute(){},removeAttribute(){},focus(){}}}
const body={classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k),remove:k=>classes.delete(k)},dataset:{},style};
const ctx={iosDiscView:false,document:{activeElement:null,documentElement:{classList:body.classList},body,querySelector:()=>node('rail')},iosSheet:node('sheet'),transport:node('transport'),miniSeek:node('seek'),desktopToggle:node('toggle'),selectionPanel:node('selection'),timelineDeck:node('deck'),turntableToggle:node('turntable'),actions:node('actions'),actionsAnchor:node('action-anchor'),toggleAnchor:node('toggle-anchor'),deckAnchor:node('deck-anchor'),miniPlayer:node('mini'),miniPlay:node('play'),playbackTimeline:node('timeline'),openButton:node('open'),collectionPanel:node('collection'),audio:{paused:false,currentTime:23},pendingRecord:{id:'a'},$ :()=>node('stage'),setSheetPosition(){},setSheetMode(){},arrangeLibrary(){},setDiscView(){},syncIosJackets(){},renderGallery(){},requestAnimationFrame:f=>f(),syncDeckTimeline(){}};
vm.createContext(ctx);vm.runInContext(source.slice(from,to),ctx);
ctx.applyResponsiveLayout(false,true);assert.equal(ctx.iosSheet.hidden,true);assert.equal(ctx.transport.hidden,false);
ctx.applyResponsiveLayout(true);assert.equal(ctx.iosDiscView,true);assert.equal(ctx.iosSheet.hidden,false);assert.equal(ctx.transport.hidden,true);assert.ok(classes.has('mobile-disc-view'));assert.ok(calls.includes('child:append:selection,deck'));
const before=calls.length;ctx.applyResponsiveLayout(true);assert.equal(calls.length,before);
ctx.applyResponsiveLayout(false);assert.equal(ctx.iosDiscView,false);assert.ok(!classes.has('mobile-disc-view'));assert.equal(ctx.miniSeek.hidden,true);assert.ok(calls.includes('deck-anchor:after:deck'));assert.ok(calls.includes('mini:append:timeline'));assert.equal(ctx.audio.currentTime,23);assert.equal(ctx.audio.paused,false);
console.log('PASS: desktop-to-compact-to-desktop moves player nodes without touching audio state');
