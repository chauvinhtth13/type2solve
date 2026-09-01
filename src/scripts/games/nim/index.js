/* ============================================================
   NIM MISÈRE — ai bốc viên sỏi CUỐI CÙNG sẽ THUA
   Ba tầng tách bạch:
     1. LUẬT   — hàm THUẦN (nim-sum, nước đi tối ưu Misère). Không đụng DOM,
                 soi được qua global.NimRules.
     2. TRẠNG THÁI — một object `state`, có lịch sử để HOÀN TÁC.
     3. GIAO DIỆN  — vẽ bàn, chọn-rồi-xác-nhận, điều phối lượt máy.
   Chế độ: 2 người cùng máy (PvP) · Máy Dễ (bốc ngẫu nhiên) · Máy Khó (bất bại).
============================================================ */
(function createNimGame(global) {
  'use strict';

  const runtime = global.GameRuntime;
  if (!runtime) throw new Error('NimGame requires window.GameRuntime');
  const { byId, safeSound, safeShowScreen } = runtime;
  const NIM_SECTIONS = Object.freeze(['Setup', 'Play', 'Result']);

  const rules = global.NimRules;
  if (!rules) throw new Error('NimGame requires window.NimRules');
  const {
    MIN_PILES, MAX_PILES, MIN_STONES, MAX_STONES,
    totalStones, aiMove, isWinningPosition, applyTake,
  } = rules;

  /* ============ 2. TRẠNG THÁI ============ */

  /* posture B — giá trị KHỞI ĐIỂM:
     AI_THINK_MS 700ms để nước đi của máy không "nháy" tức thì (trẻ cần thấy máy
     "đang nghĩ" mới tin là có đối thủ thật). Thấy sốt ruột thì hạ 450. */
  const AI_THINK_MS = 700;
  const DEFAULT_PILES = [3, 5, 7, 9, 11, 13];

  const OPPONENTS = {
    human: { label: '👥 2 người cùng máy', ai: null },
    easy: { label: '🤖 Máy — Dễ', ai: 'random' },
    medium: { label: '🤖 Máy — Vừa', ai: 'mixed' },
    hard: { label: '🧠 Máy — Khó (bất bại)', ai: 'perfect' },
  };

  let state = null;
  let aiTimer = null;
  let runId = 0;
  const skinIndex = [0, 0];
  const sessionWins = [0, 0];
  let startingPlayer = 0;    // đổi luân phiên mỗi ván để không ai giữ mãi lợi thế đi trước

  function skinAt(index) {
    const count = (typeof BOSS_SPRITES !== 'undefined' ? BOSS_SPRITES.length : 10);
    return { spriteIndex: skinIndex[index] % count };
  }

  function paintSprite(el, index) {
    const art = skinAt(index);
    if (el && typeof global.applySkin === 'function') global.applySkin(el, art);
  }

  function paintPreview(playerNumber) {
    paintSprite(byId(`nimSkinPreview${playerNumber}`), playerNumber - 1);
  }

  function cycleNimSkin(playerNumber, dir) {
    const count = (typeof BOSS_SPRITES !== 'undefined' ? BOSS_SPRITES.length : 10);
    const i = playerNumber - 1;
    skinIndex[i] = (skinIndex[i] + dir + count) % count;
    paintPreview(playerNumber);
    safeSound('click');
  }

  function playerName(index) {
    if (!state) return `Người chơi ${index + 1}`;
    return state.names[index] || (state.aiSeat === index ? 'Máy' : `Người chơi ${index + 1}`);
  }

  function isAiTurn() {
    return Boolean(state) && state.aiSeat === state.turn && state.status === 'running';
  }

  /* Mọi nước bốc — người hay máy — đi qua đúng cửa này. */
  function commitTake(pile, take) {
    const next = applyTake(state.piles, pile, take);
    if (!next) return false;
    state.history.push({ piles: state.piles, turn: state.turn });
    state.piles = next;
    state.pending = null;
    return true;
  }

  /* Hoàn tác: ở chế độ đấu máy phải lùi QUA CẢ nước của máy, nếu không người
     chơi bấm một cái là lại tới lượt máy đi tiếp — hoàn tác thành vô nghĩa. */
  function undoNim() {
    if (!state || state.status !== 'running' || state.thinking) return;
    let steps = 0;
    while (state.history.length) {
      const previous = state.history.pop();
      state.piles = previous.piles;
      state.turn = previous.turn;
      steps += 1;
      if (state.aiSeat === null || state.turn !== state.aiSeat) break;
    }
    if (!steps) { setFeedback('Chưa có nước nào để hoàn tác.'); return; }
    state.pending = null;
    safeSound('click');
    renderAll();
    setFeedback(`↩️ Đã hoàn tác ${steps} nước.`);
  }

  /* ============ 3. GIAO DIỆN ============ */

  function setFeedback(text, tone = '') {
    const el = byId('nimFeedback');
    if (!el) return;
    el.textContent = text;
    el.className = `nim-feedback${tone ? ` ${tone}` : ''}`;
  }

  function renderStatus() {
    const turnTxt = byId('nimTurnTxt');
    if (turnTxt) {
      turnTxt.textContent = state.status !== 'running'
        ? ''
        : isAiTurn()
          ? `🤖 ${playerName(state.turn)} đang nghĩ…`
          : `🪨 Đến lượt ${playerName(state.turn)}`;
    }
    const hint = byId('nimHint');
    if (hint) {
      // Gợi ý thế cờ chỉ bật khi người chơi tự yêu cầu — mặc định TẮT để không
      // phát lời giải miễn phí cho cả ván.
      if (!state.showHint || state.status !== 'running' || isAiTurn()) hint.textContent = '';
      else hint.textContent = isWinningPosition(state.piles)
        ? '💡 Thế cờ này em đang NẮM PHẦN THẮNG — có một nước đi đúng.'
        : '💡 Thế cờ này đang bất lợi — chỉ thắng được nếu đối thủ đi sai.';
    }
    const undo = byId('nimUndoBtn');
    if (undo) undo.disabled = !state.history.length || state.thinking || state.status !== 'running';
    const confirm = byId('nimConfirmBtn');
    const cancel = byId('nimCancelBtn');
    const has = Boolean(state.pending);
    if (confirm) {
      confirm.hidden = !has;
      confirm.textContent = has
        ? `✓ Lấy ${state.pending.take} viên ở hàng ${state.pending.pile + 1}`
        : '✓ Xác nhận';
    }
    if (cancel) cancel.hidden = !has;
  }

  /* Kim tự tháp là hình dáng LÚC BÀY BÀN, không phải luật sắp xếp chạy suốt ván.
     Các hàng giữ NGUYÊN thứ tự và NGUYÊN vị trí từ đầu tới cuối; hàng đã hết vẫn
     giữ chỗ (mờ đi, ghi "hết") để bố cục đứng yên tuyệt đối. */
  function renderBoard() {
    const board = byId('nimBoard');
    if (!board || !state) return;
    board.innerHTML = '';
    const total = totalStones(state.piles);
    board.style.setProperty('--nim-max', String(state.maxPile));
    board.style.setProperty('--nim-rows', String(state.piles.length));
    const frozen = state.status !== 'running' || isAiTurn() || state.thinking;

    state.piles.forEach((count, pileIndex) => {
      const row = document.createElement('div');
      row.className = 'nim-pile' + (count === 0 ? ' empty' : '');
      const label = document.createElement('span');
      label.className = 'nim-pile-label';
      const pendingHere = state.pending && state.pending.pile === pileIndex;
      label.textContent = count === 0
        ? '✔ hết'
        : pendingHere
          ? `lấy ${state.pending.take} → còn ${count - state.pending.take}`
          : `${count} viên`;
      if (pendingHere) label.classList.add('pending');
      row.appendChild(label);

      const stones = document.createElement('div');
      stones.className = 'nim-stones';
      for (let i = 0; i < count; i += 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nim-stone';
        btn.textContent = '🪨';
        const willTake = count - i;
        // Đánh dấu trước những viên SẼ bị lấy nếu xác nhận — thấy hậu quả
        // trước khi quyết, không phải bấm rồi mới biết.
        if (pendingHere && willTake <= state.pending.take) btn.classList.add('marked');
        btn.disabled = frozen;
        btn.setAttribute('aria-label', `Lấy ${willTake} viên ở hàng ${pileIndex + 1}`);
        if (total === 1) btn.classList.add('last-stone');
        btn.onclick = () => selectStone(pileIndex, i);
        stones.appendChild(btn);
      }
      row.appendChild(stones);
      board.appendChild(row);
    });
  }

  function renderAll() {
    renderBoard();
    renderStatus();
  }

  /* Bấm sỏi = CHỌN (chưa đi). Phải bấm "Xác nhận" mới thật sự bốc.
     Ở Nim Misère một nước lỡ tay là thua cả ván, nên hai nhịp là bắt buộc. */
  function selectStone(pileIndex, stoneIndex) {
    if (!state || state.status !== 'running' || isAiTurn() || state.thinking) return;
    const count = state.piles[pileIndex];
    const take = count - stoneIndex;
    if (take < 1 || take > count) return;
    if (state.pending && state.pending.pile === pileIndex && state.pending.take === take) {
      confirmTake();     // bấm lại đúng viên vừa chọn = xác nhận nhanh
      return;
    }
    state.pending = { pile: pileIndex, take };
    safeSound('click');
    renderAll();
    setFeedback(`Sẽ lấy ${take} viên ở hàng ${pileIndex + 1} (còn ${count - take}). Bấm "Xác nhận" để đi.`);
  }

  function cancelTake() {
    if (!state || !state.pending) return;
    state.pending = null;
    safeSound('click');
    renderAll();
    setFeedback('Đã bỏ chọn.');
  }

  function confirmTake() {
    if (!state || !state.pending || state.status !== 'running' || isAiTurn()) return;
    const { pile, take } = state.pending;
    doTake(pile, take);
  }

  /* Sỏi bị lấy phải THẤY là biến đi đâu.
     renderBoard() dựng lại toàn bộ bàn nên phần tử cũ bị huỷ — mọi transition
     khai báo trên .nim-stone không bao giờ chạy, sỏi cứ thế biến mất tại chỗ.
     Cách chữa rẻ nhất mà không phải bỏ kiểu vẽ lại: CHỤP vị trí những viên sắp
     mất TRƯỚC khi vẽ, rồi thả vào một lớp FX mấy con ma bay lên và mờ dần. */
  function ghostStones(pileIndex, take) {
    if (runtime.reducedMotion()) return;
    const board = byId('nimBoard');
    if (!board) return;
    const row = board.children[pileIndex];
    if (!row) return;
    const stones = [...row.querySelectorAll('.nim-stone')];
    const doomed = stones.slice(Math.max(0, stones.length - take));
    const boardRect = board.getBoundingClientRect();
    return doomed.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - boardRect.left, y: r.top - boardRect.top, w: r.width };
    });
  }

  function playGhosts(spots) {
    if (!spots || !spots.length) return;
    const board = byId('nimBoard');
    if (!board) return;
    spots.forEach((spot, i) => {
      const ghost = document.createElement('span');
      ghost.className = 'nim-ghost';
      ghost.textContent = '🪨';
      ghost.style.left = `${spot.x}px`;
      ghost.style.top = `${spot.y}px`;
      ghost.style.width = `${spot.w}px`;
      ghost.style.height = `${spot.w}px`;
      ghost.style.fontSize = `${spot.w * 0.56}px`;
      ghost.style.setProperty('--gx', `${(Math.random() - 0.5) * 90}px`);
      ghost.style.animationDelay = `${i * 45}ms`;
      board.appendChild(ghost);
      global.setTimeout(() => ghost.remove(), 700 + i * 45);
    });
  }

  function doTake(pile, take) {
    const actor = state.turn;
    const before = state.piles[pile];
    const spots = ghostStones(pile, take);   // chụp TRƯỚC khi bàn bị vẽ lại
    if (!commitTake(pile, take)) return;
    const total = totalStones(state.piles);
    setFeedback(`${playerName(actor)} lấy ${take} viên ở hàng ${pile + 1} (còn ${before - take} viên).`);
    safeSound('hit');
    if (total === 0) { renderAll(); playGhosts(spots); endNim(1 - actor); return; }
    if (total === 1) safeSound('tick');
    state.turn = 1 - actor;
    renderAll();
    playGhosts(spots);
    maybeRunAi();
  }

  /* ---- Lượt của máy ---- */

  function maybeRunAi() {
    if (!isAiTurn()) return;
    const myRun = runId;
    state.thinking = true;
    renderAll();
    aiTimer = global.setTimeout(() => {
      if (myRun !== runId || !state || !isAiTurn()) return;
      state.thinking = false;
      const move = aiMove(state.piles, state.aiLevel);
      if (!move) { state.thinking = false; return; }
      doTake(move.pile, move.take);
    }, AI_THINK_MS);
  }

  function stopAi() {
    if (aiTimer) { global.clearTimeout(aiTimer); aiTimer = null; }
    if (state) state.thinking = false;
  }

  /* Thắng MÁY mới là thành tích ghi vào hồ sơ; thắng bạn ngồi cạnh thì niềm vui
     nằm ở chỗ khác, không cần lưu. Hạ được Máy Khó đòi hỏi chơi tối ưu tuyệt đối
     nên không farm được — thưởng sao ở đây là an toàn. */
  const AI_STARS = { easy: 1, medium: 2, hard: 4 };

  function saveNimWin(winner) {
    if (state.aiSeat === null || winner === state.aiSeat) return null;
    const key = state.opponent;
    try {
      const current = (global.GameStorage?.load?.().records?.nim) || {};
      const aiWins = { ...(current.aiWins || {}) };
      aiWins[key] = (Number(aiWins[key]) || 0) + 1;
      global.GameStorage?.updateRecords?.({
        nim: { wins: (Number(current.wins) || 0) + 1, aiWins },
      });
      global.GameStorage?.addStars?.(AI_STARS[key] || 1);
      return AI_STARS[key] || 1;
    } catch (_) { return null; }   // không lưu được thì vẫn chơi được
  }

  function endNim(winner) {
    state.status = 'ended';
    stopAi();
    sessionWins[winner] += 1;
    const stars = saveNimWin(winner);
    runtime.setExclusiveSections('nim', NIM_SECTIONS, 'Result');
    byId('nimResultTitle').textContent = `🏆 ${playerName(winner)} THẮNG!`;
    byId('nimResultText').textContent =
      `Misère: ai bốc viên cuối cùng sẽ thua · Tỉ số trong phiên: ${playerName(0)} ${sessionWins[0]} — ${sessionWins[1]} ${playerName(1)}`
      + (stars ? ` · 🌟 +${stars} sao cho chiến thắng trước ${playerName(state.aiSeat)}!` : '');
    safeSound('win');
    if (stars) { try { global.confetti?.(40); } catch (_) { /* trang trí */ } }
    renderSetupRecords();
    try { global.refreshProfileSummary?.(); } catch (_) { /* tuỳ chọn */ }
  }

  function renderSetupRecords() {
    const wrap = byId('nimRecords');
    if (!wrap) return;
    let records = {};
    try { records = global.GameStorage?.load?.().records?.nim || {}; } catch (_) { records = {}; }
    const aiWins = records.aiWins || {};
    wrap.innerHTML = '';
    [['easy', '🤖 Máy Dễ'], ['medium', '🤖 Máy Vừa'], ['hard', '🧠 Máy Khó']].forEach(([key, label]) => {
      const cell = document.createElement('div');
      cell.innerHTML = `<span>${label}</span><b>${Number(aiWins[key]) || 0}</b><small>ván thắng</small>`;
      wrap.appendChild(cell);
    });
  }

  /* ---- Cấu hình bàn cờ ---- */

  function clampStones(value, fallback) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(MAX_STONES, Math.max(MIN_STONES, n));
  }

  function pileCount() {
    const n = Math.round(Number(byId('nimPileCount')?.value));
    if (!Number.isFinite(n)) return 3;
    return Math.min(MAX_PILES, Math.max(MIN_PILES, n));
  }

  /* Ô nhập số sỏi cho từng đống, dựng lại mỗi khi đổi số đống. Giữ nguyên giá
     trị người chơi đã gõ cho các đống còn tồn tại. */
  function renderPileInputs() {
    const wrap = byId('nimPileInputs');
    if (!wrap) return;
    const want = pileCount();
    const previous = [...wrap.querySelectorAll('input')].map((input) => Number(input.value));
    wrap.innerHTML = '';
    for (let i = 0; i < want; i += 1) {
      const cell = document.createElement('label');
      cell.className = 'nim-pile-input';
      const id = `nimPile${i}`;
      cell.innerHTML = `<span>Hàng ${i + 1}</span>`;
      const input = document.createElement('input');
      input.type = 'number';
      input.id = id;
      input.min = String(MIN_STONES);
      input.max = String(MAX_STONES);
      input.value = String(clampStones(previous[i], DEFAULT_PILES[i] || 3));
      input.addEventListener('change', () => { input.value = String(clampStones(input.value, DEFAULT_PILES[i] || 3)); });
      cell.appendChild(input);
      wrap.appendChild(cell);
    }
  }

  function readPiles() {
    const wrap = byId('nimPileInputs');
    const inputs = wrap ? [...wrap.querySelectorAll('input')] : [];
    if (!inputs.length) return DEFAULT_PILES.slice(0, 3);
    return inputs.map((input, i) => clampStones(input.value, DEFAULT_PILES[i] || 3));
  }

  function readOpponent() {
    const value = byId('nimOpponent')?.value;
    return OPPONENTS[value] ? value : 'human';
  }

  function startNim() {
    runId += 1;
    stopAi();
    const piles = readPiles();
    const opponent = readOpponent();
    const aiSeat = opponent === 'human' ? null : 1;
    state = {
      names: [
        byId('nimName1')?.value.trim() || '',
        aiSeat === 1 ? (opponent === 'hard' ? '🧠 Máy Khó' : '🤖 Máy Dễ') : (byId('nimName2')?.value.trim() || ''),
      ],
      piles,
      opponent,
      maxPile: Math.max(...piles),   // chốt lúc bày bàn → cỡ sỏi không đổi giữa ván
      /* Đấu NGƯỜI thì đổi lượt xuất phát luân phiên cho công bằng. Nhưng đấu MÁY
         thì người LUÔN đi trước — nếu không, ghép "đổi lượt luân phiên" với một
         con máy bất bại sẽ tạo ra một nửa số ván THUA CHẮC CHẮN dù trẻ chơi hoàn
         hảo (đo được: trần thắng tối đa chỉ 50%). Trẻ phải luôn CÓ đường thắng;
         thắng được hay không mới là chuyện của kỹ năng. */
      turn: aiSeat === null ? startingPlayer : 0,
      aiSeat,
      aiLevel: OPPONENTS[opponent].ai,
      pending: null,
      history: [],
      thinking: false,
      showHint: Boolean(byId('nimShowHint')?.checked),
      status: 'running',
    };
    // Chỉ luân phiên ở chế độ 2 người; đấu máy đã chốt người đi trước ở trên.
    if (aiSeat === null) startingPlayer = 1 - startingPlayer;

    [0, 1].forEach((i) => {
      const nameEl = byId(`nimPlayerName${i + 1}`);
      if (nameEl) nameEl.textContent = playerName(i);
      paintSprite(byId(`nimSprite${i + 1}`), i);
    });
    runtime.setExclusiveSections('nim', NIM_SECTIONS, 'Play');
    safeSound('open');
    renderAll();
    setFeedback(`Bàn ${piles.join('-')} · ${OPPONENTS[opponent].label}. ${playerName(state.turn)} đi trước.`);
    maybeRunAi();
  }

  function rematchNim() { startNim(); }

  function openNimGame() {
    runId += 1;
    stopAi();
    state = null;
    runtime.setExclusiveSections('nim', NIM_SECTIONS, 'Setup');
    renderPileInputs();
    renderSetupRecords();
    paintPreview(1);
    paintPreview(2);
    syncOpponentUi();
    safeShowScreen('nimGame');
    safeSound('open');
  }

  /* Đấu với máy thì ô tên người chơi 2 vô nghĩa — ẩn đi thay vì để trẻ gõ vào
     một ô sẽ bị ghi đè. */
  function syncOpponentUi() {
    const vsAi = readOpponent() !== 'human';
    const card = byId('nimPlayer2Card');
    if (card) card.classList.toggle('is-ai', vsAi);
    const name2 = byId('nimName2');
    if (name2) name2.disabled = vsAi;
    const aiNote = byId('nimAiNote');
    if (aiNote) {
      aiNote.hidden = !vsAi;
      const muc = readOpponent();
      aiNote.textContent = muc === 'hard'
        ? '🧠 Máy Khó dùng thuật toán nim-sum (XOR) và không bao giờ đi sai. Em LUÔN được đi trước nên vẫn có đường thắng — nhưng phải đúng từ nước đầu tiên. Thắng được: +4 🌟'
        : muc === 'medium'
          ? '🤖 Máy Vừa đi đúng phần lớn các nước nhưng thỉnh thoảng vẫn hớ — bậc thang để tập trước khi thử Máy Khó. Thắng được: +2 🌟'
          : '🤖 Máy Dễ bốc ngẫu nhiên — hợp để làm quen luật. Thắng được: +1 🌟';
    }
  }

  function cleanupNimGame() {
    runId += 1;
    stopAi();
    state = null;
    const board = byId('nimBoard');
    if (board) board.innerHTML = '';
  }

  function leaveNimGame() {
    cleanupNimGame();
    safeSound('click');
    safeShowScreen('home');
  }

  global.openNimGame = openNimGame;
  global.startNim = startNim;
  global.rematchNim = rematchNim;
  global.cycleNimSkin = cycleNimSkin;
  global.leaveNimGame = leaveNimGame;
  global.cleanupNimGame = cleanupNimGame;
  global.confirmNimTake = confirmTake;
  global.cancelNimTake = cancelTake;
  global.undoNimMove = undoNim;
  global.renderNimPileInputs = renderPileInputs;
  global.syncNimOpponent = syncOpponentUi;

  global.NimGame = Object.freeze({
    snapshot: () => (state ? {
      piles: state.piles.slice(),
      turn: state.turn,
      aiSeat: state.aiSeat,
      aiLevel: state.aiLevel,
      status: state.status,
      pending: state.pending ? { ...state.pending } : null,
    } : null),
  });
})(window);
