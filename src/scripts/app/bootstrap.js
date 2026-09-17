(function bootstrapLearningArena(){
  'use strict';

  const storage=window.GameStorage;
  let lastModalFocus=null;

  /* Bơm hình nhân vật vào mọi vỏ rỗng có data-art. Nhờ vậy hình chỉ tồn tại ở đúng
     một chỗ (<template>), sửa một lần là đổi khắp: sàn Đấu Toán, pháp sư màn chọn
     chiến dịch và pháp sư giữ cổng Gõ Chữ. */
  function hydrateArt(root){
    (root||document).querySelectorAll('[data-art]').forEach(host=>{
      if(host.childElementCount)return;                 // đã bơm rồi thì thôi
      if(typeof fillArt==='function')fillArt(host,host.dataset.art);
    });
  }
  window.hydrateArt=hydrateArt;
  hydrateArt();

  window.refreshProfileSummary=function refreshProfileSummary(){
    const data=storage?.load?.()||{};
    const records=data.records||{};
    const typingBest=Number(records.typing?.bestScore)||0;
    const stars=Number(data.profile?.stars)||0;
    if($('profileStars'))$('profileStars').textContent=stars;
    if($('profileBadge'))$('profileBadge').textContent=stars>=60?'Vương miện tư duy · 60 sao':stars>=30?'Nhà khám phá · 30 sao':stars>=10?'Ngôi sao chăm học · 10 sao':'Mỗi câu đúng là một bước tiến';
    const skills=Object.entries(data.learning?.skills||{}).filter(([,v])=>v.attempts>0).sort((a,b)=>b[1].attempts-a[1].attempts);
    if($('profileLearning'))$('profileLearning').textContent=skills.length?`${TYPE_LABEL[skills[0][0]]||'Toán'}: tự làm đúng ${skills[0][1].correct}/${skills[0][1].attempts} câu`:'Bắt đầu một lượt để khám phá điều mới.';
    if($('profileTyping'))$('profileTyping').textContent=typingBest;
    if($('profileSudoku'))$('profileSudoku').textContent=Number(records.sudoku?.wins)||0;
    // Ô "Phiêu lưu" chiếm hai hàng trong lưới bento nên phải có nội dung xứng chỗ:
    // hiện luôn đã hạ được bao nhiêu boss thay vì để trống.
    const progress=$('advProgress');
    if(progress){
      const total=(typeof BOSSES!=='undefined'&&BOSSES.length)||10;
      const cleared=Math.max(0,Math.min(total,Number(data.adventure?.cleared ?? -1)+1));
      progress.innerHTML=`<span>Đã vượt <b>${cleared}/${total}</b> boss</span><i></i>`;
      progress.style.setProperty('--done',(cleared/total*100)+'%');
      const next=Math.min(total,Math.max(cleared+1,(Number(data.adventure?.bossIndex)||0)+1));
      if($('adventureAction'))$('adventureAction').textContent=cleared===total?'Ghé lại đảo ngọc →':data.adventure?.active?`Tiếp tục · Chặng ${next}/${total} →`:'Khám phá hành trình →';
      const track=$('journeyTrack');
      if(track){
        track.replaceChildren();
        for(let i=0;i<total;i++){
          const stop=document.createElement('span');stop.className=i<cleared?'done':i===next-1?'current':'';
          stop.textContent=i<cleared?'✓':String(i+1);stop.title=BOSSES[i].name;
          if(i===next-1&&cleared<total)stop.setAttribute('aria-current','step');
          track.append(stop);
        }
      }
    }
  };

  const saved=storage?.load?.()||{};
  if(saved.records){
    RECORDS.blitz=Number(saved.records.blitz)||0;
    RECORDS.surv=Number(saved.records.survival)||0;
  }
  if(typeof saved.settings?.sound==='boolean'){
    SOUND_ON=saved.settings.sound;
    document.querySelectorAll('#sndBtn,#sndBtnHome,#sndBtnTyping').forEach(button=>{
      button.textContent=SOUND_ON?'🔊':'🔇';
      button.setAttribute('aria-pressed',String(SOUND_ON));   // "bấm xuống" = đang bật, khớp toggleSound()
    });
  }

  refreshProfileSummary();
  window.addEventListener('game-storage:change',refreshProfileSummary);
  window.addEventListener('storage',refreshProfileSummary);

  /* Chỉ một modal mở tại một thời điểm trong app này, nên "modal đang mở" tra
     được bằng một selector chung — thêm modal thứ 3 trở đi không phải sửa gì
     ở đây, chỉ cần class="modal" + observeModal() bên dưới. */
  function activeModal(){ return document.querySelector('.modal.on'); }

  document.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    const tag=document.activeElement?.tagName;
    const isWriting=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';
    const modal=activeModal();
    if(modal){
      if(event.key==='Escape'){
        event.preventDefault();
        if(modal.id==='restartModal')closeRestart();else modal.classList.remove('on');
      }
      if(event.key==='Tab')trapModalFocus(event,modal);
      return;
    }
    if(event.key==='Escape'&&$('battle').classList.contains('active')){
      event.preventDefault();askRestart();return;
    }
    if(!isWriting&&$('battle').classList.contains('active')&&/^[1-5]$/.test(event.key)){
      const button=[...document.querySelectorAll('.ans:not(:disabled)')][Number(event.key)-1];
      if(button){event.preventDefault();button.click();}
    }
  });

  function trapModalFocus(event,modal){
    modal=modal||activeModal();
    if(!modal)return;
    const items=[...modal.querySelectorAll('button,[href],input,select,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled);
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }

  function observeModal(modal){
    if(!modal)return;
    new MutationObserver(()=>{
      const open=modal.classList.contains('on');
      modal.setAttribute('aria-hidden',String(!open));
      if(open){lastModalFocus=document.activeElement;requestAnimationFrame(()=>modal.querySelector('.modalbox')?.focus());}
      else if(lastModalFocus?.isConnected){lastModalFocus.focus();lastModalFocus=null;}
    }).observe(modal,{attributes:true,attributeFilter:['class']});
  }
  observeModal($('restartModal'));
  observeModal($('infoModal'));

  document.addEventListener('visibilitychange',()=>{
    document.body.classList.toggle('fx-quiet',document.hidden||BUSY_SCREENS.some(id=>$(id)?.classList.contains('active')));
    if(document.hidden&&$('battle').classList.contains('active')&&!$('restartModal').classList.contains('on'))askRestart();
    if(document.hidden&&$('typingGame').classList.contains('active')&&typeof pauseTypingForVisibility==='function')pauseTypingForVisibility();
  });

  window.addEventListener('beforeunload',()=>{
    if(typeof saveAdventureProgress==='function')saveAdventureProgress();
  });

  if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();
