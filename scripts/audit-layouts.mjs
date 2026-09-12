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


  const folder = join(root,'artifacts','layouts',process.env.LAYOUT_PHASE || 'before');
  await mkdir(folder,{recursive:true});
  await evaluate(`GameStorage.updateSettings({effects:'off'})`);
  const screens = [
    ['typing-setup','openTypingGame()'],['typing-expanded','openTypingGame();document.querySelectorAll("#typingSetup details").forEach(e=>e.open=true)'],['sudoku-setup','openSudokuGame()'],
    ['duel-setup','openDuelGame()'],['duel-rules','openDuelGame();document.querySelector("#duelSetup details").open=true'],['duel-allocate','openDuelGame();startDuel()'],
    ['nim-setup','openNimGame()'],['nim-custom','openNimGame();document.getElementById("nimPileCount").value=6;renderNimPileInputs();document.getElementById("nimOpponent").value="hard";syncNimOpponent()'],['hanoi-setup','openHanoiGame()'],['hanoi-rules','openHanoiGame();document.querySelector("#hanoiSetup details").open=true'],
    ['adventure-intro','startAdventure()'],
    ['adventure-play','startAdventure();beginBattle();stopTimer();clearTimeout(G.thinkT)'],
    ['blitz-play','startBlitz();stopTimer();clearTimeout(G.thinkT)'],
    ['survival-play','startSurvival();stopTimer();clearTimeout(G.thinkT)'],
    ['typing-play','openTypingGame();startTypingRun();toggleTypingPause()'],
    ['sudoku-play','openSudokuGame();startSudoku()'],
    ['duel-play','openDuelGame();startDuel();DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});confirmDuelAlloc()'],['nim-play','openNimGame();startNim()'],['hanoi-play','openHanoiGame();startHanoi()']
  ];
  const report=[];
  for(const [width,height] of [[1366,768],[390,844],[320,740],[768,1024]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
    for(const [name,action] of screens) {
      await evaluate(`goHome();${action}`); await sleep(350);
      await evaluate(`document.querySelectorAll('.screen.active,.screen.active *').forEach(e=>{if(e.scrollHeight>e.clientHeight)e.scrollTop=0});window.scrollTo(0,0)`);
      const metrics=await evaluate(`(()=>{const card=document.querySelector('.screen.active>.card');const cr=card.getBoundingClientRect(); const overflow=[...card.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.position!=='absolute'&&s.position!=='fixed'&&(r.right>cr.right+2||r.left<cr.left-2)}).map(e=>e.id||e.className).slice(0,12);return {scroll:card.scrollHeight-card.clientHeight,overflow,docOverflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
      report.push({name,width,height,...metrics});
      if(process.env.LAYOUT_PHASE==='after')assert(!metrics.docOverflow&&metrics.overflow.length===0,`${name} fits horizontally at ${width}px`);
      if(width===1366||width===390){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(folder,`${name}-${width}.png`),Buffer.from(shot.data,'base64'));}
      console.log(name,width,JSON.stringify(metrics));
    }
  }
  await writeFile(join(folder,'report.json'),JSON.stringify(report,null,2));
  assert(runtimeErrors.length===0,runtimeErrors.join(' | ')||'No runtime errors in layout survey');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
