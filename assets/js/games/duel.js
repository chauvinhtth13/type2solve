/* Đấu Đối Kháng: 2 người cùng máy đặt tên, tuỳ chỉnh nhân vật (tái dùng BOSS_ART/
   applySkin của core.js), rồi thay phiên trả lời câu hỏi (question-bank.js) để
   tung chưởng — ai hết máu trước thì thua. Không đụng tới G/arena.js: đây là màn
   riêng, tự trị, cùng khuôn game-topbar/-setup/-play/-result với typing.js/sudoku.js. */
(function createDuelGame(global) {
  'use strict';

  const HP_MAX = 100;
  const BASE_DAMAGE = 20;      // posture B: mục tiêu 4-6 lượt trúng/ván, chỉnh nếu chơi thử lệch
  const TIER_DAMAGE_STEP = 3;
  const TURN_DELAY = 900;      // nghỉ giữa các lượt để đọc phản hồi

  function byId(id) { return document.getElementById(id); }

  function safeSound(name) {
    try {
      if (global.SFX && typeof global.SFX[name] === 'function') global.SFX[name]();
    } catch (_) { /* sound is optional */ }
  }

  function safeShowScreen(id) {
    if (typeof global.showScreen === 'function') global.showScreen(id);
    else {
      document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
      byId(id)?.classList.add('active');
    }
  }

  function reducedMotion() {
    try {
      return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) { return false; }
  }

  /* runId cùng nguyên lý battleRunId/battleLater() của arena.js: rời màn giữa lúc
     hiệu ứng tung chưởng (~460ms) còn bay thì callback trễ không được phép chạy
     nữa, nếu không nó sẽ sửa máu/hiện kết quả sai trên một trận đã bỏ dở. */
  let runId = 0;
  let fxTimers = [];
  function later(fn, ms) {
    const startedRun = runId;
    const id = global.setTimeout(() => {
      fxTimers = fxTimers.filter((t) => t !== id);
      if (startedRun !== runId) return;
      fn();
    }, ms);
    fxTimers.push(id);
    return id;
  }
  function clearFxTimers() {
    fxTimers.forEach(global.clearTimeout);
    fxTimers = [];
    document.querySelectorAll('#duelArena .proj,#duelArena .boom').forEach((el) => el.remove());
  }

  function setSections(visible) {
    ['Setup', 'Play', 'Result'].forEach((name) => {
      const el = byId(`duel${name}`);
      if (el) el.hidden = name.toLowerCase() !== visible;
    });
  }

  const skinIndex = [0, 0];
  const sessionWins = [0, 0];

  /* BOSS_ART là `const` khai báo ở core.js — const/let ở top-level KHÔNG gắn vào
     window (chỉ function/var mới vậy), nên phải đọc qua biến toàn cục thuần
     `BOSS_ART`, không phải `global.BOSS_ART` (luôn undefined, âm thầm tắt custom
     nhân vật mà không báo lỗi gì). */
  function skinAt(index) {
    const arts = typeof BOSS_ART !== 'undefined' ? BOSS_ART : [];
    return arts[skinIndex[index] % arts.length] || null;
  }

  function paintPreview(playerNumber) {
    const svg = byId(`duelSkinPreview${playerNumber}`);
    const art = skinAt(playerNumber - 1);
    if (svg && art && typeof global.applySkin === 'function') global.applySkin(svg, art);
  }

  function cycleDuelSkin(playerNumber, dir) {
    const count = (typeof BOSS_ART !== 'undefined' ? BOSS_ART.length : 0) || 1;
    const i = playerNumber - 1;
    skinIndex[i] = (skinIndex[i] + dir + count) % count;
    paintPreview(playerNumber);
    safeSound('click');
  }

  let state = null;

  function playerName(index) {
    return state.names[index] || `Người chơi ${index + 1}`;
  }

  function boxEl(index) { return byId(index === 0 ? 'duelP1Box' : 'duelP2Box'); }
  function spriteEl(index) { return byId(index === 0 ? 'duelSprite1' : 'duelSprite2'); }
  function hpFillEl(index) { return byId(index === 0 ? 'duelHp1' : 'duelHp2'); }

  function renderHp() {
    [0, 1].forEach((i) => {
      const fill = hpFillEl(i);
      if (fill) fill.style.width = `${Math.max(0, state.hp[i] / HP_MAX * 100)}%`;
    });
  }

  function highlightTurn() {
    [0, 1].forEach((i) => boxEl(i)?.classList.toggle('turn-active', i === state.turn));
    const turnTxt = byId('duelTurnTxt');
    if (turnTxt) turnTxt.textContent = `⚔️ Đến lượt ${playerName(state.turn)}`;
  }

  const recentSig = [];
  let lastType = '';
  function freshQuestion(tier) {
    let cand = null;
    for (let i = 0; i < 12; i += 1) {
      cand = global.genQuestion(tier);
      const sig = `${cand.q}|${cand.ans}`;
      const dupSig = recentSig.includes(sig);
      const dupType = cand.type === lastType && i < 8;
      if (!dupSig && !dupType) break;
    }
    recentSig.push(`${cand.q}|${cand.ans}`);
    if (recentSig.length > 40) recentSig.shift();
    lastType = cand.type;
    return cand;
  }

  function renderQuestion() {
    state.q = freshQuestion(state.tier);
    byId('duelQuestionTxt').textContent = state.q.q;
    const box = byId('duelAnswers');
    box.innerHTML = '';
    state.q.choices.forEach((value) => {
      const btn = document.createElement('button');
      btn.className = 'ans';
      btn.textContent = value;
      btn.onclick = () => answerDuel(value);
      box.appendChild(btn);
    });
    byId('duelFeedback').textContent = '';
  }

  function lockAnswers() {
    document.querySelectorAll('#duelAnswers .ans').forEach((btn) => { btn.disabled = true; });
  }

  function castBolt(fromIndex, toIndex, onHit) {
    const arena = byId('duelArena');
    const from = boxEl(fromIndex);
    const to = boxEl(toIndex);
    if (!arena || !from || !to || reducedMotion()) { onHit(); return; }
    const a = arena.getBoundingClientRect();
    const f = from.getBoundingClientRect();
    const t = to.getBoundingClientRect();
    const start = { x: f.left - a.left + f.width / 2, y: f.top - a.top + f.height / 2 };
    const end = { x: t.left - a.left + t.width / 2, y: t.top - a.top + t.height / 2 };
    const bolt = document.createElement('div');
    bolt.className = 'proj';
    bolt.innerHTML = '<span class="core">⚡</span>';
    bolt.style.left = `${start.x - 17}px`;
    bolt.style.top = `${start.y - 17}px`;
    arena.appendChild(bolt);
    safeSound('shoot');
    global.requestAnimationFrame(() => {
      bolt.style.transform = `translate(${end.x - start.x}px, ${end.y - start.y}px) scale(1.3)`;
    });
    later(() => {
      bolt.remove();
      const boom = document.createElement('div');
      boom.className = 'boom';
      boom.textContent = '💥';
      boom.style.left = `${end.x - 23}px`;
      boom.style.top = `${end.y - 23}px`;
      arena.appendChild(boom);
      safeSound('hit');
      later(() => boom.remove(), 550);
      onHit();
    }, 460);
  }

  function answerDuel(value) {
    if (!state || state.locked) return;
    state.locked = true;
    lockAnswers();
    const attacker = state.turn;
    const defender = 1 - state.turn;
    const feedback = byId('duelFeedback');
    if (global.isCorrectAnswer(value, state.q.ans)) {
      safeSound('right');
      feedback.textContent = `✅ ${playerName(attacker)} trả lời đúng!`;
      castBolt(attacker, defender, () => {
        const damage = BASE_DAMAGE + state.tier * TIER_DAMAGE_STEP;
        state.hp[defender] = Math.max(0, state.hp[defender] - damage);
        renderHp();
        if (state.hp[defender] <= 0) { endDuel(attacker); return; }
        later(() => nextTurn(defender), TURN_DELAY);
      });
    } else {
      safeSound('wrong');
      feedback.textContent = `❌ Sai rồi! Đáp án đúng: ${state.q.ans}`;
      later(() => nextTurn(defender), TURN_DELAY);
    }
  }

  function nextTurn(turn) {
    if (!state) return;
    state.turn = turn;
    state.locked = false;
    highlightTurn();
    renderQuestion();
  }

  function endDuel(winner) {
    sessionWins[winner] += 1;
    setSections('result');
    byId('duelResultTitle').textContent = `🏆 ${playerName(winner)} THẮNG!`;
    byId('duelResultText').textContent = `Tỉ số trong phiên: ${playerName(0)} ${sessionWins[0]} — ${sessionWins[1]} ${playerName(1)}`;
    safeSound('win');
  }

  function startDuel() {
    const tier = Number(byId('duelTier').value) || 2;
    state = {
      names: [byId('duelName1').value.trim(), byId('duelName2').value.trim()],
      tier,
      hp: [HP_MAX, HP_MAX],
      turn: 0,
      locked: false,
      q: null,
    };
    byId('duelHpName1').textContent = `🦸 ${playerName(0)}`;
    byId('duelHpName2').textContent = `🦹 ${playerName(1)}`;
    [spriteEl(0), spriteEl(1)].forEach((svg, i) => {
      const art = skinAt(i);
      if (svg && art && typeof global.applySkin === 'function') global.applySkin(svg, art);
    });
    renderHp();
    setSections('play');
    safeSound('bossRoar');
    nextTurn(0);
  }

  function rematchDuel() { startDuel(); }

  function openDuelGame() {
    runId += 1;
    setSections('setup');
    paintPreview(1);
    paintPreview(2);
    safeShowScreen('duelGame');
    safeSound('open');
  }

  function cleanupDuelGame() {
    runId += 1;
    clearFxTimers();
    state = null;
  }

  function leaveDuelGame() {
    cleanupDuelGame();
    safeSound('click');
    safeShowScreen('home');
  }

  global.openDuelGame = openDuelGame;
  global.startDuel = startDuel;
  global.rematchDuel = rematchDuel;
  global.cycleDuelSkin = cycleDuelSkin;
  global.leaveDuelGame = leaveDuelGame;
  global.cleanupDuelGame = cleanupDuelGame;
  /* Chỉ đọc, dùng cho browser-smoke.mjs — cùng tinh thần global.SudokuGame trong
     sudoku.js: câu hỏi random nên bài test cần một cửa an toàn để biết đáp án
     đúng mà không phải chép lại logic chấm điểm. */
  global.DuelGame = Object.freeze({
    currentAnswer: () => (state && state.q) ? state.q.ans : null,
    hp: () => state ? state.hp.slice() : null,
  });
})(window);
