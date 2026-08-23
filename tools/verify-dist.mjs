/* Chạy lại đúng bộ 51 assertion của browser-smoke.mjs nhưng nhằm vào dist/ đã
   build — bắt lỗi minify làm hỏng cú pháp/logic trước khi coi bản build là
   dùng được. Không lặp lại logic: browser-smoke.mjs hoàn toàn không đọc file
   nguồn qua fs (chỉ dựng server + đánh giá qua CDP), nên chạy nó với
   DTTD_ROOT trỏ vào dist/ là đủ để kiểm cả cây file đã build, không cần một
   bộ assertion thứ hai. */
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

const result = spawnSync(process.execPath, ['tools/browser-smoke.mjs'], {
  cwd: root,
  env: { ...process.env, DTTD_ROOT: distDir },
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
