/* =========================================================
   GÕ CHỮ DIỆT QUÁI
   - 3 đợt hữu hạn, đợt cuối có boss nhiều lớp giáp
   - Vòng lặp chuyển động dùng requestAnimationFrame/performance.now
   - An toàn với bộ gõ IME (không chấm khi đang composition)
========================================================= */
(function typingBattle(global) {
  'use strict';

  const runtime = global.GameRuntime;
  if (!runtime) throw new Error('Gõ Chữ cần GameRuntime được nạp trước.');
  const storage = global.GameStorage;
  if (!storage) throw new Error('Gõ Chữ cần GameStorage được nạp trước.');

  /* levelShift dịch trần độ khó của từ theo đợt; boss trỏ sang bộ boss dùng lại. */
  const DIFFICULTIES = {
    superslow: {
      label: 'Siêu chậm', counts: [3, 4, 2], maxActive: 1,
      gap: [3400, 3100, 2900], speed: 1.65, bossSpeed: 0.95, score: 0.7,
      levelShift: -2, boss: 'easy'
    },
    easy: {
      label: 'Dễ', counts: [4, 5, 2], maxActive: 2,
      gap: [2500, 2250, 2050], speed: 3.25, bossSpeed: 1.65, score: 1,
      levelShift: -1
    },
    normal: {
      label: 'Vừa', counts: [5, 6, 3], maxActive: 3,
      gap: [2100, 1850, 1650], speed: 4.35, bossSpeed: 2.15, score: 1.25,
      levelShift: 0
    },
    hard: {
      label: 'Khó', counts: [6, 7, 4], maxActive: 4,
      gap: [1750, 1500, 1300], speed: 5.55, bossSpeed: 2.75, score: 1.6,
      levelShift: 1
    },
    superfast: {
      label: 'Siêu nhanh', counts: [7, 8, 5], maxActive: 5,
      gap: [1200, 1000, 850], speed: 7.4, bossSpeed: 3.6, score: 2.2,
      levelShift: 1, boss: 'hard'
    }
  };
  const WAVE_LEVEL = [1, 2, 3];
  const CAMPAIGN_STAGES = 10;
  // Khoảng cách giữa hai làn phải lớn hơn chiều cao một hộp chữ (~150px), nếu không
  // chúng chồng dọc lên nhau. Khung càng thấp/hẹp thì càng phải bớt làn.
  const LANE_TOP = [20, 50, 80];
  const LANE_TOP_NARROW = [30, 70];
  const LANE_TOP_SINGLE = [50];
  const GATE_X = 12;
  const START_X = 88;
  /* Một số quái mang vật phẩm: gõ trúng chúng là kích hoạt hiệu ứng. */
  const BONUSES = [
    { id: 'star', icon: '⭐', text: '⭐ Ngôi sao vàng — điểm nhân đôi trong 8 giây!' },
    { id: 'freeze', icon: '❄️', text: '❄️ Băng giá — quái đứng hình gần 3 giây!' },
    { id: 'heart', icon: '❤️', text: '❤️ Trái tim — hồi lại 1 tim cho cổng!' }
  ];
  const BONUS_RATE = 0.18;
  const FREEZE_MS = 2600;
  const DOUBLE_MS = 8000;
  const LEVEL_DRAW_WEIGHTS = [
    [1, 0, 0],
    [0.65, 0.35, 0],
    [0.45, 0.35, 0.20]
  ];
  const ENGLISH_POS_TOPICS = {
    n: 'Danh từ', v: 'Động từ', a: 'Tính từ', r: 'Trạng từ', p: 'Giới từ',
    c: 'Liên từ', i: 'Thán từ', t: 'Mạo từ', o: 'Đại từ', d: 'Từ hạn định', m: 'Số từ'
  };

  let state = null;
  let sessionId = 0;
  let composing = false;
  let selectedStage = 0;
  let dictionaryPromise = null;
  let launchId = 0;
  const pendingTimers = runtime.createTimerRegistry();

  const { byId, safeShowScreen } = runtime;
  const now = () => (global.performance && performance.now ? performance.now() : Date.now());
  const playSound = runtime.safeSound;

  function later(callback, delay, token) {
    return pendingTimers.later(() => {
      if (token == null || token === sessionId) callback();
    }, delay);
  }

  function clearLocalTimers() {
    pendingTimers.clear();
  }

  function normalizeText(value) {
    return String(value == null ? '' : value).normalize('NFC').toLocaleLowerCase('vi');
  }

  function foldText(value, ignoreAccents) {
    let result = normalizeText(value);
    if (ignoreAccents) {
      result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    }
    return result;
  }

  function comparable(value) {
    return foldText(value, !!(state && state.lang === 'vi' && state.accentAssist));
  }

  function chars(value) {
    return Array.from(normalizeText(value));
  }

  function charMatches(a, b) {
    return foldText(a, !!(state && state.lang === 'vi' && state.accentAssist)) ===
      foldText(b, !!(state && state.lang === 'vi' && state.accentAssist));
  }

  const randomItem = runtime.pick;

  function perWaveRange(value) {
    const range = value && typeof value === 'object' ? value : { min: value, max: value };
    const rawMin = Number(range.min);
    const rawMax = Number(range.max);
    const min = Number.isFinite(rawMin) ? Math.max(1, Math.floor(rawMin)) : 1;
    const max = Number.isFinite(rawMax) ? Math.max(min, Math.floor(rawMax)) : min;
    return { min, max };
  }

  const randomInteger = runtime.randomInt;

  function campaignWaveCounts(stage) {
    const range = perWaveRange(stage.perWave);
    return Array.from({ length: stage.waves }, () => randomInteger(range.min, range.max));
  }

  const shuffle = runtime.shuffle;

  function setDictionaryStatus(message, tone) {
    const status = byId('typingDictionaryStatus');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone || '';
  }

  // Kho từ nặng ~4,6MB nên trước đây chỉ đổi màu một câu chữ trong lúc tải —
  // với người mạng chậm, màn hình đứng im không nói gì suốt vài giây. Thanh
  // này cho biết % thật (percent=null thì ẩn đi khi xong hoặc khi trình
  // duyệt không hỗ trợ đo tiến trình).
  function setDictionaryProgress(percent) {
    const wrap = byId('typingDictProgress');
    const fill = byId('typingDictProgressFill');
    if (!wrap || !fill) return;
    if (percent == null) { wrap.hidden = true; return; }
    wrap.hidden = false;
    fill.style.width = Math.max(0, Math.min(100, percent)) + '%';
  }

  // response.json() không cho biết đã tải được bao nhiêu byte. Đọc tay qua
  // getReader() để có % thật theo Content-Length; nếu trình duyệt/response
  // không hỗ trợ (thiếu body stream hoặc thiếu header) thì lùi về .json()
  // như cũ, không có thanh tiến trình nhưng vẫn tải được bình thường.
  async function fetchDictionaryPayload(url) {
    const response = await global.fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const total = Number(response.headers.get('Content-Length')) || 0;
    if (!response.body || !total) return response.json();
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      setDictionaryProgress(received / total * 100);
    }
    const buffer = new Uint8Array(received);
    let offset = 0;
    chunks.forEach(chunk => { buffer.set(chunk, offset); offset += chunk.length; });
    return JSON.parse(new TextDecoder('utf-8').decode(buffer));
  }

  function setLaunchLoading(loading) {
    document.querySelectorAll('#typingSetup .typing-launch button').forEach(button => {
      button.disabled = loading;
    });
    const campaignButton = byId('typingCampaignBtn');
    if (loading && campaignButton) campaignButton.textContent = '⏳ ĐANG NẠP KHO TỪ…';
    else if (!loading) updateCampaignButton();
  }

  async function loadEnglishDictionary() {
    const content = global.TYPING_CONTENT;
    const descriptor = content && content.englishDictionary;
    if (!content || !descriptor || content.dictionaryLoaded) return true;
    if (dictionaryPromise) return dictionaryPromise;
    setDictionaryStatus('⏳ Đang nạp kho từ điển Anh–Việt mở…', 'loading');
    setDictionaryProgress(0);
    dictionaryPromise = fetchDictionaryPayload(descriptor.url)
      .then(payload => {
        if (!payload || !Array.isArray(payload.levels) || payload.levels.length !== 3) {
          throw new Error('Dữ liệu từ điển không đúng định dạng');
        }
        const expected = Number(descriptor.minimumEntries) || 1;
        const rowCount = payload.levels.reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
        if (rowCount < expected) throw new Error(`Kho từ chỉ có ${rowCount}/${expected} mục`);
        const known = new Set(content.en.map(item => normalizeText(item.text)));
        payload.levels.forEach((rows, levelIndex) => {
          if (!Array.isArray(rows)) return;
          rows.forEach(row => {
            if (!Array.isArray(row)) return;
            const text = String(row[0] || '').normalize('NFC');
            const meaning = String(row[1] || '').normalize('NFC').trim();
            const key = normalizeText(text);
            if (!text || !meaning || known.has(key)) return;
            known.add(key);
            content.en.push({
              text,
              meaning,
              level: levelIndex + 1,
              topic: ENGLISH_POS_TOPICS[row[2]] || 'Từ vựng'
            });
          });
        });
        content.dictionaryLoaded = true;
        content.dictionaryCount = content.en.length;
        content.dictionarySource = payload.source || null;
        setDictionaryStatus(`✅ Sẵn sàng ${content.dictionaryCount.toLocaleString('vi-VN')} từ Anh–Việt`, 'ready');
        setDictionaryProgress(null);
        return true;
      })
      .catch(() => {
        dictionaryPromise = null;
        setDictionaryStatus(`⚠️ Đang dùng ${content.en.length} từ cơ bản vì chưa tải được kho mở rộng.`, 'warning');
        setDictionaryProgress(null);
        return false;
      });
    return dictionaryPromise;
  }

  function removeFromArray(list, item) {
    const index = list.indexOf(item);
    if (index >= 0) list.splice(index, 1);
  }

  function loadProfileSettings() {
    return storage.load().settings || {};
  }

  function saveProfileSettings(settings) {
    storage.updateSettings(settings);
  }

  function readBestRecord() {
    const record = storage.load().records.typing || {};
    const cleared = Number(record.campaignCleared);
    return {
      bestScore: Number(record.bestScore) || 0,
      bestWpm: Number(record.bestWpm) || 0,
      bestCombo: Number(record.bestCombo) || 0,
      campaignCleared: Number.isFinite(cleared) ? Math.max(-1, Math.min(CAMPAIGN_STAGES - 1, Math.floor(cleared))) : -1
    };
  }

  /* Chặng cao nhất đã hạ boss; -1 nghĩa là chưa qua chặng nào. */
  function clearedStage() {
    return readBestRecord().campaignCleared;
  }

  function nextStage() {
    return Math.min(CAMPAIGN_STAGES - 1, clearedStage() + 1);
  }

  function setCampaignStatus(message, tone) {
    const status = byId('typingCampaignStatus');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone || '';
  }

  function resetTypingCampaign() {
    const confirmed = global.confirm(
      'Reset toàn bộ tiến độ 10 chặng Gõ Chữ?\n\n'
      + 'Các chặng sẽ bị khóa lại từ đầu. Kỷ lục điểm, WPM, combo và tổng sao vẫn được giữ.'
    );
    if (!confirmed) return false;

    // Chỉ cập nhật tiến độ chiến dịch để không ghi đè kỷ lục hoặc dữ liệu mới về sau.
    storage.updateRecords({ typing: { campaignCleared: -1 } });

    selectedStage = 0;
    drawCampaignMap();
    setCampaignStatus('✅ Đã reset tiến độ. Chiến dịch bắt đầu lại từ Chặng 1; kỷ lục và sao vẫn được giữ.', 'success');
    playSound('click');
    try {
      if (typeof refreshProfileSummary === 'function') refreshProfileSummary();
    } catch (_) { /* giao diện hồ sơ là phần phụ */ }
    return true;
  }

  function saveResultRecord(result) {
    const old = readBestRecord();
    const best = {
      bestScore: Math.max(old.bestScore, result.score),
      bestWpm: Math.max(old.bestWpm, result.wpm),
      bestCombo: Math.max(old.bestCombo, result.combo),
      campaignCleared: Math.max(old.campaignCleared, Number.isInteger(result.clearedStage) ? result.clearedStage : -1)
    };
    storage.updateRecords({ typing: best });
    if (result.stars > 0) storage.addStars(result.stars);
    try {
      if (typeof refreshProfileSummary === 'function') refreshProfileSummary();
    } catch (_) { /* giao diện hồ sơ là phần phụ */ }
    return { old, best };
  }

  function syncAccentOption() {
    const selected = document.querySelector('input[name="typingLanguage"]:checked');
    const assist = byId('typingAccentAssist');
    if (!assist) return;
    const isVietnamese = selected && selected.value === 'vi';
    assist.disabled = !isVietnamese;
    const row = assist.closest('label');
    if (row) row.classList.toggle('disabled', !isVietnamese);
  }

  function applySavedSetup() {
    const settings = loadProfileSettings();
    const language = settings.typingLanguage === 'vi' ? 'vi' : 'en';
    const radio = document.querySelector(`input[name="typingLanguage"][value="${language}"]`);
    if (radio) radio.checked = true;
    const difficulty = byId('typingDifficulty');
    if (difficulty && DIFFICULTIES[settings.typingDifficulty]) difficulty.value = settings.typingDifficulty;
    const assist = byId('typingAccentAssist');
    if (assist) assist.checked = !!settings.accentAssist;
    syncAccentOption();
  }

  function stopRuntime() {
    sessionId += 1;
    if (state && state.raf) global.cancelAnimationFrame(state.raf);
    global.removeEventListener('resize', onFieldResize);
    global.removeEventListener('orientationchange', onFieldResize);
    global.clearTimeout(resizeTimer);
    clearLocalTimers();
    const monsters = byId('typingMonsters');
    if (monsters) monsters.textContent = '';
    const input = byId('typingInput');
    if (input) {
      input.value = '';
      input.disabled = true;
      input.classList.remove('wrong');
    }
    const field = byId('typingField');
    if (field) {
      field.classList.remove('typing-field-flash', 'danger', 'alert', 'frozen');
      const gate = field.querySelector('.typing-gate');
      if (gate) gate.classList.remove('combo-hot', 'combo-blaze');
    }
    composing = false;
    state = null;
  }

  function setSectionVisibility(section, hidden) {
    const element = byId(section);
    if (element) element.hidden = hidden;
  }

  /* Bản đồ chặng dùng lại đúng class .mapnode của hành trình 10 boss phần toán. */
  function drawCampaignMap() {
    const map = byId('typingMap');
    if (!map) return;
    const cleared = clearedStage();
    map.textContent = '';
    campaignStages().forEach((stage, index) => {
      const locked = index > cleared + 1;
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'mapnode' + (locked ? ' locked' : '') + (index <= cleared ? ' done' : '')
        + (index === selectedStage ? ' picked' : '');
      node.disabled = locked;
      /* Câu tả nhân vật đi vào title + aria-label chứ KHÔNG thêm dòng chữ lên thẻ:
         thêm một dòng nữa là 5 thẻ chặng tràn khỏi khung 1366×768 mà browser-smoke
         đang bắt. Rê chuột hoặc dùng trình đọc màn hình vẫn nghe được đầy đủ. */
      const trangThai = locked ? ' (chưa mở khoá)' : index <= cleared ? ' (đã hạ)' : '';
      node.setAttribute('aria-label', `Chặng ${index + 1}: ${stage.name}${trangThai}`
        + (stage.desc ? '. ' + stage.desc : ''));
      if (stage.desc) node.title = `${stage.name} — ${stage.desc}`;
      node.setAttribute('aria-pressed', String(index === selectedStage));

      const emoji = document.createElement('span');
      emoji.className = 'em';
      // Đã hạ thì hiện dấu tick (trạng thái, không phải nhân vật); chưa hạ thì hiện
      // đúng con boss sẽ gặp — trước đây là emoji chẳng liên quan gì tới hình trong trận.
      const preview = index <= cleared ? null : buildBeast(stageSkin(index));
      if (preview) emoji.appendChild(preview);
      else emoji.textContent = index <= cleared ? '✅' : stage.emoji;
      const name = document.createElement('span');
      name.textContent = `${index + 1}. ${stage.name}`;
      const info = document.createElement('span');
      info.className = 'tierlbl';
      const range = perWaveRange(stage.perWave);
      info.textContent = range.min === range.max
        ? `${stage.waves} đợt · ${stage.waves * range.min} từ`
        : `${stage.waves} đợt · ${range.min}–${range.max} từ/đợt`;

      node.append(emoji, name, document.createElement('br'), info);
      node.addEventListener('click', () => selectTypingStage(index));
      map.appendChild(node);
    });
    updateCampaignButton();
  }

  function updateCampaignButton() {
    const button = byId('typingCampaignBtn');
    const stage = campaignStages()[selectedStage];
    if (!button || !stage) return;
    button.textContent = `⚔️ VÀO CHẶNG ${selectedStage + 1}: ${stage.name.toUpperCase()}`;
  }

  function selectTypingStage(index) {
    if (index > clearedStage() + 1 || !campaignStages()[index]) return;
    selectedStage = index;
    playSound('click');
    drawCampaignMap();
  }

  function startTypingCampaign() {
    return startTypingRun(selectedStage);
  }

  function openTypingGame() {
    launchId += 1;
    stopRuntime();
    applySavedSetup();
    selectedStage = nextStage();
    drawCampaignMap();
    setSectionVisibility('typingSetup', false);
    setSectionVisibility('typingPlay', true);
    setSectionVisibility('typingResult', true);
    const pause = byId('typingPauseBtn');
    if (pause) {
      pause.disabled = true;
      pause.textContent = '⏸️';
      pause.setAttribute('aria-label', 'Tạm dừng');
    }
    safeShowScreen('typingGame');
    void loadEnglishDictionary();
  }

  function leaveTypingGame() {
    launchId += 1;
    setLaunchLoading(false);
    stopRuntime();
    setSectionVisibility('typingSetup', false);
    setSectionVisibility('typingPlay', true);
    setSectionVisibility('typingResult', true);
    playSound('click');
    safeShowScreen('home');
    try {
      if (typeof refreshProfileSummary === 'function') refreshProfileSummary();
    } catch (_) { /* không ảnh hưởng điều hướng */ }
  }

  function getRunOptions() {
    const selected = document.querySelector('input[name="typingLanguage"]:checked');
    const difficultyInput = byId('typingDifficulty');
    const assist = byId('typingAccentAssist');
    const lang = selected && selected.value === 'vi' ? 'vi' : 'en';
    const difficulty = difficultyInput && DIFFICULTIES[difficultyInput.value]
      ? difficultyInput.value : 'normal';
    return {
      lang,
      difficulty,
      accentAssist: lang === 'vi' && !!(assist && assist.checked)
    };
  }

  /* Mức khó đã chọn trở thành hệ số nhịp độ cho cả chiến dịch: bé nhỏ vẫn đi hết
     10 chặng ở tốc độ Siêu chậm, bé lớn chạy cùng chặng đó ở Siêu nhanh. */
  function paceFactor(difficulty) {
    return DIFFICULTIES[difficulty].speed / DIFFICULTIES.normal.speed;
  }

  function campaignStages() {
    const list = global.TYPING_CONTENT && global.TYPING_CONTENT.campaign;
    return Array.isArray(list) ? list : [];
  }

  function campaignConfig(stageIndex, difficulty) {
    const stage = campaignStages()[stageIndex];
    const pace = DIFFICULTIES[difficulty];
    const factor = paceFactor(difficulty);
    return {
      campaign: true,
      label: stage.name,
      stageName: stage.name,
      stageEmoji: stage.emoji,
      stageLevel: stage.level,
      armor: stage.armor,
      // Random đúng một lần cho từng wave để quota ổn định suốt wave đó.
      counts: campaignWaveCounts(stage),
      gap: new Array(stage.waves).fill(Math.round(stage.gap / factor)),
      maxActive: pace.maxActive,
      speed: stage.speed * factor,
      bossSpeed: stage.speed * factor * 0.52,
      score: pace.score * (1 + stageIndex * 0.12),
      levelShift: pace.levelShift > 0 ? 1 : pace.levelShift < -1 ? -1 : 0
    };
  }

  async function startTypingRun(stageIndex) {
    const content = global.TYPING_CONTENT;
    if (!content || !Array.isArray(content.en) || !Array.isArray(content.vi)) {
      const setup = byId('typingSetup');
      if (setup) setup.setAttribute('data-error', 'Không tải được kho từ. Hãy tải lại trang.');
      return;
    }

    const options = getRunOptions();
    const currentLaunch = ++launchId;
    if (options.lang === 'en' && !content.dictionaryLoaded) {
      setLaunchLoading(true);
      await loadEnglishDictionary();
      if (currentLaunch !== launchId) return;
      setLaunchLoading(false);
    }
    saveProfileSettings({
      typingLanguage: options.lang,
      typingDifficulty: options.difficulty,
      accentAssist: options.accentAssist
    });

    const stage = Number.isInteger(stageIndex) && campaignStages()[stageIndex] ? stageIndex : null;
    const config = stage === null ? DIFFICULTIES[options.difficulty] : campaignConfig(stage, options.difficulty);

    stopRuntime();
    const token = sessionId;
    const frameNow = now();
    state = {
      token,
      status: 'running',
      paused: false,
      lang: options.lang,
      difficulty: options.difficulty,
      accentAssist: options.accentAssist,
      config,
      stageIndex: stage,
      lives: 3,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctWords: 0,
      missed: 0,
      totalChars: 0,
      correctChars: 0,
      waveIndex: 0,
      spawned: 0,
      nextSpawnAt: 0,
      phase: 'wave',
      phaseUntil: 0,
      bossSpawned: false,
      bossDefeated: false,
      lanes: LANE_TOP,
      maxActive: config.maxActive,
      freezeUntil: 0,
      doubleUntil: 0,
      monsters: [],
      wordPools: buildWordPools(content[options.lang]),
      wordBags: [[], [], []],
      seenWords: new Set(),
      nextMonsterId: 1,
      targetId: null,
      lastBuffer: '',
      wasWrong: false,
      elapsedMs: 0,
      lastFrame: frameNow,
      lastHudAt: 0,
      raf: 0
    };

    const monsters = byId('typingMonsters');
    if (monsters) monsters.textContent = '';
    const input = byId('typingInput');
    if (input) {
      input.value = '';
      input.disabled = false;
      input.placeholder = options.lang === 'vi'
        ? 'Gõ đúng cả dấu và khoảng trắng…'
        : 'Type the word to cast a spell…';
    }
    setSectionVisibility('typingSetup', true);
    setSectionVisibility('typingResult', true);
    setSectionVisibility('typingPlay', false);
    // Đo sau khi sân đấu đã hiện, nếu không clientWidth bằng 0.
    // Mỗi làn chỉ giữ một con: nhiều hơn số làn là chữ chắc chắn đè lên nhau.
    state.lanes = laneLayout();
    state.maxActive = Math.min(state.config.maxActive, state.lanes.length);
    global.addEventListener('resize', onFieldResize);
    global.addEventListener('orientationchange', onFieldResize);
    const pause = byId('typingPauseBtn');
    if (pause) {
      pause.disabled = false;
      pause.textContent = '⏸️';
      pause.setAttribute('aria-label', 'Tạm dừng');
    }
    setTip(options.lang === 'vi'
      ? (options.accentAssist
        ? 'Chế độ hỗ trợ đang bật: có thể gõ không dấu, nhưng gõ đủ dấu sẽ giúp em tiến bộ nhanh hơn!'
        : 'Gõ chữ đầu để khóa quái. Hãy gõ đúng cả dấu và khoảng trắng.')
      : 'Type the first letter to lock a monster. Finish the word to cast automatically.');
    updateHud(true);
    beginWave(0);
    safeFocusInput();
    state.lastFrame = now();
    state.raf = global.requestAnimationFrame(frameLoop);
  }

  function beginWave(index) {
    if (!state || state.status !== 'running') return;
    state.waveIndex = index;
    state.spawned = 0;
    state.bossSpawned = false;
    state.phase = 'wave';
    state.nextSpawnAt = state.elapsedMs + 1050;
    const last = index >= totalWaves() - 1;
    showBanner(last ? `🌋 ĐỢT ${index + 1} · CỔNG BOSS!` : `🌊 ĐỢT ${index + 1}/${totalWaves()}`, last ? 'danger' : '');
    playSound(last ? 'bossRoar' : 'open');
    updateHud(true);
  }

  function totalWaves() {
    return state.config.counts.length;
  }

  /* Đợt sau nhanh hơn đợt trước, nhưng chặn lại để đợt thứ 7 không thành bất khả thi. */
  function waveSpeedFactor() {
    return Math.min(1.45, 0.84 + state.waveIndex * 0.15);
  }

  /* Trần độ khó của từ bò dần từ 1 lên mức trần của chặng/chế độ. */
  function waveMaxLevel() {
    const shift = state.config.levelShift || 0;
    if (state.config.stageLevel) {
      const ramp = 1 + Math.floor(state.waveIndex * state.config.stageLevel / Math.max(1, totalWaves()));
      return Math.min(3, Math.max(1, Math.min(state.config.stageLevel, ramp) + shift));
    }
    return Math.min(3, Math.max(1, WAVE_LEVEL[Math.min(state.waveIndex, WAVE_LEVEL.length - 1)] + shift));
  }

  function buildWordPools(items) {
    const pools = [[], [], []];
    (items || []).forEach(item => {
      const level = Math.min(3, Math.max(1, Math.floor(Number(item.level) || 1)));
      if (item && item.text && item.meaning) pools[level - 1].push(item);
    });
    return pools;
  }

  function refillWordBag(levelIndex) {
    const active = new Set(state.monsters
      .filter(monster => !monster.dying)
      .map(monster => normalizeText(monster.item.text)));
    let bag = state.wordPools[levelIndex]
      .filter(item => !active.has(normalizeText(item.text)));
    if (!bag.length) bag = state.wordPools[levelIndex].slice();
    state.wordBags[levelIndex] = shuffle(bag);
    return state.wordBags[levelIndex];
  }

  function chooseWordLevel(maxLevel, preferEasy) {
    const available = [];
    for (let levelIndex = 0; levelIndex < maxLevel; levelIndex += 1) {
      if (state.wordPools[levelIndex].length) available.push(levelIndex);
    }
    if (!available.length) return -1;
    if (preferEasy) return available[0];
    const weights = LEVEL_DRAW_WEIGHTS[maxLevel - 1];
    const total = available.reduce((sum, levelIndex) => sum + weights[levelIndex], 0);
    let roll = Math.random() * total;
    for (const levelIndex of available) {
      roll -= weights[levelIndex];
      if (roll <= 0) return levelIndex;
    }
    return available[available.length - 1];
  }

  function pickWordForCurrentWave() {
    const maxLevel = waveMaxLevel();
    const levelIndex = chooseWordLevel(maxLevel, state.spawned < 2);
    const bag = levelIndex >= 0 && state.wordBags[levelIndex].length
      ? state.wordBags[levelIndex] : levelIndex >= 0 ? refillWordBag(levelIndex) : [];
    const fallback = global.TYPING_CONTENT[state.lang] || [];
    const item = bag.length ? bag.pop() : randomItem(fallback);
    if (!item) return { text: 'word', meaning: 'từ vựng', level: 1, topic: 'Từ vựng' };
    state.seenWords.add(normalizeText(item.text));
    return item;
  }

  function speedForItem(item, boss) {
    const length = chars(item.text).length;
    if (boss) {
      const lengthHelp = Math.max(state.lang === 'vi' ? 0.62 : 0.76, 1 - Math.max(0, length - 6) * 0.012);
      return state.config.bossSpeed * lengthHelp;
    }
    const floor = state.lang === 'vi' ? 0.52 : 0.72;
    const lengthHelp = Math.max(floor, 1 - Math.max(0, length - 5) * (state.lang === 'vi' ? 0.018 : 0.02));
    return state.config.speed * waveSpeedFactor() * lengthHelp;
  }

  function laneLayout() {
    const field = byId('typingField');
    const width = field ? field.clientWidth : 0;
    const height = field ? field.clientHeight : 0;
    // Nhớ kích thước sân ngay tại lần đo này; castSpell dùng lại để quy % ra px
    // mà không phải chạm DOM lần nữa.
    if (state) { state.fieldW = width; state.fieldH = height; }
    if (width >= 520 && height >= 500) return LANE_TOP;   // 3 làn cách nhau 30% chiều cao
    if (height >= 380) return LANE_TOP_NARROW;            // 2 làn cách nhau 40%
    return LANE_TOP_SINGLE;
  }

  let resizeTimer = 0;
  function onFieldResize() {
    global.clearTimeout(resizeTimer);
    resizeTimer = global.setTimeout(remeasureField, 150);   // gom cả loạt sự kiện kéo cửa sổ
  }

  /* Bảo đảm state.fieldW/fieldH có số thật trước khi ai đó quy % ra px. */
  function ensureFieldMetrics() {
    if (state && (!state.fieldW || !state.fieldH)) state.lanes = laneLayout();
  }

  /* Sân đổi kích thước (xoay máy, đổi cỡ cửa sổ) thì mọi số đo đã nhớ đều sai:
     --monster-x tính bằng px, state.fieldH dùng cho đường bay của chưởng, và
     cả số làn cũng có thể đổi. Đo lại một lượt rồi xếp lại toàn bộ quái. */
  function remeasureField() {
    if (!state || state.status !== 'running') return;
    const field = byId('typingField');
    if (!field || !field.clientWidth) return;
    state.lanes = laneLayout();
    state.maxActive = Math.min(state.config.maxActive, state.lanes.length);
    state.monsters.forEach(monster => {
      // Bớt làn thì dồn quái về làn cuối; keepLaneGap() sẽ giãn chúng ra ở khung kế.
      monster.lane = Math.min(monster.lane, state.lanes.length - 1);
      if (monster.element) monster.element.style.top = `${laneTop(monster.lane)}%`;
      fitMonster(monster);
    });
  }

  /* 8 LOÀI quái thường, đúng theo 8 emoji cũ 👾 👻 🦠 🤖 🧟 🦇 🐙 👹 — mỗi loài một
     bảng màu VÀ một bộ phận riêng, nên nhìn bóng dáng là biết loài gì.
     Trước đây `emoji` và `skin` bốc ngẫu nhiên ĐỘC LẬP nhau: một con dán nhãn 👻 mà
     hình lại là khối tím có sừng. Nay chỉ còn MỘT con số quyết định cả hai. */
  const BEAST_SKINS = [
    { body:'#8d6bff', belly:'#e6dcff', horn:'#c3b0ff', horns:0, parts:['antennae'] },              // 👾
    { body:'#bcd4e6', belly:'#f2f9ff', horn:'#dceaf5', horns:0, parts:['ghost'] },                 // 👻
    { body:'#7ed07a', belly:'#e2f7dd', horn:'#b4e8ae', horns:1, parts:[] },                        // 🦠
    { body:'#6f7fd6', belly:'#dfe4ff', horn:'#aab6ff', horns:0, parts:['antennae','plates'] },     // 🤖
    { body:'#8fae72', belly:'#e8f2d8', horn:'#c2d89a', horns:0, parts:['stitches','fangs'] },      // 🧟
    { body:'#5b4fa8', belly:'#e0dbf7', horn:'#9c8fe0', horns:0, parts:['wings','ears'] },          // 🦇
    { body:'#3fb8b0', belly:'#d3f6f3', horn:'#7fe0d8', horns:0, parts:['tentacles'] },             // 🐙
    { body:'#e0503f', belly:'#ffdcd2', horn:'#ffb02e', horns:1, parts:['fangs'] },                 // 👹
  ];
  /* Boss của luyện tự do: tối màu, đội vương miện và khoác áo choàng — không thể
     nhầm với đám quái thường dù chỉ liếc một cái. */
  const BOSS_SKIN = { body:'#8a2f5f', belly:'#ffd6ea', horn:'#ff8dc0', horns:1,
                      parts:['crown','cape','fangs'] };

  /* Boss riêng của từng chặng — 10 bảng màu đậm dần. Icon trên bản đồ chặng và con
     boss thật sự gặp trong chặng ấy dùng CHUNG bảng này, nên xem bản đồ là biết
     trước mình sắp đánh con nào. */
  /* Mười chặng, mười cái tên rất cụ thể — Sâu, Ma, Dơi, Rắn, Bọ Cạp, Mực, Rồng Con,
     Quỷ, Rồng, Chúa Tể — nên phải là mười BÓNG DÁNG, không phải mười sắc độ.
     Thứ tự bộ phận cũng leo thang đúng theo độ khó: chặng 1 chỉ có râu, chặng 10
     đội vương miện + áo choàng + cánh + nanh. */
  const STAGE_SKINS = [
    { body:'#7ed07a', belly:'#e6f9e2', horn:'#b9ecb2', horns:0, parts:['antennae','coil'] },                 // Sâu Chữ Cái
    { body:'#bcc9de', belly:'#f2f7ff', horn:'#dbe5f2', horns:0, parts:['ghost'] },                           // Ma Gõ Nhầm
    { body:'#6f5fa8', belly:'#e6e0f7', horn:'#a99ae0', horns:0, parts:['wings','ears','fangs'] },            // Dơi Lạc Phím
    { body:'#3fa87c', belly:'#dcf5ea', horn:'#8fdcbb', horns:0, parts:['coil','fangs'] },                    // Rắn Chính Tả
    { body:'#c2703a', belly:'#ffe6d2', horn:'#ffb173', horns:0, parts:['stinger','claws'] },                 // Bọ Cạp Dấu Thanh
    { body:'#3f7fa8', belly:'#dceefb', horn:'#8fc9e8', horns:0, parts:['tentacles'] },                       // Mực Ngữ Pháp
    { body:'#a83f5a', belly:'#ffdce5', horn:'#ff9bb3', horns:1, parts:['wings','tail'] },                    // Rồng Con Từ Vựng
    { body:'#7a4fa8', belly:'#ecdcfb', horn:'#c39be8', horns:1, parts:['fangs','plates'] },                  // Quỷ Tốc Độ
    { body:'#a8813f', belly:'#fbf0dc', horn:'#e8c78f', horns:1, parts:['wings','tail','plates','fangs'] },   // Rồng Ngôn Ngữ
    { body:'#4a3f6b', belly:'#ddd6f0', horn:'#ff6a4d', horns:1, parts:['crown','cape','wings','fangs'] },    // Chúa Tể Bàn Phím
  ];
  function stageSkin(index) {
    return STAGE_SKINS[Math.max(0, index) % STAGE_SKINS.length];
  }

  /* Dựng hình quái. Khuôn và đường tô màu nằm ở engine/art.js để Đấu Toán và Gõ Chữ
     không có hai bản sao lệch nhau. */
  function buildBeast(skin) {
    return typeof global.buildBeastArt === 'function' ? global.buildBeastArt(skin) : null;
  }

  function laneTop(lane) {
    const lanes = (state && state.lanes) || LANE_TOP;
    return lanes[Math.min(lane, lanes.length - 1)];
  }

  /* Chọn làn còn trống nhất để hai bảng chữ không bao giờ đè lên nhau. */
  function emptiestLane() {
    let best = 0;
    let bestX = Infinity;
    for (let lane = 0; lane < state.lanes.length; lane += 1) {
      const rightmost = state.monsters.reduce(
        (max, monster) => (!monster.dying && monster.lane === lane ? Math.max(max, monster.x) : max),
        0
      );
      if (rightmost < bestX) {
        bestX = rightmost;
        best = lane;
      }
    }
    return best;
  }

  function rollBonus() {
    if (Math.random() >= BONUS_RATE) return null;
    const usable = BONUSES.filter(bonus => bonus.id !== 'heart' || state.lives < 3);
    return usable.length ? randomItem(usable) : null;
  }

  function spawnMonster() {
    const item = pickWordForCurrentWave();
    const emojis = global.TYPING_CONTENT.monsterEmojis || ['👾'];
    /* MỘT con số chọn loài: hình SVG và emoji dự phòng phải là cùng một con quái.
       Bốc riêng hai lần thì con dán nhãn 👻 lại mang hình bạch tuộc. */
    const kind = Math.floor(Math.random() * BEAST_SKINS.length);
    const monster = {
      id: state.nextMonsterId++,
      item,
      bonus: rollBonus(),
      emoji: emojis[kind % emojis.length],
      skin: kind,
      lane: emptiestLane(),
      x: START_X,
      speed: 0,
      boss: false,
      dying: false,
      element: null,
      wordElement: null,
      meaningElement: null,
      hpElement: null
    };
    monster.speed = speedForItem(item, false) * (0.92 + Math.random() * 0.16);
    buildMonsterElement(monster);
    state.monsters.push(monster);
    state.spawned += 1;
  }

  function freeBossData() {
    const bosses = global.TYPING_CONTENT.bosses;
    return bosses[state.lang][state.config.boss || state.difficulty];
  }

  /* Boss chiến dịch lấy giáp từ kho của chặng, ưu tiên từ đủ dài nhưng không
     sắp xếp toàn bộ từ điển lớn ở mỗi ván. */
  function campaignBossData() {
    const armor = Math.max(1, state.config.armor);
    const all = state.wordPools.slice(0, state.config.stageLevel).flat();
    const fresh = all.filter(item => {
      const length = chars(item.text).length;
      return length >= 6 && length <= 18 && !state.seenWords.has(normalizeText(item.text));
    });
    const bag = (fresh.length >= armor ? fresh : all).slice();
    const picked = [];
    while (picked.length < armor && bag.length) {
      picked.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
    }
    picked.sort((a, b) => chars(a.text).length - chars(b.text).length); // ngắn trước, dài sau
    picked.forEach(item => state.seenWords.add(normalizeText(item.text)));
    return { name: state.config.stageName, emoji: state.config.stageEmoji, stages: picked };
  }

  function spawnBoss() {
    const bossData = state.config.campaign ? campaignBossData() : freeBossData();
    const stages = bossData.stages.map(stage => Object.assign({ level: 3, topic: 'Boss' }, stage));
    const monster = {
      id: state.nextMonsterId++,
      item: stages[0],
      emoji: bossData.emoji,
      name: bossData.name,
      stages,
      stageIndex: 0,
      hp: stages.length,
      maxHp: stages.length,
      lane: Math.floor(state.lanes.length / 2),
      x: START_X,
      speed: 0,
      boss: true,
      dying: false,
      element: null,
      wordElement: null,
      meaningElement: null,
      hpElement: null
    };
    monster.speed = speedForItem(monster.item, true);
    buildMonsterElement(monster);
    state.monsters.push(monster);
    state.bossSpawned = true;
    state.phase = 'boss';
    showBanner(`🐉 ${bossData.name.toUpperCase()}`, 'danger');
    setTip(`BOSS có ${stages.length} lớp giáp từ vựng. Mỗi cụm đúng sẽ phá một lớp và đẩy hắn lùi lại!`);
    playSound('bossRoar');
  }

  function buildMonsterElement(monster) {
    const root = document.createElement('div');
    root.className = `typing-monster${monster.boss ? ' boss' : ''}`;
    root.dataset.monsterId = String(monster.id);
    // Vị trí ngang đi qua --monster-x (CSS dịch bằng transform); chỉ làn dọc dùng top.
    monster.element = root;
    setMonsterX(monster);
    root.style.top = `${laneTop(monster.lane)}%`;
    root.setAttribute('role', 'group');

    if (monster.boss) {
      const name = document.createElement('strong');
      name.className = 'monster-name';
      name.textContent = monster.name;
      root.appendChild(name);
    }

    const emoji = document.createElement('span');
    emoji.className = 'monster-emoji';
    const bossSkin = state.config.campaign && state.stageIndex !== null
      ? stageSkin(state.stageIndex) : BOSS_SKIN;
    const art = buildBeast(monster.boss ? bossSkin : BEAST_SKINS[monster.skin % BEAST_SKINS.length]);
    if (art) emoji.appendChild(art);
    else emoji.textContent = monster.emoji;      // khuôn không có thì vẫn còn emoji cũ
    root.appendChild(emoji);

    if (monster.bonus) {
      root.classList.add('carries-bonus');
      const badge = document.createElement('span');
      badge.className = 'monster-bonus';
      badge.textContent = monster.bonus.icon;
      root.appendChild(badge);
    }

    const word = document.createElement('span');
    word.className = 'monster-word';
    root.appendChild(word);

    const meaning = document.createElement('small');
    meaning.className = 'monster-meaning';
    root.appendChild(meaning);

    if (monster.boss) {
      const hp = document.createElement('span');
      hp.className = 'monster-hp';
      const fill = document.createElement('i');
      hp.appendChild(fill);
      root.appendChild(hp);
      monster.hpElement = fill;
    }

    monster.wordElement = word;
    monster.meaningElement = meaning;
    refreshMonsterLabel(monster);
    const layer = byId('typingMonsters');
    if (layer) layer.appendChild(root);
    fitMonster(monster);
  }

  /* Luật chơi tính toạ độ theo % bề rộng sân, còn CSS dịch quái bằng transform và
     transform chỉ hiểu % theo bề rộng CHÍNH PHẦN TỬ. Đây là chỗ duy nhất quy đổi. */
  function setMonsterX(monster) {
    if (!monster.element) return;
    const width = state && state.fieldW ? state.fieldW : 0;
    monster.element.style.setProperty('--monster-x', `${(monster.x / 100) * width}px`);
  }

  /* Quái được canh giữa quanh toạ độ x, nên phải chừa đúng nửa bề rộng của nó
     ở hai đầu — nếu không bảng chữ bị mép khung cắt mất và bé không đọc được. */
  function fitMonster(monster) {
    const field = byId('typingField');
    if (!field || !monster.element) return;
    const fieldWidth = field.clientWidth;
    if (!fieldWidth) return;                // sân chưa hiện: đo bây giờ là đo sai
    if (state) state.fieldW = fieldWidth;   // giữ số đo tươi kể cả sau khi xoay màn hình
    const halfPercent = Math.min(24, (monster.element.offsetWidth / 2 / fieldWidth) * 100);
    monster.half = halfPercent;
    monster.minX = GATE_X + halfPercent;
    monster.maxX = 100 - halfPercent - 1;
    monster.x = Math.min(monster.x, monster.maxX);
    setMonsterX(monster);
  }

  function refreshMonsterLabel(monster) {
    if (!monster.element) return;
    monster.wordElement.textContent = monster.item.text;
    monster.meaningElement.textContent = state.lang === 'en'
      ? `🇻🇳 ${monster.item.meaning}`
      : (monster.boss ? monster.item.meaning : `✦ ${monster.item.topic || 'Luyện chính tả'}`);
    if (monster.hpElement) monster.hpElement.style.width = `${Math.max(0, monster.hp / monster.maxHp) * 100}%`;
    const prefix = monster.boss ? `${monster.name}. ` : 'Quái vật. ';
    monster.element.setAttribute('aria-label', `${prefix}${monster.item.text}. ${monster.item.meaning || ''}`);
  }

  function activeMinionCount() {
    return state.monsters.reduce((count, monster) => count + (!monster.boss && !monster.dying ? 1 : 0), 0);
  }

  function manageWave() {
    if (!state || state.status !== 'running') return;
    if (state.phase === 'between') {
      if (state.elapsedMs >= state.phaseUntil) beginWave(state.waveIndex + 1);
      return;
    }
    if (state.phase === 'boss-intro') {
      if (state.elapsedMs >= state.phaseUntil) spawnBoss();
      return;
    }
    if (state.phase !== 'wave') return;

    const quota = state.config.counts[state.waveIndex];
    if (state.spawned < quota && state.elapsedMs >= state.nextSpawnAt &&
        activeMinionCount() < state.maxActive) {
      spawnMonster();
      state.nextSpawnAt = state.elapsedMs + state.config.gap[state.waveIndex];
    }

    if (state.spawned >= quota && state.monsters.length === 0) {
      if (state.waveIndex < totalWaves() - 1) {
        state.phase = 'between';
        // Chặng 21 đợt mà nghỉ 1,5s mỗi lần là mất 30 giây ngồi không.
        state.phaseUntil = state.elapsedMs + Math.max(650, 1500 - totalWaves() * 40);
        showBanner(`✨ ĐỢT ${state.waveIndex + 1} ĐÃ SẠCH!`, 'success');
        playSound('levelup');
      } else if (!state.bossSpawned) {
        state.phase = 'boss-intro';
        state.phaseUntil = state.elapsedMs + 1400;
        showBanner('⚠️ BOSS ĐANG ĐẾN!', 'danger');
        playSound('bossRoar');
      }
    }
  }

  function frameLoop(timestamp) {
    const current = state;
    if (!current || current.token !== sessionId || current.status !== 'running' || current.paused) return;
    const delta = Math.min(70, Math.max(0, timestamp - current.lastFrame));
    current.lastFrame = timestamp;
    current.elapsedMs += delta;

    advanceMonsters(delta);
    if (!state || state !== current || current.status !== 'running') return;
    manageWave();
    if (!state || state !== current || current.status !== 'running') return;
    if (current.elapsedMs - current.lastHudAt > 250) {
      current.lastHudAt = current.elapsedMs;
      updateHud(false);
    }
    current.raf = global.requestAnimationFrame(frameLoop);
  }

  /* Con đi sau không bao giờ chạm con đi trước cùng làn — khi số quái nhiều hơn
     số làn thì hai bảng chữ vẫn tách nhau, bé đọc được cả hai. */
  function keepLaneGap(monster) {
    let ahead = null;
    state.monsters.forEach(other => {
      if (other === monster || other.dying || other.lane !== monster.lane) return;
      if (other.x < monster.x && (!ahead || other.x > ahead.x)) ahead = other;
    });
    if (!ahead) return;
    const gap = (monster.half || 0) + (ahead.half || 0) + 1.5;
    monster.x = Math.max(monster.x, ahead.x + gap);
  }

  function advanceMonsters(delta) {
    const frozen = state.elapsedMs < state.freezeUntil;
    let alarm = false;
    state.monsters.slice().forEach(monster => {
      if (monster.dying) return;
      const gateAt = monster.minX == null ? GATE_X : monster.minX;
      if (!frozen) {
        monster.x -= monster.speed * delta / 1000;
        keepLaneGap(monster);
        setMonsterX(monster);
      }
      // Sắp tới cổng thì quái nhấp nháy đỏ để bé kịp ưu tiên gõ con đó.
      const near = monster.x <= gateAt + 14;
      if (near) alarm = true;
      if (monster.element) monster.element.classList.toggle('near-gate', near);
      if (!frozen && monster.x <= gateAt) monsterReachedGate(monster);
    });
    const field = byId('typingField');
    if (field) {
      field.classList.toggle('alert', alarm && !frozen);
      field.classList.toggle('frozen', frozen);
    }
  }

  function monsterReachedGate(monster) {
    if (!state || monster.dying) return;
    clearTargetIf(monster.id);
    state.combo = 0;
    state.missed += 1;
    state.lives -= 1;
    playSound('wrong');
    flashGate();

    if (monster.boss && state.lives > 0) {
      monster.x = Math.min(76, monster.maxX == null ? 76 : monster.maxX);
      monster.speed *= 1.04;
      monster.element.classList.add('escaped');
      later(() => monster.element && monster.element.classList.remove('escaped'), 500, state.token);
      showLearnToast('💥 Boss phá cổng! Em mất 1 tim, nhưng phép đẩy lùi đã kích hoạt.', 'danger');
    } else {
      monster.dying = true;
      removeFromArray(state.monsters, monster);
      if (monster.element) monster.element.classList.add('escaped');
      later(() => monster.element && monster.element.remove(), 520, state.token);
      showLearnToast(`💔 Quái mang “${monster.item.text}” đã lọt qua cổng!`, 'danger');
    }
    updateHud(true);
    if (state.lives <= 0) scheduleEnd(false, 520);
  }

  function flashGate() {
    const field = byId('typingField');
    if (!field || !state) return;
    field.classList.add('typing-field-flash', 'danger');
    const token = state.token;
    later(() => field.classList.remove('typing-field-flash', 'danger'), 420, token);
  }

  function findTarget(id) {
    return state && state.monsters.find(monster => monster.id === id && !monster.dying);
  }

  function chooseTarget(buffer) {
    if (!state || !buffer) return null;
    const typed = comparable(buffer);
    return state.monsters
      .filter(monster => !monster.dying && comparable(monster.item.text).startsWith(typed))
      .sort((a, b) => a.x - b.x)[0] || null;
  }

  function lockTarget(monster) {
    if (!state || !monster) return;
    state.targetId = monster.id;
    state.monsters.forEach(item => item.element && item.element.classList.toggle('locked', item.id === monster.id));
  }

  function clearTargetIf(id) {
    if (!state || state.targetId !== id) return;
    const monster = findTarget(id);
    if (monster && monster.element) monster.element.classList.remove('locked', 'wrong');
    state.targetId = null;
    state.lastBuffer = '';
    state.wasWrong = false;
    const input = byId('typingInput');
    if (input) {
      input.value = '';
      input.classList.remove('wrong');
    }
  }

  function unlockTarget() {
    if (!state) return;
    state.monsters.forEach(monster => {
      if (monster.element) monster.element.classList.remove('locked', 'wrong');
      if (monster.wordElement) monster.wordElement.textContent = monster.item.text;
    });
    state.targetId = null;
    state.wasWrong = false;
    const input = byId('typingInput');
    if (input) input.classList.remove('wrong');
  }

  function renderTargetCharacters(monster, buffer, isPrefix) {
    if (!monster || !monster.wordElement) return;
    const targetChars = chars(monster.item.text);
    const typedChars = chars(buffer);
    monster.wordElement.textContent = '';
    targetChars.forEach((character, index) => {
      const span = document.createElement('span');
      if (index < typedChars.length) {
        span.className = charMatches(typedChars[index], character) ? 'typed' : 'wrong-char';
      } else if (index === typedChars.length) span.className = 'current';
      else span.className = 'pending';
      span.textContent = character === ' ' ? '·' : character;
      monster.wordElement.appendChild(span);
    });
    monster.element.classList.toggle('wrong', !isPrefix);
  }

  function accountNewCharacters(previous, next, target) {
    const before = chars(previous);
    const after = chars(next);
    let common = 0;
    while (common < before.length && common < after.length && before[common] === after[common]) common += 1;
    if (after.length <= common) return;
    const targetChars = target ? chars(target.item.text) : [];
    for (let index = common; index < after.length; index += 1) {
      state.totalChars += 1;
      if (target && index < targetChars.length && charMatches(after[index], targetChars[index])) {
        state.correctChars += 1;
      }
    }
  }

  function processTypingInput() {
    if (!state || state.status !== 'running' || state.paused || composing) return false;
    const input = byId('typingInput');
    if (!input) return false;
    let buffer = normalizeText(input.value).replace(/^\s+/, '');
    if (input.value !== buffer) input.value = buffer;

    if (!buffer) {
      state.lastBuffer = '';
      unlockTarget();
      setTip('Gõ chữ đầu để khóa mục tiêu gần cổng nhất.');
      return false;
    }

    let target = state.targetId == null ? null : findTarget(state.targetId);
    if (!target) {
      target = chooseTarget(buffer);
      if (target) lockTarget(target);
    }
    accountNewCharacters(state.lastBuffer, buffer, target);
    state.lastBuffer = buffer;

    if (!target) {
      input.classList.add('wrong');
      if (!state.wasWrong) playSound('tick');
      state.wasWrong = true;
      setTip('Chưa có quái nào bắt đầu như vậy — xóa ký tự và nhìn lại mục tiêu nhé!');
      updateHud(false);
      return false;
    }

    const typed = comparable(buffer);
    const answer = comparable(target.item.text);
    const isPrefix = answer.startsWith(typed);
    renderTargetCharacters(target, buffer, isPrefix);
    input.classList.toggle('wrong', !isPrefix);
    if (!isPrefix) {
      if (!state.wasWrong) playSound('tick');
      state.wasWrong = true;
      setTip(`Ký tự chưa khớp với “${target.item.text}”. Backspace để sửa, mục tiêu vẫn được khóa.`);
    } else {
      state.wasWrong = false;
      const remaining = Math.max(0, chars(target.item.text).length - chars(buffer).length);
      setTip(remaining ? `Đã khóa mục tiêu · còn ${remaining} ký tự` : 'Phép đã sẵn sàng!');
    }
    updateHud(false);

    if (typed === answer) {
      hitMonster(target);
      return true;
    }
    return false;
  }

  function submitTypingBuffer(event) {
    if (event) event.preventDefault();
    if (!state || state.status !== 'running' || state.paused || composing) return false;
    const hit = processTypingInput();
    if (hit) return false;
    const input = byId('typingInput');
    if (!input || !input.value) {
      setTip('Hãy gõ một từ trên quái vật trước khi tung phép.');
      return false;
    }
    const target = state.targetId == null ? null : findTarget(state.targetId);
    if (!target || comparable(input.value) !== comparable(target.item.text)) {
      playSound('wrong');
      input.classList.add('wrong');
      if (target && target.element) {
        target.element.classList.add('wrong');
        later(() => target.element && target.element.classList.remove('wrong'), 380, state.token);
      }
      setTip('Phép chưa hoàn chỉnh. Sửa phần màu đỏ rồi nhấn Enter, hoặc cứ gõ đủ để tự đánh!');
    }
    return false;
  }

  function hitMonster(monster) {
    if (!state || !monster || monster.dying || state.status !== 'running') return;
    const itemJustTyped = monster.item;
    state.correctWords += 1;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    const base = 12 + chars(itemJustTyped.text).length * 2;
    const comboBoost = 1 + Math.min(10, Math.max(0, state.combo - 1)) * 0.08;
    const bossBoost = monster.boss ? 1.5 : 1;
    const starBoost = state.elapsedMs < state.doubleUntil ? 2 : 1;
    const points = Math.round(base * state.config.score * comboBoost * bossBoost * starBoost);
    state.score += points;
    castSpell(monster, points);
    playSound(state.combo > 0 && state.combo % 5 === 0 ? 'crit' : 'right');
    if (monster.bonus) applyBonus(monster.bonus);
    else showLearnToast(state.lang === 'en'
      ? `📘 ${itemJustTyped.text} = ${itemJustTyped.meaning} · +${points} điểm`
      : `✨ ${itemJustTyped.text} · ${itemJustTyped.meaning} · +${points} điểm`, 'success');

    state.targetId = null;
    state.lastBuffer = '';
    state.wasWrong = false;
    const input = byId('typingInput');
    if (input) {
      input.value = '';
      input.classList.remove('wrong');
    }
    monster.element.classList.remove('locked', 'wrong');

    if (monster.boss) damageBoss(monster);
    else defeatMinion(monster);
    updateHud(true);
    safeFocusInput();
  }

  function applyBonus(bonus) {
    if (bonus.id === 'heart') {
      state.lives = Math.min(3, state.lives + 1);
      showBanner('❤️ +1 TIM!', 'success');
      playSound('heal');
    } else if (bonus.id === 'freeze') {
      state.freezeUntil = state.elapsedMs + FREEZE_MS;
      showBanner('❄️ ĐÓNG BĂNG!', '');
      playSound('shield');
    } else {
      state.doubleUntil = state.elapsedMs + DOUBLE_MS;
      showBanner('⭐ ĐIỂM ×2!', 'success');
      playSound('gold');
    }
    showLearnToast(bonus.text, 'success');
  }

  function defeatMinion(monster) {
    monster.dying = true;
    removeFromArray(state.monsters, monster);
    monster.element.classList.add('hit');
    const token = state.token;
    later(() => monster.element && monster.element.remove(), 460, token);
  }

  function damageBoss(monster) {
    monster.hp -= 1;
    monster.element.classList.add('hit');
    const token = state.token;
    later(() => monster.element && monster.element.classList.remove('hit'), 360, token);
    if (monster.hp <= 0) {
      monster.dying = true;
      state.bossDefeated = true;
      removeFromArray(state.monsters, monster);
      monster.element.classList.add('defeated');
      scheduleEnd(true, 850);
      return;
    }

    monster.stageIndex += 1;
    monster.item = monster.stages[monster.stageIndex];
    monster.x += 13;
    monster.speed = speedForItem(monster.item, true) * (1 + monster.stageIndex * 0.035);
    refreshMonsterLabel(monster);
    fitMonster(monster); // câu mới dài ngắn khác nhau nên phải đo lại
    showBanner(`⚡ VỠ GIÁP! CÒN ${monster.hp}/${monster.maxHp}`, 'success');
  }

  function castSpell(monster, points) {
    const field = byId('typingField');
    if (!field || !monster.element || !state) return;
    const token = state.token;
    const spell = document.createElement('span');
    spell.className = 'typing-spell';
    spell.textContent = state.combo >= 5 ? '🌟' : '⚡';
    // Điểm xuất phát đặt bằng left/top một lần, phần bay do transform lo.
    spell.style.left = '8%';
    spell.style.top = '78%';
    field.appendChild(spell);
    // Quy chênh lệch % ra px bằng kích thước sân đã nhớ ở laneLayout() — không đo lại DOM.
    ensureFieldMetrics();
    const dx = ((monster.x - 8) / 100) * (state.fieldW || 0);
    const dy = ((laneTop(monster.lane) - 78) / 100) * (state.fieldH || 0);
    const land = () => {
      if (token === sessionId) createImpact(monster.x, monster.lane, points);
      spell.remove();
    };
    // WAAPI không chịu ảnh hưởng của override prefers-reduced-motion trong CSS,
    // nên phải tự kiểm tra: đặt thẳng chưởng vào đích rồi nổ, không bay.
    const calm = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) {
      spell.style.transform = `translate(${dx}px,${dy}px) scale(1.35)`;
      later(land, 60, token);
    } else if (typeof spell.animate === 'function') {
      spell.animate([
        { transform: 'translate(0,0) scale(.55) rotate(0deg)' },
        { transform: `translate(${dx}px,${dy}px) scale(1.35) rotate(300deg)` }
      ], { duration: 280, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'forwards' })
        .onfinish = land;
    } else {
      spell.style.transform = `translate(${dx}px,${dy}px) scale(1.35) rotate(300deg)`;
      later(land, 280, token);
    }
  }

  function createImpact(x, lane, points) {
    const field = byId('typingField');
    if (!field || !state) return;
    const impact = document.createElement('span');
    impact.className = 'typing-impact';
    impact.textContent = `💥 +${points}`;
    impact.style.left = `${x}%`;
    impact.style.top = `${laneTop(lane)}%`;
    field.appendChild(impact);
    later(() => impact.remove(), 650, state.token);
  }

  function scheduleEnd(won, delay) {
    if (!state || state.status !== 'running') return;
    state.status = 'ending';
    if (state.raf) global.cancelAnimationFrame(state.raf);
    const token = state.token;
    later(() => finishTypingRun(won), delay, token);
  }

  function currentWpm() {
    if (!state || state.elapsedMs < 1000) return 0;
    return Math.min(250, Math.round((state.correctChars / 5) / (state.elapsedMs / 60000)));
  }

  function currentAccuracy() {
    if (!state || !state.totalChars) return 100;
    return Math.max(0, Math.min(100, Math.round(state.correctChars / state.totalChars * 100)));
  }

  function finishTypingRun(won) {
    if (!state || state.token !== sessionId || state.status === 'ended') return;
    state.status = 'ended';
    if (state.raf) global.cancelAnimationFrame(state.raf);
    const wpm = currentWpm();
    const accuracy = currentAccuracy();
    const stageIndexForStars = state.stageIndex;
    /* Sao phải TỈ LỆ VỚI CHẶNG, không chỉ với độ chính xác.
       Trước đây thắng chặng 1 ở mức "Siêu chậm" (3 đợt, ~40 giây) với độ chính
       xác 100% đã được 7 sao — bằng cả việc hạ boss cuối Phiêu lưu — nên toàn bộ
       thang hạng (Tân Binh→Bậc Thầy ở mốc 60 sao) xong sau chừng 9 ván dễ nhất.
       Hệ số 0,45 → 1,26 theo chặng giữ nguyên phần thưởng cho chặng cuối mà cắt
       hẳn đường farm ở chặng đầu. Luyện tự do (không thuộc chiến dịch) hưởng một
       nửa, vì nó không tiêu tốn tiến độ nào.
       posture B — thấy chặng cuối thưởng bèo thì nâng 1,26; thấy vẫn farm được
       chặng đầu thì hạ 0,45. */
    const baseStars = 3 + Math.floor(accuracy / 25) + (state.config.score >= 1.6 ? 1 : 0);
    const stageWeight = stageIndexForStars === null ? 0.5 : 0.45 + stageIndexForStars * 0.09;
    const stars = won
      ? Math.max(1, Math.min(8, Math.round(baseStars * stageWeight)))
      : Math.max(1, Math.floor(state.score / 250));
    const stageIndex = state.stageIndex;
    const clearedNow = won && stageIndex !== null;
    const result = {
      score: state.score,
      wpm,
      combo: state.maxCombo,
      accuracy,
      words: state.correctWords,
      stars,
      clearedStage: clearedNow ? stageIndex : -1
    };
    const records = saveResultRecord(result);
    const isNewBest = result.score > records.old.bestScore;
    const lastStage = stageIndex === CAMPAIGN_STAGES - 1;

    const input = byId('typingInput');
    if (input) input.disabled = true;
    const pause = byId('typingPauseBtn');
    if (pause) {
      pause.disabled = true;
      pause.textContent = '⏸️';
    }
    setSectionVisibility('typingPlay', true);
    setSectionVisibility('typingSetup', true);
    setSectionVisibility('typingResult', false);

    const icon = byId('typingResultIcon');
    const title = byId('typingResultTitle');
    const text = byId('typingResultText');
    if (icon) icon.textContent = won ? (clearedNow && lastStage ? '👑' : '🏆') : '🛡️';
    if (title) {
      title.textContent = !won ? 'CỔNG CẦN ĐƯỢC SỬA!'
        : clearedNow && lastStage ? 'EM LÀ CHÚA TỂ BÀN PHÍM!'
        : clearedNow ? `HẠ GỤC ${state.config.stageName.toUpperCase()}!`
        : 'BOSS TỪ VỰNG ĐÃ BỊ HẠ!';
    }
    if (text) {
      const waves = totalWaves();
      text.textContent = !won
        ? `Em đã học được ${result.words} mục từ và nhận ${stars} ⭐. Lần tới hãy ưu tiên đúng trước, nhanh sau nhé!`
        : clearedNow && lastStage
          ? `Em đã chinh phục cả ${CAMPAIGN_STAGES} chặng của chiến dịch, nhận ${stars} ⭐!`
          : clearedNow
            ? `Xong chặng ${stageIndex + 1}/${CAMPAIGN_STAGES} với ${waves} đợt quái, nhận ${stars} ⭐.${isNewBest ? ' Kỷ lục điểm mới!' : ''}`
            : `Xuất sắc! Em đã vượt đủ ${waves} đợt, nhận ${stars} ⭐.${isNewBest ? ' Đây là kỷ lục điểm mới!' : ''}`;
    }
    const nextBtn = byId('typingNextStageBtn');
    if (nextBtn) {
      const hasNext = clearedNow && !lastStage;
      nextBtn.hidden = !hasNext;
      if (hasNext) nextBtn.textContent = `⚔️ CHẶNG ${stageIndex + 2}: ${campaignStages()[stageIndex + 1].name}`;
    }
    const retryBtn = byId('typingRetryBtn');
    if (retryBtn) {
      retryBtn.textContent = stageIndex === null ? '🔁 Chơi lại' : `🔁 Đánh lại chặng ${stageIndex + 1}`;
      retryBtn.onclick = () => startTypingRun(stageIndex === null ? undefined : stageIndex);
    }
    if (clearedNow && !lastStage) selectedStage = stageIndex + 1;
    renderResultStats(result, records.best);
    drawCampaignMap();
    if (won) {
      playSound('win');
      try { if (typeof confetti === 'function') confetti(clearedNow && lastStage ? 90 : 55); } catch (_) { /* hiệu ứng phụ */ }
    } else playSound('defeat');
  }

  function renderResultStats(result, best) {
    const container = byId('typingResultStats');
    if (!container) return;
    container.textContent = '';
    const stats = [
      ['🏆', result.score, `Điểm · tốt nhất ${best.bestScore}`],
      ['⌨️', result.wpm, `WPM · tốt nhất ${best.bestWpm}`],
      ['🎯', `${result.accuracy}%`, 'Chính xác'],
      ['🔥', result.combo, `Combo · tốt nhất ${best.bestCombo}`],
      ['📚', result.words, 'Mục đã gõ đúng'],
      ['⭐', `+${result.stars}`, 'Sao nhận được']
    ];
    stats.forEach(([emoji, value, label]) => {
      const box = document.createElement('div');
      const icon = document.createElement('span');
      const number = document.createElement('b');
      const caption = document.createElement('small');
      icon.textContent = emoji;
      number.textContent = String(value);
      caption.textContent = label;
      box.append(icon, number, caption);
      container.appendChild(box);
    });
  }

  function updateHud(force) {
    if (!state) return;
    const lives = byId('typingLives');
    const score = byId('typingScore');
    const combo = byId('typingCombo');
    const wpm = byId('typingWpm');
    const wave = byId('typingWave');
    if (lives) lives.textContent = String(Math.max(0, state.lives));
    if (score) score.textContent = String(state.score);
    if (combo) combo.textContent = String(state.combo);
    if (wpm) wpm.textContent = String(currentWpm());
    if (wave) wave.textContent = String(state.waveIndex + 1);
    const waveTotal = byId('typingWaveTotal');
    if (waveTotal) waveTotal.textContent = String(totalWaves());
    // Cổng bừng sáng dần theo chuỗi combo — bé thấy ngay mình đang chơi tốt.
    const gate = document.querySelector('#typingField .typing-gate');
    if (gate) {
      gate.classList.toggle('combo-hot', state.combo >= 5);
      gate.classList.toggle('combo-blaze', state.combo >= 10);
    }
    const stagePill = byId('typingStagePill');
    const stageLabel = byId('typingStage');
    if (stagePill) stagePill.hidden = state.stageIndex === null;
    if (stageLabel && state.stageIndex !== null) {
      stageLabel.textContent = `${state.stageIndex + 1}/${CAMPAIGN_STAGES}`;
    }
    if (force && combo) {
      combo.classList.remove('pop');
      void combo.offsetWidth;
      combo.classList.add('pop');
    }
  }

  function setTip(message) {
    const tip = byId('typingTip');
    if (tip) tip.textContent = message;
  }

  function showBanner(message, tone) {
    const banner = byId('typingWaveBanner');
    if (!banner || !state) return;
    banner.textContent = message;
    banner.className = `wave-banner show${tone ? ` ${tone}` : ''}`;
    const token = state.token;
    later(() => banner.classList.remove('show'), 1150, token);
  }

  function showLearnToast(message, tone) {
    const toast = byId('typingLearnToast');
    if (!toast || !state) return;
    toast.textContent = message;
    toast.className = `learn-toast show${tone ? ` ${tone}` : ''}`;
    const token = state.token;
    later(() => toast.classList.remove('show'), 2200, token);
  }

  function safeFocusInput() {
    const input = byId('typingInput');
    if (!input || input.disabled) return;
    try { input.focus({ preventScroll: true }); }
    catch (_) { input.focus(); }
  }

  function toggleTypingPause() {
    if (!state || (state.status !== 'running' && state.status !== 'paused')) return;
    const pause = byId('typingPauseBtn');
    const input = byId('typingInput');
    if (!state.paused) {
      state.paused = true;
      state.status = 'paused';
      if (state.raf) global.cancelAnimationFrame(state.raf);
      if (input) input.disabled = true;
      if (pause) {
        pause.textContent = '▶️';
        pause.setAttribute('aria-label', 'Tiếp tục');
      }
      showBanner('⏸️ TẠM DỪNG', '');
      setTip('Quái vật đã đứng yên. Nhấn ▶️ khi em sẵn sàng.');
      playSound('open');
      return;
    }

    state.paused = false;
    state.status = 'running';
    state.lastFrame = now();
    if (input) input.disabled = false;
    if (pause) {
      pause.textContent = '⏸️';
      pause.setAttribute('aria-label', 'Tạm dừng');
    }
    showBanner('▶️ TIẾP TỤC!', 'success');
    setTip(state.targetId == null
      ? 'Gõ chữ đầu để khóa mục tiêu gần cổng nhất.'
      : 'Mục tiêu vẫn được khóa — tiếp tục gõ thôi!');
    playSound('click');
    safeFocusInput();
    state.raf = global.requestAnimationFrame(frameLoop);
  }

  function pauseTypingForVisibility() {
    if (state && state.status === 'running' && !state.paused) toggleTypingPause();
  }

  function bindEvents() {
    const input = byId('typingInput');
    if (input && !input.dataset.typingBound) {
      input.dataset.typingBound = '1';
      input.addEventListener('compositionstart', () => { composing = true; });
      input.addEventListener('compositionend', () => {
        composing = false;
        processTypingInput();
      });
      input.addEventListener('input', () => {
        if (!composing) processTypingInput();
      });
      input.addEventListener('keydown', event => {
        if (event.isComposing || composing) return;
        if (event.key === 'Escape' && state && state.status === 'running') {
          event.preventDefault();
          toggleTypingPause();
        }
      });
    }

    document.querySelectorAll('input[name="typingLanguage"]').forEach(radio => {
      if (radio.dataset.typingBound) return;
      radio.dataset.typingBound = '1';
      radio.addEventListener('change', syncAccentOption);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state && state.status === 'running' && !state.paused) toggleTypingPause();
    });
  }

  bindEvents();

  // API global được HTML gọi trực tiếp qua onclick/onsubmit.
  global.openTypingGame = openTypingGame;
  global.startTypingRun = startTypingRun;
  global.startTypingCampaign = startTypingCampaign;
  global.selectTypingStage = selectTypingStage;
  global.resetTypingCampaign = resetTypingCampaign;
  global.submitTypingBuffer = submitTypingBuffer;
  global.toggleTypingPause = toggleTypingPause;
  global.pauseTypingForVisibility = pauseTypingForVisibility;
  global.leaveTypingGame = leaveTypingGame;
  global.cleanupTypingGame = stopRuntime;
})(window);
