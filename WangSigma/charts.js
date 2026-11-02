(function(root){
const fmt=x=>typeof x==='number'?(x===0?'0':Math.abs(x)<.0001||Math.abs(x)>=1e6?x.toExponential(3):Number(x.toPrecision(6)).toLocaleString('en-US',{maximumFractionDigits:6})):String(x??'N/A');
function renderChart(ch,options={}){
 const count=ch.values?.length||0,wide=['bar','histogram','pareto'].includes(ch.kind)&&count>20,W=wide?Math.min(18000,Math.max(850,count*36)):900,H=420,scale=W>3000?1:2;
 const canvas=document.createElement('canvas');canvas.width=W*scale;canvas.height=H*scale;canvas.style.width=W+'px';canvas.style.maxWidth=wide?'none':'100%';canvas.style.height='auto';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',ch.title+'. Numerical values are available in the adjacent results table.');
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#fff';c.fillRect(0,0,W,H);const color=options.color||ch.color||'#247c88';c.font='600 18px system-ui';c.fillStyle='#183b45';c.fillText(String(options.title||ch.title).slice(0,95),28,30);c.font='12px system-ui';
 const pad={l:76,r:ch.kind==='pareto'?65:32,t:65,b:100},w=W-pad.l-pad.r,h=H-pad.t-pad.b;
 const label=(s,x,y,align='center',color='#48616b')=>{c.fillStyle=color;c.textAlign=align;c.fillText(String(s),x,y);};
 if(ch.kind==='pie'){
 const total=ch.values.reduce((a,b)=>a+b,0);let start=-Math.PI/2;const cx=300,cy=220,r=140;ch.values.forEach((v,i)=>{const angle=v/total*2*Math.PI;c.fillStyle=`hsl(${(i*137.508+185)%360} 55% 45%)`;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,r,start,start+angle);c.fill();if(v/total>.025)label((v/total*100).toFixed(1)+'%',cx+Math.cos(start+angle/2)*r*.7,cy+Math.sin(start+angle/2)*r*.7,'center','#fff');if(i<15&&options.legend!==false){c.fillRect(520,74+i*19,11,11);label(String(ch.labels[i]).slice(0,28)+': '+fmt(v),540,85+i*19,'left');}start+=angle;});if(ch.values.length>15)label('All categories are listed in the results table.',520,390,'left');
 }else if(ch.kind==='box'){
 const vals=ch.five,lo=vals[0],hi=vals[4],span=hi-lo||1,X=x=>pad.l+(x-lo)/span*w;const y=200;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(X(ch.whiskers[0]),y);c.lineTo(X(ch.whiskers[1]),y);c.stroke();c.fillStyle='#d5ecee';c.fillRect(X(vals[1]),150,Math.max(2,X(vals[3])-X(vals[1])),100);c.strokeRect(X(vals[1]),150,Math.max(2,X(vals[3])-X(vals[1])),100);for(const v of [ch.whiskers[0],ch.whiskers[1],vals[2]]){c.beginPath();c.moveTo(X(v),v===vals[2]?150:178);c.lineTo(X(v),v===vals[2]?250:222);c.stroke();}for(const v of ch.outliers){c.beginPath();c.arc(X(v),y,3,0,Math.PI*2);c.stroke();}vals.forEach((v,i)=>label(['Min','Q1','Median','Q3','Max'][i]+': '+fmt(v),50+i*180,330,'left'));
 }else{
 const ys=ch.values||[],xs=ch.xs||ys.map((_,i)=>i),isXY=['scatter','regression'].includes(ch.kind)||(['line','ogive'].includes(ch.kind)&&ch.xs),allY=ch.fitted?ys.concat(ch.fitted):ys;
 let ymin=allY.reduce((m,v)=>Math.min(m,v),0),ymax=allY.reduce((m,v)=>Math.max(m,v),0);if(ymax===ymin)ymax=ymin+1;const yspan=ymax-ymin;ymax+=yspan*.18;let xmin=isXY?xs.reduce((m,v)=>Math.min(m,v),Infinity):0,xmax=isXY?xs.reduce((m,v)=>Math.max(m,v),-Infinity):count;const X=x=>pad.l+(x-xmin)/(xmax-xmin||1)*w,Y=y=>pad.t+h-(y-ymin)/(ymax-ymin)*h;
 c.strokeStyle='#e3ecee';c.lineWidth=1;for(let i=0;i<=5;i++){const val=ymin+(ymax-ymin)*i/5,y=Y(val);c.beginPath();c.moveTo(pad.l,y);c.lineTo(W-pad.r,y);c.stroke();label(fmt(val),pad.l-10,y+4,'right');}
 c.strokeStyle='#8ba3aa';c.beginPath();c.moveTo(pad.l,pad.t);c.lineTo(pad.l,pad.t+h);c.lineTo(W-pad.r,pad.t+h);c.stroke();
 if(isXY){
 if(ch.kind==='line'||ch.kind==='ogive'){c.strokeStyle=color;c.lineWidth=2;c.beginPath();ys.forEach((y,i)=>{const x=X(xs[i]);i?c.lineTo(x,Y(y)):c.moveTo(x,Y(y));});c.stroke();}
 else{c.fillStyle=color;c.globalAlpha=.7;ys.forEach((y,i)=>{c.beginPath();c.arc(X(xs[i]),Y(y),count>2000?1.5:3,0,7);c.fill();});c.globalAlpha=1;if(ch.fitted){const indices=xs.map((_,i)=>i).sort((a,b)=>xs[a]-xs[b]);c.strokeStyle='#c65e36';c.lineWidth=2;c.beginPath();indices.forEach((i,k)=>k?c.lineTo(X(xs[i]),Y(ch.fitted[i])):c.moveTo(X(xs[i]),Y(ch.fitted[i])));c.stroke();}}
 for(let i=0;i<=6;i++){const v=xmin+(xmax-xmin)*i/6;label(fmt(v),X(v),pad.t+h+24);}if(ch.fitted&&options.legend!==false){label('● Observed   ━ Fitted',W-pad.r,53,'right');}
 }else{
 const step=w/Math.max(count,1);c.fillStyle=color;ys.forEach((y,i)=>{const x=pad.l+i*step,bar=ch.touching?step:step*.68;if(ch.kind==='line'||ch.kind==='ogive'){c.strokeStyle=color;c.lineWidth=2;c.beginPath();if(i)c.moveTo(x-step/2,Y(ys[i-1]));else c.moveTo(x+step/2,Y(y));c.lineTo(x+step/2,Y(y));c.stroke();}else {c.fillStyle=color;c.fillRect(x+(step-bar)/2,Y(Math.max(0,y)),Math.max(1,bar),Math.max(1,Math.abs(Y(y)-Y(0))));}if(ch.probability&&count<=500){label(fmt(y),x+step/2,Y(y)-7);}if(count<=25||wide||i%Math.ceil(count/15)===0){c.save();c.font='normal 12px system-ui';c.textAlign='center';c.fillStyle='#48616b';let remaining=String(ch.labels[i]),lines=[];const available=Math.max(12,step-6);while(remaining&&lines.length<3){let length=remaining.length;while(length>1&&c.measureText(remaining.slice(0,length)).width>available)length--;if(lines.length===2&&length<remaining.length){let last=remaining.slice(0,length);while(last.length>1&&c.measureText(last+'…').width>available)last=last.slice(0,-1);lines.push(last+'…');remaining='';}else{lines.push(remaining.slice(0,length));remaining=remaining.slice(length).trimStart();}}lines.forEach((text,line)=>c.fillText(text,x+step/2,pad.t+h+18+line*14));c.restore();}});
 if(ch.kind==='pareto'){const total=ys.reduce((a,b)=>a+b,0);let cum=0;c.strokeStyle='#c65e36';c.lineWidth=2;c.beginPath();ys.forEach((v,i)=>{cum+=v;const x=pad.l+(i+.5)*step,y=pad.t+h-h*cum/total;i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();[0,25,50,75,100].forEach(v=>label(v+'%',W-pad.r+8,pad.t+h-h*v/100+4,'left'));if(options.legend!==false)label('Bars: '+(ch.unit||'value')+'   Line: cumulative %',W-pad.r,53,'right');}
 }
 if(options.xLabel)label(options.xLabel,pad.l+w/2,H-10);c.save();c.translate(18,pad.t+h/2);c.rotate(-Math.PI/2);label(options.yLabel||ch.unit||'Value',0,0);c.restore();
 }
 return canvas;
}
root.WCharts={renderChart,fmt};
})(globalThis);
