window.circuit = function circuitLab(root) {
  if (!document.querySelector('link[data-elab]')) {
    const css=document.createElement('link');css.rel='stylesheet';css.href='electric-labs.css';css.dataset.elab='';document.head.append(css);
  }
  root.innerHTML=`<section class="elab"><div class="emain"><figure class="escene"><svg viewBox="0 0 570 330" role="img" aria-label="Esquema del circuito seleccionado"></svg><figcaption>Los pulsos muestran el sentido convencional de la corriente. Su velocidad aumenta con la corriente de cada rama.</figcaption></figure><div class="epanel"><h3>Arma tu circuito</h3><label>Conexión<select id="topo"><option value="serie">Serie</option><option value="paralelo">Paralelo</option><option value="mixto">Mixto</option></select></label><label><span class="eline">Fuente de voltaje<output id="supplyv"></output></span><input id="supply" type="range" min="0" max="24" step=".5" value="12"></label><div id="resistors"></div><div class="etools"><button class="eact" id="add" type="button">Añadir resistencia</button><button class="eact" id="sub" type="button">Quitar última</button></div></div></div><div class="estat"><div><small>Resistencia equivalente</small><strong id="req"></strong></div><div><small>Corriente total</small><strong id="amp"></strong></div><div><small>Potencia de la fuente</small><strong id="power"></strong></div></div><div class="ebottom"><div class="egraph"><h3>Ley de Ohm</h3><p>La pendiente de la recta I(V) es 1/R<sub>eq</sub>. El punto marca el voltaje elegido.</p><svg id="plot" viewBox="0 0 370 170" role="img" aria-label="Relación entre voltaje y corriente"></svg></div><div class="egraph"><h3>Mediciones por resistencia</h3><table><thead><tr><th>Pieza</th><th>Ω</th><th>V</th><th>mA</th><th>mW</th></tr></thead><tbody></tbody></table></div></div></section>`;
  const el=id=>root.querySelector('#'+id),format=n=>n.toLocaleString('es-PE',{maximumSignificantDigits:4});
  const values=[100,220,330];const scene=root.querySelector('figure svg');
  const bench=physicalBench(root.querySelector('figure'),'circuit');
  const flowColor='#99ead3';
  const rc = {resistance:650, supply:12, charge:true, running:false, elapsed:0, previous:null, frame:0};
  root.querySelector('.elab').insertAdjacentHTML('beforeend',`<details id="rcbench" class="egraph" style="margin-top:14px"><summary style="cursor:pointer;font-weight:650">Circuito RC · carga y descarga</summary><p style="margin-top:12px">Conecta un capacitor a la fuente y a la resistencia equivalente de tu montaje. Cada tres segundos de animación transcurre una constante de tiempo física τ = R C.</p><div class="emain"><figure class="escene"><svg id="rcdiagram" viewBox="0 0 420 185" role="img" aria-label="Circuito RC en serie"></svg></figure><div class="epanel"><label>Capacitancia<select id="rcc"><option value="10">10 µF</option><option value="100" selected>100 µF</option><option value="470">470 µF</option><option value="1000">1000 µF</option></select></label><div class="etools"><button type="button" class="eact" id="rccharge">Cargar desde 0 V</button><button type="button" class="eact" id="rcdrain">Descargar desde la fuente</button><button type="button" class="eact" id="rcpause" disabled>Pausar</button></div><p id="rctime" style="margin:12px 0 0"></p></div></div><div class="estat"><div><small>Voltaje del capacitor</small><strong id="rcvolts"></strong></div><div><small>Corriente de carga</small><strong id="rccurrent"></strong></div><div><small>Carga del capacitor</small><strong id="rcq"></strong></div></div><svg id="rcgraph" viewBox="0 0 510 150" role="img" aria-label="Voltaje del capacitor frente al tiempo físico" style="max-width:740px"></svg></details>`);
  function rcDraw(){
    const C=+el('rcc').value*1e-6, tau=rc.resistance*C, t=rc.elapsed*tau;
    const fraction=u=>rc.charge?-Math.expm1(-u):Math.exp(-u);
    const vc=rc.supply*fraction(rc.elapsed),current=((rc.charge?rc.supply:0)-vc)/rc.resistance;
    el('rcvolts').textContent=format(vc)+' V';el('rccurrent').textContent=format(current*1000)+' mA';el('rcq').textContent=format(C*vc*1e6)+' µC';
    el('rctime').textContent='t = '+format(t)+' s · τ = '+format(tau)+' s';
    el('rcpause').textContent=rc.running?'Pausar':rc.elapsed===0?'Iniciar':'Continuar';el('rcpause').disabled=rc.elapsed>=6;
    const h=88,x0=38,y0=111,w=427,scale=rc.supply?1:0;
    const pointX=x0+w*rc.elapsed/6,pointY=y0-scale*h*fraction(rc.elapsed);
    const fillPlate=el('rcdiagram').querySelector('.rcPlate');
    if(fillPlate)fillPlate.style.opacity=String(rc.supply?fraction(rc.elapsed):0);
    const layout=[rc.resistance,rc.supply,C,rc.charge].join('/');
    if(layout===rc.layout){const marker=el('rcgraph').querySelector('circle');marker.setAttribute('cx',pointX);marker.setAttribute('cy',pointY);return;}
    rc.layout=layout;
    const source=rc.charge?'<path d="M52 75v13 M39 88h26 M45 96h14 M52 96v15" stroke="#ffc085"/>' :'<path d="M52 75v36" stroke="#99dcc7"/>';
    el('rcdiagram').innerHTML=`<g fill="none" stroke="#78a799" stroke-width="2.5"><path d="M52 75V46H140m91 0h125v36m0 16v40H52v-27"/><path d="m140 46 8 0 6 -8 10 16 10 -16 10 16 10 -16 10 16 10 -16 6 8h11" stroke="#ffb777"/>${source}<path d="M338 82h36 M338 98h36" stroke="#8bd6f4" stroke-width="4"/><path class="rcPlate" d="M338 82h36 M338 98h36" style="opacity:${rc.supply?fraction(rc.elapsed):0}" stroke="#bff3fb" stroke-width="8"/></g><g fill="#e7f3ed" font-family="system-ui" text-anchor="middle" font-size="13"><text x="187" y="25">R = ${format(rc.resistance)} Ω</text><text x="87" y="94">${rc.charge?format(rc.supply)+' V':'0 V'}</text><text x="309" y="94">${format(+el('rcc').value)} µF</text><text x="211" y="169">${rc.charge?'Carga con la fuente conectada':'Descarga con la fuente desconectada'}</text></g>`;
    const path=Array.from({length:61},(_,j)=>(j?'L':'M')+(x0+w*j/60)+' '+(y0-scale*h*fraction(j/10))).join(' ');
    el('rcgraph').innerHTML=`<path d="M${x0} 16V${y0}H470" fill="none" stroke="#829b95"/><g font-family="system-ui" font-size="11" fill="#425d54"><text x="5" y="15">V (V)</text><text x="4" y="31">${format(rc.supply)}</text><text x="20" y="113">0</text><text x="37" y="132">0</text><text x="441" y="132">${format(6*tau)} s</text><text x="186" y="145">Tiempo físico (s)</text></g><path d="${path}" fill="none" stroke="#319578" stroke-width="2.8"/><circle cx="${pointX}" cy="${pointY}" r="5" fill="#e68a46" stroke="#294c41"/>`;
  }
  function stopRC(){cancelAnimationFrame(rc.frame);rc.previous=null;rc.running=false;}
  function tickRC(now){
    if(!rc.running)return;
    if(rc.previous!==null)rc.elapsed=Math.min(6,rc.elapsed+(now-rc.previous)/3000);
    rc.previous=now;
    if(rc.elapsed>=6)stopRC();
    rcDraw();
    if(rc.running)rc.frame=requestAnimationFrame(tickRC);
  }
  function startRC(charge){stopRC();rc.charge=charge;rc.elapsed=0;rc.running=true;rcDraw();rc.frame=requestAnimationFrame(tickRC);}
  el('rccharge').onclick=()=>startRC(true);el('rcdrain').onclick=()=>startRC(false);
  el('rcpause').onclick=()=>{if(rc.running){stopRC();}else{rc.running=true;rc.frame=requestAnimationFrame(tickRC);}rcDraw();};
  el('rcbench').ontoggle=()=>{if(!el('rcbench').open){stopRC();rcDraw();}};
  el('rcc').onchange=()=>{stopRC();rc.elapsed=0;rcDraw();};
  function sliders(){
    el('resistors').innerHTML=values.map((r,i)=>`<label><span class="eline">R${i+1}<output data-ohm="${i}">${r} Ω</output></span><input data-r="${i}" type="range" min="10" max="1000" step="10" value="${r}"></label>`).join('');
    el('add').disabled=values.length>=5;
    el('sub').disabled=values.length<=(el('topo').value==='mixto'?3:2);
  }
  function drawChart(R,V,I){
    const maxI=24/R*1000,X=48,Y=131,W=294,H=103;
    const x=X+W*V/24,y=Y-H*V/24;
    let ticks='';
    for(let j=0;j<=4;j++){const xj=X+W*j/4,yj=Y-H*j/4;ticks+=`<path d="M ${X} ${yj} H${X+W} M${xj} ${Y} V${Y-H}" stroke="#dce6e4"/><text x="${xj}" y="${Y+16}" text-anchor="middle">${j*6}</text><text x="${X-6}" y="${yj+4}" text-anchor="end">${(+((maxI*j/4).toPrecision(3)))}</text>`;}
    el('plot').innerHTML=`<g font-family="system-ui" font-size="11" fill="#36545b">${ticks}<text x="4" y="14">I (mA)</text><text x="326" y="166">V (V)</text></g><path d="M${X} ${Y-H} V${Y} H${X+W}" fill="none" stroke="#5e776e"/><path d="M${X} ${Y} l${W} -${H}" stroke="#2b8b71" stroke-width="3"/><path d="M${x} ${Y} V${y} H${X}" stroke="#749a8b" stroke-dasharray="3 4" fill="none"/><circle cx="${x}" cy="${y}" r="5" fill="#ed8c49" stroke="#253e36" stroke-width="1.5"><title>${format(V)} V · ${format(I*1000)} mA</title></circle>`;
  }
  function update(){
    const mode=el('topo').value,V=+el('supply').value,n=values.length;
    const parallel=items=>1/items.reduce((a,r)=>a+1/r,0);
    const R=mode==='serie'?values.reduce((a,b)=>a+b):mode==='paralelo'?parallel(values):values[0]+parallel(values.slice(1));
    if(rc.resistance!==R||rc.supply!==V){stopRC();rc.elapsed=0;}
    rc.resistance=R;rc.supply=V;rcDraw();
    const I=V/R, branchV=mode==='mixto'?V-I*values[0]:V;
    const ii=values.map((r,i)=>mode==='serie'||(mode==='mixto'&&i===0)?I:branchV/r);
    el('supplyv').textContent=format(V)+' V';el('req').textContent=format(R)+' Ω';el('amp').textContent=format(1000*I)+' mA';el('power').textContent=format(1000*I*V)+' mW';
    root.querySelector('tbody').innerHTML=values.map((r,i)=>`<tr><th>R${i+1}</th><td>${r}</td><td>${format(r*ii[i])}</td><td>${format(1000*ii[i])}</td><td>${format(1000*ii[i]**2*r)}</td></tr>`).join('');
    bench.update({values,ii,mode,V,I});
    drawChart(R,V,I);
    let drawing='';
    function wire(path,current=I){drawing+=`<path d="${path}" fill="none" stroke="#6da096" stroke-width="2.7"/>`;if(current>0)drawing+=`<path class="eanim" style="--flow:${1.7/(1+12*current)}s" d="${path}" fill="none" stroke="${flowColor}" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="2 20"/>`;}
    function resistor(x,y,i,len){const w=Math.min(58,len*.67),a=x+(len-w)/2;wire(`M${x} ${y} H${a}`,ii[i]);let path=`M${a} ${y}`;for(let j=1;j<10;j++)path+=` L${a+j*w/10} ${y+(j%2===1?-7:7)}`;path+=` L${a+w} ${y}`;drawing+=`<path d="${path}" fill="none" stroke="#ffb777" stroke-linejoin="round" stroke-width="3"/>${ii[i]>0?`<path class="eanim" style="--flow:${1.7/(1+12*ii[i])}s" d="${path}" fill="none" stroke="#ffedbc" stroke-dasharray="2 20" stroke-width="3.4" stroke-linecap="round"/>`:''}<text x="${x+len/2}" y="${y-13}" text-anchor="middle" fill="#e3f0e9" font-size="13">R${i+1} · ${values[i]} Ω</text>`;wire(`M${a+w} ${y} H${x+len}`,ii[i]);}
    const top=mode==='serie'?113:48, bottom=280, right=510, left=65;
    wire(`M266 ${bottom} H${left} V${top} H95`);
    if(mode==='serie'){
      values.forEach((_,i)=>resistor(95+i*385/n,top,i,385/n));
      wire(`M480 ${top} H510 V${bottom} H280`);
    }else{
      const first=mode==='mixto'?1:0, start=mode==='mixto'?270:151, end=435;
      if(first)resistor(95,top,0,start-95);else wire(`M95 ${top} H${start}`);
      const count=n-first,space=175/(count-1);
      for(let j=0;j<count;j++){
        const i=first+j,yy=top+j*space;
        resistor(start,yy,i,end-start);
        if(j<count-1){const remaining=ii.slice(i+1).reduce((a,b)=>a+b,0);wire(`M${start} ${yy} v${space}`,remaining);wire(`M${end} ${yy+space} v-${space}`,remaining);}
        drawing+=`<g fill="#c4f1df"><circle cx="${start}" cy="${yy}" r="3.3"/><circle cx="${end}" cy="${yy}" r="3.3"/></g>`;
      }
      wire(`M${end} ${top} H${right} V${bottom} H280`);
    }
    const phaseTime=performance.now()/1000;
    scene.innerHTML=`<defs><pattern id="cirdots" width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#5f8c83" opacity=".5"/></pattern><radialGradient id="cirglow"><stop stop-color="#22463d"/><stop offset="1" stop-color="#0b1723"/></radialGradient></defs><rect width="570" height="330" fill="url(#cirglow)"/><rect width="570" height="330" fill="url(#cirdots)"/><g font-family="system-ui">${drawing}<path d="M266 264v32 M280 272v16" stroke="#ffca83" stroke-width="3"/><g font-size="14" fill="#f5d4a6"><text x="249" y="268">+</text><text x="284" y="268">−</text><text x="274" y="316" text-anchor="middle">${format(V)} V</text></g></g>`;
    for(const segment of scene.querySelectorAll('.eanim')){
      const period=parseFloat(segment.style.getPropertyValue('--flow'));
      segment.style.animationDelay=-(phaseTime%period)+'s';
    }
  }
  el('topo').onchange=()=>{if(el('topo').value==='mixto'&&values.length<3)values.push(330);sliders();update();};
  el('supply').oninput=update;el('resistors').oninput=e=>{const i=+e.target.dataset.r;values[i]=+e.target.value;root.querySelector('[data-ohm="'+i+'"]').textContent=values[i]+' Ω';update();};
  el('add').onclick=()=>{if(values.length<5)values.push(100);sliders();update();};
  el('sub').onclick=()=>{if(values.length>(el('topo').value==='mixto'?3:2))values.pop();sliders();update();};
  sliders();update();return ()=>{stopRC();bench.dispose()};
};
