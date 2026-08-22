# Đấu Trường Tư Duy

Một game học tập chạy hoàn toàn trên trình duyệt, được tách từ bản HTML đơn thành project tĩnh dễ phát triển và public. Người chơi có thể đấu boss bằng câu hỏi toán, tự nhập kết quả, luyện gõ tiếng Anh/tiếng Việt để diệt quái và giải Sudoku 9×9 ở 6 cấp độ từ Làm quen đến Tối thượng 17 ô.

Sản phẩm được sáng tạo và phát triển bởi **Châu Vinh**.

Ngân hàng toán có thêm 19 mẫu “Thử thách mới” trải đều 5 cấp: quy luật hiệu lẻ, số liên tiếp, que diêm, lập số, đường đi trên lưới, bao hàm–loại trừ, số dư, đếm ước, năng suất chung, nghiệm nguyên và giai thừa. Mỗi câu vẫn sinh dữ kiện mới, đáp án nhiễu và lời giải từng bước.

Nhóm **Singapore lớp 3** bổ sung thêm 18 dạng: quy luật/que diêm, lịch với số ngày lớn và qua năm nhuận, trồng cây trên đoạn thẳng/đường tròn, khối lập phương, diện tích theo tỉ lệ, tính ngược tiền góp, chữ số tận cùng và hai câu bẫy mật mã số. Danh mục chuyên đề được tham khảo từ [MathX – Toán tư duy Singapore lớp 3](https://mathx.vn/khoa-hoc/toan-tu-duy-singapore-lop-3.html); câu hỏi trong game được biên soạn từ nội dung người dùng cung cấp hoặc tạo biến thể mới và tự kiểm chứng, không đóng gói video/phần luyện tập bị giới hạn truy cập của MathX.

## Chạy project

Yêu cầu duy nhất để dùng công cụ đi kèm là Node.js 18 trở lên. Project không có dependency và không cần bước build.

```bash
npm run serve
```

Mở `http://127.0.0.1:4173`. Có thể đổi cổng bằng biến môi trường `DTTD_PORT`, ví dụ trong PowerShell:

```powershell
$env:DTTD_PORT=8080
npm run serve
```

Không nên mở trực tiếp `index.html` bằng `file://`, vì trình duyệt chỉ cho cài service worker/PWA trên HTTPS hoặc localhost.

Chạy kiểm tra trước khi public:

```bash
npm test
```

Smoke test kiểm tra file được HTML/CSS/manifest/service worker tham chiếu và cú pháp toàn bộ JavaScript.

Nếu máy có Google Chrome, chạy thêm kiểm thử trình duyệt đầu-cuối (mặc định tìm Chrome trong `C:\Program Files\Google\Chrome\Application`):

```bash
npm run test:browser
```

Có thể truyền đường dẫn khác qua biến môi trường `CHROME_PATH`.

## Kho từ tiếng Anh

Game đi kèm kho hơn 82.000 mục Anh–Việt đã lọc từ Wiktionary tiếng Việt. Các từ thông dụng được ưu tiên ở cấp dễ/vừa; từ hiếm nằm ở cấp nâng cao. Tệp đã sinh sẵn nên chạy game không cần cài thêm dependency.

Muốn cập nhật kho từ theo snapshot mới, cài công cụ tần suất rồi chạy pipeline:

```bash
python -m pip install wordfreq
npm run build:dictionary
```

Pipeline tải dữ liệu Kaikki/Wiktextract, rút gọn nghĩa, bỏ tên riêng/biến thể chia từ/nội dung nhạy cảm, loại trùng và phân thành ba cấp. Ghi công và giấy phép dữ liệu nằm trong `THIRD_PARTY_NOTICES.md`.

## Cấu trúc

```text
index.html                       Khung giao diện và các màn chơi
assets/css/main.css              Giao diện đấu trường gốc
assets/css/learning-games.css    Escape room, typing, memory, responsive
assets/js/core.js                Tiện ích, âm thanh, trạng thái đấu trường
assets/js/question-bank.js       Ngân hàng câu hỏi
assets/js/arena.js               Cơ chế câu hỏi và chiến đấu
assets/js/storage.js             Hồ sơ localStorage có phiên bản
assets/js/data/                  Dữ liệu nội dung các game học tập
assets/data/english-vocabulary.json  Kho từ Anh–Việt đã lọc
assets/js/games/                 Logic game luyện gõ và Sudoku
assets/js/bootstrap.js           Khởi tạo, accessibility, PWA
manifest.webmanifest, sw.js      Cài đặt PWA và chơi lại khi offline
tools/                           Máy chủ, pipeline dữ liệu và smoke test
```

Các script trình duyệt hiện dùng global API để giữ project thuần tĩnh, không cần bundler. `GameStorage` cung cấp `load`, `save`, `addStars`, `updateRecords`, `setAdventure`, `setEscape`, `updateSettings` và `reset`. Dữ liệu hỏng hoặc trình duyệt chặn localStorage sẽ tự lùi về hồ sơ an toàn trong bộ nhớ.

## Public

### GitHub Pages

1. Đưa toàn bộ nội dung thư mục này vào repository (để `index.html` ở root).
2. Trên GitHub vào **Settings → Pages**.
3. Chọn **Deploy from a branch**, branch `main`, thư mục `/ (root)` rồi lưu.
4. Mở URL Pages được GitHub cấp. Các đường dẫn đều tương đối nên vẫn hoạt động khi site nằm dưới `/ten-repository/`.

### Netlify

- Cách nhanh: kéo thả cả thư mục project vào trang **Netlify Drop**.
- Qua Git: import repository, để trống build command và đặt publish directory là `.`.

### Vercel

Import repository, chọn framework **Other**, không đặt build command và dùng output directory `.`. Sau khi deploy, kiểm tra một lượt game và tab Application trong DevTools để xác nhận manifest/service worker đã hoạt động.

## Thêm nội dung hoặc game mới

- Đặt dữ liệu tĩnh trong `assets/js/data/`, logic trong `assets/js/games/` và style riêng trong `learning-games.css`.
- Thêm màn chơi vào `index.html`, sau đó thêm script mới trước `bootstrap.js`.
- Nếu game cần offline, thêm đường dẫn tương đối vào `CORE_ASSETS` trong `sw.js` và tăng `CACHE_VERSION` khi public bản mới.
- Lưu kỷ lục qua `GameStorage.updateRecords(...)`, không ghi trực tiếp localStorage; thao tác này đồng thời cập nhật HUD qua sự kiện `learning-progress`.
- Luôn hỗ trợ bàn phím, trạng thái focus, `aria-live` cho phản hồi và chế độ `prefers-reduced-motion` cho hoạt ảnh.

## Thiết lập mã QR cà phê

Trang chủ đã có một khu ủng hộ nhỏ, mặc định hiển thị trạng thái “Đang chờ mã thanh toán” để không vô tình công bố sai tài khoản. Khi có QR thật, thay phần `.coffee-qr-placeholder` trong `index.html` bằng ảnh của bạn, ví dụ:

```html
<img class="coffee-qr-image" src="assets/images/coffee-qr.png"
     alt="Mã QR ủng hộ cà phê cho Châu Vinh">
```

Đặt ảnh tương ứng tại `assets/images/coffee-qr.png`, thêm đường dẫn đó vào `CORE_ASSETS` trong `sw.js`, rồi tăng `CACHE_VERSION` để QR mới được cập nhật khi chơi offline.

Tiến độ chỉ nằm trên trình duyệt hiện tại; xóa dữ liệu website hoặc dùng `GameStorage.reset()` sẽ tạo hồ sơ mới.
