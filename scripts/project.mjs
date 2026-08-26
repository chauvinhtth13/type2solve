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
  'assets/images/hd2d/key_art_header.jpg',
  'assets/images/hd2d/mascot_idle.jpg',
  'assets/images/hd2d/mascot_combo.jpg',
  'assets/images/hd2d/mascot_urgent.jpg',
  'assets/images/hd2d/mascot_gameover.jpg',
  'assets/images/hd2d/ui_icon_wpm.jpg',
  'assets/images/hd2d/ui_icon_accuracy.jpg',
  'assets/images/hd2d/ui_icon_trophy.jpg',
  'assets/images/hd2d/ui_icon_timer.jpg',
  'assets/images/hd2d/hero_wizard.jpg',
  'assets/images/hd2d/boss_dragon.jpg',
  'assets/images/hd2d/player_tiger.jpg',
]);

export function fromSource(relativePath) {
  return resolve(sourceDir, relativePath);
}

export function fromDist(relativePath) {
  return resolve(distDir, relativePath);
}
