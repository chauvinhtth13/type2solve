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
  const folder = join(root, 'artifacts', 'redesign');
  await mkdir(folder, { recursive: true });
  async function snapshot(name) {
    await sleep(250);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(folder, name+'.png'), Buffer.from(shot.data, 'base64'));
  }
  assert(await evaluate(`document.querySelector('.zone-solo .hanoi-mode')!==null && document.querySelectorAll('#journeyTrack>span').length===10`), 'Solo grouping and journey track');
  await snapshot('home-desktop');
  await evaluate(`setAnswerMode('choice');startAdventure();beginBattle();stopTimer();clearTimeout(G.thinkT);unlockCurrentAnswers();`);
  await snapshot('battle-desktop');
  const outcome = await evaluate(`(()=>{ G.bossHp=G.bossMaxHp=10000; answer(document.querySelector('.ans'),currentQ.ans); const result={resolved:G.bossHp<10000,phase:G.phase};askRestart();return result; })()`);
  assert(outcome.resolved && outcome.phase==='resolving', 'Damage resolves immediately independently of animation');
  await sleep(600);
  const paused = await evaluate(`({phase:G.phase,next:$('nextBtn').style.display,tasks:combatTimers.size})`);
  assert(paused.phase==='paused' && paused.next!=='block', 'Pause suspends pending resolution: '+JSON.stringify(paused));
  await evaluate(`closeRestart()`); await sleep(500);
  assert(await evaluate(`G.phase==='feedback' && $('nextBtn').style.display==='block'`), 'Resume completes pending resolution');
  await evaluate(`proceedNext();stopTimer();clearTimeout(G.thinkT);unlockCurrentAnswers();answer(document.querySelector('.ans'),'definitely-wrong')`);
  await sleep(450);
  await evaluate(`G.bossHp=0;bossDefeated();bossDefeated();`);
  const reward = await evaluate(`({coins:G.coins,stars:GameStorage.load().profile.stars,cleared:GameStorage.load().adventure.cleared})`);
  await sleep(650);
  assert(await evaluate(`$('bossWin').classList.contains('active')`), 'Boss win screen');
  await snapshot('results-desktop');
  assert(await evaluate(`(()=>{const c=$('bossWin').firstElementChild;return c.scrollHeight<=c.clientHeight+1;})()`), 'Result actions fit the laptop viewport');
  assert(await evaluate(`G.coins===${reward.coins} && GameStorage.load().profile.stars===${reward.stars} && GameStorage.load().adventure.cleared===${reward.cleared}`), 'Duplicate completion cannot duplicate rewards');
  await evaluate(`document.querySelector('#bossWin [data-learning-recap] button').click()`);
  await snapshot('practice-desktop');
  const review = await evaluate(`(()=>{ const before=JSON.stringify(GameStorage.load());const text=$('practiceQuestion').textContent;document.querySelector('#practiceAnswers .ans').click();return {before,text,after:JSON.stringify(GameStorage.load()),timer:timerId};})()`);
  assert(review.before===review.after && review.text && review.timer===null, 'Untimed review does not grant rewards or modify records');
  await evaluate(`(()=>{const b=[...document.querySelectorAll('#practiceAnswers .ans')].find(b=>normalizeAnswer(b.textContent)===normalizeAnswer(currentQ.ans));if(!b.disabled)b.click();LearningReview.next();})()`);
  assert(await evaluate(`$('bossWin').classList.contains('active')`), 'Completing review returns to the result screen');
  await evaluate(`nextBossGo();nextBossGo()`);
  assert(await evaluate(`G.bossIndex===1 && $('intro').classList.contains('active')`), 'Direct continuation skips shop and resists double activation');
  await evaluate(`beginBattle();G.bossHp=1;G.locked=false;stopTimer();heroAttack(10,false);goHome()`); await sleep(650);
  assert(await evaluate(`$('home').classList.contains('active') && combatTimers.size===0 && !document.querySelector('.proj,.confetti,.flashOverlay') && GameStorage.load().adventure.cleared===1`), 'Exit cancels effects while preserving earned progress');
  await evaluate(`document.querySelector('[data-effects-setting]').value='off';document.querySelector('[data-effects-setting]').dispatchEvent(new Event('change'))`);
  assert(await evaluate(`REDUCED_MOTION() && GameStorage.load().settings.effects==='off' && GameExperience.budget()===0`), 'Persisted effects setting suppresses motion');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await snapshot('home-mobile');
  await evaluate(`startAdventure();beginBattle();stopTimer();clearTimeout(G.thinkT);unlockCurrentAnswers()`);
  await snapshot('battle-mobile');
  assert(await evaluate(`(()=>{const a=$('typeBadge').getBoundingClientRect(),b=$('answerModeSelect').getBoundingClientRect();return a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1;})()`), 'Mobile type label and answer settings do not overlap');
  assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), 'Mobile layout has no horizontal overflow');
  await evaluate(`goHome();startSurvival();G.correct=5;G.locked=false;clearTimeout(G.thinkT);stopTimer();answer(document.querySelector('.ans'),currentQ.ans);proceedNext();stopTimer();`);
  assert(await evaluate(`G.tier===2`), 'Fast continuation preserves survival progression');
  await evaluate(`goHome()`);
  await send('Emulation.setEmulatedMedia' , { features: [{name:'prefers-reduced-motion',value:'reduce'}] });
  await evaluate(`GameStorage.updateSettings({effects:'auto'})`);
  assert(await evaluate(`GameExperience.quality()==='off'`), 'OS reduced-motion overrides automatic quality');
  assert(runtimeErrors.length===0, runtimeErrors.join(' | ') || 'No runtime errors in redesigned flows');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
