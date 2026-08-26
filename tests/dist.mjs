/* Chạy lại đúng bộ assertion của browser.mjs nhưng nhằm vào dist/ đã build —
   bắt lỗi minify làm hỏng cú pháp/logic trước khi coi bản build là dùng được.
   Hai phase dùng cùng một harness và chỉ chia vòng đời Chrome để bộ E2E dài
   không phụ thuộc giới hạn thời gian của một tiến trình duy nhất. */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');

if (!existsSync(distDir)) {
  console.error('❌ Chưa có dist/ — chạy `npm run build` trước.');
  process.exit(1);
}

const phases = [
  ['early', 'DTTD_BROWSER_EARLY'],
  ['late', 'DTTD_BROWSER_LATE'],
];

for (const [label, flag] of phases) {
  console.log(`\n▶ Browser E2E dist — ${label}`);
  const result = spawnSync(process.execPath, ['tests/browser.mjs'], {
    cwd: root,
    env: { ...process.env, DTTD_ROOT: distDir, [flag]: '1' },
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('\n✓ Hai phase browser E2E của dist đều đạt');
