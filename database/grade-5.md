# Ngân hàng câu hỏi — Khối 5 (tier 5 trong code)

> **Tài liệu tra cứu, không phải dữ liệu game đọc lúc chạy.** Đấu Trường Tư Duy sinh
> câu hỏi ngẫu nhiên bằng công thức trong `assets/js/question-bank.js`, không đọc từ file
> này. Các ví dụ dưới đây là **kết quả thật** lấy trực tiếp từ `genQuestion(5)` lúc
> game chạy trong trình duyệt (không phải tự bịa) — dùng để bạn xem/kiểm tra/mở rộng công
> thức sinh câu hỏi, đổi nội dung ở đây **không** làm game đổi theo.
>
> ⚠️ Mức bậc thầy — phân số/thập phân/phần trăm/vận tốc nâng cao, Tổng-Tỉ/Hiệu-Tỉ, học sinh giỏi dày đặc (khoảng lớp 5 trở lên). **Không phải thuần lớp 5** — phần lớn là ôn thi học sinh giỏi/Olympic, khó hơn chương trình đại trà lớp 5.

## Danh sách dạng câu hỏi (25 dạng)

| ID | Chủ đề | Hàm sinh |
|---|---|---|
| `frac` | ½ Phân số | `genFraction()` |
| `dec` | 🔢 Thập phân | `genDecimal()` |
| `pct` | 💯 Phần trăm | `genPercent()` |
| `geo5` | 📐 Hình nâng cao | `genGeo5()` |
| `speed` | 🚗 Vận tốc | `genSpeed()` |
| `world` | 🌍 Kinh điển | `genWorld()` |
| `visual` | 🎨 Nhìn hình | `genVisual()` |
| `numsense` | 🔟 Cảm nhận số | `genNumSense()` |
| `chance` | 🎲 Xác suất | `genChance()` |
| `sasmo` | 🏅 SASMO | `genSasmo()` |
| `imas` | 🌏 IMAS | `genImas()` |
| `amc` | 🎖️ AMC | `genAmc()` |
| `tdn` | 🎓 Trường chuyên | `genTDN()` |
| `olymp` | 🏅 Olympic | `genOlymp()` |
| `big` | 💯 Số lớn | `genBigNum()` |
| `word` | 📖 Toán đố | `genWord()` |
| `logic` | 🧠 Tư duy | `genLogic()` |
| `magic` | 🔮 Ô số ma thuật | `genMagic()` |
| `back` | ↩️ Suy luận ngược | `genBackwards()` |
| `combi` | 🤝 Đếm cách | `genCombi()` |
| `unit` | 📏 Đổi đơn vị | `genUnit()` |
| `bar` | 📊 Tổng-Tỉ/Hiệu-Tỉ | `genSumRatio()` |
| `hsg` | 🌟 Học sinh giỏi | `genHSG()` |
| `brain` | 💎 Thử thách mới | `genBrainChallenge()` |
| `singapore` | 🇸🇬 Singapore lớp 3 | `genSingapore3()` |

## Chi tiết từng dạng

### `frac` — ½ Phân số

- **ID:** `frac`
- **Chủ đề:** ½ Phân số
- **Hàm sinh:** `genFraction()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `dec` — 🔢 Thập phân

- **ID:** `dec`
- **Chủ đề:** 🔢 Thập phân
- **Hàm sinh:** `genDecimal()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: ➕ Tính: 1,3 + 1,6 = ?
- Gợi ý: Đặt tính sao cho dấu phẩy thẳng hàng rồi cộng như số tự nhiên: 1,3 + 1,6 = 2,9.
- Đáp án: **2,9**
- Các lựa chọn hiện ra: 2,9, 3,9, 1,9, 3,1

**Ví dụ 2**

- Nội dung câu hỏi: 🔄 Phân số 1/5 viết dưới dạng số thập phân là bao nhiêu?
- Gợi ý: Lấy tử chia mẫu: 1/5 = 0,2.
- Đáp án: **0,2**
- Các lựa chọn hiện ra: 0,3, 0,4, 0,2, 0,1

**Ví dụ 3**

- Nội dung câu hỏi: ➖ Tính: 6,5 − 4,2 = ?
- Gợi ý: Viết dấu phẩy thẳng cột rồi trừ như số tự nhiên: 6,5 − 4,2 = 2,3.
- Đáp án: **2,3**
- Các lựa chọn hiện ra: 2,3, 3,3, 1,3, 2,5

### `pct` — 💯 Phần trăm

- **ID:** `pct`
- **Chủ đề:** 💯 Phần trăm
- **Hàm sinh:** `genPercent()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 💯 Trường có 12 học sinh, trong đó 25% là học sinh giỏi. Hỏi có bao nhiêu học sinh giỏi?
- Gợi ý: 25% của 12 = 12 × 25 : 100 = 3 học sinh.
- Đáp án: **3**
- Các lựa chọn hiện ra: 7, 5, 4, 3, 6

**Ví dụ 2**

- Nội dung câu hỏi: 💯 Lớp có 50 bạn, trong đó 25 bạn đeo kính. Hỏi số bạn đeo kính chiếm bao nhiêu PHẦN TRĂM cả lớp?
- Gợi ý: Tỉ số phần trăm = 25 : 50 × 100 = 50%.
- Đáp án: **50**
- Các lựa chọn hiện ra: 50, 47, 48, 41, 49

**Ví dụ 3**

- Nội dung câu hỏi: 💯 Lớp có 50 bạn, trong đó 5 bạn đeo kính. Hỏi số bạn đeo kính chiếm bao nhiêu PHẦN TRĂM cả lớp?
- Gợi ý: Tỉ số phần trăm = 5 : 50 × 100 = 10%.
- Đáp án: **10**
- Các lựa chọn hiện ra: 11, 9, 10, 8, 7

### `geo5` — 📐 Hình nâng cao

- **ID:** `geo5`
- **Chủ đề:** 📐 Hình nâng cao
- **Hàm sinh:** `genGeo5()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 📐 Hình THANG có đáy bé 3 cm, đáy lớn 7 cm, chiều cao 8 cm. Tính diện tích (cm²).
- Gợi ý: Diện tích hình thang = (đáy bé + đáy lớn) × chiều cao : 2 = (3 + 7) × 8 : 2 = 40 cm².
- Đáp án: **40**
- Các lựa chọn hiện ra: 43, 48, 41, 42, 40

**Ví dụ 2**

- Nội dung câu hỏi: 📦 Hình HỘP CHỮ NHẬT dài 4 cm, rộng 4 cm, cao 4 cm. Tính THỂ TÍCH (cm³).
- Gợi ý: Thể tích hình hộp chữ nhật = dài × rộng × cao = 4 × 4 × 4 = 64 cm³.
- Đáp án: **64**
- Các lựa chọn hiện ra: 55, 61, 63, 64, 62

**Ví dụ 3**

- Nội dung câu hỏi: ⭕ Hình tròn có bán kính 7 cm. Hỏi ĐƯỜNG KÍNH dài bao nhiêu cm?
- Gợi ý: Đường kính = 2 × bán kính = 2 × 7 = 14 cm.
- Đáp án: **14**
- Các lựa chọn hiện ra: 13, 12, 11, 15, 14

### `speed` — 🚗 Vận tốc

- **ID:** `speed`
- **Chủ đề:** 🚗 Vận tốc
- **Hàm sinh:** `genSpeed()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🏍️🚗 Một xe máy xuất phát từ A với vận tốc 35 km/giờ. Đi được 3 giờ thì một ô tô cũng xuất phát từ A, đuổi theo cùng hướng với vận tốc 50 km/giờ. Hỏi sau bao nhiêu GIỜ (kể từ lúc ô tô xuất phát) thì ô tô đuổi kịp xe máy?
- Gợi ý: Khi ô tô xuất phát, xe máy đã đi trước 105 km (= 35 × 3). Mỗi giờ ô tô rút ngắn khoảng cách 15 km (= 50 − 35). Thời gian đuổi kịp = 105 : 15 = 7 giờ.
- Đáp án: **7**
- Các lựa chọn hiện ra: 9, 5, 7, 6, 8

**Ví dụ 2**

- Nội dung câu hỏi: 🚶 Đi bộ với vận tốc 8 km/giờ thì hết bao nhiêu GIỜ để đi được 32 km?
- Gợi ý: Thời gian = quãng đường : vận tốc = 32 : 8 = 4 giờ.
- Đáp án: **4**
- Các lựa chọn hiện ra: 6, 4, 5, 7, 3

**Ví dụ 3**

- Nội dung câu hỏi: 🚶 Đi bộ với vận tốc 5 km/giờ thì hết bao nhiêu GIỜ để đi được 10 km?
- Gợi ý: Thời gian = quãng đường : vận tốc = 10 : 5 = 2 giờ.
- Đáp án: **2**
- Các lựa chọn hiện ra: 2, 1, 4, 0, 3

### `world` — 🌍 Kinh điển

- **ID:** `world`
- **Chủ đề:** 🌍 Kinh điển
- **Hàm sinh:** `genWorld()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `visual` — 🎨 Nhìn hình

- **ID:** `visual`
- **Chủ đề:** 🎨 Nhìn hình
- **Hàm sinh:** `genVisual()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🎲 Trên con xúc xắc, tổng số chấm của HAI MẶT ĐỐI DIỆN luôn bằng 7. Hỏi mặt đối diện với mặt 4 chấm có mấy chấm?
- Gợi ý: Hai mặt đối diện cộng lại bằng 7, nên mặt đối diện với 4 là 7 − 4 = 3 chấm.
- Đáp án: **3**
- Các lựa chọn hiện ra: 6, 7, 4, 5, 3

**Ví dụ 2**

- Nội dung câu hỏi: 🪞 Hình chữ nhật ▭ có bao nhiêu TRỤC ĐỐI XỨNG (đường gấp đôi lại thì hai nửa trùng khít)?
- Gợi ý: Hình chữ nhật chỉ gấp được theo 2 đường giữa (ngang và dọc). Đường chéo KHÔNG phải trục đối xứng vì hai nửa không trùng khít → 2 trục.
- Đáp án: **2**
- Các lựa chọn hiện ra: 4, 3, 1, 2

### `numsense` — 🔟 Cảm nhận số

- **ID:** `numsense`
- **Chủ đề:** 🔟 Cảm nhận số
- **Hàm sinh:** `genNumSense()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🔎 Viết liền các số từ 1 đến 30. Hỏi chữ số 1 xuất hiện bao nhiêu lần?
- Gợi ý: Đếm ở hàng đơn vị: 1, 11, 21... Đếm ở hàng chục: 10–19 có 10 số đều bắt đầu bằng 1. Cộng lại được 13 lần.
- Đáp án: **13**
- Các lựa chọn hiện ra: 13, 12, 9, 10, 11

**Ví dụ 2**

- Nội dung câu hỏi: 🔁 Số nào đọc XUÔI hay đọc NGƯỢC cũng giống nhau (số đối xứng)?
- Gợi ý: 232 đọc ngược lại vẫn là 232 nên nó là số đối xứng (palindrome). Các số kia đọc ngược sẽ ra số khác.
- Đáp án: **232**
- Các lựa chọn hiện ra: 647, 462, 232, 921

### `chance` — 🎲 Xác suất

- **ID:** `chance`
- **Chủ đề:** 🎲 Xác suất
- **Hàm sinh:** `genChance()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🎡 Vòng quay may mắn chia thành 4 ô bằng nhau, trong đó 2 ô màu đỏ. Nếu quay 4 lần thì TRUNG BÌNH kim dừng ở ô đỏ mấy lần?
- Gợi ý: Mỗi lần quay, cơ hội trúng ô đỏ là 2 phần 4. Quay 4 lần thì trung bình trúng đỏ 2 lần.
- Đáp án: **2**
- Các lựa chọn hiện ra: 2, 1, 4, 3, 0

### `sasmo` — 🏅 SASMO

- **ID:** `sasmo`
- **Chủ đề:** 🏅 SASMO
- **Hàm sinh:** `genSasmo()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🧦 Trong ngăn kéo tối om có rất nhiều tất màu đỏ và màu xanh lẫn lộn. Không nhìn thấy gì, phải lấy ra ít nhất bao nhiêu chiếc để CHẮC CHẮN có 1 đôi cùng màu?
- Gợi ý: Có 2 màu. Lấy 2 chiếc có thể ra 2 màu khác nhau. Nhưng lấy 3 chiếc thì chắc chắn có 2 chiếc trùng màu → cần 3 chiếc.
- Đáp án: **3**
- Các lựa chọn hiện ra: 4, 3, 2, 5, 1

### `imas` — 🌏 IMAS

- **ID:** `imas`
- **Chủ đề:** 🌏 IMAS
- **Hàm sinh:** `genImas()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 📊 3 bạn hái được lần lượt 13, 12, 8 bông hoa 🌸. Hỏi TRUNG BÌNH mỗi bạn hái được bao nhiêu bông?
- Gợi ý: Tổng = 13 + 12 + 8 = 33. Trung bình = 33 : 3 = 11 bông.
- Đáp án: **11**
- Các lựa chọn hiện ra: 5, 8, 9, 11, 10

**Ví dụ 2**

- Nội dung câu hỏi: 🔷 Hình thứ 1 có 2 chấm, hình thứ 2 có 4 chấm, hình thứ 3 có 6 chấm... (mỗi hình thêm 2 chấm). Hỏi hình thứ 8 có bao nhiêu chấm?
- Gợi ý: Từ hình 1 đến hình 8 tăng 7 lần, mỗi lần 2 chấm: 2 + 7×2 = 16 chấm.
- Đáp án: **16**
- Các lựa chọn hiện ra: 17, 15, 18, 16, 14

**Ví dụ 3**

- Nội dung câu hỏi: 🚶 Bạn Nam đi bộ mỗi giờ được 3 km. Hỏi 2 giờ bạn đi được bao nhiêu km?
- Gợi ý: Quãng đường = vận tốc × thời gian = 3 × 2 = 6 km.
- Đáp án: **6**
- Các lựa chọn hiện ra: 5, 1, 6, 4, 3

### `amc` — 🎖️ AMC

- **ID:** `amc`
- **Chủ đề:** 🎖️ AMC
- **Hàm sinh:** `genAmc()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `tdn` — 🎓 Trường chuyên

- **ID:** `tdn`
- **Chủ đề:** 🎓 Trường chuyên
- **Hàm sinh:** `genTDN()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🎓 Một ca nô xuôi dòng từ A đến B dài 128 km hết 8 giờ, rồi ngược dòng từ B về A hết 16 giờ. Hỏi vận tốc DÒNG NƯỚC là bao nhiêu km/giờ?
- Gợi ý: Vận tốc xuôi dòng = 128 : 8 = 16 km/giờ. Vận tốc ngược dòng = 128 : 16 = 8 km/giờ. Vận tốc dòng nước = (vận tốc xuôi − vận tốc ngược) : 2 = (16 − 8) : 2 = 4 km/giờ.
- Đáp án: **4**
- Các lựa chọn hiện ra: 3, 6, 5, 4, 7

**Ví dụ 2**

- Nội dung câu hỏi: 🎓 Hiện nay bố hơn con 12 tuổi. Cách đây 10 năm, tuổi bố gấp 4 lần tuổi con. Hỏi năm nay con bao nhiêu tuổi?
- Gợi ý: Hiệu tuổi hai bố con LUÔN không đổi = 12. Cách đây 10 năm, bố gấp 4 lần con nên hiệu đó ứng với 3 phần tuổi con lúc đó: tuổi con lúc đó = 12 : 3 = 4. Vậy con hiện nay: 4 + 10 = 14 tuổi.
- Đáp án: **14**
- Các lựa chọn hiện ra: 15, 11, 13, 12, 14

**Ví dụ 3**

- Nội dung câu hỏi: 🎓 Hiện nay bố hơn con 16 tuổi. Cách đây 8 năm, tuổi bố gấp 5 lần tuổi con. Hỏi năm nay con bao nhiêu tuổi?
- Gợi ý: Hiệu tuổi hai bố con LUÔN không đổi = 16. Cách đây 8 năm, bố gấp 5 lần con nên hiệu đó ứng với 4 phần tuổi con lúc đó: tuổi con lúc đó = 16 : 4 = 4. Vậy con hiện nay: 4 + 8 = 12 tuổi.
- Đáp án: **12**
- Các lựa chọn hiện ra: 14, 13, 12, 10, 11

### `olymp` — 🏅 Olympic

- **ID:** `olymp`
- **Chủ đề:** 🏅 Olympic
- **Hàm sinh:** `genOlymp()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🐔🐄 Trong sân có gà và bò. Đếm được 9 cái ĐẦU và 30 cái CHÂN. Hỏi có bao nhiêu con GÀ?
- Gợi ý: Giả sử cả 9 con đều là bò thì có 36 chân — thừa 6 chân. Mỗi con gà ít hơn bò 2 chân, nên số gà = 6 : 2 = 3.
- Đáp án: **3**
- Các lựa chọn hiện ra: 2, 3, 4, 1, 5

### `big` — 💯 Số lớn

- **ID:** `big`
- **Chủ đề:** 💯 Số lớn
- **Hàm sinh:** `genBigNum()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: Tính nhanh: 60 + 431 + 40 = ?
- Gợi ý: Mẹo: ghép 60 + 40 = 100 trước, rồi 100 + 431 = 531. Tìm cặp số tròn trăm là tính siêu nhanh!
- Đáp án: **531**
- Các lựa chọn hiện ra: 540, 531, 532, 533, 534

**Ví dụ 2**

- Nội dung câu hỏi: 7046 − 1988 = ?
- Gợi ý: Trừ từng hàng từ phải sang trái, nhớ mượn khi cần: 7046 − 1988 = 5058.
- Đáp án: **5058**
- Các lựa chọn hiện ra: 5055, 5058, 5049, 5056, 5057

**Ví dụ 3**

- Nội dung câu hỏi: 422 + 357 − 226 = ?
- Gợi ý: Tính từ trái sang phải: 422 + 357 = 779, rồi 779 − 226 = 553.
- Đáp án: **553**
- Các lựa chọn hiện ra: 554, 555, 553, 556, 562

### `word` — 📖 Toán đố

- **ID:** `word`
- **Chủ đề:** 📖 Toán đố
- **Hàm sinh:** `genWord()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

_(Không lấy được ví dụ mẫu ở đợt sinh này — dạng vẫn tồn tại trong pool, thử chạy lại script lấy mẫu.)_

### `logic` — 🧠 Tư duy

- **ID:** `logic`
- **Chủ đề:** 🧠 Tư duy
- **Hàm sinh:** `genLogic()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🧱 Viên gạch nặng bằng 3 kg cộng thêm NỬA viên gạch. Hỏi viên gạch nặng bao nhiêu kg?
- Gợi ý: NỬA viên gạch nặng đúng 3 kg (vì cả viên = 3 kg + nửa viên). Vậy cả viên = 3×2 = 6 kg.
- Đáp án: **6**
- Các lựa chọn hiện ra: 6, 5, 0, 4, 3

### `magic` — 🔮 Ô số ma thuật

- **ID:** `magic`
- **Chủ đề:** 🔮 Ô số ma thuật
- **Hàm sinh:** `genMagic()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: Ô số ma thuật: tổng mỗi hàng, mỗi cột, mỗi đường chéo đều bằng 33. Số ở ô ❓ là mấy?
- Gợi ý: Hàng chứa ô ❓ đã có 10 và 12. Vậy ❓ = 33 − 10 − 12 = 11.
- Đáp án: **11**
- Các lựa chọn hiện ra: 10, 12, 11, 9, 13

### `back` — ↩️ Suy luận ngược

- **ID:** `back`
- **Chủ đề:** ↩️ Suy luận ngược
- **Hàm sinh:** `genBackwards()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🎩 Nhà ảo thuật nghĩ ra một số. Ông nhân với 3, trừ đi 1, rồi lại nhân với 3 thì được 42. Hỏi số ban đầu là mấy?
- Gợi ý: Đi ngược từng bước: 42 : 3 = 14 → cộng 1 được 15 → chia 3 được 5.
- Đáp án: **5**
- Các lựa chọn hiện ra: 5, 2, 3, 6, 4

### `combi` — 🤝 Đếm cách

- **ID:** `combi`
- **Chủ đề:** 🤝 Đếm cách
- **Hàm sinh:** `genCombi()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🤝 Có 3 bạn nhỏ, mỗi bạn bắt tay TẤT CẢ các bạn còn lại đúng 1 lần. Hỏi có tất cả bao nhiêu cái bắt tay?
- Gợi ý: Mỗi bạn bắt tay 2 bạn khác: 3 × 2 = 6. Nhưng mỗi cái bắt tay bị đếm 2 lần, nên chia 2: 3.
- Đáp án: **3**
- Các lựa chọn hiện ra: 5, 1, 4, 2, 3

### `unit` — 📏 Đổi đơn vị

- **ID:** `unit`
- **Chủ đề:** 📏 Đổi đơn vị
- **Hàm sinh:** `genUnit()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 📏 Đổi: 11 m = ? mm
- Gợi ý: 1 m = 1000 mm, nên 11 m = 11 × 1000 = 11000 mm.
- Đáp án: **11000**
- Các lựa chọn hiện ra: 10997, 10999, 10991, 11000, 10998

**Ví dụ 2**

- Nội dung câu hỏi: 📏 Đổi: 21 ngày = ? tuần
- Gợi ý: 7 ngày = 1 tuần, nên 21 ngày = 21 : 7 = 3 tuần.
- Đáp án: **3**
- Các lựa chọn hiện ra: 5, 2, 1, 4, 3

**Ví dụ 3**

- Nội dung câu hỏi: 📏 Đổi: 9 kg = ? hg
- Gợi ý: 1 kg = 10 hg, nên 9 kg = 9 × 10 = 90 hg.
- Đáp án: **90**
- Các lựa chọn hiện ra: 92, 89, 88, 91, 90

### `bar` — 📊 Tổng-Tỉ/Hiệu-Tỉ

- **ID:** `bar`
- **Chủ đề:** 📊 Tổng-Tỉ/Hiệu-Tỉ
- **Hàm sinh:** `genSumRatio()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 📊 Chi có nhiều hơn An 3 viên bi. Tỉ số giữa số bi của An và Chi là 4 : 5. Hỏi bạn Chi có bao nhiêu viên bi?
- Gợi ý: Hiệu số phần bằng nhau: 5 − 4 = 1 phần. Giá trị 1 phần = 3 : 1 = 3. Số bi của An = 3×4 = 12, của Chi = 3×5 = 15.
- Đáp án: **15**
- Các lựa chọn hiện ra: 15, 17, 18, 21, 16

**Ví dụ 2**

- Nội dung câu hỏi: 📊 Dũng và Chi có tổng cộng 24 viên bi. Tỉ số giữa số bi của Dũng và Chi là 3 : 5 (Dũng có ít hơn). Hỏi bạn Dũng có bao nhiêu viên bi?
- Gợi ý: Tổng số phần bằng nhau: 3 + 5 = 8 phần. Giá trị 1 phần = 24 : 8 = 3. Số bi của Dũng = 3×3 = 9, của Chi = 3×5 = 15.
- Đáp án: **9**
- Các lựa chọn hiện ra: 10, 9, 12, 11, 15

**Ví dụ 3**

- Nội dung câu hỏi: 📊 An và Bình có tổng cộng 35 viên bi. Tỉ số giữa số bi của An và Bình là 1 : 4 (An có ít hơn). Hỏi bạn An có bao nhiêu viên bi?
- Gợi ý: Tổng số phần bằng nhau: 1 + 4 = 5 phần. Giá trị 1 phần = 35 : 5 = 7. Số bi của An = 7×1 = 7, của Bình = 7×4 = 28.
- Đáp án: **7**
- Các lựa chọn hiện ra: 7, 9, 8, 10, 14

### `hsg` — 🌟 Học sinh giỏi

- **ID:** `hsg`
- **Chủ đề:** 🌟 Học sinh giỏi
- **Hàm sinh:** `genHSG()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 🌟 Tìm số tự nhiên nhỏ nhất khác 0 mà chia hết cho CẢ 5, 3 và 2.
- Gợi ý: Đây là bài toán tìm BỘI CHUNG NHỎ NHẤT (BCNN). BCNN(5, 3) = 15. Rồi BCNN(15, 2) = 30. Vậy số cần tìm là 30.
- Đáp án: **30**
- Các lựa chọn hiện ra: 29, 30, 31, 32, 33

**Ví dụ 2**

- Nội dung câu hỏi: 🌟📐 Tam giác ABC có diện tích 16 cm². Trên cạnh BC lấy điểm M sao cho BM = 1/2 BC. Tính diện tích tam giác ABM.
- Gợi ý: Tam giác ABM và ABC có CHUNG đường cao hạ từ đỉnh A xuống đường thẳng BC, nên diện tích tỉ lệ thuận với độ dài đáy: S(ABM) : S(ABC) = BM : BC = 1 : 2. Vậy S(ABM) = 16 × 1/2 = 8 cm².
- Đáp án: **8**
- Các lựa chọn hiện ra: 8, 10, 6, 7, 9

**Ví dụ 3**

- Nội dung câu hỏi: 🌟📐 Hình vuông ABCD cạnh 16 cm. Nối các trung điểm của 4 cạnh liên tiếp để tạo thành hình vuông MNPQ nằm bên trong (xoay 45°). Tính diện tích hình vuông MNPQ.
- Gợi ý: Diện tích hình vuông lớn = 16 × 16 = 256 cm². Tính chất đẹp: khi nối trung điểm 4 cạnh của một hình vuông, hình vuông tạo thành luôn có diện tích bằng ĐÚNG MỘT NỬA hình vuông ban đầu: 256 : 2 = 128 cm².
- Đáp án: **128**
- Các lựa chọn hiện ra: 137, 131, 128, 129, 130

### `brain` — 💎 Thử thách mới

- **ID:** `brain`
- **Chủ đề:** 💎 Thử thách mới
- **Hàm sinh:** `genBrainChallenge()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1**

- Nội dung câu hỏi: 💎 Trong một nhóm: 13 bạn học cờ, 16 bạn học nhạc, 14 bạn học vẽ; có 4 bạn học cả cờ–nhạc, 5 bạn học cả cờ–vẽ, 5 bạn học cả nhạc–vẽ và 1 bạn học CẢ BA. Có bao nhiêu bạn học ít nhất một môn?
- Gợi ý: Dùng nguyên lý bao hàm–loại trừ: 13+16+14 − 4−5−5 + 1 = 30. Cộng lại phần học cả ba vì phần đó đã bị trừ thừa một lần.
- Đáp án: **30**
- Các lựa chọn hiện ra: 29, 30, 24, 27, 28

**Ví dụ 2**

- Nội dung câu hỏi: 💎 Tìm số nguyên dương nhỏ nhất n sao cho chia n cho 4 dư 3, chia cho 5 dư 4, và chia cho 9 dư 8.
- Gợi ý: Cả ba điều kiện đều nói n + 1 chia hết cho 4, 5 và 9. BCNN(4, 5, 9) = 180, nên giá trị nhỏ nhất là n = 180 − 1 = 179.
- Đáp án: **179**
- Các lựa chọn hiện ra: 170, 176, 178, 179, 177

### `singapore` — 🇸🇬 Singapore lớp 3

- **ID:** `singapore`
- **Chủ đề:** 🇸🇬 Singapore lớp 3
- **Hàm sinh:** `genSingapore3()` trong `assets/js/question-bank.js`
- **Độ khó:** Tier 5

**Ví dụ 1 (sgKind: `rectangleIntersection`)**

- Nội dung câu hỏi: Hình chữ nhật ABCD có diện tích 72 cm². M thuộc AB với AM = 2MB; N thuộc AD với AN = 2ND. BN cắt DM tại P. Tính diện tích tam giác AMP.
- Gợi ý: Đặt AB=3a, AD=3d nên 9ad=72. Từ hai đường thẳng BN và DM suy ra P cách AB một đoạn bằng 2/5 AD = 6d/5. Do AM=2a, S(AMP)=1/2×2a×6d/5 = 6ad/5. Vì ad=8 nên diện tích là 48/5 = 9,6 cm².
- Đáp án: **9,6**
- Các lựa chọn hiện ra: 12, 9,6, 8, 19,2, 14,4

**Ví dụ 2 (sgKind: `lastDigit2023`)**

- Nội dung câu hỏi: Tìm chữ số tận cùng của tích 3×13×23×…×2023.
- Gợi ý: Dãy có (2023−3):10+1 = 203 thừa số, tất cả đều tận cùng bằng 3. Chữ số tận cùng cần tìm giống 3^203. Chu kỳ là 3, 9, 7, 1; 203 chia 4 dư 3 nên chữ số tận cùng là 7.
- Đáp án: **7**
- Các lựa chọn hiện ra: 9, 7, 5, 8, 6

**Ví dụ 3 (sgKind: `rectangleIntersection`)**

- Nội dung câu hỏi: Hình chữ nhật ABCD có diện tích 72 cm². M thuộc AB với AM = 2MB; N thuộc AD với AN = 2ND. BN cắt DM tại P. Tính diện tích tam giác AMP.
- Gợi ý: Đặt AB=3a, AD=3d nên 9ad=72. Từ hai đường thẳng BN và DM suy ra P cách AB một đoạn bằng 2/5 AD = 6d/5. Do AM=2a, S(AMP)=1/2×2a×6d/5 = 6ad/5. Vì ad=8 nên diện tích là 48/5 = 9,6 cm².
- Đáp án: **9,6**
- Các lựa chọn hiện ra: 12, 9,6, 8, 14,4, 19,2

