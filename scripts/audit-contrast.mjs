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
  await send('DOM.enable');
  await send('CSS.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/index.html` });
  for (let i = 0; i < 80; i++) {
    if (await evaluate('document.readyState') === 'complete') break;
    await sleep(100);
  }
  await sleep(350);
  await evaluate("document.fonts.ready");


  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  const folder=join(root,'artifacts','contrast');await mkdir(folder,{recursive:true});
  const report=[];
  const pseudo=process.env.CONTRAST_PSEUDO;
  if(process.env.CONTRAST_MOBILE)await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  for(const [name,action] of [
    ['home','goHome()'],['story',"showScreen('story');document.querySelector('.atlas-kit').open=true"],['typing','openTypingGame();document.querySelector("#typingSetup details").open=true'],
    ['typing-play','openTypingGame();startTypingRun()'],['typing-pause','openTypingGame();await startTypingRun();toggleTypingPause()'],
    ['sudoku','openSudokuGame()'],['sudoku-play','openSudokuGame();startSudoku()'],
    ['duel','openDuelGame()'],['duel-alloc','openDuelGame();startDuel()'],
    ['duel-play','openDuelGame();startDuel();DuelGame.setAllocForTest(0,{atk:34,def:33,hp:33});DuelGame.setAllocForTest(1,{atk:34,def:33,hp:33});confirmDuelAlloc()'],
    ['nim','openNimGame()'],['nim-ai','openNimGame();document.getElementById("nimOpponent").value="hard";syncNimOpponent()'],['nim-play','openNimGame();startNim()'],
    ['hanoi','openHanoiGame()'],['hanoi-play','openHanoiGame();document.getElementById("hanoiDisks").value="7";startHanoi()'],
    ['intro','startAdventure()'],['battle','startAdventure();beginBattle();stopTimer();clearTimeout(G.thinkT)'],
    ['battle-input','startAdventure();beginBattle();setAnswerMode("input");stopTimer();clearTimeout(G.thinkT)'],
    ['pause','startAdventure();beginBattle();askRestart()']]){
    await evaluate(`(async()=>{goHome();${action}})()`);await sleep(1700);
    if(name==='typing-play')await evaluate(`(()=>{const word=document.querySelector('.typing-monster .monster-word');if(word){const text=word.textContent;const input=document.getElementById('typingInput');input.value=text.slice(0,1);input.dispatchEvent(new Event('input'));}const monster=document.querySelector('.typing-monster');if(monster){const label=document.createElement('strong');label.className='monster-name';label.textContent='Boss · kiểm tra màu';monster.prepend(label);}})()`);
    if(pseudo){const doc=await send('DOM.getDocument');const {nodeIds}=await send('DOM.querySelectorAll',{nodeId:doc.root.nodeId,selector:'.screen.active button:not(:disabled),.screen.active select,.screen.active input:not(:disabled)'});for(const nodeId of nodeIds)await send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[pseudo]});}
    const results=await evaluate(`(()=>{
      function rgb(s){return (s.match(/[\\d.]+/g)||[]).map(Number)}
      function blend(a,b){const alpha=a[3]??1;return a.slice(0,3).map((c,i)=>c*alpha+b[i]*(1-alpha))}
      function lum(c){return c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)}
      const root=document.body,out=[];
      for(const e of root.querySelectorAll('*')){
        if(e.closest('svg,[hidden],option,script,style')||!e.getBoundingClientRect().width||!e.getBoundingClientRect().height||(!e.matches('input,select')&&!Array.from(e.childNodes).some(n=>n.nodeType===3&&n.textContent.trim())))continue;
        const cs=getComputedStyle(e);if(cs.visibility==='hidden'||e.matches('input[type=radio],input[type=checkbox]'))continue;
        let bg=[255,255,255],chain=[],gradient=false;for(let n=e;n;n=n.parentElement)chain.unshift(n);
        for(const n of chain){const ns=getComputedStyle(n);const c=rgb(ns.backgroundColor);if(ns.backgroundImage!=='none')gradient=true;if(c.length)bg=blend(c,bg)}
        let fg=blend(rgb(e.matches('input')&&!e.value&&e.placeholder?getComputedStyle(e,'::placeholder').color:cs.color),bg);let opacity=chain.reduce((x,n)=>x*Number(getComputedStyle(n).opacity),1);if(opacity<.05)continue;fg=fg.map((x,i)=>x*opacity+bg[i]*(1-opacity));
        const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(cs.fontSize),threshold=size>=24||(size>=18.66&&parseInt(cs.fontWeight)>=700)?3:4.5;
        if(ratio<threshold)out.push({id:e.id,cls:typeof e.className==='string'?e.className:'',text:(e.value||e.placeholder||e.textContent).trim().slice(0,65),fg:cs.color,bg:cs.backgroundColor,ratio:+ratio.toFixed(2),threshold,opacity,gradient,disabled:!!e.closest(':disabled')});
      }return out;
    })()`);
    report.push({name,results});console.log(name,JSON.stringify(results));
    if(process.env.CHECK_CONTRAST==='1')assert(results.length===0,name+' visible text contrast');
    const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(folder,name+'-'+(pseudo||'normal')+(process.env.CONTRAST_MOBILE?'-mobile':'')+'.png'),Buffer.from(shot.data,'base64'));
  }
  await writeFile(join(folder,`report-${pseudo||'normal'}${process.env.CONTRAST_MOBILE?'-mobile':''}.json`),JSON.stringify(report,null,2));
  assert(runtimeErrors.length===0,runtimeErrors.join(' | ')||'No runtime errors');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
