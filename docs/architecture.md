# Kiến trúc Type2Solve

## Mục tiêu

Type2Solve là PWA tĩnh, không backend và không framework. Kiến trúc ưu tiên bốn đặc
tính: chạy được dưới subpath của GitHub Pages, giữ tiến độ cũ trong `localStorage`,
chơi được offline và cho phép kiểm thử luật game mà không cần DOM.

## Cây thư mục

```text
src/                         Mã và tài sản được phục vụ cho trình duyệt
  index.html                 Shell HTML, assemble các partial trong views/
  manifest.webmanifest       Metadata PWA
  sw.js                      Chiến lược cache của bản source/dev
  assets/                    Dữ liệu lớn, ảnh và icon tĩnh
  styles/                    Style app, game và theme theo đúng cascade order
  views/                     Markup theo màn hình, không chứa logic
  scripts/
    app/                     Bootstrap, nền và composition cấp ứng dụng
    engine/                  Runtime, âm thanh và renderer dùng chung
    platform/                Adapter cho Web API như storage
    games/                   Vertical slice của từng game
scripts/                     Build, dev server và pipeline dữ liệu
tests/                       Unit, static smoke và browser E2E
docs/                        Kiến trúc và catalog câu hỏi
dist/                        Artefact production sinh tự động, không commit
```

## Hướng phụ thuộc

```text
views / game UI  ->  game rules  ->  pure data
       |                 |
       v                 X
engine / platform  -> DOM, Audio, Storage, Service Worker
```

- File `rules.js` không được đọc DOM, `localStorage`, audio hoặc state của màn hình.
- File `index.js` của game sở hữu state phiên chơi và render, nhưng gọi luật qua
  object đã đóng băng như `NimRules`, `DuelRules`, `HanoiRules`.
- `platform/storage.js` là nơi duy nhất ghi `localStorage`.
- `app/bootstrap.js` chỉ compose hành vi cấp ứng dụng, accessibility và PWA.
- Game không import ngược code UI của game khác. Chia sẻ chỉ qua `engine/` hoặc
  `platform/` khi đã có ít nhất hai consumer thật.

Các script trình duyệt vẫn là classic script để giữ tương thích với handler HTML và
baseline hiện tại. Thứ tự trong `src/index.html` là dependency order. Production build
đọc chính thứ tự đó và gộp thành `dist/assets/app.js`; không có danh sách thứ tự thứ hai.

## Module sâu và seam

- `GameStorage` che toàn bộ schema, migration, fallback và phát sự kiện sau một
  interface nhỏ (`load`, `save`, `updateRecords`, `setAdventure`, `updateSettings`).
- Mỗi `*Rules` che công thức và invariant sau các hàm thuần. Unit test đi qua cùng
  interface mà UI sử dụng.
- HTML assembler che việc chia partial; build, smoke test và dev server đều gọi một
  hàm `renderHtml`, nhờ đó không có ba cách ghép HTML khác nhau.
- Production builder là seam giữa source dễ đọc và artefact ít request. Source không
  phụ thuộc vào `dist/`.

## Vòng đời và cleanup

Mỗi game phải có hàm cleanup công khai và `goHome()` gọi cleanup trước khi đổi màn.
Timer/RAF/listener sống theo phiên phải có token hoặc registry để callback cũ không
được phép sửa state mới. Các collection timer phải có kích thước hữu hạn và được xóa
khi rời màn.

## Storage

Khóa dữ liệu và `version` hiện tại phải được giữ ổn định. Khi đổi schema:

1. Tăng version trong adapter storage.
2. Viết migration từ mọi version còn hỗ trợ.
3. Normalize dữ liệu sau migration và trước persist.
4. Thêm test JSON hỏng, field thiếu và giá trị ngoài biên.
5. Không đổi khóa hoặc xóa dữ liệu cũ nếu chưa có migration.

## PWA và build

`src/sw.js` là bản dễ đọc dùng trong dev. `npm run build`:

1. Assemble HTML partials.
2. Gộp/minify script và CSS theo thứ tự HTML.
3. Copy asset tĩnh.
4. Tách kho từ và QR khỏi core cache.
5. Tính cache version từ nội dung của cả core lẫn deferred assets.
6. Ghi danh sách asset thực tế vào `dist/sw.js`.

Việc hash cả deferred asset ngăn kho từ cũ nằm mãi trong cache khi dữ liệu thay đổi.
Không chỉnh trực tiếp file trong `dist/`.

## Thêm game mới

1. Tạo `src/scripts/games/<game>/rules.js` nếu có luật thuần.
2. Tạo `index.js` cho state, render, input và cleanup.
3. Tạo partial màn hình dưới `src/views/screens/`.
4. Thêm script vào dependency order của shell.
5. Thêm unit test luật và scenario E2E mở/chơi/rời màn.
6. Chạy `npm test`, `npm run test:browser`, `npm run build`, `npm run test:dist`.

## Xóa mã

Chỉ xóa khi tìm kiếm tĩnh không còn consumer, browser test không dùng global đó và
không có đường gọi động từ handler HTML. Với API từng public trên `window`, xóa theo
hai bước: chuyển caller sang interface mới, rồi xóa alias ở release kế tiếp sau khi
test production bundle đã xanh.
