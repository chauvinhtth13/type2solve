# Ngân hàng câu hỏi — Khối 1 (tier 1 trong code)

> **Tài liệu tra cứu, không phải dữ liệu game đọc lúc chạy.** Đấu Trường Tư Duy sinh
> câu hỏi ngẫu nhiên bằng công thức trong `assets/js/question-bank.js`, không đọc từ file
> này. Các ví dụ dưới đây là **kết quả thật** lấy trực tiếp từ `genQuestion(1)` lúc
> game chạy trong trình duyệt (không phải tự bịa) — dùng để bạn xem/kiểm tra/mở rộng công
> thức sinh câu hỏi, đổi nội dung ở đây **không** làm game đổi theo.
>
> ⚠️ Mức khởi động — số nhỏ, thao tác đơn giản, phù hợp học sinh mới làm quen phép cộng/trừ (khoảng lớp 1).

## Danh sách dạng câu hỏi (20 dạng)

| ID | Chủ đề | Hàm sinh |
|---|---|---|
| `arith` | 🧮 Tính nhanh | `genArith()` |
| `compare` | ⚖️ So sánh | `genCompare()` |
| `seq` | 🔢 Quy luật | `genSeq()` |
| `geo` | 📐 Hình học | `genGeo()` |
| `word` | 📖 Toán đố | `genWord()` |
| `eq` | 🍎 Cân bằng | `genEmojiEq()` |
| `count` | 🌳 Đếm thông minh | `genSmartCount()` |
| `logic` | 🧠 Tư duy | `genLogic()` |
| `olymp` | 🏅 Olympic | `genOlymp()` |
| `cycle` | 🔗 Chuỗi lặp | `genCycle()` |
| `eng` | 🔤 English | `genEnglish()` |
| `sasmo` | 🏅 SASMO | `genSasmo()` |
| `imas` | 🌏 IMAS | `genImas()` |
| `amc` | 🎖️ AMC | `genAmc()` |
| `world` | 🌍 Kinh điển | `genWorld()` |
| `visual` | 🎨 Nhìn hình | `genVisual()` |
| `numsense` | 🔟 Cảm nhận số | `genNumSense()` |
| `chance` | 🎲 Xác suất | `genChance()` |
| `brain` | 💎 Thử thách mới | `genBrainChallenge()` |
| `singapore` | 🇸🇬 Singapore lớp 3 | `genSingapore3()` |

## Chi tiết từng dạng

### `arith` — 🧮 Tính nhanh

- **ID:** `arith`
- **Chủ đề:** 🧮 Tính nhanh
- **Hàm sinh:** `genArith()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 7 + 5 = ?
- Gợi ý: Đếm thêm 5 từ 7: được 12.
- Đáp án: **12**
- Các lựa chọn hiện ra: 15, 13, 14, 12

**Ví dụ 2**

- Nội dung câu hỏi: 11 + 6 = ?
- Gợi ý: Đếm thêm 6 từ 11: được 17.
- Đáp án: **17**
- Các lựa chọn hiện ra: 17, 16, 15, 18

**Ví dụ 3**

- Nội dung câu hỏi: 8 − 4 = ?
- Gợi ý: Bớt 4 từ 8: còn 4.
- Đáp án: **4**
- Các lựa chọn hiện ra: 3, 4, 2, 1

### `compare` — ⚖️ So sánh

- **ID:** `compare`
- **Chủ đề:** ⚖️ So sánh
- **Hàm sinh:** `genCompare()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: Điền dấu:  6 × 8 🔲 6 × 9
- Gợi ý: 6×8 = 48 và 6×9 = 54. Vì 48 < 54 nên điền dấu "<".
- Đáp án: **<**
- Các lựa chọn hiện ra: >, <, =

### `seq` — 🔢 Quy luật

- **ID:** `seq`
- **Chủ đề:** 🔢 Quy luật
- **Hàm sinh:** `genSeq()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: Quy luật gì nhỉ? 3, 6, 9, 12, ❓
- Gợi ý: Mỗi số tăng thêm 3: 12 + 3 = 15.
- Đáp án: **15**
- Các lựa chọn hiện ra: 13, 14, 16, 15

### `geo` — 📐 Hình học

- **ID:** `geo`
- **Chủ đề:** 📐 Hình học
- **Hàm sinh:** `genGeo()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: Đếm xem có bao nhiêu hình tam giác 🔺?
- Gợi ý: Chỉ đếm 🔺, bỏ qua các hình khác — có đúng 4 hình tam giác.
- Đáp án: **4**
- Các lựa chọn hiện ra: 6, 4, 5, 3

**Ví dụ 2**

- Nội dung câu hỏi: Đếm xem có bao nhiêu hình vuông 🟩?
- Gợi ý: Chỉ đếm 🟩, bỏ qua các hình khác — có đúng 6 hình vuông.
- Đáp án: **6**
- Các lựa chọn hiện ra: 8, 6, 9, 7

**Ví dụ 3**

- Nội dung câu hỏi: Đếm xem có bao nhiêu ngôi sao ⭐?
- Gợi ý: Chỉ đếm ⭐, bỏ qua các hình khác — có đúng 4 ngôi sao.
- Đáp án: **4**
- Các lựa chọn hiện ra: 6, 7, 4, 5

### `word` — 📖 Toán đố

- **ID:** `word`
- **Chủ đề:** 📖 Toán đố
- **Hàm sinh:** `genWord()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🍎 Na có 8 quả táo. Mẹ cho thêm 8 quả táo, rồi Na tặng bạn 5 quả táo. Hỏi Na còn bao nhiêu quả táo?
- Gợi ý: 8 + 8 = 16, rồi tặng đi 5 còn: 16 − 5 = 11.
- Đáp án: **11**
- Các lựa chọn hiện ra: 11, 12, 13, 14

**Ví dụ 2**

- Nội dung câu hỏi: 🍬 Lan có 3 viên kẹo. Mẹ cho thêm 2 viên kẹo, rồi Lan tặng bạn 3 viên kẹo. Hỏi Lan còn bao nhiêu viên kẹo?
- Gợi ý: 3 + 2 = 5, rồi tặng đi 3 còn: 5 − 3 = 2.
- Đáp án: **2**
- Các lựa chọn hiện ra: 3, 0, 1, 2

### `eq` — 🍎 Cân bằng

- **ID:** `eq`
- **Chủ đề:** 🍎 Cân bằng
- **Hàm sinh:** `genEmojiEq()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: Mỗi loại quả là một số. Hỏi 🍊 = ?
- Gợi ý: 🍌 + 🍌 = 6 nên 🍌 = 3. Vậy 🍊 = 4 − 3 = 1.
- Đáp án: **1**
- Các lựa chọn hiện ra: 3, 1, 0, 2

### `count` — 🌳 Đếm thông minh

- **ID:** `count`
- **Chủ đề:** 🌳 Đếm thông minh
- **Hàm sinh:** `genSmartCount()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🌳 Người ta trồng cây dọc một con đường dài 20 m, cây cách cây 4 m, trồng ở CẢ HAI đầu đường. Hỏi cần bao nhiêu cây?
- Gợi ý: Số khoảng cách = 20 : 4 = 5. Trồng cả 2 đầu nên số cây = số khoảng + 1 = 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 4, 6, 3, 5

### `logic` — 🧠 Tư duy

- **ID:** `logic`
- **Chủ đề:** 🧠 Tư duy
- **Hàm sinh:** `genLogic()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `olymp` — 🏅 Olympic

- **ID:** `olymp`
- **Chủ đề:** 🏅 Olympic
- **Hàm sinh:** `genOlymp()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 📖 Bé đọc truyện từ trang 16 đến hết trang 21. Hỏi bé đã đọc được bao nhiêu trang?
- Gợi ý: Số trang = trang cuối − trang đầu + 1 = 21 − 16 + 1 = 6. (Phải +1 vì đọc cả trang đầu!)
- Đáp án: **6**
- Các lựa chọn hiện ra: 7, 6, 5, 8

**Ví dụ 2**

- Nội dung câu hỏi: 🧮 Tính nhanh: 1 + 2 + 3 + ... + 10 = ?
- Gợi ý: Mẹo Gauss: ghép số đầu với số cuối: 1+10 = 11, 2+9 = 11... Có 10 số tạo thành 5 cặp, mỗi cặp bằng 11. Kết quả: 55.
- Đáp án: **55**
- Các lựa chọn hiện ra: 56, 55, 54, 57

**Ví dụ 3**

- Nội dung câu hỏi: 🐔🐄 Trong sân có gà và bò. Đếm được 5 cái ĐẦU và 16 cái CHÂN. Hỏi có bao nhiêu con GÀ?
- Gợi ý: Giả sử cả 5 con đều là bò thì có 20 chân — thừa 4 chân. Mỗi con gà ít hơn bò 2 chân, nên số gà = 4 : 2 = 2.
- Đáp án: **2**
- Các lựa chọn hiện ra: 3, 5, 4, 2

### `cycle` — 🔗 Chuỗi lặp

- **ID:** `cycle`
- **Chủ đề:** 🔗 Chuỗi lặp
- **Hàm sinh:** `genCycle()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ 14 là hạt nào?
- Gợi ý: Chu kỳ có 3 hạt. 14 : 3 = 4 dư 2. Dư 2 nghĩa là giống hạt thứ 2 trong chu kỳ → 🔵.
- Đáp án: **🔵**
- Các lựa chọn hiện ra: 🔵, 🔴, 🟡, ⚫

**Ví dụ 2**

- Nội dung câu hỏi: 🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ 15 là hạt nào?
- Gợi ý: Chu kỳ có 6 hạt. 15 : 6 = 2 dư 3. Dư 3 nghĩa là giống hạt thứ 3 trong chu kỳ → 🔶.
- Đáp án: **🔶**
- Các lựa chọn hiện ra: ⚫, 🔶, ⭐, 🟡

**Ví dụ 3**

- Nội dung câu hỏi: 🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ 13 là hạt nào?
- Gợi ý: Chu kỳ có 4 hạt. 13 : 4 = 3 dư 1. Dư 1 nghĩa là giống hạt thứ 1 trong chu kỳ → 🍎.
- Đáp án: **🍎**
- Các lựa chọn hiện ra: 🍎, 🍊, 🟡, 🍌

### `eng` — 🔤 English

- **ID:** `eng`
- **Chủ đề:** 🔤 English
- **Hàm sinh:** `genEnglish()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🔤 What is 10 plus 15?
- Gợi ý: "Plus" nghĩa là CỘNG: 10 + 15 = 25.
- Đáp án: **25**
- Các lựa chọn hiện ra: 25, 27, 26, 24

**Ví dụ 2**

- Nội dung câu hỏi: 🔤 A chicken has 2 legs. How many legs do 2 chickens have? 🐔🐔
- Gợi ý: Mỗi con có 2 chân ("legs"), có 2 con: 2 × 2 = 4.
- Đáp án: **4**
- Các lựa chọn hiện ra: 4, 2, 1, 3

**Ví dụ 3**

- Nội dung câu hỏi: 🔤 What number comes next? 3, 8, 13, 18, __?
- Gợi ý: Dãy tăng đều 5 đơn vị ("comes next" = số tiếp theo): 18 + 5 = 23.
- Đáp án: **23**
- Các lựa chọn hiện ra: 23, 21, 24, 22

### `sasmo` — 🏅 SASMO

- **ID:** `sasmo`
- **Chủ đề:** 🏅 SASMO
- **Hàm sinh:** `genSasmo()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🏷️ Một tờ tem loại A giá 3 nghìn, tem loại B giá 2 nghìn. Bé mua 3 tem A và 4 tem B. Hỏi bé trả tất cả bao nhiêu nghìn?
- Gợi ý: Tem A: 3 × 3 = 9 nghìn. Tem B: 4 × 2 = 8 nghìn. Tổng: 9 + 8 = 17 nghìn.
- Đáp án: **17**
- Các lựa chọn hiện ra: 15, 14, 17, 16

### `imas` — 🌏 IMAS

- **ID:** `imas`
- **Chủ đề:** 🌏 IMAS
- **Hàm sinh:** `genImas()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🔷 Hình thứ 1 có 3 chấm, hình thứ 2 có 7 chấm, hình thứ 3 có 11 chấm... (mỗi hình thêm 4 chấm). Hỏi hình thứ 6 có bao nhiêu chấm?
- Gợi ý: Từ hình 1 đến hình 6 tăng 5 lần, mỗi lần 4 chấm: 3 + 5×4 = 23 chấm.
- Đáp án: **23**
- Các lựa chọn hiện ra: 24, 22, 25, 23

### `amc` — 🎖️ AMC

- **ID:** `amc`
- **Chủ đề:** 🎖️ AMC
- **Hàm sinh:** `genAmc()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🧠 26 là số CHẴN, 15 là số LẺ. Tính 26 + 15 = ?
- Gợi ý: 26 + 15 = 41 — kết quả là số LẺ. Ghi nhớ: chẵn + lẻ = LẺ, còn chẵn × lẻ = CHẴN.
- Đáp án: **41**
- Các lựa chọn hiện ra: 44, 42, 41, 43

**Ví dụ 2**

- Nội dung câu hỏi: 💵 Bé mua đồ chơi hết 42 nghìn đồng và đưa cho cô bán hàng tờ 100 nghìn. Hỏi cô trả lại bé bao nhiêu nghìn đồng?
- Gợi ý: Tiền thừa = 100 − 42 = 58 nghìn đồng.
- Đáp án: **58**
- Các lựa chọn hiện ra: 59, 57, 58, 56

**Ví dụ 3**

- Nội dung câu hỏi: 🧠 16 là số CHẴN, 21 là số LẺ. Tính 16 × 21 = ?
- Gợi ý: 16 × 21 = 336 — kết quả là số CHẴN. Ghi nhớ: chẵn + lẻ = LẺ, còn chẵn × lẻ = CHẴN.
- Đáp án: **336**
- Các lựa chọn hiện ra: 335, 334, 336, 337

### `world` — 🌍 Kinh điển

- **ID:** `world`
- **Chủ đề:** 🌍 Kinh điển
- **Hàm sinh:** `genWorld()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🚣 Bác nông dân cần đưa một con SÓI, một con DÊ và một cây BẮP CẢI qua sông. Thuyền nhỏ, mỗi lần bác chỉ chở được 1 thứ. Nếu để sói ở lại với dê thì sói ăn dê; để dê ở lại với bắp cải thì dê ăn bắp cải. Hỏi bác phải chèo qua sông ít nhất mấy LƯỢT?
- Gợi ý: Cách làm: đưa DÊ qua (1), quay về (2), đưa SÓI qua (3), chở DÊ về lại (4), đưa BẮP CẢI qua (5), quay về (6), đưa DÊ qua lần nữa (7). Mẹo mấu chốt là được phép CHỞ NGƯỢC con dê về!
- Đáp án: **7**
- Các lựa chọn hiện ra: 7, 5, 6, 9

**Ví dụ 2**

- Nội dung câu hỏi: 🔔 Một chiếc đồng hồ đánh 5 tiếng chuông hết 12 giây. Hỏi nó đánh 8 tiếng chuông thì hết bao nhiêu giây?
- Gợi ý: Bẫy ở chỗ phải đếm KHOẢNG NGHỈ giữa các tiếng chứ không phải số tiếng! 5 tiếng có 4 khoảng, hết 12 giây → mỗi khoảng 12 : 4 = 3 giây. 8 tiếng có 7 khoảng → 7 × 3 = 21 giây.
- Đáp án: **21**
- Các lựa chọn hiện ra: 21, 20, 19, 18

**Ví dụ 3**

- Nội dung câu hỏi: ⚖️ Có 3 đồng xu trông y hệt nhau, trong đó 1 đồng GIẢ nhẹ hơn. Em có một chiếc cân thăng bằng (loại 2 đĩa). Hỏi cần cân ít nhất mấy LẦN để chắc chắn tìm ra đồng giả?
- Gợi ý: Chia 3 đồng thành 3 nhóm 1 đồng. Đặt 2 đồng lên 2 đĩa: nếu lệch thì bên nhẹ là đồng giả, nếu cân bằng thì đồng còn lại là giả. Chỉ cần 1 lần cân!
- Đáp án: **1**
- Các lựa chọn hiện ra: 0, 2, 3, 1

### `visual` — 🎨 Nhìn hình

- **ID:** `visual`
- **Chủ đề:** 🎨 Nhìn hình
- **Hàm sinh:** `genVisual()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🎲 Trên con xúc xắc, tổng số chấm của HAI MẶT ĐỐI DIỆN luôn bằng 7. Hỏi mặt đối diện với mặt 1 chấm có mấy chấm?
- Gợi ý: Hai mặt đối diện cộng lại bằng 7, nên mặt đối diện với 1 là 7 − 1 = 6 chấm.
- Đáp án: **6**
- Các lựa chọn hiện ra: 7, 5, 8, 6

**Ví dụ 2**

- Nội dung câu hỏi: 🪞 Hình TRÒN ⚪ có bao nhiêu TRỤC ĐỐI XỨNG (đường gấp đôi lại thì hai nửa trùng khít)?
- Gợi ý: Bất kỳ đường thẳng nào đi qua TÂM hình tròn cũng chia nó thành 2 nửa trùng khít. Vẽ được vô số đường như vậy nên hình tròn có VÔ SỐ trục đối xứng.
- Đáp án: **Vô số**
- Các lựa chọn hiện ra: 4, 2, Vô số, 1

**Ví dụ 3**

- Nội dung câu hỏi: 🎲 Trên con xúc xắc, tổng số chấm của HAI MẶT ĐỐI DIỆN luôn bằng 7. Hỏi mặt đối diện với mặt 5 chấm có mấy chấm?
- Gợi ý: Hai mặt đối diện cộng lại bằng 7, nên mặt đối diện với 5 là 7 − 5 = 2 chấm.
- Đáp án: **2**
- Các lựa chọn hiện ra: 3, 5, 2, 4

### `numsense` — 🔟 Cảm nhận số

- **ID:** `numsense`
- **Chủ đề:** 🔟 Cảm nhận số
- **Hàm sinh:** `genNumSense()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🧱 Kim tự tháp số: mỗi viên gạch bằng TỔNG hai viên ngay bên dưới nó. Số ở ô ❓ là mấy?
- Gợi ý: Hàng giữa: 9+8 = 17 và 8+7 = 15. Đỉnh tháp = 17 + 15 = 32.
- Đáp án: **32**
- Các lựa chọn hiện ra: 29, 32, 30, 31

**Ví dụ 2**

- Nội dung câu hỏi: 🏛️ Số La Mã IV là số mấy? (I = 1, V = 5, X = 10, L = 50)
- Gợi ý: Quy tắc: chữ nhỏ đứng TRƯỚC chữ lớn thì TRỪ, đứng SAU thì CỘNG. IV = 4.
- Đáp án: **4**
- Các lựa chọn hiện ra: 6, 4, 5, 7

### `chance` — 🎲 Xác suất

- **ID:** `chance`
- **Chủ đề:** 🎲 Xác suất
- **Hàm sinh:** `genChance()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 🔴🔵 Túi có 7 viên bi đỏ và 7 viên bi xanh. Nhắm mắt lấy ra ít nhất mấy viên để CHẮC CHẮN có 1 viên bi ĐỎ?
- Gợi ý: Xui nhất là lấy trúng cả 7 viên xanh trước. Viên tiếp theo bắt buộc phải là bi đỏ → cần lấy 7 + 1 = 8 viên.
- Đáp án: **8**
- Các lựa chọn hiện ra: 9, 6, 8, 7

### `brain` — 💎 Thử thách mới

- **ID:** `brain`
- **Chủ đề:** 💎 Thử thách mới
- **Hàm sinh:** `genBrainChallenge()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1**

- Nội dung câu hỏi: 💎 Tìm số tiếp theo: 2, 5, 10, 17, 26, ❓
- Gợi ý: Hiệu giữa hai số liên tiếp là các số lẻ tăng dần: +3, +5, +7, +9; bước tiếp theo là +11. Vậy 26 + 11 = 37.
- Đáp án: **37**
- Các lựa chọn hiện ra: 36, 38, 39, 37

**Ví dụ 2**

- Nội dung câu hỏi: 💎 Từ 1 đến 29 (kể cả 1 và 29) có bao nhiêu số LẺ?
- Gợi ý: Các số lẻ là 1, 3, 5, …, 29. Mỗi số lẻ có dạng 2×k+1 với k từ 0 đến 14, nên có 15 số.
- Đáp án: **15**
- Các lựa chọn hiện ra: 15, 16, 18, 17

**Ví dụ 3**

- Nội dung câu hỏi: 💎 Hai thẻ số có tổng bằng 18. Một thẻ ghi 14. Nếu TĂNG số trên thẻ còn lại thêm 2 đơn vị thì thẻ đó ghi số nào?
- Gợi ý: Thẻ còn lại ban đầu là 18 − 14 = 4. Tăng thêm 2 đơn vị được 4 + 2 = 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 6, 3, 4, 5

### `singapore` — 🇸🇬 Singapore lớp 3

- **ID:** `singapore`
- **Chủ đề:** 🇸🇬 Singapore lớp 3
- **Hàm sinh:** `genSingapore3()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 1

**Ví dụ 1 (sgKind: `lineTreesBothEnds`)**

- Nội dung câu hỏi: Một đoạn đường dài 32 m, cứ 4 m trồng một cây và CẢ HAI đầu đều có cây. Cần bao nhiêu cây?
- Gợi ý: Có 32:4 = 8 khoảng cách. Trên đoạn thẳng có cây ở cả hai đầu, số cây = số khoảng + 1 = 9.
- Đáp án: **9**
- Các lựa chọn hiện ra: 7, 8, 9, 10

**Ví dụ 2 (sgKind: `lineTreeSpacing`)**

- Nội dung câu hỏi: Trên đoạn đường dài 12 m có 7 cây cách đều, cả hai đầu đều trồng cây. Hai cây liền nhau cách bao nhiêu mét?
- Gợi ý: 7 cây tạo 6 khoảng cách. Mỗi khoảng dài 12:6 = 2 m.
- Đáp án: **2**
- Các lựa chọn hiện ra: 0, 2, 1, 3

**Ví dụ 3 (sgKind: `matchstickTerm`)**

- Nội dung câu hỏi: Một dãy hình lần lượt dùng 1, 4, 7, 10, … que diêm. Hình thứ 8 cần bao nhiêu que?
- Gợi ý: Mỗi hình sau thêm 3 que. Hình thứ n dùng 1+(n−1)×3 que. Hình thứ 8 dùng 1+7×3 = 22 que.
- Đáp án: **22**
- Các lựa chọn hiện ra: 25, 22, 23, 24

