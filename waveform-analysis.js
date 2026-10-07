(function(){
 function analyze(channels,sampleRate,count=8192){
  const length=channels[0]?.length||0;count=Math.max(1,Math.min(count,length||1));
  const peak=new Float32Array(count),rms=new Float32Array(count),low=new Float32Array(count),mid=new Float32Array(count),high=new Float32Array(count);
  const a=1-Math.exp(-2*Math.PI*180/sampleRate),b=1-Math.exp(-2*Math.PI*2500/sampleRate);
  const lows=new Float64Array(channels.length),smooth=new Float64Array(channels.length);
  for(let bin=0;bin<count;bin++){
   const start=Math.floor(bin*length/count),end=Math.floor((bin+1)*length/count);let energy=0,le=0,me=0,he=0,max=0;
   for(let i=start;i<end;i++)for(let c=0;c<channels.length;c++){
    const v=channels[c][i];lows[c]+=a*(v-lows[c]);smooth[c]+=b*(v-smooth[c]);
    const m=smooth[c]-lows[c],h=v-smooth[c];energy+=v*v;le+=lows[c]*lows[c];me+=m*m;he+=h*h;max=Math.max(max,Math.abs(v));
   }
   const n=(end-start)*channels.length||1;peak[bin]=max;rms[bin]=Math.sqrt(energy/n);low[bin]=Math.sqrt(le/n);mid[bin]=Math.sqrt(me/n);high[bin]=Math.sqrt(he/n);
  }
  return {peak,rms,low,mid,high};
 }
 if(typeof module!=='undefined')module.exports={analyze};
 else self.onmessage=e=>{const data=analyze(e.data.channels,e.data.sampleRate,e.data.count);self.postMessage(data,Object.values(data).map(a=>a.buffer))};
})();
