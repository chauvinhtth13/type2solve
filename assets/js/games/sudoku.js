/* Sudoku 9x9: six difficulty levels, notes, hints and persistent records. */
(function createSudokuGame(global) {
  'use strict';

  const FULL_MASK = 0x3fe;
  const LEVEL_ORDER = ['beginner', 'easy', 'medium', 'hard', 'expert', 'ultimate'];
  const LEVELS = Object.freeze({
    beginner: { name: 'Làm quen', icon: '🌱', clues: 50, hints: 5, stars: 1, description: 'Nhiều ô mở sẵn, phù hợp ván đầu tiên' },
    easy: { name: 'Dễ', icon: '🙂', clues: 42, hints: 4, stars: 2, description: 'Rèn hàng, cột và khối 3×3' },
    medium: { name: 'Vừa', icon: '🧠', clues: 36, hints: 3, stars: 3, description: 'Cần kết hợp nhiều bước suy luận' },
    hard: { name: 'Khó', icon: '🔥', clues: 28, hints: 2, stars: 4, description: 'Ít dữ kiện, dành cho người đã quen' },
    expert: { name: 'Chuyên gia', icon: '💎', clues: 23, hints: 1, stars: 5, description: 'Một câu đố nổi tiếng có chuỗi suy luận sâu' },
    ultimate: { name: 'Tối thượng', icon: '👑', clues: 17, hints: 0, stars: 7, description: 'Chỉ 17 ô gợi ý · không có trợ giúp' },
  });

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

  function byId(id) {
    return document.getElementById(id);
  }

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

  function shuffled(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
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

  function setSections(visible) {
    ['Setup', 'Play', 'Result'].forEach((name) => {
      const element = byId(`sudoku${name}`);
      if (element) element.hidden = name.toLowerCase() !== visible;
    });
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
    const cell = byId('sudokuBoard')?.children[index];
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

  function renderBoard() {
    const board = byId('sudokuBoard');
    if (!board || !state) return;
    board.textContent = '';
    for (let index = 0; index < 81; index += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.setAttribute('role', 'gridcell');
      cell.dataset.index = index;
      cell.addEventListener('click', () => selectCell(index));
      board.appendChild(cell);
      renderCell(index);
    }
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
    if (byId('sudokuChecks')) byId('sudokuChecks').textContent = state.checks;
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

  function selectCell(index) {
    if (!state || !Number.isInteger(index) || index < 0 || index > 80) return;
    state.selected = index;
    renderAllCells();
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
      setFeedback('Đã điền số. Tiếp tục suy luận nhé!', 'success');
      safeSound('click');
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
    setSections('result');
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
    state.checks += 1;
    updateHud();
    renderAllCells();
    if (wrong.length) {
      setFeedback(`${wrong.length} ô chưa đúng đã được đánh dấu. Hãy xem lại hàng, cột và khối 3×3.`, 'error');
      safeSound('wrong');
    } else {
      setFeedback(`Chưa có ô sai. Còn ${blanks.length} ô cần hoàn thành.`, 'success');
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
      hintsUsed: 0,
      checks: 0,
      elapsedMs: 0,
      startedAt: performance.now(),
    };
    try { global.GameStorage?.updateSettings?.({ sudokuDifficulty: level }); } catch (_) { /* optional */ }
    setSections('play');
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
        byId('sudokuBoard')?.children[initialSelection]?.focus({ preventScroll: true });
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
    setSections('play');
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
    setSections('setup');
    byId('sudokuPauseBtn').disabled = true;
    safeShowScreen('sudokuGame');
  }

  function openSudokuGame() {
    cleanupRuntime();
    state = null;
    applySavedDifficulty();
    renderSetupRecords();
    setSections('setup');
    byId('sudokuPauseBtn').disabled = true;
    safeShowScreen('sudokuGame');
    safeSound('open');
  }

  function cleanupRuntime() {
    clearInterval(timerId);
    timerId = null;
    autoPaused = false;
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
    byId('sudokuBoard')?.children[target]?.focus({ preventScroll: true });
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
