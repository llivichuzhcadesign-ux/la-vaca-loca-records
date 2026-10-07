(function(root){
 if(!root)return;
 const canvas=document.getElementById('audioWaveform');if(!canvas)return;const ctx=canvas.getContext('2d');let values=null,progress=0,worker=null,frame=0,duration=0,reference=1;
 const detail=document.getElementById('waveformDetail'),panel=document.getElementById('waveformDetailPanel'),toggle=document.getElementById('waveformDetailToggle');let windowStart=0,windowLength=10;
 function height(v,reference){return Math.pow(Math.min(1,Math.max(0,v/(reference||1))),.9)}
 function draw(){
  frame=0;drawDetail();const box=canvas.getBoundingClientRect(),ratio=Math.min(root.devicePixelRatio||1,2),w=box.width,h=box.height;
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);if(!w)return;
  ctx.fillStyle='#eee3cf18';ctx.fillRect(0,h/2,w,1);if(!values)return;
  const count=Math.max(1,Math.floor(w/2.5)),bar=w/count,half=(h-8)/2;
  const columns=[];
  for(let i=0;i<count;i++){
   const start=Math.floor(i*values.rms.length/count),end=Math.min(values.rms.length,Math.max(start+1,Math.floor((i+1)*values.rms.length/count)));let energy=0,peak=0;
   for(let p=start;p<end;p++){energy+=values.rms[p]**2;peak=Math.max(peak,values.peak[p])}
   columns.push({rms:Math.sqrt(energy/Math.max(1,end-start)),peak});
  }
  const sorted=columns.map(c=>c.rms).sort((a,b)=>a-b);reference=Math.max(.015,sorted[Math.floor((sorted.length-1)*.98)]*1.15);
  for(let i=0;i<count;i++){
   const {rms,peak}=columns[i],size=height(rms,reference)*half,played=i/count*100<=progress,x=i*bar,width=Math.max(1,bar-.8);
   const crest=Math.max(size,Math.min(half,size+(height(peak,1)*half-size)*.22));
   ctx.globalAlpha=played?.45:.2;ctx.fillStyle='#eee3cf';
   if(rms>.0001)ctx.fillRect(x,h/2-crest,width,crest*2);
   ctx.globalAlpha=played?1:.72;ctx.fillStyle=played?'#e5c89b':'#b99c77';
   if(size>.05)ctx.fillRect(x,h/2-size,width,size*2);
  }
  ctx.globalAlpha=1;ctx.fillStyle='#ff5aa7';ctx.fillRect(w*progress/100-1,0,2,h);
 }
 function time(seconds){return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0')}
 function drawDetail(){
  if(!detail||panel.hidden)return;
  const box=detail.getBoundingClientRect(),w=box.width,h=box.height,ratio=Math.min(root.devicePixelRatio||1,2),ctx=detail.getContext('2d');
  if(detail.width!==Math.round(w*ratio)||detail.height!==Math.round(h*ratio)){detail.width=Math.round(w*ratio);detail.height=Math.round(h*ratio)}
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);if(!values||!duration)return;
  const current=progress/100*duration;windowLength=Math.min(10,duration);windowStart=Math.max(0,Math.min(duration-windowLength,current-windowLength/2));
  document.getElementById('waveformWindowStart').textContent=time(windowStart);document.getElementById('waveformWindowEnd').textContent=time(windowStart+windowLength);
  detail.setAttribute('aria-valuenow',String(progress));detail.setAttribute('aria-valuetext',time(current));
  for(let second=Math.ceil(windowStart);second<windowStart+windowLength;second++){ctx.fillStyle='#eee3cf15';ctx.fillRect((second-windowStart)/windowLength*w,0,1,h)}
  const count=Math.max(1,Math.floor(w/2));
  for(let i=0;i<count;i++){
   const t=windowStart+i/count*windowLength,index=Math.min(values.rms.length-1,Math.floor(t/duration*values.rms.length));
   const size=height(values.rms[index],reference)*(h-12)/2,peak=Math.max(size,height(values.peak[index],1)*(h-12)/2);
   ctx.fillStyle='#eee3cf30';ctx.fillRect(i/count*w,h/2-peak,1,peak*2);ctx.fillStyle=t<=current?'#e5c89b':'#b99c77';ctx.fillRect(i/count*w,h/2-size,1.5,size*2);
  }
  ctx.fillStyle='#ff5aa7';ctx.fillRect((current-windowStart)/windowLength*w-1,0,2,h);
 }
 if(toggle){
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.textContent=panel.hidden?'Detalle del audio +':'Cerrar detalle −';schedule()};
  let drag=null,rangeStart=0;
  function seekAt(e){const seek=document.getElementById('seek');if(seek.disabled||!duration)return;const box=detail.getBoundingClientRect();seek.value=Math.max(0,Math.min(100,(rangeStart+Math.max(0,Math.min(1,(e.clientX-box.left)/box.width))*windowLength)/duration*100));seek.dispatchEvent(new Event('input',{bubbles:true}))}
  detail.addEventListener('pointerdown',e=>{if(!values||document.getElementById('seek').disabled||e.button>0)return;e.preventDefault();drag=e.pointerId;rangeStart=windowStart;detail.setPointerCapture(e.pointerId);seekAt(e)});
  detail.addEventListener('pointermove',e=>{if(drag===e.pointerId)seekAt(e)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>detail.addEventListener(name,()=>drag=null));
  detail.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||!duration)return;e.preventDefault();const seek=document.getElementById('seek');if(seek.disabled)return;seek.value=e.key==='Home'?0:e.key==='End'?100:Math.max(0,Math.min(100,progress+(e.key==='ArrowRight'?.25:-.25)/duration*100));seek.dispatchEvent(new Event('input',{bubbles:true}))});
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(draw)}
 root.drawVinylWaveform=value=>{progress=value;schedule()};
 root.addEventListener('vinyl-audio-buffer',e=>{
  worker?.terminate();worker=null;values=null;progress=0;schedule();if(!e.detail)return;
  const buffer=e.detail;duration=buffer.duration;worker=new Worker('waveform-analysis.js?v=20261007');
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice());
  worker.onmessage=event=>{values=event.data;worker.terminate();worker=null;schedule()};
  worker.postMessage({channels,sampleRate:buffer.sampleRate,count:Math.min(32768,Math.max(8192,Math.ceil(buffer.duration*40)))},channels.map(a=>a.buffer));
 });
 const observer=new ResizeObserver(schedule);observer.observe(canvas);if(detail)observer.observe(detail);schedule();
})(typeof window==='undefined'?null:window);
