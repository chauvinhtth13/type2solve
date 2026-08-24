/* Nim theo luật Misère: 2 người cùng máy đặt tên + tuỳ chỉnh nhân vật (tái dùng
   BOSS_ART/applySkin của core.js), thay phiên bốc sỏi từ các đống — NGƯỢC với Nim
   thường, ai bốc viên sỏi CUỐI CÙNG sẽ THUA. Màn riêng, tự trị, không có vòng lặp
   nền/rAF nên không cần theo dõi timer như duel.js. */
(function createNimGame(global) {
  'use strict';

  const PRESETS = {
    small: { piles: 3, max: 5 },
    medium: { piles: 4, max: 7 },
    large: { piles: 5, max: 9 },
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

  function setSections(visible) {
    ['Setup', 'Play', 'Result'].forEach((name) => {
      const el = byId(`nim${name}`);
      if (el) el.hidden = name.toLowerCase() !== visible;
    });
  }

  const skinIndex = [0, 0];
  const sessionWins = [0, 0];

  /* BOSS_ART là `const` ở core.js — không gắn vào window, phải đọc qua biến toàn
     cục thuần `BOSS_ART` (xem chú thích tương tự trong duel.js). */
  function skinAt(index) {
    const arts = typeof BOSS_ART !== 'undefined' ? BOSS_ART : [];
    return arts[skinIndex[index] % arts.length] || null;
  }

  function paintPreview(playerNumber) {
    const svg = byId(`nimSkinPreview${playerNumber}`);
    const art = skinAt(playerNumber - 1);
    if (svg && art && typeof global.applySkin === 'function') global.applySkin(svg, art);
  }

  function cycleNimSkin(playerNumber, dir) {
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

  function randomPiles(preset) {
    const cfg = PRESETS[preset] || PRESETS.medium;
    return Array.from({ length: cfg.piles }, () => 1 + Math.floor(Math.random() * cfg.max));
  }

  function totalStones() {
    return state.piles.reduce((sum, count) => sum + count, 0);
  }

  function renderStatus() {
    const turnTxt = byId('nimTurnTxt');
    if (turnTxt) turnTxt.textContent = `🪨 Đến lượt ${playerName(state.turn)}`;
  }

  function renderBoard() {
    const board = byId('nimBoard');
    board.innerHTML = '';
    const total = totalStones();
    state.piles.forEach((count, pileIndex) => {
      const row = document.createElement('div');
      row.className = 'nim-pile';
      const label = document.createElement('span');
      label.className = 'nim-pile-label';
      label.textContent = `Đống ${pileIndex + 1}`;
      row.appendChild(label);
      const stones = document.createElement('div');
      stones.className = 'nim-stones';
      for (let i = 0; i < count; i += 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nim-stone';
        btn.textContent = '🪨';
        const willTake = count - i;
        btn.setAttribute('aria-label', `Lấy ${willTake} viên ở đống ${pileIndex + 1}`);
        if (total === 1 && count === 1) btn.classList.add('last-stone');
        btn.onclick = () => takeFrom(pileIndex, i);
        stones.appendChild(btn);
      }
      row.appendChild(stones);
      board.appendChild(row);
    });
  }

  function takeFrom(pileIndex, stoneIndex) {
    if (!state) return;
    const count = state.piles[pileIndex];
    const taken = count - stoneIndex;
    state.piles[pileIndex] = stoneIndex;
    const actor = state.turn;
    const total = totalStones();
    byId('nimFeedback').textContent = `${playerName(actor)} lấy ${taken} viên ở đống ${pileIndex + 1}.`;
    safeSound('hit');
    if (total === 0) { endNim(1 - actor); return; }
    if (total === 1) safeSound('tick');
    state.turn = 1 - actor;
    renderStatus();
    renderBoard();
  }

  function endNim(winner) {
    sessionWins[winner] += 1;
    setSections('result');
    byId('nimResultTitle').textContent = `🏆 ${playerName(winner)} THẮNG!`;
    byId('nimResultText').textContent = `Misère: ai bốc viên cuối cùng sẽ thua · Tỉ số trong phiên: ${playerName(0)} ${sessionWins[0]} — ${sessionWins[1]} ${playerName(1)}`;
    safeSound('win');
  }

  function startNim() {
    const preset = byId('nimPreset').value || 'medium';
    state = {
      names: [byId('nimName1').value.trim(), byId('nimName2').value.trim()],
      preset,
      piles: randomPiles(preset),
      turn: 0,
    };
    setSections('play');
    safeSound('open');
    renderStatus();
    renderBoard();
  }

  function rematchNim() { startNim(); }

  function openNimGame() {
    setSections('setup');
    paintPreview(1);
    paintPreview(2);
  }

  function cleanupNimGame() {
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
})(window);
