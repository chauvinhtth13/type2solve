import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { renderHtml } from '../scripts/lib/html.mjs';
import { extractHtmlReferences, isRemoteReference } from '../scripts/lib/references.mjs';
import {
  fromSource, htmlEntry, manifestEntry, projectRoot, serviceWorkerEntry, sourceDir,
} from '../scripts/project.mjs';

const failures = [];
const checkedReferences = new Set();

function fail(message) {
  failures.push(message);
}

function referenceTarget(reference, sourceFile) {
  const trimmed = reference.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed || isRemoteReference(trimmed) || trimmed.includes('${')) return null;
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
    ? resolve(sourceDir, `.${decoded}`)
    : resolve(dirname(sourceFile), decoded);
}

function isInsideSource(target) {
  const fromRoot = relative(sourceDir, target);
  return fromRoot === '' || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot));
}

async function checkReference(reference, sourceFile) {
  const target = referenceTarget(reference, sourceFile);
  if (!target) return;
  const key = `${sourceFile}\0${target}`;
  if (checkedReferences.has(key)) return;
  checkedReferences.add(key);
  if (!isInsideSource(target)) {
    fail(`${relative(projectRoot, sourceFile)} tham chiếu ra ngoài src/: ${reference}`);
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

function attributeValue(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(tag);
  return match ? match[2] : null;
}

function extractRuntimeHtmlReferences(markup) {
  const references = [];
  const seen = new Set();
  const addReference = (kind, reference) => {
    if (!reference || isRemoteReference(reference)) return;
    const key = `${kind}\0${reference}`;
    if (seen.has(key)) return;
    seen.add(key);
    references.push({ kind, reference });
  };
  const addSrcset = (value) => {
    if (/^\s*data:/i.test(String(value || ''))) return;
    for (const candidate of String(value || '').split(',')) {
      addReference('image', candidate.trim().split(/\s+/)[0]);
    }
  };
  const withoutComments = String(markup || '').replace(/<!--[\s\S]*?-->/g, '');
  const tagPattern = /<(script|link|img|image|source|video)\b[^>]*>/gi;
  for (const match of withoutComments.matchAll(tagPattern)) {
    const tagName = match[1].toLowerCase();
    const tag = match[0];
    if (tagName === 'script') addReference('script', attributeValue(tag, 'src'));
    else if (tagName === 'img') {
      addReference('image', attributeValue(tag, 'src'));
      addSrcset(attributeValue(tag, 'srcset'));
    } else if (tagName === 'image') addReference('image', attributeValue(tag, 'href'));
    else if (tagName === 'source') addSrcset(attributeValue(tag, 'srcset'));
    else if (tagName === 'video') addReference('image', attributeValue(tag, 'poster'));
    else {
      const rel = (attributeValue(tag, 'rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
      const href = attributeValue(tag, 'href');
      if (rel.includes('stylesheet')) addReference('stylesheet', href);
      else if (rel.includes('manifest')) addReference('manifest', href);
      else if (rel.some((value) => value === 'icon' || value.endsWith('-icon'))) addReference('icon', href);
      else if (rel.includes('modulepreload')) addReference('script', href);
      else if (rel.includes('preload')) {
        const as = (attributeValue(tag, 'as') || '').toLowerCase();
        if (as === 'script') addReference('script', href);
        else if (as === 'style') addReference('stylesheet', href);
        else if (as === 'image') addReference('image', href);
      }
    }
  }
  return references;
}

function findDuplicateHtmlIds(markup) {
  const counts = new Map();
  const withoutComments = String(markup || '').replace(/<!--[\s\S]*?-->/g, '');
  const tagPattern = /<[a-z][^>]*>/gi;
  const idPattern = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  for (const tagMatch of withoutComments.matchAll(tagPattern)) {
    for (const idMatch of tagMatch[0].matchAll(idPattern)) {
      const id = idMatch[1] ?? idMatch[2] ?? idMatch[3] ?? '';
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return [...counts].filter(([, count]) => count > 1);
}

function stripJavaScriptCommentsAndStrings(source) {
  let output = '';
  let mode = 'code';
  let quote = '';
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (mode === 'code') {
      if (char === '/' && next === '/') {
        output += '  ';
        index += 1;
        mode = 'line-comment';
      } else if (char === '/' && next === '*') {
        output += '  ';
        index += 1;
        mode = 'block-comment';
      } else if (char === '"' || char === "'" || char === '`') {
        output += ' ';
        quote = char;
        mode = 'string';
      } else output += char;
    } else if (mode === 'line-comment') {
      if (char === '\n') {
        output += '\n';
        mode = 'code';
      } else output += ' ';
    } else if (mode === 'block-comment') {
      if (char === '*' && next === '/') {
        output += '  ';
        index += 1;
        mode = 'code';
      } else output += char === '\n' ? '\n' : ' ';
    } else if (char === '\\') {
      output += ' ';
      if (next !== undefined) {
        output += next === '\n' ? '\n' : ' ';
        index += 1;
      }
    } else if (char === quote) {
      output += ' ';
      mode = 'code';
    } else output += char === '\n' ? '\n' : ' ';
  }
  return output;
}

const indexFile = htmlEntry;
let html = '';
try {
  html = await renderHtml(indexFile, { rootDir: sourceDir });
} catch (error) {
  fail(`Không assemble được src/index.html: ${error.message}`);
}

if (!html.includes('Châu Vinh')) fail('Trang chủ chưa ghi công tác giả Châu Vinh');
if (/<img\b[^>]*\bsrc\s*=\s*["']\s*["']/i.test(html)) fail('Không được để ảnh có src rỗng');
if (!html.includes('id="sudokuGame"') || !html.includes('scripts/games/sudoku/index.js')) {
  fail('Màn chơi hoặc script Sudoku chưa được tích hợp');
}

const duplicateIds = findDuplicateHtmlIds(html);
if (duplicateIds.length) {
  const details = duplicateIds
    .map(([id, count]) => `"${id || '(rỗng)'}" (${count} lần)`)
    .join(', ');
  fail(`HTML sau khi render có id bị lặp: ${details}`);
}
const runtimeHtmlReferences = extractRuntimeHtmlReferences(html);

for (const reference of extractHtmlReferences(html)) await checkReference(reference, indexFile);

let manifest;
const manifestFile = manifestEntry;
try {
  manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  for (const icon of manifest.icons || []) await checkReference(icon.src, manifestFile);
  await checkReference(manifest.start_url || './', manifestFile);
} catch (error) {
  fail(`manifest.webmanifest không hợp lệ: ${error.message}`);
}

const sourceFiles = await walk(sourceDir);
for (const cssFile of sourceFiles.filter((file) => extname(file).toLowerCase() === '.css')) {
  const css = await readFile(cssFile, 'utf8');
  const cssUrlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  for (const match of css.matchAll(cssUrlPattern)) await checkReference(match[2], cssFile);
}

for (const scriptFile of sourceFiles.filter((file) => {
  const sourcePath = relative(sourceDir, file).replaceAll('\\', '/');
  return sourcePath.startsWith('scripts/')
    && sourcePath !== 'scripts/platform/storage.js'
    && ['.js', '.mjs'].includes(extname(file).toLowerCase());
})) {
  const source = stripJavaScriptCommentsAndStrings(await readFile(scriptFile, 'utf8'));
  const lines = new Set();
  for (const match of source.matchAll(/\blocalStorage\b/g)) {
    lines.add(source.slice(0, match.index).split('\n').length);
  }
  if (lines.size) {
    fail(`${relative(projectRoot, scriptFile)} truy cập localStorage trực tiếp tại dòng ${[...lines].join(', ')}; hãy dùng scripts/platform/storage.js`);
  }
}

const vocabularyFile = fromSource('assets/data/english-vocabulary.json');
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

const serviceWorkerFile = serviceWorkerEntry;
let coreAssets = [];
let deferredAssets = [];
try {
  const serviceWorker = await readFile(serviceWorkerFile, 'utf8');
  const coreList = serviceWorker.match(/const\s+CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  if (!coreList) fail('sw.js không khai báo CORE_ASSETS');
  else {
    const quotedPath = /["']([^"']+)["']/g;
    coreAssets = [...coreList[1].matchAll(quotedPath)].map((match) => match[1]);
    for (const asset of coreAssets) await checkReference(asset, serviceWorkerFile);
  }
  /* Kho từ nặng đã tách khỏi CORE_ASSETS để không chặn lúc cài đặt. Nó vẫn
     phải được kiểm tra đường dẫn, nếu không thì gõ sai tên file sẽ lọt lưới
     và người chơi mất offline mà không ai hay. */
  const deferredList = serviceWorker.match(/const\s+DEFERRED_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  if (!deferredList) fail('sw.js không khai báo DEFERRED_ASSETS');
  else {
    const quotedPath = /["']([^"']+)["']/g;
    deferredAssets = [...deferredList[1].matchAll(quotedPath)].map((match) => match[1]);
    for (const asset of deferredAssets) await checkReference(asset, serviceWorkerFile);
  }

  if (coreList && deferredList) {
    const coreTargets = new Map();
    for (const asset of coreAssets) {
      const target = referenceTarget(asset, serviceWorkerFile);
      if (target) coreTargets.set(target, asset);
    }
    const overlaps = [];
    for (const asset of deferredAssets) {
      const target = referenceTarget(asset, serviceWorkerFile);
      if (target && coreTargets.has(target)) overlaps.push(`${coreTargets.get(target)} ↔ ${asset}`);
    }
    if (overlaps.length) {
      fail(`CORE_ASSETS và DEFERRED_ASSETS bị trùng tài nguyên: ${overlaps.join(', ')}`);
    }

    const cachedTargets = new Set(coreTargets.keys());
    for (const asset of deferredAssets) {
      const target = referenceTarget(asset, serviceWorkerFile);
      if (target) cachedTargets.add(target);
    }
    const reportedTargets = new Set();
    for (const { kind, reference } of runtimeHtmlReferences) {
      const target = referenceTarget(reference, indexFile);
      if (!target || !isInsideSource(target) || cachedTargets.has(target) || reportedTargets.has(target)) continue;
      reportedTargets.add(target);
      fail(`Tài nguyên runtime trong HTML chưa có trong CORE_ASSETS/DEFERRED_ASSETS (${kind}): ${reference}`);
    }
  }
} catch (error) {
  fail(`Không đọc được sw.js: ${error.message}`);
}

const toolingFiles = [
  ...await walk(resolve(projectRoot, 'scripts')),
  ...await walk(resolve(projectRoot, 'tests')),
];
const scriptFiles = [...sourceFiles, ...toolingFiles]
  .filter((file) => ['.js', '.mjs'].includes(extname(file).toLowerCase()));
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
  console.log('✓ HTML không trùng id và mọi tài nguyên runtime đều có chiến lược cache');
  console.log('✓ Chỉ platform/storage.js được truy cập localStorage trực tiếp');
  console.log('✓ manifest và service worker hợp lệ');
}
