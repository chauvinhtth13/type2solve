/* Sudoku 9x9: six difficulty levels, notes, hints and persistent records. */
(function createSudokuGame(global) {
  'use strict';

  const runtime = global.GameRuntime;
  if (!runtime) throw new Error('Sudoku cần GameRuntime được nạp trước.');
  const { byId, safeSound, safeShowScreen } = runtime;
  const SECTION_NAMES = Object.freeze(['Setup', 'Play', 'Result']);

  const FULL_MASK = 0x3fe;
  const LEVEL_ORDER = ['beginner', 'easy', 'medium', 'hard', 'expert', 'ultimate'];
  const LEVELS = Object.freeze({
    beginner: { name: 'Làm quen', icon: '🌱', clues: 50, hints: 5, checks: 8, stars: 1, description: 'Nhiều ô mở sẵn, phù hợp ván đầu tiên' },
    easy: { name: 'Dễ', icon: '🙂', clues: 42, hints: 4, checks: 6, stars: 2, description: 'Rèn hàng, cột và khối 3×3' },
    medium: { name: 'Vừa', icon: '🧠', clues: 36, hints: 3, checks: 4, stars: 3, description: 'Cần kết hợp nhiều bước suy luận' },
    hard: { name: 'Khó', icon: '🔥', clues: 28, hints: 2, checks: 3, stars: 4, description: 'Ít dữ kiện, dành cho người đã quen' },
    expert: { name: 'Chuyên gia', icon: '💎', clues: 23, hints: 1, checks: 2, stars: 5, description: 'Một câu đố nổi tiếng có chuỗi suy luận sâu' },
    ultimate: { name: 'Tối thượng', icon: '👑', clues: 17, hints: 0, checks: 1, stars: 7, description: 'Chỉ 17 ô gợi ý · một lần kiểm tra duy nhất' },
  });

  /* `checks` là SỐ LẦN kiểm tra lỗi cho cả ván — posture B.
     Trước đây nút này dùng được vô hạn, nên cấp Tối thượng (17 ô, 0 gợi ý) phá
     được bằng cách điền bừa rồi bấm kiểm tra để xem ô nào đỏ: một vòng lặp mò
     hoàn toàn thay cho suy luận. Đếm số lần biến nó thành tài nguyên phải cân
     nhắc, đúng như gợi ý.
     Chỉnh: trẻ kêu bí quá thì nới cấp thấp (Làm quen/Dễ) lên trước; thấy vẫn mò
     được ở cấp cao thì hạ Chuyên gia/Tối thượng về 1/0. */

  /* Every seed has one solution. Row/column/digit symmetries create fresh-looking
     boards without changing the logical difficulty or uniqueness. */
  const SEEDS = Object.freeze({
    classic: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    medium: '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
    hard: '000000907000420180000705026100904000050000040000507009920108000034059000507000000',
    expert: '100007090030020008009600500005300900010080002600004000300000010040000007007000300',
    ultimate: '000000010400000000020000000000050407008000300001090000300400200050100000000806000',
  });

  const SEED_FOR_LEVEL = Object.freeze({
    beginner: 'classic', easy: 'classic', medium: 'medium', hard: 'hard', expert: 'expert', ultimate: 'ultimate',
  });

  let state = null;
  let timerId = null;
  let autoPaused = false;
  const seedCache = new Map();

  /* Hẹn giờ có theo dõi: rời màn giữa lúc hiệu ứng đang chạy thì phải huỷ hết,
     nếu không callback sẽ đụng vào DOM của màn khác. Cùng kỷ luật với các game kia. */
  const fxTimers = runtime.createTimerRegistry();
  const later = fxTimers.later;
  function clearFxTimers() {
    fxTimers.clear();
    document.querySelectorAll('.sudoku-cell.unit-clear').forEach(el => el.classList.remove('unit-clear'));
  }

  function shuffled(values) {
    return runtime.shuffle(values.slice());
  }

  function parsePuzzle(serialized) {
    if (typeof serialized !== 'string' || !/^[0-9]{81}$/.test(serialized)) {
      throw new Error('Bàn Sudoku phải có đúng 81 chữ số.');
    }
    return [...serialized].map(Number);
  }

  function bitCount(mask) {
    let count = 0;
    for (let value = mask; value; value &= value - 1) count += 1;
    return count;
  }

  function solveGrid(source, limit = 2) {
    const grid = source.slice();
    const rows = new Uint16Array(9);
    const columns = new Uint16Array(9);
    const boxes = new Uint16Array(9);
    let count = 0;
    let solution = null;

    for (let index = 0; index < 81; index += 1) {
      const digit = grid[index];
      if (!digit) continue;
      if (digit < 1 || digit > 9) return { count: 0, solution: null };
      const row = Math.floor(index / 9);
      const column = index % 9;
      const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
      const bit = 1 << digit;
      if ((rows[row] | columns[column] | boxes[box]) & bit) return { count: 0, solution: null };
      rows[row] |= bit;
      columns[column] |= bit;
      boxes[box] |= bit;
    }

    function search() {
      if (count >= limit) return;
      let target = -1;
      let targetMask = 0;
      let fewest = 10;

      for (let index = 0; index < 81; index += 1) {
        if (grid[index]) continue;
        const row = Math.floor(index / 9);
        const column = index % 9;
        const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
        const mask = FULL_MASK & ~(rows[row] | columns[column] | boxes[box]);
        if (!mask) return;
        const options = bitCount(mask);
        if (options < fewest) {
          target = index;
          targetMask = mask;
          fewest = options;
          if (options === 1) break;
        }
      }

      if (target < 0) {
        count += 1;
        if (!solution) solution = grid.slice();
        return;
      }

      const row = Math.floor(target / 9);
      const column = target % 9;
      const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
      for (let mask = targetMask; mask && count < limit; mask &= mask - 1) {
        const bit = mask & -mask;
        const digit = Math.log2(bit);
        grid[target] = digit;
        rows[row] |= bit;
        columns[column] |= bit;
        boxes[box] |= bit;
        search();
        grid[target] = 0;
        rows[row] &= ~bit;
        columns[column] &= ~bit;
        boxes[box] &= ~bit;
      }
    }

    search();
    return { count, solution };
  }

  function solvedSeed(name) {
    if (seedCache.has(name)) return seedCache.get(name);
    const puzzle = parsePuzzle(SEEDS[name]);
    const solved = solveGrid(puzzle, 2);
    if (solved.count !== 1 || !solved.solution) throw new Error(`Bộ đề Sudoku ${name} không có nghiệm duy nhất.`);
    const record = { puzzle, solution: solved.solution };
    seedCache.set(name, record);
    return record;
  }

  function groupedOrder() {
    const groups = shuffled([0, 1, 2]);
    return groups.flatMap((group) => shuffled([0, 1, 2]).map((offset) => group * 3 + offset));
  }

  function transformPair(puzzle, solution) {
    const digits = [0, ...shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])];
    const rowOrder = groupedOrder();
    const columnOrder = groupedOrder();
    const transpose = Math.random() < 0.5;

    function transform(grid) {
      const output = Array(81).fill(0);
      for (let row = 0; row < 9; row += 1) {
        for (let column = 0; column < 9; column += 1) {
          const sourceIndex = rowOrder[row] * 9 + columnOrder[column];
          const targetIndex = transpose ? column * 9 + row : row * 9 + column;
          output[targetIndex] = digits[grid[sourceIndex]];
        }
      }
      return output;
    }

    return { puzzle: transform(puzzle), solution: transform(solution) };
  }

  function createPuzzle(level) {
    const config = LEVELS[level] || LEVELS.medium;
    const base = solvedSeed(SEED_FOR_LEVEL[level] || 'medium');
    const puzzle = base.puzzle.slice();
    const blanks = shuffled(puzzle.map((value, index) => value ? -1 : index).filter((index) => index >= 0));
    let clues = puzzle.filter(Boolean).length;
    while (clues < config.clues && blanks.length) {
      const index = blanks.pop();
      puzzle[index] = base.solution[index];
      clues += 1;
    }
    const transformed = transformPair(puzzle, base.solution);
    return { ...transformed, clues };
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
  }

  function profile() {
    try { return global.GameStorage?.load?.() || {}; }
    catch (_) { return {}; }
  }

  function bestTimes() {
    return profile().records?.sudoku?.bestTimes || {};
  }

  function renderSetupRecords() {
    const records = profile().records?.sudoku || {};
    const times = records.bestTimes || {};
    LEVEL_ORDER.forEach((level) => {
      const target = byId(`sudokuBest-${level}`);
      if (target) target.textContent = Number(times[level]) > 0 ? `Kỷ lục ${formatTime(times[level])}` : 'Chưa có kỷ lục';
    });
    if (byId('sudokuTotalWins')) byId('sudokuTotalWins').textContent = Number(records.wins) || 0;
  }

  function applySavedDifficulty() {
    const saved = profile().settings?.sudokuDifficulty;
    const level = LEVELS[saved] ? saved : 'medium';
    const input = document.querySelector(`input[name="sudokuDifficulty"][value="${level}"]`);
    if (input) input.checked = true;
  }

  function showSudokuSection(name) {
    runtime.setExclusiveSections('sudoku', SECTION_NAMES, name);
  }

  function elapsedSeconds() {
    if (!state) return 0;
    const live = state.status === 'running' ? performance.now() - state.startedAt : 0;
    return Math.floor((state.elapsedMs + live) / 1000);
  }

  function updateTimer() {
    if (byId('sudokuTime')) byId('sudokuTime').textContent = formatTime(elapsedSeconds());
  }

  function stopTimer(commit = true) {
    if (state && commit && state.status === 'running') {
      const now = performance.now();
      state.elapsedMs += now - state.startedAt;
      state.startedAt = now;
    }
    clearInterval(timerId);
    timerId = null;
    updateTimer();
  }

  function startTimer() {
    if (!state) return;
    clearInterval(timerId);
    state.startedAt = performance.now();
    timerId = setInterval(updateTimer, 250);
    updateTimer();
  }

  function rowOf(index) { return Math.floor(index / 9); }
  function columnOf(index) { return index % 9; }
  function boxOf(index) { return Math.floor(rowOf(index) / 3) * 3 + Math.floor(columnOf(index) / 3); }

  function peers(a, b) {
    return rowOf(a) === rowOf(b) || columnOf(a) === columnOf(b) || boxOf(a) === boxOf(b);
  }

  /* Khép xong một hàng/cột/khối là mốc sướng nhất của Sudoku, mà bản cũ im lặng
     bỏ qua hoàn toàn. Phát hiện ngay lúc điền rồi làm sáng đúng 9 ô vừa hoàn thành. */
  function unitsCompletedBy(index) {
    if (!state) return [];
    const row = rowOf(index), col = columnOf(index), box = boxOf(index);
    const rowCells = [], colCells = [], boxCells = [];
    for (let i = 0; i < 81; i += 1) {
      if (rowOf(i) === row) rowCells.push(i);
      if (columnOf(i) === col) colCells.push(i);
      if (boxOf(i) === box) boxCells.push(i);
    }
    const full = list => list.every(i => state.values[i] && !hasRuleConflict(i));
    return [rowCells, colCells, boxCells].filter(full);
  }

  function celebrateUnits(units) {
    if (!units.length) return;
    units.forEach(cells => cells.forEach((index, n) => {
      const el = cellAt(index);
      if (!el) return;
      el.classList.remove('unit-clear');
      void el.offsetWidth;                       // ép khởi động lại animation nếu ô vừa sáng xong
      el.style.setProperty('--wave', (n * 42) + 'ms');
      el.classList.add('unit-clear');
      later(() => el.classList.remove('unit-clear'), 900 + n * 42);
    }));
    // Khép 2–3 đơn vị cùng lúc thì thưởng to hơn.
    safeSound(units.length > 1 ? 'levelup' : 'gold');
  }

  function hasRuleConflict(index) {
    if (!state || !state.values[index]) return false;
    return state.values.some((value, other) => other !== index && value === state.values[index] && peers(index, other));
  }

  function cellLabel(index) {
    const value = state.values[index];
    const place = `hàng ${rowOf(index) + 1}, cột ${columnOf(index) + 1}`;
    if (state.puzzle[index]) return `${place}, số cho sẵn ${value}`;
    if (value) return `${place}, đã điền ${value}`;
    const notes = [...state.notes[index]].sort().join(', ');
    return `${place}, ô trống${notes ? `, ghi chú ${notes}` : ''}`;
  }

  function renderCell(index) {
    const cell = cellAt(index);
    if (!cell || !state) return;
    const value = state.values[index];
    const selectedValue = state.selected >= 0 ? state.values[state.selected] : 0;
    cell.className = 'sudoku-cell';
    if (state.puzzle[index]) cell.classList.add('fixed');
    else cell.classList.add('editable');
    if (index === state.selected) cell.classList.add('selected');
    else if (state.selected >= 0 && peers(index, state.selected)) cell.classList.add('peer');
    if (value && selectedValue && value === selectedValue) cell.classList.add('same');
    if (state.incorrect.has(index) || hasRuleConflict(index)) cell.classList.add('incorrect');
    if (state.hinted.has(index)) cell.classList.add('hinted');
    cell.setAttribute('aria-label', cellLabel(index));
    cell.setAttribute('aria-selected', String(index === state.selected));
    cell.setAttribute('aria-readonly', String(Boolean(state.puzzle[index])));
    // Chỉ ô đang chọn nằm trong thứ tự Tab; các ô còn lại đi bằng phím mũi tên.
    cell.tabIndex = index === (state.selected >= 0 ? state.selected : 0) ? 0 : -1;
    cell.textContent = '';
    if (value) {
      const number = document.createElement('span');
      number.className = 'sudoku-value';
      number.textContent = value;
      cell.appendChild(number);
      return;
    }
    const noteGrid = document.createElement('span');
    noteGrid.className = 'sudoku-notes';
    for (let digit = 1; digit <= 9; digit += 1) {
      const note = document.createElement('i');
      note.textContent = state.notes[index].has(digit) ? digit : '';
      noteGrid.appendChild(note);
    }
    cell.appendChild(noteGrid);
  }

  function cellAt(index) {
    const board = byId('sudokuBoard');
    return board ? board.querySelector(`[data-index="${index}"]`) : null;
  }

  function renderBoard() {
    const board = byId('sudokuBoard');
    if (!board || !state) return;
    board.textContent = '';
    for (let row = 0; row < 9; row += 1) {
      // role="grid" đòi phần tử con mang role="row"; .sudoku-row dùng display:contents
      // nên 81 ô vẫn nằm thẳng trong lưới 9 cột như cũ.
      const rowEl = document.createElement('div');
      rowEl.className = 'sudoku-row';
      rowEl.setAttribute('role', 'row');
      for (let column = 0; column < 9; column += 1) {
        const index = row * 9 + column;
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.setAttribute('role', 'gridcell');
        cell.dataset.index = index;
        cell.addEventListener('click', () => selectCell(index));
        rowEl.appendChild(cell);
      }
      board.appendChild(rowEl);
    }
    for (let index = 0; index < 81; index += 1) renderCell(index);
  }

  function renderAllCells() {
    if (!state) return;
    for (let index = 0; index < 81; index += 1) renderCell(index);
  }

  function setFeedback(message, tone = '') {
    const feedback = byId('sudokuFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.dataset.tone = tone;
  }

  function updateHud() {
    if (!state) return;
    const config = LEVELS[state.level];
    if (byId('sudokuLevel')) byId('sudokuLevel').textContent = `${config.icon} ${config.name}`;
    if (byId('sudokuClues')) byId('sudokuClues').textContent = state.clues;
    if (byId('sudokuHints')) byId('sudokuHints').textContent = state.hintsLeft;
    if (byId('sudokuChecks')) byId('sudokuChecks').textContent = state.checksLeft;
    const checkButton = byId('sudokuCheckBtn');
    if (checkButton) {
      checkButton.disabled = state.checksLeft <= 0 || state.status !== 'running';
      checkButton.textContent = state.checksLeft > 0
        ? `🔍 Kiểm tra lỗi (${state.checksLeft})`
        : '🔍 Hết lượt kiểm tra';
    }
    const hintButton = byId('sudokuHintBtn');
    if (hintButton) {
      hintButton.disabled = state.hintsLeft <= 0 || state.status !== 'running';
      hintButton.textContent = state.hintsLeft > 0 ? `💡 Gợi ý (${state.hintsLeft})` : '💡 Hết gợi ý';
    }
    const noteButton = byId('sudokuNoteBtn');
    if (noteButton) {
      noteButton.classList.toggle('active', state.noteMode);
      noteButton.setAttribute('aria-pressed', String(state.noteMode));
      noteButton.textContent = `✏️ Ghi chú: ${state.noteMode ? 'BẬT' : 'TẮT'}`;
    }
  }

  /* Đổi ô chọn chỉ ảnh hưởng tới: ô cũ, ô mới, các ô cùng hàng/cột/khối với hai ô đó,
     và các ô trùng giá trị. Vẽ lại đúng ngần ấy thay vì dựng lại cả 81 ô (mỗi lần
     dựng lại là ~700 phần tử ghi chú bị xoá rồi tạo lại cho một lần bấm phím). */
  function selectCell(index) {
    if (!state || !Number.isInteger(index) || index < 0 || index > 80) return;
    const previous = state.selected;
    if (previous === index) return;
    state.selected = index;
    const touched = new Set([index]);
    if (previous >= 0) touched.add(previous);
    else touched.add(0);   // ô 0 là tab stop mặc định của renderCell()
    const values = [state.values[index], previous >= 0 ? state.values[previous] : 0];
    for (let other = 0; other < 81; other += 1) {
      if (peers(other, index) || (previous >= 0 && peers(other, previous))) touched.add(other);
      else if (state.values[other] && values.includes(state.values[other])) touched.add(other);
    }
    touched.forEach(renderCell);
  }

  function firstEditableBlank() {
    if (!state) return -1;
    return state.values.findIndex((value, index) => !value && !state.puzzle[index]);
  }

  function removePeerNotes(index, digit) {
    state.notes.forEach((notes, other) => {
      if (other !== index && peers(index, other)) notes.delete(digit);
    });
  }

  function inputDigit(digit) {
    if (!state || state.status !== 'running' || !Number.isInteger(digit) || digit < 1 || digit > 9) return;
    const index = state.selected;
    if (index < 0 || state.puzzle[index]) {
      setFeedback('Chọn một ô trống để điền số.', 'warning');
      return;
    }
    state.incorrect.delete(index);
    if (state.noteMode && !state.values[index]) {
      if (state.notes[index].has(digit)) state.notes[index].delete(digit);
      else state.notes[index].add(digit);
      safeSound('click');
      renderCell(index);
      return;
    }
    state.values[index] = digit;
    state.notes[index].clear();
    removePeerNotes(index, digit);
    renderAllCells();
    if (hasRuleConflict(index)) {
      setFeedback(`Số ${digit} đang bị trùng trong hàng, cột hoặc khối 3×3.`, 'error');
      safeSound('wrong');
    } else {
      const done = unitsCompletedBy(index);
      if (done.length) {
        setFeedback(done.length > 1 ? '🎉 Khép liền ' + done.length + ' nhóm một lúc!' : '✨ Hoàn thành một nhóm 9 ô!', 'success');
        celebrateUnits(done);
      } else {
        setFeedback('Đã điền số. Tiếp tục suy luận nhé!', 'success');
        safeSound('click');
      }
    }
    if (state.values.every(Boolean)) checkSudoku(true);
  }

  function eraseCell() {
    if (!state || state.status !== 'running' || state.selected < 0 || state.puzzle[state.selected]) return;
    state.values[state.selected] = 0;
    state.notes[state.selected].clear();
    state.incorrect.delete(state.selected);
    safeSound('click');
    renderAllCells();
    setFeedback('Đã xoá ô đang chọn.');
  }

  function toggleNotes() {
    if (!state || state.status !== 'running') return;
    state.noteMode = !state.noteMode;
    safeSound('click');
    updateHud();
    setFeedback(state.noteMode ? 'Chế độ ghi chú đang bật. Bấm số để thêm hoặc bỏ ứng viên.' : 'Đã tắt chế độ ghi chú.');
  }

  function useHint() {
    if (!state || state.status !== 'running' || state.hintsLeft <= 0) return;
    let index = state.selected;
    if (index < 0 || state.puzzle[index] || state.values[index] === state.solution[index]) index = firstEditableBlank();
    if (index < 0) {
      checkSudoku();
      return;
    }
    const digit = state.solution[index];
    state.values[index] = digit;
    state.notes[index].clear();
    state.incorrect.delete(index);
    state.hinted.add(index);
    state.hintsLeft -= 1;
    state.hintsUsed += 1;
    state.selected = index;
    removePeerNotes(index, digit);
    safeSound('heal');
    renderAllCells();
    updateHud();
    setFeedback(`Gợi ý: ô hàng ${rowOf(index) + 1}, cột ${columnOf(index) + 1} là số ${digit}.`, 'success');
    if (state.values.every(Boolean)) checkSudoku(true);
  }

  function saveWin(elapsed) {
    const data = profile();
    const current = data.records?.sudoku || {};
    const times = { ...(current.bestTimes || {}) };
    const previous = Number(times[state.level]) || 0;
    const isRecord = previous <= 0 || elapsed < previous;
    if (isRecord) times[state.level] = elapsed;
    try {
      global.GameStorage?.updateRecords?.({
        sudoku: {
          wins: (Number(current.wins) || 0) + 1,
          bestTimes: times,
          bestLevel: Math.max(Number(current.bestLevel) || 0, LEVEL_ORDER.indexOf(state.level) + 1),
        },
      });
      global.GameStorage?.addStars?.(LEVELS[state.level].stars);
    } catch (_) { /* the game still completes without persistent storage */ }
    return isRecord;
  }

  function finishSudoku() {
    if (!state || state.status !== 'running') return;
    stopTimer(true);
    state.status = 'won';
    const elapsed = Math.max(1, elapsedSeconds());
    const isRecord = saveWin(elapsed);
    const config = LEVELS[state.level];
    byId('sudokuResultIcon').textContent = state.level === 'ultimate' ? '👑' : '🏆';
    byId('sudokuResultTitle').textContent = state.level === 'ultimate' ? 'CHINH PHỤC TỐI THƯỢNG!' : 'HOÀN THÀNH SUDOKU!';
    byId('sudokuResultText').textContent = `${config.icon} ${config.name}${isRecord ? ' · Kỷ lục mới!' : ''}`;
    byId('sudokuResultStats').innerHTML = `
      <div><span>Thời gian</span><b>${formatTime(elapsed)}</b></div>
      <div><span>Lần kiểm tra lỗi</span><b>${state.checks}</b></div>
      <div><span>Gợi ý đã dùng</span><b>${state.hintsUsed}</b></div>`;
    showSudokuSection('Result');
    byId('sudokuPauseBtn').disabled = true;
    safeSound('win');
    try { if (typeof global.confetti === 'function') global.confetti(60); } catch (_) { /* decoration only */ }
    renderSetupRecords();
    try { global.refreshProfileSummary?.(); } catch (_) { /* optional */ }
  }

  function checkSudoku(auto = false) {
    if (!state || state.status !== 'running') return false;
    const blanks = [];
    const wrong = [];
    state.values.forEach((value, index) => {
      if (!value) blanks.push(index);
      else if (value !== state.solution[index]) wrong.push(index);
    });
    state.incorrect = new Set(wrong);
    if (!wrong.length && !blanks.length) {
      renderAllCells();
      finishSudoku();
      return true;
    }
    /* Hết lượt thì KHÔNG đánh dấu ô sai nữa — kể cả lần gọi tự động lúc bàn vừa
       đầy. Nếu vẫn chấm hộ ở nhánh tự động thì chỉ cần điền kín 81 ô là đọc được
       toàn bộ đáp án miễn phí, và cái giới hạn vừa đặt thành vô nghĩa. */
    if (state.checksLeft <= 0) {
      state.incorrect = new Set();
      renderAllCells();
      setFeedback(blanks.length
        ? `Em đã dùng hết lượt kiểm tra. Còn ${blanks.length} ô trống — hãy tự rà lại từng hàng, cột và khối 3×3 nhé!`
        : 'Bàn đã đầy nhưng còn ô chưa đúng, mà em đã hết lượt kiểm tra. Hãy tự rà lại từng hàng, cột và khối 3×3.',
        'error');
      safeSound('wrong');
      updateHud();
      return false;
    }
    state.checks += 1;
    state.checksLeft -= 1;
    updateHud();
    renderAllCells();
    if (wrong.length) {
      setFeedback(`${wrong.length} ô chưa đúng đã được đánh dấu. Còn ${state.checksLeft} lượt kiểm tra.`, 'error');
      safeSound('wrong');
    } else {
      setFeedback(`Chưa có ô sai. Còn ${blanks.length} ô cần hoàn thành · còn ${state.checksLeft} lượt kiểm tra.`, 'success');
      if (!auto) safeSound('right');
    }
    return false;
  }

  function pauseSudoku(fromVisibility = false) {
    if (!state || state.status !== 'running') return;
    stopTimer(true);
    state.status = 'paused';
    autoPaused = fromVisibility;
    byId('sudokuPauseOverlay').hidden = false;
    byId('sudokuPauseBtn').textContent = '▶️';
    byId('sudokuPauseBtn').setAttribute('aria-label', 'Tiếp tục');
    updateHud();
    if (!fromVisibility) safeSound('click');
  }

  function resumeSudoku() {
    if (!state || state.status !== 'paused') return;
    state.status = 'running';
    autoPaused = false;
    byId('sudokuPauseOverlay').hidden = true;
    byId('sudokuPauseBtn').textContent = '⏸️';
    byId('sudokuPauseBtn').setAttribute('aria-label', 'Tạm dừng');
    startTimer();
    updateHud();
    safeSound('click');
  }

  function togglePause() {
    if (!state) return;
    if (state.status === 'running') pauseSudoku(false);
    else if (state.status === 'paused') resumeSudoku();
  }

  function selectedLevel() {
    const input = document.querySelector('input[name="sudokuDifficulty"]:checked');
    return input && LEVELS[input.value] ? input.value : 'medium';
  }

  function startSudoku(levelOverride) {
    const level = LEVELS[levelOverride] ? levelOverride : selectedLevel();
    let generated;
    try { generated = createPuzzle(level); }
    catch (error) {
      setFeedback('Không thể tạo bàn Sudoku. Hãy thử tải lại trang.', 'error');
      return false;
    }
    cleanupRuntime();
    state = {
      status: 'running',
      level,
      puzzle: generated.puzzle,
      solution: generated.solution,
      clues: generated.clues,
      values: generated.puzzle.slice(),
      notes: Array.from({ length: 81 }, () => new Set()),
      selected: generated.puzzle.findIndex((value) => !value),
      incorrect: new Set(),
      hinted: new Set(),
      noteMode: false,
      hintsLeft: LEVELS[level].hints,
      checksLeft: LEVELS[level].checks,
      hintsUsed: 0,
      checks: 0,
      elapsedMs: 0,
      startedAt: performance.now(),
    };
    try { global.GameStorage?.updateSettings?.({ sudokuDifficulty: level }); } catch (_) { /* optional */ }
    showSudokuSection('Play');
    safeShowScreen('sudokuGame');
    byId('sudokuPauseOverlay').hidden = true;
    byId('sudokuPauseBtn').disabled = false;
    byId('sudokuPauseBtn').textContent = '⏸️';
    renderBoard();
    updateHud();
    setFeedback('Mỗi hàng, cột và khối 3×3 phải có đủ các số từ 1 đến 9. Chúc bạn chơi vui!');
    startTimer();
    const initialSelection = state.selected;
    requestAnimationFrame(() => {
      if (state && byId('sudokuGame')?.classList.contains('active')) {
        cellAt(initialSelection)?.focus({ preventScroll: true });
      }
    });
    safeSound('open');
    return true;
  }

  function restartSudoku() {
    if (!state) return;
    if (state.status !== 'won' && !global.confirm('Chơi lại bàn này từ đầu? Thời gian hiện tại sẽ bị xoá.')) return;
    const puzzle = state.puzzle.slice();
    const solution = state.solution.slice();
    const level = state.level;
    const clues = state.clues;
    cleanupRuntime();
    state = {
      status: 'running', level, puzzle, solution, clues, values: puzzle.slice(),
      notes: Array.from({ length: 81 }, () => new Set()), selected: puzzle.findIndex((value) => !value),
      incorrect: new Set(), hinted: new Set(), noteMode: false, hintsLeft: LEVELS[level].hints,
      hintsUsed: 0, checks: 0, elapsedMs: 0, startedAt: performance.now(),
    };
    showSudokuSection('Play');
    byId('sudokuPauseOverlay').hidden = true;
    byId('sudokuPauseBtn').disabled = false;
    renderBoard();
    updateHud();
    setFeedback('Bàn đã được đưa về trạng thái ban đầu.');
    startTimer();
  }

  function newSudoku() {
    if (state && ['running', 'paused'].includes(state.status)
        && !global.confirm('Tạo bàn mới? Tiến độ của bàn hiện tại sẽ bị xoá.')) return;
    startSudoku(state?.level || selectedLevel());
  }

  function chooseLevel() {
    if (state && ['running', 'paused'].includes(state.status)
        && !global.confirm('Quay lại chọn cấp độ? Tiến độ của bàn hiện tại sẽ bị xoá.')) return;
    cleanupRuntime();
    state = null;
    applySavedDifficulty();
    renderSetupRecords();
    showSudokuSection('Setup');
    byId('sudokuPauseBtn').disabled = true;
    safeShowScreen('sudokuGame');
  }

  function openSudokuGame() {
    cleanupRuntime();
    state = null;
    applySavedDifficulty();
    renderSetupRecords();
    showSudokuSection('Setup');
    byId('sudokuPauseBtn').disabled = true;
    safeShowScreen('sudokuGame');
    safeSound('open');
  }

  function cleanupRuntime() {
    clearInterval(timerId);
    timerId = null;
    autoPaused = false;
    clearFxTimers();
  }

  function leaveSudokuGame() {
    cleanupRuntime();
    state = null;
    safeSound('click');
    safeShowScreen('home');
    try { global.refreshProfileSummary?.(); } catch (_) { /* optional */ }
  }

  function moveSelection(key) {
    if (!state || state.selected < 0) return;
    const row = rowOf(state.selected);
    const column = columnOf(state.selected);
    const target = key === 'ArrowUp' ? Math.max(0, row - 1) * 9 + column
      : key === 'ArrowDown' ? Math.min(8, row + 1) * 9 + column
        : key === 'ArrowLeft' ? row * 9 + Math.max(0, column - 1)
          : row * 9 + Math.min(8, column + 1);
    selectCell(target);
    cellAt(target)?.focus({ preventScroll: true });
  }

  function handleKeyboard(event) {
    if (!byId('sudokuGame')?.classList.contains('active') || !state) return;
    const tag = document.activeElement?.tagName;
    if (event.isComposing || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (state.status === 'paused') {
      if (event.key === 'Escape' || event.key === ' ') {
        event.preventDefault();
        resumeSudoku();
      }
      return;
    }
    if (state.status !== 'running') return;
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      inputDigit(Number(event.key));
    } else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      event.preventDefault();
      eraseCell();
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      moveSelection(event.key);
    } else if (event.key.toLowerCase() === 'n') {
      event.preventDefault();
      toggleNotes();
    } else if (event.key.toLowerCase() === 'h') {
      event.preventDefault();
      useHint();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      pauseSudoku(false);
    }
  }

  function validateSeeds() {
    return LEVEL_ORDER.map((level) => {
      const seed = solvedSeed(SEED_FOR_LEVEL[level]);
      const clues = level === 'beginner' || level === 'easy'
        ? LEVELS[level].clues : seed.puzzle.filter(Boolean).length;
      return { level, solutions: solveGrid(seed.puzzle, 2).count, clues };
    });
  }

  document.addEventListener('keydown', handleKeyboard);
  document.addEventListener('visibilitychange', () => {
    if (!state || !byId('sudokuGame')?.classList.contains('active')) return;
    if (document.hidden && state.status === 'running') pauseSudoku(true);
    else if (!document.hidden && state.status === 'paused' && autoPaused) resumeSudoku();
  });

  global.openSudokuGame = openSudokuGame;
  global.startSudoku = startSudoku;
  global.sudokuInput = inputDigit;
  global.eraseSudokuCell = eraseCell;
  global.toggleSudokuNotes = toggleNotes;
  global.useSudokuHint = useHint;
  global.checkSudoku = checkSudoku;
  global.toggleSudokuPause = togglePause;
  global.restartSudoku = restartSudoku;
  global.newSudoku = newSudoku;
  global.chooseSudokuLevel = chooseLevel;
  global.leaveSudokuGame = leaveSudokuGame;
  global.cleanupSudokuGame = cleanupRuntime;
  global.SudokuGame = Object.freeze({ LEVELS, LEVEL_ORDER: LEVEL_ORDER.slice(), solveGrid, createPuzzle, validateSeeds, formatTime });
})(window);
