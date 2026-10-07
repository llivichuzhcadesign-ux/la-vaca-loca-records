const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{
 const sources=[];const data=new Float32Array([1,2,3,4]);
 const original={duration:1,numberOfChannels:1,length:4,sampleRate:4,getChannelData:()=>data};
 class Context{constructor(){this.currentTime=1;this.state='running';this.destination={}}resume(){return Promise.resolve()}decodeAudioData(){return Promise.resolve(original)}createBuffer(){const a=new Float32Array(4);return{duration:1,getChannelData:()=>a}}createBufferSource(){const s={playbackRate:{},connect(){},disconnect(){},start(t,o){this.offset=o},stop(){}};sources.push(s);return s}createGain(){return{connect(){},disconnect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}}}}}
 const window={AudioContext:Context};const context={window,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}),Float32Array};vm.createContext(context);vm.runInContext(fs.readFileSync('scratch-audio.js','utf8'),context);
 const engine=window.createVinylScratch({src:'song.mp3',volume:1,muted:false,addEventListener(){}});await engine.prepare();engine.move(.25,-2);
 assert.equal(sources[0].playbackRate.value,2);assert.equal(sources[0].offset,.75);assert.deepEqual(Array.from(sources[0].buffer.getChannelData(0)),[4,3,2,1]);engine.stop();engine.move(.25,1);assert.equal(sources[1].buffer,original);assert.equal(sources[1].offset,.25);engine.stop();console.log('PASS: song samples reverse correctly, hand speed controls rate, forward position matches timeline');
})().catch(e=>{console.error(e);process.exitCode=1});
