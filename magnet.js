(() => {
  'use strict';
  const tau = Math.PI * 2;
  const colors = { mint: '#6be6c2', blue: '#77caff', coral: '#ff947e', white: '#e9f7fa' };
  const fmt = x => Number(x.toPrecision(4)).toLocaleString('es-PE', { maximumFractionDigits: 4 });
  function trajectory(t, s) {
    const omega = s.q * s.B / s.mass;
    if (!omega) {
      const a = s.q * s.E / s.mass;
      return { pos: [s.v * t, a * t * t / 2, s.vz * t], vel: [s.v, a * t, s.vz] };
    }
    const drift = s.E / s.B, u = s.v - drift, phase = omega * t;
    return { pos: [drift*t + u*Math.sin(phase)/omega, u*(Math.cos(phase)-1)/omega, s.vz*t],
      vel: [drift + u*Math.cos(phase), -u*Math.sin(phase), s.vz] };
  }
  function magnet(root) {
    const state = { mode:'bar', strength:1, current:6, radius:4, q:1, mass:1, E:1, B:1.5, v:3, vz:0,
      yaw:-0.51, pitch:0.32, zoom:1, t:0, paused:false };
    root.innerHTML = `<style>
      .maglab{font:inherit;color:#142b3d}.maglab *{box-sizing:border-box}.maglab button,.maglab select,.maglab input{font:inherit}.maglab button,.maglab select{cursor:pointer}
      .maglayout{display:grid;grid-template-columns:minmax(0,1fr) minmax(215px,28%);gap:16px;align-items:start}
      .magview{background:#071923;color:#e9f7fa;border-radius:16px;overflow:hidden;position:relative;border:1px solid #263c48}
      .magview canvas{width:100%;height:clamp(305px,37vw,510px);display:block;touch-action:none;cursor:grab}.magview canvas:active{cursor:grabbing}
      .magbadge{position:absolute;top:16px;left:16px;font:600 13px system-ui;pointer-events:none;color:#b9d7dd;letter-spacing:.04em}.magbadge b{color:#80edce}
      .magtools{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 12px;align-items:center}.magtools button{background:#18333e;color:#f1f9fa;border:1px solid #37515b;border-radius:7px;padding:7px 10px;font-size:14px}
      .magpanel{background:#fff;border:1px solid #d9e2e4;border-radius:14px;padding:17px;color:#193449}.magpanel label{display:block;font-weight:600;font-size:14px}.magpanel select{margin:7px 0 4px;display:block;width:100%;border:1px solid #beced2;padding:9px;border-radius:7px;background:white;color:inherit}
      .magparam{padding-top:15px}.magparam span{display:flex;justify-content:space-between;align-items:center;gap:6px}.magparam output{font:600 13px ui-monospace,monospace;color:#12685d;white-space:nowrap}.magparam input{width:100%;margin:8px 0 0;accent-color:#137d70}
      .magdoc{color:#405d65;font-size:14px;line-height:1.5;margin:13px 0 0}.magvalues{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}.magvalues>div{flex:1 1 135px;background:#f4f8f8;border:1px solid #dbe5e6;border-radius:9px;padding:10px 12px}.magvalues small,.magvalues strong{display:block}.magvalues small{font-size:13px;color:#46616d}.magvalues strong{font:600 16px ui-monospace,monospace;margin-top:4px}
      @media(max-width:760px){.maglayout{grid-template-columns:1fr}.magview canvas{height:340px}.magpanel{padding:14px}.magparams{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0 18px}}
      </style><div class="maglab"><div class="maglayout"><div><div class="magview"><div class="magbadge"><b>3D</b> · <span></span></div><canvas tabindex="0" aria-label="Simulación magnética tridimensional. Arrastra o usa las flechas del teclado para girar la vista."></canvas><div class="magtools"><button type="button" data-act="pause">Pausar</button><button type="button" data-act="reset">Reiniciar</button><button type="button" data-act="out" aria-label="Alejar vista">−</button><button type="button" data-act="in" aria-label="Acercar vista">+</button><button type="button" data-act="view">Centrar vista</button></div></div><div class="magvalues"></div><p class="magdoc">Arrastra la escena para girarla. Con el teclado, usa las flechas sobre la simulación.</p></div><div class="magpanel"><label>Experimento<select><option value="bar">Imán de barra</option><option value="wire">Conductor con corriente</option><option value="force">Fuerza de Lorentz</option></select></label><div class="magparams"></div><p class="magdoc maghint"></p></div></div></div>`;
    const find = sel => root.querySelector(sel), canvas=find('canvas'), ctx=canvas.getContext('2d'), params=find('.magparams'), values=find('.magvalues');
    const options={
      bar:[['strength','Momento dipolar','A·m²',-2,2,.1],['radius','Distancia de la sonda','cm',3,9,.1]],
      wire:[['current','Corriente','A',-12,12,.2],['radius','Radio de la sonda','cm',3,9,.1]],
      force:[['q','Carga','mC',-3,3,.1],['mass','Masa','g',.5,3,.1],['E','Campo eléctrico','V/m',-3,3,.1],['B','Campo magnético','T',-3,3,.1],['v','Velocidad inicial x','m/s',-5,5,.1],['vz','Velocidad inicial z','m/s',-2,2,.1]]
    };
    const names={bar:'Imán de barra',wire:'Conductor rectilíneo',force:'Campos cruzados'};
    const hints={bar:'El imán se aproxima mediante un dipolo. La sonda está en su eje. El signo del momento invierte los polos.',wire:'Las líneas rodean el hilo según la regla de la mano derecha. La sonda se sitúa a la distancia radial indicada.',force:'E apunta sobre el eje y y B sobre z. Ajusta la velocidad inicial para comparar giro, deriva y movimiento paralelo al campo.'};
    const metricLabels={bar:['Campo en la sonda','Distancia al centro'],wire:['Campo en la sonda','Sentido de la corriente'],force:['Tiempo','Rapidez','Fuerza resultante']};
    function configure(){
      params.replaceChildren(); values.replaceChildren(); find('.magbadge span').textContent=names[state.mode];find('.maghint').textContent=hints[state.mode];
      for(const [k,label,u,min,max,step] of options[state.mode]){
        const el=document.createElement('label');el.className='magparam';el.innerHTML=`<span>${label}<output></output></span><input type="range" min="${min}" max="${max}" step="${step}" aria-label="${label}">`;
        const input=el.querySelector('input'),out=el.querySelector('output');input.value=state[k];const sync=()=>{out.textContent=fmt(state[k])+' '+u};sync();
        input.oninput=()=>{state[k]=+input.value;sync();state.t=0;updateMetrics()};params.append(el);
      }
      for(const label of metricLabels[state.mode]){const div=document.createElement('div');div.innerHTML='<small>'+label+'</small><strong></strong>';values.append(div)}updateMetrics();
    }
    function updateMetrics(){
      const r=state.radius/100,s=state;
      let list=s.mode==='bar'?[fmt(Math.abs(.2*s.strength/r**3))+' µT',fmt(s.radius)+' cm']:[fmt(Math.abs(.2*s.current/r))+' µT',s.current>0?'+z':s.current<0?'−z':'Sin corriente'];
      if(s.mode==='force'){const {vel:[vx,vy,vz]}=trajectory(s.t,s);list=[fmt(s.t)+' s',fmt(Math.hypot(vx,vy,vz))+' m/s',fmt(Math.abs(s.q)*Math.hypot(vy*s.B,s.E-vx*s.B))+' mN']}
      values.querySelectorAll('strong').forEach((el,i)=>{el.textContent=list[i]})
    }
    find('select').onchange=e=>{state.mode=e.target.value;state.t=0;state.zoom=1;configure()};
    function center(){state.yaw=-.51;state.pitch=.32;state.zoom=1}
    find('.magtools').onclick=e=>{switch(e.target.dataset.act){case 'pause':state.paused=!state.paused;e.target.textContent=state.paused?'Reanudar':'Pausar';break;case 'reset':state.t=0;updateMetrics();break;case 'in':state.zoom=Math.min(2.6,state.zoom*1.2);break;case 'out':state.zoom=Math.max(.35,state.zoom/1.2);break;case 'view':center();break}};
    let drag=null;canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};function rotate(dx,dy){state.yaw+=dx;state.pitch=Math.max(-1.4,Math.min(1.4,state.pitch+dy))}
    canvas.onpointermove=e=>{if(!drag)return;rotate((e.clientX-drag[0])*.01,(e.clientY-drag[1])*.01);drag=[e.clientX,e.clientY]};canvas.onpointerup=canvas.onpointercancel=()=>{drag=null};canvas.onkeydown=e=>{if(e.key.startsWith('Arrow')){e.preventDefault();rotate(({ArrowLeft:-.12,ArrowRight:.12})[e.key]||0,({ArrowUp:-.12,ArrowDown:.12})[e.key]||0)}};
    let w=0,h=0,scale=1,origin=[0,0,0],frame=0,last=0,lastMetric=-1;
    let c=1,s=0,cp=1,sp=0;
    function proj(p){
      const x=p[0]-origin[0],y=p[1]-origin[1],z=p[2]-origin[2];
      const hor=x*c-y*s,depth=x*s+y*c;
      return [w*.5+hor*scale,h*.52-(z*cp+depth*sp)*scale,depth*cp-z*sp];
    }
    function line(pts,color,width=1){ctx.beginPath();for(let i=0;i<pts.length;i++){const [x,y]=proj(pts[i]);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
    function dot(p,color,size=3,glow=0){const [x,y]=proj(p);ctx.save();ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,size,0,tau);ctx.fill();ctx.restore()}
    function label(p,txt,color){const [x,y]=proj(p);ctx.fillStyle=color;ctx.font='600 13px system-ui';ctx.fillText(txt,x+6,y-5)}
    function arrow(a,b,color){line([a,b],color,1.5);const [x,y]=proj(b),[xx,yy]=proj(a),ang=Math.atan2(y-yy,x-xx);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);for(const d of [-.45,.45])ctx.lineTo(x-6*Math.cos(ang+d),y-6*Math.sin(ang+d));ctx.closePath();ctx.fill()}
    function drawGrid(){const spacing=state.mode==='force'?1:2;for(let i=-5;i<=5;i++){const u=i*spacing;line([[u,-5*spacing,-2.5],[u,5*spacing,-2.5]],'#173541');line([[-5*spacing,u,-2.5],[5*spacing,u,-2.5]],'#173541')}}
    const barCurves=new Map(),wireCurves=new Map();
    function drawBar(){
      const {strength,t,radius}=state,rev=strength<0;
      if(strength){for(let j=0;j<8;j++)for(let i=0;i<3;i++){
        const a=tau*j/8,R=1.8+1.2*i,path=angle=>{const n=Math.sin(angle),r=R*n*n;return [r*Math.cos(angle),r*n*Math.cos(a),r*n*Math.sin(a)]};
        const begin=.37,end=Math.PI-begin,key=j*3+i;
        if(!barCurves.has(key))barCurves.set(key,Array.from({length:65},(_,n)=>path(begin+(end-begin)*n/64)));
        const pts=barCurves.get(key);
        line(pts,j<4?'#398b8a':'#225e69',.75+.38*Math.abs(strength));
        const u=(t*(.10+.09*Math.abs(strength))+i*.19+j*.09)%1,ang=begin+(end-begin)*(rev?1-u:u);
        dot(path(ang),j%2?colors.blue:colors.mint,2,6);if(j%2===0&&i===2)arrow(path(1.23),path(1.23+(rev?-.06:.06)),colors.mint)
      }}
      const halves=[[-1,0,rev?colors.coral:colors.blue,rev?'N':'S'],[0,1,rev?colors.blue:colors.coral,rev?'S':'N']];
      for(const [a,b,col,char] of halves){const corners=(x)=>[[x,-.29,-.28],[x,.29,-.28],[x,.29,.28],[x,-.29,.28]];const A=corners(a),B=corners(b);for(let k=0;k<4;k++){const poly=[A[k],A[(k+1)%4],B[(k+1)%4],B[k]].map(proj);ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=strength?col:'#869eaa';ctx.fill();ctx.strokeStyle='#263f4a';ctx.lineWidth=.7;ctx.stroke()}if(strength)label([(a+b)/2,-.34,0],char,'#103345')}
      dot([radius,0,0],colors.white,4,7);label([radius,0,0],'Sonda',colors.white)
    }
    function drawWire(){
      const {current,t,radius}=state,sign=Math.sign(current);line([[0,0,-4.2],[0,0,4.2]],'#d8a67f',8);line([[0,0,-4.2],[0,0,4.2]],'#ffe0b7',2);
      if(current){for(let idx=0;idx<6;idx++){const r=1.05+idx*.72,p=a=>[r*Math.cos(a),r*Math.sin(a),0];if(!wireCurves.has(idx))wireCurves.set(idx,Array.from({length:101},(_,n)=>p(tau*n/100)));line(wireCurves.get(idx),idx%2?'#419194':'#357782',1.1);for(let j=0;j<3;j++){const a=(t*(.47+Math.abs(current)*.09)+tau*j/3+idx*.3)*sign;dot(p(a),colors.mint,2.5,7)}arrow(p(.75),p(.75+.09*sign),colors.mint)}
        arrow([0,0,1.3*sign],[0,0,2.6*sign],colors.white);label([0,0,2.8*sign],'I',colors.white)}
      dot([radius,0,0],colors.white,4,7);label([radius,0,0],'Sonda',colors.white)
    }
    function drawForce(){
      const s=state,cur=trajectory(s.t,s).pos;origin=cur.map(v=>v*.82);
      drawGrid();for(const [axis,col,txt] of [[0,'#87a4b0','x'],[1,colors.coral,'y'],[2,colors.blue,'z']]){const end=[0,0,0];end[axis]=2.2;arrow([0,0,0],end,col);label(end,txt,col)}
      for(const [axis,f,col,tag] of [[1,s.E,colors.coral,'E'],[2,s.B,colors.blue,'B']]){if(!f)continue;const p=[-2,-1,0].map((x,i)=>x+origin[i]),b=p.slice();b[axis]+=Math.sign(f)*1.3;arrow(p,b,col);label(b,tag,col)}
      const start=Math.max(0,s.t-8),trail=Array.from({length:181},(_,i)=>trajectory(start+(s.t-start)*i/180,s).pos);for(let k=0;k<6;k++)line(trail.slice(k*30,k*30+31),'rgba(107,230,194,'+(.17+k*.15)+')',1.1+k*.3);dot(cur,colors.mint,5,16);label(cur,'q',colors.white);
    }
    function draw(ts){
      const cw=canvas.clientWidth,ch=canvas.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
      c=Math.cos(state.yaw);s=Math.sin(state.yaw);cp=Math.cos(state.pitch);sp=Math.sin(state.pitch);
      if(cw&&ch){if(canvas.width!==Math.round(cw*dpr)||canvas.height!==Math.round(ch*dpr)){canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr)}w=cw;h=ch;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const bg=ctx.createRadialGradient(w*.5,h*.48,0,w*.5,h*.48,w*.7);bg.addColorStop(0,'#123440');bg.addColorStop(1,'#071722');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      if(last&&!state.paused)state.t+=Math.min((ts-last)/1000,.06);last=ts;origin=[0,0,0];scale=Math.min(w/(state.mode==='force'?10:Math.max(11,state.radius*2+2.4)),h/9.1)*state.zoom;
      if(state.mode==='force'){drawForce()}else{drawGrid();state.mode==='bar'?drawBar():drawWire()}if(ts-lastMetric>100){updateMetrics();lastMetric=ts}}
      frame=requestAnimationFrame(draw)
    }
    configure();frame=requestAnimationFrame(draw);
    return ()=>{cancelAnimationFrame(frame);root.replaceChildren()};
  }
  window.magnet=magnet;
})();
