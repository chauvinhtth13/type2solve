# Đấu Trường Tư Duy (Type2Solve)

PWA game học tập tiếng Việt chạy hoàn toàn trong trình duyệt: đấu toán theo boss,
Đấu nhanh, Sinh tồn, luyện gõ Anh–Việt, Sudoku, Đấu Đối Kháng, Nim Misère và
Tháp Hà Nội. Không cần tài khoản hay server; tiến độ nằm trên thiết bị và game có
thể tiếp tục chạy khi mất mạng.

Sản phẩm được thiết kế và phát triển bởi **Châu Vinh**.

## Tính năng

- Đấu Toán với 10 boss, câu hỏi sinh theo 5 cấp, vật phẩm và siêu chưởng.
- Đấu Đối Kháng 2 người, tự phân bổ ATK/DEF/HP và thể thức BO1/BO3/BO5.
- Gõ Chữ Diệt Quái với chiến dịch 10 chặng và hơn 80.000 từ Anh–Việt.
- Sudoku 9×9 gồm 6 cấp độ, ghi chú, gợi ý và kiểm tra có giới hạn.
- Nim Misère đấu người hoặc AI ba cấp; Máy Khó dùng chiến lược tối ưu.
- Tháp Hà Nội 3–7 đĩa, hoàn tác, tự giải và kỷ lục theo số bước.
- PWA offline, hỗ trợ bàn phím, IME và `prefers-reduced-motion`.

## Bắt đầu

Yêu cầu Node.js 18 trở lên.

```bash
npm install
npm run serve
```

Mở `http://127.0.0.1:4173`. Có thể đổi cổng bằng `DTTD_PORT`:

```powershell
$env:DTTD_PORT=8080
npm run serve
```

Dev server phục vụ trực tiếp `src/` và assemble HTML partial trong bộ nhớ. Không mở
`src/index.html` bằng `file://` vì service worker chỉ hoạt động trên HTTPS hoặc localhost.

## Kiểm thử

```bash
npm test
npm run test:browser
npm run build
npm run test:dist
npm run verify
```

`npm test` chạy unit test luật game và static smoke. `test:browser` chạy E2E trên
source; `test:dist` chạy cùng bộ E2E trên artefact production. `verify` chạy toàn bộ
pipeline. `CHROME_PATH` cho phép chỉ định Chrome nếu máy không dùng đường dẫn mặc
định trên Windows.

## Kiến trúc

```text
src/
  index.html, manifest.webmanifest, sw.js
  assets/                    dữ liệu lớn, ảnh, icon
  styles/                    cascade source dễ debug
  views/                     partial theo từng màn hình
  scripts/
    app/                     bootstrap và composition
    engine/                  runtime, audio, art dùng chung
    platform/                adapter Web API và storage
    games/
      adventure/             câu hỏi, combat, session, config
      typing/
      sudoku/
      duel/                  rules.js thuần + index.js UI
      nim/                   rules.js thuần + index.js UI
      hanoi/                 rules.js thuần + index.js UI
scripts/                     build, dev server, pipeline từ điển
tests/                       unit, smoke, browser E2E
docs/question-bank/          catalog dạng câu hỏi theo khối
dist/                        artefact sinh tự động, không commit
```

Xem [tài liệu kiến trúc](docs/architecture.md) để biết hướng phụ thuộc, seam của
engine, vòng đời cleanup, quy tắc migration storage và checklist thêm game.

### Source và production

Baseline có nhiều handler HTML và global contract đang được bộ E2E bảo vệ. Source giữ
classic script để debug từng vertical slice mà không cần dev bundler. `npm run build`
đọc đúng dependency order trong HTML, assemble partial, rồi gộp/minify thành một JS và
một CSS cho production. Cách này giảm request mà không tạo hai implementation gameplay.

### Dữ liệu và lưu tiến độ

`src/scripts/platform/storage.js` là nơi duy nhất ghi `localStorage`. `GameStorage`
cung cấp schema có version, normalize dữ liệu hỏng, fallback trong bộ nhớ và phát sự
kiện cập nhật HUD. Không ghi trực tiếp `localStorage` từ game.

Kho từ `src/assets/data/english-vocabulary.json` được tải khi cần và cache sau khi
service worker kích hoạt, nên không chặn lần mở app đầu tiên. Tạo lại kho từ bằng:

```bash
npm run build:dictionary
```

Nguồn dữ liệu và điều kiện ghi công được lưu tại
[docs/third-party-notices.md](docs/third-party-notices.md).

### Catalog câu hỏi

Game sinh câu hỏi từ công thức trong
`src/scripts/games/adventure/questions.js`. Các file dưới
[`docs/question-bank/`](docs/question-bank/README.md) là catalog tra cứu, không được
nạp lúc chạy.

## Production và deploy

```bash
npm run build
npm run test:dist
```

Deploy nội dung của `dist/`. Tất cả URL runtime là tương đối nên hoạt động dưới subpath
GitHub Pages. Với Netlify hoặc Vercel, dùng build command `npm run build` và output
directory `dist`.

Không chỉnh tay `dist/`. Build tự tạo cache version từ nội dung core và deferred
assets, rồi ghi asset list thực tế vào service worker production.

## Đóng góp

1. Giữ chuỗi hiển thị bằng tiếng Việt và không đổi cốt lõi giáo dục nếu thiếu test.
2. Đưa công thức game vào `rules.js` thuần; UI chỉ điều phối state và render.
3. Mỗi timer/RAF/listener theo phiên phải được cleanup khi restart hoặc về trang chủ.
4. Không ghi trực tiếp `localStorage`.
5. Chạy `npm run verify` trước khi phát hành.

Góp ý và báo lỗi: [chauvinhtth13@gmail.com](mailto:chauvinhtth13@gmail.com).
Mã nguồn: [github.com/chauvinhtth13/type2solve](https://github.com/chauvinhtth13/type2solve).
