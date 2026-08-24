/* Nim theo luật Misère: 2 người cùng máy đặt tên + tuỳ chỉnh nhân vật (tái dùng
   BOSS_ART/applySkin của core.js), thay phiên bốc sỏi từ các đống — NGƯỢC với Nim
   thường, ai bốc viên sỏi CUỐI CÙNG sẽ THUA. Màn riêng, tự trị, không có vòng lặp
   nền/rAF nên không cần theo dõi timer như duel.js. */
(function createNimGame(global) {
  'use strict';

  /* Bàn cờ chuẩn của Nim là 4 hàng 1-3-5-7. Bỏ hàng 1 viên (trơ trọi, và ở luật
     Misère nó gần như quyết định luôn ván đấu) còn lại 3-5-7 — đúng bộ kinh điển
     hay dùng nhất. Hai mức lớn hơn chỉ nối dài dãy lẻ: +9, +11.
     Không random số viên nữa: dãy lẻ tăng dần cho silhouette KIM TỰ THÁP cân đối
     (renderBoard vẽ từ đống nhỏ tới đống lớn, canh giữa), và giữ số hàng ≤5 để
     sỏi còn đủ chỗ TO ở màn 768px — 7 hàng thì mỗi viên teo còn 30px. */
  const PRESETS = {
    small: { piles: 3 },   // 3-5-7   — bàn kinh điển
    medium: { piles: 4 },  // 3-5-7-9
    large: { piles: 5 },   // 3-5-7-9-11
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
    return Array.from({ length: cfg.piles }, (_, i) => 3 + i * 2);
  }

  function totalStones() {
    return state.piles.reduce((sum, count) => sum + count, 0);
  }

  function renderStatus() {
    const turnTxt = byId('nimTurnTxt');
    if (turnTxt) turnTxt.textContent = `🪨 Đến lượt ${playerName(state.turn)}`;
  }

  /* Kim tự tháp là hình dáng LÚC BÀY BÀN, không phải luật sắp xếp chạy suốt ván.
     Các hàng giữ NGUYÊN thứ tự và NGUYÊN vị trí từ đầu tới cuối: bốc vơi một
     hàng thì đúng hàng đó ngắn lại tại chỗ, không nhảy lên/xuống, không biến mất.
     Sắp lại theo kích cỡ sau mỗi nước đi (bản trước) làm cả bàn cờ nhảy loạn —
     người chơi mất dấu hàng mình vừa đụng vào, rất khó tính nước tiếp theo.
     Hàng đã hết vẫn giữ chỗ (mờ đi, ghi "hết") để bố cục đứng yên tuyệt đối.
     --nim-max/--nim-rows lấy theo bàn cờ BAN ĐẦU nên cỡ sỏi cũng không đổi giữa
     chừng — mọi thứ cố định, chỉ số sỏi thay đổi. */
  function renderBoard() {
    const board = byId('nimBoard');
    board.innerHTML = '';
    const total = totalStones();
    board.style.setProperty('--nim-max', String(state.maxPile));
    board.style.setProperty('--nim-rows', String(state.piles.length));
    state.piles.forEach((count, pileIndex) => {
      const row = document.createElement('div');
      row.className = 'nim-pile' + (count === 0 ? ' empty' : '');
      const label = document.createElement('span');
      label.className = 'nim-pile-label';
      label.textContent = count === 0 ? '✔ hết' : `${count} viên`;
      row.appendChild(label);
      const stones = document.createElement('div');
      stones.className = 'nim-stones';
      for (let i = 0; i < count; i += 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nim-stone';
        btn.textContent = '🪨';
        const willTake = count - i;
        btn.setAttribute('aria-label', `Lấy ${willTake} viên ở hàng ${pileIndex + 1}`);
        if (total === 1) btn.classList.add('last-stone');
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
    byId('nimFeedback').textContent = `${playerName(actor)} lấy ${taken} viên ở hàng ${pileIndex + 1} (còn ${stoneIndex} viên).`;
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
    const piles = randomPiles(preset);
    state = {
      names: [byId('nimName1').value.trim(), byId('nimName2').value.trim()],
      preset,
      piles,
      maxPile: Math.max(...piles),   // chốt lúc bày bàn → cỡ sỏi không đổi giữa ván
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
    safeShowScreen('nimGame');
    safeSound('open');
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
