window.cap = function capacitorLab(root) {
  if (!document.querySelector('link[data-elab]')) {
    const css=document.createElement('link'); css.rel='stylesheet';css.href='electric-labs.css';css.dataset.elab='';document.head.append(css);
  }
  const epsilon=8.8541878128e-12;
  const format=n=>n.toLocaleString('es-PE',{maximumSignificantDigits:4});
  const slider=(id,title,min,max,step,val)=>`<label><span class="eline">${title}<output id="out-${id}"></output></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  root.innerHTML=`<section class="elab"><div class="emain"><figure class="escene"><svg viewBox="0 0 570 330" role="img" aria-label="Placas paralelas y líneas de campo eléctrico"></svg><figcaption>Las flechas indican la dirección del campo desde la placa positiva hasta la negativa.</figcaption></figure><div class="epanel"><h3>Propiedades del capacitor</h3>${slider('area','Área de cada placa',10,200,1,100)}${slider('gap','Separación',1,10,.1,3)}${slider('volt','Voltaje de la fuente',0,24,.5,12)}<label>Dieléctrico<select id="material"><option value="1">Vacío · κ = 1</option><option value="2.1">Teflón · κ ≈ 2,1</option><option value="3.4">Papel · κ ≈ 3,4</option><option value="5">Vidrio · κ ≈ 5</option></select></label></div></div><div class="estat"><div><small>Capacitancia</small><strong id="cap-c"></strong></div><div><small>Carga por placa |Q|</small><strong id="cap-q"></strong></div><div><small>Energía almacenada</small><strong id="cap-u"></strong></div></div><div class="ecalc"><h3>Calculadora de energía</h3><p>Introduce una capacitancia y un voltaje para evaluar U = ½ CV².</p><div class="ecalc-body"><label>Capacitancia (pF)<input id="calc-c" type="number" step="any" min="0" value="50"></label><label>Voltaje (V)<input id="calc-v" type="number" step="any" value="12"></label><div class="eres"><small>Energía</small><strong id="calc-u"></strong></div></div><button type="button" class="eact" id="copy">Usar valores de la simulación</button></div></section>`;
  const el=id=>root.querySelector('#'+id), svg=root.querySelector('svg');
  const bench=physicalBench(root.querySelector('figure'),'cap');
  let c=0, v=0;
  const face='-60,-101 60,-15 60,101 -60,15';
  const plate=(sign,color)=>`<polygon points="${face}" fill="${color}" fill-opacity=".34" stroke="${color}" vector-effect="non-scaling-stroke" stroke-width="2"/><g class="chargeSigns" fill="#f5ffff" text-anchor="middle" font-size="16">${[-.65,0,.65].flatMap(i=>[-.5,.5].map(j=>`<text x="${i*60}" y="${i*43+j*58}">${sign}</text>`)).join('')}</g>`;
  const lines=[-.7,0,.7].flatMap(i=>[-.62,0,.62].map(j=>`<g transform="translate(${i*60},${i*43+j*58})"><svg overflow="visible" width="1" height="1"><path class="capRay" stroke="#a0ddbf" stroke-opacity=".45"/><path class="capRay eanim" stroke="#c7ffe6" stroke-dasharray="3 19" stroke-linecap="round" stroke-width="2.8"/><path class="capTip" fill="none" stroke="#aeefd0"/></svg></g>`)).join('');
  svg.innerHTML=`<defs><pattern id="capgrid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#7fc6ab" opacity=".24"/></pattern><radialGradient id="capglow"><stop stop-color="#275749" stop-opacity=".75"/><stop offset="1" stop-color="#0b1723" stop-opacity="0"/></radialGradient></defs><rect width="570" height="330" fill="url(#capgrid)"/><ellipse cx="285" cy="166" rx="225" ry="155" fill="url(#capglow)"/><g fill="none" stroke="#72938a" stroke-width="2"><path id="capwire"/><path d="M263 258v28 M277 265v14" stroke="#d1e9dd"/></g><g id="capLeft">${plate('+','#ffa57d')}</g><g id="capSlab"><polygon points="${face}" fill="#ba9bff" fill-opacity=".48" stroke="#d2baff"/></g><g id="capLines">${lines}</g><g id="capRight">${plate('−','#71bffe')}</g><g fill="#d6e9e5" text-anchor="middle" font-size="13"><text id="capV" x="270" y="305"/><text id="capD" x="283" y="38"/></g>`;
  let shown=null,target=null,animation=0,last=0;
  const rays=svg.querySelectorAll('.capRay'),tips=svg.querySelectorAll('.capTip');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  function drawGeometry(now){
    const dt=last?Math.min(.09,(now-last)/1000):.016;last=now;
    const mix=reducedMotion.matches?1:1-Math.exp(-dt*15);
    let moving=false;
    for(const key of ['size','gap','slab','intensity']){
      const delta=target[key]-shown[key];if(Math.abs(delta)<.002)shown[key]=target[key];else{shown[key]+=delta*mix;moving=true}
    }
    const {size,gap,slab,intensity}=shown,x1=280-gap/2,x2=280+gap/2;
    const place=(id,x,y)=>el(id).setAttribute('transform',`translate(${x} ${y}) scale(${size})`);
    place('capLeft',x1,172);place('capRight',x2,172);place('capLines',x1,172);place('capSlab',280,172-50*(1-slab));
    el('capSlab').style.opacity=slab;el('capLines').style.opacity=intensity;
    svg.querySelectorAll('.chargeSigns').forEach(n=>n.style.opacity=intensity);
    const end=gap/size-2;rays.forEach(n=>n.setAttribute('d','M0 0H'+end));tips.forEach(n=>n.setAttribute('d',`M${end-5} -3l5 3-5 3`));
    el('capwire').setAttribute('d',`M${x1-size*60} ${172-size*43}H60V272H263 M277 272H510V${172+size*43}H${x2+size*60}`);
    animation=moving?requestAnimationFrame(drawGeometry):0;if(!moving)last=0;
  }
  function render(){
    const area=+el('area').value, gap=+el('gap').value, k=+el('material').value;v=+el('volt').value;
    bench.update({area,gap,k,v});
    c=epsilon*k*area*1e-4/(gap*1e-3)*1e12;
    for(const [id,value,unit] of [['area',area,'cm²'],['gap',gap,'mm'],['volt',v,'V']])el('out-'+id).textContent=format(value)+' '+unit;
    el('cap-c').textContent=format(c)+' pF';el('cap-q').textContent=format(c*v)+' pC';el('cap-u').textContent=format(.0005*c*v*v)+' nJ';
    target={size:(45+4.1*Math.sqrt(area))/100,gap:28+gap*6,slab:k===1?0:1,intensity:v?(.45+.55*v/24):0};
    if(!shown)shown={...target};if(!animation)drawGeometry(performance.now());
    el('capV').textContent=format(v)+' V';el('capD').textContent='d = '+format(gap)+' mm';
    svg.style.setProperty('--flow',(2.5/(1+v/12))+'s');
  }
  function calculate(){const a=el('calc-c'), b=el('calc-v'); const energy=.0005*a.valueAsNumber*b.valueAsNumber**2;el('calc-u').textContent=a.validity.valid&&Number.isFinite(energy)?format(energy)+' nJ':'Revisa los valores';}
  root.querySelector('.epanel').oninput=render;root.querySelector('.ecalc').oninput=calculate;
  el('copy').onclick=()=>{el('calc-c').value=+c.toPrecision(12);el('calc-v').value=v;calculate();};render();calculate();return ()=>{cancelAnimationFrame(animation);bench.dispose()};
};
