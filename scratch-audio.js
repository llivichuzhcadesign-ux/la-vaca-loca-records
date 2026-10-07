/* Short overlapping samples follow hand speed, including reverse motion. */
(function(root){
 function position(bufferDuration,playhead,reverse){return Math.max(0,Math.min(bufferDuration-.001,reverse?bufferDuration-playhead:playhead))}
 if(typeof module!=='undefined')module.exports={position};
 if(!root)return;
 root.createVinylScratch=function(audio){
  let context,buffer,reversed,loadedUrl='',pending,bytesPromise;const voices=new Set();let lastGrain=0;
  function url(){return audio.currentSrc||audio.src}
  function preload(){const src=url();if(!src||src===loadedUrl)return;loadedUrl=src;buffer=reversed=null;pending=null;if(root.dispatchEvent)root.dispatchEvent(new root.CustomEvent('vinyl-audio-buffer',{detail:null}));bytesPromise=fetch(src).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer()});bytesPromise.catch(()=>{});}
  audio.addEventListener('loadedmetadata',()=>{preload();prepare(false).catch(()=>{})});
  async function prepare(activate=true){
   const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;
   context=context||new Audio();if(activate)await context.resume();preload();
   if(buffer||pending||!bytesPromise)return pending;
   const src=loadedUrl;
   pending=bytesPromise.then(bytes=>context.decodeAudioData(bytes.slice(0))).then(decoded=>{
    if(src!==loadedUrl)return;
    buffer=decoded;if(root.dispatchEvent)root.dispatchEvent(new root.CustomEvent('vinyl-audio-buffer',{detail:decoded}));reversed=context.createBuffer(decoded.numberOfChannels,decoded.length,decoded.sampleRate);
    for(let c=0;c<decoded.numberOfChannels;c++){const from=decoded.getChannelData(c),to=reversed.getChannelData(c);for(let i=0;i<from.length;i++)to[i]=from[from.length-1-i]}
   }).catch(()=>{}).finally(()=>{if(src===loadedUrl)pending=null});return pending;
  }
  function move(playhead,speed){
   if(!context||!buffer||context.state!=='running'||Math.abs(speed)<.03)return;
   const now=context.currentTime;if(now-lastGrain<.018)return;lastGrain=now;
   const backwards=speed<0,rate=Math.max(.08,Math.min(12,Math.abs(speed)));
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=backwards?reversed:buffer;source.playbackRate.value=rate;
   const offset=position(buffer.duration,playhead,backwards),duration=Math.min(.075,(buffer.duration-offset)/rate);if(duration<=.005)return;
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(audio.muted?0:audio.volume*.65,now+.006);gain.gain.setValueAtTime(audio.muted?0:audio.volume*.65,now+Math.max(.006,duration-.018));gain.gain.linearRampToValueAtTime(0,now+duration);
   source.connect(gain);gain.connect(context.destination);source.start(now,offset);source.stop(now+duration);voices.add({source,gain});source.onended=()=>{for(const voice of voices)if(voice.source===source)voices.delete(voice);source.disconnect();gain.disconnect()};
  }
  function stop(){if(!context)return;for(const {source,gain} of voices){gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(0,context.currentTime,.004);try{source.stop(context.currentTime+.02)}catch{}}lastGrain=0}
  return {prepare,move,stop};
 };
})(typeof window==='undefined'?null:window);
