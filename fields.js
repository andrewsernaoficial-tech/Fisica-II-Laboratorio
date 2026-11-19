(() => {
  'use strict';
  const K = 8.9875517923; // SI with source charges in nC; distances in m.
  function sample(charges, p) {
    let v = 0;
    const e = [0, 0, 0];
    for (const s of charges) {
      if (s.q === 0) continue;
      const d = p.map((x, i) => x - s.p[i]), r = Math.hypot(...d);
      if (r < 1e-10) return {v: NaN, e: [NaN,NaN,NaN]};
      v += K*s.q/r;
      for (let i=0;i<3;i++) e[i] += K*s.q*d[i]/r**3;
    }
    return {v,e};
  }
  const advance = (p,d,h) => p.map((x,i)=>x+h*d[i]);
  const interp = (a,b,f) => a.map((x,i)=>x+(b[i]-x)*f);
  const fmt = v => Number.isFinite(v) ? new Intl.NumberFormat('es-PE',{maximumFractionDigits:3}).format(v) : 'Indefinido';
  const num = (key, val, label, min='', max='') => '<label>'+label+'<input type="number" data-n="'+key+'" value="'+val+'" step="any" min="'+min+'" max="'+max+'"></label>';
  window.fields = function(root) {
    root.innerHTML = `<style>
    .ef-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,305px);gap:1rem;align-items:start;color:inherit}.ef-view,.ef-panel{border:1px solid #8397ae46;border-radius:16px;overflow:hidden}.ef-view{background:#101a29;color:#d5edf6}.ef-top,.ef-bottom{display:flex;justify-content:space-between;align-items:center;gap:.55rem;padding:.85rem 1rem;flex-wrap:wrap}.ef-top b{font-size:1rem}.ef-view canvas{width:100%;height:clamp(300px,41vw,490px);display:block;touch-action:pan-y;cursor:crosshair}.ef-top button,.ef-bottom button,.ef-panel button,.ef-panel select,.ef-panel input{font:inherit}.ef-top button,.ef-bottom button{background:#1b2b3e;color:#e9f3ff;border:1px solid #49607b;padding:.45rem .75rem;border-radius:7px;cursor:pointer}.ef-top [aria-pressed=true]{background:#c3f1e0;color:#122b2c}.ef-bottom{font-size:.84rem;color:#c1d4df}.ef-panel{padding:1rem;display:grid;gap:.8rem}.ef-panel h3,.ef-panel p{margin:0}.ef-panel label{display:grid;gap:.2rem;font-size:.86rem}.ef-panel select,.ef-panel input[type=number]{box-sizing:border-box;min-width:0;width:100%;padding:.44rem;border:1px solid #71869770;border-radius:6px;background:white;color:#14293c}.ef-check{display:flex!important;align-items:center;gap:.5rem!important}.ef-check input{width:auto}.ef-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem}.ef-actions{display:flex;gap:.4rem;flex-wrap:wrap}.ef-panel button{border:1px solid #71869770;border-radius:7px;padding:.45rem .65rem;cursor:pointer;color:inherit;background:transparent}.ef-panel button:disabled{opacity:.45}.ef-panel section{display:grid;gap:.6rem}.ef-meter{display:flex;flex-wrap:wrap;gap:1.3rem;padding:.8rem 1rem;border-top:1px solid #395067}.ef-meter small,.ef-meter strong{display:block}.ef-meter small{font-size:.78rem;color:#a5c4d5}.ef-meter strong{font:600 1.1rem monospace;margin-top:.25rem}.ef-help{font-size:.82rem;line-height:1.45}.ef-panel [hidden]{display:none}.ef-panel hr{width:100%;border:0;border-top:1px solid #8397ae46;margin:0}
    @media(max-width:800px){.ef-layout{grid-template-columns:1fr}.ef-view canvas{height:330px}}
    </style><div class="ef-layout"><div class="ef-view"><div class="ef-top"><b>Campo eléctrico</b><span><button data-dim="2" aria-pressed="true">2D</button> <button data-dim="3" aria-pressed="false">3D</button></span></div><canvas aria-label="Campo eléctrico de las cargas, sonda y trayectoria"></canvas><div class="ef-bottom"><span data-hint>Haz clic en el plano para mover la sonda.</span><button data-pause>Pausar</button></div><div class="ef-meter"><div><small>Potencial en la sonda</small><strong data-v></strong></div><div><small>Magnitud del campo</small><strong data-e></strong></div><div><small>Cargas</small><strong data-count></strong></div></div></div>
    <div class="ef-panel"><h3>Controles</h3><label>Experimento<select data-mode><option value="field">Distribución de cargas</option><option value="probe">Potencial eléctrico</option><option value="particle">Trayectoria de una partícula</option></select></label><hr><section data-box="field"><label>Carga seleccionada<select data-source></select></label>${num('q',1,'Carga (nC)',-100,100)}<div class="ef-cols">${['x','y','z'].map(k=>num('s'+k,0,k.toUpperCase()+' (m)',-4,4)).join('')}</div><div class="ef-actions"><button data-add>+ Añadir carga</button><button data-remove>Eliminar</button></div><label class="ef-check"><input data-lines type="checkbox" checked> Líneas de campo</label><label class="ef-check"><input data-iso type="checkbox"> Equipotenciales</label>${num('level',5,'Nivel equipotencial (V)',-500,500)}</section>
    <section data-box="probe" hidden><p class="ef-help">Ubica la sonda en cualquier punto del espacio para medir el potencial y el campo resultantes.</p><div class="ef-cols">${['x','y','z'].map((k,i)=>num('p'+k,i===1?1:0,k.toUpperCase()+' (m)')).join('')}</div></section>
    <section data-box="particle" hidden><p class="ef-help">Lanza una carga de prueba. Las cargas fuente permanecen fijas.</p><div class="ef-cols">${num('qt',1,'q (µC)',-100,100)}${num('mass',10,'Masa (mg)',0.001,10000)}</div><b>Posición inicial</b><div class="ef-cols">${['x','y','z'].map((k,i)=>num('i'+k,[-2,1,0][i],k.toUpperCase()+' (m)')).join('')}</div><b>Velocidad inicial</b><div class="ef-cols">${['x','y','z'].map((k,i)=>num('u'+k,i===0?1:0,'v'+k+' (m/s)')).join('')}</div><button data-launch>Lanzar partícula</button><span data-time aria-live="polite"></span></section><hr><button data-reset>Restablecer experimento</button></div></div>`;
    const $=s=>root.querySelector(s), all=s=>Array.from(root.querySelectorAll(s));
    const canvas=$('canvas'), ctx=canvas.getContext('2d');
    let charges,probe,si,dim=2,angle=.48,pitch=.35,paths=[],isos=[],paused=false,phase=0,particle=null,frame,prev=0;
    const val=k=>+root.querySelector('[data-n="'+k+'"]').value;
    const set=(k,v)=>{root.querySelector('[data-n="'+k+'"]').value=v;};
    function reset(){
      charges=[{p:[-1.35,0,0],q:1},{p:[1.35,0,0],q:-1}];probe=[0,1,0];si=0;particle=null;paused=false;phase=0;angle=.48;pitch=.35;
      all('input').forEach(n=>{if(n.type==='checkbox')n.checked=n.defaultChecked;else n.value=n.defaultValue;});$('[data-pause]').textContent='Pausar';$('[data-time]').textContent='';sourceMenu();update();
    }
    function sourceMenu(){
      $('[data-source]').innerHTML=charges.map((c,i)=>'<option value="'+i+'">Carga '+(i+1)+' · '+fmt(c.q)+' nC</option>').join('');
      $('[data-source]').value=si;set('q',charges[si].q);charges[si].p.forEach((x,i)=>set('s'+'xyz'[i],x));
      $('[data-add]').disabled=charges.length===10;$('[data-remove]').disabled=charges.length===1;
    }
    function meters(){const {v,e}=sample(charges,probe);$('[data-v]').textContent=fmt(v)+(isFinite(v)?' V':'');$('[data-e]').textContent=fmt(Math.hypot(...e))+(isFinite(e[0])?' N/C':'');$('[data-count]').textContent=charges.length+' / 10';}
    function direction(p,sign){const e=sample(charges,p).e;if(dim===2)e[2]=0;const n=Math.hypot(...e);return n>1e-9?e.map(x=>x*sign/n):[0,0,0];}
    function trace(){
      paths=[];if(!$('[data-lines]').checked)return;
      const pos=charges.some(c=>c.q>0);
      for(const c of charges){
        if(c.q===0)continue;
        const N=dim===2?18:28;
        for(let j=0;j<N;j++){
          const a=dim===2?2*Math.PI*j/N:j*2.39996323,z=dim===2?0:1-(2*j+1)/N, h=Math.sqrt(1-z*z);
          let p=advance(dim===2?[...c.p.slice(0,2),0]:c.p,[h*Math.cos(a),h*Math.sin(a),z],.11), pts=[p], endsAtOther=false;
          for(let t=0;t<190;t++){
            const d=direction(p,Math.sign(c.q));if(!d.some(Boolean))break;
            const next=advance(p,direction(advance(p,d,.028),Math.sign(c.q)),.056);
            pts.push(next);p=next;
            if(charges.some(s=>Math.hypot(...s.p.map((x,i)=>p[i]-x))<.085)){endsAtOther=true;break;}
            if(Math.hypot(...p)>8)break;
          }
          if(c.q<0 && pos && endsAtOther)continue;
          paths.push(c.q<0?pts.reverse():pts);
        }
      }
    }
    // Slice cells into triangles (2D) or tetrahedra (3D); interpolate V = level.
    function contours(){
      isos=[];if(!$('[data-iso]').checked)return;
      const n=dim===2?48:16, dz=dim===2?1:n, level=val('level'), grid=[];
      const idx=(i,j,k)=>i+(n+1)*(j+(n+1)*k);
      for(let k=0;k<(dim===2?1:n+1);k++)for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
        const p=[(i/n-.5)*9,(j/n-.5)*9,dim===2?0:(k/n-.5)*9];grid.push([p,sample(charges,p).v]);
      }
      function cut(vertices){
        const out=[];
        for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++){
          const [a,va]=vertices[i],[b,vb]=vertices[j];if((va>=level)!==(vb>=level)&&isFinite(va+vb))out.push(interp(a,b,(level-va)/(vb-va)));
        }
        if(out.length===4)[out[2],out[3]]=[out[3],out[2]];
        if(out.length>=2)isos.push(out);
      }
      for(let k=0;k<dz;k++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const q=[0,1,2,3,4,5,6,7].map(h=>grid[idx(i+(h&1),j+((h>>1)&1),k+(h>>2))]);
        if(dim===2){cut([q[0],q[1],q[3]]);cut([q[0],q[3],q[2]]);}
        else for(const [a,b] of [[1,3],[3,2],[2,6],[6,4],[4,5],[5,1]])cut([q[0],q[a],q[b],q[7]]);
      }
    }
    function update(){trace();contours();meters();}
    function project(p,w,h){
      const sc=Math.min(w/8.8,h/6.2),[x,y,z]=p;
      if(dim===2)return [w/2+sc*x,h/2-sc*y];
      const u=x*Math.cos(angle)+z*Math.sin(angle),v=z*Math.cos(angle)-x*Math.sin(angle);
      return [w/2+sc*u,h/2-sc*(y*Math.cos(pitch)-v*Math.sin(pitch))];
    }
    function step(dt){
      if(!particle||!particle.active)return;
      const b=particle,h=dt/6,acc=p=>sample(charges,p).e.map(x=>x*b.ratio);
      for(let i=0;i<6;i++){
        if(charges.some(c=>c.q && Math.hypot(...c.p.map((x,i)=>x-b.p[i]))<.09)||Math.hypot(...b.p)>12||b.t>=30){b.active=false;break;}
        const a=acc(b.p),vhalf=advance(b.v,a,h/2);b.p=advance(b.p,vhalf,h);b.v=advance(vhalf,acc(b.p),h/2);b.t+=h;
      }
      b.tail.push(b.p);if(b.tail.length>1000)b.tail.shift();
      $('[data-time]').textContent=(b.active?'Tiempo · ':'Trayectoria finalizada · ')+b.t.toFixed(2)+' s';
    }
    const background=document.createElement('canvas');
    let cacheView='',cachedPaths=null,cachedIsos=null;
    function draw(t){
      const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const pr=p=>project(p,w,h);
      const line=(pts,color,width=1,fill=false)=>{
        if(!pts.length)return;ctx.beginPath();pts.forEach((p,i)=>{const s=pr(p);if(i)ctx.lineTo(...s);else ctx.moveTo(...s);});if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
      };
      const view=[w,h,dpr,angle,pitch,dim].join('/');
      if(view!==cacheView||cachedPaths!==paths||cachedIsos!==isos){
      for(let i=-6;i<=6;i++){line([[i,-6,0],[i,6,0]],i?'#203042':'#36495e');line([[-6,i,0],[6,i,0]],i?'#203042':'#36495e');}
      if(dim===3)line([[0,0,-5],[0,0,5]],'#425769');
      isos.forEach(p=>line(p,dim===2?'#ffcf78':'#ffcc662b',dim===2?1.7:.5,dim===3?'#ffca6813':false));
        paths.forEach(pts=>line(pts,'#70d9ea76',1.25));
        background.width=canvas.width;background.height=canvas.height;
        background.getContext('2d').drawImage(canvas,0,0);
        cacheView=view;cachedPaths=paths;cachedIsos=isos;
      }else ctx.drawImage(background,0,0,w,h);
      const dt=Math.min(.035,(t-prev)/1000);prev=t;
      if(!paused){phase+=dt*10;step(dt);}
      for(const [i,pts] of paths.entries()){
        if(pts.length<3)continue;
        const progress=(phase+i*13)%(pts.length-1),j=Math.floor(progress),start=pr(pts[j]),next=pr(pts[j+1]);
        const pos=interp(start,next,progress-j),a=Math.atan2(next[1]-start[1],next[0]-start[0]);
        ctx.beginPath();ctx.arc(...pos,1.7,0,2*Math.PI);ctx.fillStyle='#adfaff';ctx.fill();
        ctx.beginPath();ctx.moveTo(pos[0]-4*Math.cos(a-.55),pos[1]-4*Math.sin(a-.55));ctx.lineTo(...pos);ctx.lineTo(pos[0]-4*Math.cos(a+.55),pos[1]-4*Math.sin(a+.55));ctx.strokeStyle='#b7f7ff';ctx.stroke();
      }
      function sphere(p,r,col,label){const [x,y]=pr(p);const glow=ctx.createRadialGradient(x,y,r*.5,x,y,r*2.7);glow.addColorStop(0,col+'90');glow.addColorStop(1,col+'00');ctx.fillStyle=glow;ctx.fillRect(x-r*3,y-r*3,r*6,r*6);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=col;ctx.fill();if(label){ctx.textAlign='center';ctx.fillStyle='#101820';ctx.font='bold 17px sans-serif';ctx.fillText(label,x,y+6);}}
      for(const c of charges)sphere(c.p,11,c.q>=0?'#ffa77d':'#83bdff',c.q>0?'+':c.q<0?'−':'0');
      const [x,y]=pr(probe);ctx.strokeStyle='#cbf7b8';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.moveTo(x,y-10);ctx.lineTo(x,y+10);ctx.stroke();ctx.textAlign='left';ctx.fillStyle='#c4ecb4';ctx.font='12px sans-serif';ctx.fillText('Sonda',x+12,y+4);
      if(particle){line(particle.tail,'#ffdc80',2.5);sphere(particle.p,4.7,'#ffdc80','');}
      frame=requestAnimationFrame(draw);
    }
    $('[data-source]').onchange=e=>{si=+e.target.value;sourceMenu();};
    $('[data-mode]').onchange=e=>{all('[data-box]').forEach(n=>n.hidden=n.dataset.box!==e.target.value);};
    $('[data-add]').onclick=()=>{if(charges.length>=10)return;si=charges.length;charges.push({q:1,p:[.4*(si%3),1+Math.floor(si/3)*.35,0]});sourceMenu();particle=null;update();};
    $('[data-remove]').onclick=()=>{if(charges.length<=1)return;charges.splice(si,1);si=Math.min(si,charges.length-1);sourceMenu();particle=null;update();};
    all('input[type=number]').forEach(n=>n.oninput=()=>{
      if(n.value===''||!n.validity.valid)return;
      const k=n.dataset.n;
      if(k==='q'||k[0]==='s'){charges[si]={q:val('q'),p:[val('sx'),val('sy'),val('sz')]};$('[data-source]').selectedOptions[0].textContent='Carga '+(si+1)+' · '+fmt(val('q'))+' nC';particle=null;update();}
      else if(k[0]==='p'){probe=[val('px'),val('py'),val('pz')];meters();}else if(k==='level')contours();
    });
    $('[data-lines]').onchange=trace;$('[data-iso]').onchange=contours;
    all('[data-dim]').forEach(n=>n.onclick=()=>{dim=+n.dataset.dim;all('[data-dim]').forEach(b=>b.setAttribute('aria-pressed',b===n));canvas.style.touchAction=dim===3?'none':'pan-y';$('[data-hint]').textContent=dim===2?'Haz clic en el plano para mover la sonda.':'Arrastra la escena para girar la vista.';update();});
    let drag=null;
    canvas.onpointerdown=e=>{const r=canvas.getBoundingClientRect();if(dim===3){drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}else{const sc=Math.min(r.width/8.8,r.height/6.2);probe=[(e.clientX-r.left-r.width/2)/sc,(r.height/2-e.clientY+r.top)/sc,0].map(n=>+n.toFixed(3));probe.forEach((x,i)=>set('p'+'xyz'[i],x));meters();}};
    canvas.onpointermove=e=>{if(!drag)return;angle+=(e.clientX-drag[0])*.012;pitch=Math.max(-1.45,Math.min(1.45,pitch+(e.clientY-drag[1])*.012));drag=[e.clientX,e.clientY];};
    canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
    $('[data-launch]').onclick=()=>{const invalid=all('[data-box=particle] input').find(i=>i.value===''||!i.validity.valid);if(invalid){invalid.reportValidity();return;}const p=Array.from('xyz',k=>val('i'+k));particle={p,v:Array.from('xyz',k=>val('u'+k)),ratio:val('qt')/val('mass'),t:0,tail:[p],active:true};paused=false;$('[data-pause]').textContent='Pausar';};
    $('[data-pause]').onclick=e=>{paused=!paused;e.target.textContent=paused?'Reanudar':'Pausar';};
    $('[data-reset]').onclick=()=>{$('[data-mode]').value='field';$('[data-mode]').onchange({target:$('[data-mode]')});reset();root.querySelector('[data-dim="3"]').click();};
    reset();root.querySelector('[data-dim="3"]').click();frame=requestAnimationFrame(draw);return ()=>cancelAnimationFrame(frame);
  };
})();
