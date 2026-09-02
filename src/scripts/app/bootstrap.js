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
    // Ô hero trang chủ giống hệt nhau dù là lượt chơi đầu hay lượt 50 — cho
    // icon đổi theo tổng sao (đã tính sẵn cho #profileStars) để người chơi
    // quay lại thấy ngay hành trình của mình, không cần đọc số.
    if($('homeBigEmoji')){
      const rank=stars>=60?['👑','Bậc Thầy Tư Duy']:stars>=30?['🔥','Cao Thủ']:stars>=10?['⚡','Chiến Binh']:['🧠','Tân Binh'];
      $('homeBigEmoji').textContent=rank[0];
      $('homeBigEmoji').title=`${rank[1]} · ${stars} ⭐`;
    }
    if($('profileTyping'))$('profileTyping').textContent=typingBest;
    if($('profileSudoku'))$('profileSudoku').textContent=Number(records.sudoku?.wins)||0;
    // Ô "Phiêu lưu" chiếm hai hàng trong lưới bento nên phải có nội dung xứng chỗ:
    // hiện luôn đã hạ được bao nhiêu boss thay vì để trống.
    const progress=$('advProgress');
    if(progress){
      const total=(typeof BOSSES!=='undefined'&&BOSSES.length)||10;
      const cleared=Math.max(0,Math.min(total,Number(data.adventure?.cleared ?? -1)+1));
      progress.innerHTML=`Đã hạ <b>${cleared}/${total}</b> boss<i></i>`;
      progress.style.setProperty('--done',(cleared/total*100)+'%');
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
