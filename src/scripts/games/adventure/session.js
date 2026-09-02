/* ============ TRẠNG THÁI ============ */
const savedAdventure=window.GameStorage?.load?.().adventure||{};
let G={bossIndex:0,cleared:Number.isInteger(savedAdventure.cleared)?savedAdventure.cleared:-1};
let timerId=null,timeLeft=0,timeTotal=0;
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
  /* Vầng sáng sau lưng boss hé lộ tông màu đấu trường (đêm/dung nham/băng giá)
     TRƯỚC khi vào trận — trước đây màn giới thiệu luôn là panel kem trung tính,
     chỉ tới lúc bắt đầu đấu mới thấy nền đấu trường đổi màu. */
  ie.classList.remove('arena-night','arena-lava','arena-ice');
  if(b.arena)ie.classList.add('arena-'+b.arena);
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
  startAmbient(b.arena);setDioramaTheme(b.arena);
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
  if(typeof cleanupDuelGame==='function')cleanupDuelGame();
  if(typeof cleanupNimGame==='function')cleanupNimGame();
  if(typeof cleanupHanoiGame==='function')cleanupHanoiGame();
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
  const count=(typeof ART_SKIN_COUNT!=='undefined'?ART_SKIN_COUNT:10);
  paintBoss({spriteIndex:G.bossIndex%count,name:'Quái vật'});
  $('bossName').textContent=name;
  $('bossMech').textContent=G.mode==='blitz'?'⚡ 60 giây':'♾️ Sinh tồn';
  G.bossHp=100;G.bossMaxHp=100;
  startAmbient(theme);setDioramaTheme(theme);
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
  /* Phần tử trong adventure.html tên là #seTrophy — bản cũ ghi vào #seEmoji vốn
     không tồn tại, nên huy hiệu xếp hạng chưa bao giờ hiện ra. */
  if($('seTrophy'))$('seTrophy').textContent=r[1];
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
    const count=(typeof ART_SKIN_COUNT!=='undefined'?ART_SKIN_COUNT:10);
    applySkin(boss,{spriteIndex:ri(0,count-1)});
    boss.classList.remove('morphing');
  },400);
  G.tier=Math.min(5,G.tier+1);
  const themes=['','night','lava','ice'];
  const th=pick(themes);
  $('arena').className='arena '+th;startAmbient(th);setDioramaTheme(th);
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
/* Modal thông tin/ủng hộ: không đụng gì tới trạng thái ván đấu (khác hẳn
   restartModal), nên mở/đóng chỉ cần bật/tắt class .on — bootstrap.js lo phần
   focus trap + Escape dùng chung cho mọi .modal. */
function openInfoModal(){ $('infoModal').classList.add('on'); }
function closeInfoModal(){ SFX.click(); $('infoModal').classList.remove('on'); }
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
const BUSY_SCREENS=['battle','typingGame','sudokuGame','duelGame','nimGame','hanoiGame'];
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
/* Trước đây 12 vật phẩm nằm chung MỘT lưới, chỉ phân biệt bằng dòng chữ nhỏ
   "suốt hành trình"/"mang vào trận" trong từng thẻ — dữ liệu SHOP đã chia rõ
   qua `kind` nhưng bố cục không cho thấy điều đó. Nay tách thành hai nhóm có
   tiêu đề riêng (tái dùng style .maplbl của bản đồ chiến dịch). */
const SHOP_GROUPS=[
  {kind:'perk',label:'🗺️ NÂNG CẤP HÀNH TRÌNH — mua càng nhiều càng đắt, giữ suốt hành trình'},
  {kind:'inv', label:'🎒 VẬT PHẨM MANG VÀO TRẬN — bấm để dùng khi cần'},
];
function renderShop(){
  $('shopCoins').textContent=G.coins+' 💰';
  const wrap=$('shopGrid');wrap.innerHTML='';
  SHOP_GROUPS.forEach(group=>{
    const items=SHOP.filter(it=>it.kind===group.kind);
    if(!items.length)return;
    const h=document.createElement('h3');
    h.className='maplbl';h.textContent=group.label;
    wrap.appendChild(h);
    const grid=document.createElement('div');
    grid.className='shopgrid';
    items.forEach(it=>{
      const price=itemPrice(it),owned=itemOwned(it);
      const maxed=it.max&&owned>=it.max;
      const cant=G.coins<price||maxed;
      const d=document.createElement('button');
      d.className='shopitem'+(cant?' cant':'');
      d.innerHTML=`<span class="si">${it.icon}</span>
        <span style="flex:1"><span class="sn">${it.name}</span>${owned?` <span class="own">(có ${owned})</span>`:''}<br>
        <span class="sd">${it.desc}</span></span>
        <span class="sp">${maxed?'ĐỦ':price+' 💰'}</span>`;
      d.onclick=()=>buyItem(it);
      grid.appendChild(d);
    });
    wrap.appendChild(grid);
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

