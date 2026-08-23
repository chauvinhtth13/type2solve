let currentQ=null,isGolden=false;
let answerMode=window.GameStorage?.load?.().settings?.answerMode||'mixed';
let answerComposition=false;
const recentSig=[];let lastType='';

function normalizeAnswer(value){
  return String(value??'').normalize('NFKC').trim().toLocaleLowerCase('vi-VN')
    .replace(/[−–—]/g,'-').replace(/\s+/g,' ').replace(/\s*([/:])\s*/g,'$1');
}
function isCorrectAnswer(value,expected=currentQ?.ans){
  const actualText=normalizeAnswer(value).replace(/,/g,'.');
  const expectedText=normalizeAnswer(expected).replace(/,/g,'.');
  if(actualText!==''&&expectedText!==''&&!Number.isNaN(Number(actualText))&&!Number.isNaN(Number(expectedText))){
    return Math.abs(Number(actualText)-Number(expectedText))<1e-9;
  }
  const accepted=[expected,...(currentQ?.acceptedAnswers||[])].map(normalizeAnswer);
  return accepted.includes(normalizeAnswer(value));
}
function supportsTypedAnswer(question){
  const value=String(question?.ans??'');
  return value.length>0&&value.length<=38&&!/\p{Extended_Pictographic}/u.test(value);
}
function setAnswerMode(mode){
  answerMode=['mixed','choice','input'].includes(mode)?mode:'mixed';
  if($('answerModeSelect'))$('answerModeSelect').value=answerMode;
  window.GameStorage?.updateSettings?.({answerMode});
  const hint=$('answerModeHint');if(hint)hint.textContent='Áp dụng từ câu tiếp theo';
}
function shouldTypeAnswer(question){
  if(!supportsTypedAnswer(question))return false;
  if(answerMode==='input')return true;
  if(answerMode==='choice')return false;
  G.answerTurn=(G.answerTurn||0)+1;
  return G.answerTurn%2===0;
}
function unlockCurrentAnswers(){
  document.querySelectorAll('.ans').forEach(button=>{button.disabled=false;button.classList.remove('locked')});
  const input=$('answerInput'),submit=$('answerSubmit');
  if(G.typedAnswer&&input){input.disabled=false;submit.disabled=false;if($('battle').classList.contains('active'))input.focus();}
  $('thinkBar').classList.remove('on');
  G.thinkUntil=0;
}
function scheduleAnswerUnlock(delay){
  const wait=Math.max(0,delay||0),bar=$('thinkBar');
  clearTimeout(G.thinkT);
  G.thinkUntil=performance.now()+wait;
  bar.classList.add('on');bar.style.setProperty('--tt',wait+'ms');bar.innerHTML='<i></i>';
  G.thinkT=setTimeout(()=>{G.thinkT=null;unlockCurrentAnswers();SFX.unlock();},wait);
}
function submitTypedAnswer(event){
  event.preventDefault();
  if(event.isComposing||answerComposition||G.locked||!G.typedAnswer)return;
  const input=$('answerInput');
  if(input.disabled||!normalizeAnswer(input.value)){input.focus();return;}
  answer(input,input.value);
}
$('answerInput')?.addEventListener('compositionstart',()=>{answerComposition=true});
$('answerInput')?.addEventListener('compositionend',()=>{answerComposition=false});
if($('answerModeSelect'))$('answerModeSelect').value=answerMode;
function battleLater(callback,delay){
  const runId=battleRunId;
  return setTimeout(()=>{
    if(runId!==battleRunId||!$('battle').classList.contains('active'))return;
    callback();
  },delay);
}
/* chống lặp: thử sinh tối đa 12 lần để tránh trùng 40 câu gần nhất
   và tránh 2 câu cùng dạng liền nhau */
function makeFreshQuestion(tier){
  let cand=null;
  for(let i=0;i<12;i++){
    cand=genQuestion(tier);
    const sig=cand.q+'|'+cand.ans;
    const dupSig=recentSig.includes(sig);
    const dupType=cand.type===lastType&&i<8;
    if(!dupSig&&!dupType)break;
  }
  recentSig.push(cand.q+'|'+cand.ans);
  if(recentSig.length>40)recentSig.shift();
  lastType=cand.type;
  return cand;
}
function newQuestion(){
  G.locked=false;
  const b=BOSSES[G.bossIndex];
  const tier=G.mode==='blitz'?(G.correct<5?1:G.correct<11?2:G.correct<18?3:4)
            :G.mode==='surv'?G.tier:b.tier;
  currentQ=makeFreshQuestion(tier);
  isGolden=Math.random()<Math.min(.45,0.15*(1+(G.perks?.gold||0)));
  const tb=$('typeBadge');
  tb.textContent=TYPE_LABEL[currentQ.type]||'🧮';
  tb.style.animation='none';void tb.offsetWidth;tb.style.animation='';
  const qb=$('qbox');
  qb.classList.toggle('golden',isGolden);
  $('goldTag').style.display=isGolden?'block':'none';
  $('goldTag').textContent=(G.mode==='blitz'||G.mode==='surv')
    ?'💛 CÂU HỎI VÀNG — ĐIỂM ×3! 💛':'💛 CÂU HỎI VÀNG — SÁT THƯƠNG ×2! 💛';
  if(isGolden){SFX.gold();setTimeout(goldRain,120);}
  qb.style.animation='none';void qb.offsetWidth;qb.style.animation='';
  const qt=$('questionTxt');
  qt.textContent=currentQ.q;
  qt.className='qtext'+(currentQ.small?' small':'');
  $('questionSvg').innerHTML=currentQ.svg||'';
  $('feedback').textContent='';
  $('feedback').className='feedback';
  const eb=$('explainBox');eb.classList.remove('show');eb.innerHTML='';
  $('nextBtn').style.display='none';
  G.frozen=false;
  updateHUD();renderEnergy();
  const box=$('answers'),form=$('answerForm'),input=$('answerInput'),submit=$('answerSubmit');
  G.typedAnswer=shouldTypeAnswer(currentQ);
  box.innerHTML='';box.className='answers'+(currentQ.three?' three':'')+(currentQ.choices.length===5?' five':'');
  box.hidden=G.typedAnswer;form.hidden=!G.typedAnswer;
  input.value='';input.className='';input.placeholder='Nhập kết quả rồi nhấn Enter…';input.disabled=true;submit.disabled=true;
  if(!G.typedAnswer)currentQ.choices.forEach((v,i)=>{
    const btn=document.createElement('button');
    btn.className='ans locked';btn.textContent=v;btn.disabled=true;
    btn.setAttribute('aria-keyshortcuts',String(i+1));   // khớp với phím 1–5 ở bootstrap.js
    btn.onclick=e=>{ripple(btn,e);answer(btn,v)};
    box.appendChild(btn);
  });
  // Khoá đáp án trong ~1,6 giây đầu để bé buộc phải ĐỌC đề, không bấm bừa
  const think=G.mode==='blitz'?(currentQ.small?1100:750):(currentQ.small?2000:1400);
  scheduleAnswerUnlock(think);
  updateStreakTxt();
  const extra=(['word','logic','back','count','combi','magic','olymp','sasmo','amc','world','chance','brain','singapore'].includes(currentQ.type))?9
             :(['geo','eq','calen','cycle','eng','imas','visual','numsense','geo5','speed','pct'].includes(currentQ.type))?6
             :(['frac','dec'].includes(currentQ.type))?4:0;
  if(G.mode==='blitz'){ renderModeBar(); }                       // đồng hồ chung 60s
  else if(G.mode==='surv'){ startTimer(16+Math.round(extra*0.7)); renderModeBar(); }
  else startTimer(b.time+extra+(G.perks?.time||0)*3+(isGolden?4:0));
}
function startTimer(sec,total=sec){
  stopTimer();timeTotal=total;timeLeft=sec;renderTimer();
  const deadline=performance.now()+sec*1000;
  let lastTick=Math.ceil(sec);
  timerId=setInterval(()=>{
    timeLeft=Math.max(0,(deadline-performance.now())/1000);
    if(timeLeft<=0){timeLeft=0;renderTimer();stopTimer();onTimeout();return;}
    const c=Math.ceil(timeLeft);
    if(c<=5&&c<lastTick){lastTick=c;SFX.tick();}
    renderTimer();
  },100);
}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}$('battleCard').classList.remove('danger');}
function renderTimer(){
  const f=$('timerFill'),n=$('timerNum');
  const pct=timeLeft/timeTotal*100;
  f.style.width=pct+'%';n.textContent=Math.ceil(timeLeft)+'s';
  const warn=pct<30;
  f.classList.toggle('warn',warn);n.classList.toggle('warn',warn);
  $('battleCard').classList.toggle('danger',warn);
}

/* ============ TRẢ LỜI / HẾT GIỜ ============ */
function lockAnswers(){
  document.querySelectorAll('.ans').forEach(b=>b.disabled=true);
  if($('answerInput'))$('answerInput').disabled=true;
  if($('answerSubmit'))$('answerSubmit').disabled=true;
}
function revealCorrect(){
  document.querySelectorAll('.ans').forEach(b=>{
    if(isCorrectAnswer(b.textContent))b.classList.add('right');
  });
  if(G.typedAnswer)$('answerInput').placeholder='Đáp án đúng: '+currentQ.ans;
}
function answer(btn,val){
  if(G.locked)return;
  G.locked=true;
  if(G.mode!=='blitz')stopTimer();
  lockAnswers();
  const fb=$('feedback');
  const b=BOSSES[G.bossIndex];
  if(G.mode==='blitz'||G.mode==='surv'){modeAnswer(btn,val,fb);return;}
  if(isCorrectAnswer(val)){
    btn.classList.add('right');SFX.right();
    G.correct++;G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);
    if(isGolden)G.goldHit++;
    const combo=Math.min(G.streak-1,3)*3;
    const fast=timeLeft/timeTotal>0.6?3:0;
    let dmg=heroAtk()+combo+fast+ri(0,4);
    let critNow=false;
    if(G.crit){dmg*=2;G.crit=false;critNow=true;}
    if(isGolden)dmg*=2;
    if(b.mech==='armor')dmg=Math.max(4,dmg-(G.bossIndex===6?5:4));
    const cap=dmgCap();
    const capped=dmg>cap;
    if(capped)dmg=cap; // chặn sát thương quá lớn → luôn cần nhiều câu đúng
    if(G.streak>0&&G.streak%3===0)G.crit=true;
    let coin=7+(fast?4:0)+(isGolden?12:0)+Math.min(G.streak-1,3)*2;
    G.coins+=coin;
    let msg=isGolden?`💛 CÂU VÀNG! Sát thương nhân đôi: ${dmg}!`
           :critNow?`💥 ĐÒN CHÍ MẠNG! Gây ${dmg} sát thương!`
           :`🎯 Chính xác! Tung chưởng gây ${dmg} sát thương!`;
    msg+=` +${coin}💰`;
    if(fast)msg+=' ⚡nhanh!';
    if(capped)msg+=' (đòn tối đa!)';
    if(critNow||isGolden)screenFlash();
    addEnergy(isGolden?ENERGY_GOLD:ENERGY_GAIN);
    fb.textContent=msg;fb.classList.add('good');
    showExplain();
    if(G.streak>=2)comboPopup('🔥 COMBO x'+G.streak+'!');
    if(critNow)comboPopup('💥 CHÍ MẠNG!');
    const luckChance=Math.min(.65,0.2*(1+(G.perks?.luck||0)));
    if(Math.random()<luckChance&&G.heroHp<heroMaxHp()){
      G.heroHp=Math.min(heroMaxHp(),G.heroHp+10);
      healEffect();SFX.heal();
    }
    heroAttack(dmg,critNow||isGolden);
  }else{
    btn.classList.add('wrong');revealCorrect();SFX.wrong();
    G.wrong++;G.streak=0;G.crit=false;
    const lose=Math.min(G.coins,5);G.coins-=lose; // bấm bừa là mất xu!
    let dmg=bossDamage(b);
    let msg=dmg===0?`💥 Sai rồi! Đáp án đúng là ${currentQ.ans}. 🛡️ Khiên đã CHẶN TRỌN đòn của boss!`
                   :`💥 Sai rồi! Đáp án đúng là ${currentQ.ans}. Boss phản chưởng −${dmg}!`;
    if(b.mech==='heal'){const hl=b.tier>=5?10:8;G.bossHp=Math.min(G.bossMaxHp,G.bossHp+hl);msg+=` 💚Boss hồi ${hl} máu!`;}
    if(lose>0)msg+=` −${lose}💰`;
    fb.textContent=msg;fb.classList.add('bad');
    showExplain();updateHUD();
    bossAttack(dmg,b.mech==='drain');
  }
  updateStreakTxt();updateAura();
}
function modeAnswer(btn,val,fb){
  const right=isCorrectAnswer(val);
  const hero=$('heroSprite'),boss=$('bossSprite');
  if(right){
    btn.classList.add('right');SFX.right();
    G.correct++;G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);
    const pts=1+(isGolden?2:0)+(G.streak>=5?2:G.streak>=3?1:0);
    G.score+=pts;
    addEnergy(isGolden?ENERGY_GOLD:ENERGY_GAIN);
    let msg=`🎯 Chính xác! +${pts} điểm`;
    if(isGolden)msg='💛 CÂU VÀNG! +'+pts+' điểm';
    if(G.streak>=3)msg+=` 🔥combo x${G.streak}`;
    if(G.mode==='blitz'){
      const gained=Math.min(1.5,60-G.timeLeftTotal);
      G.timeLeftTotal+=gained;G.blitzEndsAt=(G.blitzEndsAt||performance.now())+gained*1000;
      msg+=' ⏱️+'+gained.toFixed(1).replace('.',',')+'s';
    }
    fb.textContent=msg;fb.className='feedback good';
    if(G.streak>=2)comboPopup('🔥 COMBO x'+G.streak+'!');
    // hoạt ảnh đánh trúng
    hero.classList.add('cast-hero');setTimeout(()=>hero.classList.remove('cast-hero'),400);
    battleLater(()=>shootProjectile('heroSprite','bossSprite',pick(HERO_PROJ),false,to=>{
      boss.classList.add('hurt');boss.classList.add('flashWhite');SFX.hit();
      sparkBurst(to.x,to.y,['✦','✨','⭐'],9);
      showDmg('+'+pts+' 🏆','#1c9c5b','right',isGolden);
      setTimeout(()=>{boss.classList.remove('hurt');boss.classList.remove('flashWhite')},450);
    }),160);
    // sinh tồn: cứ 6 câu đúng lại đổi quái và tăng độ khó
    if(G.mode==='surv'&&G.correct%6===0)battleLater(survAdvance,700);
  }else{
    btn.classList.add('wrong');revealCorrect();SFX.wrong();
    G.wrong++;G.streak=0;
    let msg=`💥 Sai rồi! Đáp án đúng là ${currentQ.ans}.`;
    if(G.mode==='blitz'){
      const lost=Math.min(5,G.timeLeftTotal);
      G.timeLeftTotal-=lost;G.blitzEndsAt=(G.blitzEndsAt||performance.now())-lost*1000;
      msg+=' ⏱️ Bị trừ '+Math.round(lost)+' giây!';
    }
    else{G.lives--;msg+=` 💔 Mất 1 mạng — còn ${Math.max(0,G.lives)} mạng!`;}
    fb.textContent=msg;fb.className='feedback bad';
    shake(false);
    hero.classList.add('hurt-hero');setTimeout(()=>hero.classList.remove('hurt-hero'),450);
    showDmg(G.mode==='blitz'?'−5s':'−1 ❤️','#e0364f','left');
  }
  showExplain();renderModeBar();updateHUD();
  if(G.mode==='surv'&&G.lives<=0){battleLater(endRun,1200);return;}
  if(G.mode==='blitz'&&G.timeLeftTotal<=0){battleLater(endRun,900);return;}
  showNextBtn();
}

function onTimeout(){
  if(G.locked)return;
  G.locked=true;lockAnswers();revealCorrect();SFX.wrong();
  if(G.mode==='surv'){
    G.timeout++;G.wrong++;G.streak=0;G.lives--;
    const fb=$('feedback');
    fb.textContent=`⏰ Hết giờ! Đáp án đúng là ${currentQ.ans}. 💔 Mất 1 mạng — còn ${Math.max(0,G.lives)} mạng!`;
    fb.className='feedback bad';
    shake(false);showDmg('−1 ❤️','#e0364f','left');
    showExplain();renderModeBar();
    if(G.lives<=0){battleLater(endRun,1200);return;}
    showNextBtn();return;
  }
  G.timeout++;G.wrong++;G.streak=0;G.crit=false;
  const lose=Math.min(G.coins,5);G.coins-=lose;
  const b=BOSSES[G.bossIndex];
  const dmg=bossDamage(b);
  const fb=$('feedback');
  let msg=dmg===0?`⏰ Hết giờ! Đáp án đúng là ${currentQ.ans}. 🛡️ Khiên đã CHẶN TRỌN đòn của boss!`
                 :`⏰ Hết giờ! Đáp án đúng là ${currentQ.ans}. Boss phản chưởng −${dmg}!`;
  if(b.mech==='heal'){G.bossHp=Math.min(G.bossMaxHp,G.bossHp+(b.tier>=5?10:8));msg+=' 💚Boss hồi máu!';}
  if(lose>0)msg+=` −${lose}💰`;
  fb.textContent=msg;fb.classList.add('bad');
  showExplain();updateHUD();
  updateStreakTxt();updateAura();
  bossAttack(dmg,b.mech==='drain');
}
function bossDamage(b){
  if(G.stunned){G.stunned=false;return 0;}    // boss còn choáng vì siêu chưởng
  if(G.shieldOn){G.shieldOn=false;return 0;}  // 🛡️ khiên chặn trọn đòn
  let dmg=b.atk+ri(0,5);
  if(G.phase2)dmg=Math.round(dmg*1.25);       // giai đoạn 2 boss mạnh hơn
  if(b.mech==='rage'&&G.bossHp/G.bossMaxHp<0.35)dmg=Math.round(dmg*1.5);
  dmg=Math.max(4,dmg-(G.perks?.def||0)*4);
  return dmg;
}
function updateStreakTxt(){
  const s=$('streakTxt');
  s.textContent=G.streak>=2?'🔥x'+G.streak:'';
  s.classList.toggle('hot',G.streak>=3);
  $('critTxt').textContent=G.crit?'💥 Chí mạng!':'';
}
function updateAura(){$('heroAura').classList.toggle('on',G.crit);}

function ripple(btn,e){
  const r=document.createElement('span');r.className='ripple';
  const rect=btn.getBoundingClientRect();
  const size=Math.max(rect.width,rect.height);
  r.style.width=r.style.height=size+'px';
  r.style.left=((e&&e.clientX?e.clientX-rect.left:rect.width/2)-size/2)+'px';
  r.style.top=((e&&e.clientY?e.clientY-rect.top:rect.height/2)-size/2)+'px';
  btn.appendChild(r);setTimeout(()=>r.remove(),600);
}
function screenFlash(){
  const d=document.createElement('div');d.className='flashOverlay';
  document.body.appendChild(d);setTimeout(()=>d.remove(),400);
}
function goldRain(){
  const qb=$('qbox');
  for(let i=0;i<12;i++){
    const s=document.createElement('div');s.className='goldrain';
    s.textContent=pick(['⭐','✨','💛','🌟']);
    s.style.left=ri(2,95)+'%';s.style.top='0';
    s.style.animationDelay=(i*0.08)+'s';
    qb.appendChild(s);setTimeout(()=>s.remove(),1600);
  }
}
function itemFly(icon){
  const d=document.createElement('div');d.className='itemFly';d.textContent=icon;
  d.style.left='calc(50% - 17px)';d.style.top='45%';
  document.body.appendChild(d);setTimeout(()=>d.remove(),950);
}
function showNextBtn(){$('nextBtn').style.display='block';}
function proceedNext(){SFX.click();$('nextBtn').style.display='none';newQuestion();}
const ENERGY_MAX=100, ENERGY_GAIN=18, ENERGY_GOLD=30;
function addEnergy(v){
  G.energy=Math.min(ENERGY_MAX,(G.energy||0)+v);
  renderEnergy();
  if(G.energy>=ENERGY_MAX&&!G.ultReady){G.ultReady=true;SFX.levelup();comboPopup('⚡ SIÊU CHƯỞNG SẴN SÀNG!');}
}
function renderEnergy(){
  const f=$('energyFill');if(!f)return;
  const pct=(G.energy||0)/ENERGY_MAX*100;
  f.style.width=pct+'%';
  // Rỗng thì không có gì để nhìn: gắn cờ cho CSS dừng hẳn animation nền,
  // thay vì chạy vô hạn suốt trận trên một phần tử bề rộng 0.
  f.classList.toggle('charging',pct>0);
  f.classList.toggle('full',pct>=100);
  $('ultBtn').classList.toggle('on',pct>=100&&!G.locked);
}
function useUltimate(){
  if(G.energy<ENERGY_MAX||G.locked)return;
  if(G.mode==='blitz'||G.mode==='surv'){modeUltimate();return;}
  G.energy=0;G.ultReady=false;G.locked=true;
  renderEnergy();$('ultBtn').classList.remove('on');
  const arena=$('arena'),hero=$('heroSprite'),boss=$('bossSprite');
  const cap=dmgCap();
  const dmg=Math.round(cap*1.5);
  // --- màn trình diễn ---
  SFX.crit();screenFlash();
  hero.classList.add('cast-hero');
  const txt=document.createElement('div');txt.className='ultText';txt.textContent='⚡ SIÊU CHƯỞNG! ⚡';
  arena.appendChild(txt);setTimeout(()=>txt.remove(),1250);
  const sw=document.createElement('div');sw.className='shock';
  arena.appendChild(sw);setTimeout(()=>sw.remove(),950);
  [0,1,2].forEach(i=>setTimeout(()=>{
    const r=document.createElement('div');r.className='ray';
    r.style.top=(38+i*11)+'%';
    arena.appendChild(r);setTimeout(()=>r.remove(),850);
    SFX.shoot();
  },i*130));
  battleLater(()=>{
    const to=spriteCenter('bossSprite');
    boss.classList.add('hurt');boss.classList.add('flashWhite');
    boomAt(to.x,to.y);sparkBurst(to.x,to.y,['💥','⭐','✨','⚡','🌟'],22);
    shake(true);SFX.hit();screenFlash();
    showDmg('−'+dmg,'#8d6bff','right',true);
    G.bossHp=Math.max(0,G.bossHp-dmg);
    G.stunned=true;   // boss choáng, bỏ lượt phản đòn kế tiếp
    G.coins+=15;
    updateBars();hpHitFx('bossHp');updateHUD();
    checkPhase2();
    battleLater(()=>{
      hero.classList.remove('cast-hero');
      boss.classList.remove('hurt');boss.classList.remove('flashWhite');
      if(G.bossHp<=0){bossDefeated();}
      else{
        const fb=$('feedback');
        fb.textContent=`⚡ Siêu chưởng gây ${dmg} sát thương! Boss CHOÁNG, bỏ lượt phản đòn! +15💰`;
        fb.className='feedback good';
        G.locked=false;renderEnergy();
      }
    },600);
  },520);
}

/* Siêu chưởng ở chế độ Đấu nhanh / Sinh tồn: đổi thành phần thưởng riêng */
function modeUltimate(){
  G.energy=0;G.ultReady=false;renderEnergy();
  const arena=$('arena');
  SFX.crit();screenFlash();shake(true);
  const txt=document.createElement('div');txt.className='ultText';
  arena.appendChild(txt);setTimeout(()=>txt.remove(),1250);
  const sw=document.createElement('div');sw.className='shock';
  arena.appendChild(sw);setTimeout(()=>sw.remove(),950);
  const to=spriteCenter('bossSprite');
  sparkBurst(to.x,to.y,['💥','⭐','✨','⚡','🌟'],20);
  if(G.mode==='blitz'){
    const gained=Math.min(10,60-G.timeLeftTotal);
    G.timeLeftTotal+=gained;G.blitzEndsAt=(G.blitzEndsAt||performance.now())+gained*1000;
    txt.textContent=`⚡ +${Math.round(gained)} GIÂY! ⚡`;
    flashMsg(`⚡ Siêu chưởng! Được cộng thêm ${Math.round(gained)} giây!`);
    renderModeBar();
  }else{
    G.lives=Math.min(3,G.lives+1);
    txt.textContent='⚡ +1 MẠNG! ⚡';
    flashMsg('⚡ Siêu chưởng! Hồi lại 1 mạng ❤️');
    renderModeBar();
  }
}

/* ===== BOSS BIẾN HÌNH GIAI ĐOẠN 2 (dưới 50% máu) ===== */
function checkPhase2(){
  if(G.phase2||G.bossHp<=0)return;
  if(G.bossHp/G.bossMaxHp>=0.5)return;
  G.phase2=true;
  const b=BOSSES[G.bossIndex];
  const arena=$('arena'),boss=$('bossSprite');
  SFX.bossRoar();shake(true);screenFlash();
  const fx=document.createElement('div');fx.className='phase2fx';
  arena.appendChild(fx);setTimeout(()=>fx.remove(),1150);
  boss.classList.add('morphing');
  battleLater(()=>{
    /* KHÔNG ghi textContent vào đây: #bossSprite là <svg>, textContent xoá sạch mọi
       nút con nên con quái BIẾN MẤT hẳn phần còn lại của phiên (paintBoss chỉ đặt
       biến CSS, không dựng lại hình). Hoá dạng = tô lại bảng màu nổi giận. */
    applySkin(boss,rageArt(bossArt(b)));
    boss.classList.add('phase2');
    boss.classList.remove('morphing');
    $('bossMech').textContent='🔥 GIAI ĐOẠN 2';
    comboPopup('🔥 BOSS BIẾN HÌNH!');
  },520);
}

function updateHUD(){
  const ct=$('coinTxt');
  const modeRun=(G.mode==='blitz'||G.mode==='surv');
  if(ct){
    ct.style.display=modeRun?'none':'';
    ct.textContent='💰 '+G.coins;ct.classList.remove('pop');void ct.offsetWidth;ct.classList.add('pop');
  }
  const bar=$('itemBar');
  if(bar&&modeRun){bar.innerHTML='';bar.style.display='none';return;}
  if(bar)bar.style.display='';
  renderItemBar();
}
const ITEM_LABEL={potion:'🧪 Hồi máu',hint:'💡 50/50',freeze:'⏱️ Dừng giờ',shield:'🛡️ Khiên',bomb:'💣 Bom'};
function renderItemBar(){
  const bar=$('itemBar');if(!bar)return;
  bar.innerHTML='';
  let any=false;
  ['potion','hint','freeze','shield','bomb'].forEach(id=>{
    const n=G.inv?.[id]||0;
    if(n<=0)return;
    any=true;
    const b=document.createElement('button');
    const armed=(id==='shield'&&G.shieldOn)||(id==='freeze'&&G.frozen);
    b.className='itembtn'+(armed?' armed':'');
    b.textContent=ITEM_LABEL[id]+' ×'+n;
    b.onclick=()=>useItem(id);
    bar.appendChild(b);
  });
  if(G.inv?.revive>0){
    const r=document.createElement('span');
    r.className='itembtn off';r.style.cursor='default';
    r.textContent='🔮 Hồi sinh ×'+G.inv.revive;
    bar.appendChild(r);any=true;
  }
  if(!any){
    const s=document.createElement('span');s.className='none';
    s.textContent='🎒 Chưa có vật phẩm — ghé cửa hàng nhé!';
    bar.appendChild(s);
  }
}
function useItem(id){
  if(!G.inv[id])return;
  if(id==='potion'){
    if(G.heroHp>=heroMaxHp()){flashMsg('❤️ Máu đang đầy rồi!');return;}
    G.inv.potion--;
    G.heroHp=Math.min(heroMaxHp(),G.heroHp+50);
    healEffect();SFX.heal();updateBars();itemFly('🧪');
    flashMsg('🧪 Uống bình máu, hồi 50 máu!');
  }
  else if(id==='hint'){
    if(G.locked){flashMsg('💡 Câu này đã trả lời rồi!');return;}
    const btns=[...document.querySelectorAll('.ans')].filter(b=>!b.disabled);
    const wrongs=btns.filter(b=>String(b.textContent)!==String(currentQ.ans));
    if(wrongs.length<2){flashMsg('💡 Không còn đáp án để xoá!');return;}
    G.inv.hint--;SFX.item();itemFly('💡');
    shuffle(wrongs).slice(0,2).forEach(b=>{b.disabled=true;b.classList.add('dimmed');});
    flashMsg('💡 Đã xoá 2 đáp án sai!');
  }
  else if(id==='freeze'){
    if(G.locked||G.frozen){flashMsg('⏱️ Đồng hồ đã dừng!');return;}
    G.inv.freeze--;G.frozen=true;stopTimer();SFX.item();itemFly('⏱️');
    $('timerNum').textContent='⏱️∞';
    $('timerFill').classList.remove('warn');
    flashMsg('⏱️ Đồng hồ đã dừng — cứ suy nghĩ thoải mái!');
  }
  else if(id==='shield'){
    if(G.shieldOn){flashMsg('🛡️ Khiên đang bật rồi!');return;}
    G.inv.shield--;G.shieldOn=true;SFX.shield();itemFly('🛡️');
    flashMsg('🛡️ Khiên đã bật — chặn đòn tới của boss!');
  }
  else if(id==='bomb'){
    if(G.bombUsed){flashMsg('💣 Mỗi trận chỉ dùng được 1 quả bom!');return;}
    if(G.locked)return;
    G.inv.bomb--;G.bombUsed=true;
    const dmg=Math.ceil(G.bossMaxHp*0.18);
    const to=spriteCenter('bossSprite');
    boomAt(to.x,to.y);sparkBurst(to.x,to.y,['💥','🔥','✨'],14);
    shake(true);SFX.crit();screenFlash();itemFly('💣');
    showDmg('−'+dmg+' 💣','#e0364f','right',true);
    G.bossHp=Math.max(1,G.bossHp-dmg);
    updateBars();
    flashMsg('💣 BOM NỔ! Boss mất '+dmg+' máu!');
  }
  updateHUD();
}
function flashMsg(txt){
  const fb=$('feedback');
  if(G.locked&&fb.textContent)return; // không ghi đè kết quả câu trả lời
  fb.textContent=txt;fb.className='feedback good';
}
function showExplain(){
  if(!currentQ||!currentQ.exp)return;
  const eb=$('explainBox');
  eb.innerHTML='💡 <b>Giải thích:</b> '+currentQ.exp;
  eb.classList.add('show');
}
function comboPopup(txt){
  const arena=$('arena');
  const d=document.createElement('div');d.className='comboPop';d.textContent=txt;
  arena.appendChild(d);setTimeout(()=>d.remove(),1000);
}

/* ============ HIỆU ỨNG CHIẾN ĐẤU ============ */
function arenaRect(){return $('arena').getBoundingClientRect();}
function spriteCenter(id){
  const r=$(id).getBoundingClientRect(),a=arenaRect();
  return {x:r.left-a.left+r.width/2, y:r.top-a.top+r.height/2};
}
function shake(big){
  const c=$('battleCard');
  c.classList.remove('shake','shakeBig');void c.offsetWidth;
  c.classList.add(big?'shakeBig':'shake');
}
function sparkBurst(x,y,emojis,count){
  const arena=$('arena');
  for(let i=0;i<count;i++){
    const s=document.createElement('div');s.className='spark';
    s.textContent=pick(emojis);
    s.style.left=x+'px';s.style.top=y+'px';
    const ang=Math.random()*Math.PI*2,dist=ri(30,80);
    s.style.setProperty('--dx',Math.cos(ang)*dist+'px');
    s.style.setProperty('--dy',Math.sin(ang)*dist+'px');
    arena.appendChild(s);setTimeout(()=>s.remove(),750);
  }
}
function boomAt(x,y){
  const arena=$('arena');
  const bm=document.createElement('div');bm.className='boom';bm.textContent='💥';
  bm.style.left=(x-23)+'px';bm.style.top=(y-23)+'px';
  arena.appendChild(bm);setTimeout(()=>bm.remove(),550);
}
/* Đường cong cubic-bezier(.3,0,.7,1) — chính là easing khai báo cho .proj trong CSS.
   Tính lại bằng công thức để vệt khói bám sát chưởng khí mà KHÔNG phải đo DOM
   giữa lúc chưởng đang bay (đo rồi ghi xen kẽ là đúng kiểu gây layout thrashing). */
function projEase(t){
  const cx=.9,bx=.3,ax=-.2,cy=0,by=3,ay=-2;   // hệ số suy ra từ (x1,y1,x2,y2)=(.3,0,.7,1)
  let u=t;
  for(let i=0;i<4;i++){                        // Newton 4 vòng đủ khít cho 450ms
    const dx=((ax*u+bx)*u+cx)*u-t, d=(3*ax*u+2*bx)*u+cx;
    if(Math.abs(d)<1e-6)break;
    u-=dx/d;
  }
  return ((ay*u+by)*u+cy)*u;
}
function shootProjectile(fromId,toId,emoji,dark,onHit){
  const arena=$('arena');
  const from=spriteCenter(fromId),to=spriteCenter(toId);   // đo đúng một lần, trước khi bay
  const dx=to.x-from.x;
  const p=document.createElement('div');
  p.className='proj'+(dark?' dark':'');
  p.innerHTML=`<span class="core">${emoji}</span>`;
  p.style.left=(from.x-17)+'px';p.style.top=(from.y-17)+'px';
  arena.appendChild(p);SFX.shoot();
  const trailBg=dark?'radial-gradient(circle,rgba(160,80,220,.7),transparent)'
                    :'radial-gradient(circle,rgba(255,220,80,.8),transparent)';
  const t0=performance.now();
  let trailN=0;
  // Giảm chuyển động: CSS ép transition còn .001ms nên chưởng tới đích ngay lập tức;
  // rải vệt khói theo đường cong 450ms nữa thì khói treo lại giữa sân. Bỏ hẳn.
  const trailId=REDUCED_MOTION()?null:setInterval(()=>{
    const t=document.createElement('div');t.className='trail';
    t.style.left=(from.x-9+dx*projEase(Math.min(1,(performance.now()-t0)/450)))+'px';
    t.style.top=(from.y-9)+'px';
    t.style.width='18px';t.style.height='18px';
    t.style.background=trailBg;
    arena.appendChild(t);setTimeout(()=>t.remove(),500);
    if(++trailN>8)clearInterval(trailId);
  },50);
  // transform thay cho left: chỉ chạm bước composite, không đụng layout.
  requestAnimationFrame(()=>{p.style.transform=`translateX(${dx}px) scale(1.3)`;});
  setTimeout(()=>{if(trailId)clearInterval(trailId);p.remove();boomAt(to.x,to.y);onHit(to);},460);
}
function shootBeam(onHit){
  const arena=$('arena');
  const from=spriteCenter('heroSprite'),to=spriteCenter('bossSprite');
  const beam=document.createElement('div');beam.className='beam';
  beam.style.left=from.x+'px';beam.style.top=(from.y-17)+'px';
  beam.style.width=(to.x-from.x)+'px';
  arena.appendChild(beam);SFX.crit();
  setTimeout(()=>{
    boomAt(to.x,to.y);
    sparkBurst(to.x,to.y,['⭐','✨','💫','⚡'],14);
    onHit(to);
    setTimeout(()=>beam.remove(),200);
  },350);
}
function healEffect(){
  const c=spriteCenter('heroSprite'),arena=$('arena');
  showDmg('+10 ❤️','#1c9c5b','left');
  for(let i=0;i<4;i++){
    const h=document.createElement('div');h.className='healfx';h.textContent=pick(['❤️','💚','✨']);
    h.style.left=(c.x-20+ri(0,40))+'px';h.style.top=c.y+'px';
    h.style.animationDelay=(i*0.12)+'s';
    arena.appendChild(h);setTimeout(()=>h.remove(),1300);
  }
}
function showDmg(text,color,side,crit){
  const arena=$('arena');
  const d=document.createElement('div');
  d.className='dmg'+(crit?' crit':'');d.textContent=text;d.style.color=color;
  d.style[side]=(18+Math.random()*10)+'%';d.style.top='40%';
  arena.appendChild(d);setTimeout(()=>d.remove(),1000);
}
function heroAttack(dmg,crit){
  const hero=$('heroSprite'),boss=$('bossSprite');
  const runId=battleRunId;
  hero.classList.add('cast-hero');
  setTimeout(()=>hero.classList.remove('cast-hero'),400);
  if(crit){hero.classList.add('dash-hero');setTimeout(()=>hero.classList.remove('dash-hero'),520);}
  const onHit=(to)=>{
    if(runId!==battleRunId||!$('battle').classList.contains('active'))return;
    boss.classList.add('hurt');boss.classList.add('flashWhite');
    shake(crit);SFX.hit();
    sparkBurst(to.x,to.y,crit?['⭐','💥','✨','⚡']:['✦','✨','•'],crit?16:8);
    showDmg('−'+dmg,'#e0364f','right',crit);
    G.bossHp=Math.max(0,G.bossHp-dmg);updateBars();hpHitFx('bossHp');checkPhase2();
    setTimeout(()=>{
      boss.classList.remove('hurt');boss.classList.remove('flashWhite');
      if(G.bossHp<=0)bossDefeated();else showNextBtn();
    },500);
  };
  setTimeout(()=>{
    if(runId!==battleRunId||!$('battle').classList.contains('active'))return;
    if(crit)shootBeam(onHit);
    else shootProjectile('heroSprite','bossSprite',pick(HERO_PROJ),false,onHit);
  },200);
}
function bossAttack(dmg,drain){
  const hero=$('heroSprite'),boss=$('bossSprite');
  const b=BOSSES[G.bossIndex];
  const runId=battleRunId;
  boss.classList.add('cast-boss');
  setTimeout(()=>boss.classList.remove('cast-boss'),400);
  setTimeout(()=>{
    if(runId!==battleRunId||!$('battle').classList.contains('active'))return;
    shootProjectile('bossSprite','heroSprite',b.proj,true,(to)=>{
      if(runId!==battleRunId||!$('battle').classList.contains('active'))return;
      if(dmg===0){
        sparkBurst(to.x,to.y,['🛡️','✨','✦'],10);SFX.perk();
        showDmg('🛡️ CHẶN!','#1c9c5b','left',true);
      }else{
        hero.classList.add('hurt-hero');hero.classList.add('flashWhite');
        shake(false);SFX.hit();
        sparkBurst(to.x,to.y,['💢','✦','•'],8);
        showDmg('−'+dmg,'#e0364f','left');
      }
      G.heroHp=Math.max(0,G.heroHp-dmg);
      if(dmg>0)hpHitFx('heroHp');
      if(drain){
        G.bossHp=Math.min(G.bossMaxHp,G.bossHp+Math.round(dmg/2));
        showDmg('+'+Math.round(dmg/2)+' 🩸','#8d2f4f','right');
      }
      updateBars();
      setTimeout(()=>{
        hero.classList.remove('hurt-hero');hero.classList.remove('flashWhite');
        if(G.heroHp<=0){
          if(G.inv.revive>0){ // 🔮 bùa hồi sinh
            G.inv.revive--;G.heroHp=50;updateBars();updateHUD();
            healEffect();SFX.heal();
            showDmg('🔮 HỒI SINH!','#8d6bff','left',true);
            showNextBtn();
          }else heroDefeated();
        }else showNextBtn();
      },500);
    });
  },200);
}
function hpHitFx(which){
  const bar=$(which).parentElement;
  bar.classList.remove('hit');void bar.offsetWidth;bar.classList.add('hit');
}
function updateBars(){
  // boss nổi giận khi máu thấp
  const b=BOSSES[G.bossIndex];
  const low=G.bossHp>0&&G.bossHp/G.bossMaxHp<0.35;
  const raging=low&&b.mech==='rage';
  $('arena').classList.toggle('rageOn',raging);
  $('bossSprite').classList.toggle('raging',raging);
  $('heroHp').style.width=(G.heroHp/heroMaxHp()*100)+'%';
  $('heroHpTxt').textContent=G.heroHp+'/'+heroMaxHp();
  $('bossHp').style.width=(G.bossHp/G.bossMaxHp*100)+'%';
  $('bossHpTxt').textContent=G.bossHp+'/'+G.bossMaxHp;
}
function confetti(n){
  const emojis=['🎉','⭐','✨','🎊','💛','💙','💜'];
  for(let i=0;i<n;i++){
    const c=document.createElement('div');c.className='confetti';
    c.textContent=pick(emojis);
    c.style.left=Math.random()*100+'vw';
    c.style.animationDuration=(2+Math.random()*2)+'s';
    c.style.animationDelay=(Math.random()*0.8)+'s';
    c.style.fontSize=ri(14,28)+'px';
    document.body.appendChild(c);
    setTimeout(()=>c.remove(),5000);
  }
}
function bossDefeated(){
  stopTimer();stopAmbient();SFX.win();confetti(40);
  const runId=battleRunId;
  $('bossSprite').classList.add('defeated');
  $('heroSprite').classList.add('winHop');
  setTimeout(()=>{
    if(runId!==battleRunId||!$('battle').classList.contains('active'))return;
    $('bossSprite').classList.remove('defeated');
    $('heroSprite').classList.remove('winHop');
    const newlyCleared=G.bossIndex>G.cleared;
    G.cleared=Math.max(G.cleared,G.bossIndex);
    if(newlyCleared)window.GameStorage?.addStars?.(G.bossIndex===BOSSES.length-1?10:2+BOSSES[G.bossIndex].tier);
    if(G.bossIndex===BOSSES.length-1){
      saveAdventureProgress();
      $('stCorrect').textContent=G.correct;
      $('stWrong').textContent=G.wrong;
      $('stGold').textContent=G.goldHit;
      $('stStreak').textContent=G.bestStreak;
      $('stCoins').textContent=G.coins;
      confetti(60);showScreen('victory');
    }else{
      const reward=50+BOSSES[G.bossIndex].tier*20;
      G.coins+=reward;
      saveAdventureProgress();
      $('bossWinStars').textContent=newlyCleared?2+BOSSES[G.bossIndex].tier:0;
      $('bossWinTitle').textContent='HẠ GỤC '+BOSSES[G.bossIndex].name.toUpperCase()+'!';
      $('bossWinSub').innerHTML='🎉 Nhận thưởng <b>+'+reward+' 💰</b> (em đang có <b>'+G.coins+' 💰</b>)<br>Boss tiếp theo: <b>'+BOSSES[G.bossIndex+1].name+'</b> ('+RANKS[BOSSES[G.bossIndex+1].tier]+')';
      showScreen('bossWin');
    }
  },1300);
}
function heroDefeated(){
  stopTimer();stopAmbient();SFX.defeat();
  const runId=battleRunId;
  setTimeout(()=>{
    if(runId!==battleRunId||!$('battle').classList.contains('active'))return;
    $('stCorrect2').textContent=G.correct;
    $('stWrong2').textContent=G.wrong;
    $('stTimeout2').textContent=G.timeout;
    $('defeatCoins').textContent=G.coins;
    showScreen('defeat');
  },700);
}
