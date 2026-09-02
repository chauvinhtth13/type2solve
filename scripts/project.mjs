import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sourceDir = resolve(projectRoot, 'src');
export const distDir = resolve(projectRoot, 'dist');
export const htmlEntry = resolve(sourceDir, 'index.html');
export const manifestEntry = resolve(sourceDir, 'manifest.webmanifest');
export const serviceWorkerEntry = resolve(sourceDir, 'sw.js');

export const deferredAssets = Object.freeze([
  'assets/data/english-vocabulary.json',
  'assets/images/donate-qr.jpg',
]);

export function fromSource(relativePath) {
  return resolve(sourceDir, relativePath);
}

export function fromDist(relativePath) {
  return resolve(distDir, relativePath);
}
