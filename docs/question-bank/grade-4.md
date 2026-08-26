# Ngân hàng câu hỏi — Khối 4 (tier 4 trong code)

> **Tài liệu tra cứu, không phải dữ liệu game đọc lúc chạy.** Đấu Trường Tư Duy sinh
> câu hỏi ngẫu nhiên bằng công thức trong `src/scripts/games/adventure/questions.js`, không đọc từ file
> này. Các ví dụ dưới đây là **kết quả thật** lấy trực tiếp từ `genQuestion(4)` lúc
> game chạy trong trình duyệt (không phải tự bịa) — dùng để bạn xem/kiểm tra/mở rộng công
> thức sinh câu hỏi, đổi nội dung ở đây **không** làm game đổi theo.
>
> ⚠️ Mức huyền thoại — thêm phân số, phần trăm, hình học nâng cao, Tổng-Tỉ/Hiệu-Tỉ, học sinh giỏi (khoảng lớp 4–5). **Không phải thuần lớp 4** — đã trộn cả dạng thi HSG.

## Danh sách dạng câu hỏi (31 dạng)

| ID | Chủ đề | Hàm sinh |
|---|---|---|
| `word` | 📖 Toán đố | `genWord()` |
| `geo` | 📐 Hình học | `genGeo()` |
| `logic` | 🧠 Tư duy | `genLogic()` |
| `eq` | 🍎 Cân bằng | `genEmojiEq()` |
| `magic` | 🔮 Ô số ma thuật | `genMagic()` |
| `back` | ↩️ Suy luận ngược | `genBackwards()` |
| `count` | 🌳 Đếm thông minh | `genSmartCount()` |
| `combi` | 🤝 Đếm cách | `genCombi()` |
| `calen` | 📅 Lịch & thời gian | `genCalendar()` |
| `seq` | 🔢 Quy luật | `genSeq()` |
| `missing` | ❓ Tìm số | `genMissing()` |
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
| `frac` | ½ Phân số | `genFraction()` |
| `pct` | 💯 Phần trăm | `genPercent()` |
| `geo5` | 📐 Hình nâng cao | `genGeo5()` |
| `unit` | 📏 Đổi đơn vị | `genUnit()` |
| `bar` | 📊 Tổng-Tỉ/Hiệu-Tỉ | `genSumRatio()` |
| `hsg` | 🌟 Học sinh giỏi | `genHSG()` |
| `brain` | 💎 Thử thách mới | `genBrainChallenge()` |
| `singapore` | 🇸🇬 Singapore lớp 3 | `genSingapore3()` |

## Chi tiết từng dạng

### `word` — 📖 Toán đố

- **ID:** `word`
- **Chủ đề:** 📖 Toán đố
- **Hàm sinh:** `genWord()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `geo` — 📐 Hình học

- **ID:** `geo`
- **Chủ đề:** 📐 Hình học
- **Hàm sinh:** `genGeo()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `logic` — 🧠 Tư duy

- **ID:** `logic`
- **Chủ đề:** 🧠 Tư duy
- **Hàm sinh:** `genLogic()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `eq` — 🍎 Cân bằng

- **ID:** `eq`
- **Chủ đề:** 🍎 Cân bằng
- **Hàm sinh:** `genEmojiEq()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: Mỗi loại quả là một số. Hỏi 🍌 = ?
- Gợi ý: Cộng cả ba vế: (🍌+🍇) + (🍇+🍓) + (🍌+🍓) = 22+16+16 = 54, tức 2×(🍌+🍇+🍓) = 54 nên 🍌+🍇+🍓 = 27. Vậy 🍌 = 27 − (🍇+🍓) = 27 − 16 = 11.
- Đáp án: **11**
- Các lựa chọn hiện ra: 12, 9, 13, 11, 10

### `magic` — 🔮 Ô số ma thuật

- **ID:** `magic`
- **Chủ đề:** 🔮 Ô số ma thuật
- **Hàm sinh:** `genMagic()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: Ô số ma thuật: tổng mỗi hàng, mỗi cột, mỗi đường chéo đều bằng 33. Số ở ô ❓ là mấy?
- Gợi ý: Hàng chứa ô ❓ đã có 15 và 8. Vậy ❓ = 33 − 15 − 8 = 10.
- Đáp án: **10**
- Các lựa chọn hiện ra: 12, 13, 10, 11, 9

**Ví dụ 2**

- Nội dung câu hỏi: Ô số ma thuật: tổng mỗi hàng, mỗi cột, mỗi đường chéo đều bằng 36. Số ở ô ❓ là mấy?
- Gợi ý: Hàng chứa ô ❓ đã có 9 và 17. Vậy ❓ = 36 − 9 − 17 = 10.
- Đáp án: **10**
- Các lựa chọn hiện ra: 13, 12, 11, 14, 10

**Ví dụ 3**

- Nội dung câu hỏi: Ô số ma thuật: tổng mỗi hàng, mỗi cột, mỗi đường chéo đều bằng 36. Số ở ô ❓ là mấy?
- Gợi ý: Hàng chứa ô ❓ đã có 12 và 10. Vậy ❓ = 36 − 12 − 10 = 14.
- Đáp án: **14**
- Các lựa chọn hiện ra: 12, 14, 13, 10, 11

### `back` — ↩️ Suy luận ngược

- **ID:** `back`
- **Chủ đề:** ↩️ Suy luận ngược
- **Hàm sinh:** `genBackwards()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🎩 Nhà ảo thuật nghĩ ra một số. Ông nhân với 2, trừ đi 5, rồi lại nhân với 2 thì được 14. Hỏi số ban đầu là mấy?
- Gợi ý: Đi ngược từng bước: 14 : 2 = 7 → cộng 5 được 12 → chia 2 được 6.
- Đáp án: **6**
- Các lựa chọn hiện ra: 9, 5, 7, 8, 6

### `count` — 🌳 Đếm thông minh

- **ID:** `count`
- **Chủ đề:** 🌳 Đếm thông minh
- **Hàm sinh:** `genSmartCount()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `combi` — 🤝 Đếm cách

- **ID:** `combi`
- **Chủ đề:** 🤝 Đếm cách
- **Hàm sinh:** `genCombi()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `calen` — 📅 Lịch & thời gian

- **ID:** `calen`
- **Chủ đề:** 📅 Lịch & thời gian
- **Hàm sinh:** `genCalendar()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🕐 Phim hoạt hình bắt đầu lúc 2 giờ 45 phút và kéo dài 90 phút. Hỏi phim kết thúc lúc mấy giờ?
- Gợi ý: 2 giờ 45 phút + 90 phút = 4 giờ 15 phút. (Cộng phút trước, cứ đủ 60 phút thì thêm 1 giờ.)
- Đáp án: **4 giờ 15 phút**
- Các lựa chọn hiện ra: 4 giờ đúng, 3 giờ 45 phút, 4 giờ 15 phút, 4 giờ 30 phút

### `seq` — 🔢 Quy luật

- **ID:** `seq`
- **Chủ đề:** 🔢 Quy luật
- **Hàm sinh:** `genSeq()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `missing` — ❓ Tìm số

- **ID:** `missing`
- **Chủ đề:** ❓ Tìm số
- **Hàm sinh:** `genMissing()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `olymp` — 🏅 Olympic

- **ID:** `olymp`
- **Chủ đề:** 🏅 Olympic
- **Hàm sinh:** `genOlymp()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🐱 5 con mèo bắt được 5 con chuột trong 5 phút. Hỏi 100 con mèo bắt 100 con chuột trong bao nhiêu phút?
- Gợi ý: 5 mèo bắt 5 chuột trong 5 phút nghĩa là MỖI con mèo bắt 1 con chuột hết 5 phút. 100 mèo cùng lúc bắt 100 chuột thì vẫn chỉ mất 5 phút!
- Đáp án: **5**
- Các lựa chọn hiện ra: 7, 5, 6, 8, 4

**Ví dụ 2**

- Nội dung câu hỏi: 🟦 Trong lưới ô vuông 4×4 dưới đây có tất cả bao nhiêu HÌNH VUÔNG (tính cả các hình vuông to nhỏ khác nhau)?
- Gợi ý: Đếm vuông từng cỡ: vuông 4×4 có 16 cái, vuông 3×3 có 9 cái, vuông 2×2 có 4 cái, vuông 1×1 có 1 cái. Tổng: 16 + 9 + 4 + 1 = 30.
- Đáp án: **30**
- Các lựa chọn hiện ra: 30, 26, 27, 29, 28

**Ví dụ 3**

- Nội dung câu hỏi: 🔍 Tìm số có 2 chữ số: tổng hai chữ số bằng 9, và chữ số hàng CHỤC lớn hơn chữ số hàng ĐƠN VỊ đúng 3 đơn vị. Số đó là số nào?
- Gợi ý: Gọi hàng đơn vị là ▢ thì hàng chục là ▢+3. Tổng: ▢+▢+3 = 9 → ▢ = 3. Vậy số đó là 63.
- Đáp án: **63**
- Các lựa chọn hiện ra: 61, 62, 63, 60, 54

### `cycle` — 🔗 Chuỗi lặp

- **ID:** `cycle`
- **Chủ đề:** 🔗 Chuỗi lặp
- **Hàm sinh:** `genCycle()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ 20 là hạt nào?
- Gợi ý: Chu kỳ có 3 hạt. 20 : 3 = 6 dư 2. Dư 2 nghĩa là giống hạt thứ 2 trong chu kỳ → 🌙.
- Đáp án: **🌙**
- Các lựa chọn hiện ra: ☀️, 🌙, ⚫, 🟡

### `eng` — 🔤 English

- **ID:** `eng`
- **Chủ đề:** 🔤 English
- **Hàm sinh:** `genEnglish()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🔤 One dozen means 12. How many eggs 🥚 are there in 3 dozen?
- Gợi ý: "Dozen" = 1 tá = 12. Vậy 3 tá = 3 × 12 = 36 quả trứng.
- Đáp án: **36**
- Các lựa chọn hiện ra: 33, 35, 34, 36, 37

### `big` — 💯 Số lớn

- **ID:** `big`
- **Chủ đề:** 💯 Số lớn
- **Hàm sinh:** `genBigNum()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: Tính nhanh: 15 + 225 + 85 = ?
- Gợi ý: Mẹo: ghép 15 + 85 = 100 trước, rồi 100 + 225 = 325. Tìm cặp số tròn trăm là tính siêu nhanh!
- Đáp án: **325**
- Các lựa chọn hiện ra: 327, 328, 325, 326, 334

**Ví dụ 2**

- Nội dung câu hỏi: 2775 + 1746 = ?
- Gợi ý: Cộng lần lượt từng hàng từ phải sang trái: 2775 + 1746 = 4521.
- Đáp án: **4521**
- Các lựa chọn hiện ra: 4512, 4520, 4518, 4521, 4519

### `sasmo` — 🏅 SASMO

- **ID:** `sasmo`
- **Chủ đề:** 🏅 SASMO
- **Hàm sinh:** `genSasmo()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🔢 Tính tổng 5 số lẻ đầu tiên: 1 + 3 + 5 + 7 + 9 = ?
- Gợi ý: Mẹo SASMO: tổng 5 số lẻ đầu tiên luôn bằng 5 × 5 = 25. Thử xem: 1+3=4=2×2 ✓
- Đáp án: **25**
- Các lựa chọn hiện ra: 25, 28, 26, 27, 24

**Ví dụ 2**

- Nội dung câu hỏi: ⚖️ 15 quả cam nặng bằng 3 quả dưa. Hỏi 1 quả dưa nặng bằng mấy quả cam?
- Gợi ý: 15 cam = 3 dưa. Chia cả hai bên cho 3: 5 cam = 1 dưa. Vậy 1 quả dưa nặng bằng 5 quả cam.
- Đáp án: **5**
- Các lựa chọn hiện ra: 5, 4, 6, 7, 8

**Ví dụ 3**

- Nội dung câu hỏi: 🍪 Có 22 chiếc bánh chia đều vào 5 hộp, mỗi hộp số bánh bằng nhau và nhiều nhất có thể. Hỏi thừa ra mấy chiếc?
- Gợi ý: 22 : 5 = 4 dư 2. Mỗi hộp 4 chiếc, còn thừa 2 chiếc.
- Đáp án: **2**
- Các lựa chọn hiện ra: 1, 3, 5, 2, 4

### `imas` — 🌏 IMAS

- **ID:** `imas`
- **Chủ đề:** 🌏 IMAS
- **Hàm sinh:** `genImas()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🧊 Một khối hộp được xếp bằng các khối lập phương nhỏ: dài 3 khối, rộng 2 khối, cao 2 khối. Hỏi có tất cả bao nhiêu khối lập phương nhỏ?
- Gợi ý: Mỗi tầng có 3 × 2 = 6 khối. Có 2 tầng: 6 × 2 = 12 khối.
- Đáp án: **12**
- Các lựa chọn hiện ra: 14, 11, 13, 15, 12

**Ví dụ 2**

- Nội dung câu hỏi: 📏 Ghép 2 hình vuông cạnh 5 cm thành một hàng ngang (dán sát cạnh nhau). Hỏi chu vi hình chữ nhật thu được là bao nhiêu cm?
- Gợi ý: Hình chữ nhật có chiều dài 2×5 = 10 cm, chiều rộng 5 cm. Chu vi = (10 + 5) × 2 = 30 cm.
- Đáp án: **30**
- Các lựa chọn hiện ra: 28, 29, 27, 30, 31

**Ví dụ 3**

- Nội dung câu hỏi: 📏 Ghép 4 hình vuông cạnh 5 cm thành một hàng ngang (dán sát cạnh nhau). Hỏi chu vi hình chữ nhật thu được là bao nhiêu cm?
- Gợi ý: Hình chữ nhật có chiều dài 4×5 = 20 cm, chiều rộng 5 cm. Chu vi = (20 + 5) × 2 = 50 cm.
- Đáp án: **50**
- Các lựa chọn hiện ra: 41, 50, 47, 49, 48

### `amc` — 🎖️ AMC

- **ID:** `amc`
- **Chủ đề:** 🎖️ AMC
- **Hàm sinh:** `genAmc()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 👷 Một máy làm được 4 sản phẩm mỗi giờ. Hỏi trong 3 giờ máy làm được bao nhiêu sản phẩm?
- Gợi ý: Mỗi giờ 4 sản phẩm, 3 giờ: 4 × 3 = 12 sản phẩm.
- Đáp án: **12**
- Các lựa chọn hiện ra: 10, 13, 12, 11, 14

**Ví dụ 2**

- Nội dung câu hỏi: 💵 Bé mua đồ chơi hết 45 nghìn đồng và đưa cho cô bán hàng tờ 50 nghìn. Hỏi cô trả lại bé bao nhiêu nghìn đồng?
- Gợi ý: Tiền thừa = 50 − 45 = 5 nghìn đồng.
- Đáp án: **5**
- Các lựa chọn hiện ra: 3, 5, 4, 2, 6

**Ví dụ 3**

- Nội dung câu hỏi: 💵 Bé mua đồ chơi hết 24 nghìn đồng và đưa cho cô bán hàng tờ 50 nghìn. Hỏi cô trả lại bé bao nhiêu nghìn đồng?
- Gợi ý: Tiền thừa = 50 − 24 = 26 nghìn đồng.
- Đáp án: **26**
- Các lựa chọn hiện ra: 25, 24, 27, 28, 26

### `tdn` — 🎓 Trường chuyên

- **ID:** `tdn`
- **Chủ đề:** 🎓 Trường chuyên
- **Hàm sinh:** `genTDN()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `world` — 🌍 Kinh điển

- **ID:** `world`
- **Chủ đề:** 🌍 Kinh điển
- **Hàm sinh:** `genWorld()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🥤 Em chỉ có 2 chiếc bình: bình 4 lít và bình 7 lít, không có vạch chia. Hỏi có thể đong ra ĐÚNG mấy lít nếu đổ đầy bình 7 rồi rót sang bình 4 cho đầy?
- Gợi ý: Rót từ bình 7 lít sang bình 4 lít cho tới khi bình nhỏ đầy, phần còn lại trong bình lớn là 7 − 4 = 3 lít. Đó là mẹo đong nước không cần vạch chia!
- Đáp án: **3**
- Các lựa chọn hiện ra: 6, 3, 5, 2, 4

**Ví dụ 2**

- Nội dung câu hỏi: 🗼 Trò chơi Tháp Hà Nội có 4 chiếc đĩa to nhỏ khác nhau. Mỗi lần chỉ được chuyển 1 đĩa và không được đặt đĩa TO lên trên đĩa NHỎ. Hỏi cần ít nhất bao nhiêu lần chuyển để dời cả tháp sang cọc khác?
- Gợi ý: Quy luật: 1 đĩa cần 1 lần, 2 đĩa cần 3 lần, 3 đĩa cần 7 lần... mỗi lần thêm 1 đĩa thì số bước GẤP ĐÔI rồi cộng 1. Với 4 đĩa: 2×2×...×2 (4 lần) − 1 = 16 − 1 = 15 lần.
- Đáp án: **15**
- Các lựa chọn hiện ra: 16, 14, 12, 15, 13

**Ví dụ 3**

- Nội dung câu hỏi: 📅 Trong một nhóm bạn, muốn CHẮC CHẮN có ít nhất 2 bạn sinh cùng một THÁNG thì nhóm đó phải có ít nhất bao nhiêu người?
- Gợi ý: Một năm có 12 tháng. Nếu chỉ có 12 người thì có thể mỗi người một tháng khác nhau. Nhưng người thứ 13 bắt buộc phải trùng tháng với ai đó → cần ít nhất 13 người.
- Đáp án: **13**
- Các lựa chọn hiện ra: 11, 13, 10, 12, 7

### `visual` — 🎨 Nhìn hình

- **ID:** `visual`
- **Chủ đề:** 🎨 Nhìn hình
- **Hàm sinh:** `genVisual()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🪞 Hình chữ nhật ▭ có bao nhiêu TRỤC ĐỐI XỨNG (đường gấp đôi lại thì hai nửa trùng khít)?
- Gợi ý: Hình chữ nhật chỉ gấp được theo 2 đường giữa (ngang và dọc). Đường chéo KHÔNG phải trục đối xứng vì hai nửa không trùng khít → 2 trục.
- Đáp án: **2**
- Các lựa chọn hiện ra: 1, 4, 2, 3

**Ví dụ 2**

- Nội dung câu hỏi: ✂️ Một tờ giấy được gấp đôi 2 lần liên tiếp, rồi bấm 1 lỗ xuyên qua. Mở tờ giấy ra thì có bao nhiêu lỗ?
- Gợi ý: Mỗi lần gấp đôi thì số lớp giấy nhân đôi: gấp 1 lần được 2 lớp, 2 lần được 4 lớp... Gấp 2 lần được 4 lớp, bấm 1 lỗ xuyên hết → 4 lỗ.
- Đáp án: **4**
- Các lựa chọn hiện ra: 5, 4, 1, 3, 2

### `numsense` — 🔟 Cảm nhận số

- **ID:** `numsense`
- **Chủ đề:** 🔟 Cảm nhận số
- **Hàm sinh:** `genNumSense()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🔁 Số nào đọc XUÔI hay đọc NGƯỢC cũng giống nhau (số đối xứng)?
- Gợi ý: 343 đọc ngược lại vẫn là 343 nên nó là số đối xứng (palindrome). Các số kia đọc ngược sẽ ra số khác.
- Đáp án: **343**
- Các lựa chọn hiện ra: 144, 641, 398, 343

### `chance` — 🎲 Xác suất

- **ID:** `chance`
- **Chủ đề:** 🎲 Xác suất
- **Hàm sinh:** `genChance()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 🎲 Gieo một con xúc xắc 6 mặt. Khả năng ra mặt 3 chấm là mấy phần?
- Gợi ý: Xúc xắc có 6 mặt như nhau, mặt 3 chỉ là 1 trong 6 khả năng → cơ hội là 1 phần 6.
- Đáp án: **1 phần 6**
- Các lựa chọn hiện ra: 1 phần 6, 1 phần 3, 1 phần 2, 6 phần 1

### `frac` — ½ Phân số

- **ID:** `frac`
- **Chủ đề:** ½ Phân số
- **Hàm sinh:** `genFraction()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: ⚖️ Phân số nào LỚN HƠN: 1/4 hay 2/5?
- Gợi ý: Quy đồng để so sánh: 2/5 lớn hơn. (Mẹo: khi tử số bằng nhau thì mẫu càng NHỎ phân số càng LỚN.)
- Đáp án: **2/5**
- Các lựa chọn hiện ra: 1/4, 2/5

**Ví dụ 2**

- Nội dung câu hỏi: 🍰 Tính: 1/4 + 1/4 = ?
- Gợi ý: Quy đồng mẫu số rồi cộng tử số. 1/4 + 1/4 = 1/2.
- Đáp án: **1/2**
- Các lựa chọn hiện ra: 3/4, 2/3, 2/6, 1/2

### `pct` — 💯 Phần trăm

- **ID:** `pct`
- **Chủ đề:** 💯 Phần trăm
- **Hàm sinh:** `genPercent()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 💯 Trường có 20 học sinh, trong đó 20% là học sinh giỏi. Hỏi có bao nhiêu học sinh giỏi?
- Gợi ý: 20% của 20 = 20 × 20 : 100 = 4 học sinh.
- Đáp án: **4**
- Các lựa chọn hiện ra: 2, 5, 6, 3, 4

### `geo5` — 📐 Hình nâng cao

- **ID:** `geo5`
- **Chủ đề:** 📐 Hình nâng cao
- **Hàm sinh:** `genGeo5()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `unit` — 📏 Đổi đơn vị

- **ID:** `unit`
- **Chủ đề:** 📏 Đổi đơn vị
- **Hàm sinh:** `genUnit()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 📏 Đổi: 70 dm = ? m
- Gợi ý: 10 dm = 1 m, nên 70 dm = 70 : 10 = 7 m.
- Đáp án: **7**
- Các lựa chọn hiện ra: 9, 7, 5, 8, 6

**Ví dụ 2**

- Nội dung câu hỏi: 📏 Đổi: 60 mm = ? cm
- Gợi ý: 10 mm = 1 cm, nên 60 mm = 60 : 10 = 6 cm.
- Đáp án: **6**
- Các lựa chọn hiện ra: 6, 4, 5, 2, 3

**Ví dụ 3**

- Nội dung câu hỏi: 📏 Đổi: 8 giờ = ? phút
- Gợi ý: 1 giờ = 60 phút, nên 8 giờ = 8 × 60 = 480 phút.
- Đáp án: **480**
- Các lựa chọn hiện ra: 481, 480, 482, 483, 486

### `bar` — 📊 Tổng-Tỉ/Hiệu-Tỉ

- **ID:** `bar`
- **Chủ đề:** 📊 Tổng-Tỉ/Hiệu-Tỉ
- **Hàm sinh:** `genSumRatio()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 📊 Bình có nhiều hơn An 17 viên bi. Tỉ số giữa số bi của An và Bình là 2 : 3. Hỏi bạn Bình có bao nhiêu viên bi?
- Gợi ý: Hiệu số phần bằng nhau: 3 − 2 = 1 phần. Giá trị 1 phần = 17 : 1 = 17. Số bi của An = 17×2 = 34, của Bình = 17×3 = 51.
- Đáp án: **51**
- Các lựa chọn hiện ra: 54, 51, 60, 52, 53

**Ví dụ 2**

- Nội dung câu hỏi: 📊 Dũng có nhiều hơn Bình 34 viên bi. Tỉ số giữa số bi của Bình và Dũng là 3 : 5. Hỏi bạn Dũng có bao nhiêu viên bi?
- Gợi ý: Hiệu số phần bằng nhau: 5 − 3 = 2 phần. Giá trị 1 phần = 34 : 2 = 17. Số bi của Bình = 17×3 = 51, của Dũng = 17×5 = 85.
- Đáp án: **85**
- Các lựa chọn hiện ra: 85, 83, 76, 84, 82

### `hsg` — 🌟 Học sinh giỏi

- **ID:** `hsg`
- **Chủ đề:** 🌟 Học sinh giỏi
- **Hàm sinh:** `genHSG()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `brain` — 💎 Thử thách mới

- **ID:** `brain`
- **Chủ đề:** 💎 Thử thách mới
- **Hàm sinh:** `genBrainChallenge()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1**

- Nội dung câu hỏi: 💎 Số 36 có tất cả bao nhiêu ƯỚC SỐ dương?
- Gợi ý: 36 = 2^2 × 3^2. Trong một ước số, số mũ của 2 có 3 cách chọn (0 đến 2), số mũ của 3 có 3 cách. Tổng số ước = (2+1)×(2+1) = 9.
- Đáp án: **9**
- Các lựa chọn hiện ra: 10, 7, 9, 8, 11

**Ví dụ 2**

- Nội dung câu hỏi: 💎 Tìm số tự nhiên NHỎ NHẤT lớn hơn 6 mà khi chia cho 4 và chia cho 6 đều dư 3.
- Gợi ý: Bớt đi số dư 3, số còn lại phải chia hết cho cả 4 và 6. BCNN(4, 6) = 12; vì cần số lớn hơn 6, đáp án nhỏ nhất là 12 + 3 = 15.
- Đáp án: **15**
- Các lựa chọn hiện ra: 18, 19, 15, 16, 17

**Ví dụ 3**

- Nội dung câu hỏi: 💎 Một số có hai chữ số, tổng hai chữ số bằng 9. Khi đảo vị trí hai chữ số, số mới bé hơn số cũ 45 đơn vị. Số ban đầu là bao nhiêu?
- Gợi ý: Gọi hai chữ số là a > b. Ta có a+b=9; hiệu số ban đầu và số đảo là 9×(a−b)=45, nên a−b=5. Giải hai điều kiện được a=7, b=2; số cần tìm là 72.
- Đáp án: **72**
- Các lựa chọn hiện ra: 69, 72, 73, 71, 70

### `singapore` — 🇸🇬 Singapore lớp 3

- **ID:** `singapore`
- **Chủ đề:** 🇸🇬 Singapore lớp 3
- **Hàm sinh:** `genSingapore3()` trong `src/scripts/games/adventure/questions.js`
- **Độ khó:** Tier 4

**Ví dụ 1 (sgKind: `lastDigit2023`)**

- Nội dung câu hỏi: Tìm chữ số tận cùng của tích 3×13×23×…×2023.
- Gợi ý: Dãy có (2023−3):10+1 = 203 thừa số, tất cả đều tận cùng bằng 3. Chữ số tận cùng cần tìm giống 3^203. Chu kỳ là 3, 9, 7, 1; 203 chia 4 dư 3 nên chữ số tận cùng là 7.
- Đáp án: **7**
- Các lựa chọn hiện ra: 10, 7, 6, 9, 8

**Ví dụ 2 (sgKind: `triangleBDE`)**

- Nội dung câu hỏi: Tam giác ABC có diện tích 60 cm². D thuộc BC sao cho BD = 2DC. E là trung điểm của AD. Tính diện tích tam giác BDE.
- Gợi ý: BD chiếm 2/3 cạnh BC nên S(ABD) = 2/3×60 = 40 cm². E là trung điểm AD, vì vậy DE = 1/2 AD. Hai tam giác BDE và BDA chung chiều cao từ B, nên S(BDE) = 1/2×40 = 20 cm².
- Đáp án: **20**
- Các lựa chọn hiện ra: 22, 21, 18, 19, 20

**Ví dụ 3 (sgKind: `calendarNextYear`)**

- Nội dung câu hỏi: Biết ngày 15/1/2024 là Thứ Tư. Hỏi đúng ngày 15/1/2025 là thứ mấy?
- Gợi ý: Từ hai ngày cùng ngày–tháng này cách nhau 366 ngày vì quãng thời gian này đi qua ngày 29/2. 366 chia 7 dư 2, nên dịch 2 ngày từ Thứ Tư → Thứ sáu.
- Đáp án: **Thứ sáu**
- Các lựa chọn hiện ra: Thứ tư, Thứ sáu, Thứ năm, Thứ hai, Thứ bảy

