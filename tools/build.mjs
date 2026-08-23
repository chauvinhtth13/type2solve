/* Bản build cho production: minify JS/CSS bằng esbuild KHÔNG --bundle (mỗi
   file minify độc lập, không gộp, không đổi tên biến cấp cao nhất) — 8 file
   game vẫn là classic script rò globals ra window y hệt bản chưa minify, 55
   onclick= trong index.html và các global mà browser-smoke.mjs khẳng định
   đều sống sót nguyên vẹn. Không Vite, không React: Vite bỏ qua hoàn toàn
   <script> thiếu type="module", còn đổi 8 file này sang ES module thật để
   Vite/Rollup bundle được là một cuộc tái cấu trúc lớn cho lợi ích nhỏ.

   CORE_ASSETS được suy ra từ chính index.html (đúng cách tools/smoke-test.mjs
   đọc file), không phải danh sách tay thứ hai. CACHE_VERSION = hash nội dung
   thật của các asset đã build — không thể quên bump, không thể trùng nhầm. */
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as esbuild from 'esbuild';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(projectRoot, 'dist');
const DEFERRED_ASSETS = ['assets/data/english-vocabulary.json'];

function toDist(relativePath) {
  return resolve(distDir, relativePath);
}

async function ensureParentDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

/* Cùng regex tools/smoke-test.mjs dùng để soát src=/href= — bỏ qua remote,
   data:, mailto:/tel:/javascript:, #neo, và ${...} còn nguyên trong template. */
function extractLocalRefs(html) {
  const refs = [];
  const pattern = /\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const value = match[2];
    if (!value || value.includes('${')) continue;
    if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(value)) continue;
    if (/^(data|mailto|tel|javascript):/i.test(value)) continue;
    if (value.startsWith('#')) continue;
    const clean = value.replace(/^\.\//, '').split(/[?#]/)[0];
    if (!refs.includes(clean)) refs.push(clean);
  }
  return refs;
}

async function minifyOrCopy(relPath) {
  const srcAbs = resolve(projectRoot, relPath);
  const outAbs = toDist(relPath);
  await ensureParentDir(outAbs);
  if (relPath.endsWith('.js')) {
    const code = await readFile(srcAbs, 'utf8');
    const result = await esbuild.transform(code, { loader: 'js', minify: true, target: 'es2019' });
    await writeFile(outAbs, result.code);
  } else if (relPath.endsWith('.css')) {
    const code = await readFile(srcAbs, 'utf8');
    const result = await esbuild.transform(code, { loader: 'css', minify: true });
    await writeFile(outAbs, result.code);
  } else {
    await copyFile(srcAbs, outAbs);
  }
}

async function build() {
  await rm(distDir, { recursive: true, force: true });

  const htmlPath = resolve(projectRoot, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const refs = extractLocalRefs(html);

  const localAssets = [];
  for (const ref of refs) {
    const abs = resolve(projectRoot, ref);
    if (!abs.startsWith(projectRoot)) continue; // ngoài dự án thì bỏ qua
    try {
      await stat(abs);
    } catch {
      continue; // tham chiếu hỏng — smoke-test.mjs đã bắt lỗi này riêng
    }
    localAssets.push(ref);
  }

  await ensureParentDir(toDist('index.html'));
  await copyFile(htmlPath, toDist('index.html'));
  for (const ref of localAssets) await minifyOrCopy(ref);
  for (const ref of DEFERRED_ASSETS) await minifyOrCopy(ref);

  const coreAssets = ['./', './index.html', ...localAssets.map((ref) => `./${ref}`)];

  const hash = createHash('sha256');
  for (const ref of coreAssets) {
    if (ref === './') continue;
    hash.update(await readFile(toDist(ref.replace(/^\.\//, ''))));
  }
  const version = `v${hash.digest('hex').slice(0, 10)}`;

  let swSource = await readFile(resolve(projectRoot, 'sw.js'), 'utf8');
  swSource = swSource.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${version}';`);
  swSource = swSource.replace(
    /const CORE_ASSETS = \[[\s\S]*?\];/,
    `const CORE_ASSETS = ${JSON.stringify(coreAssets, null, 2)};`,
  );
  await writeFile(toDist('sw.js'), swSource);

  console.log(`✅ dist/ sẵn sàng — ${coreAssets.length - 1} core asset, CACHE_VERSION=${version}`);
}

build().catch((error) => {
  console.error('❌ Build thất bại:', error);
  process.exitCode = 1;
});
