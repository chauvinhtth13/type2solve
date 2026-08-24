# Đấu Trường Tư Duy (Type2Solve)

Game học tập tiếng Việt chạy hoàn toàn trong trình duyệt — không server, không tài
khoản, không quảng cáo. Học sinh tiểu học vừa chơi vừa luyện **toán tư duy** (đấu boss
theo cấp độ, đấu đối kháng 2 người, đấu nhanh, sinh tồn), **gõ phím tiếng Anh/Việt**
diệt quái, giải **Sudoku 9×9** 6 cấp độ, và chơi **Nim theo luật Misère** — tất cả lưu
tiến độ ngay trên máy, chơi được cả khi mất mạng (PWA).

Sản phẩm được thiết kế và phát triển bởi **Châu Vinh**.

## ✨ Điểm nổi bật

| | |
|---|---|
| ⚔️ **Đấu Toán** | 10 boss tăng dần độ khó, mua vật phẩm giữa chặng, siêu chưởng, chế độ Đấu nhanh 60 giây và Sinh tồn vô tận |
| 🆚 **Đấu Đối Kháng** | 2 người cùng máy tự đặt tên, tuỳ chỉnh nhân vật, thay phiên trả lời câu hỏi để tung chưởng — ai hết máu trước thua |
| 🪨 **Nim Misère** | Bốc sỏi từng đống theo luật ngược với Nim thường: ai bốc viên cuối cùng sẽ THUA |
| ⌨️ **Gõ Chữ Diệt Quái** | Luyện gõ tiếng Anh (hơn 82.000 từ kèm nghĩa) hoặc tiếng Việt có dấu, chiến dịch 10 chặng |
| 🧩 **Sudoku** | 6 cấp độ từ Làm quen (50 ô mở) đến Tối thượng (17 ô), ghi chú, gợi ý, kỷ lục theo từng cấp |
| 📴 **Chơi offline** | Service worker cài sẵn toàn bộ game, tự cập nhật khi có bản mới |
| ♿ **Trợ năng** | Bàn phím đầy đủ, `aria-live` cho phản hồi, tôn trọng `prefers-reduced-motion` |
| 🪶 **Zero-dependency** | Chạy thẳng bằng HTML/CSS/JS thuần, không bundler, không framework |

## 🚀 Chạy project

Yêu cầu duy nhất: Node.js 18 trở lên (chỉ để chạy công cụ đi kèm — bản thân game không
cần build để chạy).

```bash
npm run serve
```

Mở `http://127.0.0.1:4173`. Đổi cổng bằng biến môi trường `DTTD_PORT`:

```powershell
$env:DTTD_PORT=8080
npm run serve
```

Không mở trực tiếp `index.html` bằng `file://` — service worker/PWA chỉ đăng ký được
trên HTTPS hoặc localhost.

### Kiểm tra trước khi public

```bash
npm test            # tham chiếu file + cú pháp toàn bộ JavaScript
npm run test:browser # kiểm thử đầu-cuối qua Chrome headless (cần cài Google Chrome)
```

`test:browser` tự tìm Chrome tại `C:\Program Files\Google\Chrome\Application`; dùng máy
khác thì truyền `CHROME_PATH`.

### Build production (tuỳ chọn)

Game chạy tốt trực tiếp từ mã nguồn — bước build chỉ để **nén nhỏ hơn khi deploy**,
không đổi cách hoạt động:

```bash
npm run build          # minify JS/CSS bằng esbuild (không bundle), xuất ra dist/
node tools/verify-dist.mjs   # chạy lại bộ kiểm thử đầu-cuối nhắm vào dist/ vừa build
```

`dist/` không được commit (xem `.gitignore`) — chạy `npm run build` lại mỗi lần deploy.

## 📁 Cấu trúc thư mục

```text
index.html                       Khung giao diện và toàn bộ màn chơi
manifest.webmanifest, sw.js      Cài đặt PWA và chơi lại khi offline
assets/css/main.css              Giao diện đấu trường gốc + modal + trang chủ
assets/css/learning-games.css    Gõ Chữ, Sudoku, Đấu Đối Kháng, Nim, responsive
assets/js/storage.js             Hồ sơ localStorage có phiên bản (GameStorage)
assets/js/core.js                Tiện ích dùng chung, âm thanh, trạng thái đấu trường
assets/js/question-bank.js       Máy sinh câu hỏi toán (tier 1–5, ~35 dạng)
assets/js/arena.js               Cơ chế câu hỏi và chiến đấu (chế độ Phiêu lưu)
assets/js/games/typing.js        Gõ Chữ Diệt Quái
assets/js/games/sudoku.js        Sudoku 6 cấp độ
assets/js/games/duel.js          Đấu Đối Kháng (2 người cùng máy)
assets/js/games/nim.js           Nim theo luật Misère (2 người cùng máy)
assets/js/data/                  Dữ liệu nội dung tĩnh (từ vựng gõ chữ, chiến dịch...)
assets/data/english-vocabulary.json  Kho từ Anh–Việt đã lọc (~82.000 mục)
assets/images/                   Ảnh tĩnh (mã QR ủng hộ...)
assets/js/bootstrap.js           Khởi tạo, accessibility, PWA, modal dùng chung
database/                        Tài liệu tra cứu ngân hàng câu hỏi theo khối (xem bên dưới)
tools/                           Máy chủ dev, build production, pipeline dữ liệu, smoke test
```

Các script trình duyệt dùng global API để giữ project thuần tĩnh — không bundler, không
framework. Thứ tự nạp script trong `index.html` **chính là hệ thống module** của dự án:
mỗi file dùng biến toàn cục do file trước nó định nghĩa. Thêm game mới thì thêm màn hình
vào `index.html`, thêm `<script defer>` mới **trước** `bootstrap.js`, và thêm cùng đường
dẫn đó vào `CORE_ASSETS` (hoặc `DEFERRED_ASSETS` nếu không cần thiết cho lần mở đầu) của
`sw.js` — rồi tăng `CACHE_VERSION` để người chơi cũ nhận bản mới khi offline.

`GameStorage` (trong `storage.js`) là **nơi duy nhất** được ghi `localStorage`, cung cấp
`load`, `save`, `addStars`, `updateRecords`, `setAdventure`, `updateSettings`, `reset`.
Dữ liệu hỏng hoặc trình duyệt chặn localStorage sẽ tự lùi về hồ sơ an toàn trong bộ nhớ.

### `/database/` — tài liệu tra cứu ngân hàng câu hỏi

`question-bank.js` sinh câu hỏi bằng công thức ngẫu nhiên, không phải danh sách cố định.
Thư mục `database/` là **catalog tham khảo**, không được game đọc lúc chạy: mỗi file
`grade-1.md` … `grade-5.md` liệt kê mọi dạng câu hỏi (ID, chủ đề, hàm sinh, độ khó) đang
chạy ở tier tương ứng, kèm ví dụ thật lấy trực tiếp từ `genQuestion()`. Xem
[`database/README.md`](database/README.md) để biết giới hạn và cách cập nhật.

## ☁️ Deploy

### GitHub Pages

1. Đưa toàn bộ nội dung repo lên (để `index.html` ở root) — hoặc deploy `dist/` sau khi
   `npm run build` nếu muốn bản đã nén.
2. **Settings → Pages** → **Deploy from a branch**, chọn `main`, thư mục `/ (root)`.
3. Mở URL Pages được cấp. Mọi đường dẫn đều tương đối nên vẫn chạy đúng dưới
   `/ten-repository/`.

### Netlify

- Nhanh nhất: kéo thả thư mục project (hoặc `dist/` đã build) vào **Netlify Drop**.
- Qua Git: import repository, để trống build command (hoặc đặt `npm run build` +
  publish directory `dist`), publish directory `.` nếu deploy thẳng mã nguồn.

### Vercel

Import repository, chọn framework **Other**. Deploy thẳng mã nguồn thì để trống build
command, output directory `.`; muốn bản nén thì build command `npm run build`, output
directory `dist`. Sau khi deploy, mở DevTools → Application để xác nhận manifest/service
worker đã hoạt động.

## 🤝 Đóng góp

Repo không dùng framework/bundler — đọc kỹ file bạn định sửa trước khi đổi phong cách
code (xem quy ước 2 phong cách đang cùng tồn tại: nén gọn ở `core.js`/`arena.js`/
`question-bank.js`, hiện đại/IIFE có chú thích ở `storage.js`/`games/*`/`data/*`/`tools/*`).
Trước khi gửi Pull Request:

1. Chạy `npm test` và `npm run test:browser` — cả hai phải xanh.
2. Giữ tiếng Việt cho mọi chuỗi hiển thị, comment và thông báo lỗi trong UI.
3. Game mới/màn mới phải hỗ trợ bàn phím, có vùng `aria-live` cho phản hồi động, và tôn
   trọng `prefers-reduced-motion`.
4. Đừng ghi thẳng `localStorage` — luôn đi qua `GameStorage.updateRecords(...)` v.v. để
   HUD trang chủ cập nhật đúng qua sự kiện `learning-progress`.

## 💬 Feedback & 💛 Ủng hộ

- **Góp ý / báo lỗi:** gửi email tới [chauvinhtth13@gmail.com](mailto:chauvinhtth13@gmail.com)
  — đặc biệt hữu ích nếu bạn là phụ huynh/giáo viên phát hiện câu hỏi sai hoặc muốn đề
  xuất nội dung mới. Trong game cũng có nút **"💛 Ủng hộ & Góp ý"** ở chân trang chủ,
  mở modal có sẵn email và mã QR.
- **Ủng hộ dự án:** hoàn toàn tuỳ tâm, không ảnh hưởng tới việc chơi — quét mã QR trong
  modal nói trên nếu bạn thấy sản phẩm hữu ích cho con em mình.
- **Mã nguồn mở:** repo công khai tại
  [github.com/chauvinhtth13/type2solve](https://github.com/chauvinhtth13/type2solve) —
  sao chép, tự deploy hoặc gửi Pull Request đều được hoan nghênh.

Tiến độ chơi chỉ nằm trên trình duyệt hiện tại; xoá dữ liệu website hoặc gọi
`GameStorage.reset()` trong console sẽ tạo hồ sơ mới.
