(function(root){
 if(!root)return;
 const canvas=document.getElementById('audioWaveform');if(!canvas)return;const ctx=canvas.getContext('2d');let values=null,progress=0,worker=null,frame=0;
 function height(v){return v<=.0001?0:Math.max(0,Math.min(1,(20*Math.log10(v)+48)/48))}
 function draw(){
  frame=0;const box=canvas.getBoundingClientRect(),ratio=Math.min(root.devicePixelRatio||1,2),w=box.width,h=box.height;
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);if(!w)return;
  ctx.fillStyle='#eee3cf18';ctx.fillRect(0,h/2,w,1);if(!values)return;
  const count=Math.max(1,Math.floor(w)),bar=w/count,half=(h-8)/2;
  for(let i=0;i<count;i++){
   const start=Math.floor(i*values.rms.length/count),end=Math.max(start+1,Math.floor((i+1)*values.rms.length/count));let energy=0,peak=0,l=0,m=0,t=0;
   for(let p=start;p<end;p++){energy+=values.rms[p]**2;peak=Math.max(peak,values.peak[p]);l+=values.low[p]**2;m+=values.mid[p]**2;t+=values.high[p]**2}
   const n=end-start,size=height(Math.sqrt(energy/n))*half,outline=height(peak)*half,total=l+m+t||1,played=i/count*100<=progress;
   ctx.globalAlpha=played?.85:.38;ctx.fillStyle='#eee3cf';ctx.fillRect(i*bar,h/2-outline,bar,outline*2);
   ctx.globalAlpha=played?1:.72;
   const bands=[['#bd6857',l],['#d6b67d',m],['#83bcc1',t]];let offset=0;
   for(const [color,band] of bands){const thickness=size*band/total;ctx.fillStyle=color;ctx.fillRect(i*bar,h/2-offset-thickness,bar,thickness);ctx.fillRect(i*bar,h/2+offset,bar,thickness);offset+=thickness}
  }
  ctx.globalAlpha=1;ctx.fillStyle='#ff5aa7';ctx.fillRect(w*progress/100-1,0,2,h);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(draw)}
 root.drawVinylWaveform=value=>{progress=value;schedule()};
 root.addEventListener('vinyl-audio-buffer',e=>{
  worker?.terminate();worker=null;values=null;progress=0;schedule();if(!e.detail)return;
  const buffer=e.detail;worker=new Worker('waveform-analysis.js?v=20261007');
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice());
  worker.onmessage=event=>{values=event.data;worker.terminate();worker=null;schedule()};
  worker.postMessage({channels,sampleRate:buffer.sampleRate,count:Math.min(32768,Math.max(8192,Math.ceil(buffer.duration*40)))},channels.map(a=>a.buffer));
 });
 new ResizeObserver(schedule).observe(canvas);schedule();
})(typeof window==='undefined'?null:window);
