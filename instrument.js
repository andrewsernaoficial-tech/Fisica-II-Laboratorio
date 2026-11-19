const themeButton=document.querySelector('#theme');
const sun='<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>';
const moon='<path d="M20 15A8.5 8.5 0 0 1 9 4a8.5 8.5 0 1 0 11 11Z"/>';
function setTheme(mode){
 document.documentElement.dataset.theme=mode;
 let dark=mode==='oscuro';themeButton.querySelector('svg').innerHTML=dark?sun:moon;
 themeButton.querySelector('span').textContent=dark?'Modo claro':'Modo oscuro';
 themeButton.setAttribute('aria-label',dark?'Activar modo claro':'Activar modo oscuro');
 document.querySelector('meta[name=theme-color]').content=dark?'#081416':'#f7faf8';
}
setTheme(document.documentElement.dataset.theme);
themeButton.onclick=()=>{let mode=document.documentElement.dataset.theme==='claro'?'oscuro':'claro';setTheme(mode);try{localStorage.setItem('fisica-tema',mode)}catch{}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const waveCanvas=document.querySelector('#heroArt'),motion=document.querySelector('#motion');
let frozen=reduced.matches,clock=.8,previous=0;
function motionLabel(){motion.textContent=frozen?'Reanudar onda':'Pausar onda';motion.setAttribute('aria-pressed',String(frozen))}
motionLabel();motion.onclick=()=>{frozen=!frozen;motionLabel()};
function drawWave(canvas,t,entrance=1){
 const [g,w,h]=fit(canvas);if(!w||!h)return;
 g.save();g.translate(w*.5,h*.49);let scale=Math.min(w/455,h/208);g.scale(scale,scale);
 const project=(x,y,z)=>[x*.94-y*.45,x*.13+y*.33-z];
 const height=(x,y)=>{let a=Math.hypot(x+72,y-8),b=Math.hypot(x-54,y+6);return entrance*(42*Math.cos(a*.055-t*2.1)*Math.exp(-a/95)+42*Math.cos(b*.055-t*2.1)*Math.exp(-b/95))};
 for(let row=-18;row<=18;row++){let y=row*4.8,pts=[];for(let x=-171;x<=171;x+=3.8)pts.push(project(x,y,height(x,y)));let hue=154+(row+18)*.76;trace(g,pts,'hsla('+hue+',92%,'+(57+(row+18)*.32)+'%,'+(.46+(row+18)*.012)+')',1.04)}
 for(let x=-171;x<=171;x+=8.5){let pts=[];for(let y=-86.4;y<=86.4;y+=4.8)pts.push(project(x,y,height(x,y)));trace(g,pts,'rgba(94,255,195,.30)',.76)}
 for(let [x,y] of [[-72,8],[54,-6]]){let [px,py]=project(x,y,height(x,y));g.beginPath();g.arc(px,py,2.5,0,Math.PI*2);g.fillStyle='#e0ffaf';g.shadowColor='#9bff98';g.shadowBlur=10;g.fill()}g.restore();
}
function animate(now){requestAnimationFrame(animate);if(now-previous<32)return;let dt=Math.min((now-previous)/1000,.12);previous=now;if(document.hidden||home.hidden||document.querySelector('.introScreen[open]'))return;if(!frozen)clock+=dt;drawWave(waveCanvas,clock)}
requestAnimationFrame(animate);
const loader=document.querySelector('#loadingScene');
const fieldCanvas=loader.querySelector('canvas');
const ink=fieldCanvas.getContext('2d');
let introFrame=0;
function showIntro(){
 cancelAnimationFrame(introFrame);
 loader.classList.remove('creditsVisible','leaving');if(!loader.open)loader.showModal();
 const start=performance.now(), duration=reduced.matches?4500:8400;
 let w=0,h=0,base=null;
 function backdrop(){
   const ratio=Math.min(devicePixelRatio||1,1.75);w=loader.clientWidth;h=loader.clientHeight;
   fieldCanvas.width=Math.round(w*ratio);fieldCanvas.height=Math.round(h*ratio);ink.setTransform(ratio,0,0,ratio,0,0);
   base=document.createElement('canvas');base.width=w;base.height=h;const b=base.getContext('2d');
   const fog=b.createRadialGradient(w*.53,h*.47,0,w*.48,h*.5,Math.max(w,h)*.78);
   fog.addColorStop(0,'#123b35');fog.addColorStop(.46,'#08232a');fog.addColorStop(1,'#020810');b.fillStyle=fog;b.fillRect(0,0,w,h);
   for(let n=0;n<230;n++){const rand=v=>{let k=Math.sin(v)*43758.54;return k-Math.floor(k)};b.fillStyle='rgba(165,233,220,'+(.12+.52*rand(n+31))+')';b.fillRect(rand(n*2+1)*w,rand(n*3+147)*h,1.5,1.5)}
 }
 function end(){cancelAnimationFrame(introFrame);loader.close();loader.classList.remove('leaving','creditsVisible')}
 loader.querySelector('.skip').onclick=end;loader.oncancel=e=>{e.preventDefault();end()};
 function render(now){
   if(!loader.open)return;
   const elapsed=now-start,frac=Math.min(1,elapsed/duration),t=reduced.matches?3.2:elapsed/1000;
   if(frac===1){end();return}
   if(w!==loader.clientWidth||h!==loader.clientHeight)backdrop();
   ink.drawImage(base,0,0,w,h);
   const unit=Math.min(w,h),cx=w*.5,cy=h*.5;
   // Two counter-propagating wave packets pass through the centre of the screen.
   for(let band=0;band<2;band++){
     const dir=band?-1:1,travel=(t*.31+band*.09)%2.6-.8,center=w*(dir>0?travel:1-travel);
     const tilt=dir*.15,sigma=w*.19,lambda=Math.max(85,w*.18),tone=band?'130,183,255':'98,255,185';
     ink.save();ink.translate(cx,cy);ink.rotate(tilt);ink.translate(-cx,-cy);
     for(let strand=0;strand<32;strand++){
       const slice=(strand-15.5)/15.5,phase=slice*1.55;
       ink.beginPath();
       for(let i=0;i<=140;i++){let x=w*(-.14+i/140*1.28);let delta=(x-center)/sigma;
         let env=.1+.9*Math.exp(-delta*delta*.5);
         let y=cy+unit*.30*env*Math.sin(x/lambda*6.283-dir*t*3.8+phase)+unit*slice*.074;
         i?ink.lineTo(x,y):ink.moveTo(x,y)}
       ink.strokeStyle='rgba('+tone+','+(.22+.34*(1-Math.abs(slice)))+')';ink.lineWidth=strand===15?2:1;ink.stroke()
     }
     let glow=ink.createRadialGradient(center,cy,0,center,cy,unit*.23);glow.addColorStop(0,'rgba('+tone+',.16)');glow.addColorStop(1,'rgba('+tone+',0)');ink.fillStyle=glow;ink.fillRect(center-unit*.23,cy-unit*.23,unit*.46,unit*.46);ink.restore()
   }
   loader.classList.toggle('creditsVisible',elapsed>(reduced.matches?120:3450));
   loader.classList.toggle('leaving',frac>.94);
   loader.querySelector('.loadRail i').style.transform='scaleX('+frac+')';
   introFrame=requestAnimationFrame(render)
 }
 introFrame=requestAnimationFrame(render)
}
document.querySelector('#replay').onclick=showIntro;
if(loader.open)showIntro();
