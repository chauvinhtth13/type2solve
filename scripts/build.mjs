/* Production build: assemble HTML partials, collapse ordered classic scripts and
   styles into two minified files, copy static assets, then derive the offline
   cache from the emitted application. Source stays split for debugging while
   production avoids a request per module. */
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import * as esbuild from 'esbuild';
import { renderHtml } from './lib/html.mjs';
import { cleanReferencePath, extractHtmlReferences, isLocalReference } from './lib/references.mjs';
import {
  deferredAssets, distDir, fromDist, fromSource, htmlEntry,
  projectRoot, serviceWorkerEntry, sourceDir,
} from './project.mjs';

async function ensureParentDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

function inside(parent, candidate) {
  const fromParent = relative(parent, candidate);
  return fromParent === '' || (!fromParent.startsWith('..') && !isAbsolute(fromParent));
}

function collectOrderedAssets(html) {
  const scripts = [];
  const styles = [];
  const scriptPattern = /<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*><\/script>/gi;
  const stylePattern = /<link\b(?=[^>]*\brel\s*=\s*(["'])stylesheet\1)[^>]*\bhref\s*=\s*(["'])(.*?)\2[^>]*>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    if (isLocalReference(match[2])) scripts.push({ tag: match[0], path: cleanReferencePath(match[2]) });
  }
  for (const match of html.matchAll(stylePattern)) {
    if (isLocalReference(match[3])) styles.push({ tag: match[0], path: cleanReferencePath(match[3]) });
  }
  return { scripts, styles };
}

function replaceOrderedAssets(html, assets) {
  let output = html;
  assets.styles.forEach((asset, index) => {
    output = output.replace(asset.tag, index === 0 ? '<link rel="stylesheet" href="assets/app.css">' : '');
  });
  assets.scripts.forEach((asset, index) => {
    output = output.replace(asset.tag, index === 0 ? '<script defer src="assets/app.js"></script>' : '');
  });
  return output;
}

async function concatenate(paths) {
  const chunks = [];
  for (const relativePath of paths) chunks.push(await readFile(fromSource(relativePath), 'utf8'));
  return chunks.join('\n;\n');
}

async function emitBundles(assets) {
  const js = await esbuild.transform(await concatenate(assets.scripts.map((asset) => asset.path)), {
    loader: 'js', minify: true, target: 'es2019', legalComments: 'none', sourcefile: 'app.js',
  });
  const css = await esbuild.transform(await concatenate(assets.styles.map((asset) => asset.path)), {
    loader: 'css', minify: true, legalComments: 'none', sourcefile: 'app.css',
  });
  await ensureParentDir(fromDist('assets/app.js'));
  await Promise.all([
    writeFile(fromDist('assets/app.js'), js.code),
    writeFile(fromDist('assets/app.css'), css.code),
  ]);
  return { jsBytes: Buffer.byteLength(js.code), cssBytes: Buffer.byteLength(css.code) };
}

async function copyStaticAsset(relativePath) {
  const source = fromSource(relativePath);
  const target = fromDist(relativePath);
  if (!inside(sourceDir, source) || !inside(distDir, target)) throw new Error(`Asset nằm ngoài project: ${relativePath}`);
  await ensureParentDir(target);
  await copyFile(source, target);
}

async function build() {
  if (distDir !== resolve(projectRoot, 'dist') || !inside(projectRoot, distDir)) {
    throw new Error(`Từ chối xóa thư mục build ngoài project: ${distDir}`);
  }
  await rm(distDir, { recursive: true, force: true });

  const sourceHtml = await renderHtml(htmlEntry, { rootDir: sourceDir });
  const orderedAssets = collectOrderedAssets(sourceHtml);
  if (!orderedAssets.scripts.length || !orderedAssets.styles.length) {
    throw new Error('Không tìm thấy script/style local trong HTML đã assemble.');
  }
  const bundleStats = await emitBundles(orderedAssets);
  const builtHtml = replaceOrderedAssets(sourceHtml, orderedAssets);
  await ensureParentDir(fromDist('index.html'));
  await writeFile(fromDist('index.html'), builtHtml, 'utf8');

  const generated = new Set(['assets/app.js', 'assets/app.css']);
  const htmlRefs = extractHtmlReferences(builtHtml).map(cleanReferencePath).filter(Boolean);
  const copyRefs = [...new Set([...htmlRefs, ...deferredAssets])].filter((ref) => !generated.has(ref));
  for (const ref of copyRefs) {
    try {
      await stat(fromSource(ref));
      await copyStaticAsset(ref);
    } catch (error) {
      if (error?.code === 'ENOENT') throw new Error(`Thiếu asset build: ${ref}`);
      throw error;
    }
  }

  const deferredSet = new Set(deferredAssets);
  const coreRefs = htmlRefs.filter((ref) => !deferredSet.has(ref));
  const coreAssets = ['./', './index.html', ...coreRefs.map((ref) => `./${ref}`)];

  const hash = createHash('sha256');
  const versionedAssets = [...new Set([...coreAssets, ...deferredAssets.map((ref) => `./${ref}`)])];
  for (const ref of versionedAssets) {
    if (ref === './') continue;
    hash.update(await readFile(fromDist(ref.replace(/^\.\//, ''))));
  }
  const version = `v${hash.digest('hex').slice(0, 10)}`;

  let swSource = await readFile(serviceWorkerEntry, 'utf8');
  swSource = swSource.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${version}';`);
  swSource = swSource.replace(
    /const CORE_ASSETS = \[[\s\S]*?\];/,
    `const CORE_ASSETS = ${JSON.stringify(coreAssets, null, 2)};`,
  );
  swSource = swSource.replace(
    /const DEFERRED_ASSETS = \[[\s\S]*?\];/,
    `const DEFERRED_ASSETS = ${JSON.stringify(deferredAssets.map((ref) => `./${ref}`), null, 2)};`,
  );
  await writeFile(fromDist('sw.js'), swSource);

  console.log(`✅ dist/ sẵn sàng — 1 JS (${bundleStats.jsBytes} B), 1 CSS (${bundleStats.cssBytes} B)`);
  console.log(`✅ ${coreAssets.length - 1} core asset, ${deferredAssets.length} deferred asset, CACHE_VERSION=${version}`);
}

build().catch((error) => {
  console.error('❌ Build thất bại:', error);
  process.exitCode = 1;
});
