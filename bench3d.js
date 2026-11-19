// Interactive perspective projection. Objects and line segments share a depth-sorted draw list.
function physicalBench(figure,kind){
  const flat=figure.querySelector('svg'),caption=figure.querySelector('figcaption'),flatText=caption.textContent;
  const toolbar=document.createElement('div');toolbar.className='benchTools';
  toolbar.innerHTML='<strong>Vista del montaje</strong><button type="button" data-mode="3d" aria-pressed="true">3D</button><button type="button" data-mode="2d" aria-pressed="false">Esquema 2D</button><button type="button" data-center>Centrar vista</button>';
  const canvas=document.createElement('canvas');canvas.className='benchCanvas';canvas.tabIndex=0;canvas.setAttribute('aria-label',kind==='cap'?'Capacitor tridimensional de placas paralelas':'Montaje tridimensional del circuito');
  figure.prepend(toolbar);flat.before(canvas);
  const ctx=canvas.getContext('2d'),model={},reduce=matchMedia('(prefers-reduced-motion:reduce)');
  let yaw=-.32,pitch=.63,view3=true,raf=0,last=0,time=0,drag=null,geo=null,commands=[],width=1,height=1,scale=1;
  const hint='Arrastra para girar el montaje o usa las flechas del teclado.';
  function select(active){view3=active;flat.style.display=active?'none':'block';canvas.hidden=!active;toolbar.querySelector('[data-center]').hidden=!active;
    toolbar.querySelectorAll('[data-mode]').forEach(btn=>btn.setAttribute('aria-pressed',String((btn.dataset.mode==='3d')===active)));caption.textContent=active?hint:flatText}
  toolbar.onclick=e=>{if(e.target.dataset.mode)select(e.target.dataset.mode==='3d');else if(e.target.hasAttribute('data-center')){yaw=-.32;pitch=.63}};
  function rotate(dx,dy){yaw+=dx;pitch=Math.max(.10,Math.min(1.35,pitch+dy))}
  canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(drag){rotate((e.clientX-drag[0])*.009,(e.clientY-drag[1])*.009);drag=[e.clientX,e.clientY]}};
  canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
  canvas.onkeydown=e=>{if(e.key.startsWith('Arrow')){e.preventDefault();rotate(({ArrowLeft:-.1,ArrowRight:.1})[e.key]||0,({ArrowUp:.1,ArrowDown:-.1})[e.key]||0)}};
  let cy,sy,cp,sp;
  function project([x,y,z]){const a=x*cy-z*sy,b=x*sy+z*cy,depth=b*cp+y*sp,k=scale*18/(18-depth);return [width/2+a*k,height*.52-(y*cp-b*sp)*k,depth]}
  function face(pts,color,edge){const p=pts.map(project);commands.push([p.reduce((sum,v)=>sum+v[2],0)/p.length,()=>{ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=.8;ctx.stroke()}])}
  function box(x,y,z,a,b,c,colors){
    const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([i,j,k])=>[x+i*a/2,y+j*b/2,z+k*c/2]);
    [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]].forEach((f,i)=>face(f.map(n=>v[n]),colors[[1,0,1,2,1,0][i]],colors[3]))}
  function segment(a,b,color,weight){const p=project(a),q=project(b);commands.push([(p[2]+q[2])/2,()=>{ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.lineCap='round';ctx.stroke()}])}
  function lamp(point,color,size){const p=project(point);commands.push([p[2]+.02,()=>{ctx.beginPath();ctx.arc(p[0],p[1],size,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}])}
  function tag(point,text,color){const p=project(point);commands.push([25,()=>{ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#081922';ctx.strokeText(text,p[0],p[1]);ctx.fillStyle=color;ctx.fillText(text,p[0],p[1])}])}
  const teal=['#387e86','#2c646b','#69b9bd','#7dc4c155'], copper=['#a86b46','#845033','#efad79','#ffd0a755'],glass=['#9a83ed80','#8272db5c','#b3a1ed9c','#cdbfffaa'];
  function capacitor(dt){const desired=[1.3+Math.sqrt(model.area)*.16,.60+model.gap*.13,model.k>1?1:0];if(!geo)geo=desired.slice();const mix=reduce.matches?1:1-Math.exp(-dt*12);
    desired.forEach((v,i)=>geo[i]+=(v-geo[i])*mix);
    const [side,g,diel]=geo;
    for(const s of [-1,1]){box(s*g,0,0,.13,side,side,s<0?copper:teal);tag([s*g,side*.54,0],s<0?'+':'−',s<0?'#ffb483':'#85ddfb')}
    if(diel>.004)box(0,(1-diel)*(side+1),0,.15,side*.93,side*.93,glass);
    if(model.v>0)for(const j of [-.33,0,.33])for(const k of [-.33,0,.33]){const y=j*side,z=k*side;segment([-g+.08,y,z],[g-.08,y,z],'#87ebc688',1);const u=(time*(.24+.016*model.v)+(j+k+1)*.31)%1;lamp([(2*u-1)*(g-.1),y,z],'#afffe2',2);segment([g-.24,y+.07,z],[g-.08,y,z],'#a9f8ce',1.3);segment([g-.24,y-.07,z],[g-.08,y,z],'#a9f8ce',1.3)}
  }
  function circuit(){const {values,ii,mode,V,I}=model,y=.15,left=-3.5,right=3.5,front=1.7,back=-1.7;
    function wire(x,z,X,Z,current){
      const distance=Math.hypot(X-x,Z-z);if(distance<.001)return;
      const steps=Math.ceil(distance/.35);for(let j=0;j<steps;j++)segment([x+(X-x)*j/steps,y,z+(Z-z)*j/steps],[x+(X-x)*(j+1)/steps,y,z+(Z-z)*(j+1)/steps],'#8dbab0',2.7);
      if(current>0){const n=Math.max(1,Math.round(distance/.52));for(let j=0;j<n;j++){const f=((time*(.42+Math.min(current*12,2.6))/distance+j/n)%1);lamp([x+(X-x)*f,y+.035,z+(Z-z)*f],'#beffe6',2)}}
    }
    function resistor(x,X,z,i){const mid=(x+X)/2,len=Math.min(.85,(X-x)*.6),a=mid-len/2,b=mid+len/2;
      wire(x,z,a,z,ii[i]);wire(b,z,X,z,ii[i]);box(mid,y,z,len,.29,.32,copper);
      for(const d of [-.21,.08,.29])box(mid+d*len,y,z,len*.055,.30,.33,teal);
      tag([mid,y+.34,z],'R'+(i+1),'#ffe2ab')}
    box(0,.19,front,.94,.55,.53,['#2c6060','#254749','#55958a','#89c4ab']);tag([0,.66,front],V+' V','#d6f6ec');tag([-.53,.38,front],'+','#ffac8a');
    wire(-.47,front,left,front,I);wire(left,front,left,back,I);
    if(mode==='serie'){for(let i=0;i<values.length;i++)resistor(left+i*7/values.length,left+(i+1)*7/values.length,back,i)}
    else{let start=mode==='mixto'?-.7:-2.25,end=2.55,first=mode==='mixto'?1:0,n=values.length-first;
      if(first)resistor(left,start,back,0);else wire(left,back,start,back,I);
      for(let j=0;j<n;j++){const i=first+j,z=back+2.65*j/(n-1);resistor(start,end,z,i);
        if(j+1<n){const next=back+2.65*(j+1)/(n-1),rest=ii.slice(i+1).reduce((a,b)=>a+b,0);wire(start,z,start,next,rest);wire(end,next,end,z,rest)}}
      wire(end,back,right,back,I)}
    wire(right,back,right,front,I);wire(right,front,.47,front,I);
  }
  function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.08,(now-last)/1000);last=now;if(!view3||document.hidden||!model.ready)return;
    width=canvas.clientWidth;height=canvas.clientHeight;const d=Math.min(devicePixelRatio||1,1.75);if(!width||!height)return;
    if(canvas.width!==Math.round(width*d)||canvas.height!==Math.round(height*d)){canvas.width=Math.round(width*d);canvas.height=Math.round(height*d)}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,width,height);
    if(!reduce.matches)time+=dt;scale=Math.min(width/(kind==='cap'?6.8:9.3),height/(kind==='cap'?5.6:5.8));cy=Math.cos(yaw);sy=Math.sin(yaw);cp=Math.cos(pitch);sp=Math.sin(pitch);commands=[];
    const floor=kind==='cap'?-2.15:-.24;for(let i=-5;i<=5;i++){segment([i,floor,-4],[i,floor,4],'#254047',.7);if(Math.abs(i)<=4)segment([-5,floor,i],[5,floor,i],'#254047',.7)}
    // Keep the floor behind the apparatus regardless of camera angle.
    commands.forEach(c=>c[0]-=25);kind==='cap'?capacitor(dt):circuit();commands.sort((a,b)=>a[0]-b[0]);commands.forEach(c=>c[1]())
  }
  select(true);raf=requestAnimationFrame(frame);
  return {update(parameters){Object.assign(model,parameters,{ready:true})},dispose(){cancelAnimationFrame(raf)}}
}
