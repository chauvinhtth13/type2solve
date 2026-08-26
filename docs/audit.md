# Báo cáo audit và tái cấu trúc Type2Solve

## Trạng thái tài liệu

Báo cáo này ghi lại bằng chứng audit, các rủi ro đã xác minh, những quyết định
kiến trúc đã áp dụng và kết quả verification cuối trên cùng revision. Baseline
trước refactor được ghi riêng để phân biệt hành vi gốc với cây source mới.

## Phạm vi audit

Audit bao phủ toàn bộ đường chạy của PWA:

- shell HTML, partial màn hình, stylesheet, manifest và asset tĩnh trong `src/`;
- runtime dùng chung, platform adapter và từng vertical slice game trong
  `src/scripts/`;
- vòng đời state, timer, animation, cleanup và chuyển màn;
- dữ liệu lưu cục bộ, migration, fallback khi storage lỗi và sự kiện thay đổi;
- biên dữ liệu không tin cậy đi vào DOM, đặc biệt tên người chơi Duel;
- chiến lược offline của service worker, core/deferred cache và invalidation;
- pipeline assemble/bundle trong `scripts/` và artefact production trong `dist/`;
- unit, static smoke, browser E2E và kiểm tra bản build trong `tests/`.

Các tiêu chí chính là khả năng bảo trì, loại bỏ ownership trùng, giữ luật game,
an toàn DOM/storage, hiệu năng runtime và khả năng phát hiện regression tự động.
Nội dung sư phạm của từng câu hỏi không được chấm lại; audit chỉ kiểm tra schema,
tham chiếu và hành vi kỹ thuật của kho dữ liệu.

## Baseline trước refactor

Trước khi thay đổi cấu trúc, hai cổng sau đã chạy thành công:

| Lệnh | Kết quả baseline | Ý nghĩa |
| --- | --- | --- |
| `npm test` | Đạt trước refactor | Unit và static smoke của hành vi cũ không báo lỗi. |
| `npm run test:browser` | Đạt trước refactor | Các luồng game chính chạy được trong browser suite trước khi di chuyển mã. |

Baseline này là mốc so sánh để phát hiện regression, không phải kết quả xác minh
cuối cho cây thư mục và build mới.

## Vấn đề đã xác minh

### 1. Monolith và cây thư mục không phản ánh ownership

Trước refactor, một khối ứng dụng lớn sở hữu đồng thời nền trang, helper ngẫu nhiên,
audio, art renderer, cấu hình boss/cửa hàng, state phiên chơi, combat và ambient FX.
Các phần có nhịp thay đổi và rủi ro khác nhau phải sửa trong cùng file; dependency
chỉ được hiểu qua vị trí dòng và thứ tự script. Điều này làm tăng vùng ảnh hưởng của
mỗi thay đổi, khó tìm dead code và gần như không thể unit test luật thuần mà không
dựng DOM.

### 2. Helper, storage fallback và event bị lặp ownership

Các game từng tự định nghĩa biến thể của `byId`, `safeSound`, `safeShowScreen`,
`setSections` và reduced-motion. Cùng một tình huống lỗi có thể có hành vi khác nhau
giữa các game. Storage cũng có nguy cơ bị đọc/ghi trực tiếp từ nhiều nơi, mỗi nơi tự
fallback, normalize record hoặc phát sự kiện; hậu quả là schema trôi, trả object tham
chiếu ra ngoài và một mutation có thể tạo nhiều notification.

### 3. XSS qua tên người chơi Duel

Tên do người dùng nhập được dùng trong nhiều template `innerHTML` của Duel. Nếu tên
được nội suy thẳng, payload như thẻ ảnh có event handler có thể trở thành DOM thực
và thực thi script. Đây là biên dữ liệu không tin cậy, dù ứng dụng không có backend.
Regression browser hiện dùng payload `<img ... onerror=...>` và yêu cầu payload chỉ
xuất hiện dưới dạng text, không tạo node ảnh và không chạy handler.

### 4. Service worker che lỗi cài đặt và cache quá nặng

Cho mọi asset đi qua `Promise.allSettled` có thể khiến service worker được coi là cài
đặt xong dù shell quan trọng bị thiếu. Đặt kho từ lớn và ảnh QR vào core cache còn
làm lần ghé đầu cạnh tranh băng thông với chính giao diện. Cache version tĩnh không
gắn với nội dung cũng có thể giữ bản dữ liệu deferred cũ sau deploy.

Ba invariant cần tách rõ:

- core shell phải tải đủ hoặc install thất bại;
- deferred asset được warm best-effort sau activate và không chặn giao diện;
- version production phải thay đổi khi bất kỳ core hoặc deferred asset nào đổi.

### 5. Ambient timer có chi phí tuyến tính và bỏ qua reduced-motion

Ambient FX từng lưu timeout trong mảng rồi `filter` lại toàn bộ mảng mỗi khi một node
hết hạn. Với theme sinh hạt dày, mỗi lần cleanup là O(n) và tạo thêm mảng rác. Đồng
thời interval vẫn có thể sinh DOM/animation khi người dùng đã yêu cầu giảm chuyển
động, gây tốn CPU và đi ngược accessibility preference.

### 6. Source module hóa có thể tạo quá nhiều request production

Tách monolith thành nhiều classic script giúp đọc, debug và ownership tốt hơn, nhưng
nếu deploy nguyên cây source sẽ tạo waterfall nhiều request JS/CSS. Đây là rủi ro
production phát sinh trực tiếp từ hướng tái cấu trúc và phải được giải ở build seam,
không bằng cách nhập các trách nhiệm trở lại một monolith.

## Quyết định kiến trúc đã thực hiện

### Phân lớp theo trách nhiệm

Source được tổ chức theo hướng phụ thuộc một chiều:

```text
views / game UI  ->  game rules  ->  dữ liệu thuần
       |
       v
app composition  ->  engine  ->  platform / Web APIs
```

- `scripts/platform/storage.js` là owner duy nhất của `localStorage`, schema,
  migration, normalize, fallback và sự kiện `game-storage:change`.
- `scripts/engine/runtime.js` cung cấp `GameRuntime` đóng băng cho DOM lookup,
  sound/screen fail-safe, section visibility, reduced-motion và timer registry.
- `scripts/engine/audio.js` và `scripts/engine/art.js` sở hữu audio graph/SFX và art
  renderer; game không sao chép hai engine này.
- `scripts/app/background.js` sở hữu nền trang, ground decoration và ambient lifecycle.
- Adventure được chia thành `config`, `session`, `questions` và `combat`; các game
  khác nằm trong vertical slice riêng dưới `scripts/games/<game>/`.
- Luật có thể tách thuần được công bố qua object `*Rules` đóng băng; UI tiêu thụ
  contract và fail-fast khi dependency chưa được nạp.

Các script trình duyệt vẫn là classic script để giữ handler/global API hiện hữu.
Thứ tự trong HTML là dependency order duy nhất; consumer dùng interface công khai
thay vì định nghĩa lại helper.

### Storage có một nguồn sự thật

`GameStorage` trả defensive clone, migrate dữ liệu cũ, normalize dữ liệu hỏng/thiếu,
fallback khi Web Storage không dùng được và chỉ phát một change event sau mutation.
Static smoke cấm token truy cập `localStorage` trong mọi file dưới `src/scripts/`,
ngoại trừ adapter `platform/storage.js`.

### Biên DOM được làm rõ

Tên Duel được escape trước khi đi vào template HTML; dữ liệu chỉ cần hiển thị đơn
thuần tiếp tục dùng `textContent`. Browser regression kiểm tra đồng thời ba điều:
handler không chạy, node độc hại không được tạo và chuỗi gốc vẫn hiển thị như text.

HTML shell được assemble từ partial qua một implementation dùng chung cho dev,
build và smoke. Smoke kiểm tra duplicate `id` sau assemble, vì kiểm tra từng partial
riêng lẻ không phát hiện được xung đột giữa hai màn hình.

### Timer và reduced-motion có lifecycle hữu hạn

Timer dùng chung được quản lý bằng registry có `Set`, tự xóa handle sau callback và
có `clear()` khi cleanup. Ambient timeout cũng dùng `Set.delete()` O(1). Khi bắt đầu
ambient, ứng dụng vẫn vẽ ground tĩnh, sau đó trả về sớm nếu reduced-motion bật; không
tạo particle và không mở interval.

### Offline cache phân biệt critical và best-effort

- `CORE_ASSETS` dùng semantics fail-fast: thiếu shell critical làm install thất bại.
- `DEFERRED_ASSETS` chứa kho từ và QR, được warm sau activate bằng best-effort.
- Smoke cấm một asset xuất hiện đồng thời trong core và deferred, đồng thời yêu cầu
  mọi script, stylesheet, manifest, icon và image local của HTML đã render phải có
  chiến lược cache.
- Production build sinh danh sách cache từ artefact thực tế và tính
  `CACHE_VERSION` từ bytes của cả core lẫn deferred asset.

### Source dễ sửa, production ít request

`scripts/build.mjs` đọc thứ tự script/style từ HTML đã assemble, nối và minify thành
một `dist/assets/app.js` và một `dist/assets/app.css`. Vì build lấy thứ tự từ shell,
không tồn tại danh sách dependency production thứ hai để bị lệch. `dist/` là artefact
sinh tự động; source vẫn chia nhỏ để review và debug.

## Ma trận rủi ro và cách test

| Rủi ro | Khả năng / tác động | Kiểm soát đã áp dụng | Cách xác minh |
| --- | --- | --- | --- |
| Sai thứ tự classic script hoặc thiếu global dependency | Trung bình / Cao | Interface đóng băng, consumer fail-fast, thứ tự lấy từ HTML | Static smoke tham chiếu; browser boot; test bản `dist`. |
| Công thức game đổi khi tách file | Trung bình / Cao | `*Rules` thuần, state/UI chỉ gọi contract | VM unit test các thế chuẩn, invalid input và invariant; browser chơi thật. |
| Mất tiến độ hoặc schema trôi | Trung bình / Rất cao | Một `GameStorage`, migration, normalize, clone, fallback | Unit test schema cũ, JSON hỏng, mutation và đúng một event. |
| XSS từ tên Duel | Trung bình / Cao | Escape tại biên trước `innerHTML`, ưu tiên `textContent` | Browser payload có `onerror`, kiểm tra execution và DOM injection. |
| Offline shell thiếu nhưng SW vẫn activate | Trung bình / Cao | Core dùng fail-fast; `allSettled` chỉ dành cho deferred | Smoke kiểm tra path/cache; build và dist test kiểm tra artefact. |
| Cache dữ liệu cũ sau deploy | Trung bình / Cao | Content hash bao gồm core và deferred | Build hai lần với thay đổi asset; kiểm tra version và danh sách `dist/sw.js`. |
| Timer cũ sửa state mới hoặc rò DOM | Cao / Trung bình | Run token, cleanup public, timer registry/Set | Unit timer giả; browser mở–rời–mở lại game và kiểm tra callback cũ. |
| Reduced-motion vẫn sinh animation nền | Cao / Trung bình | Ground tĩnh rồi early return trước spawn/interval | Unit runtime preference; browser emulation reduced-motion. |
| Duplicate ID hoặc asset runtime không được cache | Trung bình / Cao | Architectural smoke trên HTML đã render và SW lists | `npm run test:smoke`. |
| Waterfall nhiều request ở production | Cao / Trung bình | Build gộp còn một JS và một CSS | `npm run build` và `npm run test:dist`. |
| HTML include cycle hoặc thoát khỏi source root | Thấp / Cao | Assembler có cycle/root-boundary guard | Unit test HTML assembler với fixture cycle và path escape. |

## Chiến lược kiểm thử

- **Unit:** dùng `vm` nạp đúng classic script thật để kiểm tra `GameRuntime`,
  `GameStorage` và pure rules; fake DOM/timer/storage chỉ thay Web API ở biên.
- **Static smoke:** assemble HTML, kiểm tra tham chiếu, duplicate ID, manifest,
  vocabulary schema, cache coverage/overlap, ownership `localStorage` và cú pháp JS.
- **Browser E2E:** kiểm tra các mode game, navigation/cleanup, state thật, layout hiển
  thị, reduced-motion và regression XSS Duel.
- **Build/dist:** xác nhận bundle production, asset copy, service worker sinh từ
  output và mọi reference trong `dist/` tồn tại.

## Kết quả xác minh

Tất cả cổng dưới đây đã chạy trên cùng revision sau khi ghép xong refactor:

| Cổng | Kết quả |
| --- | --- |
| `npm test` | Đạt: 20 unit test; smoke kiểm 55 tham chiếu và 34 file JavaScript. |
| Browser E2E source — phase early | Đạt: Home, Adventure, Typing, Sudoku, mobile, PWA cache, accessibility và không lỗi runtime. |
| Browser E2E source — phase late | Đạt: XSS Duel, Duel/Nim/Hanoi, 12 màn ở 1366×768, FHD/QHD/4K/8K và không lỗi runtime. |
| `npm run build` | Đạt: 341.521 B JS, 106.827 B CSS, 5 core asset và 2 deferred asset. |
| Build lặp | Đạt: cùng input sinh cùng `CACHE_VERSION=v13ea3ce8f3`. |
| `npm run test:dist` | Đạt cả hai phase trên bundle minify, gồm PWA offline và không lỗi runtime. |

Browser suite được chia phase trong runner production để mỗi tiến trình có vòng đời
hữu hạn; hai phase dùng cùng file assertion và tổng hợp lại bao phủ toàn bộ suite.
Không còn lỗi đã biết từ static, unit, source E2E hoặc dist E2E tại thời điểm chốt
báo cáo.
