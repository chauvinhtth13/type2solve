/* ============================================================
   THÁP HÀ NỘI (Tower of Hanoi)
   Ba tầng tách bạch, đọc từ trên xuống:
     1. LUẬT   — hàm THUẦN, không đụng DOM, không đọc biến ngoài. Test được
                 bằng console/browser-smoke qua global.HanoiRules.
     2. TRẠNG THÁI — đúng một object `state`, mọi thay đổi đi qua hàm ở tầng này.
     3. GIAO DIỆN  — chỉ đọc state rồi vẽ; không tự quyết định luật.
   Cùng khuôn IIFE + game-topbar/-setup/-play/-result như typing.js/sudoku.js.
============================================================ */
(function createHanoiGame(global) {
  'use strict';

  const runtime = global.GameRuntime;
  if (!runtime) throw new Error('HanoiGame requires window.GameRuntime');
  const { byId, safeSound, safeShowScreen } = runtime;
  const HANOI_SECTIONS = Object.freeze(['Setup', 'Play', 'Result']);

  const rules = global.HanoiRules;
  if (!rules) throw new Error('HanoiGame requires window.HanoiRules');
  const {
    MIN_DISKS, MAX_DISKS, PEGS,
    createTowers, topDisk, canMove, applyMove, isSolved, optimalMoves, solveFrom,
  } = rules;
  /* ============ 2. TRẠNG THÁI ============ */

  /* posture B — giá trị KHỞI ĐIỂM:
     AUTO_STEP_MS 620ms là tốc độ để mắt kịp theo từng bước. Chơi thử thấy trẻ
     kêu "nhanh quá không kịp nhìn" thì tăng lên 800; kêu "sốt ruột" ở 7 đĩa
     (127 bước ≈ 79 giây) thì giảm còn 400 hoặc thêm nút ×2. */
  const AUTO_STEP_MS = 620;
  /* 7 đĩa = 127 bước; ở tốc độ 1× là 78,7 giây — quá dài để ngồi nhìn. Cho đổi
     tốc độ thay vì ép một con số hợp với mọi số đĩa. */
  const AUTO_SPEEDS = [1, 2, 4];

  let state = null;
  let autoTimer = null;
  let autoSpeedIndex = 0;
  let runId = 0;

  function profile() {
    try { return global.GameStorage?.load?.() || {}; } catch (_) { return {}; }
  }

  function bestMoves() {
    return profile().records?.hanoi?.bestMoves || {};
  }

  function newState(diskCount) {
    return {
      diskCount,
      towers: createTowers(diskCount),
      selected: null,      // cọc đang bốc đĩa, null = chưa bốc
      moves: 0,
      history: [],         // ngăn xếp {towers, moves} để hoàn tác
      assisted: false,     // đã dùng tự động giải ⇒ không tính kỷ lục
      auto: false,
      status: 'running',
    };
  }

  /* Mọi nước đi — của người hay của máy — đều đi qua đúng cửa này. */
  function commitMove(from, to) {
    const next = applyMove(state.towers, from, to);
    if (!next) return false;
    state.history.push({ towers: state.towers, moves: state.moves });
    if (state.history.length > 400) state.history.shift();
    state.towers = next;
    state.moves += 1;
    state.selected = null;
    return true;
  }

  function undoMove() {
    if (!state || state.status !== 'running' || state.auto) return;
    const previous = state.history.pop();
    if (!previous) { setFeedback('Chưa có nước nào để hoàn tác.'); return; }
    state.towers = previous.towers;
    state.moves = previous.moves;
    state.selected = null;
    safeSound('click');
    render();
    setFeedback('↩️ Đã hoàn tác một nước.');
  }

  /* ============ 3. GIAO DIỆN ============ */

  function setFeedback(text, tone = '') {
    const el = byId('hanoiFeedback');
    if (!el) return;
    el.textContent = text;
    el.className = `hanoi-feedback${tone ? ` ${tone}` : ''}`;
  }

  function updateHud() {
    /* Chặn ngay ở ĐÂY chứ không ở từng chỗ gọi: goHome() gọi cleanupHanoiGame()
       cho MỌI màn, kể cả khi người chơi chưa từng mở Tháp Hà Nội — lúc đó state
       vẫn là null và stopAuto() vẫn chạy xuống tới đây. */
    if (!state) return;
    const optimal = optimalMoves(state.diskCount);
    if (byId('hanoiMoves')) byId('hanoiMoves').textContent = String(state.moves);
    if (byId('hanoiOptimal')) byId('hanoiOptimal').textContent = String(optimal);
    const best = bestMoves()[state.diskCount];
    if (byId('hanoiBest')) byId('hanoiBest').textContent = best ? String(best) : '—';
    const over = byId('hanoiOver');
    if (over) {
      const extra = state.moves - optimal;
      over.textContent = extra > 0 ? `+${extra}` : extra === 0 && state.moves > 0 ? '✓ tối ưu' : '';
      over.className = `hanoi-over${extra > 0 ? ' warn' : ''}`;
    }
    const undo = byId('hanoiUndoBtn');
    if (undo) undo.disabled = state.auto || !state.history.length || state.status !== 'running';
    const auto = byId('hanoiAutoBtn');
    if (auto) {
      auto.textContent = state.auto ? '⏸️ Dừng giải' : '🤖 Tự động giải';
      auto.disabled = state.status !== 'running';
    }
    const speed = byId('hanoiSpeedBtn');
    if (speed) {
      const x = AUTO_SPEEDS[autoSpeedIndex];
      const giay = Math.round(optimalMoves(state.diskCount) * (AUTO_STEP_MS / x) / 100) / 10;
      speed.textContent = `⏩ Tốc độ ×${x}`;
      speed.title = `Giải hết ${state.diskCount} đĩa mất khoảng ${giay} giây ở tốc độ này`;
    }
  }

  function cycleAutoSpeed() {
    autoSpeedIndex = (autoSpeedIndex + 1) % AUTO_SPEEDS.length;
    safeSound('click');
    updateHud();
  }

  /* Đĩa to nhất chiếm gần trọn bề ngang cọc, đĩa nhỏ nhất khoảng 1/3 — tỉ lệ
     tuyến tính theo kích cỡ để mắt so sánh được ngay "cái nào lớn hơn". */
  function diskWidthPercent(size, diskCount) {
    return 34 + (size - 1) / Math.max(1, diskCount - 1) * 58;
  }

  function render() {
    const board = byId('hanoiBoard');
    if (!board || !state) return;
    board.innerHTML = '';
    board.style.setProperty('--hanoi-disks', String(state.diskCount));
    state.towers.forEach((stack, pegIndex) => {
      const peg = document.createElement('button');
      peg.type = 'button';
      peg.className = 'hanoi-peg'
        + (state.selected === pegIndex ? ' picking' : '')
        + (pegIndex === 2 ? ' target' : '');
      const canDrop = state.selected !== null
        && state.selected !== pegIndex
        && canMove(state.towers, state.selected, pegIndex);
      if (canDrop) peg.classList.add('droppable');
      if (state.selected !== null && state.selected !== pegIndex && !canDrop) peg.classList.add('blocked');

      const label = ['A', 'B', 'C'][pegIndex];
      const top = topDisk(state.towers, pegIndex);
      peg.setAttribute('aria-label', state.selected === null
        ? `Cọc ${label}, ${stack.length} đĩa${top ? `, đĩa trên cùng cỡ ${top}` : ' (trống)'}. Bấm để bốc đĩa.`
        : state.selected === pegIndex
          ? `Cọc ${label}, đang bốc đĩa cỡ ${topDisk(state.towers, state.selected)}. Bấm lại để bỏ xuống.`
          : `Cọc ${label}. ${canDrop ? 'Bấm để đặt đĩa vào đây.' : 'Không đặt được đĩa vào đây.'}`);

      const rod = document.createElement('span');
      rod.className = 'hanoi-rod';
      peg.appendChild(rod);

      const stackEl = document.createElement('span');
      stackEl.className = 'hanoi-stack';
      stack.forEach((size, indexInStack) => {
        const disk = document.createElement('i');
        disk.className = `hanoi-disk d${size}`;
        const lifted = state.selected === pegIndex && indexInStack === stack.length - 1;
        if (lifted) disk.classList.add('lifted');
        disk.style.width = `${diskWidthPercent(size, state.diskCount)}%`;
        disk.dataset.size = String(size);   // mã định danh để FLIP lần được đĩa qua mỗi lần vẽ lại
        disk.textContent = String(size);
        stackEl.appendChild(disk);
      });
      peg.appendChild(stackEl);

      const name = document.createElement('span');
      name.className = 'hanoi-peg-name';
      name.textContent = pegIndex === 0 ? `${label} · xuất phát` : pegIndex === 2 ? `${label} · ĐÍCH 🎯` : `${label} · trung gian`;
      peg.appendChild(name);

      peg.onclick = () => onPegClick(pegIndex);
      board.appendChild(peg);
    });
    updateHud();
  }

  /* ---- FLIP: làm cho đĩa TRƯỢT dù bàn được vẽ lại hoàn toàn ----
     render() xoá sạch #hanoiBoard rồi dựng lại, nên phần tử đĩa cũ bị huỷ và
     `transition:transform` khai báo trong CSS KHÔNG BAO GIỜ chạy — đĩa nhảy cóc
     sang cọc mới, mất hẳn cảm giác "đặt xuống".
     Cách chữa không phải bỏ kiểu vẽ lại: đo vị trí CŨ trước khi vẽ (First), vẽ
     xong đo vị trí MỚI (Last), đặt ngược đĩa về chỗ cũ bằng transform (Invert)
     rồi bỏ transform ở khung hình sau cho nó tự trượt tới (Play). */
  function captureDiskRects() {
    const map = new Map();
    document.querySelectorAll('#hanoiBoard .hanoi-disk').forEach((el) => {
      map.set(el.dataset.size, el.getBoundingClientRect());
    });
    return map;
  }

  function playFlip(before) {
    if (!before || runtime.reducedMotion()) return;
    const moved = [];
    document.querySelectorAll('#hanoiBoard .hanoi-disk').forEach((el) => {
      const old = before.get(el.dataset.size);
      if (!old) return;
      const now = el.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      moved.push(el);
    });
    if (!moved.length) return;
    global.requestAnimationFrame(() => {
      moved.forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
        el.classList.add('landing');
        global.setTimeout(() => el.classList.remove('landing'), 320);
      });
    });
  }

  /* Vẽ lại kèm hoạt ảnh trượt — dùng cho MỌI nước đi thật (người hay máy). */
  function renderMoved(before) {
    render();
    playFlip(before);
  }

  /* Bấm cọc lần 1 = bốc đĩa trên ngọn; bấm lần 2 = thả. Bấm lại đúng cọc đang
     bốc = bỏ ý định. Hai nhịp như vậy cho phép NGHĨ LẠI trước khi đi — khác với
     kiểu bấm một phát đi luôn (không cứu vãn được nếu lỡ tay). */
  function onPegClick(pegIndex) {
    if (!state || state.status !== 'running') return;
    if (state.auto) { setFeedback('Đang chạy tự động giải — bấm "⏸️ Dừng giải" để tự chơi tiếp.'); return; }

    if (state.selected === null) {
      if (!state.towers[pegIndex].length) {
        setFeedback(`Cọc ${['A', 'B', 'C'][pegIndex]} đang trống, chưa có đĩa nào để bốc.`, 'error');
        safeSound('wrong');
        return;
      }
      state.selected = pegIndex;
      safeSound('click');
      render();
      setFeedback(`Đang bốc đĩa cỡ ${topDisk(state.towers, pegIndex)}. Bấm cọc muốn đặt vào.`);
      return;
    }

    if (state.selected === pegIndex) {
      state.selected = null;
      safeSound('click');
      render();
      setFeedback('Đã bỏ đĩa xuống chỗ cũ.');
      return;
    }

    const moving = topDisk(state.towers, state.selected);
    const landing = topDisk(state.towers, pegIndex);
    if (!canMove(state.towers, state.selected, pegIndex)) {
      safeSound('wrong');
      const peg = byId('hanoiBoard')?.children[pegIndex];
      if (peg) { peg.classList.remove('shake'); void peg.offsetWidth; peg.classList.add('shake'); }
      setFeedback(`❌ Không được! Đĩa cỡ ${moving} lớn hơn đĩa cỡ ${landing} đang nằm trên cọc ${['A', 'B', 'C'][pegIndex]}.`, 'error');
      return;
    }

    const from = state.selected;
    const before = captureDiskRects();
    commitMove(from, pegIndex);
    safeSound('hit');
    renderMoved(before);
    setFeedback(`Chuyển đĩa cỡ ${moving}: cọc ${['A', 'B', 'C'][from]} → cọc ${['A', 'B', 'C'][pegIndex]}.`, 'success');
    checkFinished();
  }

  function checkFinished() {
    if (!isSolved(state.towers, state.diskCount)) return false;
    state.status = 'won';
    stopAuto();
    finish();
    return true;
  }

  /* ---- Tự động giải: phát lại từng bước từ CHÍNH thế cờ hiện tại ---- */

  function stopAuto() {
    if (autoTimer) { global.clearTimeout(autoTimer); autoTimer = null; }
    if (state) state.auto = false;
    updateHud();
  }

  function toggleAutoSolve() {
    if (!state || state.status !== 'running') return;
    if (state.auto) {
      stopAuto();
      setFeedback('⏸️ Đã dừng. Em chơi tiếp nhé!');
      return;
    }
    state.selected = null;
    state.auto = true;
    state.assisted = true;
    safeSound('open');
    setFeedback('🤖 Máy đang giải từng bước từ đúng thế cờ hiện tại — nhìn kỹ quy luật nhé!');
    render();
    stepAuto();
  }

  function stepAuto() {
    const myRun = runId;
    const plan = solveFrom(state.towers, state.diskCount);
    if (!plan.length) { stopAuto(); checkFinished(); return; }
    const [from, to] = plan[0];
    const before = captureDiskRects();
    commitMove(from, to);
    safeSound('tick');
    renderMoved(before);
    setFeedback(`🤖 Bước ${state.moves}: cọc ${['A', 'B', 'C'][from]} → cọc ${['A', 'B', 'C'][to]} · còn ${plan.length - 1} bước nữa.`);
    if (checkFinished()) return;
    autoTimer = global.setTimeout(() => {
      if (myRun !== runId || !state || !state.auto) return;
      stepAuto();
    }, AUTO_STEP_MS / AUTO_SPEEDS[autoSpeedIndex]);
  }

  /* Ẩn tab đi thì dừng hẳn bộ tự giải: chạy tiếp trong nền chỉ tổ ngốn pin và
     lúc quay lại người chơi thấy bàn đã nhảy đi đâu mất mà không hiểu vì sao. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !state || !state.auto) return;
    stopAuto();
    setFeedback('⏸️ Tự động giải đã tạm dừng vì em chuyển sang tab khác. Bấm "🤖 Tự động giải" để chạy tiếp.');
  });

  /* ---- Kết thúc & kỷ lục ---- */

  function saveWin() {
    const optimal = optimalMoves(state.diskCount);
    const data = profile();
    const current = data.records?.hanoi || {};
    const times = { ...(current.bestMoves || {}) };
    const previous = Number(times[state.diskCount]) || 0;
    /* Dùng tự động giải thì KHÔNG ghi kỷ lục — nếu không, bấm một nút là có
       ngay số bước tối ưu và cả bảng kỷ lục mất sạch ý nghĩa. */
    const isRecord = !state.assisted && (previous <= 0 || state.moves < previous);
    if (isRecord) times[state.diskCount] = state.moves;
    try {
      global.GameStorage?.updateRecords?.({
        hanoi: { wins: (Number(current.wins) || 0) + 1, bestMoves: times },
      });
      if (!state.assisted) {
        // Thưởng sao theo số đĩa và độ gần tối ưu: giải 7 đĩa đúng 127 bước mới
        // được trọn 7 sao, còn đi vòng vo thì chỉ còn một nửa.
        const efficiency = optimal / Math.max(optimal, state.moves);
        global.GameStorage?.addStars?.(Math.max(1, Math.round(state.diskCount * efficiency)));
      }
    } catch (_) { /* không lưu được thì vẫn chơi được */ }
    return isRecord;
  }

  function finish() {
    const optimal = optimalMoves(state.diskCount);
    const isRecord = saveWin();
    const perfect = state.moves === optimal && !state.assisted;
    byId('hanoiResultIcon').textContent = perfect ? '👑' : state.assisted ? '🤖' : '🏆';
    byId('hanoiResultTitle').textContent = perfect ? 'HOÀN HẢO TUYỆT ĐỐI!' : 'CHUYỂN XONG THÁP!';
    byId('hanoiResultText').textContent = perfect
      ? `Đúng ${optimal} bước — không thể ít hơn được nữa!`
      : state.assisted
        ? 'Có dùng tự động giải nên ván này không tính kỷ lục — thử tự làm lại nhé!'
        : `Xong với ${state.moves} bước${isRecord ? ' · Kỷ lục mới!' : ` (tối ưu là ${optimal})`}`;
    byId('hanoiResultStats').innerHTML = `
      <div><span>Số đĩa</span><b>${state.diskCount}</b></div>
      <div><span>Số bước đã đi</span><b>${state.moves}</b></div>
      <div><span>Tối ưu 2^n−1</span><b>${optimal}</b></div>`;
    runtime.setExclusiveSections('hanoi', HANOI_SECTIONS, 'Result');
    safeSound('win');
    try { if (typeof global.confetti === 'function') global.confetti(perfect ? 60 : 35); } catch (_) { /* trang trí */ }
    renderSetupRecords();
    try { global.refreshProfileSummary?.(); } catch (_) { /* tuỳ chọn */ }
  }

  function renderSetupRecords() {
    const best = bestMoves();
    const wrap = byId('hanoiRecords');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (let n = MIN_DISKS; n <= MAX_DISKS; n += 1) {
      const cell = document.createElement('div');
      const record = Number(best[n]) || 0;
      cell.innerHTML = `<span>${n} đĩa</span><b>${record || '—'}</b><small>tối ưu ${optimalMoves(n)}</small>`;
      wrap.appendChild(cell);
    }
  }

  /* ---- Vòng đời màn chơi ---- */

  function readDiskCount() {
    const raw = Number(byId('hanoiDisks')?.value);
    if (!Number.isFinite(raw)) return 3;
    return Math.min(MAX_DISKS, Math.max(MIN_DISKS, Math.round(raw)));
  }

  function startHanoi(diskCount) {
    runId += 1;
    stopAuto();
    const n = Number.isFinite(Number(diskCount)) ? Math.min(MAX_DISKS, Math.max(MIN_DISKS, Math.round(Number(diskCount)))) : readDiskCount();
    state = newState(n);
    runtime.setExclusiveSections('hanoi', HANOI_SECTIONS, 'Play');
    safeSound('open');
    render();
    setFeedback(`Chuyển cả ${n} đĩa sang cọc C. Mỗi lần một đĩa, không đặt đĩa lớn lên đĩa nhỏ. Tối ưu: ${optimalMoves(n)} bước.`);
  }

  function restartHanoi() {
    if (!state) return;
    startHanoi(state.diskCount);
  }

  function openHanoiGame() {
    runId += 1;
    stopAuto();
    state = null;
    runtime.setExclusiveSections('hanoi', HANOI_SECTIONS, 'Setup');
    renderSetupRecords();
    safeShowScreen('hanoiGame');
    safeSound('open');
  }

  function cleanupHanoiGame() {
    runId += 1;
    stopAuto();
    state = null;
    const board = byId('hanoiBoard');
    if (board) board.innerHTML = '';
  }

  function leaveHanoiGame() {
    cleanupHanoiGame();
    safeSound('click');
    safeShowScreen('home');
  }

  global.openHanoiGame = openHanoiGame;
  global.startHanoi = startHanoi;
  global.restartHanoi = restartHanoi;
  global.undoHanoiMove = undoMove;
  global.toggleHanoiAutoSolve = toggleAutoSolve;
  global.cycleHanoiAutoSpeed = cycleAutoSpeed;
  global.leaveHanoiGame = leaveHanoiGame;
  global.cleanupHanoiGame = cleanupHanoiGame;

  /* Snapshot chỉ đọc cho browser test, không để test sửa state phiên chơi. */
  global.HanoiGame = Object.freeze({
    snapshot: () => (state ? {
      diskCount: state.diskCount,
      towers: state.towers.map((peg) => peg.slice()),
      moves: state.moves,
      assisted: state.assisted,
      status: state.status,
      auto: state.auto,
      autoSpeed: AUTO_SPEEDS[autoSpeedIndex],
    } : null),
  });
})(window);
