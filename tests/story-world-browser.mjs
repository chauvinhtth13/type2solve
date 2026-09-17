import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
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

  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  const folder = join(root, 'artifacts', 'story-world');
  await mkdir(folder, { recursive: true });
  async function snapshot(name) {
    await sleep(250);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(folder, name+'.png'), Buffer.from(shot.data, 'base64'));
  }

  assert(await evaluate("StoryWorld.chapters.length===10 && GameStorage.load().version===3"),'Story boots with ten chapters and migrated schema');
  await snapshot('home-desktop');
  await evaluate("document.querySelector('#home .story-entry').click()");
  assert(await evaluate("document.querySelector('#story.active')!==null"),'Home story tile opens the journal');
  assert(await evaluate("(()=>{const r=document.querySelector('.story-overview').getBoundingClientRect();return r.height>150 && r.width>200})()"),'Story illustration is visible, not clipped');
  await evaluate("document.querySelector('.story-book').open=true; document.querySelector('.story-chapter').open=true");
  await snapshot('journal-desktop');
  await evaluate("GameStorage.setAdventure({cleared:2});GameStorage.save({story:{costume:'leaf',questionTier:1}});startAdventure();beginBattle();stopTimer()");
  assert(await evaluate("G.questionTier===1 && document.body.dataset.storyCostume==='leaf'"),'Selected learning level and unlocked costume apply');
  await snapshot('adventure');
  await evaluate("G.bossHp=0;bossDefeated();bossDefeated()");
  await sleep(650);
  assert(await evaluate("GameStorage.load().story.fragments===4 && document.querySelector('.story-restoration').textContent.includes('Lò lửa')"),'Victory persists one fragment and presents chapter restoration');
  await evaluate("goHome()");
  for(const [name,open,start] of [
    ['sudoku','openSudokuGame()','startSudoku()'],
    ['nim','openNimGame()','startNim()'],
    ['hanoi','openHanoiGame()','startHanoi()'],
    ['duel','openDuelGame()','startDuel();DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});confirmDuelAlloc()'],
    ['blitz','startBlitz()',null],
    ['survival','startSurvival()',null],
    ['typing','openTypingGame()',null]
  ]){
    await evaluate(open);if(start)await evaluate(start);
    await snapshot(name+'-desktop');
    if(name==='duel')assert(await evaluate("document.querySelector('#duelArena').style.getPropertyValue('--world-background').includes('svg')"),'Duel gameplay receives its festival scenery');
    assert(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),name+' has no desktop overflow');
    await evaluate('goHome()');
  }
  for(const width of [320,390,768]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<700});
    await evaluate("goHome();showScreen('story');document.querySelectorAll('.story-book').forEach(el=>el.open=true)");
    await snapshot('journal-'+width);
    assert(await evaluate("(()=>{const b=document.querySelector('#story .home-btn');return b.scrollWidth<=b.clientWidth+1&&b.scrollHeight<=b.clientHeight+1})()"),'Journal navigation text fits at '+width);
    assert(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'Expanded story has no overflow at '+width);
    for(const open of ['openSudokuGame()','openNimGame()','openHanoiGame()','openDuelGame()']){
      await evaluate(open);
      assert(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),open+' fits '+width);
      await evaluate('goHome()');
    }
  }
  await evaluate("GameStorage.updateSettings({effects:'off'});startAdventure();beginBattle();stopTimer()");
  assert(await evaluate("GameExperience.quality()==='off'"),'New scenes preserve effects-off');
  await evaluate("goHome();GameStorage.setAdventure({cleared:9});");
  assert(await evaluate("document.querySelector('[data-story-progress]').textContent.includes('10/10')"),'Final story restoration is visible');
  await evaluate("showScreen('story')");
  await snapshot('restored-tree');
  await evaluate("document.querySelectorAll('.story-book')[1].open=true;document.querySelectorAll('[data-costumes] button')[3].click()");
  assert(await evaluate("GameStorage.load().story.costume==='sun'"),'Final cape can be equipped from the journal');
  await evaluate("document.querySelector('[data-side-quests] button').click()");
  assert(await evaluate("G.mode==='blitz' && document.querySelector('#battle.active')!==null"),'Journal quests launch their game');
  await evaluate("goHome()");

  assert(runtimeErrors.length===0,runtimeErrors.join(' | ')||'No story runtime errors');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
