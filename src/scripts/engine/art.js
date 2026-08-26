/* ============ 10 VIBRANT FANTASY GUARDIANS — BẢNG MÀU RỰC RỠ & HÀO QUANG ============ */
const RANKS={1:'⭐ Khởi Động',2:'⭐⭐ Thử Thách',3:'⭐⭐⭐ Cao Thủ',4:'⭐⭐⭐⭐ Huyền Thoại',5:'⭐⭐⭐⭐⭐ Bậc Thầy'};
/* Bảng màu chuẩn Vibrant Fantasy: phối màu gradient high-contrast, ánh sáng ma thuật bộc phát (Aura Bloom)
   và tạo hình linh hoạt cho 10 Vị Thần Vệ Vệ Vùng Đất Tư Duy. */
const BOSS_ART=[
  {body:'#00f2fe',belly:'#e0f7fa',horn:'#ffd700',horns:0,parts:['shell','stalks'],aura:'rgba(0, 242, 254, 0.35)',expression:'idle'},
  {body:'#9b51e0',belly:'#f3e5f5',horn:'#ff9f43',horns:0,parts:['antennae'],aura:'rgba(155, 81, 224, 0.4)',expression:'mischief'},
  {body:'#2ed573',belly:'#e8f8f5',horn:'#26de81',horns:0,parts:['stitches','fangs'],aura:'rgba(46, 213, 115, 0.4)',expression:'scholar'},
  {body:'#ff5252',belly:'#ffda79',horn:'#ff793f',horns:1,parts:['plates','tail','fangs'],aura:'rgba(255, 82, 82, 0.45)',expression:'fierce'},
  {body:'#ff3838',belly:'#ffb8b8',horn:'#ff9f1a',horns:1,parts:['fangs'],aura:'rgba(255, 56, 56, 0.5)',expression:'rage'},
  {body:'#be2edd',belly:'#f8a5c2',horn:'#e056fd',horns:0,parts:['cape','wings','ears','fangs'],aura:'rgba(190, 46, 221, 0.45)',expression:'sanguine'},
  {body:'#17c0eb',belly:'#dff9fb',horn:'#18dcff',horns:1,parts:['wings','tail','plates'],aura:'rgba(24, 220, 255, 0.5)',expression:'frost'},
  {body:'#fffa65',belly:'#fff200',horn:'#ff3838',horns:1,parts:['crown','cape','fangs'],aura:'rgba(255, 215, 0, 0.6)',expression:'royal'},
  {body:'#7d5fff',belly:'#ef5777',horn:'#70a1ff',horns:1,parts:['hat','staff','cape'],aura:'rgba(125, 95, 255, 0.5)',expression:'arcane'},
  {body:'#33d9e2',belly:'#c7ecee',horn:'#ff5252',horns:0,parts:['tentacles','fangs'],aura:'rgba(51, 217, 226, 0.55)',expression:'cosmic'},
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
/* Kho bộ phận lắp ghép Vibrant Fantasy. */
const BEAST_PARTS=['wings','tail','shell','plates','tentacles','ghost','fangs','stitches',
  'crown','hat','cape','stinger','stalks','antennae','ears','coil','claws','staff'];
/* Tô bảng màu VÀ lắp bộ phận lên một hình quái đã dựng. */
function applySkin(el,art){
  if(!el||!art)return el;
  el.style.setProperty('--c-body',art.body);
  el.style.setProperty('--c-belly',art.belly);
  el.style.setProperty('--c-horn',art.horn);
  if(art.aura)el.style.setProperty('--c-aura',art.aura);
  el.classList.toggle('no-horns',!art.horns);
  if(art.expression)el.setAttribute('data-expression',art.expression);
  const on=Array.isArray(art.parts)?art.parts:[];
  for(const k of BEAST_PARTS)el.classList.toggle('p-'+k,on.includes(k));

  const img = el.querySelector ? el.querySelector('image, img') : null;
  if (img) {
    const isPlayer2 = el.id && (el.id.includes('2') || el.id.includes('Player2'));
    if (isPlayer2) {
      if (img.setAttribute) img.setAttribute('href', 'assets/images/hd2d/player_tiger.jpg');
      if (img.src) img.src = 'assets/images/hd2d/player_tiger.jpg';
    } else if (art.isHero) {
      if (img.setAttribute) img.setAttribute('href', 'assets/images/hd2d/hero_wizard.jpg');
      if (img.src) img.src = 'assets/images/hd2d/hero_wizard.jpg';
    } else {
      if (img.setAttribute) img.setAttribute('href', 'assets/images/hd2d/boss_dragon.jpg');
      if (img.src) img.src = 'assets/images/hd2d/boss_dragon.jpg';
    }
  }
  return el;
}
/* Dựng sẵn một con quái theo bảng màu — dùng cho bản đồ, màn giới thiệu, Gõ Chữ. */
function buildBeastArt(art){
  const svg=buildArt('tplBeast');
  return svg?applySkin(svg,art):null;
}
/* Trộn hai màu hex. */
function mixHex(a,b,t){
  const part=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const [ar,ag,ab]=part(a),[br,bg,bb]=part(b);
  const ch=(x,y)=>Math.round(x+(y-x)*t).toString(16).padStart(2,'0');
  return '#'+ch(ar,br)+ch(ag,bg)+ch(ab,bb);
}
/* Giai đoạn 2: Bộc phá hào quang cuồng nộ rực đỏ-vàng Vibrant Fantasy. */
function rageArt(art){
  return {body:mixHex('#ff2a2a',art.body,.2),belly:mixHex(art.belly,'#ffe169',.65),
          horn:art.horn||'#ffb02e',horns:1,parts:art.parts,aura:'rgba(255, 42, 42, 0.65)',expression:'rage'};
}
function bossArt(b){return b.art||BOSS_ART[BOSSES.indexOf(b)]||BOSS_ART[0];}
function paintBoss(b){
  const el=$('bossSprite');if(!el)return;
  if(!el.childElementCount)fillArt(el,'tplBeast');
  el.classList.remove('phase2');
  applySkin(el,bossArt(b));
  el.setAttribute('aria-label',b.name||'Vệ Binh Vũ Trụ');
}

