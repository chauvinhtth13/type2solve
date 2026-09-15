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


  const folder=join(root,'artifacts','typing-forest');await mkdir(folder,{recursive:true});
  async function capture(name){await sleep(150);const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(folder,name+'.png'),Buffer.from(shot.data,'base64'));}
  async function fits(name){const m=await evaluate(`(()=>{const c=document.querySelector('#typingGame>.card'),r=c.getBoundingClientRect();return [...c.querySelectorAll('button,input,select')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&!e.closest('[hidden]')&&(b.left<r.left-1||b.right>r.right+1)}).map(e=>e.id||e.textContent)})()`);assert(!m.length,name+' controls fit: '+JSON.stringify(m));}
  await evaluate(`GameStorage.updateSettings({effects:'off'});openTypingGame()`);
  for(const scheme of ['light','dark']){
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme}]});
    const pairs=await evaluate(`['.game-topbar','.spell-intro','.spell-map-heading','.spell-stage-preview'].map(selector=>{const e=document.querySelector('#typingGame '+selector),c=getComputedStyle(e);return {selector,bg:c.backgroundColor,fg:c.color}})`);
    assert(pairs.every(p=>['rgb(255, 253, 244)','rgb(230, 244, 237)'].includes(p.bg)&&p.fg==='rgb(25, 48, 71)'), 'Named reading surfaces have explicit light backgrounds in '+scheme+' mode');
    await capture('reading-surfaces-'+scheme);
  }

  for(const [width,height] of [[1366,768],[768,1024],[390,844],[320,740],[390,500]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
    await evaluate(`openTypingGame();document.querySelector('#typingGame>.card').scrollTop=0`);await fits('Setup '+width);await capture('setup-'+width+'-'+height);
    await evaluate(`document.querySelector('[name="typingLanguage"][value="vi"]').checked=true;document.querySelector('[name="typingLanguage"][value="vi"]').dispatchEvent(new Event('change'));document.getElementById('typingDifficulty').value='normal';startTypingRun()`);
    await sleep(1700);await fits('Play '+width);await capture('play-'+width+'-'+height);
    const bounds=await evaluate(`(()=>{const f=document.getElementById('typingField').getBoundingClientRect();return [...document.querySelectorAll('.typing-monster .monster-word')].every(e=>{const r=e.getBoundingClientRect();return r.left>=f.left&&r.right<=f.right&&r.top>=f.top&&r.bottom<=f.bottom})})()`);assert(bounds,'Words fit arena '+width);
    await evaluate(`toggleTypingPause()`);await capture('pause-'+width+'-'+height);
    assert(await evaluate(`document.getElementById('typingGame').dataset.forestMotion==='paused'&&(getComputedStyle(document.querySelector('.forest-motes')).animationPlayState==='paused'||getComputedStyle(document.querySelector('.forest-motes')).animationName==='none')`),'Scenery motion pauses '+width);
    const paused=await evaluate(`({time:document.getElementById('typingTimer').textContent,x:document.querySelector('.typing-monster')?.style.cssText})`);await sleep(350);
    assert(await evaluate(`!document.getElementById('typingPausePanel').hidden&&document.getElementById('typingTimer').textContent===${JSON.stringify(paused.time)}&&document.querySelector('.typing-monster')?.style.cssText===${JSON.stringify(paused.x)}`),'Pause freezes clock and monsters '+width);
    await evaluate(`leaveTypingGame()`);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  // Drive the real frame loop with a controlled clock; no test hooks in product code.
  await evaluate(`window.nativeRAF=requestAnimationFrame;window.nativeCancel=cancelAnimationFrame;window.frame=null;requestAnimationFrame=cb=>{window.frame=cb;return 1};cancelAnimationFrame=()=>{window.frame=null};window.tick=()=>{const cb=window.frame;window.frame=null;window.t+=70;if(cb)cb(window.t)};openTypingGame();document.getElementById('typingDifficulty').value='easy';startTypingRun();window.t=performance.now();for(let i=0;i<50;i++)tick()`);
  const test=await evaluate(`(()=>{const input=document.getElementById('typingInput'),monster=document.querySelector('.typing-monster'),word=monster.querySelector('.monster-word').textContent;window.firstWord=word;input.dispatchEvent(new CompositionEvent('compositionstart'));input.value=word;input.dispatchEvent(new Event('input'));const before=document.getElementById('typingScore').textContent;input.dispatchEvent(new CompositionEvent('compositionend'));return {before,after:document.getElementById('typingScore').textContent,word}})()`);
  assert(test.before==='0'&&Number(test.after)>0,'Vietnamese composition scores only after composition ends');
  await evaluate(`for(let i=0;i<60;i++)tick()`);
  assert(await evaluate(`document.getElementById('typingTimer').textContent!=='00:00'`),'Timer advances');
  await evaluate(`(()=>{const input=document.getElementById('typingInput'),word=document.querySelector('.typing-monster:not(.defeated):not(.hit):not(.escaped) .monster-word').textContent;input.value=word[0];input.dispatchEvent(new Event('input'));input.value=word[0]+'!';input.dispatchEvent(new Event('input'));})()`);
  assert(await evaluate(`Number(document.getElementById('typingAccuracy').textContent.replace('%',''))<100&&document.getElementById('typingInput').classList.contains('wrong')`),'Wrong characters update accuracy and show error');
  assert(await evaluate(`document.getElementById('typingTargetWord').textContent!=='Chọn một từ'`),'Target word appears next to input');
  await evaluate(`clearTypingBuffer()`);
  assert(await evaluate(`document.getElementById('typingInput').value===''&&!document.getElementById('typingInput').classList.contains('wrong')`),'Clear releases target and error');
  await evaluate(`for(let i=0;i<4000&&document.getElementById('typingResult').hidden;i++)tick()`);await sleep(700);
  assert(await evaluate(`!document.getElementById('typingResult').hidden&&document.getElementById('typingWordReview').children.length>0`),'Result includes words to review');
  await capture('result-desktop');
  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedResult=text}}});copyShareCard()`);
  assert(await evaluate(`copiedResult.includes('GÕ CHỮ VUI')&&copiedResult.includes('WPM')`),'Result sharing uses actual run data');
  await evaluate(`navigator.clipboard.writeText=async()=>{throw new Error('denied')};copyShareCard()`);
  assert(await evaluate(`document.getElementById('typingShareStatus').textContent.includes('Chưa sao chép')`),'Clipboard denial displays honest fallback');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await fits('Result mobile');await capture('result-mobile');

  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await evaluate(`openTypingGame();document.getElementById('typingDifficulty').value='superslow';startTypingCampaign();window.t=performance.now();for(let i=0;i<30000&&document.getElementById('typingResult').hidden;i++){tick();const target=document.querySelector('.typing-monster:not(.hit):not(.escaped):not(.defeated),.typing-monster.boss:not(.defeated):not(.escaped)');if(target){const input=document.getElementById('typingInput');input.value=target.querySelector('.monster-word').textContent;input.dispatchEvent(new Event('input'));}}`);
  await sleep(700);
  assert(await evaluate(`!document.getElementById('typingResult').hidden&&!document.getElementById('typingNextStageBtn').hidden&&GameStorage.load().records.typing.campaignCleared===0`),'Winning a campaign stage unlocks the next stage');
  await capture('victory-desktop');
  assert(await evaluate(`(()=>{const c=document.querySelector('#typingGame>.card');return c.scrollHeight<=c.clientHeight+1})()`),'Victory result actions fit laptop');
  await evaluate(`requestAnimationFrame=nativeRAF;cancelAnimationFrame=nativeCancel;document.getElementById('typingNextStageBtn').click()`);
  assert(await evaluate(`!document.getElementById('typingPlay').hidden&&document.getElementById('typingStage').textContent==='2/10'`),'Next-stage action launches the correct stage');
  await evaluate(`leaveTypingGame()`);

  await evaluate(`openTypingGame();startTypingRun();ForestScene.setStage(6)`);
  assert(await evaluate(`document.getElementById('typingGame').dataset.biome==='frost'`),'Later stages select their scenery palette');
  await evaluate(`const setting=document.querySelector('#typingGame [data-effects-setting]');setting.value='off';setting.dispatchEvent(new Event('change'))`);
  assert(await evaluate(`getComputedStyle(document.querySelector('.forest-motes')).animationName==='none'`),'Effects off disables ambient animation');
  await evaluate(`leaveTypingGame()`);
  assert(await evaluate(`document.getElementById('typingGame').dataset.forestMotion==='paused'`),'Leaving gameplay stops decorative motion');
  assert(runtimeErrors.length===0,runtimeErrors.join(' | ')||'No typing runtime errors');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
