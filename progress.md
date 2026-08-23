# progress.md

Original prompt: /develop-web-game — "/game-designer /baseline-ui /improve-ui and improve all fix all"
(Tiếp nối phiên /code-review-expert ngay trước đó: sửa toàn bộ 7 phát hiện của bản review.)

## Bối cảnh quan trọng cho agent sau

**Dự án KHÔNG khớp hợp đồng của skill `develop-web-game`.** Đây là game DOM/CSS, không có
canvas, không có `window.render_game_to_text`, không có `window.advanceTime`. Playwright cũng
không được cài (CLAUDE.md tuyên bố dự án zero-dependency — thêm Playwright + browser là quyết
định của chủ dự án, chưa ai đồng ý). Đừng cố nhét ba hook đó vào chỉ để chạy
`web_game_playwright_client.js`.

**Dùng bộ test sẵn có thay thế:** `tools/browser-smoke.mjs` điều khiển headless Chrome qua CDP,
40 assertion, có sẵn "không lỗi JS runtime". Đó chính là vòng lặp implement → chạy → quan sát
mà skill yêu cầu.

**nvm trong shell này hỏng** (`_load_nvm: command not found`). `npm`/`node` trần đều lỗi.
Gọi thẳng binary:
```bash
NODE=~/.nvm/versions/node/v24.14.1/bin/node
$NODE tools/smoke-test.mjs
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" $NODE tools/browser-smoke.mjs
```

## Đã sửa (7/7 phát hiện của bản review)

| # | Mức | File | Nội dung |
|---|-----|------|----------|
| 1 | P1 | `assets/js/bootstrap.js:34` | `aria-pressed` bị đảo lúc khởi động, xoá sạch bản vá ở `core.js:44`. `normalize()` luôn ép `settings.sound` thành boolean nên nhánh này chạy MỌI lần tải → lỗi luôn xảy ra, không phải trường hợp hiếm. |
| 2 | P2 | `assets/js/games/typing.js` | Thêm `remeasureField()` + listener `resize`/`orientationchange` (debounce 150ms), gỡ trong `stopRuntime()`. Đo lại `fieldW`/`fieldH`/`state.lanes`, kẹp `monster.lane`, đặt lại `top` và `--monster-x` cho mọi quái. |
| 3 | P2 | `index.html:396` | Gỡ `aria-hidden="true"` khỏi đồng hồ Sudoku. Bỏ `aria-live` ở HUD là đúng (nó đọc lại mỗi giây), nhưng `aria-hidden` là quá tay — người dùng screen reader mất luôn khả năng đọc giờ. |
| 4 | P2 | `assets/js/games/sudoku.js:393` | `selectCell` vẽ lại từng phần; khi `state.selected === -1` thì ô 0 đang giữ tab stop nhưng không nằm trong `touched` → hai ô cùng `tabIndex=0`. Thêm `touched.add(0)`. |
| 5 | P3 | `assets/js/core.js:497` | `ambientTimers` phình suốt ván. Nay mỗi timer tự gỡ khỏi mảng khi chạy xong. |
| 6 | P3 | `assets/js/games/typing.js:935` | `field.clientWidth \|\| 1` — đo lúc sân còn ẩn cho `halfPercent = 24%` và ghim `monster.x` ở 75 vĩnh viễn. Nay `return` sớm khi width = 0. |
| 7 | P3 | `assets/js/games/typing.js` | `ensureFieldMetrics()` gọi trước khi `castSpell` quy % ra px, phòng khi số đo rỗng. |

`sw.js` giữ nguyên `CACHE_VERSION = 'v7'` — v7 vốn đã là bản chưa phát hành trong working tree,
không cần bump thêm.

## Kết quả kiểm thử

- `tools/smoke-test.mjs` — 4/4 ✓
- `tools/browser-smoke.mjs` — 40/40 ✓, không lỗi JS runtime
- Probe riêng (xem dưới) — 17/17 ✓ và 2/2 ✓

### GOTCHA: test xanh chưa chứng minh được gì — phải có negative control

Lần probe đầu tiên của tôi CHO QUA cả khi đã gỡ bản vá. Bài học cụ thể:

- **`fieldW` tự lành.** `fitMonster()` chạy mỗi lần đẻ quái và làm tươi `state.fieldW`, nên
  đo `--monster-x` sau khi resize luôn đúng dù có listener hay không. Đo cái này là vô nghĩa.
- **`fieldH` mới là chỗ hỏng thật.** Nó chỉ được ghi trong `laneLayout()`, mà `laneLayout()`
  chỉ chạy đúng một lần lúc vào ván (`typing.js:635`). Triệu chứng duy nhất quan sát được là
  đường bay của chưởng trong `castSpell` (`dy`). Negative control: **lệch 92,8px** khi chưa vá,
  **0,0px** sau khi vá.
- **`ambientTimers` cần đo qua mốc 12,5s.** Timer sống 12,5s, quái nền đẻ mỗi 1,6s → trạng thái
  ổn định ~8. Đo ở t=5s thì bản vá và bản cũ giống hệt nhau (chưa cái nào hết hạn). Phải đo tới
  t≈32s mới tách được: đã vá chững ở **8**, chưa vá leo lên **22**.

### Mức độ tin cậy của từng bản vá

| Sửa | Bằng chứng |
|-----|-----------|
| 1, 3 | Probe khẳng định giá trị đúng; biểu thức cũ không thể cho qua được. Chắc chắn. |
| 2 (`fieldH`), 5 | **Có negative control**, tách bạch rõ ràng. Chắc chắn. |
| 2 (`fieldW`) | Tự lành nhờ `fitMonster`; probe qua cả hai chiều. Chưa chứng minh độc lập. |
| 4 | Nhánh `selected === -1` không với tới được từ ngoài (`selected` khởi tạo từ `findIndex(v=>!v)`, chỉ = -1 khi đề đã kín). Probe chỉ xác nhận bất biến "luôn đúng 1 tab stop" qua 9 lần chọn. Bản vá là phòng thủ. |
| 6, 7 | Cũng là phòng thủ, đường đi không với tới được từ ngoài. Chưa probe độc lập. |

## TODO cho agent sau

1. **Gộp probe vào `tools/browser-smoke.mjs`.** Hai script probe hiện nằm ở scratchpad của phiên
   (`.../scratchpad/probe.mjs` và `probe-fieldh.mjs`) — **sẽ mất khi phiên kết thúc**. Đáng giá
   nhất là bài đo `fieldH` qua đường bay của chưởng, vì nó bắt được lỗi mà 40 assertion hiện có
   bỏ lọt hoàn toàn. Cách dựng lại: bắt đầu ván ở khung cao → `Emulation.setDeviceMetricsOverride`
   thu chiều cao → chờ qua debounce 150ms → gõ đúng từ trên quái → đọc
   `spell.getAnimations()[0].effect.getKeyframes()` lấy `translate(dx,dy)` → so với
   `((topPct-78)/100) * field.clientHeight`.
2. **`state.lanes` vẫn có thể lệch ở đường khác.** `remeasureField()` đã đo lại, nhưng nếu số làn
   giảm thì quái bị dồn về làn cuối và chỉ được giãn ra ở khung hình kế nhờ `keepLaneGap()`.
   Chưa test kỹ trường hợp 3 làn → 1 làn với nhiều quái cùng lúc.
3. **`.proj` và `prefers-reduced-motion`.** Override toàn cục ở `main.css:688` ép
   `transition-duration:.001ms`, nên chưởng bay tức thì trong khi `setInterval` vẫn rải vệt khói
   suốt 450ms → vệt khói tách rời khỏi chưởng đã nổ. Lỗi cũ, chưa sửa. Nên chặn luôn vòng lặp
   vệt khói theo media query.
4. **`spell.animate()` không nghe `prefers-reduced-motion`.** WAAPI không chịu ảnh hưởng của
   override CSS. Lỗi cũ.
5. **`display:contents` trên `.sudoku-row`.** Có `role="row"` nên về lý thuyết vẫn nằm trong cây
   accessibility, nhưng Safari/Chrome đời cũ từng loại bỏ. Đáng kiểm trên máy thật.
6. **Không đụng tới `/game-designer`, `/baseline-ui`, `/improve-ui`.** `/game-designer` dựng
   concept game mới (ba game ở đây đã hoàn chỉnh); `/improve-ui` là read-only, chỉ sinh kế hoạch
   cho agent khác — trong khi yêu cầu là "fix all". Nếu chủ dự án muốn một vòng đánh bóng UI
   riêng thì `/baseline-ui` là cái đáng chạy nhất.

---

# Vòng 2 — "fix all + tối ưu UI/UX + bố cục + make stable static"

Original prompt (vòng 2): "fix all and i need you optimal UI/UX and improve graphic layout make stable static"

Skill `/baseline-ui` được nạp nhưng nó viết cho stack React + Tailwind. Dự án này là
HTML/CSS thuần. Tôi áp các mục CHUYỂN ĐƯỢC (kỷ luật animation, tabular-nums, text-wrap,
thang z-index, will-change, prefers-reduced-motion) và BỎ các mục gắn với stack.
**Cố ý không gỡ gradient** dù luật nói "NEVER use gradients": đó là bản sắc thị giác của
một game cho trẻ em đang chạy tốt, không phải "slop" cần dọn.

## Đo trước khi sửa (đừng bỏ bước này)

| Chỉ số | Trước | Sau |
|--------|-------|-----|
| CLS trang chủ | **0,0351** | **0,0126** (−64%) |
| Tương phản dưới chuẩn AA | 6 chỗ (3 thật) | 1 chỗ (đều là dương tính giả) |
| Ô thống kê kết quả | rộng lệch nhau | 190px đều nhau, 0px xê dịch |
| Vệt khói khi giảm chuyển động | 5 vệt (treo lơ lửng) | 0 |
| WAAPI chưởng khi giảm chuyển động | 1 animation | 0 |

### GOTCHA 1: hai giả thuyết ban đầu của tôi đều SAI
- Tôi đoán HUD nhảy vì chữ số. **Nunito vốn đã đều bề ngang (12px mọi chữ số)** → thêm
  tabular-nums ở đó là vô nghĩa. Thủ phạm thật là **Baloo 2: 7,88–12,13px, lệch 54%**.
- Phép đo HUD đầu tiên cho 0px xê dịch ở cả typing lẫn battle — **không phải vì ổn định
  mà vì vòng rAF ghi đè giá trị tôi vừa gán trước khi kịp đo**. Muốn đo thật phải dùng
  màn hình TĨNH (`scoreEnd`). Luôn in ra giá trị tuyệt đối + kiểm chứng phần tử có hiện.

### GOTCHA 2: headless Chrome mặc định `prefers-reduced-motion: reduce`
Nhóm đối chứng "bình thường" của tôi ban đầu vô nghĩa vì trang vẫn thấy `reduce`.
Phải đặt rõ CẢ HAI chiều: `Emulation.setEmulatedMedia` với `no-preference` / `reduce`.

### GOTCHA 3: đo tương phản bằng `getComputedStyle` là sai
Nền của game phần lớn là `linear-gradient`, mà `backgroundColor` khi đó trả `rgba(0,0,0,0)`.
Bản audit đầu tiên tưởng chữ đen nằm trên nền xanh đậm của body → 3 "lỗi" hoàn toàn ma.
Cách đúng: chụp màn hình → nạp vào canvas trong trang → lấy **màu pixel phổ biến nhất**
trong hộp của phần tử làm màu nền. Còn đúng hai dạng dương tính giả cần biết:
1. Hộp `<b>` inline bó sát chữ đậm → pixel glyph áp đảo, kết quả ra fg == bg (tỉ lệ 1:1).
2. Phần tử cha chứa con có nền khác (vd `<select>` trắng nằm trong `<label>`) → lấy nhầm nền con.

## Đã sửa vòng 2

**Ổn định bố cục**
1. `@font-face` dự phòng khớp số đo (`size-adjust` 92,9% cho Baloo 2, 99,5% cho Nunito) —
   đo thực tế bằng cách so bề ngang chuỗi mẫu với Arial. Gom 49 khai báo font rải rác
   thành 2 token `--font-display` / `--font-body`. **Đây là thứ kéo CLS xuống 64%.**
2. `font-variant-numeric:tabular-nums` cho mọi con số đổi liên tục (Baloo 2 mới cần).
   Lưu ý: shorthand `font:` RESET thuộc tính này — luôn khai báo SAU.
3. `.stat{flex:1 1 112px;max-width:190px}` — 4 ô kết quả bằng nhau, không co giãn theo điểm.

**Tương phản (đều đã đo lại, không phải đoán)**
4. `--boss-ink` #f75a70 → #ef4c64 (2,94 → 3,33:1).
5. Cửa hàng: `core.js` có inline `style="color:#8d6bff"` — tím thương hiệu dùng làm CHỮ
   trên nền trắng chỉ 3,70:1. Đổi sang token `--purple-ink` (#7558d3, 5,13:1) **vốn đã tồn tại**.
6. `--on-dark-dim` #d0cce1 → #dcd8ec (4,29 → 4,81:1). Chú thích cũ trong code nói token này
   đã đạt ≥4,5:1 — đúng trên panel #38345f nhưng SAI trên thẻ đang chọn #3d5d8a.

**Giảm chuyển động (2 TODO còn lại của vòng 1)**
7. `arena.js`: thêm `REDUCED_MOTION()` (khai ở core.js), tắt hẳn vòng `setInterval` rải vệt khói.
8. `typing.js`: `castSpell` tự kiểm tra media query vì **WAAPI không chịu ảnh hưởng của
   override CSS** — đặt thẳng transform rồi nổ sau 60ms.

**Giao diện**
9. `<select>` và `<input type=checkbox>` trong màn Gõ Chữ nằm trên panel TỐI nhưng vẫn là
   control trắng mặc định của trình duyệt. Vẽ lại theo ngôn ngữ hình ảnh của panel
   (vẫn là phần tử thật → bàn phím và trình đọc màn hình không đổi).

## Kết quả kiểm thử vòng 2
smoke 4/4 · browser 40/40 · probe vòng 1: 17/17 + 2/2 · tabular 6/6 · tương phản 6→1 · CLS −64%

## TODO cho agent sau (cập nhật)
1. **Gộp probe vào `tools/browser-smoke.mjs`** — vẫn là việc đáng làm nhất. Các script nằm ở
   scratchpad của phiên và SẼ MẤT. Đáng giá nhất, theo thứ tự: `probe-fieldh.mjs` (đường bay
   chưởng ↔ chiều cao sân), `contrast2.mjs` (đo tương phản bằng pixel thật), `cls.mjs`.
2. **Thẻ chặng đã khoá (2–10) chữ mờ.** Bản audit BỎ QUA chúng vì nằm trong `[disabled]`
   (WCAG miễn trừ control vô hiệu hoá). Về kỹ thuật là đúng chuẩn, nhưng với game cho trẻ
   em thì vẫn nên cân nhắc nâng độ sáng — đây là quyết định thiết kế, không phải lỗi.
3. **`state.lanes` khi số làn GIẢM** vẫn chưa test kỹ (3 làn → 1 làn với nhiều quái).
4. **`display:contents` trên `.sudoku-row`** — nên kiểm trên Safari máy thật.
5. Ô "PHIÊU LƯU" ở trang chủ chiếm 2 hàng nên có khoảng trống dọc khá lớn giữa mô tả và CTA.
   Cố ý theo thiết kế bento, nhưng nếu muốn chặt hơn thì đó là chỗ cần sửa.

---

# Vòng 3 — footer, âm thanh, đồ hoạ

Original prompt (vòng 3): "thiết kế lại phần citation sao cho tối giản clean và phần xin
donation cũng vậy có thể gộp lại... bỏ [đoạn MathX] vì không cần nó, dùng skill
/develop-web-game và /game-designer tối ưu lại luật chơi và thiết kế lại đồ hoạ game sao cho
sinh động hơn tối ưu hơn và bổ sung âm thanh sao cho sinh động hơn thực tế hơn..."

Quyết định của chủ dự án (qua câu hỏi): **bỏ MathX hoàn toàn** · **giữ zero-dependency** ·
cải thiện cả ba game · **nâng cấp synth WebAudio, không dùng file âm thanh**.

## GOTCHA 4 (quan trọng nhất vòng này): index.html và core.js dùng CRLF
Mọi phép thay chuỗi chính xác bằng template `\n` đều TRƯỢT im lặng. Đã mất 3 lượt vì lỗi này.
Cách an toàn: thay **theo số dòng** (`split('\n')` + `splice`), hoặc `\r?\n` trong regex.

## Đã làm

**1. Footer gộp + bỏ MathX**
- `index.html`: 23 dòng credit/donation/citation → 13 dòng, một hàng ngang duy nhất.
- Gỡ assertion MathX khỏi `tools/smoke-test.mjs`; ghi chú trong `third_party_notices.md`
  rằng attribution nay **chỉ còn ở file đó**.
- Dọn CSS mồ côi: `.creator-support`, `.creator-signature`, `.math-reference`.
- **Gotcha**: `.tile{display:flex;flex-direction:column}` khiến khối credit xếp dọc dù đã
  đặt `display:flex`. Phải ghi đè `flex-direction:row`. Cao 128px → 84px.

**2. Âm thanh — viết lại engine (`core.js`), giữ nguyên 19 tên hàm nên không file nào phải sửa**
| | Bản cũ | Bản mới |
|---|---|---|
| Envelope | gain nhảy 0→vol tức thì (tiếng "cụp" mọi nốt) | ADSR, attack 3–50ms |
| Lọc | không | lowpass mỗi giọng, cutoff theo cao độ |
| Không gian | không | ConvolverNode + impulse response **tự sinh** (nhiễu tắt dần) |
| Bus | nối thẳng destination | gain → compressor → loa |
| Gõ/nổ | sóng vuông | nguồn **nhiễu** có bao hình + bandpass quét tần số |
| Lặp lại | y hệt mọi lần | cao độ dao động ±1,5% |
| Chồng tiếng | vô hạn, vỡ loa | giới hạn 14 giọng |
Kiểm chứng: render `OfflineAudioContext` → đỉnh 0,147 (có tín hiệu thật), bước nhảy mẫu
đầu = 0 (đã hết tiếng "cụp"). 19/19 hiệu ứng chạy không ném lỗi.

**3. Đồ hoạ / hiệu năng**
- `.energyfill` chạy `enFlow` **vô hạn ngay cả khi `width:0`** — mỗi khung hình của mọi trận
  đều repaint một phần tử vô hình. Nay gắn class `.charging` từ `renderEnergy()`.
  Đo được: rỗng = **0 animation**, đầy = **3**.
- `enPulse` đổi từ `filter:brightness/saturate` (paint) sang `opacity` của lớp phủ (composite).
- `.ans.locked` bỏ `filter:grayscale(.4)` trên 4–5 nút to chạy suốt ~1s đầu **mọi câu hỏi**.
  Nay giữ màu, chỉ lùi nhẹ. Đo được `filter:none`. Màn đấu không còn xám ngoét lúc chờ.

## KHÔNG làm (và lý do) — cần chủ dự án quyết
**Chưa cân bằng lại luật chơi.** Đã đọc kỹ bảng `BOSSES`: HP 130→640 (~1,17× mỗi boss),
atk 13→28, `time` 22→18s, `minQ` 6→17, 5 cơ chế xoay vòng (none/heal/armor/rage/drain).
Đường cong này **đã nhất quán** — đổi số lúc này là đoán mò, không có playtest với trẻ thật
thì rất dễ làm tệ đi. Hai điểm đáng bàn, nhưng là quyết định thiết kế:
1. Boss 10 cần **17 câu đúng × 18s** ⇒ một trận có thể kéo hơn 5 phút. Với trẻ tiểu học,
   session dài vậy có thể quá sức. Nếu muốn rút ngắn: giảm `minQ` cuối còn ~13–14.
2. `time` giảm dần **cùng lúc** `minQ` tăng dần ⇒ độ khó tăng theo hai trục một lúc.
   Có thể giữ `time` phẳng từ boss 6 trở đi để đường cong mượt hơn.

## TODO cho agent sau (cập nhật)
1. Gộp probe vào `tools/browser-smoke.mjs` (vẫn ưu tiên cao nhất — xem vòng 2).
   Bổ sung: `audio.mjs` (render offline chứng minh có tín hiệu + không có bước nhảy đầu tiếng).
2. Luật chơi: xem hai đề xuất ở trên, cần chủ dự án chốt trước khi động vào.
3. Còn hai chỗ đáng làm tiếp về đồ hoạ: ô "PHIÊU LƯU" trang chủ nhiều khoảng trống dọc;
   thẻ chặng đã khoá chữ hơi mờ (WCAG miễn trừ vì `[disabled]`, nhưng vẫn nên cân nhắc).
4. `<select>` "Cách trả lời" nằm giữa màn đấu vẫn là control hệ thống — màn Gõ Chữ đã được
   vẽ lại, màn đấu toán thì chưa.

### GOTCHA 5: `<details>` đóng nhưng nội dung vẫn nằm trong layout
Phát hiện nhờ bản audit tương phản báo nền sai (lấy nhầm màu nền trang). Nguyên nhân:
UA đặt `display:none` cho nội dung `<details>` khi đóng, nhưng quy tắc
`.coffee-content{display:grid}` **ghi đè mất**. Hệ quả: khối 228×109px vẫn nằm trong layout
và trong **cây accessibility**, chỉ bị `overflow:hidden` che đi — trình đọc màn hình vẫn
thấy. Lỗi này **có từ trước**, chỉ lộ ra khi footer được dựng lại.
Đã thêm `.coffee-support:not([open]) .coffee-content{display:none}`.
Đo lại: đóng = `display:none`/0px · mở = `grid`/109px.

**Bài học chung**: bản audit tương phản báo "nền lạ" thường không phải lỗi màu — mà là dấu
hiệu phần tử đang nằm sai chỗ trong layout. Đừng vội đổi màu; hãy đi soi hình học trước.

---

# Vòng 4 — footer tối giản (lần 2)

Prompt: "kiểm tra và thiết kế lại phần cite và xin cafe tôi muốn tối giản"

## Vấn đề thật sự nằm ở đâu
Vòng 3 tôi đã gộp credit + donation nhưng **giữ nguyên class `.tile`**, mà `.tile` gán:
`border:4px solid var(--ink)` + `box-shadow:0 6px 0` + `border-radius:20px` +
`padding:clamp(14px,1.3vw,22px)`. Tức là phần ghi công đang mặc **đúng bộ áo của các nút
chơi** — hai dòng chữ nhỏ mà chiếm chỗ như một nút bấm lớn. Gộp nội dung thôi chưa đủ;
phải cởi bỏ chrome đó thì mắt mới đọc ra "đây là chân trang".

## Đã làm
- Gỡ sạch viền/đổ bóng/bo góc/nền của `.tile` khỏi `.tile-credit`, thay bằng **một đường
  kẻ đứt mảnh** phía trên. Cao **84px → 38px**.
- Chữ ký: "✦ Được tạo bởi **Châu Vinh**" → "✦ **Châu Vinh**".
- Nút cà phê: từ hộp kem rộng 232px viền vàng 2px → **một liên kết chữ** "☕ Ủng hộ".
- Nội dung mở ra: bỏ đoạn văn quảng cáo, chỉ còn ô QR 118px canh giữa.
- Markup 14 dòng → 12 dòng.

## Ba chi tiết phải sửa lại sau khi nhìn ảnh chụp
1. `<small>` không hiện — có sẵn quy tắc `.coffee-qr-placeholder small{display:none}` từ
   trước. Tôi bỏ `<b>` (đang hiện) mà giữ `<small>` (bị ẩn) ⇒ ô QR trống trơn không nhãn.
   Đổi lại dùng `<b>`.
2. Gạch chân kéo qua cả emoji ☕ trông như lỗi hiển thị ⇒ bọc riêng `.coffee-label`,
   chỉ gạch chân phần chữ.
3. Nhãn "Đang chờ mã QR" tràn khỏi ô 100px ⇒ rút còn "Chờ mã QR" + nới ô lên 118px.
   Đo lại: chữ 60px trong ô 118px.

Ràng buộc test vẫn giữ: chuỗi `Châu Vinh` và class `coffee-qr-placeholder` đều còn.
Tương phản 4 màu chữ mới: 5,18 · 9,07 · 4,96 · 4,96 — đều đạt AA.

---

# Vòng 5 — bỏ donate, một khung màn hình, hoạt ảnh Sudoku

Prompt: bỏ donate · /code-review-expert · tối ưu · giao diện hiện đại sinh động, nhiều
hoạt ảnh + âm thanh khi chơi · **desktop: gói gọn 1 khung, giảm cuộn, tận dụng tối đa
kích thước, bỏ khoảng trống thừa**

## Đo trước / sau

| | Trước | Sau |
|---|---|---|
| Màn vừa 1 khung (8 màn × 3 độ phân giải) | 17/24 | **24/24** |
| Gõ Chữ setup @1366×768 | cuộn **370px** | vừa khít |
| Gõ Chữ setup @1920×1080 | cuộn 201px | vừa khít |
| Trang chủ — lề chết trên+dưới @1920 | **346px (32%)** | 20px |
| Tương phản dưới chuẩn AA | 1 | **0** |

## Đã làm
1. **Bỏ donate**: markup, CSS, và assertion `coffee-qr-placeholder` trong smoke-test.
   Footer còn đúng một dòng "✦ Châu Vinh".
2. **Shell một khung**: `.wrap{height:100dvh}` + `.screen.active` flex + thẻ `flex:1`
   với `overflow-y:auto`. Khung ngoài không bao giờ cuộn nữa.
3. **Màn setup Gõ Chữ chia 2 cột** (tuỳ chọn + nút bên trái, bản đồ chiến dịch bên phải).
   Đây là thứ hạ 370px cuộn xuống 0.
4. **Lưới bento giãn lấp đầy** (`grid-template-rows: auto 1fr 1fr auto`) — hết 200px chết
   dưới đáy thẻ, ô chơi to hơn hẳn.
5. **Sudoku có hoạt ảnh + âm thanh khi khép nhóm 9 ô** — sóng sáng chạy dọc hàng/cột/khối
   vừa hoàn thành + tiếng thưởng (`gold`, hoặc `levelup` nếu khép ≥2 nhóm cùng lúc).
   Dùng `opacity`/`transform` (composite), KHÔNG animate màu nền.
   Thêm `later()`/`clearFxTimers()` có theo dõi, dọn trong `cleanupRuntime`.

## GOTCHA 6: `margin:0 auto` + flex column = thẻ co còn 60px
Đặt `.screen.active{display:flex;flex-direction:column}` khiến `.card{margin:0 auto}`
(vốn để canh giữa khi là block) trở thành **auto-margin trên trục ngang của flex**, ghi đè
`align-items:stretch` ⇒ thẻ co về fit-content. Đo được **rộng 60px**, kéo theo container
query của `.home-card` tụt từ 3 cột xuống 1 cột 8 hàng ⇒ trang chủ phồng lên 1571px.
Sửa: thêm `width:100%` cho thẻ.

## GOTCHA 7: `min-height:100dvh` gây vòng lặp với `flex:1`
`min-height` vẫn cho `.wrap` phình theo nội dung, mà con lại `flex:1` để lấp đầy cha ⇒
đẩy nhau vô hạn, trang chủ vọt 823px. Phải dùng `height` CỨNG.

## GOTCHA 8: `@media` không tăng độ ưu tiên
Override `.sudoku-board-wrap` đặt trong `@media (max-height:820px)` **phía trên** khai báo
gốc thì vẫn thua. Đo được: bàn cờ giữ nguyên 522px dù rule 62vh "đã có". Phải đặt cuối file.

## GOTCHA 9: xoá CSS bằng regex theo DÒNG rất nguy hiểm
File CSS nén nhiều rule một dòng. `s/^.*coffee-.*$//gm` đã cuốn theo cả rule khác ⇒ lệch 2
dấu ngoặc. Cách an toàn: xoá theo `\.ten-class\{[^}]*\}` hoặc kiểm tra cân bằng ngoặc + đối
chiếu "mọi class trong index.html đều còn CSS" sau mỗi lần xoá.

## Rà soát (code-review) — không có phát hiện chặn merge
- Hiệu ứng trận đấu KHÔNG bị `overflow` của thẻ cắt: `.proj/.trail` nằm trong `.arena`,
  `confetti`/`dmg` gắn thẳng vào `body`. Đo lúc bắn đồng thời: `scrollHeight` không đổi
  (740→740) ⇒ không sinh thanh cuộn tạm.
- `fxTimers` của Sudoku được dọn trong `cleanupRuntime`, kèm gỡ class `unit-clear` còn sót.
- 149/149 class trong index.html đều còn CSS.

## TODO cho agent sau
1. Gộp probe vào `tools/browser-smoke.mjs` — **vẫn là việc đáng làm nhất**, giờ có thêm
   `fit.mjs` (đo cuộn/lấp đầy 8 màn × 3 độ phân giải) rất đáng giữ.
2. Luật chơi vẫn CHƯA đụng (xem phân tích vòng 3) — cần chủ dự án chốt.
3. Gõ Chữ và Đấu Toán chưa có hoạt ảnh "mốc" tương đương Sudoku (vd: hết một đợt quái,
   hạ được boss giai đoạn 1). Đây là hướng làm tiếp cho "sinh động hơn".
4. `<select>` "Cách trả lời" giữa màn đấu vẫn là control hệ thống.

---

# Vòng 6 — chữ to hơn, cite chuyên nghiệp, nhân vật SVG, luật chơi

Prompt: cân đối lại thiết kế · chữ to hơn · cite chuyên nghiệp hơn · **thay emoji tĩnh bằng
nhân vật/hoạt ảnh** · đồng nhất layout · **cải thiện luật chơi**

## Đo trước / sau

| | Trước | Sau |
|---|---|---|
| Sàn cỡ chữ | **12px** (27 phần tử ở màn Gõ Chữ) | **14px** |
| Giá trị bo góc khác nhau | **11** | 3 bậc (12/16/22) + pill |
| Độ đổ bóng khác nhau | **8** | 3 bậc (2/4/6) |
| Độ dày viền khác nhau | 4 | 3 bậc (2/3/4) |
| Nhân vật | emoji 🦸 / 👾 | **SVG nội tuyến, chớp mắt + vung tay** |
| Trận boss cuối | 17 câu (~3,4 phút) | 15 câu (~3,0 phút) |
| Màn vừa 1 khung | 24/24 | **24/24 (giữ nguyên sau khi chữ to lên)** |

## Luật chơi — đã sửa (lần đầu được duyệt)
Phát hiện một **bất nhất thật**: boss 8 chỉ có **18s/câu**, ít hơn cả boss 9 và 10 (19s) —
càng về cuối lại càng dễ về thời gian. Nay:
- `minQ`: 6,7,8,9,10,11,12,**14,15,17** → 6,7,8,9,10,11,12,**13,14,15** (tăng đều đúng +1)
- `time`: 22,21,21,20,20,**19**,19,**18**,19,19 → 22,21,21,20,20,**20**,19,**19**,19,19
  (đơn điệu không tăng, hết chỗ trũng)
- `dmgCap = ceil(hp/minQ)` tự lên mượt 22→43. Không test nào chốt cứng bảng này.

## Nhân vật SVG — vì sao và bẫy gặp phải
Chọn **SVG nội tuyến** (không phải canvas/sprite ảnh): zero-dependency đúng ràng buộc dự án,
nét sắc ở mọi cỡ `--spriteF` (48px→232px), và từng bộ phận animate được.

**GOTCHA 10: `<use>` giấu nội dung trong shadow DOM.** Bản đầu tôi làm sprite sheet
`<symbol>` + `<use href="#...">`. Màu qua `--c-body` chạy (custom property kế thừa được),
nhưng `.chr-eyes{animation:...}` **hoàn toàn không áp** — CSS ngoài không với tới shadow tree.
Đo được `animationName: "none"`. Chỉ có 2 nhân vật nên nội tuyến thẳng là đúng.

**GOTCHA 11: `scaleX(-1)` còn sót từ thời emoji.** 11 keyframe (idleFloat/castHero/hurt...)
lật ngang nhân vật vì emoji 🦸 quay mặt sai hướng. SVG vẽ sẵn quay phải nên phải gỡ hết,
nếu không áo choàng và tay bị lật ngược.

**Thừa nhận:** bản vẽ đầu tiên **xấu hơn emoji nó thay** (tóc thành mũ trùm, tay chìa ngang,
quái như quả trứng). Phải vẽ lại lần hai mới dùng được. Ảnh chụp là thứ duy nhất chỉ ra điều
đó — không test nào bắt được.

**Hệ tham số**: 10 boss dùng CHUNG một hình, khác nhau qua `--c-body/--c-belly/--c-horn` +
class `.no-horns` (bảng `BOSS_ART` trong core.js). Không phải vẽ tay 10 con.

## TODO cho agent sau
1. **Nhân vật mới mới chỉ phủ 2 chỗ**: `heroSprite` và `bossSprite` màn Đấu Toán. Quái trong
   Gõ Chữ (`monsterEmojis`, 8 emoji) và icon trên bản đồ chặng vẫn là emoji. Muốn phủ hết thì
   tái dùng `#chr-beast` + bảng màu — hạ tầng đã sẵn.
2. Gộp probe vào `tools/browser-smoke.mjs` (vẫn ưu tiên cao nhất). Nay có thêm `fit.mjs`,
   `textsize.mjs`, `contrast2.mjs` đều đáng giữ.
3. Token `--bd-*`/`--r-*`/`--sh-*` mới khai báo, CHƯA thay thế hết giá trị px cứng trong file.
   Lần sửa CSS tới nên dùng token thay số.
4. Hoạt ảnh "mốc" mới chỉ có ở Sudoku (khép nhóm 9 ô). Gõ Chữ và Đấu Toán chưa có.

---

# Vòng 7 — làm nốt 4 việc tồn

Prompt: "thực hiện bổ sung thêm cho tôi sao cho hoàn thiện nhất"

Đã đóng cả 4 TODO của vòng 6.

## 1. Nhân vật SVG phủ hết Gõ Chữ
- Chuyển hình quái vào `<template id="tplBeast">` làm **NGUỒN DUY NHẤT**; `#bossSprite`
  (Đấu Toán) và mọi quái Gõ Chữ đều clone từ đó. Sửa hình một chỗ là đổi khắp nơi.
- 8 bộ màu `BEAST_SKINS` + 1 bộ riêng cho boss chặng, gán qua `monster.skin`.
- Giữ `monster.emoji` làm phương án dự phòng nếu `<template>` không có.
- **Cỡ hình**: `1em` trông nhỏ hơn hẳn emoji cũ vì hình chỉ chiếm ~70% khung viewBox 120,
  trong khi glyph emoji lấp kín ô em. Chỉnh lên `1.45em` mới cân. Hai assertion
  "chữ không bị cắt" / "quái không đè nhau" vẫn xanh.

## 2. Probe thành test vĩnh viễn — `tools/browser-smoke.mjs` từ 40 → **46 assertion**
Sáu nhóm mới, mỗi nhóm ứng với một lỗi THẬT từng lọt qua bộ test cũ:
| Assertion | Bắt lỗi gì |
|---|---|
| aria-pressed khớp lúc tải | bootstrap ghi `String(!SOUND_ON)` |
| Sudoku luôn 1 tab stop | vẽ lại từng phần bỏ sót ô giữ tab stop |
| Khép nhóm 9 ô thì 9 ô sáng | trước đây hoàn toàn im lặng |
| Đường bay chưởng bám chiều cao sân | `state.fieldH` không đo lại (lệch 92,8px) |
| Ô số liệu dùng tabular-nums | Baloo 2 chữ số rộng 7,88–12,13px |
| 5 màn gói trong một khung 1366×768 | layout tràn |

**Đối chứng âm** (bắt buộc, xem GOTCHA vòng 2):
- Gỡ khối nén khung thấp → assertion "một khung" ĐỎ: `Gõ chữ(thẻ 24px)` ✔ có răng.
- Nhưng revert `height`→`min-height` (lỗi vòng 5) thì **vẫn XANH** — vì bản vá `width:100%`
  thêm sau đã vô hiệu hoá lỗi đó. Ghi lại để không tưởng nhầm assertion này phủ mọi thứ.

## GOTCHA 12: regex trong template literal bị nuốt backslash
Assertion đường bay chưởng ĐỎ ngay lần đầu với "lệch 99,1px" — đúng tầm của lỗi thật, tôi
suýt tưởng mình vừa làm hỏng code. Thực ra probe độc lập vẫn 0,0px. Nguyên nhân: regex
`/translate\(([-\d.]+)px/` nằm trong **template literal** nên `\d` → `d`, `\(` → `(`,
regex không khớp, `dy` thành `null`, và `|null − (−99.1)| = 99.1`. Phải viết `\\d`, `\\(`.
**Bài học**: con số lệch trùng khớp với lỗi đã biết chưa chắc là lỗi đó — kiểm tra probe
độc lập trước khi kết luận.

## 3. Token thiết kế — thay 137 giá trị px cứng
`--bd-1/2/3`, `--r-1/2/3/pill`, `--sh-1/2/3` giờ được DÙNG thật, không chỉ khai báo.
Còn lại 3/6/8px là chi tiết nhỏ (ô ghi chú, highlight ký tự) — cố ý giữ.

## 4. Hoạt ảnh mốc
Gõ Chữ **đã có sẵn** banner + âm thanh mỗi đợt (`beginWave` → `showBanner` + `playSound`),
nên không thêm trùng. Sudoku đã có ăn mừng khép nhóm từ vòng 5.

## Trạng thái cuối
smoke 4/4 · **browser 46/46** · tương phản 0 · 24/24 màn vừa khung · sàn chữ 14px

## TODO còn lại cho agent sau
1. Icon trên bản đồ chặng Gõ Chữ và icon vật phẩm cửa hàng vẫn là emoji — đó là **icon giao
   diện**, không phải nhân vật, nên để emoji là hợp lý. Chỉ đổi nếu muốn đồng bộ tuyệt đối.
2. Đấu Toán chưa có hoạt ảnh mốc riêng (vd: boss vào giai đoạn 2 đã có `phase2fx`, nhưng
   chưa có mốc "còn 1 câu nữa là hạ được").
3. `probe.mjs`, `fit.mjs`, `contrast2.mjs`, `textsize.mjs` trong scratchpad vẫn hữu ích cho
   việc đo, nhưng phần quan trọng nhất đã nằm trong `browser-smoke.mjs` rồi.

---

# Phiên tiếp theo — Thiết kế lại + hiện đại hoá nền tảng

Prompt gốc: `/design-taste-frontend /develop-web-game /high-end-visual-design` — "redesign
optimal web game, dùng framework mới nhất để tối ưu hơn".

## Quyết định của chủ dự án (đã hỏi trước khi làm)

1. **KHÔNG dùng framework.** Giữ zero-dependency, không build step. Thay vào đó dùng các
   tính năng NỀN TẢNG mới. Lý do đã trình bày: game này là DOM/CSS với vòng lặp rAF
   (quái gõ chữ, FX chiến đấu) — thêm VDOM là thêm chi phí mỗi khung hình, không phải tối ưu.
   Chi phí thật nằm ở kho từ 4,6 MB, không framework nào chữa được.
2. **Nâng cấp bản sắc vui nhộn**, không chuyển sang phong cách "cao cấp/tối giản".
3. Làm thẳng trên `main`, không commit checkpoint.

## Hai quy tắc của skill đã bị TỪ CHỐI (có bằng chứng)

- `high-end-visual-design` bắt "macro-whitespace, `py-24` đến `py-40`, gấp đôi padding".
  **Vi phạm trực tiếp** assertion `browser-smoke.mjs:521` ("Cả 5 màn gói gọn trong khung
  1366×768"). Bỏ.
- `design-taste-frontend` §3.D cấm emoji, §9.G cấm tuyệt đối dấu gạch dài (—).
  Emoji Ở ĐÂY là hệ biểu tượng của game và bị ~50 `onclick` + 2 bộ test phụ thuộc. Còn lệnh
  cấm `—` sinh ra vì nó là "dấu hiệu AI" trong copy marketing tiếng Anh — lý do đó không
  chuyển sang văn xuôi tiếng Việt do người thật viết (§11.C: giữ giọng văn). Cả hai đều giữ.
- `@layer` cũng đã cân nhắc rồi BỎ: bọc 1.129 dòng CSS sẵn có vào layer sẽ đảo thứ tự
  thắng-thua giữa các rule khác độ đặc hiệu ở hai file, rủi ro thật mà người dùng không
  thấy lợi ích gì. Không đáng.

## Đã làm

| Vùng | Nội dung |
|---|---|
| Vật liệu | `--elev-1/2/3` + `--elev-3-dark` + `--elev-lift`: bóng cứng arcade (giữ ADN) **cộng** bóng nhòe theo sắc nền **cộng** vệt sáng inset ở mép trên. 19 bề mặt chuyển sang dùng. Thẻ hết trông như hình dán phẳng. |
| Nhịp | `--ease-snap/pop/settle` + `--dur-1..4`. Token hoá 8 `transition` và **21 hoạt hình một-lần**. Vòng lặp vô hạn (`linear` quay, `ease-in-out` thở) **cố ý giữ nguyên** — đổi sang đường cong nảy sẽ giật ở điểm nối chu kỳ. |
| Chuyển màn | View Transitions API trong `showScreen()`, có morph phần tử dùng chung (`view-transition-name:mainCard`). Tách `swapScreen`/`focusScreen`. Tiêu điểm đặt ở `vt.ready` **chứ không** `vt.finished` — người dùng bàn phím không phải đợi hết hoạt hình. |
| Trợ năng | **Lỗi thật đã sửa:** radio chọn cấp Sudoku và cấp Gõ Chữ bị giấu bằng `opacity:0`, nên outline `:focus-visible` toàn cục vẫn được vẽ nhưng VÔ HÌNH. Người dùng bàn phím không thấy gì (WCAG 2.4.7). Sửa bằng `:has(input:focus-visible)` trên nhãn cha. |
| Hiệu năng | `sw.js` v8: kho từ 4,6 MB tách khỏi `install` sang `DEFERRED_ASSETS`, nạp ngầm sau `activate`. Trước đây lượt ghé ĐẦU TIÊN tải 4,6 MB tranh băng thông với chính trang, kể cả người không mở Gõ Chữ. Kết quả offline y hệt, chỉ khác thời điểm. |
| Hiệu năng | 8 thẻ `<script>` chuyển lên `<head>` + `defer`. `defer` giữ NGUYÊN thứ tự tài liệu = giữ nguyên hệ mô-đun theo thứ tự nạp; đặt ở head để bộ quét tải trước thấy ngay thay vì đợi phân tích hết 530 dòng markup. |
| Chữ nghĩa | `text-wrap:balance` cho tiêu đề **và ô câu hỏi** (thứ được đọc nhiều nhất), `pretty` cho đoạn văn, siết letter-spacing cho Baloo cỡ lớn, `tabular-nums` cho số liệu HUD. |
| Bố cục | Sáu màn tĩnh (`intro/bossWin/shop/scoreEnd/victory/defeat`) canh giữa theo trục dọc — chụp màn hình cho thấy gần 40% thẻ bỏ trống ở dưới. Ô chủ lực "Phiêu lưu" cho biểu tượng tự giãn lấp khoảng rỗng giữa ô. |

## GOTCHA cho agent sau

**1. Chuyển `.card` sang flex làm HỎNG bề ngang mọi khối bọc nút.** Sáu màn đều dùng
`<div style="max-width:520px;margin:0 auto">`. Lề auto theo trục ngang **tắt** cơ chế
`stretch` của flex, nên khối co về fit-content — nút chính "VÀO TRẬN!" hoá ra HẸP HƠN nút
phụ "CỬA HÀNG", đảo ngược thứ bậc. Đây đúng cái bẫy đã ghi chú sẵn ở `.card` trong main.css.
Khắc phục: `#intro>.card>div,…{width:100%}`. **Chỉ nhìn ảnh chụp mới phát hiện được — cả 46
assertion đều xanh trong lúc lỗi này đang tồn tại.**

**2. Headless Chrome mặc định `prefers-reduced-motion: reduce` = TRUE.** Nghĩa là toàn bộ 46
assertion chạy qua NHÁNH DỰ PHÒNG, không hề chạm View Transitions. Muốn kiểm tra nhánh thật
phải ép qua CDP:
```js
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
```
Đã dò và xác nhận: ép xong thì `transitionRan: true`, `viewTransitionName` = `mainCard`.
Hai nhánh đều đã được chứng minh — dự phòng bởi bộ test, nhánh thật bởi bản dò.

**3. Tách asset khỏi `CORE_ASSETS` làm THỦNG lưới kiểm tra.** `smoke-test.mjs` chỉ soi
`CORE_ASSETS`; số tham chiếu tụt 29 → 28 mà không assertion nào đỏ. Đã bổ sung kiểm tra
`DEFERRED_ASSETS` để gõ sai tên file không lọt lưới. Thêm danh sách asset mới thì nhớ dạy
`smoke-test.mjs` biết.

## Kết quả kiểm thử

- `tools/smoke-test.mjs` — 4/4 ✓
- `tools/browser-smoke.mjs` — 46/46 ✓, không lỗi JS runtime
- Bản dò View Transitions — 2 nhánh ✓

---

# Vòng 8 — sửa nhân vật: boss biến mất, và hai nhân vật cho một trò chơi

Prompt gốc: `/code-review-expert /develop-web-game` — "fix all graphic character because
something wrong and miss so check and optimal and complete project".

## LỖI NẶNG NHẤT: boss BIẾN MẤT HOÀN TOÀN từ giai đoạn 2

`arena.js` ghi `boss.textContent = b.p2||b.emoji` lên `#bossSprite`. Từ vòng 6 phần tử ấy
là `<svg>` chứ không còn là `<span>` emoji nữa, mà **`textContent` xoá sạch mọi nút con**.
Emoji thay vào lại vô hình vì `.fighter svg.sprite{font-size:0}` (main.css). Kết quả: hễ
boss tụt xuống dưới 50% máu là con quái **biến mất khỏi sân**, và mất luôn cho tới hết
phiên — `paintBoss()` chỉ đặt biến CSS chứ không dựng lại hình.

`core.js survAdvance()` mắc **đúng một lỗi ấy** ở chế độ Sinh tồn.

Đo được: `#bossSprite.childElementCount` 1 → **0**, `innerHTML` → `"🐛"`. Ảnh chụp cho thấy
biển "🔥 GIAI ĐOẠN 2" lơ lửng trên bãi cỏ trống.

**Nay**: hoá dạng = TÔ LẠI bảng màu (`applySkin` + `rageArt`), không đụng tới nút con.

## GOTCHA 13: 46 assertion không hề chạm tới một hình nhân vật nào

`grep -n "Sprite|emoji|beast|chr-" tools/*.mjs` trả về **rỗng**. Vì thế một con boss vô hình
vẫn cho 46/46 xanh. Bài học giống GOTCHA vòng 7 nhưng ở mức nặng hơn: **thứ không có
assertion thì không tồn tại đối với bộ test**, dù nó là thứ người chơi nhìn vào nhiều nhất.

Đã thêm 5 assertion (46 → **51**), mỗi cái ứng với một lỗi thật, và **đã đối chứng âm**:
- tái tạo `boss.textContent='🐛'` → đỏ: `Boss vẫn còn hình sau khi vào giai đoạn 2 (0 nút…)`
- gỡ `.chr-spikes` khỏi quy tắc `.no-horns` → đỏ: `(sừng none, gai inline)`

## Nhân vật lệch nhau ở 4 chỗ khác

| Chỗ | Trước | Sau |
|---|---|---|
| Màn "BOSS XUẤT HIỆN" | emoji 🐌 cho "Ốc Sên" — trong khi sàn đấu vẽ khối tròn xanh có sừng | dựng đúng con quái ấy, đúng bảng màu, to gấp 2,2 lần cỡ chữ |
| Pháp sư Gõ Chữ | emoji 🧙‍♀️ (2 chỗ) | cùng một nhân vật với Đấu Toán, bơm từ `tplHero` |
| Bản đồ 10 chặng | 10 emoji chẳng liên quan tới quái trong trận | 10 bảng màu `STAGE_SKINS`, **dùng chung** với boss thật của chặng |
| Nhãn tên boss / viên nhãn chặng | có emoji kèm | bỏ — nhân vật đã đứng ngay đó |

## Một nguồn duy nhất — lần này là thật

Vòng 7 ghi "`tplBeast` là NGUỒN DUY NHẤT" nhưng `#bossSprite` vẫn là **bản chép nguyên xi**
trong `index.html`. Nay `#heroSprite` và `#bossSprite` chỉ còn là **vỏ `<svg>` rỗng** mang
`data-art="tplHero|tplBeast"`; `bootstrap.js:hydrateArt()` bơm hình vào lúc khởi động. Thêm
một chỗ cần nhân vật thì chỉ cần đặt `data-art` — không chép hình lần nữa.

## Vẽ lại tay nhân vật

Ảnh phóng to ×4 cho thấy tay là **một nét 4,5px** bên cạnh thân người mập mạp — trông như
sợi dây, kèm một quả cầu vàng lơ lửng không dính vào đâu. Nay mỗi tay là **hai nét chồng
nhau** (viền đậm 16px dưới, nét da 9px trên) + nắm tay, thêm ủng vàng. Lại một lần nữa:
**chỉ ảnh chụp mới chỉ ra được, không assertion nào bắt được.**

## GOTCHA 14: trộn màu gốc với đỏ cho ra NÂU BÙN

`rageArt` bản đầu trộn thẳng `mixHex(art.body,'#d81f3a',.55)`. Boss 1 thân xanh lục → lục
pha đỏ = nâu, đúng lý thuyết màu, không tránh được. Đảo lại: **lấy đỏ làm nền, chỉ pha 15%
màu gốc**, giữ nguyên màu sừng làm sợi dây nhận dạng. Ra đỏ sạch (`#8fd36a` → `#be3d3c`).

## GOTCHA 15: đổi emoji thành `<svg>` làm dôi khung

`.typing-hero` cao thêm 30% (hình 1,3em so với glyph 1em) → màn chọn chiến dịch dôi **3px**
và assertion "5 màn gói trong một khung 1366×768" ĐỎ. Cách chữa: `width:1.25em` nhưng
`margin:-.125em 0` — hình to hơn mà **chiếm chỗ đúng 1em** như glyph cũ.

Đồng thời `.mapnode.locked{filter:grayscale(1)}` biến 9 chặng chưa mở thành 9 vệt xám
**giống hệt nhau** (10 chặng dùng chung một hình, chỉ khác màu). Hạ xuống `grayscale(.45)`.

## Mã chết đã gỡ

- `drawMap()` + 5 lời gọi — **không có phần tử `#map` nào** trong `index.html`, hàm luôn
  `return` ngay dòng đầu.
- `SURV_MONSTERS`, trường `p2` của cả 10 boss, tham số `emoji` của `prepArenaForMode` —
  tất cả chỉ còn tồn tại để nuôi hai lỗi ở trên.

## Kết quả kiểm thử

- `tools/smoke-test.mjs` — 4/4 ✓
- `tools/browser-smoke.mjs` — **51/51 ✓**, không lỗi JS runtime
- Chơi thử qua CDP: hạ boss → cửa hàng → boss 2 → chết → đánh lại; siêu chưởng; Đấu nhanh;
  Sinh tồn; gõ thật từ "entry" trong Gõ Chữ (điểm 0 → 28). Hình nhân vật còn nguyên ở **mọi**
  bước (`bossCon:1, heroCon:1`).
- Chạy độc lập bằng Playwright client của skill `develop-web-game` — không lỗi console.
- `sw.js` `CACHE_VERSION` v8 → **v9**.

## TODO cho agent sau

1. **Chưa xem tận mắt boss của chặng trong Gõ Chữ.** `state` và `spawnBoss` nằm trong IIFE
   nên không gọi được từ ngoài; đã xác minh gián tiếp (map và boss cùng gọi `stageSkin(index)`,
   `state.stageIndex` đặt ở `startTypingRun`). Muốn chắc thì phải chơi hết 3 đợt chặng 1.
2. Quái Gõ Chữ vẫn dùng `BEAST_SKINS` (8 bộ) tách rời `STAGE_SKINS` (10 bộ) và `BOSS_ART`
   (10 bộ) — **ba bảng màu cho cùng một hình**. Gộp lại được nếu muốn.
3. Icon vật phẩm cửa hàng vẫn là emoji — đó là **icon giao diện**, không phải nhân vật, để
   nguyên là hợp lý.
4. `#introEmoji` giờ chứa `<svg>` nhưng tên id vẫn là "emoji" — đổi tên thì phải sửa cả
   `smoke-test.mjs` (đếm tham chiếu), chưa đáng.
