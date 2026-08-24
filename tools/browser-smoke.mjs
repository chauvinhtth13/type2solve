import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';

const root = new URL('../', import.meta.url);
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitFor(url, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {}
    await sleep(120);
  }
  throw new Error(`Quá thời gian chờ ${url}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
  console.log(`✓ ${message}`);
}

const httpPort = await freePort();
const debugPort = await freePort();
const profileDir = await mkdtemp(join(tmpdir(), 'dttd-chrome-'));
const server = spawn(process.execPath, ['tools/serve.mjs'], {
  cwd: root,
  env: { ...process.env, DTTD_PORT: String(httpPort) },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });

let socket;
const runtimeErrors = [];
try {
  await waitFor(`http://127.0.0.1:${httpPort}/index.html`);
  const targetsResponse = await waitFor(`http://127.0.0.1:${debugPort}/json/list`);
  const targets = await targetsResponse.json();
  const target = targets.find(item => item.type === 'page');
  if (!target) throw new Error('Không tìm thấy Chrome page target');

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let requestId = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails || {};
      const exception = details.exception || {};
      const location = details.url ? ` (${details.url}:${Number(details.lineNumber || 0) + 1})` : '';
      runtimeErrors.push((exception.description || exception.value || details.text || 'Runtime exception') + location);
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      if (!/fonts\.googleapis|fonts\.gstatic/i.test(text)) runtimeErrors.push(text);
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  };

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/index.html` });
  for (let i = 0; i < 80; i++) {
    if (await evaluate('document.readyState') === 'complete') break;
    await sleep(100);
  }
  await sleep(350);

  const home = await evaluate(`({
    active: document.querySelector('#home.active') !== null,
    modes: document.querySelectorAll('.learning-mode').length,
    api: ['openTypingGame','startTypingCampaign','resetTypingCampaign','openSudokuGame','startSudoku','checkSudoku','setAnswerMode','openDuelGame','startDuel','openNimGame','startNim'].every(name => typeof window[name] === 'function'),
    schema: GameStorage.load().version
  })`);
  assert(home.active, 'Trang chủ mở thành công');
  assert(home.modes === 4, 'Khu học tập có Gõ Chữ Diệt Quái, Sudoku, Đấu Đối Kháng và Nim');
  assert(home.api, 'API các game đã được nạp');
  assert(home.schema === 1, 'Hồ sơ localStorage có schema hợp lệ');
  const normalizers = await evaluate(`({
    decimal: isCorrectAnswer('0,5','0.5'),
    words: TYPING_CONTENT.en.length>=45&&TYPING_CONTENT.vi.length>=45
  })`);
  assert(normalizers.decimal, 'Chuẩn hóa đáp án số hoạt động');
  assert(normalizers.words, 'Kho luyện gõ có đủ nội dung Anh–Việt');
  const brainQuestions = await evaluate(`(() => {
    let checked=0;
    for(let tier=1;tier<=5;tier+=1){
      CHOICE_TIER=tier;
      for(let index=0;index<100;index+=1){
        const question=genBrainChallenge(tier);
        if(!question.choices.includes(question.ans)
          || new Set(question.choices.map(String)).size!==question.choices.length
          || !question.exp) return {checked,valid:false};
        checked+=1;
      }
    }
    return {checked,valid:true};
  })()`);
  assert(brainQuestions.valid && brainQuestions.checked === 500,
    '500 câu toán Thử thách mới ở đủ 5 cấp có đáp án và lời giải hợp lệ');

  const singaporeQuestions = await evaluate(`(() => {
    let checked=0;
    for(const kind of SINGAPORE3_KINDS){
      for(let index=0;index<100;index+=1){
        const question=singaporeQuestion(kind,5);
        if(question.sgKind!==kind
          || !question.choices.includes(question.ans)
          || new Set(question.choices.map(String)).size!==question.choices.length
          || !question.exp) return {checked,valid:false,kind};
        checked+=1;
      }
    }
    const exact={
      ratio:singaporeQuestion('ratioProducts',5).ans,
      aa:singaporeQuestion('aaAbaTrap',5).ans,
      ccc:singaporeQuestion('abBaCccTrap',5).ans,
      last:singaporeQuestion('lastDigit2023',5).ans,
      stair:singaporeQuestion('stairCubes',5).ans,
      leap:singaporeQuestion('leapCalendar',5).ans,
      roses:singaporeQuestion('circleRoses',5).ans,
      triangle:singaporeQuestion('triangleBDE',5).ans,
      matchsticks:singaporeQuestion('matchstickTerm',5).ans,
      snail:singaporeQuestion('snailWell',5).ans,
      gift:singaporeQuestion('groupGift',5).ans,
      rectangle:singaporeQuestion('rectangleIntersection',5).ans
    };
    const previous=currentQ;
    currentQ=singaporeQuestion('ratioProducts',5);
    const ratioDecimal=isCorrectAnswer('0.4');
    currentQ=singaporeQuestion('rectangleIntersection',5);
    const rectangleFraction=isCorrectAnswer('48/5');
    currentQ=previous;
    return {checked,valid:true,exact,ratioDecimal,rectangleFraction};
  })()`);
  assert(singaporeQuestions.valid && singaporeQuestions.checked === 1800,
    '1.800 câu sinh từ đủ 18 dạng Singapore lớp 3 có đáp án và lời giải hợp lệ');
  assert(JSON.stringify(singaporeQuestions.exact) === JSON.stringify({
    ratio:'2/5',aa:'Không tồn tại',ccc:'Không tồn tại',last:7,stair:14,
    leap:'Thứ tư',roses:40,triangle:20,matchsticks:22,snail:8,gift:94,rectangle:'9,6'
  }), 'Đáp án chuẩn của 12 bài Singapore do người dùng cung cấp đã được kiểm chứng');
  assert(singaporeQuestions.ratioDecimal && singaporeQuestions.rectangleFraction,
    'Các cách nhập tương đương 0.4 và 48/5 được chấp nhận');

  const sudokuCatalog = await evaluate(`(() => {
    const rows = SudokuGame.validateSeeds();
    return {
      levels: Object.keys(SudokuGame.LEVELS).length,
      unique: rows.every(row => row.solutions === 1),
      ultimate: rows.find(row => row.level === 'ultimate')?.clues
    };
  })()`);
  assert(sudokuCatalog.levels === 6 && sudokuCatalog.unique && sudokuCatalog.ultimate === 17,
    'Sudoku có 6 cấp độ, mọi bộ đề có nghiệm duy nhất và cấp tối thượng 17 ô');

  await evaluate(`openSudokuGame();
    document.querySelector('input[name="sudokuDifficulty"][value="beginner"]').checked=true;
    startSudoku();`);
  const sudokuBoard = await evaluate(`({
    active: document.querySelector('#sudokuGame.active') !== null,
    cells: document.querySelectorAll('#sudokuBoard .sudoku-cell').length,
    clues: document.querySelectorAll('#sudokuBoard .sudoku-cell.fixed').length,
    editable: document.querySelectorAll('#sudokuBoard .sudoku-cell.editable').length,
    hints: document.getElementById('sudokuHints').textContent
  })`);
  assert(sudokuBoard.active && sudokuBoard.cells === 81 && sudokuBoard.clues === 50
    && sudokuBoard.editable === 31 && sudokuBoard.hints === '5', 'Sudoku Làm quen dựng đúng bàn 9×9 và số gợi ý');
  const sudokuTools = await evaluate(`(() => {
    const cells=[...document.querySelectorAll('#sudokuBoard .sudoku-cell.editable')];
    cells[0].click();sudokuInput(1);
    const entered=cells[0].querySelector('.sudoku-value')?.textContent;
    cells[1].click();toggleSudokuNotes();sudokuInput(2);
    const noted=[...cells[1].querySelectorAll('.sudoku-notes i')].some(i=>i.textContent==='2');
    toggleSudokuNotes();useSudokuHint();
    const hinted=cells[1].classList.contains('hinted');
    toggleSudokuPause();
    const paused=!document.getElementById('sudokuPauseOverlay').hidden;
    toggleSudokuPause();
    return {entered,noted,hinted,paused};
  })()`);
  assert(sudokuTools.entered === '1' && sudokuTools.noted && sudokuTools.hinted && sudokuTools.paused,
    'Sudoku nhận số, ghi chú, gợi ý và tạm dừng');
  const sudokuWin = await evaluate(`(() => {
    const originalConfirm=window.confirm;window.confirm=()=>true;restartSudoku();window.confirm=originalConfirm;
    const cells=[...document.querySelectorAll('#sudokuBoard .sudoku-cell')];
    const puzzle=cells.map(cell=>cell.classList.contains('fixed')?Number(cell.textContent):0);
    const solved=SudokuGame.solveGrid(puzzle,2);
    if(solved.count!==1)return {won:false,solutions:solved.count};
    cells.forEach((cell,index)=>{if(!cell.classList.contains('fixed')){cell.click();sudokuInput(solved.solution[index]);}});
    const record=GameStorage.load().records.sudoku;
    return {
      won:!document.getElementById('sudokuResult').hidden,
      wins:record.wins,
      best:record.bestTimes.beginner,
      summary:document.getElementById('profileSudoku').textContent
    };
  })()`);
  assert(sudokuWin.won && sudokuWin.wins >= 1 && sudokuWin.best >= 1 && Number(sudokuWin.summary) >= 1,
    'Hoàn tất Sudoku lưu số ván thắng, kỷ lục thời gian và cập nhật hồ sơ');
  await evaluate('leaveSudokuGame()');


  await evaluate('openTypingGame(); startTypingRun()');
  await sleep(1450);
  const typing = await evaluate(`({
    active: document.querySelector('#typingGame.active') !== null,
    playing: !document.querySelector('#typingPlay').hidden,
    monsters: document.querySelectorAll('#typingMonsters .typing-monster').length,
    enabled: !document.querySelector('#typingInput').disabled,
    dictionaryLoaded: TYPING_CONTENT.dictionaryLoaded === true,
    dictionaryWords: TYPING_CONTENT.en.length,
    dictionaryStatus: document.getElementById('typingDictionaryStatus').textContent
  })`);
  assert(typing.active && typing.playing && typing.enabled, 'Typing Battle bắt đầu và nhận bàn phím');
  assert(typing.monsters >= 1, 'Typing Battle sinh quái bằng requestAnimationFrame');
  assert(typing.dictionaryLoaded && typing.dictionaryWords >= 80000 && /Sẵn sàng/.test(typing.dictionaryStatus),
    'Kho từ Anh–Việt lớn được nạp trước khi bắt đầu ván');

  // Bé phải đọc được từ thì mới gõ được: không chữ nào bị khung cắt, không con nào đè con nào.
  const layout = `(() => {
    const field = document.getElementById('typingField').getBoundingClientRect();
    const alive = [...document.querySelectorAll('.typing-monster')]
      .filter(m => !m.classList.contains('escaped') && !m.classList.contains('defeated') && !m.classList.contains('hit'))
      .map(m => ({ word: m.querySelector('.monster-word').getBoundingClientRect(), box: m.getBoundingClientRect() }));
    const clipped = alive.filter(m => m.word.left < field.left - 1 || m.word.right > field.right + 1
      || m.word.top < field.top - 1 || m.word.bottom > field.bottom + 1).length;
    let overlap = 0;
    for (let i = 0; i < alive.length; i += 1) for (let j = i + 1; j < alive.length; j += 1) {
      const a = alive[i].box, b = alive[j].box;
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlap += 1;
    }
    return { clipped, overlap };
  })()`;
  let clippedWords = 0;
  let overlappingMonsters = 0;
  for (let i = 0; i < 8; i += 1) {
    const frame = await evaluate(layout);
    clippedWords += frame.clipped;
    overlappingMonsters += frame.overlap;
    await sleep(700);
  }
  assert(clippedWords === 0, 'Từ trên quái luôn nằm trọn trong khung, không bị cắt');
  assert(overlappingMonsters === 0, 'Các quái không đè chữ lên nhau');
  await evaluate('leaveTypingGame()');

  const difficulties = await evaluate(`[...document.querySelectorAll('#typingDifficulty option')].map(o => o.value)`);
  assert(difficulties.includes('superslow') && difficulties.includes('superfast'),
    'Có đủ chế độ Siêu chậm và Siêu nhanh');

  const campaign = await evaluate(`(() => {
    GameStorage.updateRecords({ typing: { campaignCleared: -1 } });
    openTypingGame();
    const nodes = [...document.querySelectorAll('#typingMap .mapnode')];
    const stages = TYPING_CONTENT.campaign;
    return {
      nodes: nodes.length,
      stages: stages.length,
      locked: nodes.filter(node => node.disabled).length,
      wavesGrow: stages.every((s, i) => i === 0 || s.waves >= stages[i - 1].waves),
      randomRange: stages.every(stage => Number.isInteger(stage.perWave?.min)
        && Number.isInteger(stage.perWave?.max)
        && stage.perWave.min === 10 && stage.perWave.max === 50),
      wordsGrow: stages[9].waves * stages[9].perWave.min > stages[0].waves * stages[0].perWave.min,
      rangeShown: nodes.every(node => (node.querySelector('.tierlbl')?.textContent || '').includes('10–50 từ/đợt'))
    };
  })()`);
  assert(campaign.nodes === 10 && campaign.stages === 10, 'Chiến dịch gõ chữ có đủ 10 chặng');
  assert(campaign.locked === 9, 'Chặng chưa mở khoá thì không bấm được');
  assert(campaign.randomRange && campaign.rangeShown, 'Mỗi đợt chiến dịch random từ 10 đến 50 quái');
  assert(campaign.wavesGrow && campaign.wordsGrow, 'Số đợt và tổng tối thiểu tăng dần qua từng chặng');

  const campaignReset = await evaluate(`(() => {
    GameStorage.updateRecords({ typing: {
      bestScore: 4321,
      bestWpm: 57,
      bestCombo: 19,
      campaignCleared: 6
    } });
    openTypingGame();
    const originalConfirm = window.confirm;
    window.confirm = () => false;
    const cancelled = resetTypingCampaign();
    const afterCancel = GameStorage.load().records.typing.campaignCleared;
    window.confirm = () => true;
    const reset = resetTypingCampaign();
    window.confirm = originalConfirm;
    const record = GameStorage.load().records.typing;
    const nodes = [...document.querySelectorAll('#typingMap .mapnode')];
    return {
      cancelled,
      afterCancel,
      reset,
      cleared: record.campaignCleared,
      bestScore: record.bestScore,
      bestWpm: record.bestWpm,
      bestCombo: record.bestCombo,
      locked: nodes.filter(node => node.disabled).length,
      firstSelected: nodes[0]?.getAttribute('aria-pressed'),
      status: document.getElementById('typingCampaignStatus').textContent
    };
  })()`);
  assert(campaignReset.cancelled === false && campaignReset.afterCancel === 6,
    'Hủy xác nhận thì không reset tiến độ chiến dịch');
  assert(campaignReset.reset === true && campaignReset.cleared === -1 && campaignReset.locked === 9
    && campaignReset.firstSelected === 'true', 'Reset đưa chiến dịch về Chặng 1 và khóa lại 9 chặng');
  assert(campaignReset.bestScore === 4321 && campaignReset.bestWpm === 57 && campaignReset.bestCombo === 19
    && /kỷ lục và sao vẫn được giữ/i.test(campaignReset.status), 'Reset vẫn giữ nguyên các kỷ lục Gõ Chữ');

  await evaluate(`startTypingCampaign()`);
  await sleep(600);
  const stageRun = await evaluate(`({
    waves: document.getElementById('typingWaveTotal').textContent,
    pill: !document.getElementById('typingStagePill').hidden
  })`);
  assert(stageRun.waves === String((await evaluate('TYPING_CONTENT.campaign[0].waves'))) && stageRun.pill,
    'Vào chặng thì HUD hiện đúng số đợt và số chặng');
  await evaluate('leaveTypingGame()');

  await evaluate('openTypingGame(); startTypingRun()');
  await sleep(600);
  assert(await evaluate(`document.getElementById('typingStagePill').hidden`),
    'Luyện tự do không tính vào chiến dịch');
  await evaluate('leaveTypingGame()');
  assert(await evaluate(`/Trang chủ/.test(document.querySelector('#typingGame .home-btn').textContent)`),
    'Game gõ chữ có nút "🏠 Trang chủ" ghi rõ chữ');


  const persistence = await evaluate(`(() => {
    GameStorage.reset();startAdventure();G.coins=321;G.perks.atk=2;saveAdventureProgress();goHome();
    startBlitz();goHome();openTypingGame();leaveTypingGame();
    const saved=GameStorage.load().adventure;GameStorage.reset();
    return {coins:saved.coins,atk:saved.perks?.atk};
  })()`);
  assert(persistence.coins===321&&persistence.atk===2, 'Tiến trình Phiêu lưu không bị chế độ khác ghi đè');

  await evaluate(`startAdventure(); beginBattle(); setAnswerMode('input');
    for(let i=0;i<12&&!G.typedAnswer;i++)newQuestion();`);
  await sleep(2350);
  const typedReady = await evaluate(`({
    active: document.querySelector('#battle.active') !== null,
    typed: G.typedAnswer,
    visible: !document.querySelector('#answerForm').hidden,
    enabled: !document.querySelector('#answerInput').disabled
  })`);
  assert(typedReady.active && typedReady.typed && typedReady.visible && typedReady.enabled, 'Đấu toán chuyển sang ô nhập kết quả');
  const answered = await evaluate(`(() => {
    answerInput.value=String(currentQ.ans);
    submitTypedAnswer(new Event('submit',{cancelable:true}));
    return {locked:G.locked,feedback:feedback.textContent,correct:G.correct};
  })()`);
  assert(answered.locked && answered.correct === 1 && answered.feedback.length > 0, 'Đáp án nhập đúng được chấm và tung đòn');
  await evaluate('G.energy=100;G.locked=false;useUltimate();goHome()');
  await sleep(1500);
  assert(await evaluate(`document.querySelector('#home.active')!==null`), 'Callback đòn đánh cũ không kéo người chơi khỏi trang chủ');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate('goHome()');
  const mobile = await evaluate(`({
    viewport: innerWidth,
    overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    cards: getComputedStyle(document.querySelector('.learning-modes')).gridTemplateColumns
  })`);
  assert(mobile.viewport === 390 && mobile.overflow, 'Giao diện mobile 390px không tràn ngang');
  const sudokuMobile = await evaluate(`(() => {
    openSudokuGame();
    document.querySelector('input[name="sudokuDifficulty"][value="beginner"]').checked=true;
    startSudoku();
    const board=document.getElementById('sudokuBoard').getBoundingClientRect();
    const result={inside:board.left>=-1&&board.right<=innerWidth+1,square:Math.abs(board.width-board.height)<2,
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1};
    leaveSudokuGame();return result;
  })()`);
  assert(sudokuMobile.inside && sudokuMobile.square && sudokuMobile.overflow,
    'Bàn Sudoku vuông và không tràn ngang trên mobile 390px');

  const workerReady = await evaluate(`navigator.serviceWorker.ready.then(registration=>Boolean(registration.active))`);
  assert(workerReady, 'Service worker PWA được kích hoạt trên localhost');
  const dictionaryCached = await evaluate(`caches.match(new URL('assets/data/english-vocabulary.json', location.href).href).then(Boolean)`);
  assert(dictionaryCached, 'Kho từ lớn được cache để tiếp tục chơi offline');
  const sudokuCached = await evaluate(`caches.match(new URL('assets/js/games/sudoku.js', location.href).href).then(Boolean)`);
  assert(sudokuCached, 'Sudoku được cache để chơi offline');

  /* ===== Hồi quy cho các lỗi đã sửa =====
     Mỗi mục dưới đây tương ứng một lỗi THẬT từng lọt qua 40 assertion cũ.
     Chú thích ghi rõ số đo lúc chưa vá để lần sau đỏ lên là biết ngay vì sao. */

  // aria-pressed của nút âm thanh từng bị ĐẢO lúc khởi động (bootstrap ghi String(!SOUND_ON)),
  // xoá sạch bản vá trong toggleSound(). Xảy ra ở MỌI lần tải vì normalize() luôn ép boolean.
  await evaluate(`GameStorage.updateSettings({sound:false})`);
  await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/index.html` });
  for (let i = 0; i < 80; i++) { if (await evaluate('document.readyState') === 'complete') break; await sleep(100); }
  await sleep(400);
  const soundAria = await evaluate(`({on:SOUND_ON,home:sndBtnHome.getAttribute('aria-pressed'),battle:sndBtn.getAttribute('aria-pressed')})`);
  assert(soundAria.on === false && soundAria.home === 'false' && soundAria.battle === 'false',
    `aria-pressed của nút âm thanh khớp trạng thái ngay khi tải (${soundAria.home}/${soundAria.battle})`);
  await evaluate(`GameStorage.updateSettings({sound:true})`);

  // Sudoku vẽ lại TỪNG PHẦN khi đổi ô chọn; bỏ sót ô đang giữ tab stop là có HAI ô tabIndex=0.
  await evaluate(`openSudokuGame();startSudoku('beginner')`);
  await sleep(500);
  const tabStops = await evaluate(`(()=>{
    const count=()=>[...document.querySelectorAll('#sudokuBoard .sudoku-cell')].filter(c=>c.tabIndex===0).length;
    const seen=[count()];
    for(const i of [0,40,80,4,44,13,72]){document.querySelector('#sudokuBoard [data-index="'+i+'"]').click();seen.push(count())}
    return seen})()`);
  assert(tabStops.every(n => n === 1), `Bàn Sudoku luôn đúng một tab stop qua ${tabStops.length} lần chọn [${tabStops}]`);

  // Khép xong hàng/cột/khối phải có phản hồi; trước đây hoàn toàn im lặng.
  const unitClear = await evaluate(`(async()=>{
    const cells=[...document.querySelectorAll('#sudokuBoard .sudoku-cell')];
    const grid=cells.map(c=>{const v=c.querySelector('.sudoku-value');return v?+v.textContent:0});
    const res=SudokuGame.solveGrid(grid,1);
    if(!res.solution) return {ok:false};
    const trong=[];for(let i=0;i<9;i++) if(!grid[i]) trong.push(i);
    for(const i of trong){cells[i].click();sudokuInput(res.solution[i]);await new Promise(r=>setTimeout(r,60))}
    await new Promise(r=>setTimeout(r,80));
    return {ok:true,sang:document.querySelectorAll('.sudoku-cell.unit-clear').length}})()`);
  assert(unitClear.ok && unitClear.sang === 9, `Khép xong một nhóm 9 ô thì cả 9 ô sáng lên (${unitClear.sang})`);
  await evaluate(`goHome()`); await sleep(300);

  // state.fieldH chỉ ghi trong laneLayout() (chạy MỘT lần lúc vào ván). Không đo lại khi đổi
  // cỡ cửa sổ thì đường bay của chưởng lệch hẳn — đo được 92,8px ở bản chưa vá.
  await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate(`openTypingGame()`); await sleep(300);
  await evaluate(`startTypingRun({lang:'vi',difficulty:'slow',accentAssist:false})`);
  for (let i = 0; i < 40; i++) { if (await evaluate(`document.querySelectorAll('.typing-monster').length`)) break; await sleep(250); }
  await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 560, deviceScaleFactor: 1, mobile: false });
  await sleep(800);
  const spell = await evaluate(`(()=>{
    const field=document.getElementById('typingField'), m=document.querySelector('.typing-monster');
    if(!m) return {err:'khong con quai'};
    const topPct=parseFloat(m.style.top);
    const input=document.getElementById('typingInput');
    input.value=(m.querySelector('.monster-word')?.textContent||'').trim();
    input.dispatchEvent(new Event('input',{bubbles:true}));
    const s=document.querySelector('.typing-spell');
    if(!s) return {err:'khong tung duoc phep'};
    const kf=s.getAnimations()[0]?.effect?.getKeyframes()||[];
    const tf=kf[kf.length-1]?.transform||s.style.transform||'';
    const mm=/translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(tf);
    return {dy:mm?parseFloat(mm[2]):null, dung:((topPct-78)/100)*field.clientHeight}})()`);
  assert(!spell.err && Math.abs(spell.dy - spell.dung) < 3,
    spell.err ? `Đường bay chưởng: ${spell.err}`
              : `Đường bay chưởng bám chiều cao sân MỚI sau khi đổi cỡ (lệch ${Math.abs(spell.dy - spell.dung).toFixed(1)}px)`);
  await evaluate(`goHome()`); await sleep(300);

  // Baloo 2 có chữ số rộng KHÔNG đều (đo được 7,88–12,13px) nên số liệu phải dùng tabular-nums.
  await evaluate(`showScreen('scoreEnd')`); await sleep(300);
  const tabular = await evaluate(`(()=>{const n=document.querySelector('.stat .num');
    const set=v=>[...document.querySelectorAll('.stat .num')].forEach(e=>e.textContent=v);
    set('1111'); const a=[...document.querySelectorAll('.stat')].map(s=>Math.round(s.getBoundingClientRect().width));
    set('8888'); const b=[...document.querySelectorAll('.stat')].map(s=>Math.round(s.getBoundingClientRect().width));
    return {variant:getComputedStyle(n).fontVariantNumeric, deu:JSON.stringify(a)===JSON.stringify(b)}})()`);
  assert(tabular.variant === 'tabular-nums' && tabular.deu, `Ô số liệu dùng chữ số đều bề ngang (${tabular.variant})`);

  /* ===== NHÂN VẬT =====
     Cả bộ test cũ (46 assertion) KHÔNG hề chạm tới một hình nhân vật nào, nên lỗi
     "boss biến mất hoàn toàn từ giai đoạn 2" vẫn xanh 46/46 trong lúc đang tồn tại.
     Năm assertion dưới đây ứng với năm lỗi thật đã tìm ra bằng ảnh chụp. */

  // Vỏ rỗng data-art phải được bootstrap bơm hình vào, nếu không sàn đấu trống trơn.
  const boms = await evaluate(`(()=>{const v=[...document.querySelectorAll('[data-art]')];
    return {tong:v.length, rong:v.filter(e=>!e.childElementCount).map(e=>e.id||e.dataset.art)}})()`);
  assert(boms.tong >= 4 && boms.rong.length === 0,
    boms.rong.length ? `Còn vỏ nhân vật rỗng: ${boms.rong.join(', ')}` : `Mọi vỏ nhân vật đều được bơm hình (${boms.tong})`);

  // LỖI THẬT: boss.textContent='🐛' xoá sạch nút con của <svg> → boss biến mất hẳn
  // phần còn lại của phiên (font-size:0 nên emoji thay thế cũng vô hình).
  await evaluate(`goHome();localStorage.clear();startAdventure();beginBattle()`); await sleep(500);
  const truoc = await evaluate(`document.getElementById('bossSprite').style.getPropertyValue('--c-body')`);
  await evaluate(`G.bossHp=Math.floor(G.bossMaxHp*0.3);checkPhase2()`); await sleep(900);
  const sau = await evaluate(`(()=>{const el=document.getElementById('bossSprite');
    return {con:el.childElementCount, mau:el.style.getPropertyValue('--c-body'), rage:el.classList.contains('phase2')}})()`);
  assert(sau.con > 0 && sau.rage && sau.mau !== truoc,
    `Boss vẫn còn hình sau khi vào giai đoạn 2 (${sau.con} nút, màu ${truoc}→${sau.mau})`);

  // Cùng một lỗi ở chế độ Sinh tồn (survAdvance).
  await evaluate(`goHome();startSurvival()`); await sleep(400);
  await evaluate(`survAdvance()`); await sleep(700);
  const sinhTon = await evaluate(`document.getElementById('bossSprite').childElementCount`);
  assert(sinhTon > 0, `Boss vẫn còn hình sau khi Sinh tồn đổi quái (${sinhTon} nút)`);

  // LỖI THẬT: main.css giấu .chr-horns mà quên .chr-spikes, nên boss "chưa mọc sừng"
  // vẫn còn ba cái gai trên đầu — trong khi Gõ Chữ giấu cả hai.
  await evaluate(`goHome();G.bossIndex=0;beginBattle()`); await sleep(500);
  const gai = await evaluate(`(()=>{const el=document.getElementById('bossSprite');
    if(!el.classList.contains('no-horns'))return {bo:true};
    return {sung:getComputedStyle(el.querySelector('.chr-horns')).display,
            gai:getComputedStyle(el.querySelector('.chr-spikes')).display}})()`);
  assert(gai.bo || (gai.sung === 'none' && gai.gai === 'none'),
    `Boss không sừng thì giấu cả gai (sừng ${gai.sung}, gai ${gai.gai})`);

  // LỖI THẬT: màn giới thiệu vẽ emoji 🐌 trong khi sàn đấu vẽ một con quái khác hẳn.
  await evaluate(`goHome();startAdventure()`); await sleep(400);
  const gioiThieu = await evaluate(`(()=>{const art=document.querySelector('#introEmoji>svg.beast-art');
    if(!art)return {co:false};
    return {co:true, mau:art.style.getPropertyValue('--c-body'), boss:BOSS_ART[G.bossIndex].body}})()`);
  assert(gioiThieu.co && gioiThieu.mau === gioiThieu.boss,
    `Màn giới thiệu vẽ đúng con quái sắp gặp (${gioiThieu.mau})`);
  await evaluate(`goHome()`); await sleep(300);

  /* ===== MODAL ỦNG HỘ & GÓP Ý ===== */

  // Mở/đóng đúng, có QR thật, và Escape dùng chung (bootstrap.js) không đụng tới
  // hành vi đặc thù của restartModal (giữ nguyên: Escape ở đó gọi closeRestart()).
  await evaluate(`goHome();openInfoModal()`); await sleep(200);
  const infoOpen = await evaluate(`(()=>{
    const m=document.getElementById('infoModal');
    const qr=m.querySelector('.info-qr');
    return {on:m.classList.contains('on'), ariaHidden:m.getAttribute('aria-hidden'), hasQr:Boolean(qr), qrSrc:qr?.getAttribute('src')};
  })()`);
  assert(infoOpen.on && infoOpen.ariaHidden === 'false' && infoOpen.hasQr && infoOpen.qrSrc.includes('donate-qr.jpg'),
    `Modal Ủng hộ mở đúng, có mã QR (${infoOpen.qrSrc})`);
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`); await sleep(150);
  const infoClosed = await evaluate(`(()=>{const m=document.getElementById('infoModal');
    return {on:m.classList.contains('on'), ariaHidden:m.getAttribute('aria-hidden')};
  })()`);
  assert(!infoClosed.on && infoClosed.ariaHidden === 'true', 'Escape đóng modal Ủng hộ (dùng chung cơ chế modal)');

  // LỖI THẬT: <a class="btn"> là inline; email/URL đủ dài để xuống dòng ở màn hẹp,
  // và Chrome vẽ RỜI border/box-shadow theo từng đoạn dòng cho phần tử inline đa
  // dòng (icon trông như trôi ra ngoài khung). .info-link phải là flex/block nên
  // luôn có ĐÚNG 1 hộp bao quanh dù chữ có xuống mấy dòng.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await evaluate(`openInfoModal()`); await sleep(200);
  const linkFragments = await evaluate(`[...document.querySelectorAll('.info-link')].map(a => a.getClientRects().length)`);
  await evaluate(`closeInfoModal()`);
  await send('Emulation.clearDeviceMetricsOverride');
  assert(linkFragments.length === 2 && linkFragments.every(n => n === 1),
    `Nút email/GitHub trong modal Ủng hộ không bị vỡ khung khi chữ xuống dòng (${linkFragments.join(',')} mảnh)`);

  await evaluate(`startAdventure();beginBattle();askRestart()`); await sleep(300);
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`); await sleep(150);
  const restartClosed = await evaluate(`!document.getElementById('restartModal').classList.contains('on')`);
  assert(restartClosed, 'Escape vẫn đóng đúng restartModal (hành vi riêng closeRestart giữ nguyên sau khi tổng quát hoá modal)');
  await evaluate(`goHome()`); await sleep(200);

  /* ===== ĐẤU ĐỐI KHÁNG & NIM MISÈRE (2 người cùng máy) ===== */

  // LỖI THẬT (báo bởi người dùng): openDuelGame()/openNimGame() dựng sẵn màn setup
  // (setSections('setup')) nhưng QUÊN gọi safeShowScreen(...) — hàm chạy không lỗi,
  // #duelSetup/#nimSetup hết hidden, nhưng `.screen.active` VẪN LÀ #home nên người
  // chơi bấm vào tile không thấy gì xảy ra. Mọi assertion trước đó chỉ gọi thẳng hàm
  // qua evaluate() và đọc trạng thái/DOM (querySelector thấy được cả phần tử trong
  // màn KHÔNG active), nên không phát hiện được lỗi này — phải bấm CHUỘT THẬT vào
  // đúng tile trên trang chủ như người dùng thật mới lộ ra.
  await evaluate(`goHome()`); await sleep(200);
  for (const [tileClass, wantScreen] of [['duel-mode', 'duelGame'], ['nim-mode', 'nimGame']]) {
    const point = await evaluate(`(()=>{
      const r=document.querySelector('.${tileClass}').getBoundingClientRect();
      return {x:r.left+r.width/2, y:r.top+r.height/2};
    })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await sleep(300);
    const activeScreen = await evaluate(`document.querySelector('.screen.active')?.id`);
    assert(activeScreen === wantScreen,
      `Bấm chuột thật vào tile "${tileClass}" trên trang chủ mở đúng màn (được: ${activeScreen})`);
    await evaluate(`goHome()`); await sleep(200);
  }

  // Custom nhân vật: nút ◀▶ phải thực sự đổi màu qua applySkin(), không chỉ bấm cho vui.
  await evaluate(`goHome();openDuelGame()`); await sleep(300);
  assert(await evaluate(`document.querySelector('.screen.active')?.id`) === 'duelGame',
    'openDuelGame() chuyển đúng sang màn #duelGame (không chỉ dựng nội dung ngầm)');
  // LỖI THẬT: thuộc tính `hidden` vẫn đúng (kiểm bằng .hidden luôn xanh) trong khi
  // CSS khác đã âm thầm đè display:none của nó, khiến 2 section HIỆN CHỒNG LÊN
  // NHAU. Phải đo bằng getBoundingClientRect (kết quả CSS thật sự vẽ ra), không
  // phải đọc lại chính thuộc tính vừa đặt.
  const duelSectionVis = await evaluate(`({
    setup: document.getElementById('duelSetup').getBoundingClientRect().height > 0,
    play: document.getElementById('duelPlay').getBoundingClientRect().height > 0,
    result: document.getElementById('duelResult').getBoundingClientRect().height > 0,
  })`);
  assert(duelSectionVis.setup && !duelSectionVis.play && !duelSectionVis.result,
    `Chỉ #duelSetup thật sự hiển thị lúc mở màn (đo bằng bounding rect, không phải thuộc tính hidden): ${JSON.stringify(duelSectionVis)}`);
  const duelSkin = await evaluate(`(()=>{
    const svg=document.getElementById('duelSkinPreview1');
    const before=svg.style.getPropertyValue('--c-body');
    cycleDuelSkin(1,1);
    return {before, after:svg.style.getPropertyValue('--c-body')};
  })()`);
  assert(Boolean(duelSkin.before) && Boolean(duelSkin.after) && duelSkin.before !== duelSkin.after,
    `Đổi nhân vật Đấu Đối Kháng thực sự đổi màu (${duelSkin.before} → ${duelSkin.after})`);

  // LỖI THẬT: mặc định flex-shrink:1 từng cho phép #duelQbox bị NÉN THẤP HƠN nội
  // dung của nó khi câu hỏi dài 3 dòng — chữ tràn ra ngoài khung, đè lên "Đến lượt
  // X" phía trên và 4 nút đáp án phía dưới. Ép một câu hỏi dài để dựng lại đúng
  // tình huống đó, rồi khẳng định chữ câu hỏi luôn nằm TRỌN trong khung của nó.
  await evaluate(`startDuel();document.getElementById('duelQuestionTxt').textContent=
    'Một hồ tròn có chu vi 120 m. Cứ cách 6 m trồng 1 cây liễu; giữa hai cây liễu liên tiếp trồng 2 cây hoa hồng. Có tất cả bao nhiêu cây hoa hồng?';`);
  await sleep(200);
  const qboxFit = await evaluate(`(()=>{
    const box=document.getElementById('duelQbox').getBoundingClientRect();
    const txt=document.getElementById('duelQuestionTxt').getBoundingClientRect();
    return {top: txt.top>=box.top-1, bottom: txt.bottom<=box.bottom+1};
  })()`);
  assert(qboxFit.top && qboxFit.bottom,
    `Câu hỏi dài không tràn ra ngoài khung #duelQbox (${JSON.stringify(qboxFit)})`);

  // LỖI THẬT (báo bởi người dùng): xếp đấu trường+câu hỏi+4 đáp án CHỒNG DỌC một
  // cột từng đẩy nút đáp án cuối xuống DƯỚI mép 768px — về mặt DOM/logic hoàn
  // toàn bình thường (mọi assertion gọi .click() trực tiếp qua JS vẫn xanh), chỉ
  // lộ ra khi bấm CHUỘT THẬT vào đúng toạ độ trên màn 1366×768. Kiểm tra bằng
  // elementFromPoint (đúng cách trình duyệt tra "cái gì nằm ở điểm này") rồi mới
  // bấm — không phải gọi .click() bỏ qua hoàn toàn bước tra toạ độ.
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await evaluate(`goHome();openDuelGame();startDuel();`); await sleep(300);
  const clickCheck = await evaluate(`(()=>{
    const btns=[...document.querySelectorAll('#duelAnswers .ans')];
    return btns.map(b=>{
      const r=b.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      return {cy, insideViewport: cy>0 && cy<innerHeight, atPoint: document.elementFromPoint(cx,cy)===b};
    });
  })()`);
  assert(clickCheck.every((c) => c.insideViewport && c.atPoint),
    `Cả 4 nút đáp án Đấu Đối Kháng nằm trong khung nhìn 1366×768 và bấm trúng đúng nút (${JSON.stringify(clickCheck)})`);
  const firstBtn = await evaluate(`(()=>{const r=document.querySelector('#duelAnswers .ans').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  const qBefore = await evaluate(`document.getElementById('duelQuestionTxt').textContent`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: firstBtn.x, y: firstBtn.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: firstBtn.x, y: firstBtn.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: firstBtn.x, y: firstBtn.y, button: 'left', clickCount: 1 });
  await sleep(1600);
  const qAfter = await evaluate(`document.getElementById('duelQuestionTxt').textContent`);
  assert(qAfter && qAfter !== qBefore,
    `Bấm chuột thật vào đáp án Đấu Đối Kháng chuyển sang câu hỏi kế tiếp (trước: "${qBefore.slice(0, 30)}…", sau: "${qAfter.slice(0, 30)}…")`);
  await send('Emulation.clearDeviceMetricsOverride');
  await evaluate(`goHome()`); await sleep(200);

  // Hết máu thì đúng người thắng được xướng tên. Tier 5 + luôn trả lời đúng cho cả
  // hai lượt ⇒ người chơi 2 (bị đánh ở lượt CHẴN, tính từ lượt 0) luôn hết máu
  // trước người chơi 1 một lượt — kết quả xác định, không phải may rủi.

  /* ===== LUẬT KỸ NĂNG: số học phải ĐÚNG CHÍNH XÁC =====
     Sát thương gốc tier 2 = 20 + 2×3 = 26. Giáp nhận 70% ⇒ 18. Hút máu hồi nửa
     sát thương vừa gây. Sai thì KHÔNG mất máu và mất combo.
     LỖI THẬT đã bắt được bằng bài này: renderHp() từng chạy TRƯỚC lúc cộng máu
     hút/hồi, nên thanh máu không bao giờ nhích lên dù dòng chữ khoe "+18 máu". */
  const danhMotDon = `(()=>{
    const ans=DuelGame.currentAnswer();
    const b=[...document.querySelectorAll('#duelAnswers .ans')].find(x=>isCorrectAnswer(x.textContent,ans));
    if(b)b.click(); return Boolean(b);
  })()`;
  await evaluate(`goHome();openDuelGame();
    document.getElementById('duelSkill1').value='drain';
    document.getElementById('duelSkill2').value='armor';
    document.getElementById('duelTier').value='2';
    startDuel();`);
  await sleep(300);
  await evaluate(danhMotDon); await sleep(1700);          // P1 (hút máu) đánh P2 (giáp)
  const donGiap = await evaluate(`+document.getElementById('duelHpTxt2').textContent`);
  await evaluate(danhMotDon); await sleep(1700);          // P2 đánh P1 — P1 không có giáp
  const donThuong = await evaluate(`+document.getElementById('duelHpTxt1').textContent`);
  await evaluate(danhMotDon); await sleep(1700);          // P1 đánh tiếp → phải HÚT được máu
  const sauHutMau = await evaluate(`+document.getElementById('duelHpTxt1').textContent`);
  assert(donGiap === 82 && donThuong === 74 && sauHutMau > donThuong,
    `Kỹ năng đúng số học: giáp chặn 26→18 (còn ${donGiap}/100), không giáp ăn đủ 26 (còn ${donThuong}/100), hút máu hồi được (${donThuong}→${sauHutMau})`);

  // Trả lời SAI: không mất máu, và combo của người vừa sai bị xoá.
  const truocSai = await evaluate(`+document.getElementById('duelHpTxt1').textContent`);
  await evaluate(`(()=>{
    const ans=DuelGame.currentAnswer();
    const b=[...document.querySelectorAll('#duelAnswers .ans')].find(x=>!isCorrectAnswer(x.textContent,ans));
    if(b)b.click();
  })()`);
  await sleep(1500);
  const sauSai = await evaluate(`({hp1:+document.getElementById('duelHpTxt1').textContent,
    combo2:document.getElementById('duelCombo2').textContent.trim()})`);
  assert(sauSai.hp1 === truocSai && sauSai.combo2 === '',
    `Trả lời sai thì không mất máu (${truocSai}→${sauSai.hp1}) và mất combo (combo2="${sauSai.combo2}")`);

  await evaluate(`goHome();openDuelGame();
    document.getElementById('duelName1').value='Rồng';
    document.getElementById('duelName2').value='Hổ';
    document.getElementById('duelSkill1').value='drain';
    document.getElementById('duelSkill2').value='drain';
    document.getElementById('duelTier').value='5';
    startDuel();`);
  await sleep(300);
  let duelDone = false;
  for (let round = 0; round < 8 && !duelDone; round++) {
    await evaluate(`(()=>{
      const ans=DuelGame.currentAnswer();
      const btn=[...document.querySelectorAll('#duelAnswers .ans')].find(b=>isCorrectAnswer(b.textContent, ans));
      if(btn)btn.click();
    })()`);
    await sleep(1500);
    duelDone = await evaluate(`!document.getElementById('duelResult').hidden`);
  }
  const duelResult = await evaluate(`({
    done: !document.getElementById('duelResult').hidden,
    title: document.getElementById('duelResultTitle').textContent,
  })`);
  assert(duelResult.done && duelResult.title.includes('Rồng') && !duelResult.title.includes('Hổ'),
    `Đấu Đối Kháng: hết máu thì đúng người thắng được xướng tên (${duelResult.title})`);
  await evaluate(`goHome()`); await sleep(300);

  // LUẬT MISÈRE, không phải Nim thường: dồn bàn về còn đúng 1 viên rồi để người
  // đang tới lượt bấm lấy nó — người VỪA BẤM phải thua, đối thủ phải thắng. Nếu lỡ
  // cài ngược thành Nim thường thì assertion này đỏ ngay (đối chứng âm rõ ràng).
  await evaluate(`goHome();openNimGame();
    document.getElementById('nimName1').value='An';
    document.getElementById('nimName2').value='Bình';
    document.getElementById('nimPreset').value='small';
    startNim();`);
  await sleep(300);
  const nimSectionVis = await evaluate(`({
    setup: document.getElementById('nimSetup').getBoundingClientRect().height > 0,
    play: document.getElementById('nimPlay').getBoundingClientRect().height > 0,
    result: document.getElementById('nimResult').getBoundingClientRect().height > 0,
  })`);
  assert(!nimSectionVis.setup && nimSectionVis.play && !nimSectionVis.result,
    `Chỉ #nimPlay thật sự hiển thị sau startNim() (đo bằng bounding rect, không phải thuộc tính hidden): ${JSON.stringify(nimSectionVis)}`);
  const nimReduce = await evaluate(`(()=>{
    // Hàng đã hết vẫn nằm lại trong DOM (giữ chỗ cho bố cục đứng yên), nên
    // .nim-pile đầu tiên có thể RỖNG — không lấy nó làm mốc được. Bấm viên sỏi
    // CUỐI CÙNG trong toàn bộ tài liệu: nó luôn là viên cuối của một hàng còn
    // sỏi, và bấm viên cuối hàng thì chỉ lấy đúng 1 viên ⇒ giảm dần chắc chắn.
    let guard=0;
    while(document.querySelectorAll('.nim-stone').length>1 && guard<60){
      const stones=document.querySelectorAll('.nim-stone');
      stones[stones.length-1].click();
      guard+=1;
    }
    const lastStone=document.querySelector('.nim-stone.last-stone');
    const turnBefore=document.getElementById('nimTurnTxt').textContent;
    const total=document.querySelectorAll('.nim-stone').length;
    if(!lastStone||total!==1)return {ok:false,total,turnBefore};
    lastStone.click();
    return {ok:true, turnBefore, resultTitle:document.getElementById('nimResultTitle').textContent};
  })()`);
  const nimActor = nimReduce.ok && nimReduce.turnBefore.includes('An') ? 'An' : 'Bình';
  const nimExpectedWinner = nimActor === 'An' ? 'Bình' : 'An';
  assert(nimReduce.ok && nimReduce.resultTitle.includes(nimExpectedWinner) && !nimReduce.resultTitle.includes(nimActor),
    nimReduce.ok
      ? `Nim Misère: ${nimActor} bấm viên cuối phải thua, ${nimExpectedWinner} phải thắng (kết quả: ${nimReduce.resultTitle})`
      : `Nim: không dựng được trạng thái còn 1 viên để kiểm tra (total=${nimReduce.total})`);
  await evaluate(`goHome()`); await sleep(300);

  // Game desktop: mọi màn gói trong MỘT khung, khung ngoài không bao giờ cuộn.
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await evaluate(`goHome()`); await sleep(400);
  const manHinh = [['Trang chủ', `showScreen('home')`], ['Đấu trường', `startAdventure();beginBattle()`],
    ['Cửa hàng', `openShop('intro')`], ['Gõ chữ', `goHome();openTypingGame()`],
    ['Sudoku', `goHome();openSudokuGame();startSudoku('beginner')`],
    ['Đấu Đối Kháng (setup)', `goHome();openDuelGame()`],
    /* Màn setup gọn, ít nội dung — không phải màn từng vỡ (đấu trường+câu hỏi+4
       đáp án chồng dọc tràn khỏi 768px). Phải kiểm màn PLAY thật sự mới bắt được. */
    ['Đấu Đối Kháng (play)', `goHome();openDuelGame();startDuel()`],
    ['Nim Misère (setup)', `goHome();openNimGame()`],
    ['Nim Misère (play)', `goHome();openNimGame();startNim()`]];
  const tran = [];
  for (const [ten, setup] of manHinh) {
    await evaluate(setup); await sleep(500);
    const d = await evaluate(`(()=>{const el=document.documentElement,b=document.body;
      const sh=Math.max(el.scrollHeight,b.scrollHeight);
      const c=document.querySelector('.screen.active>.card,.screen.active>.game-card');
      return {trang:Math.max(0,sh-innerHeight), the:c?Math.max(0,c.scrollHeight-c.clientHeight):0}})()`);
    if (d.trang > 1 || d.the > 1) tran.push(`${ten}(trang ${d.trang}px, thẻ ${d.the}px)`);
  }
  assert(tran.length === 0, tran.length ? `Có màn phải cuộn: ${tran.join(', ')}` : `Cả ${manHinh.length} màn gói gọn trong một khung 1366×768`);
  await send('Emulation.clearDeviceMetricsOverride');
  await evaluate(`goHome()`); await sleep(300);

  /* ===== ĐỘ PHÂN GIẢI HD → 8K =====
     LỖI THẬT: mọi bề ngang ≥2400px từng dùng chung MỘT bộ giá trị cố định, nên
     trên 4K khung game chỉ chiếm 37% bề ngang, trên 8K còn 18% — không assertion
     nào phát hiện vì trang vẫn "không phải cuộn". Ở đây kiểm CẢ HAI chiều: không
     tràn/không cuộn, VÀ khung phải thực sự lấp được phần lớn bề ngang. */
  const doPhanGiai = [['FHD',1920,1080],['QHD',2560,1440],['4K',3840,2160],['8K',7680,4320]];
  const loiPhanGiai = [];
  for (const [ten, w, h] of doPhanGiai) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    for (const [manTen, setup] of [['trang chủ', `goHome()`],
      ['đối kháng', `goHome();openDuelGame();startDuel()`],
      ['nim', `goHome();openNimGame();startNim()`]]) {
      await evaluate(setup); await sleep(420);
      const d = await evaluate(`(()=>{
        const el=document.documentElement,b=document.body;
        const c=document.querySelector('.screen.active>.card,.screen.active>.game-card');
        const stones=[...document.querySelectorAll('.nim-stone')];
        const ans=document.querySelector('.screen.active')?.id==='duelGame'
          ? [...document.querySelectorAll('#duelAnswers .ans')] : [];
        return {
          tranNgang:Math.max(0,Math.max(el.scrollWidth,b.scrollWidth)-innerWidth),
          cuonDoc:Math.max(0,Math.max(el.scrollHeight,b.scrollHeight)-innerHeight),
          lapDay:c?Math.round(c.getBoundingClientRect().width/innerWidth*100):0,
          soiTran:stones.some(s=>{const r=s.getBoundingClientRect();
            return r.right>innerWidth+1||r.bottom>innerHeight+1||r.top<-1}),
          dapAnLoi:ans.length?ans.some(a=>{const r=a.getBoundingClientRect();
            const cx=r.left+r.width/2,cy=r.top+r.height/2;
            return cy<=0||cy>=innerHeight||document.elementFromPoint(cx,cy)!==a}):false,
        };
      })()`);
      if (d.tranNgang > 1 || d.cuonDoc > 1) loiPhanGiai.push(`${ten}/${manTen}: tràn ${d.tranNgang}px ngang, ${d.cuonDoc}px dọc`);
      if (d.lapDay < 50) loiPhanGiai.push(`${ten}/${manTen}: khung chỉ lấp ${d.lapDay}% bề ngang`);
      if (d.soiTran) loiPhanGiai.push(`${ten}/${manTen}: sỏi Nim tràn khỏi khung nhìn`);
      if (d.dapAnLoi) loiPhanGiai.push(`${ten}/${manTen}: nút đáp án nằm ngoài khung hoặc bị che`);
    }
  }
  await send('Emulation.clearDeviceMetricsOverride');
  await evaluate(`goHome()`); await sleep(300);
  assert(loiPhanGiai.length === 0, loiPhanGiai.length
    ? `Lỗi độ phân giải: ${loiPhanGiai.join(' | ')}`
    : `Bố cục dùng tốt cả 4 mốc FHD/QHD/4K/8K (không tràn, khung lấp ≥50% bề ngang)`);

  /* LỖI THẬT (người dùng báo): nút "🏠 Trang chủ" có CHỮ bên trong nhưng bị quy
     tắc .icon-btn ép về ô vuông cố định ở màn ≥2400px ⇒ chữ tràn khỏi nút và đè
     lên tiêu đề. Đo scrollWidth > clientWidth (nội dung rộng hơn khung) và mép
     phải của nút so với mép trái tiêu đề — cả 4 màn học tập, 5 mốc phân giải. */
  const loiTopbar = [];
  for (const [tenRes, w, h] of [['HD',1366,768],['FHD',1920,1080],['QHD',2560,1440],['4K',3840,2160],['8K',7680,4320]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    for (const [tenMan, moMan] of [['Gõ Chữ', `openTypingGame()`], ['Sudoku', `openSudokuGame()`],
      ['Đối Kháng', `openDuelGame()`], ['Nim', `openNimGame()`]]) {
      await evaluate(`goHome();${moMan}`); await sleep(320);
      const d = await evaluate(`(()=>{
        const bar=document.querySelector('.screen.active .game-topbar');
        const btn=bar.querySelector('.home-btn'), title=bar.querySelector('h1');
        const b=btn.getBoundingClientRect(), t=title.getBoundingClientRect();
        return {tranChu:btn.scrollWidth>btn.clientWidth+1, deLen:Math.round(b.right)>Math.round(t.left)};
      })()`);
      if (d.tranChu) loiTopbar.push(`${tenRes}/${tenMan}: chữ tràn khỏi nút Trang chủ`);
      if (d.deLen) loiTopbar.push(`${tenRes}/${tenMan}: nút Trang chủ đè lên tiêu đề`);
    }
  }
  await send('Emulation.clearDeviceMetricsOverride');
  await evaluate(`goHome()`); await sleep(300);
  assert(loiTopbar.length === 0, loiTopbar.length
    ? `Lỗi thanh tiêu đề: ${loiTopbar.join(' | ')}`
    : 'Nút Trang chủ không tràn chữ / không đè tiêu đề ở cả 4 màn × 5 mốc phân giải');

  /* Bộ câu đố kinh điển mới: mọi dạng phải có đáp án nằm TRONG danh sách lựa
     chọn và không có lựa chọn trùng nhau — sai một trong hai là câu hỏi không
     thể trả lời đúng được. */
  const famous = await evaluate(`(()=>{
    const kinds=new Set(); const loi=[];
    for(let tier=1;tier<=5;tier++)for(let i=0;i<200;i++){
      const q=genFamous(tier);
      kinds.add(q.q.slice(0,30));
      if(!Array.isArray(q.choices)||q.choices.length<3)loi.push('thiếu lựa chọn');
      else{
        if(!q.choices.map(String).includes(String(q.ans)))loi.push('đáp án không nằm trong lựa chọn: '+q.q.slice(0,30));
        if(new Set(q.choices.map(String)).size!==q.choices.length)loi.push('lựa chọn trùng: '+q.q.slice(0,30));
      }
      if(!q.exp)loi.push('thiếu lời giải: '+q.q.slice(0,30));
    }
    return {soDang:kinds.size,loi:[...new Set(loi)]};
  })()`);
  assert(famous.loi.length === 0 && famous.soDang >= 12,
    famous.loi.length ? `Câu đố kinh điển lỗi: ${famous.loi.join(' | ')}`
      : `${famous.soDang} biến thể câu đố kinh điển đều có đáp án đúng trong lựa chọn`);

  await sleep(500);
  assert(runtimeErrors.length === 0, runtimeErrors.length ? `Không lỗi runtime: ${runtimeErrors.join(' | ')}` : 'Không có lỗi JavaScript runtime');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
