/* ============ SAO NỀN & BỤI MA THUẬT HD-2D ============ */
(function(){
  const c=document.getElementById('stars');
  if(c){
    for(let i=0;i<45;i++){
      const s=document.createElement('div');s.className='star';
      const sz=Math.random()*3+1.2;
      s.style.width=sz+'px';s.style.height=sz+'px';
      s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';
      s.style.animationDelay=Math.random()*4+'s';
      c.appendChild(s);
    }
  }
  // Ký hiệu toán học cổ ngữ ma pháp trôi nổi
  const syms=['➕','✖️','➗','−','=','7','3','9','?','△','◯','✦','✧'];
  for(let i=0;i<10;i++){
    const m=document.createElement('div');m.className='mathsym';
    m.textContent=syms[i%syms.length];
    m.style.left=Math.random()*96+'%';
    m.style.fontSize=(16+Math.random()*20)+'px';
    m.style.animationDuration=(16+Math.random()*16)+'s';
    m.style.animationDelay=(-Math.random()*20)+'s';
    document.body.appendChild(m);
  }

  // Hiệu ứng Parallax mượt mà cho các khối đảo trôi diorama
  let rafId=null;
  const stage=document.getElementById('dioramaStage');
  if(stage && !window.GameRuntime?.reducedMotion?.()){
    window.addEventListener('pointermove',e=>{
      if(rafId) return;
      rafId=requestAnimationFrame(()=>{
        rafId=null;
        const nx=(e.clientX/window.innerWidth - 0.5)*2;
        const ny=(e.clientY/window.innerHeight - 0.5)*2;
        stage.style.setProperty('--px-far', (nx * -18).toFixed(1) + 'px');
        stage.style.setProperty('--py-far', (ny * -10).toFixed(1) + 'px');
        stage.style.setProperty('--px-mid', (nx * -9).toFixed(1) + 'px');
        stage.style.setProperty('--py-mid', (ny * -5).toFixed(1) + 'px');
        stage.style.setProperty('--px-near', (nx * 14).toFixed(1) + 'px');
        stage.style.setProperty('--py-near', (ny * 8).toFixed(1) + 'px');
      });
    }, {passive:true});
  }
})();

/* ============ DIORAMA NỀN TRANG ============ */
function setDioramaTheme(theme){
  const stage=document.getElementById('dioramaStage');
  if(!stage)return;
  if(theme)stage.setAttribute('data-theme',theme);
  else stage.removeAttribute('data-theme');
}

/* ============ HẠT MÔI TRƯỜNG & THẢM ĐÁ ĐẤU TRƯỜNG ============ */
function drawGround(theme,arenaId='arena'){
  const g=document.getElementById(arenaId)?.querySelector('.ground');if(!g)return;
  g.innerHTML='';
  const n=6;
  for(let i=0;i<n;i++){
    const d=document.createElement('div');
    d.className=`vfx-ground-flora gtheme-${theme||'default'}`;
    d.style.left=(4+i*(92/n)+ri(-3,3))+'%';
    d.style.bottom=ri(2,20)+'%';
    d.style.animationDelay=(Math.random()*3).toFixed(2)+'s';
    g.appendChild(d);
  }
}

let ambientId=null;
const ambientTimers=new Set();

function startAmbient(theme,arenaId='arena'){
  stopAmbient();
  drawGround(theme,arenaId);
  if(window.GameRuntime?.reducedMotion())return;
  const arena=document.getElementById(arenaId);
  if(!arena)return;

  const spawn=()=>{
    const d=document.createElement('div');
    d.className=`vfx-particle vfx-${theme==='lava'?'ember':theme==='ice'?'snow':theme==='night'?'wisp':'stardust'}`;
    d.style.left=ri(3,94)+'%';
    if(theme==='ice'){
      d.style.top='-15px';
      d.style.animation=`fallDown ${ri(35,60)/10}s linear forwards`;
    }else if(theme==='lava'){
      d.style.bottom='2%';
      d.style.animation=`riseUp ${ri(25,45)/10}s linear forwards`;
    }else if(theme==='night'){
      d.style.bottom=ri(10,55)+'%';
      d.style.animation=`riseUp ${ri(30,55)/10}s ease forwards`;
    }else{
      d.style.top=ri(15,75)+'%';
      d.style.animation=`driftStardust ${ri(50,85)/10}s ease-in-out forwards`;
    }
    arena.appendChild(d);
    const gone=setTimeout(()=>{d.remove();ambientTimers.delete(gone)},10000);
    ambientTimers.add(gone);
  };

  spawn();spawn();
  ambientId=setInterval(spawn, theme==='lava'?400:theme==='ice'?550:1400);
}

function stopAmbient(){
  if(ambientId){clearInterval(ambientId);ambientId=null;}
  ambientTimers.forEach(clearTimeout);ambientTimers.clear();
  document.querySelectorAll('.vfx-particle').forEach(e=>e.remove());
  setDioramaTheme('');
}
