/* Đấu Đối Kháng: 2 người cùng máy đặt tên, chọn nhân vật + KỸ NĂNG, rồi thay
   phiên trả lời câu hỏi (question-bank.js) để tung chưởng — ai hết máu trước thì
   thua. Không đụng tới G/arena.js: đây là màn riêng, tự trị, cùng khuôn
   game-topbar/-setup/-play/-result với typing.js/sudoku.js.

   LUẬT (đã soi qua bộ lọc 5 thành phần của skill game-design):
   • Đúng → gây sát thương gốc 20 + tier×3, rồi kỹ năng hai bên chỉnh lại.
   • 3 câu đúng LIÊN TIẾP → đòn kế tiếp CHÍ MẠNG ×2 (báo trước bằng huy hiệu
     combo nhấp nháy, không phải bất ngờ).
   • Sai → mất combo, không mất máu (trẻ nhỏ: sai đã đủ thiệt, không phạt kép).
   Mỗi người CHỈ có một kỹ năng và có đúng MỘT luật chung (chí mạng) — cố ý giữ
   ít phép tính ẩn để trẻ tiểu học vẫn đoán được chuyện gì sắp xảy ra. */
(function createDuelGame(global) {
  'use strict';

  const HP_MAX = 100;
  /* Numbers Policy — tất cả đều posture B (giá trị KHỞI ĐIỂM, kèm tiêu chí chỉnh):
     mục tiêu một ván kết thúc trong 4–8 đòn trúng. Chơi thử thấy <3 đòn (kết thúc
     hụt hẫng) hay >10 đòn (rề rà) thì chỉnh BASE_DAMAGE trước, rồi tới CRIT_MULT. */
  const BASE_DAMAGE = 20;
  const TIER_DAMAGE_STEP = 3;
  const CRIT_AT_COMBO = 3;     // số câu đúng liên tiếp để mở khoá chí mạng
  const CRIT_MULT = 2;
  const RAGE_PER_COMBO = 6;    // kỹ năng Cuồng nộ: mỗi bậc combo cộng thêm sát thương
  const DRAIN_SHARE = 0.5;     // Hút máu: hồi lại nửa sát thương vừa gây
  const HEAL_FLAT = 10;        // Hồi máu: cộng thẳng mỗi câu đúng
  const ARMOR_TAKEN = 0.7;     // Giáp: chỉ nhận 70% sát thương
  const TURN_DELAY = 950;      // nghỉ giữa các lượt để kịp đọc phản hồi

  const SKILLS = {
    drain: { icon: '🩸', name: 'Hút máu' },
    heal: { icon: '💚', name: 'Hồi máu' },
    armor: { icon: '🛡️', name: 'Giáp' },
    rage: { icon: '😡', name: 'Cuồng nộ' },
  };

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

  /* REDUCED_MOTION() đã là hàm toàn cục của core.js — không tự viết lại. */
  function reducedMotion() {
    return typeof REDUCED_MOTION === 'function' ? REDUCED_MOTION() : false;
  }

  /* runId cùng nguyên lý battleRunId/battleLater() của arena.js: rời màn giữa lúc
     hiệu ứng còn chạy thì callback trễ không được phép chạy nữa, nếu không nó sẽ
     sửa máu/hiện kết quả sai trên một trận đã bỏ dở. Chỉ cần đối chiếu runId —
     không phải nhớ danh sách timer, vì callback lạc hậu tự thoát sớm và
     clearFx() đã quét sạch mọi nút hiệu ứng còn sót trong DOM. */
  let runId = 0;
  function later(fn, ms) {
    const startedRun = runId;
    global.setTimeout(() => { if (startedRun === runId) fn(); }, ms);
  }
  function clearFx() {
    document.querySelectorAll('#duelArena .proj,#duelArena .boom,#duelArena .spark,#duelArena .dmgfloat')
      .forEach((el) => el.remove());
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
     window (chỉ function/var mới vậy), nên phải đọc qua biến toàn cục thuần. */
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

  function boxEl(i) { return byId(`duelP${i + 1}Box`); }
  function spriteEl(i) { return byId(`duelSprite${i + 1}`); }

  /* ============ HIỆU ỨNG ============
     Trước đây trúng đòn chỉ có mỗi thanh máu tụt — người chơi phải TỰ nhận ra là
     mình vừa bị đánh. Nay mỗi cú trúng bắn ra nhiều kênh phản hồi cùng lúc: số
     sát thương bay lên, nhân vật giật nảy, thanh máu để lại vệt đỏ, hạt văng,
     và chí mạng thì rung cả thẻ. */

  function arenaPoint(el) {
    const arena = byId('duelArena');
    if (!arena || !el) return null;
    const a = arena.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2, arena };
  }

  function floatText(targetIndex, text, cls) {
    const p = arenaPoint(boxEl(targetIndex));
    if (!p) return;
    const node = document.createElement('div');
    node.className = `dmgfloat ${cls}`;
    node.textContent = text;
    node.style.left = `${p.x}px`;
    /* Bay lên PHÍA TRÊN nhân vật, không đè lên mặt nó: số chí mạng to gần bằng
       cả con vật, đặt đúng tâm thì che mất chính cú đánh vừa diễn ra. */
    node.style.top = `${Math.max(12, p.y - p.arena.getBoundingClientRect().height * 0.22)}px`;
    p.arena.appendChild(node);
    later(() => node.remove(), 1100);
  }

  function sparkBurst(targetIndex, emojis, count) {
    if (reducedMotion()) return;
    const p = arenaPoint(boxEl(targetIndex));
    if (!p) return;
    for (let i = 0; i < count; i += 1) {
      const s = document.createElement('div');
      s.className = 'spark';
      s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      s.style.left = `${p.x}px`;
      s.style.top = `${p.y}px`;
      const ang = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 60;
      s.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
      p.arena.appendChild(s);
      later(() => s.remove(), 750);
    }
  }

  function hurtSprite(index) {
    const el = spriteEl(index);
    if (!el) return;
    el.classList.remove('duel-hurt');
    void el.offsetWidth;              // ép trình duyệt chạy lại animation
    el.classList.add('duel-hurt');
    later(() => el.classList.remove('duel-hurt'), 500);
  }

  function shakeCard(big) {
    const card = document.querySelector('#duelGame .game-card');
    if (!card || reducedMotion()) return;
    const cls = big ? 'shakeBig' : 'shake';
    card.classList.remove('shake', 'shakeBig');
    void card.offsetWidth;
    card.classList.add(cls);
    later(() => card.classList.remove(cls), 450);
  }

  function castBolt(fromIndex, toIndex, crit, onHit) {
    const from = arenaPoint(boxEl(fromIndex));
    const to = arenaPoint(boxEl(toIndex));
    if (!from || !to || reducedMotion()) { onHit(); return; }
    const bolt = document.createElement('div');
    bolt.className = 'proj' + (crit ? ' duel-crit-bolt' : '');
    bolt.innerHTML = `<span class="core">${crit ? '☄️' : '⚡'}</span>`;
    bolt.style.left = `${from.x - 17}px`;
    bolt.style.top = `${from.y - 17}px`;
    from.arena.appendChild(bolt);
    safeSound(crit ? 'crit' : 'shoot');
    global.requestAnimationFrame(() => {
      bolt.style.transform = `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(${crit ? 1.7 : 1.3})`;
    });
    later(() => {
      bolt.remove();
      const boom = document.createElement('div');
      boom.className = 'boom';
      boom.textContent = crit ? '💥' : '✨';
      boom.style.left = `${to.x - 23}px`;
      boom.style.top = `${to.y - 23}px`;
      to.arena.appendChild(boom);
      later(() => boom.remove(), 550);
      onHit();
    }, 460);
  }

  /* ============ HIỂN THỊ ============ */

  function renderHp() {
    [0, 1].forEach((i) => {
      const pct = Math.max(0, state.hp[i] / HP_MAX * 100);
      const fill = byId(`duelHp${i + 1}`);
      const ghost = byId(`duelHpGhost${i + 1}`);
      const txt = byId(`duelHpTxt${i + 1}`);
      if (fill) fill.style.width = `${pct}%`;
      // Vệt đỏ chạy theo SAU thanh máu: mắt kịp thấy "vừa mất bao nhiêu".
      if (ghost) ghost.style.width = `${pct}%`;
      if (txt) txt.textContent = `${state.hp[i]}`;
    });
  }

  function renderCombo() {
    [0, 1].forEach((i) => {
      const el = byId(`duelCombo${i + 1}`);
      if (!el) return;
      const c = state.combo[i];
      el.textContent = c >= 2 ? `🔥 ${c}` : '';
      // Sẵn sàng chí mạng thì huy hiệu tự nhấp nháy — CẢNH BÁO TRƯỚC khi đánh,
      // không phải giải thích sau khi đã trúng.
      el.classList.toggle('ready', c >= CRIT_AT_COMBO);
    });
  }

  function highlightTurn() {
    [0, 1].forEach((i) => boxEl(i)?.classList.toggle('turn-active', i === state.turn));
    const turnTxt = byId('duelTurnTxt');
    if (!turnTxt) return;
    const critReady = state.combo[state.turn] >= CRIT_AT_COMBO;
    turnTxt.innerHTML = `⚔️ Đến lượt <b>${playerName(state.turn)}</b>`
      + (critReady ? ' <span class="duel-crit-flag">⚡ CHÍ MẠNG SẴN SÀNG!</span>' : '');
  }

  function renderQuestion() {
    // makeFreshQuestion() của arena.js đã lo chống lặp (nhớ 40 câu gần nhất,
    // tránh 2 câu cùng dạng liền nhau) — dùng lại, không chép logic lần hai.
    state.q = global.makeFreshQuestion(state.tier);
    byId('duelQuestionTxt').textContent = state.q.q;
    const box = byId('duelAnswers');
    box.innerHTML = '';
    state.q.choices.forEach((value) => {
      const btn = document.createElement('button');
      btn.className = 'ans';
      btn.textContent = value;
      btn.onclick = () => answerDuel(btn, value);
      box.appendChild(btn);
    });
    byId('duelFeedback').textContent = '';
  }

  function lockAnswers() {
    document.querySelectorAll('#duelAnswers .ans').forEach((btn) => { btn.disabled = true; });
  }

  /* ============ LUẬT ============ */

  function damageFor(attacker, defender) {
    let dmg = BASE_DAMAGE + state.tier * TIER_DAMAGE_STEP;
    if (state.skills[attacker] === 'rage') dmg += RAGE_PER_COMBO * state.combo[attacker];
    const crit = state.combo[attacker] >= CRIT_AT_COMBO;
    if (crit) dmg *= CRIT_MULT;
    if (state.skills[defender] === 'armor') dmg *= ARMOR_TAKEN;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }

  function healSelf(index, amount, why) {
    if (amount <= 0) return;
    const before = state.hp[index];
    state.hp[index] = Math.min(HP_MAX, state.hp[index] + amount);
    const gained = state.hp[index] - before;
    if (gained <= 0) return;
    floatText(index, `+${gained}`, 'heal');
    sparkBurst(index, ['💚', '✨', '🌿'], 6);
    safeSound('heal');
    state.log.push(`${why} +${gained} máu`);
  }

  function answerDuel(btn, value) {
    if (!state || state.locked) return;
    state.locked = true;
    lockAnswers();
    const attacker = state.turn;
    const defender = 1 - attacker;
    const feedback = byId('duelFeedback');

    if (!global.isCorrectAnswer(value, state.q.ans)) {
      btn?.classList.add('wrong');
      state.combo[attacker] = 0;
      renderCombo();
      safeSound('wrong');
      feedback.textContent = `❌ Sai rồi! Đáp án đúng: ${state.q.ans} — mất combo.`;
      later(() => nextTurn(defender), TURN_DELAY);
      return;
    }

    btn?.classList.add('right');
    safeSound('right');
    state.log = [];
    const { dmg, crit } = damageFor(attacker, defender);
    const skill = state.skills[attacker];

    castBolt(attacker, defender, crit, () => {
      state.hp[defender] = Math.max(0, state.hp[defender] - dmg);
      hurtSprite(defender);
      floatText(defender, `-${dmg}`, crit ? 'crit' : 'hit');
      sparkBurst(defender, crit ? ['💥', '⭐', '⚡', '✨'] : ['💫', '✨'], crit ? 14 : 7);
      shakeCard(crit);
      safeSound('hit');
      if (state.skills[defender] === 'armor') state.log.push('🛡️ Giáp chặn bớt');

      if (skill === 'drain') healSelf(attacker, Math.round(dmg * DRAIN_SHARE), '🩸 Hút máu');
      if (skill === 'heal') healSelf(attacker, HEAL_FLAT, '💚 Hồi máu');
      if (skill === 'rage' && state.combo[attacker] > 0) state.log.push('😡 Cuồng nộ tăng đòn');
      /* renderHp() phải chạy SAU khi cả hút máu/hồi máu đã cộng xong — gọi ngay
         sau lúc trừ máu (bản trước) thì phần hồi không bao giờ hiện lên thanh
         máu, dù dòng chữ vẫn khoe "+18 máu". */
      renderHp();

      state.combo[attacker] += 1;
      renderCombo();
      feedback.textContent = `${crit ? '⚡ CHÍ MẠNG! ' : '✅ '}${playerName(attacker)} gây ${dmg} sát thương`
        + (state.log.length ? ` · ${state.log.join(' · ')}` : '');

      if (state.hp[defender] <= 0) { later(() => endDuel(attacker), 600); return; }
      later(() => nextTurn(defender), TURN_DELAY);
    });
  }

  function nextTurn(turn) {
    if (!state) return;
    state.turn = turn;
    state.locked = false;
    highlightTurn();
    renderCombo();
    renderQuestion();
  }

  function endDuel(winner) {
    sessionWins[winner] += 1;
    setSections('result');
    byId('duelResultTitle').textContent = `🏆 ${playerName(winner)} THẮNG!`;
    byId('duelResultText').textContent =
      `Tỉ số trong phiên: ${playerName(0)} ${sessionWins[0]} — ${sessionWins[1]} ${playerName(1)}`;
    safeSound('win');
    try { if (typeof global.confetti === 'function') global.confetti(50); } catch (_) { /* trang trí */ }
  }

  function startDuel() {
    runId += 1;
    clearFx();
    const tier = Number(byId('duelTier').value) || 2;
    const skillOf = (n) => (SKILLS[byId(`duelSkill${n}`)?.value] ? byId(`duelSkill${n}`).value : 'drain');
    state = {
      names: [byId('duelName1').value.trim(), byId('duelName2').value.trim()],
      skills: [skillOf(1), skillOf(2)],
      tier,
      hp: [HP_MAX, HP_MAX],
      combo: [0, 0],
      turn: 0,
      locked: false,
      log: [],
      q: null,
    };
    [0, 1].forEach((i) => {
      byId(`duelHpName${i + 1}`).textContent = `${i === 0 ? '🦸' : '🦹'} ${playerName(i)}`;
      const s = SKILLS[state.skills[i]];
      const badge = byId(`duelSkillBadge${i + 1}`);
      if (badge) { badge.textContent = `${s.icon} ${s.name}`; badge.title = s.name; }
      const svg = spriteEl(i);
      const art = skinAt(i);
      if (svg && art && typeof global.applySkin === 'function') global.applySkin(svg, art);
    });
    renderHp();
    renderCombo();
    setSections('play');
    safeSound('bossRoar');
    nextTurn(0);
  }

  function rematchDuel() { startDuel(); }

  function openDuelGame() {
    runId += 1;
    clearFx();
    setSections('setup');
    paintPreview(1);
    paintPreview(2);
    safeShowScreen('duelGame');
    safeSound('open');
  }

  function cleanupDuelGame() {
    runId += 1;
    clearFx();
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
  });
})(window);
