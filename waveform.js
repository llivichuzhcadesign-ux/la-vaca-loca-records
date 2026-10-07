(function(root){
 function peaks(buffer,count=600){
  const result=new Float32Array(count);const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  for(let bin=0;bin<count;bin++){
   const start=Math.floor(bin*buffer.length/count),end=Math.floor((bin+1)*buffer.length/count);let sum=0,n=0,peak=0;
   for(const samples of channels)for(let i=start;i<end;i++){const v=Math.abs(samples[i]);sum+=v*v;peak=Math.max(peak,v);n++}
   result[bin]=n?Math.sqrt(sum/n)*.75+peak*.25:0;
  }
  const max=Math.max(...result);if(max)for(let i=0;i<count;i++)result[i]/=max;return result;
 }
 if(typeof module!=='undefined')module.exports={peaks};if(!root)return;
 const canvas=document.getElementById('audioWaveform');if(!canvas)return;const ctx=canvas.getContext('2d');let values=null,progress=0;
 function draw(){
  const box=canvas.getBoundingClientRect(),ratio=Math.min(root.devicePixelRatio||1,2);canvas.width=Math.round(box.width*ratio);canvas.height=Math.round(box.height*ratio);ctx.scale(ratio,ratio);
  const w=box.width,h=box.height;ctx.clearRect(0,0,w,h);if(!w)return;
  if(!values){ctx.strokeStyle='#eee3cf33';ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();return}
  const count=Math.floor(w/3),bar=w/count;
  for(let i=0;i<count;i++){
   const start=Math.floor(i*values.length/count),end=Math.max(start+1,Math.floor((i+1)*values.length/count));let height=0;for(let p=start;p<end;p++)height=Math.max(height,values[p]||0);
   const size=Math.max(1,height*(h-8));ctx.fillStyle=i/count*100<=progress?'#f0dfbd':'#9f8876';ctx.fillRect(i*bar,(h-size)/2,Math.max(1,bar-1),size);
  }
  ctx.fillStyle='#ff5aa7';ctx.fillRect(w*progress/100-1,0,2,h);
 }
 root.drawVinylWaveform=value=>{progress=value;draw()};
 root.addEventListener('vinyl-audio-buffer',e=>{values=e.detail?peaks(e.detail):null;progress=0;draw()});
 new ResizeObserver(draw).observe(canvas);draw();
})(typeof window==='undefined'?null:window);
