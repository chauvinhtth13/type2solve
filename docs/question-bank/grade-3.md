# Ngân hàng câu hỏi — Khối 3 (tier 3 trong code)

> **Tài liệu tra cứu, không phải dữ liệu game đọc lúc chạy.** Đấu Trường Tư Duy sinh
> câu hỏi ngẫu nhiên bằng công thức trong `src/scripts/games/adventure/questions.js`, không đọc từ file
> này. Các ví dụ dưới đây là **kết quả thật** lấy trực tiếp từ `genQuestion(3)` lúc
> game chạy trong trình duyệt (không phải tự bịa) — dùng để bạn xem/kiểm tra/mở rộng công
> thức sinh câu hỏi, đổi nội dung ở đây **không** làm game đổi theo.
>
> ⚠️ Mức cao thủ — thêm suy luận ngược, đếm cách chọn, lịch/thời gian, số lớn (khoảng lớp 3–4).

## Danh sách dạng câu hỏi (28 dạng)

| ID | Chủ đề | Hàm sinh |
|---|---|---|
| `missing` | ❓ Tìm số | `genMissing()` |
| `word` | 📖 Toán đố | `genWord()` |
| `geo` | 📐 Hình học | `genGeo()` |
| `seq` | 🔢 Quy luật | `genSeq()` |
| `logic` | 🧠 Tư duy | `genLogic()` |
| `eq` | 🍎 Cân bằng | `genEmojiEq()` |
| `magic` | 🔮 Ô số ma thuật | `genMagic()` |
| `back` | ↩️ Suy luận ngược | `genBackwards()` |
| `count` | 🌳 Đếm thông minh | `genSmartCount()` |
| `combi` | 🤝 Đếm cách | `genCombi()` |
| `calen` | 📅 Lịch & thời gian | `genCalendar()` |
| `arith` | 🧮 Tính nhanh | `genArith()` |
| `olymp` | 🏅 Olympic | `genOlymp()` |
| `cycle` | 🔗 Chuỗi lặp | `genCycle()` |
| `eng` | 🔤 English | `genEnglish()` |
| `big` | 💯 Số lớn | `genBigNum()` |
| `sasmo` | 🏅 SASMO | `genSasmo()` |
| `imas` | 🌏 IMAS | `genImas()` |
| `amc` | 🎖️ AMC | `genAmc()` |
| `tdn` | 🎓 Trường chuyên | `genTDN()` |
| `world` | 🌍 Kinh điển | `genWorld()` |
| `visual` | 🎨 Nhìn hình | `genVisual()` |
| `numsense` | 🔟 Cảm nhận số | `genNumSense()` |
| `chance` | 🎲 Xác suất | `genChance()` |
| `unit` | 📏 Đổi đơn vị | `genUnit()` |
| `bar` | 📊 Tổng-Tỉ/Hiệu-Tỉ | `genSumRatio()` |
| `brain` | 💎 Thử thách mới | `genBrainChallenge()` |
| `singapore` | 🇸🇬 Singapore lớp 3 | `genSingapore3()` |

## Chi tiết từng dạng

### `missing` — ❓ Tìm số

- **ID:** `missing`
- **Chủ đề:** ❓ Tìm số
- **Hàm sinh:** `genMissing()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 4 × ❓ = 24
- Gợi ý: ❓ = 24 : 4 = 6. (Muốn tìm thừa số, lấy tích chia thừa số kia.)
- Đáp án: **6**
- Các lựa chọn hiện ra: 7, 8, 5, 6, 9

**Ví dụ 2**

- Nội dung câu hỏi: 4 × ❓ = 16
- Gợi ý: ❓ = 16 : 4 = 4. (Muốn tìm thừa số, lấy tích chia thừa số kia.)
- Đáp án: **4**
- Các lựa chọn hiện ra: 5, 4, 3, 1, 2

**Ví dụ 3**

- Nội dung câu hỏi: 5 × 9 + ❓ = 58
- Gợi ý: 5×9 = 45, nên ❓ = 58 − 45 = 13.
- Đáp án: **13**
- Các lựa chọn hiện ra: 13, 14, 11, 15, 12

### `word` — 📖 Toán đố

- **ID:** `word`
- **Chủ đề:** 📖 Toán đố
- **Hàm sinh:** `genWord()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🍎 Cô giáo có 42 quả táo, chia đều cho 9 bạn, mỗi bạn được nhiều nhất có thể. Hỏi còn THỪA mấy quả táo?
- Gợi ý: 42 : 9 = 4 dư 6. Mỗi bạn được 4, còn thừa 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 6, 5, 7, 4, 8

**Ví dụ 2**

- Nội dung câu hỏi: 🌸 Một cửa hàng có 36 bông hoa. Buổi sáng bán MỘT NỬA, buổi chiều bán MỘT NỬA số còn lại. Hỏi cuối ngày còn bao nhiêu bông hoa?
- Gợi ý: Sáng bán còn 36:2 = 18. Chiều bán nửa số đó còn 18:2 = 9.
- Đáp án: **9**
- Các lựa chọn hiện ra: 8, 9, 11, 10, 7

### `geo` — 📐 Hình học

- **ID:** `geo`
- **Chủ đề:** 📐 Hình học
- **Hàm sinh:** `genGeo()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🔥 Xếp 2 hình vuông thành một HÀNG NGANG bằng que diêm (các hình vuông kề nhau dùng chung 1 que). Hỏi cần tất cả bao nhiêu que diêm?
- Gợi ý: Hình vuông đầu cần 4 que, mỗi hình sau chỉ cần thêm 3 que (dùng chung 1 cạnh): 4 + 3×1 = 7.
- Đáp án: **7**
- Các lựa chọn hiện ra: 5, 7, 6, 4, 8

**Ví dụ 2**

- Nội dung câu hỏi: 🔥 Xếp 2 hình vuông thành một HÀNG NGANG bằng que diêm (các hình vuông kề nhau dùng chung 1 que). Hỏi cần tất cả bao nhiêu que diêm?
- Gợi ý: Hình vuông đầu cần 4 que, mỗi hình sau chỉ cần thêm 3 que (dùng chung 1 cạnh): 4 + 3×1 = 7.
- Đáp án: **7**
- Các lựa chọn hiện ra: 4, 6, 7, 1, 5

### `seq` — 🔢 Quy luật

- **ID:** `seq`
- **Chủ đề:** 🔢 Quy luật
- **Hàm sinh:** `genSeq()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: Quy luật gì nhỉ? 2, 3, 5, 8, 12, 17, ❓
- Gợi ý: Hiệu giữa hai số liền kề tăng dần: +1, +2, +3, +4, +5, rồi tiếp theo +6. Vậy 17 + 6 = 23.
- Đáp án: **23**
- Các lựa chọn hiện ra: 22, 24, 21, 23, 25

### `logic` — 🧠 Tư duy

- **ID:** `logic`
- **Chủ đề:** 🧠 Tư duy
- **Hàm sinh:** `genLogic()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🧠 Số bí ẩn: gấp 3 liên tục 2 → 6 → 18 → ❓
- Gợi ý: Mỗi lần nhân 3: 18 × 3 = 54.
- Đáp án: **54**
- Các lựa chọn hiện ra: 56, 53, 55, 52, 54

**Ví dụ 2**

- Nội dung câu hỏi: 🦆 Một đàn vịt đi hàng dọc: có 6 con đi TRƯỚC 1 con, và 6 con đi SAU 1 con. Hỏi đàn vịt có ít nhất mấy con?
- Gợi ý: Chỉ cần 7 con đi hàng dọc: con CUỐI có 6 con đi trước, con ĐẦU có 6 con đi sau. Vậy ít nhất 7 con.
- Đáp án: **7**
- Các lựa chọn hiện ra: 5, 4, 6, 3, 7

**Ví dụ 3**

- Nội dung câu hỏi: 🧠 Số nào KHÁC quy luật với các số còn lại? 27, 32, 28, 12
- Gợi ý: 12, 28, 32 đều chia hết cho 4 (nằm trong bảng nhân 4), riêng 27 thì không: 27 : 4 còn dư.
- Đáp án: **27**
- Các lựa chọn hiện ra: 32, 28, 27, 12

### `eq` — 🍎 Cân bằng

- **ID:** `eq`
- **Chủ đề:** 🍎 Cân bằng
- **Hàm sinh:** `genEmojiEq()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `magic` — 🔮 Ô số ma thuật

- **ID:** `magic`
- **Chủ đề:** 🔮 Ô số ma thuật
- **Hàm sinh:** `genMagic()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `back` — ↩️ Suy luận ngược

- **ID:** `back`
- **Chủ đề:** ↩️ Suy luận ngược
- **Hàm sinh:** `genBackwards()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🎩 Nhà ảo thuật nghĩ ra một số. Ông nhân số đó với 3, rồi cộng thêm 2 thì được 20. Hỏi số ban đầu là mấy?
- Gợi ý: Đi ngược lại: 20 − 2 = 18, rồi 18 : 3 = 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 5, 3, 6, 4, 0

**Ví dụ 2**

- Nội dung câu hỏi: 🎩 Nhà ảo thuật nghĩ ra một số. Ông nhân số đó với 2, rồi cộng thêm 8 thì được 22. Hỏi số ban đầu là mấy?
- Gợi ý: Đi ngược lại: 22 − 8 = 14, rồi 14 : 2 = 7.
- Đáp án: **7**
- Các lựa chọn hiện ra: 4, 5, 1, 7, 6

**Ví dụ 3**

- Nội dung câu hỏi: 🎩 Nhà ảo thuật nghĩ ra một số. Ông nhân số đó với 3, rồi cộng thêm 10 thì được 37. Hỏi số ban đầu là mấy?
- Gợi ý: Đi ngược lại: 37 − 10 = 27, rồi 27 : 3 = 9.
- Đáp án: **9**
- Các lựa chọn hiện ra: 9, 8, 10, 6, 7

### `count` — 🌳 Đếm thông minh

- **ID:** `count`
- **Chủ đề:** 🌳 Đếm thông minh
- **Hàm sinh:** `genSmartCount()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🌳 Người ta trồng cây dọc một con đường dài 30 m, cây cách cây 3 m, trồng ở CẢ HAI đầu đường. Hỏi cần bao nhiêu cây?
- Gợi ý: Số khoảng cách = 30 : 3 = 10. Trồng cả 2 đầu nên số cây = số khoảng + 1 = 11.
- Đáp án: **11**
- Các lựa chọn hiện ra: 5, 9, 8, 10, 11

### `combi` — 🤝 Đếm cách

- **ID:** `combi`
- **Chủ đề:** 🤝 Đếm cách
- **Hàm sinh:** `genCombi()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🤝 Có 4 bạn nhỏ, mỗi bạn bắt tay TẤT CẢ các bạn còn lại đúng 1 lần. Hỏi có tất cả bao nhiêu cái bắt tay?
- Gợi ý: Mỗi bạn bắt tay 3 bạn khác: 4 × 3 = 12. Nhưng mỗi cái bắt tay bị đếm 2 lần, nên chia 2: 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 4, 3, 0, 5, 6

**Ví dụ 2**

- Nội dung câu hỏi: 👕👖 Bé Na có 4 chiếc áo và 2 chiếc quần. Hỏi bé có bao nhiêu cách chọn 1 bộ áo–quần khác nhau?
- Gợi ý: Mỗi chiếc áo ghép được với 2 chiếc quần, có 4 chiếc áo nên: 4 × 2 = 8 cách.
- Đáp án: **8**
- Các lựa chọn hiện ra: 6, 5, 4, 8, 7

### `calen` — 📅 Lịch & thời gian

- **ID:** `calen`
- **Chủ đề:** 📅 Lịch & thời gian
- **Hàm sinh:** `genCalendar()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `arith` — 🧮 Tính nhanh

- **ID:** `arith`
- **Chủ đề:** 🧮 Tính nhanh
- **Hàm sinh:** `genArith()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 60 : 6 = ?
- Gợi ý: Vì 6 × 10 = 60 nên 60 : 6 = 10.
- Đáp án: **10**
- Các lựa chọn hiện ra: 6, 10, 7, 8, 9

### `olymp` — 🏅 Olympic

- **ID:** `olymp`
- **Chủ đề:** 🏅 Olympic
- **Hàm sinh:** `genOlymp()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🟦 Trong lưới ô vuông 5×5 dưới đây có tất cả bao nhiêu HÌNH VUÔNG (tính cả các hình vuông to nhỏ khác nhau)?
- Gợi ý: Đếm vuông từng cỡ: vuông 5×5 có 25 cái, vuông 4×4 có 16 cái, vuông 3×3 có 9 cái, vuông 2×2 có 4 cái, vuông 1×1 có 1 cái. Tổng: 25 + 16 + 9 + 4 + 1 = 55.
- Đáp án: **55**
- Các lựa chọn hiện ra: 55, 52, 53, 56, 54

**Ví dụ 2**

- Nội dung câu hỏi: 🐱 5 con mèo bắt được 5 con chuột trong 5 phút. Hỏi 100 con mèo bắt 100 con chuột trong bao nhiêu phút?
- Gợi ý: 5 mèo bắt 5 chuột trong 5 phút nghĩa là MỖI con mèo bắt 1 con chuột hết 5 phút. 100 mèo cùng lúc bắt 100 chuột thì vẫn chỉ mất 5 phút!
- Đáp án: **5**
- Các lựa chọn hiện ra: 4, 3, 7, 6, 5

### `cycle` — 🔗 Chuỗi lặp

- **ID:** `cycle`
- **Chủ đề:** 🔗 Chuỗi lặp
- **Hàm sinh:** `genCycle()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ 13 là hạt nào?
- Gợi ý: Chu kỳ có 3 hạt. 13 : 3 = 4 dư 1. Dư 1 nghĩa là giống hạt thứ 1 trong chu kỳ → ⭐.
- Đáp án: **⭐**
- Các lựa chọn hiện ra: 🌙, ☀️, ⚫, ⭐

**Ví dụ 2**

- Nội dung câu hỏi: 🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ 25 là hạt nào?
- Gợi ý: Chu kỳ có 6 hạt. 25 : 6 = 4 dư 1. Dư 1 nghĩa là giống hạt thứ 1 trong chu kỳ → ⭐.
- Đáp án: **⭐**
- Các lựa chọn hiện ra: ⭐, 🟡, ⚫, 🔶

### `eng` — 🔤 English

- **ID:** `eng`
- **Chủ đề:** 🔤 English
- **Hàm sinh:** `genEnglish()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `big` — 💯 Số lớn

- **ID:** `big`
- **Chủ đề:** 💯 Số lớn
- **Hàm sinh:** `genBigNum()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 593 − 364 = ?
- Gợi ý: Đặt tính rồi trừ từ phải sang trái, nhớ "mượn" nếu không đủ: 593 − 364 = 229.
- Đáp án: **229**
- Các lựa chọn hiện ra: 229, 230, 228, 231, 232

**Ví dụ 2**

- Nội dung câu hỏi: 85 + 46 + 38 = ?
- Gợi ý: Cộng lần lượt: 85 + 46 = 131, rồi 131 + 38 = 169.
- Đáp án: **169**
- Các lựa chọn hiện ra: 168, 166, 167, 170, 169

**Ví dụ 3**

- Nội dung câu hỏi: 410 + 414 = ?
- Gợi ý: Đặt tính rồi cộng từ phải sang trái (đơn vị → chục → trăm): 410 + 414 = 824.
- Đáp án: **824**
- Các lựa chọn hiện ra: 815, 823, 821, 824, 822

### `sasmo` — 🏅 SASMO

- **ID:** `sasmo`
- **Chủ đề:** 🏅 SASMO
- **Hàm sinh:** `genSasmo()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🍪 Có 63 chiếc bánh chia đều vào 6 hộp, mỗi hộp số bánh bằng nhau và nhiều nhất có thể. Hỏi thừa ra mấy chiếc?
- Gợi ý: 63 : 6 = 10 dư 3. Mỗi hộp 10 chiếc, còn thừa 3 chiếc.
- Đáp án: **3**
- Các lựa chọn hiện ra: 3, 2, 5, 4, 6

**Ví dụ 2**

- Nội dung câu hỏi: 🏷️ Một tờ tem loại A giá 2 nghìn, tem loại B giá 5 nghìn. Bé mua 3 tem A và 3 tem B. Hỏi bé trả tất cả bao nhiêu nghìn?
- Gợi ý: Tem A: 3 × 2 = 6 nghìn. Tem B: 3 × 5 = 15 nghìn. Tổng: 6 + 15 = 21 nghìn.
- Đáp án: **21**
- Các lựa chọn hiện ra: 22, 20, 21, 18, 19

### `imas` — 🌏 IMAS

- **ID:** `imas`
- **Chủ đề:** 🌏 IMAS
- **Hàm sinh:** `genImas()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🔢 Tính TỔNG các chữ số của số 4975.
- Gợi ý: Cộng từng chữ số: 4 + 9 + 7 + 5 = 25.
- Đáp án: **25**
- Các lựa chọn hiện ra: 22, 23, 25, 26, 24

**Ví dụ 2**

- Nội dung câu hỏi: 🧊 Một khối hộp được xếp bằng các khối lập phương nhỏ: dài 2 khối, rộng 2 khối, cao 3 khối. Hỏi có tất cả bao nhiêu khối lập phương nhỏ?
- Gợi ý: Mỗi tầng có 2 × 2 = 4 khối. Có 3 tầng: 4 × 3 = 12 khối.
- Đáp án: **12**
- Các lựa chọn hiện ra: 11, 10, 12, 9, 13

**Ví dụ 3**

- Nội dung câu hỏi: 🍰 Chiếc bánh được chia thành 2 phần bằng nhau, cả chiếc nặng 8 gam. Hỏi 1 phần nặng bao nhiêu gam?
- Gợi ý: 1 phần = 8 : 2 = 4 gam.
- Đáp án: **4**
- Các lựa chọn hiện ra: 4, 2, 1, 3, 5

### `amc` — 🎖️ AMC

- **ID:** `amc`
- **Chủ đề:** 🎖️ AMC
- **Hàm sinh:** `genAmc()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 💵 Bé mua đồ chơi hết 24 nghìn đồng và đưa cho cô bán hàng tờ 50 nghìn. Hỏi cô trả lại bé bao nhiêu nghìn đồng?
- Gợi ý: Tiền thừa = 50 − 24 = 26 nghìn đồng.
- Đáp án: **26**
- Các lựa chọn hiện ra: 25, 28, 29, 27, 26

**Ví dụ 2**

- Nội dung câu hỏi: 📈 Bạn Mai làm 3 bài kiểm tra, hai bài đầu được 6 và 12 điểm. Hỏi bài thứ ba phải được mấy điểm để TRUNG BÌNH cả 3 bài đúng bằng 9 điểm?
- Gợi ý: Tổng điểm cần có = 9 × 3 = 27. Hai bài đầu được 6 + 12 = 18. Bài ba cần: 27 − 18 = 9 điểm.
- Đáp án: **9**
- Các lựa chọn hiện ra: 11, 12, 10, 9, 15

**Ví dụ 3**

- Nội dung câu hỏi: 💯 Lớp có 60 bạn, trong đó 10% số bạn đeo kính 👓. Hỏi có bao nhiêu bạn đeo kính?
- Gợi ý: 10% nghĩa là một phần mười: 60 : 10 = 6 bạn.
- Đáp án: **6**
- Các lựa chọn hiện ra: 5, 3, 6, 2, 4

### `tdn` — 🎓 Trường chuyên

- **ID:** `tdn`
- **Chủ đề:** 🎓 Trường chuyên
- **Hàm sinh:** `genTDN()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🎓 Tìm số có 3 CHỮ SỐ, biết: chữ số hàng trăm gấp đôi chữ số hàng chục; chữ số hàng đơn vị bằng tổng chữ số hàng trăm và hàng chục; tổng cả ba chữ số bằng 18. Số đó là số nào?
- Gợi ý: Gọi chữ số hàng chục là ▢, thì hàng trăm là 2×▢ và hàng đơn vị là ▢+2×▢ = 3×▢. Tổng ba chữ số: ▢+2×▢+3×▢ = 6×▢ = 18 → ▢ = 3. Vậy số đó là 639.
- Đáp án: **639**
- Các lựa chọn hiện ra: 640, 648, 642, 639, 641

### `world` — 🌍 Kinh điển

- **ID:** `world`
- **Chủ đề:** 🌍 Kinh điển
- **Hàm sinh:** `genWorld()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🐜 Chú kiến ở góc dưới bên trái muốn tới góc trên bên phải của lưới 2×3 ô. Kiến chỉ được đi SANG PHẢI hoặc LÊN TRÊN theo các cạnh ô. Hỏi có bao nhiêu đường đi ngắn nhất?
- Gợi ý: Ghi số cách đi tới từng nút: nút ở mép dưới và mép trái đều là 1 cách. Mỗi nút khác = số cách của nút BÊN TRÁI cộng nút BÊN DƯỚI. Cộng dần lên tới góc trên phải được 10 đường.
- Đáp án: **10**
- Các lựa chọn hiện ra: 10, 13, 11, 14, 12

**Ví dụ 2**

- Nội dung câu hỏi: 🥤 Em chỉ có 2 chiếc bình: bình 4 lít và bình 7 lít, không có vạch chia. Hỏi có thể đong ra ĐÚNG mấy lít nếu đổ đầy bình 7 rồi rót sang bình 4 cho đầy?
- Gợi ý: Rót từ bình 7 lít sang bình 4 lít cho tới khi bình nhỏ đầy, phần còn lại trong bình lớn là 7 − 4 = 3 lít. Đó là mẹo đong nước không cần vạch chia!
- Đáp án: **3**
- Các lựa chọn hiện ra: 1, 2, 4, 0, 3

**Ví dụ 3**

- Nội dung câu hỏi: 🐸 Một chú ếch rơi xuống giếng sâu 22 m. Ban ngày ếch leo lên được 4 m, nhưng ban đêm ngủ quên lại tụt xuống 3 m. Hỏi sau bao nhiêu NGÀY ếch lên tới miệng giếng?
- Gợi ý: Mỗi ngày đêm ếch chỉ thực sự lên được 4 − 3 = 1 m. Nhưng vào ngày CUỐI, ếch leo 4 m là ra khỏi giếng luôn, không tụt nữa! Nên cần leo 22 − 4 = 18 m theo cách chậm: 18 : 1 = 18 ngày, cộng thêm ngày cuối = 19 ngày.
- Đáp án: **19**
- Các lựa chọn hiện ra: 18, 19, 21, 22, 20

### `visual` — 🎨 Nhìn hình

- **ID:** `visual`
- **Chủ đề:** 🎨 Nhìn hình
- **Hàm sinh:** `genVisual()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 📐 Hình vuông cạnh 7 cm và hình chữ nhật 9 × 5 cm có CHU VI bằng nhau. Hỏi diện tích hình vuông LỚN HƠN hình chữ nhật bao nhiêu cm²?
- Gợi ý: Hình vuông: 7×7 = 49 cm². Hình chữ nhật: 9×5 = 45 cm². Chênh lệch 49 − 45 = 4 cm². Điều thú vị: cùng chu vi thì hình vuông luôn có diện tích lớn nhất!
- Đáp án: **4**
- Các lựa chọn hiện ra: 3, 5, 6, 4, 2

**Ví dụ 2**

- Nội dung câu hỏi: 🧊 Hình LẬP PHƯƠNG có bao nhiêu mặt?
- Gợi ý: Hình lập phương giống viên xúc xắc: có 6 MẶT vuông, 12 CẠNH và 8 ĐỈNH (góc). Đáp án mặt là 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 8, 4, 6, 12

**Ví dụ 3**

- Nội dung câu hỏi: 🧊 Hình LẬP PHƯƠNG có bao nhiêu mặt?
- Gợi ý: Hình lập phương giống viên xúc xắc: có 6 MẶT vuông, 12 CẠNH và 8 ĐỈNH (góc). Đáp án mặt là 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 4, 12, 8, 6

### `numsense` — 🔟 Cảm nhận số

- **ID:** `numsense`
- **Chủ đề:** 🔟 Cảm nhận số
- **Hàm sinh:** `genNumSense()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🔎 Viết liền các số từ 1 đến 20. Hỏi chữ số 1 xuất hiện bao nhiêu lần?
- Gợi ý: Đếm ở hàng đơn vị: 1, 11, 21... Đếm ở hàng chục: 10–19 có 10 số đều bắt đầu bằng 1. Cộng lại được 12 lần.
- Đáp án: **12**
- Các lựa chọn hiện ra: 15, 11, 14, 12, 13

**Ví dụ 2**

- Nội dung câu hỏi: 🔍 Số nào dưới đây CHIA HẾT cho 2?
- Gợi ý: Dấu hiệu chia hết cho 2: chữ số tận cùng là số chẵn. Với 238 thì điều đó đúng ✓
- Đáp án: **238**
- Các lựa chọn hiện ra: 239, 238, 237, 241

**Ví dụ 3**

- Nội dung câu hỏi: 🔢 Số nào là số NGUYÊN TỐ (chỉ chia hết cho 1 và chính nó)?
- Gợi ý: 41 chỉ chia hết cho 1 và 41 nên là số nguyên tố. Các số còn lại đều chia hết cho một số khác nữa (2, 3 hoặc 5).
- Đáp án: **41**
- Các lựa chọn hiện ra: 18, 35, 41, 30

### `chance` — 🎲 Xác suất

- **ID:** `chance`
- **Chủ đề:** 🎲 Xác suất
- **Hàm sinh:** `genChance()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 🎡 Vòng quay may mắn chia thành 8 ô bằng nhau, trong đó 7 ô màu đỏ. Nếu quay 8 lần thì TRUNG BÌNH kim dừng ở ô đỏ mấy lần?
- Gợi ý: Mỗi lần quay, cơ hội trúng ô đỏ là 7 phần 8. Quay 8 lần thì trung bình trúng đỏ 7 lần.
- Đáp án: **7**
- Các lựa chọn hiện ra: 7, 8, 10, 9, 11

### `unit` — 📏 Đổi đơn vị

- **ID:** `unit`
- **Chủ đề:** 📏 Đổi đơn vị
- **Hàm sinh:** `genUnit()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 📏 Đổi: 5 năm = ? tháng
- Gợi ý: 1 năm = 12 tháng, nên 5 năm = 5 × 12 = 60 tháng.
- Đáp án: **60**
- Các lựa chọn hiện ra: 61, 60, 59, 63, 62

**Ví dụ 2**

- Nội dung câu hỏi: 📏 Đổi: 8 m = ? mm
- Gợi ý: 1 m = 1000 mm, nên 8 m = 8 × 1000 = 8000 mm.
- Đáp án: **8000**
- Các lựa chọn hiện ra: 8002, 8001, 7999, 8000, 7998

**Ví dụ 3**

- Nội dung câu hỏi: 📏 Đổi: 70 kg = ? yến
- Gợi ý: 10 kg = 1 yến, nên 70 kg = 70 : 10 = 7 yến.
- Đáp án: **7**
- Các lựa chọn hiện ra: 6, 5, 3, 4, 7

### `bar` — 📊 Tổng-Tỉ/Hiệu-Tỉ

- **ID:** `bar`
- **Chủ đề:** 📊 Tổng-Tỉ/Hiệu-Tỉ
- **Hàm sinh:** `genSumRatio()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 📊 Dũng và An có tổng cộng 30 viên bi. Tỉ số giữa số bi của Dũng và An là 2 : 3 (Dũng có ít hơn). Hỏi bạn An có bao nhiêu viên bi?
- Gợi ý: Tổng số phần bằng nhau: 2 + 3 = 5 phần. Giá trị 1 phần = 30 : 5 = 6. Số bi của Dũng = 6×2 = 12, của An = 6×3 = 18.
- Đáp án: **18**
- Các lựa chọn hiện ra: 24, 21, 20, 18, 19

**Ví dụ 2**

- Nội dung câu hỏi: 📊 Chi và Bình có tổng cộng 30 viên bi. Tỉ số giữa số bi của Chi và Bình là 1 : 4 (Chi có ít hơn). Hỏi bạn Bình có bao nhiêu viên bi?
- Gợi ý: Tổng số phần bằng nhau: 1 + 4 = 5 phần. Giá trị 1 phần = 30 : 5 = 6. Số bi của Chi = 6×1 = 6, của Bình = 6×4 = 24.
- Đáp án: **24**
- Các lựa chọn hiện ra: 25, 23, 22, 24, 26

### `brain` — 💎 Thử thách mới

- **ID:** `brain`
- **Chủ đề:** 💎 Thử thách mới
- **Hàm sinh:** `genBrainChallenge()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1**

- Nội dung câu hỏi: 💎 Trên lưới ô vuông, An đi từ A đến B bằng đúng 3 bước sang PHẢI và 3 bước lên TRÊN (không đi lùi). Có bao nhiêu đường đi ngắn nhất khác nhau?
- Gợi ý: Mỗi đường ngắn nhất gồm 6 bước, chỉ khác vị trí đặt 3 bước lên. Chọn 3 vị trí trong 6 vị trí: có 20 cách.
- Đáp án: **20**
- Các lựa chọn hiện ra: 18, 20, 17, 21, 19

**Ví dụ 2**

- Nội dung câu hỏi: 💎 Dùng các chữ số 0, 1, 2, …, 5, lập số có HAI chữ số khác nhau. Có bao nhiêu số lập được?
- Gợi ý: Hàng chục không thể là 0 nên có 5 cách chọn (1 đến 5). Chọn xong hàng chục, hàng đơn vị có 5 chữ số còn lại, kể cả 0. Vậy có 5×5 = 25 số.
- Đáp án: **25**
- Các lựa chọn hiện ra: 24, 25, 20, 22, 23

**Ví dụ 3**

- Nội dung câu hỏi: 💎 Một lớp có 13 bạn thích cờ vua, 12 bạn thích bóng đá và 4 bạn thích CẢ HAI. Có bao nhiêu bạn thích ít nhất một trong hai môn?
- Gợi ý: Cộng 13 + 12 thì 4 bạn thích cả hai bị đếm hai lần. Chỉ giữ mỗi bạn một lần: 13 + 12 − 4 = 21.
- Đáp án: **21**
- Các lựa chọn hiện ra: 20, 21, 19, 22, 18

### `singapore` — 🇸🇬 Singapore lớp 3

- **ID:** `singapore`
- **Chủ đề:** 🇸🇬 Singapore lớp 3
- **Hàm sinh:** `genSingapore3()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 3

**Ví dụ 1 (sgKind: `circleRoses`)**

- Nội dung câu hỏi: Một hồ tròn có chu vi 120 m. Cứ cách 6 m trồng 1 cây liễu; giữa hai cây liễu liên tiếp trồng 2 cây hoa hồng. Có tất cả bao nhiêu cây hoa hồng?
- Gợi ý: Có 120:6 = 20 cây liễu. Trên đường tròn, số khoảng bằng số cây nên cũng có 20 khoảng. Mỗi khoảng có 2 cây hoa hồng: 20×2 = 40 cây.
- Đáp án: **40**
- Các lựa chọn hiện ra: 41, 39, 40, 38, 42

**Ví dụ 2 (sgKind: `triangleBDE`)**

- Nội dung câu hỏi: Tam giác ABC có diện tích 60 cm². D thuộc BC sao cho BD = 2DC. E là trung điểm của AD. Tính diện tích tam giác BDE.
- Gợi ý: BD chiếm 2/3 cạnh BC nên S(ABD) = 2/3×60 = 40 cm². E là trung điểm AD, vì vậy DE = 1/2 AD. Hai tam giác BDE và BDA chung chiều cao từ B, nên S(BDE) = 1/2×40 = 20 cm².
- Đáp án: **20**
- Các lựa chọn hiện ra: 20, 22, 26, 23, 21

