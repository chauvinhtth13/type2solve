/* ============ CANVAS NỀN HÌNH HỌC NHẸ ============ */
(function playfulBackground(){
  const canvas=document.getElementById('playfulCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const colors=['#ffcf5c','#76d7c4','#ff8f8f','#87b6ff','#b8a1ff'];
  const shapes=Array.from({length:12},(_,index)=>({
    x:(index*0.137+0.08)%1,
    y:(index*0.223+0.06)%1,
    size:18+(index%4)*8,
    speed:0.18+(index%3)*0.08,
    phase:index*0.7,
    color:colors[index%colors.length],
    type:index%3,
  }));
  const reduced=window.GameRuntime?.reducedMotion?.()||matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=0,height=0,raf=0,last=0;

  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    width=innerWidth;height=innerHeight;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw(0);
  }
  function draw(time){
    ctx.clearRect(0,0,width,height);
    shapes.forEach(shape=>{
      const bob=reduced?0:Math.sin(time*0.0005*shape.speed+shape.phase)*10;
      const x=shape.x*width,y=shape.y*height+bob,s=shape.size;
      ctx.save();ctx.translate(x,y);ctx.rotate(reduced?0:Math.sin(time*0.00012+shape.phase)*0.15);
      ctx.globalAlpha=0.19;ctx.fillStyle=shape.color;
      if(shape.type===0){ctx.beginPath();ctx.arc(0,0,s,0,Math.PI*2);ctx.fill();}
      else if(shape.type===1){ctx.fillRect(-s,-s,s*2,s*2);}
      else{ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s,s);ctx.lineTo(-s,s);ctx.closePath();ctx.fill();}
      ctx.restore();
    });
  }
  function tick(time){
    if(time-last>33){draw(time);last=time;}
    raf=requestAnimationFrame(tick);
  }
  /* Nền chỉ được chạy khi trang thực sự rảnh. Có ba lý do phải treo lại:
     tab bị ẩn, người dùng xin giảm chuyển động, và .fx-quiet — cờ mà
     bootstrap.js/session.js bật ở các màn có vòng lặp riêng (chiến đấu, gõ chữ,
     Sudoku). Bỏ vế .fx-quiet thì canvas vẫn vẽ 30 khung/giây ngay giữa trận,
     tranh đúng khung hình mà cờ này sinh ra để nhường. */
  function nenDuocChay(){
    return !reduced&&!document.hidden&&!document.body.classList.contains('fx-quiet');
  }
  function dongBoVongVe(){
    if(nenDuocChay()){if(!raf)raf=requestAnimationFrame(tick);}
    else if(raf){cancelAnimationFrame(raf);raf=0;}
  }
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',dongBoVongVe);
  /* .fx-quiet do file khác bật/tắt nên không có sự kiện để nghe — theo dõi
     thẳng thuộc tính class của <body>. */
  new MutationObserver(dongBoVongVe)
    .observe(document.body,{attributes:true,attributeFilter:['class']});
  resize();
  dongBoVongVe();
})();

/* ============ SẮC NỀN THEO SÀN ĐẤU ============ */
/* Ghi data-arena-theme lên <body>; theme-playful.css đọc thuộc tính này để đổi
   sắc nền trang cho khớp ánh sáng của sàn đấu (night / lava / ice). */
function setDioramaTheme(theme){
  document.body.dataset.arenaTheme=theme||'';
}

/* ============ HẠT MÔI TRƯỜNG & THẢM ĐÁ ĐẤU TRƯỜNG ============ */
function drawGround(theme,arenaId='arena'){
  const g=document.getElementById(arenaId)?.querySelector('.ground');if(!g)return;
  g.innerHTML='';
  const n=4;
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

  spawn();
  ambientId=setInterval(spawn, theme==='lava'?900:theme==='ice'?1100:1800);
}

function stopAmbient(){
  if(ambientId){clearInterval(ambientId);ambientId=null;}
  ambientTimers.forEach(clearTimeout);ambientTimers.clear();
  document.querySelectorAll('.vfx-particle').forEach(e=>e.remove());
  setDioramaTheme('');
}
