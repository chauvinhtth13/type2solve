import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir, platform } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = fileURLToPath(new URL('../', import.meta.url));
const defaultChrome = platform() === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : (platform() === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome');
const chromePath = process.env.CHROME_PATH || defaultChrome;
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
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
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

  const lateOnly = process.env.DTTD_BROWSER_LATE === '1';
  const earlyOnly = process.env.DTTD_BROWSER_EARLY === '1';
  if (!lateOnly) {
  const home = await evaluate(`({
    active: document.querySelector('#home.active') !== null,
    modes: document.querySelectorAll('.learning-mode').length,
    api: ['openTypingGame','startTypingCampaign','resetTypingCampaign','openSudokuGame','startSudoku','checkSudoku','setAnswerMode','openDuelGame','startDuel','confirmDuelAlloc','useDuelUltimate','openNimGame','startNim','confirmNimTake','undoNimMove','openHanoiGame','startHanoi','toggleHanoiAutoSolve','undoHanoiMove'].every(name => typeof window[name] === 'function'),
    rules: [window.DuelRules, window.NimRules, window.HanoiRules].every(r => r && Object.isFrozen(r)),
    schema: GameStorage.load().version
  })`);
  assert(home.active, 'Trang chủ mở thành công');
  assert(home.modes === 5, 'Khu học tập có Gõ Chữ, Sudoku, Đấu Đối Kháng, Nim và Tháp Hà Nội');
  assert(home.rules, 'Tầng LUẬT thuần của cả ba game được phơi ra và đã đóng băng');
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
  /* ===== SỐ LẦN KIỂM TRA LỖI PHẢI CÓ HẠN =====
     Nút này từng dùng được vô hạn, nên cấp Tối thượng (17 ô, 0 gợi ý) phá được
     bằng vòng lặp mò: điền bừa → bấm kiểm tra → xem ô nào đỏ → sửa. Bài test
     dựng lại ĐÚNG vòng lặp đó và khẳng định nó bị chặn.  */
  const bacKiemTra = await evaluate(`(()=>{
    const L=SudokuGame.LEVELS;
    return SudokuGame.LEVEL_ORDER.map(m=>L[m].checks);
  })()`);
  assert(bacKiemTra.length === 6 && bacKiemTra.every((n, i) => i === 0 || n <= bacKiemTra[i - 1])
    && bacKiemTra[5] === 1,
    `Số lượt kiểm tra giảm dần theo cấp độ: [${bacKiemTra}]`);
  await evaluate(`goHome();openSudokuGame();startSudoku('ultimate')`);
  await sleep(500);
  const moBaiTuThuong = await evaluate(`(()=>{
    const conLai=+document.getElementById('sudokuChecks').textContent;
    /* Mo phong dung vong lap mo: dien bua mot o roi bam kiem tra, lap lai. */
    const lan=[];
    for(let i=0;i<4;i++){
      const o=[...document.querySelectorAll('#sudokuBoard .sudoku-cell')]
        .find(c=>!c.classList.contains('given') && !c.querySelector('.sudoku-value'));
      if(o){o.click(); sudokuInput((i%9)+1);}
      checkSudoku();
      lan.push({
        conLai:+document.getElementById('sudokuChecks').textContent,
        nutTat:document.getElementById('sudokuCheckBtn').disabled,
        nhan:document.getElementById('sudokuCheckBtn').textContent
      });
    }
    return {batDau:conLai, lan, phanHoi:document.getElementById('sudokuFeedback').textContent};
  })()`);
  assert(moBaiTuThuong.batDau === 1,
    `Cấp Tối thượng chỉ có ĐÚNG 1 lượt kiểm tra (được ${moBaiTuThuong.batDau})`);
  assert(moBaiTuThuong.lan.every((l) => l.conLai === 0),
    `Lượt kiểm tra bị TRỪ thật và không tụt xuống âm (${JSON.stringify(moBaiTuThuong.lan.map((l) => l.conLai))})`);
  assert(moBaiTuThuong.lan.every((l) => l.nutTat === true) && /Hết lượt/.test(moBaiTuThuong.lan[0].nhan),
    `Hết lượt thì nút bị KHOÁ và đổi nhãn ("${moBaiTuThuong.lan[0].nhan}") — vòng lặp mò bị chặn ngay từ lần thứ hai`);
  assert(/hết lượt kiểm tra/i.test(moBaiTuThuong.phanHoi),
    `Và nói rõ lý do thay vì im lặng: "${moBaiTuThuong.phanHoi.slice(0, 70)}"`);
  await evaluate(`goHome()`); await sleep(250);


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
  const sudokuCached = await evaluate(`Promise.all([
    caches.match(new URL('scripts/games/sudoku/index.js', location.href).href),
    caches.match(new URL('assets/app.js', location.href).href)
  ]).then(rows => rows.some(Boolean))`);
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
    /* Bàn được hoán vị ngẫu nhiên mỗi ván nên hàng 1 CÓ THỂ đã đủ 9 số sẵn —
       lúc đó không có ô nào để điền, không có hiệu ứng nào bật, và bài test đỏ
       oan. Chọn hàng đầu tiên THỰC SỰ còn ô trống. */
    let trong=[];
    for(let h=0;h<9&&!trong.length;h++){
      const hang=[];for(let c=0;c<9;c++){const i=h*9+c; if(!grid[i])hang.push(i);}
      trong=hang;
    }
    if(!trong.length) return {ok:false};
    for(const i of trong){cells[i].click();sudokuInput(res.solution[i]);await new Promise(r=>setTimeout(r,60))}
    await new Promise(r=>setTimeout(r,80));
    return {ok:true,sang:document.querySelectorAll('.sudoku-cell.unit-clear').length}})()`);
  /* >= 9 chứ không phải == 9: ô cuối cùng của một hàng có thể khép luôn cả cột
     và cả khối 3×3 cùng lúc — lúc đó sáng 18 hay 27 ô mới là ĐÚNG, không phải lỗi. */
  assert(unitClear.ok && unitClear.sang >= 9 && unitClear.sang % 9 === 0,
    `Khép xong một nhóm thì cả nhóm sáng lên, trọn bội số của 9 (${unitClear.sang} ô)`);
  await evaluate(`goHome()`); await sleep(300);

  // state.fieldH chỉ ghi trong laneLayout() (chạy MỘT lần lúc vào ván). Không đo lại khi đổi
  // cỡ cửa sổ thì đường bay của chưởng lệch hẳn — đo được 92,8px ở bản chưa vá.
  await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate(`openTypingGame()`); await sleep(300);
  // startTypingRun(stageIndex) KHÔNG nhận object cấu hình — nó luôn đọc lựa chọn
  // từ DOM qua getRunOptions(). Truyền {lang:'vi',...} như bản cũ là vô nghĩa,
  // ván vẫn chạy tiếng Anh. Muốn ép tiếng Việt thì phải tick đúng radio trước.
  await evaluate(`document.querySelector('input[name="typingLanguage"][value="vi"]').checked = true`);
  await evaluate(`startTypingRun()`);
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
  /* Nhân vật mới là SVG vector, nên kiểm các shape còn tồn tại và màu thân đổi
     khi vào phase2 thay vì đòi một thẻ <image> bitmap. */
  await evaluate(`goHome();localStorage.clear();startAdventure();beginBattle()`); await sleep(500);
  const truoc = await evaluate(`(()=>{const el=document.getElementById('bossSprite');return {
    hao:el.style.getPropertyValue('--c-aura'),mau:getComputedStyle(el.querySelector('.art-body')).fill}})()`);
  await evaluate(`G.bossHp=Math.floor(G.bossMaxHp*0.3);checkPhase2()`); await sleep(900);
  const sau = await evaluate(`(()=>{const el=document.getElementById('bossSprite');
    return {con:el.childElementCount,shape:el.querySelectorAll('.art-body,.art-eye,.art-mouth').length,
      hao:el.style.getPropertyValue('--c-aura'),mau:getComputedStyle(el.querySelector('.art-body')).fill,
      rage:el.classList.contains('phase2')}})()`);
  assert(sau.con > 0 && sau.shape >= 4 && sau.rage && sau.mau !== truoc.mau && sau.hao !== truoc.hao,
    `Boss vector vẫn còn hình sau phase2 (${sau.shape} shape, màu ${truoc.mau}→${sau.mau})`);

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

  // LỖI THẬT: màn giới thiệu vẽ đúng con quái sắp gặp
  await evaluate(`goHome();startAdventure()`); await sleep(400);
  const gioiThieu = await evaluate(`(()=>{const art=document.querySelector('#introEmoji>svg.beast-art')||document.querySelector('#introEmoji svg');
    if(!art)return {co:false};
    return {co:true,shape:art.querySelectorAll('.art-body,.art-eye,.art-mouth').length,
      mau:art.style.getPropertyValue('--art-main'),boss:ART_PALETTES[G.bossIndex][0]}})()`);
  assert(gioiThieu.co && gioiThieu.shape >= 4 && gioiThieu.mau === gioiThieu.boss,
    `Màn giới thiệu vẽ đúng quái vector sắp gặp (${gioiThieu.mau})`);
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
  }

  if (!earlyOnly) {
  /* ===== ĐẤU ĐỐI KHÁNG & NIM MISÈRE (2 người cùng máy) ===== */

  // LỖI THẬT (báo bởi người dùng): openDuelGame()/openNimGame() dựng sẵn màn setup
  // (setSections('setup')) nhưng QUÊN gọi safeShowScreen(...) — hàm chạy không lỗi,
  // #duelSetup/#nimSetup hết hidden, nhưng `.screen.active` VẪN LÀ #home nên người
  // chơi bấm vào tile không thấy gì xảy ra. Mọi assertion trước đó chỉ gọi thẳng hàm
  // qua evaluate() và đọc trạng thái/DOM (querySelector thấy được cả phần tử trong
  // màn KHÔNG active), nên không phát hiện được lỗi này — phải bấm CHUỘT THẬT vào
  // đúng tile trên trang chủ như người dùng thật mới lộ ra.
  // Trang chủ sau đợt tái thiết kế bento đã cao hơn 1 khung nhìn mặc định của
  // Chrome headless (viewport bị clearDeviceMetricsOverride phía trên) — tile
  // Đấu/Nim/Hanoi có thể nằm dưới lằn gấp. Người dùng thật sẽ cuộn tới rồi mới
  // bấm; scrollIntoView() trước khi đo toạ độ mô phỏng đúng việc đó.
  await evaluate(`goHome()`); await sleep(200);
  for (const [tileClass, wantScreen] of [['duel-mode', 'duelGame'], ['nim-mode', 'nimGame'], ['hanoi-mode', 'hanoiGame']]) {
    const point = await evaluate(`(()=>{
      const el=document.querySelector('.${tileClass}');
      el.scrollIntoView({behavior:'instant', block:'center'});
      const r=el.getBoundingClientRect();
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
    alloc: document.getElementById('duelAlloc').getBoundingClientRect().height > 0,
    play: document.getElementById('duelPlay').getBoundingClientRect().height > 0,
    result: document.getElementById('duelResult').getBoundingClientRect().height > 0,
  })`);
  assert(duelSectionVis.setup && !duelSectionVis.alloc && !duelSectionVis.play && !duelSectionVis.result,
    `Chỉ #duelSetup thật sự hiển thị lúc mở màn (đo bằng bounding rect, không phải thuộc tính hidden): ${JSON.stringify(duelSectionVis)}`);

  // Tên người chơi đi qua nhiều template innerHTML; chuỗi nhập phải luôn là text,
  // không được biến thành phần tử có event handler.
  await evaluate(`window.__duelXss=0;
    document.getElementById('duelName1').value='<img src=x onerror="window.__duelXss=1">';
    document.getElementById('duelName2').value='Bạn chơi';
    startDuel();`);
  await sleep(350);
  const duelNameSafety = await evaluate(`({
    fired:window.__duelXss,
    injected:document.querySelector('#duelAllocGrid img')!==null,
    literal:document.getElementById('duelAllocGrid').textContent.includes('<img src=x')
  })`);
  assert(duelNameSafety.fired === 0 && !duelNameSafety.injected && duelNameSafety.literal,
    `Tên người chơi được render như text, không thực thi HTML (${JSON.stringify(duelNameSafety)})`);
  await evaluate(`goHome();openDuelGame();
    document.getElementById('duelName1').value='';
    document.getElementById('duelName2').value='';`);

  /* ===== PHÂN BỔ 100 ĐIỂM CHỈ SỐ =====
     startDuel() KHÔNG vào thẳng trận nữa mà dừng ở màn chia điểm. Nút "vào trận"
     phải bị khoá cho tới khi CẢ HAI bên dùng hết điểm — nếu không, trẻ bấm nhầm
     là bước vào ván với chỉ số trống. */
  await evaluate(`startDuel()`); await sleep(250);
  const allocGate = await evaluate(`(()=>{
    const before = document.getElementById('duelAllocDone').disabled;
    const capText = document.getElementById('duelAllocCap').textContent;
    DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});
    DuelGame.setAllocForTest(1,{atk:20,def:40,hp:40});
    const snap = DuelGame.snapshot();
    return {before, capText,
      allocVisible: document.getElementById('duelAlloc').getBoundingClientRect().height > 0,
      playHidden: document.getElementById('duelPlay').getBoundingClientRect().height === 0,
      p0: snap.players[0].stats, p1: snap.players[1].stats};
  })()`);
  assert(allocGate.allocVisible && allocGate.playHidden,
    'startDuel() dừng ở màn chia điểm chứ không nhảy thẳng vào trận');
  assert(allocGate.before === true,
    'Nút "VÀO TRẬN" bị khoá khi chưa chia hết 100 điểm');
  assert(/50/.test(allocGate.capText),
    `Trần mỗi chỉ số là 50 điểm (một nửa của 100) — hiện: "${allocGate.capText}"`);
  // Quy đổi phải khớp đúng hằng số trong tầng LUẬT, không phải số ước chừng.
  const statMath = await evaluate(`(()=>{
    const R=DuelRules, a={atk:34,def:33,hp:33};
    const s=R.statsFrom(a);
    return {atk:s.atk, def:s.def, hp:s.maxHp,
      wantAtk:R.BASE.atk+34*R.PER_POINT.atk,
      wantDef:R.BASE.def+33*R.PER_POINT.def,
      wantHp:Math.round(R.BASE.hp+33*R.PER_POINT.hp)};
  })()`);
  assert(statMath.atk === statMath.wantAtk && statMath.def === statMath.wantDef && statMath.hp === statMath.wantHp,
    `Quy đổi điểm → chỉ số đúng công thức (ATK ${statMath.atk}, DEF ${statMath.def}, HP ${statMath.hp})`);
  // Kiểm tra ngoại lệ đầu vào: vượt trần / thừa điểm / số âm đều phải bị chặn.
  const allocGuards = await evaluate(`(()=>{
    const v=(a)=>DuelRules.validateAlloc(a,100,100).ok;
    return {good:v({atk:50,def:30,hp:20}), overCap:v({atk:60,def:20,hp:20}),
      leftover:v({atk:40,def:30,hp:20}), negative:v({atk:-5,def:60,hp:45}),
      fractional:v({atk:1.5,def:50,hp:48.5})};
  })()`);
  assert(allocGuards.good && !allocGuards.overCap && !allocGuards.leftover
    && !allocGuards.negative && !allocGuards.fractional,
    `Phân bổ điểm chặn đủ mọi đầu vào sai: ${JSON.stringify(allocGuards)}`);
  /* Skin vector đổi bộ màu theo spriteIndex; bấm ◀▶ phải cho ra màu khác. */
  const duelSkin = await evaluate(`(()=>{
    const svg=document.getElementById('duelSkinPreview1');
    const mau=()=>svg.style.getPropertyValue('--art-main');
    const before=mau();
    cycleDuelSkin(1,1);
    return {before, after:mau()};
  })()`);
  assert(Boolean(duelSkin.before) && Boolean(duelSkin.after) && duelSkin.before !== duelSkin.after,
    `Đổi nhân vật Đấu Đối Kháng thực sự đổi màu (${duelSkin.before} → ${duelSkin.after})`);

  // LỖI THẬT: mặc định flex-shrink:1 từng cho phép #duelQbox bị NÉN THẤP HƠN nội
  // dung của nó khi câu hỏi dài 3 dòng — chữ tràn ra ngoài khung, đè lên "Đến lượt
  // X" phía trên và 4 nút đáp án phía dưới. Ép một câu hỏi dài để dựng lại đúng
  // tình huống đó, rồi khẳng định chữ câu hỏi luôn nằm TRỌN trong khung của nó.
  await evaluate(`startDuel();DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});confirmDuelAlloc(); document.getElementById('duelQuestionTxt').textContent=
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
  await evaluate(`goHome();openDuelGame();startDuel();DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});confirmDuelAlloc();`); await sleep(300);
  const clickCheck = await evaluate(`(()=>{
    const btns=[...document.querySelectorAll('#duelAnswers .ans')];
    return btns.map(b=>{
      const r=b.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      return {cy, insideViewport: cy>0 && cy<innerHeight, atPoint: document.elementFromPoint(cx,cy)===b};
    });
  })()`);
  // `every` trên mảng RỖNG luôn true — phải chốt số lượng, nếu không bài test
  // vẫn xanh trong khi màn hình chẳng có nút đáp án nào.
  assert(clickCheck.length >= 4 && clickCheck.every((c) => c.insideViewport && c.atPoint),
    `Cả ${clickCheck.length} nút đáp án Đấu Đối Kháng nằm trong khung nhìn 1366×768 và bấm trúng đúng nút (${JSON.stringify(clickCheck)})`);
  const firstBtn = await evaluate(`(()=>{const r=document.querySelector('#duelAnswers .ans').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  const qBefore = await evaluate(`document.getElementById('duelQuestionTxt').textContent`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: firstBtn.x, y: firstBtn.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: firstBtn.x, y: firstBtn.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: firstBtn.x, y: firstBtn.y, button: 'left', clickCount: 1 });
  await sleep(1600);
  /* LUẬT MỚI: bấm đúng KHÔNG nhảy sang câu kế mà mở bảng 4 hành động; bấm sai
     thì mới mất lượt và đổi câu. Khẳng định đúng cả hai nhánh — assertion cũ
     ("luôn phải sang câu mới") nay đã sai với thiết kế. */
  const sauBamThat = await evaluate(`(()=>{
    const snap=DuelGame.snapshot();
    return {phase:snap.phase, q:document.getElementById('duelQuestionTxt').textContent,
      hanhDong:document.querySelectorAll('#duelActions .duel-action').length,
      hienHanhDong:document.getElementById('duelActions').getBoundingClientRect().height>0};
  })()`);
  const dungRoi = sauBamThat.phase === 'action';
  assert(dungRoi
    ? (sauBamThat.hienHanhDong && sauBamThat.hanhDong === 4 && sauBamThat.q === qBefore)
    : (sauBamThat.q && sauBamThat.q !== qBefore),
    dungRoi
      ? `Bấm chuột thật vào đáp án ĐÚNG mở ra 4 hành động, giữ nguyên câu hỏi (${sauBamThat.hanhDong} nút)`
      : `Bấm chuột thật vào đáp án SAI thì mất lượt và sang câu kế (trước: "${qBefore.slice(0, 26)}…", sau: "${sauBamThat.q.slice(0, 26)}…")`);
  await send('Emulation.clearDeviceMetricsOverride');
  await evaluate(`goHome()`); await sleep(200);

  /* ===== VÒNG LẶP LƯỢT ĐẤU: quiz → 4 hành động =====
     Luật đã đổi hẳn so với bản kỹ năng cũ: trả lời đúng KHÔNG tự tung đòn nữa mà
     mở ra 4 lựa chọn; trả lời sai thì mất lượt. Mỗi assertion dưới đây đối chiếu
     với đúng hằng số trong tầng LUẬT, không hard-code lại con số. */
  const vaoTran = `(()=>{
    startDuel();
    DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});
    DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});
    confirmDuelAlloc();
  })()`;
  const traLoiDung = `(()=>{
    const ans=DuelGame.currentAnswer();
    const b=[...document.querySelectorAll('#duelAnswers .ans')].find(x=>isCorrectAnswer(x.textContent,ans));
    if(b)b.click(); return Boolean(b);
  })()`;
  const traLoiSai = `(()=>{
    const ans=DuelGame.currentAnswer();
    const b=[...document.querySelectorAll('#duelAnswers .ans')].find(x=>!isCorrectAnswer(x.textContent,ans));
    if(b)b.click(); return Boolean(b);
  })()`;
  const bamHanhDong = id => `(()=>{
    const b=document.querySelector('#duelActions .act-${id}');
    if(b && !b.disabled){b.click();return true;} return false;
  })()`;

  await evaluate(`goHome();openDuelGame();
    document.getElementById('duelName1').value='Rồng';
    document.getElementById('duelName2').value='Hổ';
    document.getElementById('duelBestOf').value='1';
    document.getElementById('duelTier').value='2';`);
  await evaluate(vaoTran); await sleep(300);

  // Trả lời ĐÚNG phải mở bảng 4 hành động, KHÔNG tự đánh.
  await evaluate(traLoiDung); await sleep(250);
  const sauDung = await evaluate(`(()=>{
    const snap=DuelGame.snapshot();
    return {phase:snap.phase, hp1:snap.players[0].hp, hp2:snap.players[1].hp,
      actionsShown:document.getElementById('duelActions').getBoundingClientRect().height>0,
      soHanhDong:document.querySelectorAll('#duelActions .duel-action').length,
      answersHidden:document.getElementById('duelAnswers').getBoundingClientRect().height===0};
  })()`);
  assert(sauDung.phase === 'action' && sauDung.actionsShown && sauDung.soHanhDong === 4 && sauDung.answersHidden,
    `Trả lời đúng mở ra đúng 4 hành động và giấu bảng đáp án (${JSON.stringify(sauDung)})`);
  assert(sauDung.hp1 === sauDung.hp2,
    'Trả lời đúng CHƯA gây sát thương — phải chọn hành động trước');

  // Tấn công: sát thương phải khớp công thức giảm trừ, và cả hai bên đều dồn Nộ.
  const DuelRulesRage = await evaluate(`({...DuelRules.RAGE})`);
  const truocDanh = await evaluate(`DuelGame.snapshot()`);
  await evaluate(bamHanhDong('attack')); await sleep(1900);
  const sauDanh = await evaluate(`DuelGame.snapshot()`);
  const matMau = truocDanh.players[1].hp - sauDanh.players[1].hp;
  const duKienMin = await evaluate(`DuelRules.attackDamage(DuelRules.statsFrom({atk:34,def:33,hp:33}),DuelRules.statsFrom({atk:34,def:33,hp:33}),{roll:0,critRoll:1}).damage`);
  const duKienMax = await evaluate(`DuelRules.attackDamage(DuelRules.statsFrom({atk:34,def:33,hp:33}),DuelRules.statsFrom({atk:34,def:33,hp:33}),{roll:1,critRoll:0}).damage`);
  assert(matMau >= duKienMin && matMau <= duKienMax,
    `Tấn công gây ${matMau} sát thương, nằm đúng trong khoảng công thức cho phép ${duKienMin}–${duKienMax}`);
  /* Nộ khi đánh cố ý để THẤP (6) hơn nộ khi ăn đòn (12): nếu tấn công vừa gây
     sát thương vừa nạp đầy nộ thì "cứ bấm Tấn công" thắng mọi lối chơi khác. */
  assert(sauDanh.players[0].rage === DuelRulesRage.attack && sauDanh.players[1].rage === DuelRulesRage.hurt
    && DuelRulesRage.hurt > DuelRulesRage.attack,
    `Đánh trúng: người đánh +${sauDanh.players[0].rage} Nộ, người ăn đòn +${sauDanh.players[1].rage} Nộ — ăn đòn nạp NHANH HƠN, nên kẻ đang thua có đường lội ngược dòng`);
  assert(sauDanh.turn === 1, 'Xong hành động thì chuyển lượt cho đối thủ');

  // Phòng thủ: bật khiên, và khiên phải chặn ĐÚNG 50% đúng MỘT đòn rồi tắt.
  await evaluate(traLoiDung); await sleep(250);
  await evaluate(bamHanhDong('defend')); await sleep(1500);
  const sauThu = await evaluate(`DuelGame.snapshot()`);
  assert(sauThu.players[1].shield === true
    && sauThu.players[1].rage === DuelRulesRage.hurt + DuelRulesRage.defend,
    `Phòng thủ bật khiên và cộng ${DuelRulesRage.defend} Nộ (Nộ = ${sauThu.players[1].rage})`);

  /* ===== PHẢN ĐÒN: đánh vào người ĐANG THỦ thì bị dội ngược =====
     Không có cơ chế này thì Phòng thủ chỉ là "mất một lượt để chịu ít hơn" —
     tức là luôn lỗ, và không ai chọn. */
  const truocPhanDon = await evaluate(`DuelGame.snapshot()`);
  await evaluate(traLoiDung); await sleep(250);
  await evaluate(bamHanhDong('attack')); await sleep(2100);
  const sauXuyenKhien = await evaluate(`DuelGame.snapshot()`);
  const doiNguoc = truocPhanDon.players[0].hp - sauXuyenKhien.players[0].hp;
  assert(sauXuyenKhien.players[1].shield === false,
    'Khiên chỉ chặn đúng MỘT đòn rồi tắt, không giữ mãi');
  assert(doiNguoc > 0,
    `Đánh vào người đang thủ thì CHÍNH mình mất ${doiNguoc} máu vì bị dội ngược — thủ là một cái bẫy, không chỉ là chịu đòn`);
  const phanDonMath = await evaluate(`({
    share: DuelRules.RIPOSTE_SHARE,
    tu100: DuelRules.riposteDamage(100),
    day: DuelRules.chargeGain(300,300),
    canMau: DuelRules.chargeGain(60,300)
  })`);
  assert(phanDonMath.tu100 === Math.round(100 * phanDonMath.share),
    `Phản đòn dội lại đúng ${Math.round(phanDonMath.share * 100)}% chỗ khiên chặn được`);
  assert(phanDonMath.canMau > phanDonMath.day,
    `Tích nộ càng ít máu càng cộng nhiều: đầy máu +${phanDonMath.day}%, cạn máu +${phanDonMath.canMau}%`);

  // Hồi máu: đúng 16% máu tối đa và CÓ HẠN 3 lần mỗi ván (chốt chặn ván treo).
  const healRules = await evaluate(`({
    share: DuelRules.HEAL_SHARE,
    uses: DuelRules.HEAL_USES_PER_ROUND,
    amount: DuelRules.healAmount(300)
  })`);
  assert(healRules.uses === 3 && healRules.amount === Math.round(300 * healRules.share),
    `Hồi máu = ${Math.round(healRules.share * 100)}% máu tối đa và chỉ dùng được ${healRules.uses} lần mỗi ván`);

  // Tuyệt kỹ: đầy Nộ thì hiện nút, BỎ QUA câu hỏi, đánh mạnh hơn đòn thường và về 0 Nộ.
  const ultCheck = await evaluate(`(()=>{
    const R=DuelRules, st=R.statsFrom({atk:34,def:33,hp:33});
    const thuong=R.attackDamage(st,st,{roll:.5,critRoll:1}).damage;
    const tuyet=R.ultimateDamage(st,st).damage;
    return {thuong, tuyet, ty:tuyet/thuong, pierce:R.ULT_PIERCE, max:R.RAGE_MAX};
  })()`);
  assert(ultCheck.ty >= 2 && ultCheck.ty <= 2.6,
    `Tuyệt kỹ mạnh gấp ${ultCheck.ty.toFixed(2)}× đòn thường (${ultCheck.thuong}→${ultCheck.tuyet}) — đã tay nhưng không một phát chết`);

  /* ===== TUYỆT KỸ TRÊN GIAO DIỆN THẬT =====
     Phần luật đã kiểm bằng số ở trên; đây kiểm ĐƯỜNG ĐI THẬT của người chơi:
     đánh cho tới khi Nộ đầy 100 → nút phải HIỆN → bấm vào thì BỎ QUA câu hỏi,
     gây sát thương lớn hơn đòn thường và tiêu sạch Nộ. */
  await evaluate(`goHome();openDuelGame();document.getElementById('duelBestOf').value='1';
    document.getElementById('duelTier').value='1';`);
  await evaluate(`(()=>{
    startDuel();
    DuelGame.setAllocForTest(0,{atk:10,def:50,hp:40});
    DuelGame.setAllocForTest(1,{atk:10,def:50,hp:40});
    confirmDuelAlloc();
  })()`);
  await sleep(300);
  let noDay = false;
  for (let i = 0; i < 30 && !noDay; i++) {
    const daDung = await evaluate(traLoiDung);
    await sleep(240);
    if (daDung) { await evaluate(bamHanhDong('attack')); await sleep(1700); }
    else await sleep(900);
    noDay = await evaluate(`(()=>{const s=DuelGame.snapshot();
      return s.status==='running' && s.phase==='quiz' && s.players[s.turn].rage>=DuelRules.RAGE_MAX;})()`);
  }
  const ultUi = await evaluate(`(()=>{
    const s=DuelGame.snapshot();
    const btn=document.getElementById('duelUltBtn');
    return {rage:s.players[s.turn].rage, turn:s.turn,
      hienNut: !btn.hidden && btn.getBoundingClientRect().height>0,
      hpDoiThu:s.players[1-s.turn].hp,
      cauHoi:document.getElementById('duelQuestionTxt').textContent};
  })()`);
  assert(noDay && ultUi.rage === 100 && ultUi.hienNut,
    `Nộ đầy 100% thì nút TUYỆT KỸ hiện lên cho người đang tới lượt (Nộ = ${ultUi.rage})`);
  await evaluate(`document.getElementById('duelUltBtn').click()`);
  await sleep(2100);
  /* GHIM chỉ số người ra đòn từ trước, đừng suy ra từ s.turn sau đó: nếu tuyệt
     kỹ hạ gục luôn đối thủ thì ván kết thúc và lượt KHÔNG đổi, mọi phép "1-turn"
     lập tức trỏ nhầm sang người kia. */
  const sauUlt = await evaluate(`(()=>{
    const s=DuelGame.snapshot();
    const nguoiRaDon=${ultUi.turn};
    return {rage:s.players[nguoiRaDon].rage, hpDoiThu:s.players[1-nguoiRaDon].hp,
      cauHoi:document.getElementById('duelQuestionTxt').textContent,
      nutAn:document.getElementById('duelUltBtn').hidden};
  })()`);
  /* KHÔNG đo sức mạnh tuyệt kỹ bằng hiệu số máu: máu bị chặn ở 0 nên nếu đối
     thủ sắp chết thì phép trừ ra một con số nhỏ hơn sát thương thật và bài test
     đỏ oan. Độ lớn đã được khẳng định ở `ultCheck` bằng chính hàm luật; ở đây
     chỉ cần chắc đường đi UI có thật sự ra đòn. */
  const satThuongUlt = ultUi.hpDoiThu - sauUlt.hpDoiThu;
  assert(satThuongUlt > 0,
    `Bấm nút tuyệt kỹ thật sự ra đòn, đối thủ mất ${satThuongUlt} máu`);
  assert(sauUlt.rage === 0,
    `Dùng tuyệt kỹ tiêu sạch 100% Nộ (còn ${sauUlt.rage})`);
  assert(sauUlt.cauHoi !== ultUi.cauHoi || sauUlt.hpDoiThu === 0,
    'Tuyệt kỹ BỎ QUA câu hỏi: không phải trả lời gì mà vẫn ra đòn (hoặc kết liễu luôn ván)');
  await evaluate(`goHome()`); await sleep(250);

  // Trả lời SAI: mất lượt, KHÔNG mất máu (trẻ nhỏ: sai đã đủ thiệt, không phạt kép).
  await evaluate(`goHome();openDuelGame();document.getElementById('duelBestOf').value='1';`);
  await evaluate(vaoTran); await sleep(300);
  const truocSai = await evaluate(`DuelGame.snapshot()`);
  await evaluate(traLoiSai); await sleep(1800);
  const sauSai = await evaluate(`DuelGame.snapshot()`);
  assert(sauSai.players[0].hp === truocSai.players[0].hp
    && sauSai.players[1].hp === truocSai.players[1].hp
    && sauSai.turn === 1 && sauSai.phase === 'quiz',
    `Trả lời sai thì mất lượt mà không ai mất máu (lượt: ${truocSai.turn}→${sauSai.turn})`);

  /* ===== LOẠT TRẬN BO-N + THƯỞNG ĐIỂM GIỮA HIỆP =====
     Đánh cho tới khi có người hết máu ở BO3, rồi kiểm: đúng người thắng ván được
     ghi nhận, người thắng nhận +100 điểm, NGƯỜI THUA NHẬN +50 (cơ chế lội ngược
     dòng), và loạt trận chuyển sang màn nâng cấp chứ không kết thúc luôn. */
  await evaluate(`goHome();openDuelGame();
    document.getElementById('duelName1').value='Rồng';
    document.getElementById('duelName2').value='Hổ';
    document.getElementById('duelBestOf').value='3';
    document.getElementById('duelTier').value='2';`);
  await evaluate(`(()=>{
    startDuel();
    DuelGame.setAllocForTest(0,{atk:50,def:0,hp:50});
    DuelGame.setAllocForTest(1,{atk:0,def:50,hp:50});
    confirmDuelAlloc();
  })()`);
  await sleep(300);
  let vanXong = false;
  for (let i = 0; i < 60 && !vanXong; i++) {
    const daTraLoi = await evaluate(traLoiDung);
    await sleep(260);
    if (daTraLoi) { await evaluate(bamHanhDong('attack')); await sleep(1750); }
    else await sleep(900);
    vanXong = await evaluate(`document.getElementById('duelAlloc').getBoundingClientRect().height>0
      || !document.getElementById('duelResult').hidden`);
  }
  const giuaHiep = await evaluate(`(()=>{
    const s=DuelGame.snapshot();
    return {round:s.round, wins:s.wins, granted:s.players.map(p=>p.granted),
      budget:s.players.map(p=>p.budget),
      allocShown:document.getElementById('duelAlloc').getBoundingClientRect().height>0,
      title:document.getElementById('duelAllocTitle').textContent,
      needed:DuelRules.winsNeeded(s.bestOf)};
  })()`);
  const thangVan = giuaHiep.wins[0] > giuaHiep.wins[1] ? 0 : 1;
  assert(giuaHiep.allocShown && giuaHiep.round === 2 && giuaHiep.needed === 2,
    `BO3 chưa kết thúc sau ván 1 mà mở màn nâng cấp cho ván 2 (${JSON.stringify(giuaHiep.wins)})`);
  assert(giuaHiep.budget[thangVan] === 100 && giuaHiep.budget[1 - thangVan] === 50,
    `Người thắng ván nhận +100 điểm, người thua nhận +50 điểm để lội ngược dòng (${JSON.stringify(giuaHiep.budget)})`);
  assert(giuaHiep.granted[thangVan] === 200 && giuaHiep.granted[1 - thangVan] === 150,
    `Tổng điểm đã cấp cộng dồn đúng (${JSON.stringify(giuaHiep.granted)})`);
  // Trần phải tính RIÊNG từng người: thắng (200 điểm) -> 100, thua (150) -> 75.
  const capMoi = await evaluate(`(()=>{
    const s=DuelGame.snapshot();
    return {text:document.getElementById('duelAllocCap').textContent,
      caps:s.players.map(p=>DuelRules.maxPerStat(p.granted))};
  })()`);
  const capThang = capMoi.caps[thangVan];
  const capThua = capMoi.caps[1 - thangVan];
  assert(capThang === 100 && capThua === 75
    && capMoi.text.includes('100') && capMoi.text.includes('75'),
    `Trần nới theo tổng điểm của TỪNG người: thắng ${capThang}, thua ${capThua} — "${capMoi.text}"`);
  await evaluate(`goHome()`); await sleep(250);

  // LUẬT MISÈRE, không phải Nim thường: dồn bàn về còn đúng 1 viên rồi để người
  // đang tới lượt bấm lấy nó — người VỪA BẤM phải thua, đối thủ phải thắng. Nếu lỡ
  // cài ngược thành Nim thường thì assertion này đỏ ngay (đối chứng âm rõ ràng).
  await evaluate(`goHome();openNimGame();
    document.getElementById('nimName1').value='An';
    document.getElementById('nimName2').value='Bình';
    document.getElementById('nimOpponent').value='human';
    document.getElementById('nimPileCount').value='3';
    renderNimPileInputs();
    startNim();`);
  await sleep(300);
  const nimSectionVis = await evaluate(`({
    setup: document.getElementById('nimSetup').getBoundingClientRect().height > 0,
    play: document.getElementById('nimPlay').getBoundingClientRect().height > 0,
    result: document.getElementById('nimResult').getBoundingClientRect().height > 0,
  })`);
  assert(!nimSectionVis.setup && nimSectionVis.play && !nimSectionVis.result,
    `Chỉ #nimPlay thật sự hiển thị sau startNim() (đo bằng bounding rect, không phải thuộc tính hidden): ${JSON.stringify(nimSectionVis)}`);
  /* ===== BẤM SỎI = CHỌN, PHẢI XÁC NHẬN MỚI ĐI =====
     Ở Misère một nước lỡ tay là thua cả ván, nên bản này bỏ kiểu "bấm một phát đi
     luôn". Khẳng định đối chứng ÂM rõ ràng: bấm sỏi xong bàn cờ PHẢI CHƯA đổi. */
  const nimChon = await evaluate(`(()=>{
    const truoc = NimGame.snapshot().piles.slice();
    const stones = document.querySelectorAll('.nim-stone');
    stones[stones.length-1].click();
    const sau = NimGame.snapshot();
    return {truoc, sau: sau.piles, pending: sau.pending,
      confirmHien: !document.getElementById('nimConfirmBtn').hidden,
      danhDau: document.querySelectorAll('.nim-stone.marked').length};
  })()`);
  assert(JSON.stringify(nimChon.truoc) === JSON.stringify(nimChon.sau) && nimChon.pending
    && nimChon.confirmHien && nimChon.danhDau >= 1,
    `Bấm sỏi mới chỉ CHỌN (bàn chưa đổi ${JSON.stringify(nimChon.sau)}), hiện nút xác nhận và tô sẵn viên sẽ lấy`);
  const nimHuy = await evaluate(`(()=>{ cancelNimTake();
    return {pending: NimGame.snapshot().pending, danhDau: document.querySelectorAll('.nim-stone.marked').length}; })()`);
  assert(!nimHuy.pending && nimHuy.danhDau === 0, 'Bỏ chọn thì xoá sạch dấu, không đi nước nào');

  // Hoàn tác phải trả bàn cờ về đúng trạng thái trước đó.
  const nimUndo = await evaluate(`(()=>{
    const truoc = NimGame.snapshot().piles.slice();
    const stones = document.querySelectorAll('.nim-stone');
    stones[stones.length-1].click(); confirmNimTake();
    const giua = NimGame.snapshot().piles.slice();
    undoNimMove();
    return {truoc, giua, sau: NimGame.snapshot().piles};
  })()`);
  assert(JSON.stringify(nimUndo.truoc) !== JSON.stringify(nimUndo.giua)
    && JSON.stringify(nimUndo.truoc) === JSON.stringify(nimUndo.sau),
    `Hoàn tác trả bàn cờ về đúng trạng thái cũ (${JSON.stringify(nimUndo.truoc)} → ${JSON.stringify(nimUndo.giua)} → ${JSON.stringify(nimUndo.sau)})`);

  /* ===== LUẬT MISÈRE, không phải Nim thường =====
     Dồn bàn về còn đúng 1 viên rồi để người đang tới lượt lấy nó — người VỪA BẤM
     phải THUA. Cài ngược thành Nim thường là assertion này đỏ ngay. */
  const nimReduce = await evaluate(`(()=>{
    let guard=0;
    while(document.querySelectorAll('.nim-stone').length>1 && guard<80){
      const stones=document.querySelectorAll('.nim-stone');
      stones[stones.length-1].click();     // chọn viên cuối một hàng = lấy đúng 1 viên
      confirmNimTake();
      guard+=1;
    }
    const lastStone=document.querySelector('.nim-stone.last-stone');
    const turnBefore=document.getElementById('nimTurnTxt').textContent;
    const total=document.querySelectorAll('.nim-stone').length;
    if(!lastStone||total!==1)return {ok:false,total,turnBefore};
    lastStone.click(); confirmNimTake();
    return {ok:true, turnBefore, resultTitle:document.getElementById('nimResultTitle').textContent};
  })()`);
  const nimActor = nimReduce.ok && nimReduce.turnBefore.includes('An') ? 'An' : 'Bình';
  const nimExpectedWinner = nimActor === 'An' ? 'Bình' : 'An';
  assert(nimReduce.ok && nimReduce.resultTitle.includes(nimExpectedWinner) && !nimReduce.resultTitle.includes(nimActor),
    nimReduce.ok
      ? `Nim Misère: ${nimActor} bốc viên cuối phải thua, ${nimExpectedWinner} phải thắng (kết quả: ${nimReduce.resultTitle})`
      : `Nim: không dựng được trạng thái còn 1 viên để kiểm tra (total=${nimReduce.total})`);

  /* ===== TUỲ CHỈNH BÀN CỜ ===== */
  const nimTuyChinh = await evaluate(`(()=>{
    goHome();openNimGame();
    document.getElementById('nimPileCount').value='5';
    renderNimPileInputs();
    const inputs=[...document.querySelectorAll('#nimPileInputs input')];
    inputs.forEach((el,i)=>{el.value=String([4,2,7,1,6][i]);});
    // Ngoại lệ đầu vào: 99 và 0 phải bị kẹp về khoảng cho phép 1..15
    inputs[0].value='99';
    startNim();
    const piles=NimGame.snapshot().piles;
    return {soO:inputs.length, piles, hang:document.querySelectorAll('.nim-pile').length};
  })()`);
  assert(nimTuyChinh.soO === 5 && nimTuyChinh.piles.length === 5
    && nimTuyChinh.hang === 5 && nimTuyChinh.piles[0] === 15
    && JSON.stringify(nimTuyChinh.piles.slice(1)) === JSON.stringify([2,7,1,6]),
    `Tuỳ chỉnh được số đống và số sỏi từng đống, giá trị quá lớn bị kẹp về 15 (${JSON.stringify(nimTuyChinh.piles)})`);

  /* ===== MÁY KHÓ PHẢI BẤT BẠI =====
     Không phải "chạy thử vài ván xem sao": đối chiếu bestMove() với thuật toán
     nim-sum trên nhiều thế cờ, RỒI chơi thật 40 ván bằng chính hàm luật đó với
     một đối thủ bốc ngẫu nhiên, xuất phát từ thế cờ máy nắm phần thắng. */
  const aiKiem = await evaluate(`(()=>{
    const R=NimRules;
    // đối chứng: vét cạn có nhớ để biết CHÂN LÝ ai thắng
    const memo=new Map();
    function thua(piles){
      const k=piles.slice().sort((a,b)=>a-b).join(',');
      if(memo.has(k))return memo.get(k);
      if(piles.reduce((s,c)=>s+c,0)===0){memo.set(k,false);return false;}
      let win=false;
      for(let p=0;p<piles.length&&!win;p++)for(let t=1;t<=piles[p]&&!win;t++){
        const n=piles.slice();n[p]-=t;if(thua(n))win=true;}
      memo.set(k,!win);return !win;
    }
    let saiViTri=0, saiNuoc=0, kiemTra=0;
    for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)for(let c=0;c<=5;c++){
      const piles=[a,b,c]; if(!piles.some(x=>x>0))continue;
      kiemTra++;
      if(R.isWinningPosition(piles)!==!thua(piles))saiViTri++;
      if(thua(piles))continue;
      const m=R.bestMove(piles);
      const sau=R.applyTake(piles,m.pile,m.take);
      if(!sau||!thua(sau))saiNuoc++;
    }
    // đấu thật: máy Khó vs máy ngẫu nhiên
    function danh(piles,mayDiTruoc){
      let p=piles.slice(), luot=mayDiTruoc?0:1;
      while(p.reduce((s,c)=>s+c,0)>0){
        const m = luot===0 ? R.bestMove(p) : R.randomMove(p);
        p=R.applyTake(p,m.pile,m.take);
        if(p.reduce((s,c)=>s+c,0)===0) return luot===0 ? 'ngau nhien' : 'may';
        luot=1-luot;
      }
    }
    let mayThang=0, tong=0;
    for(const ban of [[3,5,7],[1,2,3],[3,5,7,9],[2,2],[1,4,5,6,7]]){
      const nenThang=R.isWinningPosition(ban);
      for(let i=0;i<40;i++){tong++; if(danh(ban,nenThang)==='may')mayThang++;}
    }
    return {kiemTra, saiViTri, saiNuoc, mayThang, tong};
  })()`);
  assert(aiKiem.saiViTri === 0 && aiKiem.saiNuoc === 0,
    `Thuật toán nim-sum khớp CHÂN LÝ vét cạn trên ${aiKiem.kiemTra} thế cờ (sai vị trí: ${aiKiem.saiViTri}, sai nước: ${aiKiem.saiNuoc})`);
  assert(aiKiem.mayThang === aiKiem.tong,
    `Máy Khó BẤT BẠI: thắng ${aiKiem.mayThang}/${aiKiem.tong} ván khi thế cờ cho phép`);

  /* ===== BA MỨC MÁY PHẢI LÀ BẬC THANG THẬT =====
     Và quan trọng hơn: đấu máy thì NGƯỜI LUÔN ĐI TRƯỚC. Ghép "đổi lượt xuất phát
     luân phiên" với một con máy bất bại từng tạo ra một nửa số ván THUA CHẮC
     CHẮN dù trẻ chơi hoàn hảo — trần thắng chỉ 50%. */
  const bacThang = await evaluate(`(()=>{
    const R=NimRules;
    function danh(piles, mucMay, doGioi){
      let p=piles.slice(), luot=0;              // người LUÔN đi trước
      while(p.reduce((s,c)=>s+c,0)>0){
        const m = luot===0
          ? (Math.random()<doGioi ? R.bestMove(p) : R.randomMove(p))
          : R.aiMove(p, mucMay);
        p=R.applyTake(p,m.pile,m.take);
        if(p.reduce((s,c)=>s+c,0)===0) return luot===0?'may':'nguoi';
        luot=1-luot;
      }
    }
    const ti=(muc,gioi)=>{let w=0;for(let i=0;i<1500;i++) if(danh([3,5,7],muc,gioi)==='nguoi')w++;return w/1500;};
    return {hoanHaoVsKho: ti('perfect',1), de: ti('easy',.7), vua: ti('mixed',.7), kho: ti('perfect',.7),
      rate: R.MEDIUM_OPTIMAL_RATE};
  })()`);
  assert(bacThang.hoanHaoVsKho === 1,
    `Đấu Máy Khó, người luôn đi trước ⇒ trẻ chơi hoàn hảo thắng 100% (trước đây trần chỉ 50%)`);
  assert(bacThang.de > bacThang.vua && bacThang.vua > bacThang.kho,
    `Ba mức máy là bậc thang thật: Dễ ${(bacThang.de*100).toFixed(0)}% > Vừa ${(bacThang.vua*100).toFixed(0)}% > Khó ${(bacThang.kho*100).toFixed(0)}%`);
  assert(bacThang.vua >= 0.25 && bacThang.vua <= 0.75,
    `Máy Vừa đúng là bậc giữa: trẻ chơi khá thắng ${(bacThang.vua*100).toFixed(0)}%`);

  // Thắng máy phải được ghi vào hồ sơ và thưởng sao.
  const truocSao = await evaluate(`GameStorage.load().profile.stars`);
  await evaluate(`goHome();openNimGame();
    document.getElementById('nimOpponent').value='easy';
    document.getElementById('nimPileCount').value='2';
    renderNimPileInputs();
    document.querySelectorAll('#nimPileInputs input').forEach(el=>{el.value='1'});
    startNim();`);
  await sleep(300);
  // Bàn [1,1]: người đi trước lấy 1 viên, máy buộc phải lấy viên cuối ⇒ máy thua.
  await evaluate(`(()=>{const s=document.querySelectorAll('.nim-stone'); s[0].click(); confirmNimTake();})()`);
  await sleep(1500);
  const nimLuu = await evaluate(`({
    aiWins: GameStorage.load().records.nim.aiWins,
    wins: GameStorage.load().records.nim.wins,
    stars: GameStorage.load().profile.stars,
    text: document.getElementById('nimResultText').textContent
  })`);
  assert(nimLuu.aiWins.easy >= 1 && nimLuu.wins >= 1 && nimLuu.stars > truocSao,
    `Hạ được máy thì ghi kỷ lục và thưởng sao (${truocSao} → ${nimLuu.stars} sao, thắng Máy Dễ ${nimLuu.aiWins.easy} ván)`);
  await evaluate(`goHome()`); await sleep(200);

  // Máy thật sự tự đi khi tới lượt nó (không đứng im chờ người bấm hộ).
  await evaluate(`goHome();openNimGame();
    document.getElementById('nimOpponent').value='hard';
    document.getElementById('nimPileCount').value='3';
    renderNimPileInputs();
    syncNimOpponent();
    startNim();`);
  await sleep(300);
  const truocMay = await evaluate(`NimGame.snapshot()`);
  await evaluate(`(()=>{const s=document.querySelectorAll('.nim-stone');
    s[s.length-1].click(); confirmNimTake();})()`);
  await sleep(1400);
  const sauMay = await evaluate(`NimGame.snapshot()`);
  const tongTruoc = truocMay.piles.reduce((a, b) => a + b, 0);
  const tongSau = sauMay.piles.reduce((a, b) => a + b, 0);
  assert(sauMay.aiSeat === 1 && sauMay.aiLevel === 'perfect' && tongSau <= tongTruoc - 2 && sauMay.turn === 0,
    `Máy tự bốc sỏi khi tới lượt rồi trả lượt lại cho người (${tongTruoc} → ${tongSau} viên)`);
  await evaluate(`goHome()`); await sleep(250);

  /* ===== THÁP HÀ NỘI ===== */
  const hanoiLuat = await evaluate(`(()=>{
    const R=HanoiRules;
    const toiUu=[3,4,5,6,7].every(n=>R.optimalMoves(n)===Math.pow(2,n)-1);
    let t=R.createTowers(3);                       // [[3,2,1],[],[]]
    const bocDuoc=R.canMove(t,0,1);
    const congTrong=!R.canMove(t,1,0);
    t=R.applyMove(t,0,1);                          // [[3,2],[1],[]]
    const chanDeLon=!R.canMove(t,0,1);             // dia 2 KHONG duoc de len dia 1
    const nuocSaiNull=R.applyMove(t,0,1)===null;
    const truoc=JSON.stringify(t); R.applyMove(t,0,2);
    const batBien=JSON.stringify(t)===truoc;
    // giai tu the co DO DANG ngau nhien: moi buoc phai hop le va ve dung dich
    let loi=0;
    for(let lan=0;lan<200;lan++){
      const n=3+Math.floor(Math.random()*5);
      let b=R.createTowers(n);
      for(let k=0;k<40;k++){const o=[];
        for(let f=0;f<3;f++)for(let to=0;to<3;to++) if(R.canMove(b,f,to))o.push([f,to]);
        const [f,to]=o[Math.floor(Math.random()*o.length)]; b=R.applyMove(b,f,to);}
      const plan=R.solveFrom(b,n,2); let cur=b;
      for(const [f,to] of plan){ if(!R.canMove(cur,f,to)){loi++;break;} cur=R.applyMove(cur,f,to); }
      if(!R.isSolved(cur,n,2))loi++;
      if(plan.length>R.optimalMoves(n))loi++;
    }
    return {toiUu,bocDuoc,congTrong,chanDeLon,nuocSaiNull,batBien,loi};
  })()`);
  assert(hanoiLuat.toiUu, 'Số bước tối ưu đúng công thức 2^n − 1 cho 3..7 đĩa');
  assert(hanoiLuat.bocDuoc && hanoiLuat.congTrong && hanoiLuat.chanDeLon && hanoiLuat.nuocSaiNull,
    `Kiểm tra nước đi: không đặt đĩa lớn lên đĩa nhỏ, không bốc cọc trống (${JSON.stringify(hanoiLuat)})`);
  assert(hanoiLuat.batBien, 'applyMove trả bàn cờ MỚI, không sửa bàn cũ — nhờ vậy hoàn tác luôn đúng');
  assert(hanoiLuat.loi === 0,
    'Bộ tự động giải chạy đúng trên 200 thế cờ dở dang ngẫu nhiên, không bao giờ vượt số bước tối ưu');

  // Chơi thật: bấm cọc để bốc/đặt, và nước sai phải bị CHẶN kèm lý do.
  await evaluate(`goHome();openHanoiGame();document.getElementById('hanoiDisks').value='3';startHanoi();`);
  await sleep(300);
  const hanoiChoi = await evaluate(`(()=>{
    const pegs=[...document.querySelectorAll('.hanoi-peg')];
    const batDau=HanoiGame.snapshot();
    pegs[0].click();                                  // boc dia 1
    const dangBoc=HanoiGame.snapshot();
    const coTo=document.querySelectorAll('.hanoi-peg.picking').length;
    pegs[1].click();                                  // dat sang coc B
    const sauDi=HanoiGame.snapshot();
    pegs[0].click(); pegs[1].click();                 // dia 2 de len dia 1 -> phai bi chan
    const sauChan=HanoiGame.snapshot();
    const loi=document.getElementById('hanoiFeedback').textContent;
    return {batDau:batDau.towers, dangBoc:dangBoc.selected, coTo, sauDi:sauDi.towers,
      buocSauDi:sauDi.moves, buocSauChan:sauChan.moves, loi,
      hienBuoc:document.getElementById('hanoiMoves').textContent,
      hienToiUu:document.getElementById('hanoiOptimal').textContent};
  })()`);
  assert(JSON.stringify(hanoiChoi.batDau) === JSON.stringify([[3,2,1],[],[]]),
    'Bày bàn đúng: cả 3 đĩa xếp nhỏ dần trên cọc A');
  assert(hanoiChoi.coTo === 1 && hanoiChoi.buocSauDi === 1
    && JSON.stringify(hanoiChoi.sauDi) === JSON.stringify([[3,2],[1],[]]),
    `Bấm cọc để bốc rồi bấm cọc khác để đặt, bộ đếm bước tăng đúng 1 (${JSON.stringify(hanoiChoi.sauDi)})`);
  assert(hanoiChoi.buocSauChan === 1 && /lớn hơn/.test(hanoiChoi.loi),
    `Nước sai bị CHẶN, không tính bước, và báo đúng lý do: "${hanoiChoi.loi}"`);
  assert(hanoiChoi.hienBuoc === '1' && hanoiChoi.hienToiUu === '7',
    `Bảng thông tin hiện số bước đã đi (${hanoiChoi.hienBuoc}) và mốc tối ưu (${hanoiChoi.hienToiUu})`);

  // Nút đổi tốc độ tự giải: 7 đĩa ở ×1 mất gần 79 giây, phải rút ngắn được.
  const tocDo = await evaluate(`(()=>{
    const truoc=HanoiGame.snapshot().autoSpeed;
    cycleHanoiAutoSpeed();
    const sau=HanoiGame.snapshot().autoSpeed;
    return {truoc, sau, nhan:document.getElementById('hanoiSpeedBtn').textContent};
  })()`);
  assert(tocDo.sau > tocDo.truoc && /×2/.test(tocDo.nhan),
    `Đổi được tốc độ tự giải ×${tocDo.truoc} → ×${tocDo.sau} ("${tocDo.nhan}")`);
  await evaluate(`cycleHanoiAutoSpeed();cycleHanoiAutoSpeed()`);   // quay lại ×1 cho phần sau

  // Hoàn tác
  await evaluate(`undoHanoiMove()`); await sleep(200);
  const hanoiUndo = await evaluate(`HanoiGame.snapshot()`);
  assert(hanoiUndo.moves === 0 && JSON.stringify(hanoiUndo.towers) === JSON.stringify([[3,2,1],[],[]]),
    'Hoàn tác trả bàn cờ và bộ đếm bước về đúng trạng thái trước');

  // Tự động giải: chạy tới khi xong, và ván có trợ giúp KHÔNG được tính kỷ lục.
  await evaluate(`toggleHanoiAutoSolve()`);
  let hanoiXong = false;
  for (let i = 0; i < 40 && !hanoiXong; i++) {
    await sleep(700);
    hanoiXong = await evaluate(`!document.getElementById('hanoiResult').hidden`);
  }
  const hanoiKetQua = await evaluate(`({
    xong: !document.getElementById('hanoiResult').hidden,
    text: document.getElementById('hanoiResultText').textContent,
    ketQua: document.getElementById('hanoiResultStats').textContent,
    kyLuc: (GameStorage.load().records.hanoi.bestMoves||{})['3']||0,
    thang: GameStorage.load().records.hanoi.wins
  })`);
  assert(hanoiKetQua.xong && /7/.test(hanoiKetQua.ketQua),
    `Tự động giải hoàn thành đúng 7 bước tối ưu (${hanoiKetQua.ketQua.replace(/\s+/g, ' ').trim()})`);
  assert(hanoiKetQua.kyLuc === 0 && hanoiKetQua.thang >= 1,
    `Ván có dùng tự động giải KHÔNG ghi kỷ lục (kỷ lục 3 đĩa vẫn = ${hanoiKetQua.kyLuc}) dù vẫn tính là hoàn thành`);

  // Tự chơi thắng thì MỚI được ghi kỷ lục.
  await evaluate(`goHome();openHanoiGame();document.getElementById('hanoiDisks').value='3';startHanoi();
    (()=>{const plan=HanoiRules.solveFrom(HanoiGame.snapshot().towers,3,2);
      const pegs=[...document.querySelectorAll('.hanoi-peg')];
      for(const [f,t] of plan){
        document.querySelectorAll('.hanoi-peg')[f].click();
        document.querySelectorAll('.hanoi-peg')[t].click();
      }
      void pegs;})();`);
  await sleep(400);
  const hanoiTuChoi = await evaluate(`({
    kyLuc: (GameStorage.load().records.hanoi.bestMoves||{})['3']||0,
    tieuDe: document.getElementById('hanoiResultTitle').textContent
  })`);
  assert(hanoiTuChoi.kyLuc === 7 && /HOÀN HẢO/.test(hanoiTuChoi.tieuDe),
    `Tự giải đúng 7 bước thì ghi kỷ lục và xướng "hoàn hảo" (kỷ lục = ${hanoiTuChoi.kyLuc}, tiêu đề "${hanoiTuChoi.tieuDe}")`);

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
    ['Đấu Đối Kháng (play)', `goHome();openDuelGame();startDuel();DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});confirmDuelAlloc()`],
    ['Đấu Đối Kháng (chia điểm)', `goHome();openDuelGame();startDuel()`],
    ['Nim Misère (setup)', `goHome();openNimGame()`],
    ['Nim Misère (play)', `goHome();openNimGame();startNim()`],
    ['Tháp Hà Nội (setup)', `goHome();openHanoiGame()`],
    ['Tháp Hà Nội (play, 7 đĩa)', `goHome();openHanoiGame();startHanoi(7)`]];
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
      ['đối kháng', `goHome();openDuelGame();startDuel();DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});confirmDuelAlloc()`],
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
  }

  await sleep(500);
  assert(runtimeErrors.length === 0, runtimeErrors.length ? `Không lỗi runtime: ${runtimeErrors.join(' | ')}` : 'Không có lỗi JavaScript runtime');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
