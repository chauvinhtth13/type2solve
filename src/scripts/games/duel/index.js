/* ============================================================
   ĐẤU ĐỐI KHÁNG — RPG theo lượt + câu hỏi (2 người cùng máy)
   Ba tầng tách bạch:
     1. LUẬT   — hàm THUẦN: quy đổi chỉ số, công thức giảm sát thương, sát
                 thương đòn thường/tuyệt kỹ, kiểm tra phân bổ điểm. Không đụng
                 DOM, không đọc state. Soi được qua global.DuelRules.
     2. TRẠNG THÁI — một object `state` cho cả LOẠT TRẬN (BO-N) lẫn ván hiện tại.
     3. GIAO DIỆN  — vẽ + nhận input; không tự quyết định luật.

   LUẬT CHƠI
   • Mỗi người có 100 điểm chỉ số để tự chia vào ATK / DEF / HP.
   • Thể thức BO1 / BO3 / BO5. Sau mỗi ván: người thắng +100 điểm, người thua
     +50 điểm (lội ngược dòng), rồi cả hai nâng cấp trước ván sau.
   • Mỗi lượt phải trả lời một câu hỏi:
       – ĐÚNG  → chọn 1 trong 4 hành động: Tấn công · Phòng thủ · Hồi máu · Tích nộ
       – SAI   → mất lượt, đối thủ đi tiếp
   • Thanh Nộ 0→100. Đầy 100 thì mở khoá TUYỆT KỸ: BỎ QUA câu hỏi, gây sát
     thương lớn và xuyên một phần giáp, tiêu hết 100 nộ.
   • Đòn thường có xác suất CHÍ MẠNG ×1.5.
============================================================ */
(function createDuelGame(global) {
  'use strict';

  const runtime = global.GameRuntime;
  if (!runtime) throw new Error('DuelGame requires window.GameRuntime');
  const { byId, safeSound, safeShowScreen } = runtime;
  const DUEL_SECTIONS = Object.freeze(['Setup', 'Alloc', 'Play', 'Result']);
  const fxTimers = runtime.createTimerRegistry();

  const rules = global.DuelRules;
  if (!rules) throw new Error('DuelGame requires window.DuelRules');
  const {
    BASE, PER_POINT, START_POINTS, WIN_BONUS, LOSE_BONUS, MAX_SHARE,
    CRIT_CHANCE, CRIT_MULT, HEAL_SHARE, SHIELD_CUT, ULT_MULT, ULT_PIERCE,
    RAGE_MAX, RAGE, TURN_DELAY, STAT_KEYS, ACTIONS, HEAL_USES_PER_ROUND,
    RIPOSTE_SHARE, RAGE_DESPERATE,
    emptyAlloc, statsFrom, mitigate, maxPerStat, validateAlloc,
    attackDamage, ultimateDamage, healAmount, addRage, winsNeeded,
    riposteDamage, chargeGain,
  } = rules;
  /* ============ 2. TRẠNG THÁI ============ */

  let state = null;
  let runId = 0;
  const skinIndex = [0, 0];

  /* Cùng nguyên lý battleRunId/battleLater() của adventure/combat.js: rời màn giữa lúc hiệu
     ứng còn chạy thì callback trễ không được phép chạy nữa. */
  function later(fn, ms) {
    const startedRun = runId;
    return fxTimers.later(() => { if (startedRun === runId) fn(); }, ms);
  }

  function clearFx() {
    fxTimers.clear();
    document.querySelectorAll('#duelArena .proj,#duelArena .boom,#duelArena .spark,#duelArena .dmgfloat')
      .forEach((el) => el.remove());
  }

  function skinAt(index) {
    const count = (typeof ART_SKIN_COUNT !== 'undefined' ? ART_SKIN_COUNT : 10);
    return { spriteIndex: skinIndex[index] % count };
  }

  function paintPreview(playerNumber) {
    const svg = byId(`duelSkinPreview${playerNumber}`);
    const art = skinAt(playerNumber - 1);
    if (svg && typeof global.applySkin === 'function') global.applySkin(svg, art);
  }

  function cycleDuelSkin(playerNumber, dir) {
    const count = (typeof ART_SKIN_COUNT !== 'undefined' ? ART_SKIN_COUNT : 10);
    const i = playerNumber - 1;
    skinIndex[i] = (skinIndex[i] + dir + count) % count;
    paintPreview(playerNumber);
    safeSound('click');
  }

  function playerName(index) {
    return state?.players?.[index]?.name || `Người chơi ${index + 1}`;
  }

  function playerNameHtml(index) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return playerName(index).replace(/[&<>"']/g, (character) => entities[character]);
  }

  function stats(index) {
    return statsFrom(state.players[index].alloc);
  }

  /* ============ 3. GIAO DIỆN — hiệu ứng ============ */

  function boxEl(i) { return byId(`duelP${i + 1}Box`); }
  function spriteEl(i) { return byId(`duelSprite${i + 1}`); }

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
    node.style.top = `${Math.max(12, p.y - p.arena.getBoundingClientRect().height * 0.22)}px`;
    p.arena.appendChild(node);
    later(() => node.remove(), 1100);
  }

  function sparkBurst(targetIndex, emojis, count) {
    if (runtime.reducedMotion()) return;
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
    void el.offsetWidth;
    el.classList.add('duel-hurt');
    later(() => el.classList.remove('duel-hurt'), 500);
  }

  function shakeCard(big) {
    const card = document.querySelector('#duelGame .game-card');
    if (!card || runtime.reducedMotion()) return;
    const cls = big ? 'shakeBig' : 'shake';
    card.classList.remove('shake', 'shakeBig');
    void card.offsetWidth;
    card.classList.add(cls);
    later(() => card.classList.remove(cls), 450);
  }

  function castBolt(fromIndex, toIndex, kind, onHit) {
    const from = arenaPoint(boxEl(fromIndex));
    const to = arenaPoint(boxEl(toIndex));
    if (!from || !to || runtime.reducedMotion()) { onHit(); return; }
    const bolt = document.createElement('div');
    bolt.className = 'proj' + (kind === 'ult' ? ' duel-ult-bolt' : kind === 'crit' ? ' duel-crit-bolt' : '');
    bolt.innerHTML = `<span class="core">${kind === 'ult' ? '🌠' : kind === 'crit' ? '☄️' : '⚡'}</span>`;
    bolt.style.left = `${from.x - 17}px`;
    bolt.style.top = `${from.y - 17}px`;
    from.arena.appendChild(bolt);
    safeSound(kind === 'normal' ? 'shoot' : 'crit');
    global.requestAnimationFrame(() => {
      bolt.style.transform = `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(${kind === 'normal' ? 1.3 : 1.8})`;
    });
    later(() => {
      bolt.remove();
      const boom = document.createElement('div');
      boom.className = 'boom';
      boom.textContent = kind === 'normal' ? '✨' : '💥';
      boom.style.left = `${to.x - 23}px`;
      boom.style.top = `${to.y - 23}px`;
      to.arena.appendChild(boom);
      later(() => boom.remove(), 550);
      onHit();
    }, 460);
  }

  /* ============ 3b. GIAO DIỆN — bảng chỉ số & thanh trạng thái ============ */

  function renderHp() {
    [0, 1].forEach((i) => {
      const player = state.players[i];
      const max = stats(i).maxHp;
      const pct = Math.max(0, player.hp / max * 100);
      const fill = byId(`duelHp${i + 1}`);
      const ghost = byId(`duelHpGhost${i + 1}`);
      const txt = byId(`duelHpTxt${i + 1}`);
      if (fill) fill.style.width = `${pct}%`;
      if (ghost) ghost.style.width = `${pct}%`;
      if (txt) txt.textContent = `${player.hp}/${max}`;
    });
  }

  function renderRage() {
    [0, 1].forEach((i) => {
      const player = state.players[i];
      const fill = byId(`duelRage${i + 1}`);
      const txt = byId(`duelRageTxt${i + 1}`);
      const ready = player.rage >= RAGE_MAX;
      if (fill) {
        fill.style.width = `${player.rage}%`;
        fill.classList.toggle('full', ready);
      }
      if (txt) txt.textContent = ready ? '⚡ SẴN SÀNG!' : `${Math.round(player.rage)}%`;
    });
  }

  function renderStatusBadges() {
    [0, 1].forEach((i) => {
      const badge = byId(`duelStatus${i + 1}`);
      if (!badge) return;
      badge.textContent = state.players[i].shield ? '🛡️ Đang thủ' : '';
    });
  }

  function renderScoreboard() {
    const el = byId('duelSeries');
    if (!el) return;
    const need = winsNeeded(state.bestOf);
    el.innerHTML = `Ván <b>${state.round}</b> · BO${state.bestOf} (thắng ${need} ván) — `
      + `<b>${playerNameHtml(0)} ${state.wins[0]}</b> — <b>${state.wins[1]} ${playerNameHtml(1)}</b>`;
  }

  function renderStatLine() {
    [0, 1].forEach((i) => {
      const el = byId(`duelStatLine${i + 1}`);
      if (!el) return;
      const s = stats(i);
      el.textContent = `⚔️${Math.round(s.atk)} 🛡️${Math.round(s.def)} ❤️${s.maxHp}`;
    });
  }

  function highlightTurn() {
    [0, 1].forEach((i) => boxEl(i)?.classList.toggle('turn-active', i === state.turn));
    const turnTxt = byId('duelTurnTxt');
    if (!turnTxt) return;
    const ultReady = state.players[state.turn].rage >= RAGE_MAX;
    turnTxt.innerHTML = `⚔️ Đến lượt <b>${playerNameHtml(state.turn)}</b>`
      + (state.phase === 'action' ? ' — chọn hành động!' : '')
      + (ultReady && state.phase === 'quiz' ? ' <span class="duel-crit-flag">⚡ TUYỆT KỸ SẴN SÀNG!</span>' : '');
  }

  function setFeedback(text, tone = '') {
    const el = byId('duelFeedback');
    if (!el) return;
    el.textContent = text;
    el.className = `feedback${tone ? ` ${tone}` : ''}`;
  }

  function renderAll() {
    renderHp();
    renderRage();
    renderStatusBadges();
    renderStatLine();
    renderScoreboard();
    highlightTurn();
  }

  /* ============ 3c. GIAO DIỆN — phân bổ chỉ số ============ */

  /* Trần tính RIÊNG cho từng người: sau một ván, người thắng đã nhận 200 điểm
     còn người thua 150, nên trần của họ khác nhau. Bản đầu dùng chung `granted`
     của người chơi 1 cho cả hai ⇒ người thắng bị khoá nhầm ở trần thấp hơn và
     không tiêu hết được số điểm vừa thưởng. */
  function allocCap(playerIndex) {
    return maxPerStat(state.players[playerIndex].granted);
  }

  function renderAlloc() {
    const wrap = byId('duelAllocGrid');
    if (!wrap) return;
    wrap.innerHTML = '';
    [0, 1].forEach((i) => {
      const player = state.players[i];
      const cap = allocCap(i);
      const card = document.createElement('div');
      card.className = 'duel-alloc-card';
      const spent = STAT_KEYS.reduce((sum, key) => sum + player.draft[key], 0);
      const left = player.budget - spent;
      const preview = statsFrom({
        atk: player.alloc.atk + player.draft.atk,
        def: player.alloc.def + player.draft.def,
        hp: player.alloc.hp + player.draft.hp,
      });
      const head = document.createElement('div');
      head.className = 'duel-alloc-head';
      head.innerHTML = `<b>${i === 0 ? '🦸' : '🦹'} ${playerNameHtml(i)}</b>`
        + `<span class="duel-alloc-left${left === 0 ? ' done' : ''}">Còn <b>${left}</b> điểm</span>`;
      card.appendChild(head);

      const rows = [
        ['atk', '⚔️ Tấn công', `+${PER_POINT.atk} ATK mỗi điểm`],
        ['def', '🛡️ Phòng thủ', `+${PER_POINT.def} DEF mỗi điểm`],
        ['hp', '❤️ Máu', `+${PER_POINT.hp} HP mỗi điểm`],
      ];
      rows.forEach(([key, label, note]) => {
        const total = player.alloc[key] + player.draft[key];
        const row = document.createElement('div');
        row.className = 'duel-alloc-row';
        row.innerHTML = `<span class="duel-alloc-label">${label}<small>${note}</small></span>`;

        const controls = document.createElement('span');
        controls.className = 'duel-alloc-controls';
        [[-10, '−10'], [-1, '−'], [1, '+'], [10, '+10']].forEach(([delta, text]) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'duel-alloc-btn';
          btn.textContent = text;
          const nextDraft = player.draft[key] + delta;
          btn.disabled = nextDraft < 0
            || nextDraft > left + player.draft[key]
            || player.alloc[key] + nextDraft > cap;
          btn.onclick = () => adjustDraft(i, key, delta);
          controls.appendChild(btn);
        });
        const value = document.createElement('b');
        value.className = 'duel-alloc-value';
        value.textContent = `${total}${player.draft[key] ? ` (+${player.draft[key]})` : ''}`;
        controls.insertBefore(value, controls.children[2]);
        row.appendChild(controls);
        card.appendChild(row);
      });

      const summary = document.createElement('p');
      summary.className = 'duel-alloc-preview';
      summary.textContent = `⚔️ ATK ${Math.round(preview.atk)} · 🛡️ DEF ${Math.round(preview.def)} · ❤️ HP ${preview.maxHp}`;
      card.appendChild(summary);
      wrap.appendChild(card);
    });

    const capNote = byId('duelAllocCap');
    if (capNote) {
      capNote.textContent = `Trần mỗi chỉ số — ${playerName(0)}: ${allocCap(0)} điểm · `
        + `${playerName(1)}: ${allocCap(1)} điểm (không dồn quá một nửa tổng điểm đã nhận).`;
    }

    const ready = [0, 1].every((i) => validateAlloc({
      atk: state.players[i].draft.atk,
      def: state.players[i].draft.def,
      hp: state.players[i].draft.hp,
    }, state.players[i].budget, state.players[i].granted).ok);
    const btn = byId('duelAllocDone');
    if (btn) {
      btn.disabled = !ready;
      btn.textContent = ready ? '⚔️ VÀO TRẬN!' : 'Hãy dùng hết điểm của cả hai bên';
    }
  }

  function adjustDraft(playerIndex, key, delta) {
    const player = state.players[playerIndex];
    const cap = allocCap(playerIndex);
    const spent = STAT_KEYS.reduce((sum, k) => sum + player.draft[k], 0);
    const left = player.budget - spent;
    const next = player.draft[key] + delta;
    if (next < 0) return;
    if (delta > 0 && delta > left) return;
    if (player.alloc[key] + next > cap) return;
    player.draft[key] = next;
    safeSound('click');
    renderAlloc();
  }

  function confirmAlloc() {
    const invalid = [0, 1].map((i) => validateAlloc({
      atk: state.players[i].draft.atk,
      def: state.players[i].draft.def,
      hp: state.players[i].draft.hp,
    }, state.players[i].budget, state.players[i].granted)).find((result) => !result.ok);
    if (invalid) { setAllocNote(invalid.reason); return; }
    [0, 1].forEach((i) => {
      const player = state.players[i];
      STAT_KEYS.forEach((key) => { player.alloc[key] += player.draft[key]; });
      player.draft = emptyAlloc();
      player.budget = 0;
    });
    safeSound('levelup');
    beginRound();
  }

  function setAllocNote(text) {
    const el = byId('duelAllocNote');
    if (el) el.textContent = text || '';
  }

  /* ============ 3d. GIAO DIỆN — vòng lặp lượt đấu ============ */

  function renderQuestion() {
    // makeFreshQuestion() của adventure/combat.js đã lo chống lặp (nhớ 40 câu gần nhất,
    // tránh 2 câu cùng dạng liền nhau) — dùng lại, không chép logic lần hai.
    state.q = global.makeFreshQuestion(state.tier);
    byId('duelQuestionTxt').textContent = state.q.q;
    const box = byId('duelAnswers');
    box.innerHTML = '';
    box.className = 'answers' + (state.q.choices.length === 5 ? ' five' : '');
    state.q.choices.forEach((value, i) => {
      const btn = document.createElement('button');
      btn.className = 'ans';
      btn.textContent = value;
      btn.setAttribute('aria-keyshortcuts', String(i + 1));
      btn.onclick = () => answerDuel(btn, value);
      box.appendChild(btn);
    });
    byId('duelAnswers').hidden = false;
    byId('duelActions').hidden = true;
    byId('duelQbox').hidden = false;
  }

  function lockAnswers() {
    document.querySelectorAll('#duelAnswers .ans').forEach((btn) => { btn.disabled = true; });
  }

  function renderActions() {
    const wrap = byId('duelActions');
    if (!wrap) return;
    wrap.innerHTML = '';
    const me = state.players[state.turn];
    Object.entries(ACTIONS).forEach(([id, action]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `duel-action act-${id}`;
      /* Khoá ĐỦNG lúc không dùng được, kèm LÝ DO ngay trên nút — trẻ không
         phải bấm thử rồi đoán xem sao không ăn thua gì.
         "Phòng thủ khi đã có khiên" bị khoá là cố Ý: nếu cho thủ liên tục thì hai
         bên cùng thủ mãi là ván treo. Chặn lại ⇒ luôn phải đánh/hồi/tích nộ. */
      const disabledReason = id === 'heal' && me.healsLeft <= 0
        ? 'Hết lượt hồi của ván này'
        : id === 'heal' && me.hp >= stats(state.turn).maxHp
          ? 'Máu đang đầy'
          : id === 'defend' && me.shield
            ? 'Khiên đang bật rồi'
            : id === 'charge' && me.rage >= RAGE_MAX
              ? 'Nộ đã đầy'
              : '';
      btn.disabled = Boolean(disabledReason);
      const title = id === 'heal' ? `${action.name} (còn ${me.healsLeft})` : action.name;
      btn.innerHTML = `<span class="act-icon">${action.icon}</span>`
        + `<span class="act-body"><b>${title}</b><small>${disabledReason || action.desc}</small></span>`;
      btn.onclick = () => chooseAction(id);
      wrap.appendChild(btn);
    });
    wrap.hidden = false;
    byId('duelAnswers').hidden = true;
  }

  function renderUltButton() {
    const btn = byId('duelUltBtn');
    if (!btn) return;
    const ready = state.status === 'running'
      && state.phase === 'quiz'
      && !state.locked
      && state.players[state.turn].rage >= RAGE_MAX;
    btn.hidden = !ready;
    btn.textContent = `⚡ TUYỆT KỸ — bỏ qua câu hỏi, đánh mạnh! (${playerName(state.turn)})`;
  }

  function nextTurn(turn) {
    if (!state || state.status !== 'running') return;
    state.turn = turn;
    state.phase = 'quiz';
    state.locked = false;
    renderAll();
    renderQuestion();
    renderUltButton();
    setFeedback(`${playerName(turn)}: trả lời đúng để được chọn hành động.`);
  }

  function answerDuel(btn, value) {
    if (!state || state.locked || state.phase !== 'quiz') return;
    state.locked = true;
    lockAnswers();
    renderUltButton();
    const actor = state.turn;

    if (!global.isCorrectAnswer(value, state.q.ans)) {
      btn?.classList.add('wrong');
      document.querySelectorAll('#duelAnswers .ans').forEach((b) => {
        if (global.isCorrectAnswer(b.textContent, state.q.ans)) b.classList.add('right');
      });
      safeSound('wrong');
      setFeedback(`❌ Sai rồi! Đáp án đúng: ${state.q.ans} — mất lượt hành động.`, 'bad');
      later(() => nextTurn(1 - actor), TURN_DELAY + 400);
      return;
    }

    btn?.classList.add('right');
    safeSound('right');
    state.phase = 'action';
    setFeedback('✅ Chính xác! Chọn một hành động.', 'good');
    renderActions();
    highlightTurn();
  }

  /* Mọi hành động đều kết thúc bằng đúng một cửa: resolveEnd(). */
  function chooseAction(id) {
    if (!state || state.phase !== 'action') return;
    state.phase = 'resolving';
    byId('duelActions').hidden = true;
    const actor = state.turn;
    const target = 1 - actor;
    const me = state.players[actor];

    if (id === 'attack') { doAttack(actor, target, false); return; }

    if (id === 'defend') {
      me.shield = true;
      me.rage = addRage(me.rage, RAGE.defend);
      floatText(actor, '🛡️', 'heal');
      safeSound('shield');
      setFeedback(`🛡️ ${playerName(actor)} thủ thế — đòn kế tiếp của đối thủ bị chặn một nửa. Nộ +${RAGE.defend}%.`, 'good');
    } else if (id === 'heal') {
      const max = stats(actor).maxHp;
      const before = me.hp;
      me.hp = Math.min(max, me.hp + healAmount(max));
      me.healsLeft -= 1;
      me.rage = addRage(me.rage, RAGE.heal);
      floatText(actor, `+${me.hp - before}`, 'heal');
      sparkBurst(actor, ['💚', '✨', '🌿'], 7);
      safeSound('heal');
      setFeedback(`💚 ${playerName(actor)} hồi ${me.hp - before} máu. Nộ +${RAGE.heal}%.`
        + (me.healsLeft > 0 ? ` Còn ${me.healsLeft} lượt hồi.` : ' Đã hết lượt hồi ván này!'), 'good');
    } else if (id === 'charge') {
      const before = me.rage;
      const gain = chargeGain(me.hp, stats(actor).maxHp);
      me.rage = addRage(me.rage, gain);
      floatText(actor, `🔥 +${Math.round(me.rage - before)}%`, 'heal');
      sparkBurst(actor, ['🔥', '⚡', '✨'], 8);
      safeSound('levelup');
      setFeedback(`🔥 ${playerName(actor)} tích nộ: ${Math.round(before)}% → ${Math.round(me.rage)}%.`
        + (me.rage >= RAGE_MAX ? ' ⚡ TUYỆT KỸ đã sẵn sàng!' : ''), 'good');
    }
    renderAll();
    later(() => resolveEnd(actor), TURN_DELAY);
  }

  function useUltimate() {
    if (!state || state.status !== 'running' || state.phase !== 'quiz' || state.locked) return;
    if (state.players[state.turn].rage < RAGE_MAX) return;
    state.locked = true;
    state.phase = 'resolving';
    lockAnswers();
    byId('duelUltBtn').hidden = true;
    doAttack(state.turn, 1 - state.turn, true);
  }

  function doAttack(actor, target, ultimate) {
    const me = state.players[actor];
    const you = state.players[target];
    const shielded = you.shield;
    const result = ultimate
      ? ultimateDamage(stats(actor), stats(target), { shielded })
      : attackDamage(stats(actor), stats(target), { shielded });
    if (ultimate) me.rage = 0;

    const kind = ultimate ? 'ult' : result.crit ? 'crit' : 'normal';
    if (ultimate) {
      const banner = document.createElement('div');
      banner.className = 'ultText';
      banner.textContent = '⚡ TUYỆT KỸ! ⚡';
      byId('duelArena')?.appendChild(banner);
      later(() => banner.remove(), 1250);
    }

    /* Đòn bị khiên chặn mất một nửa; đúng cái nửa đó là "chỗ chặn được", và
       RIPOSTE_SHARE của nó dội ngược về kẻ tấn công. */
    const blocked = shielded ? result.damage : 0;
    const riposte = blocked ? riposteDamage(blocked) : 0;

    castBolt(actor, target, kind, () => {
      you.hp = Math.max(0, you.hp - result.damage);
      you.shield = false;                       // khiên chỉ chặn ĐÚNG một đòn
      me.rage = addRage(me.rage, ultimate ? 0 : RAGE.attack);
      you.rage = addRage(you.rage, RAGE.hurt);  // ăn đòn cũng dồn nộ ⇒ có đường lội ngược dòng
      hurtSprite(target);
      floatText(target, `-${result.damage}`, ultimate ? 'crit' : result.crit ? 'crit' : 'hit');
      sparkBurst(target, ultimate || result.crit ? ['💥', '⭐', '⚡', '✨'] : ['💫', '✨'], ultimate ? 18 : result.crit ? 14 : 7);
      shakeCard(ultimate || result.crit);
      safeSound('hit');
      if (riposte) {
        me.hp = Math.max(0, me.hp - riposte);
        hurtSprite(actor);
        floatText(actor, `-${riposte}`, 'hit');
        sparkBurst(actor, ['🛡️', '✦', '💢'], 8);
        safeSound('shield');
      }
      renderAll();

      const label = ultimate
        ? `⚡ TUYỆT KỸ! ${playerName(actor)} gây ${result.damage} sát thương (xuyên ${Math.round(ULT_PIERCE * 100)}% giáp)`
        : `${result.crit ? '💥 CHÍ MẠNG! ' : '⚔️ '}${playerName(actor)} gây ${result.damage} sát thương`;
      setFeedback(label
        + (shielded ? ` · 🛡️ khiên chặn nửa đòn và DỘI NGƯỢC ${riposte} sát thương!` : ''), 'good');

      /* Phản đòn có thể hạ gục CHÍNH kẻ vừa tấn công — phải kiểm cả hai bên,
         nếu không người tấn công tụt xuống 0 máu mà ván vẫn chạy tiếp. */
      if (me.hp <= 0) { later(() => endRound(target), 600); return; }
      later(() => resolveEnd(actor), TURN_DELAY);
    });
  }

  /* Cửa duy nhất kết thúc một lượt: kiểm tra thua/thắng rồi chuyển lượt. */
  function resolveEnd(actor) {
    if (!state || state.status !== 'running') return;
    const target = 1 - actor;
    if (state.players[target].hp <= 0) { endRound(actor); return; }
    nextTurn(target);
  }

  /* ============ 3e. Vòng đời ván & loạt trận ============ */

  function beginRound() {
    state.phase = 'quiz';
    state.status = 'running';
    state.locked = false;
    [0, 1].forEach((i) => {
      const player = state.players[i];
      player.hp = stats(i).maxHp;
      player.rage = 0;
      player.shield = false;
      player.healsLeft = HEAL_USES_PER_ROUND;   // nạp lại mỗi ván
      const nameEl = byId(`duelHpName${i + 1}`);
      if (nameEl) nameEl.textContent = `${i === 0 ? '🦸' : '🦹'} ${playerName(i)}`;
      const svg = spriteEl(i);
      const art = skinAt(i);
      if (svg && art && typeof global.applySkin === 'function') global.applySkin(svg, art);
    });
    /* Đổi người đi trước mỗi ván: đi trước là lợi thế thật (kết thúc trong 5–12
       đòn nên hơn nhau đúng một lượt là đủ quyết định), giữ nguyên P1 mãi thì
       cả loạt BO-N chỉ là một kết quả lặp lại. */
    state.turn = (state.round - 1) % 2;
    runtime.setExclusiveSections('duel', DUEL_SECTIONS, 'Play');
    if (typeof global.startAmbient === 'function') global.startAmbient(undefined, 'duelArena');
    renderAll();
    nextTurn(state.turn);
  }

  function endRound(winner) {
    state.status = 'roundEnd';
    state.wins[winner] += 1;
    safeSound('win');
    renderAll();
    const need = winsNeeded(state.bestOf);
    if (state.wins[winner] >= need) { later(() => endSeries(winner), 900); return; }

    // Thưởng điểm: thắng +100, thua +50 (cơ chế lội ngược dòng).
    const loser = 1 - winner;
    state.players[winner].budget = WIN_BONUS;
    state.players[winner].granted += WIN_BONUS;
    state.players[loser].budget = LOSE_BONUS;
    state.players[loser].granted += LOSE_BONUS;
    state.round += 1;
    if (typeof global.stopAmbient === 'function') global.stopAmbient();
    later(() => {
      byId('duelAllocTitle').textContent = `🏆 ${playerName(winner)} thắng ván ${state.round - 1}!`;
      setAllocNote(`${playerName(winner)} nhận +${WIN_BONUS} điểm · ${playerName(loser)} nhận +${LOSE_BONUS} điểm để lội ngược dòng.`);
      runtime.setExclusiveSections('duel', DUEL_SECTIONS, 'Alloc');
      renderScoreboard();
      renderAlloc();
    }, 1100);
  }

  function renderPlayed() {
    const el = byId('duelPlayed');
    if (!el) return;
    let n = 0;
    try { n = Number(global.GameStorage?.load?.().records?.duel?.series) || 0; } catch (_) { n = 0; }
    el.textContent = n > 0 ? `⚔️ Hai bạn đã chơi ${n} loạt trận trên máy này.` : '';
  }

  function saveSeries() {
    try {
      const current = global.GameStorage?.load?.().records?.duel || {};
      global.GameStorage?.updateRecords?.({ duel: { series: (Number(current.series) || 0) + 1 } });
    } catch (_) { /* không lưu được thì vẫn chơi được */ }
  }

  function endSeries(winner) {
    state.status = 'ended';
    saveSeries();
    if (typeof global.stopAmbient === 'function') global.stopAmbient();
    runtime.setExclusiveSections('duel', DUEL_SECTIONS, 'Result');
    byId('duelResultIcon').textContent = '🏆';
    byId('duelResultTitle').textContent = `🏆 ${playerName(winner)} VÔ ĐỊCH!`;
    byId('duelResultText').textContent =
      `Thắng loạt BO${state.bestOf} với tỉ số ${state.wins[winner]} — ${state.wins[1 - winner]}`;
    const s0 = stats(0);
    const s1 = stats(1);
    byId('duelResultStats').innerHTML = `
      <div><span>${playerNameHtml(0)}</span><b>${state.wins[0]}</b><small>⚔️${Math.round(s0.atk)} 🛡️${Math.round(s0.def)} ❤️${s0.maxHp}</small></div>
      <div><span>Số ván</span><b>${state.round}</b><small>BO${state.bestOf}</small></div>
      <div><span>${playerNameHtml(1)}</span><b>${state.wins[1]}</b><small>⚔️${Math.round(s1.atk)} 🛡️${Math.round(s1.def)} ❤️${s1.maxHp}</small></div>`;
    safeSound('win');
    try { if (typeof global.confetti === 'function') global.confetti(60); } catch (_) { /* trang trí */ }
  }

  function readTier() {
    const value = Number(byId('duelTier')?.value);
    return Number.isFinite(value) ? Math.min(5, Math.max(1, Math.round(value))) : 2;
  }

  function readBestOf() {
    const value = Number(byId('duelBestOf')?.value);
    return [1, 3, 5, 7].includes(value) ? value : 3;
  }

  /* Bắt đầu loạt trận: từ setup sang màn phân bổ 100 điểm đầu tiên. */
  function startDuel() {
    runId += 1;
    clearFx();
    state = {
      bestOf: readBestOf(),
      tier: readTier(),
      round: 1,
      wins: [0, 0],
      turn: 0,
      phase: 'alloc',
      status: 'alloc',
      locked: false,
      q: null,
      players: [0, 1].map((i) => ({
        name: byId(`duelName${i + 1}`)?.value.trim() || `Người chơi ${i + 1}`,
        alloc: emptyAlloc(),
        draft: emptyAlloc(),
        budget: START_POINTS,
        granted: START_POINTS,
        hp: 0,
        rage: 0,
        shield: false,
        healsLeft: HEAL_USES_PER_ROUND,
      })),
    };
    byId('duelAllocTitle').textContent = '🎯 Chia 100 điểm chỉ số';
    setAllocNote('Mỗi người tự chia 100 điểm vào Tấn công / Phòng thủ / Máu. Dùng hết điểm mới vào trận được.');
    runtime.setExclusiveSections('duel', DUEL_SECTIONS, 'Alloc');
    renderScoreboard();
    renderAlloc();
    safeSound('open');
  }

  function rematchDuel() {
    // Đấu lại = loạt trận MỚI, chỉ số về mốc xuất phát — nếu giữ nguyên chỉ số
    // đã nâng thì người thắng loạt trước bước vào loạt sau với ưu thế vĩnh viễn.
    startDuel();
  }

  function openDuelGame() {
    runId += 1;
    clearFx();
    state = null;
    runtime.setExclusiveSections('duel', DUEL_SECTIONS, 'Setup');
    renderPlayed();
    paintPreview(1);
    paintPreview(2);
    safeShowScreen('duelGame');
    safeSound('open');
  }

  function cleanupDuelGame() {
    runId += 1;
    clearFx();
    state = null;
    if (typeof global.stopAmbient === 'function') global.stopAmbient();
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
  global.confirmDuelAlloc = confirmAlloc;
  global.useDuelUltimate = useUltimate;

  global.DuelGame = Object.freeze({
    currentAnswer: () => (state && state.q ? state.q.ans : null),
    snapshot: () => (state ? {
      bestOf: state.bestOf,
      round: state.round,
      wins: state.wins.slice(),
      turn: state.turn,
      phase: state.phase,
      status: state.status,
      players: state.players.map((p) => ({
        name: p.name,
        hp: p.hp,
        rage: p.rage,
        shield: p.shield,
        healsLeft: p.healsLeft,
        budget: p.budget,
        granted: p.granted,
        alloc: { ...p.alloc },
        stats: statsFrom(p.alloc),
      })),
    } : null),
    /* Cửa dành riêng cho bài test: đặt thẳng phân bổ để dựng đúng thế trận cần
       kiểm, khỏi phải bấm hàng chục nút +1. */
    setAllocForTest: (index, alloc) => {
      if (!state || !state.players[index]) return false;
      state.players[index].alloc = { ...emptyAlloc(), ...alloc };
      state.players[index].draft = emptyAlloc();
      state.players[index].budget = 0;
      return true;
    },
  });
})(window);
