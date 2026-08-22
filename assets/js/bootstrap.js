(function bootstrapLearningArena(){
  'use strict';

  const storage=window.GameStorage;
  let lastModalFocus=null;

  window.refreshProfileSummary=function refreshProfileSummary(){
    const data=storage?.load?.()||{};
    const records=data.records||{};
    const typingBest=Number(records.typing?.bestScore)||0;
    if($('profileStars'))$('profileStars').textContent=Number(data.profile?.stars)||0;
    if($('profileTyping'))$('profileTyping').textContent=typingBest;
    if($('profileSudoku'))$('profileSudoku').textContent=Number(records.sudoku?.wins)||0;
  };

  const saved=storage?.load?.()||{};
  if(saved.records){
    RECORDS.blitz=Number(saved.records.blitz)||0;
    RECORDS.surv=Number(saved.records.survival)||0;
  }
  if(typeof saved.settings?.sound==='boolean'){
    SOUND_ON=saved.settings.sound;
    document.querySelectorAll('#sndBtn,#sndBtnHome').forEach(button=>{
      button.textContent=SOUND_ON?'🔊':'🔇';
      button.setAttribute('aria-pressed',String(!SOUND_ON));
    });
  }

  refreshProfileSummary();
  window.addEventListener('learning-progress',refreshProfileSummary);
  window.addEventListener('game-storage:change',refreshProfileSummary);
  window.addEventListener('storage',refreshProfileSummary);

  document.querySelectorAll('.ans').forEach((button,index)=>button.setAttribute('aria-keyshortcuts',String(index+1)));
  document.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    const tag=document.activeElement?.tagName;
    const isWriting=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';
    if($('restartModal').classList.contains('on')){
      if(event.key==='Escape'){event.preventDefault();closeRestart();}
      if(event.key==='Tab')trapModalFocus(event);
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

  function trapModalFocus(event){
    const modal=$('restartModal');
    const items=[...modal.querySelectorAll('button,[href],input,select,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled);
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }

  const modalObserver=new MutationObserver(()=>{
    const modal=$('restartModal'),open=modal.classList.contains('on');
    modal.setAttribute('aria-hidden',String(!open));
    if(open){lastModalFocus=document.activeElement;requestAnimationFrame(()=>modal.querySelector('.modalbox')?.focus());}
    else if(lastModalFocus?.isConnected){lastModalFocus.focus();lastModalFocus=null;}
  });
  modalObserver.observe($('restartModal'),{attributes:true,attributeFilter:['class']});

  document.addEventListener('visibilitychange',()=>{
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
