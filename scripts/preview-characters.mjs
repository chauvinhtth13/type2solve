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

  const folder = join(root, 'artifacts', 'characters');
  await mkdir(folder, { recursive: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await evaluate(`GameStorage.updateSettings({effects:'off'});startAdventure();beginBattle();stopTimer();clearTimeout(G.thinkT);`);
  await sleep(200);
  async function capture(name){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(folder,name+'.png'),Buffer.from(shot.data,'base64'));}
  await capture('fantasy-battle');
  const rigs=await evaluate(`(()=>{
    const kinds=new Set();let ok=true;
    for(let i=0;i<10;i++){
      const art=buildBeastArt(i);kinds.add(art.dataset.fantasyKind);
      const original=art.querySelector('.art-body').getAttribute('d');
      applySkin(art,rageArt(i));applySkin(art,i);
      ok=ok&&art.querySelectorAll('.art-eye').length===2&&art.querySelector('.art-body').getAttribute('d')===original&&!art.classList.contains('phase2')&&art.dataset.expression==='happy';
    }
    return {count:kinds.size,ok};
  })()`);
  assert(rigs.count===10&&rigs.ok,'Ten distinct rigs preserve their faces and reset correctly after phase changes');
  await evaluate(`goHome();
    const style=document.createElement('style');style.textContent=\`
      body{display:block!important;margin:0!important;min-height:100vh!important;background:#f7f3eb!important;color:#46415d!important;font-family:system-ui!important;overflow:auto!important}
      body:before,body:after{display:none!important}.character-sheet{padding:40px 60px}
      .character-sheet header{display:flex;justify-content:space-between;align-items:end;margin-bottom:28px;border-bottom:1px solid #ded7c8;padding-bottom:22px}
      .character-sheet h1{font:800 36px system-ui;margin:5px 0;color:#46415d}
      .character-sheet header p{font:600 13px system-ui;color:#84778e;letter-spacing:2px}
      .character-sheet header span{font:500 14px system-ui;color:#84778e}
      .character-lineup{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:24px 20px}
      .character-specimen{display:flex;align-items:center;flex-direction:column;justify-content:end;min-height:310px;padding:10px 0 18px;border-bottom:1px solid #ded7c8;text-align:center}
      .character-specimen svg{width:200px;height:200px;max-width:100%;margin-bottom:16px;overflow:visible}
      .character-specimen b{font:750 16px system-ui;color:#46415d}.character-specimen small{font:500 12px system-ui;color:#84778e;margin-top:6px}
      .character-note{font:600 22px/1.5 system-ui;color:#8d81a1;display:flex;align-items:center;justify-content:center;padding:28px;text-align:center}
    \`;document.head.append(style);
    const sheet=document.createElement('main');sheet.className='character-sheet';
    sheet.innerHTML='<header><div><p>TYPE2SOLVE · FANTASY FRIENDS</p><h1>Bạn đồng hành xứ phép màu</h1></div><span>Những phép màu nhỏ, những người bạn lớn.</span></header><div class="character-lineup"></div>';
    const grid=sheet.querySelector('.character-lineup');
    const names=['Sora','Sparky','Stitchwork','Ignis','Vex','Nocturne','Glacius','Sol-Kahn','Lumiel','Leviator'];
    const roles=['Ốc sên thời gian','Tinh linh sấm sét','Học giả vá víu','Rồng con nham thạch','Tiểu quỷ kẹo ngọt','Dơi nhỏ ánh trăng','Rồng tuyết pha lê','Sư tử thái dương','Pháp sư rừng nấm','Bạch tuộc ngọc trai'];
    function add(art,name,role){const tile=document.createElement('div');tile.className='character-specimen';tile.append(art);const title=document.createElement('b');title.textContent=name;const sub=document.createElement('small');sub.textContent=role;tile.append(title,sub);grid.append(tile);}
    add(buildArt('tplHero'),'Mây','Thỏ pháp sư của em');
    names.forEach((name,i)=>add(buildBeastArt(i),name,roles[i]));
    const note=document.createElement('div');note.className='character-note';note.textContent='Một câu đúng. Một phép màu.';grid.append(note);
    document.body.replaceChildren(sheet);
  `);
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 920, deviceScaleFactor: 1, mobile: false });
  await sleep(200);await capture('fantasy-lineup');
  assert(runtimeErrors.length===0,runtimeErrors.join(' | ')||'Character preview has no runtime errors');
} finally {
  try { socket?.close(); } catch {}
  server.kill();
  chrome.kill();
  await sleep(250);
  await rm(profileDir, { recursive: true, force: true });
}
