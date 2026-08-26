/* ============ SAO NỀN ============ */
(function(){
  const c=document.getElementById('stars');
  for(let i=0;i<40;i++){
    const s=document.createElement('div');s.className='star';
    const sz=Math.random()*3+1;
    s.style.width=sz+'px';s.style.height=sz+'px';
    s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';
    s.style.animationDelay=Math.random()*3+'s';
    c.appendChild(s);
  }
  // ký hiệu toán học trôi nổi
  const syms=['➕','✖️','➗','−','=','7','3','9','?','△','◯'];
  for(let i=0;i<10;i++){
    const m=document.createElement('div');m.className='mathsym';
    m.textContent=syms[i%syms.length];
    m.style.left=Math.random()*96+'%';
    m.style.fontSize=(16+Math.random()*22)+'px';
    m.style.animationDuration=(14+Math.random()*16)+'s';
    m.style.animationDelay=(-Math.random()*20)+'s';
    document.body.appendChild(m);
  }
})();

/* ============ HẠT MÔI TRƯỜNG ============ */
const GROUND_DECO={'':['🌿','🌱','🌼','🍀','🌾'],night:['🍄','🌿','🕸️','🌱'],
  lava:['🪨','🔥','🌑','🪨'],ice:['❄️','🧊','🪨','❄️']};
function drawGround(theme){
  const g=$('ground');if(!g)return;
  g.innerHTML='';
  const set=GROUND_DECO[theme]||GROUND_DECO[''];
  const n=8;
  for(let i=0;i<n;i++){
    const d=document.createElement('span');d.className='gdeco';
    d.textContent=pick(set);
    d.style.left=(3+i*(94/n)+ri(-2,2))+'%';
    d.style.bottom=ri(2,26)+'%';
    d.style.animationDelay=(Math.random()*3).toFixed(2)+'s';
    d.style.fontSize=`calc(var(--spriteF) * ${(0.16+Math.random()*0.12).toFixed(2)})`;
    g.appendChild(d);
  }
}
let ambientId=null;
const ambientTimers=new Set();
function startAmbient(theme){
  stopAmbient();
  drawGround(theme);
  if(window.GameRuntime?.reducedMotion())return;
  const arena=$('arena');
  const spawn=()=>{
    const d=document.createElement('div');d.className='ambient';
    if(theme==='lava'){d.textContent=pick(['🔥','✦','•']);d.style.fontSize=ri(8,16)+'px';d.style.color='#ffd0a0';
      d.style.left=ri(2,95)+'%';d.style.bottom='0';d.style.animation=`riseUp ${ri(25,45)/10}s linear forwards`;}
    else if(theme==='ice'){d.textContent=pick(['❄️','❅','•']);d.style.fontSize=ri(8,15)+'px';d.style.color='#fff';
      d.style.left=ri(2,95)+'%';d.style.top='-20px';d.style.animation=`fallDown ${ri(35,60)/10}s linear forwards`;}
    else if(theme==='night'){d.textContent='✨';d.style.fontSize=ri(8,13)+'px';
      d.style.left=ri(2,95)+'%';d.style.bottom=ri(10,60)+'%';d.style.animation=`riseUp ${ri(30,55)/10}s ease forwards`;}
    else{d.textContent='☁️';d.style.fontSize=ri(16,28)+'px';d.style.opacity=.8;
      d.style.left='-60px';d.style.top=ri(2,22)+'%';d.style.animation=`driftRight ${ri(70,120)/10}s linear forwards`;}
    // Gỡ chính mình khỏi Set khi chạy xong, giữ bộ nhớ ổn định cả trong trận dài.
    arena.appendChild(d);
    const gone=setTimeout(()=>{d.remove();ambientTimers.delete(gone)},12500);
    ambientTimers.add(gone);
  };
  spawn();spawn();
  ambientId=setInterval(spawn, theme==='lava'?450:theme==='ice'?600:1600);
}
function stopAmbient(){
  if(ambientId){clearInterval(ambientId);ambientId=null;}
  ambientTimers.forEach(clearTimeout);ambientTimers.clear();
  document.querySelectorAll('.ambient').forEach(e=>e.remove());
}
