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

/* ============ TIỆN ÍCH ============ */
function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function pick(a){return a[ri(0,a.length-1)]}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
const $=id=>document.getElementById(id);

let SOUND_ON=true;
function toggleSound(){
  SOUND_ON=!SOUND_ON;
  document.querySelectorAll('#sndBtn,#sndBtnHome').forEach(b=>{
    b.textContent=SOUND_ON?'🔊':'🔇';b.classList.toggle('muted',!SOUND_ON);
    b.setAttribute('aria-pressed',String(SOUND_ON));   // nút đang "bấm xuống" = âm thanh đang bật
  });
  window.GameStorage?.updateSettings?.({sound:SOUND_ON});
  if(SOUND_ON)SFX.click();
}
/* ============ ÂM THANH ============
   Vẫn tự sinh hoàn toàn bằng Web Audio, không kèm một file .mp3/.ogg nào — PWA giữ
   nguyên kích thước và chơi offline được. Khác bản 8-bit cũ ở bốn điểm:
     1. Có envelope ADSR thật: bản cũ nhảy gain 0→vol tức thì nên tiếng nào cũng "cụp"
        một phát ở đầu. Attack 6–20ms khử hẳn tiếng cụp đó.
     2. Mỗi tiếng đi qua lowpass; sawtooth/square thô được bo lại cho đỡ chói tai trẻ con.
     3. Có bus master: gain → compressor → loa, kèm một nhánh reverb dùng ConvolverNode
        với impulse response TỰ SINH (nhiễu tắt dần) nên vẫn không cần file.
     4. Cao độ dao động ngẫu nhiên ±1.5% và có giới hạn số giọng cùng lúc, để nghe
        100 lần không bị nhàm và không vỡ tiếng khi nhiều hiệu ứng chồng nhau. */
let AC=null, BUS=null, VOICES=0;
const MAX_VOICES=14;          // quá số này thì bỏ tiếng mới, tránh vỡ loa khi combo dài
function ac(){
  if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
  return AC;
}
/* Chính sách autoplay: AudioContext sinh ra ở trạng thái suspended cho tới khi có
   thao tác thật của người dùng. Gọi lại resume() ở mỗi lần phát cho chắc. */
function audioBus(){
  const a=ac();
  if(a.state==='suspended')a.resume().catch(()=>{});
  if(BUS)return BUS;
  const master=a.createGain();master.gain.value=.9;
  const comp=a.createDynamicsCompressor();
  comp.threshold.value=-14;comp.knee.value=22;comp.ratio.value=8;
  comp.attack.value=.004;comp.release.value=.18;
  // Impulse response tự sinh: nhiễu trắng tắt dần theo hàm mũ = phòng nhỏ.
  const dur=1.1,rate=a.sampleRate,len=Math.floor(rate*dur);
  const ir=a.createBuffer(2,len,rate);
  for(let ch=0;ch<2;ch++){
    const d=ir.getChannelData(ch);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);
  }
  const conv=a.createConvolver();conv.buffer=ir;
  const wet=a.createGain();wet.gain.value=.16;   // vọng nhẹ thôi, đủ tạo chiều sâu
  master.connect(comp);comp.connect(a.destination);
  master.connect(conv);conv.connect(wet);wet.connect(comp);
  BUS={a,master};
  return BUS;
}
function voice(node,stopAt){
  VOICES++;
  node.onended=()=>{VOICES--};
  try{node.stop(stopAt)}catch(e){VOICES--}
}
/* Một nốt có nhạc tính: ADSR + lowpass + rung cao độ nhẹ. */
function tone(freq,dur,type='square',vol=.15,delay=0,opt){
  if(!SOUND_ON)return;
  if(VOICES>=MAX_VOICES)return;
  try{
    const {a,master}=audioBus();
    const o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
    const t=a.currentTime+delay;
    const wobble=1+(Math.random()-.5)*.03;        // ±1,5% để không nghe như máy
    o.type=type;o.frequency.setValueAtTime(freq*wobble,t);
    if(opt&&opt.glide)o.frequency.exponentialRampToValueAtTime(Math.max(20,opt.glide),t+dur);
    if(opt&&opt.detune)o.detune.setValueAtTime(opt.detune,t);
    lp.type='lowpass';
    lp.frequency.setValueAtTime((opt&&opt.cutoff)||Math.min(a.sampleRate/2-1000,freq*5+900),t);
    lp.Q.value=(opt&&opt.q)||.7;
    const atk=(opt&&opt.attack)||.008, rel=Math.max(.03,dur-atk);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+atk);   // attack: hết tiếng "cụp"
    g.gain.exponentialRampToValueAtTime(.0001,t+atk+rel);
    o.connect(lp);lp.connect(g);g.connect(master);
    o.start(t);voice(o,t+atk+rel+.02);
  }catch(e){}
}
/* Nhiễu có bao hình — dùng cho tiếng va chạm, nổ, gõ. Đây là thứ bản cũ thiếu hẳn:
   sóng vuông không bao giờ ra được tiếng "bụp" của một cú đánh. */
function noise(dur,vol=.15,delay=0,opt){
  if(!SOUND_ON)return;
  if(VOICES>=MAX_VOICES)return;
  try{
    const {a,master}=audioBus();
    const len=Math.max(1,Math.floor(a.sampleRate*dur));
    const buf=a.createBuffer(1,len,a.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,(opt&&opt.shape)||1.8);
    const src=a.createBufferSource();src.buffer=buf;
    const f=a.createBiquadFilter();
    f.type=(opt&&opt.type)||'bandpass';
    const t=a.currentTime+delay;
    f.frequency.setValueAtTime((opt&&opt.freq)||900,t);
    if(opt&&opt.sweep)f.frequency.exponentialRampToValueAtTime(Math.max(60,opt.sweep),t+dur);
    f.Q.value=(opt&&opt.q)||1.1;
    const g=a.createGain();
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+.006);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(f);f.connect(g);g.connect(master);
    src.start(t);voice(src,t+dur+.02);
  }catch(e){}
}
/* Hợp âm rải — dùng cho các khoảnh khắc vui (thắng, lên cấp, mua đồ). */
function arp(freqs,step,dur,type,vol,opt){
  freqs.forEach((f,i)=>tone(f,dur,type,vol,i*step,opt));
}
const SFX={
  // Chưởng bay: nhiễu quét xuống + một nốt trượt cao độ = tiếng "vút"
  shoot(){noise(.16,.09,0,{type:'bandpass',freq:2600,sweep:700,q:.9});
          tone(520,.14,'sawtooth',.07,0,{glide:240,cutoff:2200,attack:.006})},
  // Va chạm: cú "bụp" trầm + thân nhiễu, thay cho hai sóng vuông cũ
  hit(){noise(.2,.16,0,{type:'lowpass',freq:1500,sweep:200,shape:2.4});
        tone(120,.22,'triangle',.15,0,{glide:60,cutoff:900,attack:.004})},
  crit(){noise(.26,.15,0,{type:'lowpass',freq:2600,sweep:260,shape:2.2});
         arp([500,760,1010,1420],.055,.16,'triangle',.11,{attack:.006,cutoff:4200})},
  right(){arp([660,880,1180],.07,.16,'triangle',.11,{attack:.01,cutoff:4000})},
  wrong(){tone(210,.28,'sawtooth',.12,0,{glide:120,cutoff:900,attack:.01});
          tone(150,.32,'triangle',.1,.06,{glide:88,cutoff:700})},
  heal(){arp([523,659,784,1047],.075,.24,'sine',.11,{attack:.03,cutoff:5200})},
  win(){arp([523,659,784,1047,1319],.11,.42,'triangle',.11,{attack:.014,cutoff:6000});
        noise(.5,.05,.05,{type:'highpass',freq:2400,shape:1.1})},
  tick(){tone(1150,.045,'sine',.06,0,{attack:.003,cutoff:3600})},
  click(){tone(560,.055,'sine',.07,0,{attack:.003,cutoff:2600});
          tone(820,.05,'sine',.045,.035,{attack:.003,cutoff:3400})},
  open(){arp([392,523,698],.06,.2,'sine',.09,{attack:.02,cutoff:4200})},
  buy(){arp([523,659,784,1047],.055,.18,'triangle',.1,{attack:.008,cutoff:5000});
        noise(.12,.05,0,{type:'highpass',freq:3200,shape:1.4})},
  item(){tone(920,.1,'triangle',.1,0,{attack:.005,cutoff:5200});
         tone(1240,.14,'sine',.09,.06,{attack:.006,cutoff:6000})},
  shield(){tone(300,.3,'sine',.12,0,{glide:440,attack:.05,cutoff:2400});
           noise(.3,.05,0,{type:'bandpass',freq:1200,sweep:2600,q:2})},
  unlock(){tone(740,.07,'triangle',.08,0,{attack:.004,cutoff:4000});
           tone(1050,.1,'sine',.08,.05,{attack:.005,cutoff:5000})},
  // Boss gầm: hai dao động lệch nhau tạo nhịp đập, cộng nhiễu trầm
  bossRoar(){tone(92,.62,'sawtooth',.15,0,{glide:58,cutoff:520,attack:.03});
             tone(96,.6,'sawtooth',.12,0,{glide:61,cutoff:480,attack:.03,detune:14});
             noise(.55,.1,0,{type:'lowpass',freq:700,sweep:130,shape:1.5})},
  defeat(){arp([420,340,268,196],.16,.34,'sawtooth',.11,{attack:.02,cutoff:1400});
           noise(.5,.06,.2,{type:'lowpass',freq:900,sweep:150,shape:2})},
  levelup(){arp([523,659,784,1047,1319,1568],.065,.3,'triangle',.1,{attack:.008,cutoff:6500});
            noise(.35,.05,.1,{type:'highpass',freq:2800,shape:1.2})},
  gold(){arp([880,1175,1568,2093],.055,.2,'sine',.1,{attack:.004,cutoff:7000})},
  perk(){arp([440,554,659,880],.075,.26,'triangle',.11,{attack:.01,cutoff:4800})},
};
window.SFX=SFX;

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
   và một luật .p-* trong main.css. Thêm bộ phận mới = thêm ba chỗ đó, không hơn. */
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
/* `desc` là câu giới thiệu TÍNH CÁCH, hiện ở màn "BOSS XUẤT HIỆN". Nó phải nhắc
   đúng thứ trẻ NHÌN THẤY trên hình (cái vỏ, vết khâu, xúc tu...) — nếu tả một đằng
   vẽ một nẻo thì lại rơi vào đúng cái lỗi vừa sửa. */
const BOSSES=[
 {emoji:'🐌',name:'Ốc Sên Chậm Chạp',hp:130,minQ:6, atk:13,tier:1,time:22,arena:'',     mech:'none', mechTxt:'Không có gì đặc biệt',proj:'🍃',
  desc:'Cõng cái vỏ nặng trịch, bò tới đâu ngủ gật tới đó. Hai con mắt trên cuống cứ ngó nghiêng tìm chỗ trốn — em cứ bình tĩnh mà tính.'},
 {emoji:'👾',name:'Quái Nhí Tinh Nghịch',hp:170,minQ:7, atk:15,tier:1,time:21,arena:'',     mech:'none', mechTxt:'Nhanh nhẹn hơn một chút',proj:'🟣',
  desc:'Bé tí, chưa mọc sừng, hai cái râu ngoe nguẩy suốt ngày. Nó không mạnh — chỉ nhanh nhẹn và thích chọc phá thôi.'},
 {emoji:'🧟',name:'Zombie Lười Học',hp:215,minQ:8, atk:17,tier:2,time:21,arena:'night',mech:'heal', mechTxt:'💚 Tự hồi 8 máu mỗi khi em trả lời sai',proj:'🦴',
  desc:'Cả người chằng chịt vết khâu vì bị đánh gục hoài mà cứ tự vá lại. Em sai một câu là mấy đường chỉ ấy tự liền — đừng cho nó cơ hội.'},
 {emoji:'🦖',name:'Khủng Long Giáp Sắt',hp:260,minQ:9, atk:18,tier:2,time:20,arena:'',     mech:'armor',mechTxt:'🛡️ Giáp cứng: giảm 4 sát thương mỗi đòn',proj:'🪨',
  desc:'Dãy vảy nhọn chạy dọc sống lưng cứng như sắt, đuôi quật một cái là rung cả sàn đấu. Đòn của em bị vảy nuốt bớt, phải đánh nhiều hơn.'},
 {emoji:'👹',name:'Quỷ Đỏ Nóng Tính',hp:310,minQ:10,atk:20,tier:3,time:20,arena:'lava', mech:'rage', mechTxt:'😡 Nổi giận khi máu thấp: đánh mạnh gấp rưỡi',proj:'🔥',
  desc:'Đôi sừng đỏ rực và cặp nanh lúc nào cũng nhe ra. Càng gần thua nó càng điên tiết, đánh mạnh gấp rưỡi — hạ nhanh khi còn kịp.'},
 {emoji:'🧛',name:'Ma Cà Rồng Toán Học',hp:360,minQ:11,atk:21,tier:3,time:20,arena:'night',mech:'drain',mechTxt:'🩸 Hút máu: đánh trúng em là hắn hồi máu',proj:'🦇',
  desc:'Khoác áo choàng, tai dơi dỏng lên nghe từng nhịp thở, hai cái nanh dài chờ sẵn. Mỗi đòn trúng em là một ngụm máu cho hắn.'},
 {emoji:'🐉',name:'Rồng Băng Vĩnh Cửu',hp:420,minQ:12,atk:23,tier:4,time:19,arena:'ice',  mech:'armor',mechTxt:'🛡️ Vảy băng: giảm 5 sát thương mỗi đòn',proj:'❄️',
  desc:'Cánh băng, đuôi băng, vảy lưng cũng bằng băng — thứ băng ngàn năm không tan. Đòn của em chạm vào là lạnh cóng và yếu đi.'},
 {emoji:'👑',name:'Vua Quái Vật Tối Thượng',hp:500,minQ:13,atk:25,tier:4,time:19,arena:'lava', mech:'rage', mechTxt:'😡 Cuồng nộ khi máu thấp + đòn đánh cực mạnh',proj:'☄️',
  desc:'Vương miện vàng, áo choàng đỏ, sừng cao ngất — kẻ cai trị cả chín con quái trước. Chạm tới vương miện là nó nổi cơn cuồng nộ.'},
 {emoji:'🧙',name:'Pháp Sư Phân Số',hp:560,minQ:14,atk:26,tier:5,time:19,arena:'night',mech:'heal', mechTxt:'💚 Phép hồi máu: mỗi lần em sai hắn hồi 10 máu',proj:'✨',
  desc:'Mũ chóp che nửa mặt, cây gậy đầu gắn viên ngọc sáng. Mỗi lần em tính sai một phân số là viên ngọc loé lên và hắn lành lại.'},
 {emoji:'🐙',name:'Bạch Tuộc Vô Cực',hp:640,minQ:15,atk:28,tier:5,time:19,arena:'ice',  mech:'drain',mechTxt:'🩸 Tám xúc tu hút máu + giai đoạn 2 cực mạnh',proj:'🌊',
  desc:'Tám cái xúc tu quấn kín sàn đấu, mỗi cái là một cái miệng hút. Hạ được một nửa máu là nó lột xác sang dạng hai — trận cuối cùng, khó nhất.'},
];
/* Giới hạn sát thương mỗi đòn = máu boss / số câu tối thiểu.
   Nhờ vậy dù có combo, chí mạng hay câu vàng cũng KHÔNG THỂ
   hạ boss trong vài câu — luôn phải trả lời đúng ít nhất minQ câu. */
function dmgCap(){const b=BOSSES[G.bossIndex];return Math.ceil(b.hp/b.minQ);}
const HERO_PROJ=['⚡','🔵','✨','💫'];

/* ============ CỬA HÀNG VẬT PHẨM (mua bằng xu 💰) ============ */
const SHOP=[
 // ---- Nâng cấp dùng suốt hành trình hiện tại (mua nhiều lần, giá tăng dần) ----
 {id:'atk',   icon:'🗡️',name:'Kiếm Sấm Sét',  desc:'+4 sát thương mỗi đòn trong hành trình', base:80, kind:'perk'},
 {id:'hp',    icon:'💖',name:'Trái Tim Titan', desc:'+25 máu tối đa và hồi đầy máu',          base:80, kind:'perk'},
 {id:'time',  icon:'⏳',name:'Đồng Hồ Cát Thần',desc:'+3 giây suy nghĩ cho mỗi câu',          base:70, kind:'perk'},
 {id:'def',   icon:'🦺',name:'Áo Giáp Vàng',   desc:'Giảm 4 sát thương từ mọi đòn của boss',  base:80, kind:'perk'},
 {id:'luck',  icon:'🍀',name:'Cỏ May Mắn',     desc:'Gấp đôi cơ hội rơi tim hồi máu',         base:60, kind:'perk'},
 {id:'gold',  icon:'💛',name:'La Bàn Vàng',    desc:'Câu hỏi vàng xuất hiện gấp đôi',         base:60, kind:'perk'},
 // ---- Vật phẩm mang vào trận, bấm để dùng khi cần ----
 {id:'potion',icon:'🧪',name:'Bình Máu Thần',  desc:'Hồi 50 máu ngay giữa trận',              base:50, kind:'inv'},
 {id:'hint',  icon:'💡',name:'Kính Lúp 50/50', desc:'Xoá bớt 2 đáp án sai của câu đang làm',  base:40, kind:'inv'},
 {id:'freeze',icon:'⏱️',name:'Đồng Hồ Dừng',   desc:'Dừng hẳn đếm giờ cho câu đang làm',      base:45, kind:'inv'},
 {id:'shield',icon:'🛡️',name:'Khiên Chắn Thần',desc:'Chặn hoàn toàn đòn đánh tới của boss',   base:55, kind:'inv'},
 {id:'bomb',  icon:'💣',name:'Bom Toán Học',   desc:'Nổ trừ 18% máu boss (1 quả mỗi trận)',   base:70, kind:'inv'},
 {id:'revive',icon:'🔮',name:'Bùa Hồi Sinh',   desc:'Tự sống lại với 50 máu khi gục ngã',     base:120,kind:'inv',max:2},
];
function itemPrice(it){
  if(it.kind==='perk')return it.base+(G.perks?.[it.id]||0)*30; // càng mua càng đắt
  return it.base;
}
function itemOwned(it){
  return it.kind==='perk'?(G.perks?.[it.id]||0):it.kind==='inv'?(G.inv?.[it.id]||0):0;
}

/* ============ TRẠNG THÁI ============ */
const savedAdventure=window.GameStorage?.load?.().adventure||{};
let G={bossIndex:0,cleared:Number.isInteger(savedAdventure.cleared)?savedAdventure.cleared:-1};
let timerId=null,timeLeft=0,timeTotal=0,ambientId=null;
let battleRunId=0;
const BASE_HERO_HP=130, BASE_HERO_ATK=14;

function heroMaxHp(){return BASE_HERO_HP+(G.perks?.hp||0)*25}
function heroAtk(){return BASE_HERO_ATK+(G.perks?.atk||0)*4}
function cleanCount(value,max=99){return Math.min(max,Math.max(0,Math.floor(Number(value)||0)))}
function cleanBag(source,keys,max=99){
  return keys.reduce((bag,key)=>{bag[key]=cleanCount(source?.[key],max);return bag;},{});
}
function saveAdventureProgress(){
  if(G.mode!=='adv'||!G.perks||!G.inv)return;
  const cleared=Number.isFinite(Number(G.cleared))?Math.floor(Number(G.cleared)):-1;
  window.GameStorage?.setAdventure?.({
    active:true,
    bossIndex:Math.min(BOSSES.length-1,Math.max(0,cleanCount(G.bossIndex,BOSSES.length-1))),
    cleared:Math.min(BOSSES.length-1,Math.max(-1,cleared)),
    coins:cleanCount(G.coins,999999),
    heroHp:cleanCount(G.heroHp,9999),
    perks:cleanBag(G.perks,['atk','hp','time','luck','def','gold'],20),
    inv:cleanBag(G.inv,['potion','hint','freeze','shield','bomb','revive'],99),
  });
}

function startAdventure(){
  const stored=window.GameStorage?.load?.().adventure||{};
  const cleared=Math.min(BOSSES.length-1,Math.max(-1,Number.isInteger(stored.cleared)?stored.cleared:G.cleared));
  const perks=cleanBag(stored.perks,['atk','hp','time','luck','def','gold'],20);
  const inv=cleanBag(stored.inv,['potion','hint','freeze','shield','bomb','revive'],99);
  const suggestedBoss=Math.max(cleared+1,Number.isInteger(stored.bossIndex)?stored.bossIndex:0);
  G={mode:'adv',bossIndex:Math.min(suggestedBoss,BOSSES.length-1),cleared,
     perks,
     coins:Number.isFinite(Number(stored.coins))?cleanCount(stored.coins,999999):70, inv,
     heroHp:0,correct:0,wrong:0,timeout:0,goldHit:0,streak:0,bestStreak:0,crit:false,locked:false};
  G.heroHp=Number.isFinite(Number(stored.heroHp))&&Number(stored.heroHp)>0
    ?Math.min(heroMaxHp(),cleanCount(stored.heroHp,9999)):heroMaxHp();
  saveAdventureProgress();
  showIntro();
}
function showIntro(){
  const b=BOSSES[G.bossIndex];
  const ie=$('introEmoji');
  /* Trước đây chỗ này là emoji (🐌) trong khi sàn đấu vẽ một con quái SVG khác hẳn —
     hai nhân vật cho cùng một boss. Nay dựng đúng con quái ấy với đúng bảng màu. */
  if(!fillArt(ie,'tplBeast'))ie.textContent=b.emoji;
  else applySkin(ie.firstElementChild,bossArt(b));
  ie.classList.remove('introZoom');void ie.offsetWidth;ie.classList.add('introZoom');
  $('introName').textContent=b.name.toUpperCase();
  /* Câu giới thiệu tính cách đứng TRƯỚC bảng chỉ số: trẻ vừa nhìn thấy con quái xong,
     đọc ngay câu tả đúng cái nó vừa nhìn, rồi mới tới máu/sức đánh. */
  $('introDesc').innerHTML=
    (b.desc?`<span class="bossbio">${b.desc}</span>`:'')+
    `❤️ Máu: <b>${b.hp}</b> &nbsp; ⚔️ Sức đánh: <b>${b.atk}</b> &nbsp; ⏰ Mỗi câu: <b>${b.time+(G.perks?.time||0)*3}s</b><br>
     🏅 Cấp độ: <b>${RANKS[b.tier]}</b><br>
     🎯 Cần trả lời đúng ít nhất <b>${b.minQ} câu</b> mới hạ được boss này!<br>
     🔢 Mỗi câu có <b>${b.tier>=3?5:4} lựa chọn</b> — các đáp án sai đều rất "giống thật"!<br>
     ✨ Đặc điểm: <b>${b.mechTxt}</b>`;
  $('introCoins').textContent=G.coins||0;
  const bag=['potion','hint','freeze','shield','bomb'].reduce((s,k)=>s+(G.inv?.[k]||0),0);
  if(bag>0)$('introDesc').innerHTML+=`<br><span style="color:var(--green-ink)">🎒 Em đang mang <b>${bag} vật phẩm</b> — bấm nút vật phẩm ngay trên câu hỏi để dùng!</span>`;
  showScreen('intro');
}
function beginBattle(){
  battleRunId++;
  const b=BOSSES[G.bossIndex];
  G.bossHp=b.hp;G.bossMaxHp=b.hp;G.locked=false;
  $('arena').className='arena '+b.arena;
  paintBoss(b);
  $('bossName').textContent=b.name.split(' ').slice(0,2).join(' ');
  $('bossMech').textContent=
    b.mech==='armor'?'🛡️ Giáp':b.mech==='heal'?'💚 Hồi máu':b.mech==='rage'?'😡 Cuồng nộ':b.mech==='drain'?'🩸 Hút máu':'⭐ Thường';
  $('levelBadge').textContent='Boss '+(G.bossIndex+1)+'/'+BOSSES.length+' • '+'⭐'.repeat(b.tier);
  updateBars();updateAura();
  startAmbient(b.arena);
  showScreen('battle');
  document.querySelector('.hprow').style.display='';        // chế độ phiêu lưu: hiện lại thanh máu
  G.bombUsed=false;G.shieldOn=false;G.frozen=false;
  G.energy=0;G.ultReady=false;G.phase2=false;G.stunned=false;
  renderEnergy();
  updateHUD();
  newQuestion();
}
function retryBoss(){G.heroHp=heroMaxHp();G.streak=0;G.crit=false;beginBattle();}
function goHome(){
  battleRunId++;
  saveAdventureProgress();
  stopTimer();stopAmbient();
  clearInterval(G.blitzT);G.blitzT=null;
  clearTimeout(G.thinkT);
  G.thinkUntil=0;
  if(typeof cleanupTypingGame==='function')cleanupTypingGame();
  if(typeof cleanupSudokuGame==='function')cleanupSudokuGame();
  document.querySelectorAll('.proj,.trail,.beam,.ambient,.spark,.boom,.typing-spell,.typing-impact').forEach(el=>el.remove());
  $('restartModal').classList.remove('on');
  G.locked=true;G.mode=null;
  document.querySelector('.hprow').style.display='';
  showScreen('home');
}

/* =========================================================
   ⚡ CHẾ ĐỘ ĐẤU NHANH 60 GIÂY & ♾️ CHẾ ĐỘ SINH TỒN
   Dùng chung màn chiến đấu nhưng đổi luật:
   - Đấu nhanh: 1 đồng hồ 60 giây cho cả ván, sai bị trừ 5 giây
   - Sinh tồn: 3 mạng ❤️, độ khó tăng dần vô tận, đổi quái mỗi 6 câu
========================================================= */
const RECORDS={blitz:0,surv:0};

function baseRun(mode){
  battleRunId++;
  stopTimer();stopAmbient();clearInterval(G.blitzT);
  G={mode,bossIndex:0,cleared:G.cleared??-1,
     perks:{atk:0,hp:0,time:0,luck:0,def:0,gold:0},
     coins:0,inv:{potion:0,hint:0,freeze:0,shield:0,bomb:0,revive:0},
     heroHp:100,correct:0,wrong:0,timeout:0,goldHit:0,streak:0,bestStreak:0,
     crit:false,locked:false,score:0,lives:3,tier:1,energy:0,phase2:false};
}
function startBlitz(){
  baseRun('blitz');
  G.timeLeftTotal=60;
  prepArenaForMode('⚡ Bia Tập Bắn','🎯','');
  showScreen('battle');
  SFX.bossRoar();
  newQuestion();
  startBlitzClock(G.timeLeftTotal);
}
function startBlitzClock(seconds){
  clearInterval(G.blitzT);
  G.blitzEndsAt=performance.now()+Math.max(0,seconds)*1000;
  G.blitzT=setInterval(()=>{
    G.timeLeftTotal=Math.max(0,(G.blitzEndsAt-performance.now())/1000);
    if(G.timeLeftTotal<=0){clearInterval(G.blitzT);G.blitzT=null;renderModeBar();endRun();return;}
    renderModeBar();
  },100);
}
function startSurvival(){
  baseRun('surv');
  prepArenaForMode('♾️ Quái Vật Vô Tận','night');
  showScreen('battle');
  SFX.bossRoar();
  newQuestion();
}
function prepArenaForMode(name,theme){
  document.querySelector('.hprow').style.display='none';   // 2 chế độ này không dùng thanh máu
  $('arena').className='arena '+theme;
  paintBoss({art:BOSS_ART[G.bossIndex%BOSS_ART.length],name:'Quái vật'});
  $('bossName').textContent=name;
  $('bossMech').textContent=G.mode==='blitz'?'⚡ 60 giây':'♾️ Sinh tồn';
  G.bossHp=100;G.bossMaxHp=100;
  startAmbient(theme);
  updateBars();updateHUD();renderEnergy();
}
function renderModeBar(){
  if(G.mode==='blitz'){
    const f=$('timerFill'),n=$('timerNum');
    const pct=G.timeLeftTotal/60*100;
    f.style.width=pct+'%';n.textContent=Math.ceil(G.timeLeftTotal)+'s';
    const warn=pct<25;f.classList.toggle('warn',warn);n.classList.toggle('warn',warn);
    $('battleCard').classList.toggle('danger',warn);
    $('levelBadge').textContent='⚡ Điểm: '+G.score;
  }else if(G.mode==='surv'){
    $('levelBadge').textContent='♾️ Điểm: '+G.score+' · '+'❤️'.repeat(Math.max(0,G.lives));
  }
}
function endRun(){
  if(!$('battle').classList.contains('active'))return;
  stopTimer();stopAmbient();clearInterval(G.blitzT);clearTimeout(G.thinkT);
  const isBlitz=G.mode==='blitz';
  const key=isBlitz?'blitz':'surv';
  const isRecord=G.score>RECORDS[key];
  if(isRecord)RECORDS[key]=G.score;
  window.GameStorage?.updateRecords?.({[isBlitz?'blitz':'survival']:RECORDS[key]});
  if(G.score>0)window.GameStorage?.addStars?.(Math.max(1,Math.floor(G.score/8)));
  const ranks=isBlitz
    ?[[25,'💎','KIM CƯƠNG','Tốc độ đáng kinh ngạc!'],[18,'🥇','VÀNG','Rất nhanh và chính xác!'],
      [12,'🥈','BẠC','Khá lắm, cố thêm chút nữa!'],[6,'🥉','ĐỒNG','Khởi đầu tốt đấy!'],[0,'🎯','TẬP SỰ','Luyện thêm là nhanh ngay thôi!']]
    :[[40,'💎','HUYỀN THOẠI','Không ai cản nổi em!'],[28,'🥇','CAO THỦ','Bền bỉ tuyệt vời!'],
      [18,'🥈','THIỆN XẠ','Rất vững vàng!'],[9,'🥉','TÂN BINH','Đang tiến bộ nhanh!'],[0,'🌱','MẦM NON','Thử lại nào, em làm được mà!']];
  const r=ranks.find(x=>G.score>=x[0]);
  $('seEmoji').textContent=r[1];
  $('seTitle').textContent=isBlitz?'HẾT 60 GIÂY!':'HẾT MẠNG RỒI!';
  $('seRank').innerHTML=`Xếp hạng: <b style="font-size:1.3em;color:var(--gold-ink)">${r[2]}</b><br>${r[3]}`
    +(isRecord&&G.score>0?'<br><b style="color:var(--green-ink)">🎉 KỶ LỤC MỚI!</b>':'');
  $('seScore').textContent=G.score;
  $('seCorrect').textContent=G.correct;
  $('seStreak').textContent=G.bestStreak;
  $('seBest').textContent=RECORDS[key];
  $('seAgain').onclick=()=>{SFX.click();isBlitz?startBlitz():startSurvival()};
  if(isRecord&&G.score>0){SFX.win();confetti(50);}else SFX.defeat();
  showScreen('scoreEnd');
}
/* đổi quái + tăng độ khó trong chế độ sinh tồn */
function survAdvance(){
  if(!$('battle').classList.contains('active')||G.mode!=='surv')return;
  const boss=$('bossSprite');
  boss.classList.add('morphing');
  setTimeout(()=>{
    /* boss.textContent=... sẽ XOÁ SẠCH các nút con của <svg> và con quái biến mất
       hẳn (font-size:0 nên emoji thay thế cũng không hiện). Đổi quái = tô lại. */
    applySkin(boss,pick(BOSS_ART));
    boss.classList.remove('morphing');
  },400);
  G.tier=Math.min(5,G.tier+1);
  const themes=['','night','lava','ice'];
  const th=pick(themes);
  $('arena').className='arena '+th;startAmbient(th);
  SFX.bossRoar();screenFlash();
  comboPopup('🔥 QUÁI MỚI — KHÓ HƠN!');
}
function askRestart(){
  SFX.open();
  // dừng mọi đồng hồ để bé đọc menu mà không bị boss đánh
  G.pausedTime=(timerId&&!G.locked)?timeLeft:null;
  stopTimer();
  clearInterval(G.blitzT);G.blitzT=null;
  G.pausedThink=G.thinkUntil?Math.max(0,G.thinkUntil-performance.now()):0;
  clearTimeout(G.thinkT);G.thinkT=null;
  G.pauseLocked=G.locked; G.locked=true;
  const inRun=$('battle').classList.contains('active');
  $('pauseInfo').textContent=inRun?'Đồng hồ đã dừng — em cứ nghỉ thoải mái nhé!'
                                  :'Em muốn làm gì tiếp theo?';
  $('restartModal').classList.add('on');
}
function closeRestart(){
  SFX.click();
  $('restartModal').classList.remove('on');
  G.locked=G.pauseLocked||false;
  // chạy tiếp đúng chỗ vừa dừng
  if(G.pausedTime!=null&&!G.locked&&!G.frozen){
    startTimer(G.pausedTime,timeTotal);
  }
  if(G.mode==='blitz'&&G.timeLeftTotal>0){
    startBlitzClock(G.timeLeftTotal);
  }
  // Giữ đúng phần thời gian bắt buộc đọc đề còn lại, kể cả khi tạm dừng.
  if(!G.locked&&G.pausedThink>0&&typeof scheduleAnswerUnlock==='function')scheduleAnswerUnlock(G.pausedThink);
  else if(!G.locked&&typeof unlockCurrentAnswers==='function')unlockCurrentAnswers();
  G.pausedTime=null;
  G.pausedThink=0;
}
function goHomeFromPause(){
  SFX.click();
  $('restartModal').classList.remove('on');
  goHome();
}
function quickHome(){ SFX.click(); goHome(); }
function doRestart(){
  SFX.click();
  $('restartModal').classList.remove('on');
  stopTimer();stopAmbient();clearInterval(G.blitzT);clearTimeout(G.thinkT);
  const m=G.mode;
  if(m==='blitz'){startBlitz();return;}
  if(m==='surv'){startSurvival();return;}
  window.GameStorage?.setAdventure?.({active:true,bossIndex:0,cleared:-1,coins:70,heroHp:null,
    perks:{atk:0,hp:0,time:0,luck:0,def:0,gold:0},
    inv:{potion:0,hint:0,freeze:0,shield:0,bomb:0,revive:0}});
  G={bossIndex:0,cleared:-1};   // xoá sạch tiến độ, xu, vật phẩm
  startAdventure();
}
const BUSY_SCREENS=['battle','typingGame','sudokuGame'];
/* Hỏi lại mỗi lần thay vì nhớ một lần: người dùng có thể đổi cài đặt hệ điều hành
   giữa chừng mà không tải lại trang. */
function REDUCED_MOTION(){return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches}
/* Đổi màn: phần THAY ĐỔI DOM tách riêng để View Transitions gọi lại được.
   Trả về phần tử màn để nhánh gọi còn chuyển tiêu điểm. */
function swapScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const screen=$(id);screen.classList.add('active');
  document.body.classList.toggle('fx-quiet',BUSY_SCREENS.includes(id));
  return screen;
}
function focusScreen(screen){
  const heading=screen.querySelector('h1,h2');
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function showScreen(id){
  /* Người tắt hiệu ứng, hoặc trình duyệt chưa có API: đổi thẳng như cũ.
     KHÔNG await ở đây — tiêu điểm phải nhảy ngay, người dùng bàn phím không
     được chờ hết 380ms hoạt hình mới đọc được tiêu đề màn mới. */
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||typeof document.startViewTransition!=='function'){
    const screen=swapScreen(id);
    requestAnimationFrame(()=>focusScreen(screen));
    return;
  }
  let screen=null;
  const vt=document.startViewTransition(()=>{screen=swapScreen(id);});
  /* Đặt tiêu điểm ngay khi DOM đã đổi (vt.ready), chứ không đợi vt.finished:
     ảnh chụp chuyển tiếp chỉ là lớp phủ, nội dung thật đã sẵn sàng rồi. */
  vt.ready.then(()=>focusScreen(screen)).catch(()=>{if(screen)focusScreen(screen);});
}

/* ============ CỬA HÀNG ============ */
let shopMode='intro';
function openShop(mode){
  shopMode=mode;
  $('shopDoneBtn').textContent=mode==='next'?'⚔️ ĐÁNH BOSS TIẾP THEO!':'⬅ QUAY LẠI';
  if(mode==='defeat')$('shopDoneBtn').textContent='⬅ QUAY LẠI ĐÁNH LẠI';
  renderShop();
  showScreen('shop');
}
function closeShop(){
  if(shopMode==='next')nextBossGo();
  else if(shopMode==='defeat')showScreen('defeat');
  else showIntro();
}
function renderShop(){
  $('shopCoins').textContent=G.coins+' 💰';
  const grid=$('shopGrid');grid.innerHTML='';
  SHOP.forEach(it=>{
    const price=itemPrice(it),owned=itemOwned(it);
    const maxed=it.max&&owned>=it.max;
    const cant=G.coins<price||maxed;
    const d=document.createElement('button');
    d.className='shopitem'+(cant?' cant':'');
    const tag=it.kind==='perk'?'🗺️ suốt hành trình':'🎒 mang vào trận';
    d.innerHTML=`<span class="si">${it.icon}</span>
      <span style="flex:1"><span class="sn">${it.name}</span>${owned?` <span class="own">(có ${owned})</span>`:''}<br>
      <span class="sd">${it.desc}</span><br><span class="sd" style="color:var(--purple-ink)">${tag}</span></span>
      <span class="sp">${maxed?'ĐỦ':price+' 💰'}</span>`;
    d.onclick=()=>buyItem(it);
    grid.appendChild(d);
  });
}

function buyItem(it){
  const price=itemPrice(it);
  if(G.coins<price)return;
  if(it.max&&itemOwned(it)>=it.max)return;
  G.coins-=price;
  if(it.kind==='perk'){SFX.levelup();itemFly(it.icon);}else{SFX.buy();itemFly(it.icon);}
  if(it.kind==='perk'){
    G.perks[it.id]++;
    if(it.id==='hp')G.heroHp=heroMaxHp();
  }else{
    G.inv[it.id]++;
  }
  saveAdventureProgress();
  renderShop();
}

function nextBossGo(){
  G.cleared=Math.max(G.cleared,G.bossIndex);
  G.bossIndex++;
  G.heroHp=Math.min(heroMaxHp(),G.heroHp+40);
  saveAdventureProgress();
  showIntro();
}

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
let ambientTimers=[];
function startAmbient(theme){
  stopAmbient();
  drawGround(theme);
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
    // Gỡ chính mình khỏi danh sách khi chạy xong, nếu không mảng phình suốt ván
    // (theme lava đẻ quái nền mỗi 450ms).
    arena.appendChild(d);
    const gone=setTimeout(()=>{d.remove();ambientTimers=ambientTimers.filter(id=>id!==gone)},12500);
    ambientTimers.push(gone);
  };
  spawn();spawn();
  ambientId=setInterval(spawn, theme==='lava'?450:theme==='ice'?600:1600);
}
function stopAmbient(){
  if(ambientId){clearInterval(ambientId);ambientId=null;}
  ambientTimers.forEach(clearTimeout);ambientTimers=[];
  document.querySelectorAll('.ambient').forEach(e=>e.remove());
}
