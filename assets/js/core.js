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

/* ============ ÂM THANH 8-BIT ============ */
let AC=null, SOUND_ON=true;
function ac(){if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();return AC}
function toggleSound(){
  SOUND_ON=!SOUND_ON;
  document.querySelectorAll('#sndBtn,#sndBtnHome').forEach(b=>{
    b.textContent=SOUND_ON?'🔊':'🔇';b.classList.toggle('muted',!SOUND_ON);
    b.setAttribute('aria-pressed',String(!SOUND_ON));
  });
  window.GameStorage?.updateSettings?.({sound:SOUND_ON});
  if(SOUND_ON)SFX.click();
}
function tone(freq,dur,type='square',vol=.15,delay=0){
  if(!SOUND_ON)return;
  try{
    const a=ac(),o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,a.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+delay+dur);
    o.connect(g);g.connect(a.destination);
    o.start(a.currentTime+delay);o.stop(a.currentTime+delay+dur);
  }catch(e){}
}
const SFX={
  shoot(){tone(300,.12,'sawtooth',.12);tone(600,.15,'square',.1,.05)},
  hit(){tone(150,.2,'square',.18);tone(90,.25,'sawtooth',.15,.05)},
  crit(){[400,600,800,1200].forEach((f,i)=>tone(f,.15,'square',.14,i*.06))},
  right(){tone(660,.1,'square',.12);tone(880,.15,'square',.12,.1)},
  wrong(){tone(200,.2,'sawtooth',.15);tone(140,.3,'sawtooth',.13,.12)},
  heal(){tone(523,.1,'sine',.14);tone(659,.1,'sine',.14,.08);tone(784,.15,'sine',.14,.16)},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,.2,'square',.13,i*.12))},
  tick(){tone(1000,.05,'square',.08)},
  click(){tone(520,.05,'square',.07);tone(760,.05,'square',.06,.04)},
  open(){tone(392,.09,'sine',.11);tone(523,.12,'sine',.11,.07)},
  buy(){[523,659,784].forEach((f,i)=>tone(f,.11,'triangle',.12,i*.06))},
  item(){tone(880,.08,'triangle',.12);tone(1175,.12,'triangle',.11,.07)},
  shield(){tone(300,.14,'sine',.14);tone(450,.18,'sine',.12,.08)},
  unlock(){tone(700,.06,'square',.08);tone(1000,.08,'square',.08,.05)},
  bossRoar(){[180,150,120,90].forEach((f,i)=>tone(f,.28,'sawtooth',.16,i*.09))},
  defeat(){[400,330,260,190].forEach((f,i)=>tone(f,.26,'sawtooth',.13,i*.16))},
  levelup(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,.14,'triangle',.12,i*.07))},
  gold(){[784,988,1175,1568].forEach((f,i)=>tone(f,.12,'sine',.13,i*.07))},
  perk(){tone(440,.1,'square',.12);tone(554,.1,'square',.12,.08);tone(659,.2,'square',.13,.16)},
};
window.SFX=SFX;

/* ============ 10 BOSS — độ khó tăng dần (KHÔNG hiện lớp) ============ */
const RANKS={1:'⭐ Khởi Động',2:'⭐⭐ Thử Thách',3:'⭐⭐⭐ Cao Thủ',4:'⭐⭐⭐⭐ Huyền Thoại',5:'⭐⭐⭐⭐⭐ Bậc Thầy'};
const BOSSES=[
 {emoji:'🐌',p2:'🐛',name:'Ốc Sên Chậm Chạp',hp:130,minQ:6, atk:13,tier:1,time:22,arena:'',     mech:'none', mechTxt:'Không có gì đặc biệt',proj:'🍃'},
 {emoji:'👾',p2:'👹',name:'Quái Nhí Tinh Nghịch',hp:170,minQ:7, atk:15,tier:1,time:21,arena:'',     mech:'none', mechTxt:'Nhanh nhẹn hơn một chút',proj:'🟣'},
 {emoji:'🧟',p2:'🧛',name:'Zombie Lười Học',hp:215,minQ:8, atk:17,tier:2,time:21,arena:'night',mech:'heal', mechTxt:'💚 Tự hồi 8 máu mỗi khi em trả lời sai',proj:'🦴'},
 {emoji:'🦖',p2:'🐲',name:'Khủng Long Giáp Sắt',hp:260,minQ:9, atk:18,tier:2,time:20,arena:'',     mech:'armor',mechTxt:'🛡️ Giáp cứng: giảm 4 sát thương mỗi đòn',proj:'🪨'},
 {emoji:'👹',p2:'😈',name:'Quỷ Đỏ Nóng Tính',hp:310,minQ:10,atk:20,tier:3,time:20,arena:'lava', mech:'rage', mechTxt:'😡 Nổi giận khi máu thấp: đánh mạnh gấp rưỡi',proj:'🔥'},
 {emoji:'🧛',p2:'🦇',name:'Ma Cà Rồng Toán Học',hp:360,minQ:11,atk:21,tier:3,time:19,arena:'night',mech:'drain',mechTxt:'🩸 Hút máu: đánh trúng em là hắn hồi máu',proj:'🦇'},
 {emoji:'🐉',p2:'🐲',name:'Rồng Băng Vĩnh Cửu',hp:420,minQ:12,atk:23,tier:4,time:19,arena:'ice',  mech:'armor',mechTxt:'🛡️ Vảy băng: giảm 5 sát thương mỗi đòn',proj:'❄️'},
 {emoji:'👑',p2:'🦹',name:'Vua Quái Vật Tối Thượng',hp:500,minQ:14,atk:25,tier:4,time:18,arena:'lava', mech:'rage', mechTxt:'😡 Cuồng nộ khi máu thấp + đòn đánh cực mạnh',proj:'☄️'},
 {emoji:'🧙',p2:'🔮',name:'Pháp Sư Phân Số',hp:560,minQ:15,atk:26,tier:5,time:19,arena:'night',mech:'heal', mechTxt:'💚 Phép hồi máu: mỗi lần em sai hắn hồi 10 máu',proj:'✨'},
 {emoji:'🐙',p2:'🦖',name:'Bạch Tuộc Vô Cực',hp:640,minQ:17,atk:28,tier:5,time:19,arena:'ice',  mech:'drain',mechTxt:'🩸 Tám xúc tu hút máu + giai đoạn 2 cực mạnh',proj:'🌊'},
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

function drawMap(){
  const m=$('map');if(!m)return;   // trang chủ có thể không hiện bản đồ
  m.innerHTML='';
  BOSSES.forEach((b,i)=>{
    const d=document.createElement('div');
    d.className='mapnode'+(i>G.cleared+1?' locked':'')+(i<=G.cleared?' done':'');
    d.innerHTML=`<span class="em">${i<=G.cleared?'✅':b.emoji}</span>${b.name.split(' ')[0]} ${b.name.split(' ')[1]||''}<br><span class="tierlbl">${'⭐'.repeat(b.tier)}</span>`;
    m.appendChild(d);
  });
}
drawMap();

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
  ie.textContent=b.emoji;
  ie.classList.remove('introZoom');void ie.offsetWidth;ie.classList.add('introZoom');
  $('introName').textContent=b.name.toUpperCase();
  $('introDesc').innerHTML=
    `❤️ Máu: <b>${b.hp}</b> &nbsp; ⚔️ Sức đánh: <b>${b.atk}</b> &nbsp; ⏰ Mỗi câu: <b>${b.time+(G.perks?.time||0)*3}s</b><br>
     🏅 Cấp độ: <b>${RANKS[b.tier]}</b><br>
     🎯 Cần trả lời đúng ít nhất <b>${b.minQ} câu</b> mới hạ được boss này!<br>
     🔢 Mỗi câu có <b>${b.tier>=3?5:4} lựa chọn</b> — các đáp án sai đều rất "giống thật"!<br>
     ✨ Đặc điểm: <b>${b.mechTxt}</b>`;
  $('introCoins').textContent=G.coins||0;
  const bag=['potion','hint','freeze','shield','bomb'].reduce((s,k)=>s+(G.inv?.[k]||0),0);
  if(bag>0)$('introDesc').innerHTML+=`<br><span style="color:#1c9c5b">🎒 Em đang mang <b>${bag} vật phẩm</b> — bấm nút vật phẩm ngay trên câu hỏi để dùng!</span>`;
  showScreen('intro');
}
function beginBattle(){
  battleRunId++;
  const b=BOSSES[G.bossIndex];
  G.bossHp=b.hp;G.bossMaxHp=b.hp;G.locked=false;
  $('arena').className='arena '+b.arena;
  $('bossSprite').textContent=b.emoji;
  $('bossName').textContent=b.emoji+' '+b.name.split(' ').slice(0,2).join(' ');
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
  drawMap();showScreen('home');
}

/* =========================================================
   ⚡ CHẾ ĐỘ ĐẤU NHANH 60 GIÂY & ♾️ CHẾ ĐỘ SINH TỒN
   Dùng chung màn chiến đấu nhưng đổi luật:
   - Đấu nhanh: 1 đồng hồ 60 giây cho cả ván, sai bị trừ 5 giây
   - Sinh tồn: 3 mạng ❤️, độ khó tăng dần vô tận, đổi quái mỗi 6 câu
========================================================= */
const RECORDS={blitz:0,surv:0};
const SURV_MONSTERS=['👾','🧟','🦖','👹','🧛','🐉','👻','🤖','🦑','🐲','😈','👽'];

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
  prepArenaForMode('♾️ Quái Vật Vô Tận',pick(SURV_MONSTERS),'night');
  showScreen('battle');
  SFX.bossRoar();
  newQuestion();
}
function prepArenaForMode(name,emoji,theme){
  document.querySelector('.hprow').style.display='none';   // 2 chế độ này không dùng thanh máu
  $('arena').className='arena '+theme;
  $('bossSprite').textContent=emoji;
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
  $('seRank').innerHTML=`Xếp hạng: <b style="font-size:1.3em;color:#c98a00">${r[2]}</b><br>${r[3]}`
    +(isRecord&&G.score>0?'<br><b style="color:#1c9c5b">🎉 KỶ LỤC MỚI!</b>':'');
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
    boss.textContent=pick(SURV_MONSTERS);
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
  drawMap();
  startAdventure();
}
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const screen=$(id);screen.classList.add('active');
  requestAnimationFrame(()=>{
    const heading=screen.querySelector('h1,h2');
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  });
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
      <span class="sd">${it.desc}</span><br><span class="sd" style="color:#8d6bff">${tag}</span></span>
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
  drawMap();showIntro();
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
    arena.appendChild(d);setTimeout(()=>d.remove(),13000);
  };
  spawn();spawn();
  ambientId=setInterval(spawn, theme==='lava'?450:theme==='ice'?600:1600);
}
function stopAmbient(){
  if(ambientId){clearInterval(ambientId);ambientId=null;}
  document.querySelectorAll('.ambient').forEach(e=>e.remove());
}
