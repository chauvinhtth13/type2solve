# Ngân hàng câu hỏi — Khối 2 (tier 2 trong code)

> **Tài liệu tra cứu, không phải dữ liệu game đọc lúc chạy.** Đấu Trường Tư Duy sinh
> câu hỏi ngẫu nhiên bằng công thức trong `assets/js/question-bank.js`, không đọc từ file
> này. Các ví dụ dưới đây là **kết quả thật** lấy trực tiếp từ `genQuestion(2)` lúc
> game chạy trong trình duyệt (không phải tự bịa) — dùng để bạn xem/kiểm tra/mở rộng công
> thức sinh câu hỏi, đổi nội dung ở đây **không** làm game đổi theo.
>
> ⚠️ Mức thử thách — thêm phép nhân/chia, dãy số, đơn vị đo (khoảng lớp 2–3).

## Danh sách dạng câu hỏi (24 dạng)

| ID | Chủ đề | Hàm sinh |
|---|---|---|
| `arith` | 🧮 Tính nhanh | `genArith()` |
| `missing` | ❓ Tìm số | `genMissing()` |
| `seq` | 🔢 Quy luật | `genSeq()` |
| `word` | 📖 Toán đố | `genWord()` |
| `geo` | 📐 Hình học | `genGeo()` |
| `logic` | 🧠 Tư duy | `genLogic()` |
| `eq` | 🍎 Cân bằng | `genEmojiEq()` |
| `count` | 🌳 Đếm thông minh | `genSmartCount()` |
| `back` | ↩️ Suy luận ngược | `genBackwards()` |
| `calen` | 📅 Lịch & thời gian | `genCalendar()` |
| `olymp` | 🏅 Olympic | `genOlymp()` |
| `cycle` | 🔗 Chuỗi lặp | `genCycle()` |
| `eng` | 🔤 English | `genEnglish()` |
| `big` | 💯 Số lớn | `genBigNum()` |
| `sasmo` | 🏅 SASMO | `genSasmo()` |
| `imas` | 🌏 IMAS | `genImas()` |
| `amc` | 🎖️ AMC | `genAmc()` |
| `world` | 🌍 Kinh điển | `genWorld()` |
| `visual` | 🎨 Nhìn hình | `genVisual()` |
| `numsense` | 🔟 Cảm nhận số | `genNumSense()` |
| `chance` | 🎲 Xác suất | `genChance()` |
| `unit` | 📏 Đổi đơn vị | `genUnit()` |
| `brain` | 💎 Thử thách mới | `genBrainChallenge()` |
| `singapore` | 🇸🇬 Singapore lớp 3 | `genSingapore3()` |

## Chi tiết từng dạng

### `arith` — 🧮 Tính nhanh

- **ID:** `arith`
- **Chủ đề:** 🧮 Tính nhanh
- **Hàm sinh:** `genArith()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `missing` — ❓ Tìm số

- **ID:** `missing`
- **Chủ đề:** ❓ Tìm số
- **Hàm sinh:** `genMissing()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: ❓ − 3 = 62
- Gợi ý: ❓ = 62 + 3 = 65. (Muốn tìm số bị trừ, lấy hiệu cộng số trừ.)
- Đáp án: **65**
- Các lựa chọn hiện ra: 62, 65, 64, 63

**Ví dụ 2**

- Nội dung câu hỏi: ❓ − 64 = 18
- Gợi ý: ❓ = 18 + 64 = 82. (Muốn tìm số bị trừ, lấy hiệu cộng số trừ.)
- Đáp án: **82**
- Các lựa chọn hiện ra: 81, 80, 83, 82

### `seq` — 🔢 Quy luật

- **ID:** `seq`
- **Chủ đề:** 🔢 Quy luật
- **Hàm sinh:** `genSeq()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: Quy luật gì nhỉ? 15, 25, 35, 45, ❓
- Gợi ý: Mỗi số tăng thêm 10: 45 + 10 = 55.
- Đáp án: **55**
- Các lựa chọn hiện ra: 56, 55, 53, 54

### `word` — 📖 Toán đố

- **ID:** `word`
- **Chủ đề:** 📖 Toán đố
- **Hàm sinh:** `genWord()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🌸 Mỗi hộp có 3 bông hoa. Na mua 6 hộp và ăn mất 7 bông hoa. Hỏi còn lại bao nhiêu bông hoa?
- Gợi ý: Mua: 3×6 = 18 bông hoa. Ăn mất 7 còn: 18 − 7 = 11.
- Đáp án: **11**
- Các lựa chọn hiện ra: 14, 13, 11, 12

**Ví dụ 2**

- Nội dung câu hỏi: 🔵 Na có 13 viên bi. Nếu Na cho Minh 3 viên bi thì hai bạn có số viên bi BẰNG NHAU. Hỏi Minh đang có bao nhiêu viên bi?
- Gợi ý: Sau khi cho, mỗi bạn có 13−3 = 10. Vậy Minh đang có 10 − 3 = 7 (ít hơn Na đúng 6).
- Đáp án: **7**
- Các lựa chọn hiện ra: 7, 8, 5, 6

### `geo` — 📐 Hình học

- **ID:** `geo`
- **Chủ đề:** 📐 Hình học
- **Hàm sinh:** `genGeo()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: Chu vi hình vuông có cạnh 5 cm là bao nhiêu cm?
- Gợi ý: Hình vuông có 4 cạnh bằng nhau: chu vi = 5 × 4 = 20 cm.
- Đáp án: **20**
- Các lựa chọn hiện ra: 22, 20, 23, 21

### `logic` — 🧠 Tư duy

- **ID:** `logic`
- **Chủ đề:** 🧠 Tư duy
- **Hàm sinh:** `genLogic()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🍕 Có 16 chiếc bánh chia đều cho 2 bạn. Sau đó mỗi bạn lại chia đôi phần của mình để ăn 2 bữa. Hỏi MỖI BỮA mỗi bạn ăn mấy chiếc?
- Gợi ý: Mỗi bạn được 16:2 = 8 chiếc, chia làm 2 bữa: 8:2 = 4 chiếc mỗi bữa.
- Đáp án: **4**
- Các lựa chọn hiện ra: 3, 1, 2, 4

### `eq` — 🍎 Cân bằng

- **ID:** `eq`
- **Chủ đề:** 🍎 Cân bằng
- **Hàm sinh:** `genEmojiEq()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: Mỗi loại quả là một số. Hỏi 🍎 = ?
- Gợi ý: 🍌 = 9 : 3 = 3 → 🍊 = 9 − 3 = 6 → 🍎 = 11 − 6 = 5.
- Đáp án: **5**
- Các lựa chọn hiện ra: 3, 6, 4, 5

**Ví dụ 2**

- Nội dung câu hỏi: Mỗi loại quả là một số. Hỏi 🍌 = ?
- Gợi ý: 🍎 = 15 : 3 = 5 → 🍇 = 6 − 5 = 1 → 🍌 = 3 − 1 = 2.
- Đáp án: **2**
- Các lựa chọn hiện ra: 5, 2, 4, 3

**Ví dụ 3**

- Nội dung câu hỏi: Mỗi loại quả là một số. Hỏi 🍇 = ?
- Gợi ý: 🍓 = 6 : 3 = 2 → 🍊 = 5 − 2 = 3 → 🍇 = 8 − 3 = 5.
- Đáp án: **5**
- Các lựa chọn hiện ra: 7, 6, 5, 4

### `count` — 🌳 Đếm thông minh

- **ID:** `count`
- **Chủ đề:** 🌳 Đếm thông minh
- **Hàm sinh:** `genSmartCount()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🏠 Mỗi tầng nhà có 10 bậc cầu thang. Bé Bo đi từ tầng 1 lên tầng 3. Hỏi bé leo bao nhiêu bậc?
- Gợi ý: Từ tầng 1 lên tầng 3 chỉ đi qua 2 đoạn thang, nên số bậc = 2 × 10 = 20.
- Đáp án: **20**
- Các lựa chọn hiện ra: 20, 23, 21, 22

**Ví dụ 2**

- Nội dung câu hỏi: 🏠 Mỗi tầng nhà có 12 bậc cầu thang. Bé Bo đi từ tầng 1 lên tầng 4. Hỏi bé leo bao nhiêu bậc?
- Gợi ý: Từ tầng 1 lên tầng 4 chỉ đi qua 3 đoạn thang, nên số bậc = 3 × 12 = 36.
- Đáp án: **36**
- Các lựa chọn hiện ra: 34, 37, 36, 35

**Ví dụ 3**

- Nội dung câu hỏi: 🌳 Người ta trồng cây dọc một con đường dài 24 m, cây cách cây 4 m, trồng ở CẢ HAI đầu đường. Hỏi cần bao nhiêu cây?
- Gợi ý: Số khoảng cách = 24 : 4 = 6. Trồng cả 2 đầu nên số cây = số khoảng + 1 = 7.
- Đáp án: **7**
- Các lựa chọn hiện ra: 9, 6, 8, 7

### `back` — ↩️ Suy luận ngược

- **ID:** `back`
- **Chủ đề:** ↩️ Suy luận ngược
- **Hàm sinh:** `genBackwards()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🎩 Nhà ảo thuật nghĩ ra một số. Ông cộng thêm 7, rồi trừ đi 8 thì được 12. Hỏi số ban đầu là mấy?
- Gợi ý: Đi ngược lại: 12 + 8 = 20, rồi 20 − 7 = 13.
- Đáp án: **13**
- Các lựa chọn hiện ra: 13, 12, 11, 10

**Ví dụ 2**

- Nội dung câu hỏi: 🎩 Nhà ảo thuật nghĩ ra một số. Ông cộng thêm 4, rồi trừ đi 4 thì được 6. Hỏi số ban đầu là mấy?
- Gợi ý: Đi ngược lại: 6 + 4 = 10, rồi 10 − 4 = 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 4, 6, 7, 5

### `calen` — 📅 Lịch & thời gian

- **ID:** `calen`
- **Chủ đề:** 📅 Lịch & thời gian
- **Hàm sinh:** `genCalendar()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 📅 Hôm nay là Chủ nhật. Hỏi 8 ngày nữa là thứ mấy?
- Gợi ý: Cứ 7 ngày lại quay về thứ cũ. 8 : 7 dư 1, nên chỉ cần đếm tới 1 ngày sau Chủ nhật → Thứ hai.
- Đáp án: **Thứ hai**
- Các lựa chọn hiện ra: Thứ ba, Chủ nhật, Thứ bảy, Thứ hai

### `olymp` — 🏅 Olympic

- **ID:** `olymp`
- **Chủ đề:** 🏅 Olympic
- **Hàm sinh:** `genOlymp()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🌸 Đám bèo trên mặt hồ mỗi ngày lại RỘNG GẤP ĐÔI hôm trước. Đến ngày thứ 12 thì bèo phủ kín cả hồ. Hỏi ngày thứ mấy bèo phủ đúng NỬA hồ?
- Gợi ý: Suy nghĩ ngược: mỗi ngày bèo gấp đôi, vậy hôm TRƯỚC ngày kín hồ, bèo phủ đúng một nửa → ngày thứ 11.
- Đáp án: **11**
- Các lựa chọn hiện ra: 10, 12, 13, 11

### `cycle` — 🔗 Chuỗi lặp

- **ID:** `cycle`
- **Chủ đề:** 🔗 Chuỗi lặp
- **Hàm sinh:** `genCycle()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ 7 là hạt nào?
- Gợi ý: Chu kỳ có 2 hạt. 7 : 2 = 3 dư 1. Dư 1 nghĩa là giống hạt thứ 1 trong chu kỳ → 🐸.
- Đáp án: **🐸**
- Các lựa chọn hiện ra: 🐸, ⚫, 🐷, 🟡

### `eng` — 🔤 English

- **ID:** `eng`
- **Chủ đề:** 🔤 English
- **Hàm sinh:** `genEnglish()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🔤 A dog has 4 legs. How many legs do 5 dogs have? 🐶🐶🐶🐶🐶
- Gợi ý: Mỗi con có 4 chân ("legs"), có 5 con: 5 × 4 = 20.
- Đáp án: **20**
- Các lựa chọn hiện ra: 20, 22, 21, 19

**Ví dụ 2**

- Nội dung câu hỏi: 🔤 A cat has 4 legs. How many legs do 3 cats have? 🐱🐱🐱
- Gợi ý: Mỗi con có 4 chân ("legs"), có 3 con: 3 × 4 = 12.
- Đáp án: **12**
- Các lựa chọn hiện ra: 10, 12, 13, 11

**Ví dụ 3**

- Nội dung câu hỏi: 🔤 What number comes next? 6, 11, 16, 21, __?
- Gợi ý: Dãy tăng đều 5 đơn vị ("comes next" = số tiếp theo): 21 + 5 = 26.
- Đáp án: **26**
- Các lựa chọn hiện ra: 28, 27, 29, 26

### `big` — 💯 Số lớn

- **ID:** `big`
- **Chủ đề:** 💯 Số lớn
- **Hàm sinh:** `genBigNum()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 962 − 274 = ?
- Gợi ý: Đặt tính rồi trừ từ phải sang trái, nhớ "mượn" nếu không đủ: 962 − 274 = 688.
- Đáp án: **688**
- Các lựa chọn hiện ra: 688, 687, 686, 685

**Ví dụ 2**

- Nội dung câu hỏi: Tính nhanh: 29 + 431 + 71 = ?
- Gợi ý: Mẹo: ghép 29 + 71 = 100 trước, rồi 100 + 431 = 531. Tìm cặp số tròn trăm là tính siêu nhanh!
- Đáp án: **531**
- Các lựa chọn hiện ra: 531, 533, 532, 534

**Ví dụ 3**

- Nội dung câu hỏi: Tính nhanh: 73 + 251 + 27 = ?
- Gợi ý: Mẹo: ghép 73 + 27 = 100 trước, rồi 100 + 251 = 351. Tìm cặp số tròn trăm là tính siêu nhanh!
- Đáp án: **351**
- Các lựa chọn hiện ra: 348, 351, 349, 350

### `sasmo` — 🏅 SASMO

- **ID:** `sasmo`
- **Chủ đề:** 🏅 SASMO
- **Hàm sinh:** `genSasmo()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🎁 Hai bạn có tất cả 32 viên bi. Bạn An nhiều hơn bạn Bình 12 viên. Hỏi bạn AN có bao nhiêu viên bi?
- Gợi ý: Số LỚN = (tổng + hiệu) : 2 = (32 + 12) : 2 = 22. (Số bé là 10.)
- Đáp án: **22**
- Các lựa chọn hiện ra: 21, 22, 19, 20

**Ví dụ 2**

- Nội dung câu hỏi: ✂️ Một dải ruy băng dài 36 cm được cắt thành các đoạn dài 6 cm. Hỏi phải cắt bao nhiêu NHÁT kéo?
- Gợi ý: Số đoạn = 36 : 6 = 6. Số nhát cắt = số đoạn − 1 = 5 (nhát cuối không cần vì đã đứt rời).
- Đáp án: **5**
- Các lựa chọn hiện ra: 7, 6, 8, 5

**Ví dụ 3**

- Nội dung câu hỏi: 🎁 Hai bạn có tất cả 20 viên bi. Bạn An nhiều hơn bạn Bình 8 viên. Hỏi bạn AN có bao nhiêu viên bi?
- Gợi ý: Số LỚN = (tổng + hiệu) : 2 = (20 + 8) : 2 = 14. (Số bé là 6.)
- Đáp án: **14**
- Các lựa chọn hiện ra: 14, 17, 15, 16

### `imas` — 🌏 IMAS

- **ID:** `imas`
- **Chủ đề:** 🌏 IMAS
- **Hàm sinh:** `genImas()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 📊 3 bạn hái được lần lượt 12, 10, 5 bông hoa 🌸. Hỏi TRUNG BÌNH mỗi bạn hái được bao nhiêu bông?
- Gợi ý: Tổng = 12 + 10 + 5 = 27. Trung bình = 27 : 3 = 9 bông.
- Đáp án: **9**
- Các lựa chọn hiện ra: 7, 6, 9, 8

**Ví dụ 2**

- Nội dung câu hỏi: 🔢 Tính TỔNG các chữ số của số 671.
- Gợi ý: Cộng từng chữ số: 6 + 7 + 1 = 14.
- Đáp án: **14**
- Các lựa chọn hiện ra: 16, 15, 14, 17

**Ví dụ 3**

- Nội dung câu hỏi: 🧊 Một khối hộp được xếp bằng các khối lập phương nhỏ: dài 3 khối, rộng 3 khối, cao 2 khối. Hỏi có tất cả bao nhiêu khối lập phương nhỏ?
- Gợi ý: Mỗi tầng có 3 × 3 = 9 khối. Có 2 tầng: 9 × 2 = 18 khối.
- Đáp án: **18**
- Các lựa chọn hiện ra: 16, 17, 18, 15

### `amc` — 🎖️ AMC

- **ID:** `amc`
- **Chủ đề:** 🎖️ AMC
- **Hàm sinh:** `genAmc()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 💯 Lớp có 16 bạn, trong đó 25% số bạn đeo kính 👓. Hỏi có bao nhiêu bạn đeo kính?
- Gợi ý: 25% nghĩa là một phần tư: 16 : 4 = 4 bạn.
- Đáp án: **4**
- Các lựa chọn hiện ra: 3, 4, 1, 2

**Ví dụ 2**

- Nội dung câu hỏi: 💯 Lớp có 32 bạn, trong đó 25% số bạn đeo kính 👓. Hỏi có bao nhiêu bạn đeo kính?
- Gợi ý: 25% nghĩa là một phần tư: 32 : 4 = 8 bạn.
- Đáp án: **8**
- Các lựa chọn hiện ra: 8, 7, 6, 5

### `world` — 🌍 Kinh điển

- **ID:** `world`
- **Chủ đề:** 🌍 Kinh điển
- **Hàm sinh:** `genWorld()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 📅 Trong một nhóm bạn, muốn CHẮC CHẮN có ít nhất 2 bạn sinh cùng một THÁNG thì nhóm đó phải có ít nhất bao nhiêu người?
- Gợi ý: Một năm có 12 tháng. Nếu chỉ có 12 người thì có thể mỗi người một tháng khác nhau. Nhưng người thứ 13 bắt buộc phải trùng tháng với ai đó → cần ít nhất 13 người.
- Đáp án: **13**
- Các lựa chọn hiện ra: 13, 11, 12, 14

**Ví dụ 2**

- Nội dung câu hỏi: 🔔 Một chiếc đồng hồ đánh 5 tiếng chuông hết 12 giây. Hỏi nó đánh 8 tiếng chuông thì hết bao nhiêu giây?
- Gợi ý: Bẫy ở chỗ phải đếm KHOẢNG NGHỈ giữa các tiếng chứ không phải số tiếng! 5 tiếng có 4 khoảng, hết 12 giây → mỗi khoảng 12 : 4 = 3 giây. 8 tiếng có 7 khoảng → 7 × 3 = 21 giây.
- Đáp án: **21**
- Các lựa chọn hiện ra: 24, 22, 21, 23

**Ví dụ 3**

- Nội dung câu hỏi: 🔔 Một chiếc đồng hồ đánh 3 tiếng chuông hết 4 giây. Hỏi nó đánh 12 tiếng chuông thì hết bao nhiêu giây?
- Gợi ý: Bẫy ở chỗ phải đếm KHOẢNG NGHỈ giữa các tiếng chứ không phải số tiếng! 3 tiếng có 2 khoảng, hết 4 giây → mỗi khoảng 4 : 2 = 2 giây. 12 tiếng có 11 khoảng → 11 × 2 = 22 giây.
- Đáp án: **22**
- Các lựa chọn hiện ra: 22, 21, 23, 24

### `visual` — 🎨 Nhìn hình

- **ID:** `visual`
- **Chủ đề:** 🎨 Nhìn hình
- **Hàm sinh:** `genVisual()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🧊 Hình LẬP PHƯƠNG có bao nhiêu cạnh?
- Gợi ý: Hình lập phương giống viên xúc xắc: có 6 MẶT vuông, 12 CẠNH và 8 ĐỈNH (góc). Đáp án cạnh là 12.
- Đáp án: **12**
- Các lựa chọn hiện ra: 6, 12, 4, 8

### `numsense` — 🔟 Cảm nhận số

- **ID:** `numsense`
- **Chủ đề:** 🔟 Cảm nhận số
- **Hàm sinh:** `genNumSense()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 🧱 Kim tự tháp số: mỗi viên gạch bằng TỔNG hai viên ngay bên dưới nó. Số ở ô ❓ là mấy?
- Gợi ý: Hàng giữa: 8+7 = 15 và 7+7 = 14. Đỉnh tháp = 15 + 14 = 29.
- Đáp án: **29**
- Các lựa chọn hiện ra: 29, 28, 31, 30

**Ví dụ 2**

- Nội dung câu hỏi: 🏛️ Số La Mã XIV là số mấy? (I = 1, V = 5, X = 10, L = 50)
- Gợi ý: Quy tắc: chữ nhỏ đứng TRƯỚC chữ lớn thì TRỪ, đứng SAU thì CỘNG. XIV = 14.
- Đáp án: **14**
- Các lựa chọn hiện ra: 12, 11, 14, 13

### `chance` — 🎲 Xác suất

- **ID:** `chance`
- **Chủ đề:** 🎲 Xác suất
- **Hàm sinh:** `genChance()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: ⚽🏀 Lớp có 22 bạn: 14 bạn thích bóng đá, 9 bạn thích bóng rổ, trong đó 6 bạn thích CẢ HAI. Hỏi có bao nhiêu bạn KHÔNG thích môn nào?
- Gợi ý: Số bạn thích ít nhất một môn = 14 + 9 − 6 = 17 (phải trừ 6 vì các bạn thích cả hai đã bị đếm 2 lần). Vậy số bạn không thích môn nào = 22 − 17 = 5.
- Đáp án: **5**
- Các lựa chọn hiện ra: 3, 5, 6, 4

**Ví dụ 2**

- Nội dung câu hỏi: ⚽🏀 Lớp có 23 bạn: 10 bạn thích bóng đá, 14 bạn thích bóng rổ, trong đó 5 bạn thích CẢ HAI. Hỏi có bao nhiêu bạn KHÔNG thích môn nào?
- Gợi ý: Số bạn thích ít nhất một môn = 10 + 14 − 5 = 19 (phải trừ 5 vì các bạn thích cả hai đã bị đếm 2 lần). Vậy số bạn không thích môn nào = 23 − 19 = 4.
- Đáp án: **4**
- Các lựa chọn hiện ra: 5, 7, 4, 6

### `unit` — 📏 Đổi đơn vị

- **ID:** `unit`
- **Chủ đề:** 📏 Đổi đơn vị
- **Hàm sinh:** `genUnit()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 📏 Đổi: 240 giây = ? phút
- Gợi ý: 60 giây = 1 phút, nên 240 giây = 240 : 60 = 4 phút.
- Đáp án: **4**
- Các lựa chọn hiện ra: 3, 1, 2, 4

### `brain` — 💎 Thử thách mới

- **ID:** `brain`
- **Chủ đề:** 💎 Thử thách mới
- **Hàm sinh:** `genBrainChallenge()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1**

- Nội dung câu hỏi: 💎 Xếp 7 hình vuông bằng nhau thành MỘT HÀNG, hai hình cạnh nhau dùng chung một cạnh. Cần tất cả bao nhiêu que diêm?
- Gợi ý: Hình đầu cần 4 que. Mỗi hình tiếp theo dùng chung 1 cạnh nên chỉ thêm 3 que. Tổng = 4 + 6×3 = 22 que.
- Đáp án: **22**
- Các lựa chọn hiện ra: 22, 21, 23, 20

**Ví dụ 2**

- Nội dung câu hỏi: 💎 Xếp 9 hình vuông bằng nhau thành MỘT HÀNG, hai hình cạnh nhau dùng chung một cạnh. Cần tất cả bao nhiêu que diêm?
- Gợi ý: Hình đầu cần 4 que. Mỗi hình tiếp theo dùng chung 1 cạnh nên chỉ thêm 3 que. Tổng = 4 + 8×3 = 28 que.
- Đáp án: **28**
- Các lựa chọn hiện ra: 29, 27, 26, 28

### `singapore` — 🇸🇬 Singapore lớp 3

- **ID:** `singapore`
- **Chủ đề:** 🇸🇬 Singapore lớp 3
- **Hàm sinh:** `genSingapore3()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 2

**Ví dụ 1 (sgKind: `seriesCount`)**

- Nội dung câu hỏi: Dãy 6, 10, 14, …, 50 có bao nhiêu số hạng?
- Gợi ý: Số khoảng cách = (50−6):4 = 11. Số số hạng = số khoảng + 1 = 12.
- Đáp án: **12**
- Các lựa chọn hiện ra: 14, 15, 12, 13

**Ví dụ 2 (sgKind: `leapCalendar`)**

- Nội dung câu hỏi: Ngày 1 tháng 3 của một năm nhuận là Thứ Ba. Hỏi ngày 1 tháng 6 cùng năm đó là thứ mấy?
- Gợi ý: Từ 1/3 đến 1/6 có 31+30+31 = 92 ngày. 92 chia 7 dư 1, nên sau Thứ Ba một ngày là Thứ Tư. Ngày 29/2 không còn nằm trong quãng đang đếm.
- Đáp án: **Thứ tư**
- Các lựa chọn hiện ra: Thứ ba, Thứ năm, Thứ hai, Chủ nhật, Thứ tư

**Ví dụ 3 (sgKind: `snailWell`)**

- Nội dung câu hỏi: Ốc sên ở đáy giếng sâu 10 m. Ban ngày bò lên 3 m, ban đêm tụt 2 m. Sau bao nhiêu ngày ốc sên lên tới miệng giếng?
- Gợi ý: Sau mỗi ngày–đêm trọn vẹn, ốc tăng 1 m. Sau 7 đêm ốc ở độ cao 7 m; ban ngày thứ 8 bò thêm 3 m tới miệng giếng và thoát ngay, không bị tụt nữa. Vậy cần 8 ngày.
- Đáp án: **8**
- Các lựa chọn hiện ra: 8, 10, 9, 11

