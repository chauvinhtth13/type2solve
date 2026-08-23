import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const checkedReferences = new Set();

function fail(message) {
  failures.push(message);
}

function isRemote(reference) {
  return /^(?:[a-z]+:)?\/\//i.test(reference)
    || /^(?:data|mailto|tel|javascript):/i.test(reference)
    || reference.startsWith('#');
}

function referenceTarget(reference, sourceFile) {
  const trimmed = reference.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed || isRemote(trimmed) || trimmed.includes('${')) return null;
  const pathOnly = trimmed.split('#')[0].split('?')[0];
  if (!pathOnly) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(pathOnly);
  } catch (error) {
    fail(`${relative(projectRoot, sourceFile)} chứa URL không hợp lệ: ${reference}`);
    return null;
  }
  return decoded.startsWith('/')
    ? resolve(projectRoot, `.${decoded}`)
    : resolve(dirname(sourceFile), decoded);
}

function isInsideProject(target) {
  const fromRoot = relative(projectRoot, target);
  return fromRoot === '' || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot));
}

async function checkReference(reference, sourceFile) {
  const target = referenceTarget(reference, sourceFile);
  if (!target) return;
  const key = `${sourceFile}\0${target}`;
  if (checkedReferences.has(key)) return;
  checkedReferences.add(key);
  if (!isInsideProject(target)) {
    fail(`${relative(projectRoot, sourceFile)} tham chiếu ra ngoài project: ${reference}`);
    return;
  }
  try {
    await stat(target);
  } catch (error) {
    fail(`Thiếu ${relative(projectRoot, target)} (được gọi từ ${relative(projectRoot, sourceFile)})`);
  }
}

async function walk(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const target = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

const indexFile = resolve(projectRoot, 'index.html');
let html = '';
try {
  html = await readFile(indexFile, 'utf8');
} catch (error) {
  fail('Không tìm thấy index.html');
}

if (!html.includes('Châu Vinh')) fail('Trang chủ chưa ghi công tác giả Châu Vinh');
if (/<img\b[^>]*\bsrc\s*=\s*["']\s*["']/i.test(html)) fail('Không được để ảnh có src rỗng');
if (!html.includes('id="sudokuGame"') || !html.includes('assets/js/games/sudoku.js')) {
  fail('Màn chơi hoặc script Sudoku chưa được tích hợp');
}

const htmlReferencePattern = /\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi;
for (const match of html.matchAll(htmlReferencePattern)) {
  await checkReference(match[2], indexFile);
}

let manifest;
const manifestFile = resolve(projectRoot, 'manifest.webmanifest');
try {
  manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  for (const icon of manifest.icons || []) await checkReference(icon.src, manifestFile);
  await checkReference(manifest.start_url || './', manifestFile);
} catch (error) {
  fail(`manifest.webmanifest không hợp lệ: ${error.message}`);
}

const allFiles = await walk(projectRoot);
for (const cssFile of allFiles.filter((file) => extname(file).toLowerCase() === '.css')) {
  const css = await readFile(cssFile, 'utf8');
  const cssUrlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  for (const match of css.matchAll(cssUrlPattern)) await checkReference(match[2], cssFile);
}

const vocabularyFile = resolve(projectRoot, 'assets/data/english-vocabulary.json');
try {
  const vocabulary = JSON.parse(await readFile(vocabularyFile, 'utf8'));
  if (!Array.isArray(vocabulary.levels) || vocabulary.levels.length !== 3) {
    fail('Kho từ tiếng Anh phải có đúng 3 cấp độ');
  } else {
    const seen = new Set();
    let totalWords = 0;
    let invalidRows = 0;
    vocabulary.levels.forEach((rows) => {
      if (!Array.isArray(rows)) {
        invalidRows += 1;
        return;
      }
      rows.forEach((row) => {
        totalWords += 1;
        const word = Array.isArray(row) ? row[0] : '';
        const meaning = Array.isArray(row) ? row[1] : '';
        const key = typeof word === 'string' ? word.normalize('NFC').toLowerCase() : '';
        if (!/^[a-z]+(?:['-][a-z]+)*$/.test(key) || typeof meaning !== 'string' || !meaning.trim()
            || meaning.length > 110 || seen.has(key)) invalidRows += 1;
        seen.add(key);
      });
    });
    if (totalWords < 80000) fail(`Kho từ tiếng Anh quá ít: ${totalWords}/80000`);
    if (invalidRows) fail(`Kho từ tiếng Anh có ${invalidRows} mục trùng hoặc sai schema`);
    if (!Array.isArray(vocabulary.counts)
        || vocabulary.counts.some((count, index) => count !== vocabulary.levels[index].length)) {
      fail('Thống kê số từ theo cấp không khớp dữ liệu');
    }
  }
} catch (error) {
  fail(`Kho từ tiếng Anh không hợp lệ: ${error.message}`);
}

const serviceWorkerFile = resolve(projectRoot, 'sw.js');
try {
  const serviceWorker = await readFile(serviceWorkerFile, 'utf8');
  const coreList = serviceWorker.match(/const\s+CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  if (!coreList) fail('sw.js không khai báo CORE_ASSETS');
  else {
    const quotedPath = /["']([^"']+)["']/g;
    for (const match of coreList[1].matchAll(quotedPath)) {
      await checkReference(match[1], serviceWorkerFile);
    }
  }
  /* Kho từ nặng đã tách khỏi CORE_ASSETS để không chặn lúc cài đặt. Nó vẫn
     phải được kiểm tra đường dẫn, nếu không thì gõ sai tên file sẽ lọt lưới
     và người chơi mất offline mà không ai hay. */
  const deferredList = serviceWorker.match(/const\s+DEFERRED_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  if (!deferredList) fail('sw.js không khai báo DEFERRED_ASSETS');
  else {
    const quotedPath = /["']([^"']+)["']/g;
    for (const match of deferredList[1].matchAll(quotedPath)) {
      await checkReference(match[1], serviceWorkerFile);
    }
  }
} catch (error) {
  fail(`Không đọc được sw.js: ${error.message}`);
}

const scriptFiles = allFiles.filter((file) => ['.js', '.mjs'].includes(extname(file).toLowerCase()));
for (const scriptFile of scriptFiles) {
  const result = spawnSync(process.execPath, ['--check', scriptFile], { encoding: 'utf8' });
  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || 'lỗi cú pháp').trim().split(/\r?\n/).slice(-3).join(' ');
    fail(`${relative(projectRoot, scriptFile)}: ${details}`);
  }
}

if (failures.length) {
  console.error(`Smoke test thất bại (${failures.length} lỗi):`);
  failures.forEach((message) => console.error(`  ✗ ${message}`));
  process.exitCode = 1;
} else {
  console.log(`✓ ${checkedReferences.size} tham chiếu nội bộ tồn tại`);
  console.log(`✓ ${scriptFiles.length} file JavaScript hợp lệ`);
  console.log('✓ Kho từ Anh–Việt có hơn 80.000 mục hợp lệ, không trùng');
  console.log('✓ manifest và service worker hợp lệ');
}
