/* Chất lượng hiệu ứng, tiến độ học và ôn câu sai: không phụ thuộc hoạt ảnh. */
(function (root) {
  'use strict';
  const media = root.matchMedia('(prefers-reduced-motion: reduce)');
  let setting = GameStorage.load().settings.effects;
  let adaptiveLow = false;
  function quality() { return setting === 'off' || media.matches ? 'off' : setting === 'low' || adaptiveLow ? 'low' : 'standard'; }
  function sync() {
    document.body.dataset.effects = quality();
    document.querySelectorAll('[data-effects-setting]').forEach(el => { el.value = setting; });
    document.dispatchEvent(new CustomEvent('effects:change'));
  }
  document.querySelectorAll('[data-effects-setting]').forEach(el => el.addEventListener('change', () => {
    setting = el.value; GameStorage.updateSettings({ effects: setting }); sync();
  }));
  media.addEventListener('change', sync);
  root.addEventListener('game-storage:change', () => {
    const next = GameStorage.load().settings.effects;
    if (next !== setting) { setting = next; sync(); }
  });
  root.GameExperience = Object.freeze({
    quality,
    budget: () => quality() === 'off' ? 0 : quality() === 'low' ? 20 : 60,
    reportFrame(ms) { if (setting === 'auto' && ms > 45) { slowFrames++; if (slowFrames >= 20 && !adaptiveLow) { adaptiveLow = true; sync(); } } else slowFrames = Math.max(0, slowFrames - 1); },
  });
  let slowFrames = 0;
  sync();
  const icons={
    adv:'M5 3l13 13M3 5l13 13M3 3l2 6 4-4zM14 18l4-4m-1 3 4 4M21 3l-7 7M21 3l-2 6-4-4M6 14l4 4m-3-1-4 4',
    blitz:'M13 2 4 14h7l-1 8 10-13h-7z',
    surv:'M12 21S2 15 2 8a5 5 0 0 1 10-2A5 5 0 0 1 22 8c0 7-10 13-10 13z',
    typing:'M3 5h18v14H3zM6 9h1m3 0h1m3 0h1m3 0h0M6 12h1m3 0h1m3 0h1m3 0h0M7 16h10',
    sudoku:'M3 3h18v18H3zM9 3v18m6-18v18M3 9h18M3 15h18',
    duel:'M5 3v10l3 3 3-3V3M8 16v5m-3-2h6M16 3v10l3 3 3-3V3m-3 13v5m-3-2h6',
    nim:'M4 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0M14 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0M9 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
    hanoi:'M12 3v17M8 7h8v4H8zM5 11h14v4H5zM2 15h20v5H2z',
  };
  Object.entries(icons).forEach(([name,path])=>{
    const host=document.querySelector(`#home .${name==='adv'||name==='blitz'||name==='surv'?name:name+'-mode'} .mi,#home .${name}-mode .world-icon`);
    if(host)host.innerHTML=`<svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  });

  let entries = [], returnTo = 'home', review = [], index = 0, answered = false;
  function record(question, correct, assisted = false) {
    if (!question || !question.type) return;
    entries.push({ question, correct, assisted });
    if (entries.length > 100) entries.shift();
    const skills = GameStorage.load().learning.skills;
    const previous = skills[question.type] || { attempts: 0, correct: 0, assisted: 0 };
    skills[question.type] = { attempts: previous.attempts + 1, correct: previous.correct + (correct && !assisted ? 1 : 0), assisted: previous.assisted + (assisted ? 1 : 0) };
    GameStorage.save({ learning: { skills } });
  }
  function renderRecap(screen) {
    const host = screen.querySelector('[data-learning-recap]');
    if (!host) return;
    host.replaceChildren();
    if (!entries.length) return;
    const correct = entries.filter(e => e.correct && !e.assisted).length;
    const missed = entries.filter(e => !e.correct || e.assisted);
    const message = document.createElement('p');
    message.textContent = `Em tự làm đúng ${correct}/${entries.length} câu ${entries.length===100?'gần nhất':'trong lượt này'}.`;
    host.append(message);
    if (missed.length) {
      const label = document.createElement('p');
      label.textContent = 'Cùng luyện thêm: ' + [...new Set(missed.map(e => TYPE_LABEL[e.question.type] || e.question.type))].slice(0, 3).join(' · ');
      const button = document.createElement('button');
      button.className = 'btn'; button.textContent = 'Luyện lại câu khó';
      button.onclick = () => open(screen.id);
      host.append(label, button);
    } else { message.textContent += ' Em đã làm rất chắc tay!'; }
  }
  function open(screenId) {
    review = entries.filter(e => !e.correct || e.assisted).slice(-5).map(e => e.question);
    if (!review.length) return;
    returnTo = screenId; index = 0; showScreen('practice'); render();
  }
  function render() {
    answered = false;
    const q = review[index];
    $('practiceProgress').textContent = `${index + 1}/${review.length}`;
    $('practiceQuestion').textContent = q.q;
    $('practiceVisual').innerHTML = q.svg || '';
    $('practiceFeedback').textContent = '';
    $('practiceExplanation').textContent = '';
    $('practiceNext').hidden = true;
    const answers = $('practiceAnswers'); answers.replaceChildren();
    q.choices.forEach(value => {
      const button = document.createElement('button'); button.className = 'ans'; button.textContent = value;
      button.onclick = () => {
        if (answered) return;
        // Question choices come from the generator; compare against its canonical answer.
        const right = normalizeAnswer(value) === normalizeAnswer(q.ans);
        button.classList.add(right ? 'right' : 'wrong');
        $('practiceFeedback').textContent = right ? 'Đúng rồi! Em đã hiểu thêm một bước.' : 'Chưa đúng. Đọc gợi ý rồi chọn lại nhé.';
        $('practiceExplanation').innerHTML = q.exp || '';
        if (right) {
          answered = true; answers.querySelectorAll('button').forEach(b => { b.disabled = true; });
          $('practiceNext').hidden = false;
          $('practiceNext').textContent = index === review.length - 1 ? 'Hoàn tất luyện tập ✓' : 'Câu tiếp theo →';
          $('practiceNext').focus();
        } else button.disabled = true;
      };
      answers.append(button);
    });
    $('practiceQuestion').focus({ preventScroll: true });
  }
  root.LearningReview = Object.freeze({
    record, renderRecap,
    reset() { entries = []; },
    next() { if (!answered) return; if (++index >= review.length) this.leave(); else render(); },
    leave() { showScreen(returnTo); },
  });

  function viewport() {
    const vv = root.visualViewport;
    const writing = document.activeElement?.matches('input,textarea');
    document.body.classList.toggle('keyboard-open', Boolean(writing && vv && root.innerHeight - vv.height > 120));
  }
  root.visualViewport?.addEventListener('resize', viewport);
  document.addEventListener('focusin', viewport);
  document.addEventListener('focusout', () => root.requestAnimationFrame(viewport));
})(window);
