/* ============ NHÂN VẬT VECTOR NHẸ ============ */
const RANKS={1:'⭐ Khởi Động',2:'⭐⭐ Thử Thách',3:'⭐⭐⭐ Cao Thủ',4:'⭐⭐⭐⭐ Huyền Thoại',5:'⭐⭐⭐⭐⭐ Bậc Thầy'};

/* Mỗi skin chỉ đổi ba màu CSS, không tải bitmap và không tốn bộ lọc GPU. */
const ART_PALETTES=[
  ['#77c66e','#dff4b8','#277a52'],
  ['#8b7cf6','#dfd9ff','#5d3bb5'],
  ['#ff8c7a','#ffe1b8','#b44b62'],
  ['#f5a742','#fff0a8','#b85f22'],
  ['#ec6f91','#ffd6df','#9c3156'],
  ['#6e86d6','#d9e2ff','#3e56a2'],
  ['#64bde4','#d9f6ff','#257ca8'],
  ['#f2c14e','#fff0aa','#a26b14'],
  ['#55b89b','#d3f4e9','#237a67'],
  ['#5fb2cc','#cdf2f4','#245f83'],
];
/* Số skin có thật. Trước đây các game đếm bằng BOSS_SPRITES.length với nhánh dự
   phòng `:10` viết cứng; xoá mảng ảnh đi thì mọi nơi lặng lẽ rơi về số 10 và chỉ
   đúng nhờ trùng hợp. Đọc thẳng từ bảng màu để thêm/bớt skin không vỡ chỗ nào. */
const ART_SKIN_COUNT=ART_PALETTES.length;

/* Bơm hình từ <template> vào một vỏ rỗng. Vỏ là <svg> (như #bossSprite) thì chép
   phần thân vào trong; vỏ là thẻ thường thì gắn nguyên cả <svg> vào. */
function buildArt(tplId){
  const tpl=document.getElementById(tplId);
  if(!tpl||!tpl.content.firstElementChild)return null;
  return tpl.content.firstElementChild.cloneNode(true);
}
function fillArt(host,tplId){
  const art=buildArt(tplId);if(!host||!art)return null;
  host.textContent='';
  if(host.tagName.toLowerCase()==='svg'){
    while(art.firstChild)host.appendChild(art.firstChild);
    return host;
  }
  host.appendChild(art);
  return art;
}

/* Áp dụng skin bằng biến màu cho SVG phẳng. */
function applySkin(el,art){
  if(!el)return el;
  const isHero=Boolean(art&&art.isHero);
  const isTiger=Boolean(art&&art.isTiger);
  const isPhase2=Boolean(art&&art.phase2);
  
  let spriteIdx=0;
  if(typeof art==='number')spriteIdx=art;
  else if(art&&typeof art.spriteIndex==='number')spriteIdx=art.spriteIndex;
  else if(art&&typeof art._spriteIndex==='number')spriteIdx=art._spriteIndex;

  const palette=isHero?['#4d96ff','#dff5ff','#2458a6']:
    isTiger?['#ff9f43','#ffe0a8','#a9511f']:ART_PALETTES[((spriteIdx%ART_PALETTES.length)+ART_PALETTES.length)%ART_PALETTES.length];
  el.style.setProperty('--art-main',palette[0]);
  el.style.setProperty('--art-soft',palette[1]);
  el.style.setProperty('--art-dark',palette[2]);
  if(art&&art.aura)el.style.setProperty('--c-aura',art.aura);
  if(art&&art.expression)el.setAttribute('data-expression',art.expression);
  el.classList.toggle('phase2',isPhase2);

  return el;
}

/* Dựng sẵn một con quái theo skin — dùng cho bản đồ, màn giới thiệu, Gõ Chữ. */
function buildBeastArt(art){
  const svg=buildArt('tplBeast');
  return svg?applySkin(svg,art):null;
}

/* Giai đoạn 2: đổi sắc đỏ để trẻ nhận ra boss đang mạnh lên. */
function rageArt(art){
  const idx=typeof art==='number'?art:(art&&typeof art.spriteIndex==='number'?art.spriteIndex:0);
  return {spriteIndex:idx,phase2:true,aura:'rgba(255, 42, 42, 0.75)',expression:'rage'};
}

function bossArt(b){
  if(typeof b==='number')return {spriteIndex:b};
  if(b&&typeof b.spriteIndex==='number')return b;
  const idx=typeof BOSSES!=='undefined'?BOSSES.indexOf(b):-1;
  return {spriteIndex:idx>=0?idx:0,name:b?.name};
}

function paintBoss(b){
  const el=$('bossSprite');if(!el)return;
  if(!el.childElementCount)fillArt(el,'tplBeast');
  el.classList.remove('phase2');
  applySkin(el,bossArt(b));
  el.setAttribute('aria-label',b?.name||'Vệ Binh Vũ Trụ');
}
