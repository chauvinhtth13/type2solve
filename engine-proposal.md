# Đề xuất kiến trúc: nâng cấp engine/renderer cho Đấu Trường Tư Duy

Tài liệu này trả lời câu hỏi "có nên đổi engine để game mượt hơn, bắt mắt hơn?" bằng
cách đọc kỹ ràng buộc thực tế của SẢN PHẨM này trước khi so sánh công nghệ. Kết luận đi
trước phần so sánh — phần so sánh dùng để CHỨNG MINH kết luận, không phải để câu giờ.

## 0. Tóm tắt điều hành

**Khuyến nghị: KHÔNG đổi engine.** Giữ nguyên nền tảng DOM/CSS/SVG + JavaScript thuần
hiện tại. Lý do cốt lõi: Đấu Trường Tư Duy về bản chất là một **web app hỏi-đáp có bàn
phím/nút bấm là input chính** (câu hỏi, trắc nghiệm, ô nhập, bàn Sudoku), không phải một
game hành động cần vật lý/va chạm/camera — đúng loại bài toán mà DOM giải tốt nhất và
Canvas/WebGL/engine 3D giải KÉM hơn (mất khả năng tiếp cận, tăng dung lượng, không giải
quyết vấn đề gì sản phẩm này thực sự có).

Thay vào đó, đề xuất **3 nâng cấp có mục tiêu** không đổi kiến trúc (chi tiết ở mục 3):
mở rộng hệ nhân vật SVG sẵn có thêm biểu cảm (vui/buồn/ngạc nhiên), thêm phản hồi động
theo combo/streak dùng đúng hạ tầng âm thanh + CSS đã có, và cân nhắc **Lottie** (không
phải Spine/Live2D/engine) nếu muốn nhập hoạt hình mascot làm sẵn từ nghệ sĩ ngoài.

## 1. Ràng buộc thực tế của sản phẩm này (đọc trước khi chọn công nghệ)

- **Người dùng:** học sinh tiểu học Việt Nam, thường chơi trên máy tính phòng máy
  trường học, Chromebook cấu hình thấp, hoặc điện thoại/tablet cũ mượn của bố mẹ. Mạng
  có thể chậm — đây là lý do kho từ 4,6 MB đã được tách khỏi cache lúc cài đặt
  (`DEFERRED_ASSETS` trong `sw.js`).
- **Loại tương tác:** đọc câu hỏi → bấm nút/gõ phím → đọc phản hồi. Không có va chạm vật
  lý, không camera, không tilemap, không cần 60fps mượt tuyệt đối — cần **đọc được, bấm
  đúng, không giật khi gõ**.
- **Đầu tư trợ năng đã có, rất tốn công xây và rất dễ mất nếu đổi renderer:** điều hướng
  bàn phím đầy đủ (phím 1–5 trả lời, Tab focus trap trong modal), `aria-live` cho mọi
  phản hồi động, `prefers-reduced-motion` được tôn trọng ở cả CSS lẫn Web Animations API,
  tương phản màu đã đo đạt AA. Toàn bộ những thứ này **miễn phí với DOM** (trình duyệt lo
  sẵn) và **phải tự viết lại từ đầu** nếu chuyển sang canvas-based rendering (Phaser/
  PixiJS/Three.js/Godot/Unity đều vẽ lên một `<canvas>` — với trình đọc màn hình, đó là
  MỘT Ô TRỐNG DUY NHẤT, không có khái niệm nút, nhãn, hay thứ tự Tab).
- **Không có bước build bắt buộc hiện tại** (chỉ có `npm run build` esbuild TUỲ CHỌN để
  nén khi deploy, không bundle, không đổi kiến trúc) — triển khai bằng cách kéo-thả thư
  mục lên GitHub Pages/Netlify/Vercel. Đây là lý do người bảo trì (1 người, không ngân
  sách) có thể tự sửa lỗi nhanh, không cần dựng lại toolchain.
- **51+ assertion kiểm thử đầu-cuối đã có** (`tools/browser-smoke.mjs`) khẳng định hành
  vi thật qua Chrome headless — bất kỳ thay đổi kiến trúc nào cũng phải giữ được bộ này
  xanh, hoặc viết lại tương đương cho nền tảng mới (chi phí ẩn thường bị đánh giá thấp).

## 2. So sánh các phương án renderer/engine

| Phương án | Điểm mạnh | Điểm yếu cho SẢN PHẨM NÀY | Kết luận |
|---|---|---|---|
| **DOM/CSS/SVG (hiện tại)** | Trợ năng miễn phí (bàn phím, screen reader, zoom trình duyệt); zero-dependency; SEO/preview hoạt động; debug bằng DevTools thường; đã có 8 vòng lặp tối ưu hiệu năng (View Transitions, WAAPI, debounce resize) | Không hợp cho particle effect dày đặc, không có z-sort 3D, hoạt hình phức tạp phải tự tay bằng CSS/SVG | ✅ **Giữ nguyên** — đúng bài toán |
| **HTML5 Canvas thuần** | Vẽ tự do, particle rẻ, phù hợp game hành động | Mất trợ năng DOM hoàn toàn cho phần vẽ trên canvas; câu hỏi/đáp án/Sudoku vẫn cần là DOM thật (không ai đọc Sudoku qua canvas bằng bàn phím được) → cuối cùng vẫn phải LAI DOM+canvas, tăng phức tạp mà không giải quyết nhu cầu thật | ❌ Không cần cho loại game này |
| **Phaser** | Framework 2D đầy đủ (scene, tween, input, physics nhẹ), cộng đồng lớn, tốt cho platformer/arcade | ~1 MB+ runtime; toàn bộ UI (câu hỏi, nút, form Sudoku) phải build lại bằng DOM overlay HOẶC bitmap text (mất trợ năng); scene graph không cần thiết khi không có nhân vật di chuyển tự do | ❌ Chi phí > lợi ích rõ rệt |
| **PixiJS** | Renderer WebGL/Canvas rất nhanh cho sprite 2D, nhẹ hơn Phaser (không kèm game framework) | Cùng vấn đề trợ năng như Phaser; giải quyết bài toán "vẽ nhiều sprite nhanh" mà game này không có (số lượng phần tử động tại một thời điểm rất nhỏ — vài quái, vài nút) | ❌ Giải pháp cho vấn đề không tồn tại |
| **Three.js / Babylon.js (WebGL 3D)** | Hiệu ứng 3D, ánh sáng, shader | Không có nhu cầu 3D trong game hỏi-đáp; tăng mạnh yêu cầu GPU — rủi ro thật trên máy phòng máy trường học cấu hình thấp/driver cũ; bundle size lớn | ❌ Quá tay, rủi ro thiết bị |
| **Godot / Cocos Web (WASM)** | Editor trực quan, xuất đa nền tảng | Tải về nhị phân WASM vài MB TRƯỚC KHI tương tác được (ngược hẳn triết lý PWA-tải-nhanh hiện tại); toàn bộ trang với screen reader là hộp đen; toolchain tách biệt hoàn toàn khỏi git-based static site đang có | ❌ Đổi cả quy trình làm việc, mất trợ năng |
| **Construct 3** | Không cần code, xuất HTML5 nhanh | Là công cụ kéo-thả độc quyền, không hợp với codebase JS thuần đã có — di chuyển 1.900 dòng `question-bank.js` + 51 test đầu-cuối sang đó gần như viết lại từ đầu | ❌ Không tương thích quy trình hiện có |
| **Unity WebGL** | Engine mạnh, quen thuộc với nhiều dev | Kích thước tải (thường 10–50+ MB), thời gian khởi động lâu trên máy yếu, khả năng tiếp cận cho web gần như không có, không phù hợp UI-form-heavy | ❌ Sai công cụ cho đúng bài toán |

**Tại sao "trợ năng" là tiêu chí quyết định, không phải sở thích:** đây là sản phẩm giáo
dục cho trẻ nhỏ — một số dùng máy tính bàn dùng chuột trỏ kém, một số phòng máy trường
học có phần mềm hỗ trợ tiếp cận bật sẵn. Bộ test hiện tại (`aria-pressed`, tab-stop
Sudoku, `aria-live`...) đã bắt được lỗi thật nhiều lần (xem `progress.md`). Đổi sang
canvas-based renderer đồng nghĩa **xoá sạch** lớp bảo vệ đó, không có lợi ích tương xứng.

## 3. Kế hoạch nâng cấp hoạt ảnh & "trợ lý ảo" — KHÔNG đổi renderer

Mục tiêu thật của yêu cầu "nhân vật hoạt hình tương tác" là cảm giác sinh động khi
trả lời đúng/sai/combo — không nhất thiết cần khung xương 2D (Spine2D) hay rig mặt
(Live2D, vốn sinh ra cho VTuber, chi phí bản quyền + độ phức tạp không tương xứng ở đây).

### 3.1 Mở rộng hệ SVG nhân vật sẵn có (ưu tiên cao nhất, chi phí thấp nhất)

Hệ `tplHero`/`tplBeast` + `applySkin()` + `BOSS_ART` trong `core.js` **đã là một hệ
thống hoạt hình tham số hoá** (1 khuôn vẽ × nhiều bảng màu × nhiều bộ phận bật/tắt qua
CSS class) — đúng nguyên lý Spine "rig 1 lần, tái dùng nhiều lần", chỉ khác là dựng
bằng SVG/CSS thay vì công cụ chuyên dụng. Việc còn thiếu là **trạng thái biểu cảm**:

- Thêm class `.mood-happy`/`.mood-sad`/`.mood-think` lên `#heroSprite`, đổi hình miệng/
  mắt (`.chr-eyes`, đã có sẵn `<g class="chr-eyes">`) bằng CSS, gắn theo sự kiện đúng/sai
  đã tồn tại (`answer()` trong `arena.js` đã biết chính xác lúc nào là đúng/sai).
- Streak/combo: đã có `G.streak`/`.streak.hot` (rung lắc khi combo nóng) — chỉ cần thêm
  1 lớp hình ảnh tương tự cho nhân vật hero, không cần code mới, chỉ cần thêm rule CSS.

Chi phí: vài giờ vẽ thêm 2–3 trạng thái mặt/tay bằng SVG path (đúng kỹ thuật đã dùng cho
toàn bộ 20 nhân vật hiện tại) + vài dòng JS gắn class. **Không thêm dependency.**

### 3.2 Nếu muốn hoạt hình do nghệ sĩ vẽ sẵn (không tự vẽ SVG): Lottie, không phải Spine/Live2D

Nếu mục tiêu là nhập hoạt hình mascot có sẵn (không tự vẽ), **Lottie** (`lottie-web`,
~7 KB gzip, hoặc `@dotlottie/player`) là lựa chọn nhẹ nhất còn tương thích triết lý
zero-build: file `.json` xuất từ After Effects/nhiều công cụ miễn phí (LottieFiles có
kho mascot miễn phí sẵn), render bằng SVG (**vẫn giữ được trợ năng DOM cho phần còn
lại của trang**, khác hẳn Phaser/Canvas). So với Spine2D (cần Spine Editor trả phí +
runtime riêng, hợp cho nhân vật xương phức tạp nhiều hơn nhu cầu ở đây) và Live2D (rig
mặt 2D bán-3D, sinh ra cho VTuber, license phức tạp, quá tay cho một icon phản hồi nhỏ),
Lottie là lựa chọn cân xứng nhất nếu thực sự cần — nhưng mục 3.1 nên làm trước, vì hạ
tầng đã có sẵn 90%.

**Việc không làm ngay:** thêm Lottie khi chưa thử mở rộng SVG hiện có — đó là thêm một
dependency mới cho việc mà kiến trúc hiện tại đã làm được, vi phạm chính triết lý
zero-dependency đã chọn có chủ đích của dự án.

### 3.3 Cơ chế phản hồi động (thiết kế, không cần công nghệ mới)

| Sự kiện | Đã có sẵn | Thêm |
|---|---|---|
| Trả lời đúng | `SFX.right()`, cộng streak | Đổi mặt hero sang `.mood-happy` 400ms |
| Trả lời sai | `SFX.wrong()` | Đổi mặt hero sang `.mood-sad` 400ms |
| Combo ≥3 | `.streak.hot` (đã rung) | Thêm hào quang nhẹ quanh hero (tái dùng `.aura` đã có ở `#heroAura`, hiện chỉ dùng cho siêu chưởng) |
| Hết giờ | `SFX.tick()` gấp | Đổi mặt `.mood-think` khi còn <5s |

Tất cả cột "Thêm" đều là CSS class + 1 dòng gọi trong `answer()`/`onTimeout()` đã tồn
tại trong `arena.js` — không cần thư viện, không cần refactor.

## 4. Lộ trình (nếu vẫn muốn thử nghiệm renderer mới, dù không khuyến nghị)

Nếu sau khi đọc mục 1–2 vẫn muốn tự tay đánh giá Phaser/PixiJS (ví dụ vì lý do ngoài kỹ
thuật — muốn học công nghệ đó), đây là cách làm **ít rủi ro nhất**, không phá logic hiện
có:

1. **Giai đoạn 0 — Đo, đừng đoán.** Trước khi viết dòng nào, xác định CHÍNH XÁC hiệu ứng
   hiện tại "chưa mượt" ở đâu bằng Performance tab (không phải cảm giác). Nếu không đo
   được vấn đề cụ thể, dừng ở đây — không có gì để giải quyết cả.
2. **Giai đoạn 1 — Tách lớp hiển thị khỏi trạng thái, CHỈ ở màn Đấu Toán.** Không đụng
   Sudoku/Gõ Chữ/Đấu Đối Kháng/Nim (đang ổn). `arena.js` đã tách khá rõ trạng thái (`G`)
   khỏi vẽ (`paintBoss`, `updateBars`...) — thêm một renderer PixiJS đọc từ CHÍNH `G`,
   vẽ song song, đặt sau một feature flag (`?renderer=pixi`), **không xoá renderer DOM
   cũ**. Câu hỏi/đáp án/nút bấm vẫn là DOM thật đè lên trên (giữ trợ năng).
3. **Giai đoạn 2 — So sánh bằng chính bộ test đã có.** Chạy `tools/browser-smoke.mjs`
   nhắm cả hai renderer (thêm cờ tương tự `DTTD_ROOT` mà `verify-dist.mjs` đang dùng).
   Renderer mới CHỈ được coi là thắng nếu xanh toàn bộ 51+ assertion — không hơn không
   kém về hành vi — cộng với số đo hiệu năng thực tế tốt hơn ở giai đoạn 0.
4. **Giai đoạn 3 — Quyết định giữ hay bỏ, dựa trên số liệu giai đoạn 2**, không dựa trên
   cảm giác "code mới trông hiện đại hơn". Nếu không thắng rõ ràng, xoá nhánh thử nghiệm
   — chi phí duy trì hai renderer song song không đáng nếu không có lợi ích đo được.

Không có giai đoạn nào ở trên yêu cầu viết lại `question-bank.js`, `storage.js`, hay bất
kỳ logic game nào — đúng ràng buộc "không gián đoạn logic hiện có" đã đặt ra.

## 5. Việc không nên làm

- Không đổi toàn bộ 8 script sang ES module + bundler chỉ để "hiện đại hoá" — đã cân
  nhắc và từ chối trong một phiên trước (xem `progress.md`, mục "Hai quy tắc của skill
  đã bị TỪ CHỐI"), lý do vẫn còn nguyên: chi phí thật (kho từ 4,6 MB) không nằm ở
  bundler.
- Không thêm React/Vue/Svelte cho UI câu hỏi/đáp án — đây là form/button đơn giản, thêm
  virtual DOM là thêm chi phí mỗi khung hình cho một bài toán không cần diff cây UI.
- Không nhập engine 3D "phòng khi sau này cần" — YAGNI; nếu game thật sự đổi thể loại
  (ví dụ thêm mini-game platformer), quay lại đánh giá lúc đó với yêu cầu cụ thể.
