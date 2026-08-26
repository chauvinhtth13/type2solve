/* ============ 10 BOSS — độ khó tăng dần (KHÔNG hiện lớp) ============ */
const RANKS={1:'⭐ Khởi Động',2:'⭐⭐ Thử Thách',3:'⭐⭐⭐ Cao Thủ',4:'⭐⭐⭐⭐ Huyền Thoại',5:'⭐⭐⭐⭐⭐ Bậc Thầy'};
/* Mỗi boss là CÙNG một khuôn SVG, khác bảng màu VÀ khác bộ phận lắp lên. Mười cái
   tên riêng (Ốc Sên, Zombie, Bạch Tuộc...) nay có mười bóng dáng riêng, mà vẫn chỉ
   một bản vẽ duy nhất phải bảo trì.
   Bộ phận không chọn cho đẹp — nó BÁO TRƯỚC LỐI ĐÁNH, để trẻ chưa kịp đọc mechTxt
   vẫn thấy nguy hiểm: giáp → vảy lưng, hút máu → nanh, cuồng nộ → sừng, hồi máu →
   mũ/gậy phù thuỷ. Độ khó lên thì hình cũng "nặng" thêm: cấp 1–2 mềm và không sừng,
   cấp 3–4 mọc nanh vảy cánh, cấp 5 đội vương miện và khoác áo choàng. */
const BOSS_ART=[
  {body:'#8fd36a',belly:'#e8ffd6',horn:'#c9e88a',horns:0,parts:['shell','stalks']},
  {body:'#b07cff',belly:'#efe4ff',horn:'#ffc93c',horns:0,parts:['antennae']},
  {body:'#7fae7a',belly:'#dff0dc',horn:'#9ad18f',horns:0,parts:['stitches','fangs']},
  {body:'#9a8f72',belly:'#efe7d2',horn:'#d8c79a',horns:1,parts:['plates','tail','fangs']},
  {body:'#ff6a4d',belly:'#ffd9cf',horn:'#ffb02e',horns:1,parts:['fangs']},
  {body:'#c05a8f',belly:'#ffd9ec',horn:'#f2a0c8',horns:0,parts:['cape','wings','ears','fangs']},
  {body:'#5fc9e8',belly:'#d6f4ff',horn:'#bfeeff',horns:1,parts:['wings','tail','plates']},
  {body:'#ffcf3d',belly:'#fff3c4',horn:'#ff9a2e',horns:1,parts:['crown','cape','fangs']},
  {body:'#7f6ce0',belly:'#e3dcff',horn:'#b6a6ff',horns:1,parts:['hat','staff','cape']},
  {body:'#3fb8b0',belly:'#d3f6f3',horn:'#7fe0d8',horns:0,parts:['tentacles','fangs']},
];
/* Bơm hình từ <template> vào một vỏ rỗng. Vỏ là <svg> (như #bossSprite) thì chép
   phần thân vào trong; vỏ là thẻ thường thì gắn nguyên cả <svg> vào.
   KHÔNG dùng <use>: <use> giấu nội dung trong shadow DOM nên CSS ngoài không
   animate được mắt/tay. */
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
/* Kho bộ phận lắp ghép. Mỗi tên ở đây có một <g class="bp bp-*"> trong #tplBeast
   và một luật .p-* trong styles/app.css. Thêm bộ phận mới = thêm ba chỗ đó, không hơn. */
const BEAST_PARTS=['wings','tail','shell','plates','tentacles','ghost','fangs','stitches',
  'crown','hat','cape','stinger','stalks','antennae','ears','coil','claws','staff'];
/* Tô bảng màu VÀ lắp bộ phận lên một hình quái đã dựng. Tách riêng khỏi paintBoss để
   bản đồ, màn giới thiệu và Gõ Chữ dùng chung đúng một đường tô màu.
   TRƯỚC: hàm này chỉ đặt ba biến màu, nên toàn bộ hệ .bp/.p-* là MÃ CHẾT — 20 nhân
   vật có 20 cái tên riêng nhưng dùng chung một khối tròn có sừng. */
function applySkin(el,art){
  if(!el||!art)return el;
  el.style.setProperty('--c-body',art.body);
  el.style.setProperty('--c-belly',art.belly);
  el.style.setProperty('--c-horn',art.horn);
  el.classList.toggle('no-horns',!art.horns);
  const on=Array.isArray(art.parts)?art.parts:[];
  /* Bật/tắt CẢ 18 chứ không chỉ bật cái cần: cùng một vỏ <svg> (#bossSprite) bị tô
     lại cho boss khác, không tắt thì con sau đội luôn vương miện của con trước. */
  for(const k of BEAST_PARTS)el.classList.toggle('p-'+k,on.includes(k));
  return el;
}
/* Dựng sẵn một con quái theo bảng màu — dùng cho bản đồ, màn giới thiệu, Gõ Chữ. */
function buildBeastArt(art){
  const svg=buildArt('tplBeast');
  return svg?applySkin(svg,art):null;
}
/* Trộn hai màu hex. Nhờ đó bảng màu "giai đoạn 2" pha được từ bảng màu gốc,
   khỏi phải chép tay thêm 10 bảng nữa. */
function mixHex(a,b,t){
  const part=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const [ar,ag,ab]=part(a),[br,bg,bb]=part(b);
  const ch=(x,y)=>Math.round(x+(y-x)*t).toString(16).padStart(2,'0');
  return '#'+ch(ar,br)+ch(ag,bg)+ch(ab,bb);
}
/* Giai đoạn 2: thân ngả đỏ, sừng rực vàng và MỌC sừng kể cả con vốn không có —
   nhìn một cái là biết nó vừa hoá dạng, không cần đọc chữ. */
function rageArt(art){
  /* Trộn THẲNG màu gốc với đỏ cho ra nâu bùn khi thân vốn màu lục (lục + đỏ = nâu,
     không tránh được). Nên đi ngược lại: lấy đỏ giận dữ làm nền, chỉ pha 15% màu gốc
     để còn nhận ra là con nào, và GIỮ NGUYÊN màu sừng làm sợi dây nhận dạng. */
  /* Giữ nguyên `parts`: hoá dạng là ĐỔI MÀU, không phải rụng mất cánh với xúc tu. */
  return {body:mixHex('#c62334',art.body,.15),belly:mixHex(art.belly,'#ff9aa4',.6),
          horn:art.horn||'#ffb02e',horns:1,parts:art.parts};
}
function bossArt(b){return b.art||BOSS_ART[BOSSES.indexOf(b)]||BOSS_ART[0];}
function paintBoss(b){
  const el=$('bossSprite');if(!el)return;
  if(!el.childElementCount)fillArt(el,'tplBeast');   // vỏ rỗng lúc chưa khởi động xong
  el.classList.remove('phase2');
  applySkin(el,bossArt(b));
  el.setAttribute('aria-label',b.name||'Quái vật');
}
