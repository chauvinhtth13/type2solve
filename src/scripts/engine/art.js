/* ============ NHÂN VẬT VECTOR NHẸ ============ */
const RANKS={1:'⭐ Khởi Động',2:'⭐⭐ Thử Thách',3:'⭐⭐⭐ Cao Thủ',4:'⭐⭐⭐⭐ Huyền Thoại',5:'⭐⭐⭐⭐⭐ Bậc Thầy'};

/* Màu và phụ kiện cùng thuộc một skin; không tải bitmap hay dùng bộ lọc GPU. */
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
    host.classList.add('fantasy-character');
    delete host.dataset.fantasyKind;
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
  if(el.querySelector('.beast-root'))applyFantasyFeatures(el,spriteIdx);
  el.setAttribute('data-expression',art?.expression||'happy');


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

/* Những hình dáng riêng vẫn dùng chung rig mắt, miệng và thân để tương thích mọi game. */
const FANTASY_FORMS=[
  {kind:'clock-snail',body:'M35 67Q33 40 64 39Q90 39 92 69L94 87Q102 96 108 99Q86 111 49 104Q28 101 30 84Z',
   back:'<circle class="shell" cx="28" cy="75" r="24"/><path class="shell-spiral" d="M33 88Q11 90 13 74Q14 60 28 61Q43 61 40 75Q38 85 29 81Q22 78 28 73"/>',
   head:'<path class="antenna" d="M47 45 43 29m31 16 5-16"/><circle class="antenna-tip" cx="42" cy="27" r="5"/><circle class="antenna-tip" cx="80" cy="27" r="5"/>',
   accessory:'<circle class="gold-charm" cx="65" cy="92" r="8"/><path class="charm-line" d="M65 86v6l4 2"/>'},
  {kind:'lightning-sprite',
   back:'<path d="m88 80 18-15-3 16 11-2-18 21Z"/>',
   head:'<path class="art-ear" d="M37 45 25 16 39 22 43 10 53 37Z"/><path class="art-ear" d="m69 37 12-27 3 12 13-6-13 29Z"/><path class="ear-inset" d="m35 31 8 8m39-8-7 8"/>',
   accessory:'<path class="gold-charm" d="m63 84-10 10h7l-2 9 10-13h-7Z"/>'},
  {kind:'patchwork-scholar',
   back:'<circle cx="32" cy="39" r="13"/><circle cx="89" cy="39" r="13"/><circle class="soft-detail" cx="32" cy="39" r="7"/><circle class="soft-detail" cx="89" cy="39" r="7"/>',
   head:'<path class="patch" d="m48 37 15-1 2 12-15 2Z"/><path class="stitch" d="m48 40 4 1m-3 5 4 1m7-10 1 4m0 5 4-1"/>',
   accessory:'<path class="little-book" d="M36 89Q47 84 60 90Q73 84 84 89v17q-12-4-24 1-12-5-24-1Z"/><path class="book-page" d="M60 91v14m-18-12 11 2m14 0 11-2"/>'},
  {kind:'ember-dragon',body:'M29 64Q28 34 60 34Q92 34 92 64L96 85Q94 105 60 105Q26 105 24 85Z',
   back:'<path d="M90 77q22 15 20-6 12 28-24 30Z"/><path class="gold-charm" d="m95 83 9-8 1 13m-11 3 11-3-4 11"/>',
   head:'<path class="little-horn" d="M35 41q-9-11-3-20 4 11 14 15m29 0q10-4 14-15 6 9-3 20"/><path class="gold-charm" d="m51 36 9-12 9 12Z"/>',
   accessory:'<path class="belly-stripe" d="M48 87h24m-20 7h16"/><path class="little-paw" d="m28 81 12 4m40 0 12-4"/>'},
  {kind:'candy-imp',
   back:'<path class="fairy-wing" d="M33 60Q10 40 9 63l12 2-7 13 22-1m48-17q23-20 24 3l-12 2 7 13-22-1"/>',
   head:'<path class="little-horn" d="M34 42Q20 25 34 17q0 14 14 20m25 0q14-6 14-20 14 8 0 25"/>',
   accessory:'<path class="heart-charm" d="M60 99 48 89q-5-10 4-10 5 0 8 5 3-5 8-5 9 0 4 10Z"/>'},
  {kind:'moon-bat',
   back:'<path class="bat-wing" d="M35 58 9 44l5 38q8-9 18 2m53-26 26-14-5 38q-8-9-18 2"/>',
   head:'<path class="art-ear" d="M31 47 25 13Q42 16 50 39m20 0q8-23 25-26l-6 34"/><path class="ear-inset" d="m32 26 6 15m50-15-6 15"/>',
   accessory:'<path class="moon-collar" d="m32 81 28 11 28-11-9 17-19-6-19 6Z"/><path class="gold-charm" d="M64 89q-11 1-7 11 5 6 11-1-10 2-4-10Z"/>'},
  {kind:'snow-dragon',
   back:'<path class="ice-wing" d="M34 66 8 42l4 32 21 14m53-22 26-24-4 32-21 14"/><path class="wing-vein" d="m12 48 17 28m79-28L91 76"/>',
   head:'<path class="ice-crystal" d="m35 42-6-20 10 4 6-12 7 23m16 0 7-23 6 12 10-4-6 20"/>',
   accessory:'<path class="snow-charm" d="M60 83v18m-8-14 16 10m0-10-16 10m8-14-3 4m3-4 3 4m-3 14-3-4m3 4 3-4"/>'},
  {kind:'sun-lion',
   back:'<path class="sun-mane" d="M60 24 73 30 87 27 93 41 106 48 100 62 106 76 92 83 87 97 72 94 60 102 47 94 33 97 27 83 14 76 20 62 14 48 27 41 33 27 47 30Z"/>',
   head:'<path class="gold-charm" d="m40 38-4-20 14 8 10-16 10 16 14-8-4 20Z"/><circle class="crown-gem" cx="60" cy="28" r="3"/>',
   accessory:'<path class="moon-collar" d="m31 84 29 8 29-8-7 16-22-8-22 8Z"/><circle class="gold-charm" cx="60" cy="93" r="5"/>'},
  {kind:'forest-mage',
   back:'<path class="wand-stick" d="M102 47v57"/><path class="leaf" d="M102 49q-16-2-13-14 14-2 13 14m0 0q-2-19 13-18 4 13-13 18"/>',
   head:'<path class="mushroom-cap" d="M20 44Q25 13 60 13q35 0 40 31Q65 54 20 44Z"/><ellipse class="cap-dot" cx="45" cy="28" rx="8" ry="5"/><ellipse class="cap-dot" cx="73" cy="25" rx="6" ry="4"/><circle class="cap-dot" cx="85" cy="37" r="4"/>',
   accessory:'<path class="leaf" d="M60 96Q41 98 43 84q14-2 17 12m0 0q3-17 17-12 0 14-17 12"/><circle class="gold-charm" cx="60" cy="96" r="3"/>'},
  {kind:'pearl-octopus',body:'M23 68Q20 32 60 31Q100 32 97 68L93 87Q60 103 27 87Z',
   back:'<path d="M30 76q-26 1-21 20 2 9 13 7-11-9 4-11l8 8q-4 17 9 12l5-12 8 1q-2 14 7 13l4-14 9-2q6 20 18 10l-6-12q12 8 21 1 8-14-8-20Z"/><circle class="soft-detail" cx="17" cy="96" r="3"/><circle class="soft-detail" cx="96" cy="103" r="3"/>',
   head:'<path class="pearl-crown" d="m43 35-3-15 12 8 8-13 8 13 12-8-3 15Z"/><circle class="pearl" cx="60" cy="22" r="5"/>',
   accessory:'<path class="gold-charm" d="m60 85 3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z"/>'},
];
function applyFantasyFeatures(el,index){
  const form=FANTASY_FORMS[((index%FANTASY_FORMS.length)+FANTASY_FORMS.length)%FANTASY_FORMS.length];
  if(el.dataset.fantasyKind===form.kind)return;
  el.dataset.fantasyKind=form.kind;
  el.querySelector('.art-body')?.setAttribute('d',form.body||'M27 65Q25 34 60 33Q95 34 93 65L94 80Q94 104 60 104Q26 104 26 80Z');
  for(const part of ['back','head','accessory']){
    const host=el.querySelector('.art-'+part);if(host)host.innerHTML=form[part]||'';
  }
  const feet=el.querySelector('.art-feet');if(feet)feet.style.display=form.kind==='pearl-octopus'?'none':'';
}
