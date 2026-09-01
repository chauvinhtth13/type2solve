/* ============ 10 VIBRANT FANTASY GUARDIANS — HD-2D ART ENGINE ============ */
const RANKS={1:'⭐ Khởi Động',2:'⭐⭐ Thử Thách',3:'⭐⭐⭐ Cao Thủ',4:'⭐⭐⭐⭐ Huyền Thoại',5:'⭐⭐⭐⭐⭐ Bậc Thầy'};

/* Đường dẫn ảnh chân dung HD-2D của 10 Boss Vệ Binh Vũ Trụ */
const FALLBACK_BOSS_SPRITE='assets/images/hd2d/boss_dragon.jpg';
const BOSS_SPRITES=[
  'assets/images/hd2d/boss_01_sora.jpg',
  'assets/images/hd2d/boss_02_sparky.jpg',
  'assets/images/hd2d/boss_03_stitchwork.jpg',
  'assets/images/hd2d/boss_04_ignis.jpg',
  'assets/images/hd2d/boss_05_vex.jpg',
  'assets/images/hd2d/boss_06_nocturne.jpg',
  'assets/images/hd2d/boss_07_glacius.jpg',
  'assets/images/hd2d/boss_08_solkahn.jpg',
  'assets/images/hd2d/boss_09_lumiel.jpg',
  'assets/images/hd2d/boss_10_leviator.jpg',
];

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

/* Áp dụng skin nhân vật / boss vào phần tử hình ảnh */
function applySkin(el,art){
  if(!el)return el;
  const isHero=Boolean(art&&art.isHero);
  const isTiger=Boolean(art&&art.isTiger);
  const isPhase2=Boolean(art&&art.phase2);
  
  let spriteIdx=0;
  if(typeof art==='number')spriteIdx=art;
  else if(art&&typeof art.spriteIndex==='number')spriteIdx=art.spriteIndex;
  else if(art&&typeof art._spriteIndex==='number')spriteIdx=art._spriteIndex;

  if(art&&art.aura)el.style.setProperty('--c-aura',art.aura);
  if(art&&art.expression)el.setAttribute('data-expression',art.expression);
  el.classList.toggle('phase2',isPhase2);

  const img=el.querySelector?el.querySelector('image, img'):null;
  if(img){
    let src;
    if(isHero){
      src='assets/images/hd2d/hero_wizard.jpg';
    }else if(isTiger){
      src='assets/images/hd2d/player_tiger.jpg';
    }else{
      const count=BOSS_SPRITES.length;
      src=BOSS_SPRITES[((spriteIdx%count)+count)%count]||FALLBACK_BOSS_SPRITE;
    }
    if(img.setAttribute)img.setAttribute('href',src);
    if(img.src)img.src=src;
  }
  return el;
}

/* Dựng sẵn một con quái theo skin — dùng cho bản đồ, màn giới thiệu, Gõ Chữ. */
function buildBeastArt(art){
  const svg=buildArt('tplBeast');
  return svg?applySkin(svg,art):null;
}

/* Giai đoạn 2: Bộc phá hào quang cuồng nộ rực đỏ HD-2D. */
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

