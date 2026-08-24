# Ngân hàng câu hỏi — tài liệu tra cứu

Thư mục này **không được game đọc lúc chạy**. Đấu Trường Tư Duy sinh câu hỏi bằng công
thức ngẫu nhiên trong [`assets/js/question-bank.js`](../assets/js/question-bank.js)
(`genQuestion(tier)`, tier 1–5), không có danh sách câu hỏi cố định nào để "tách ra" theo
nghĩa đen. Các file `.md` ở đây là **catalog tra cứu**: với mỗi tier, liệt kê mọi *dạng*
câu hỏi (generator) đang chạy ở tier đó, kèm 1–3 ví dụ **thật** — lấy trực tiếp từ
`genQuestion()` khi game chạy trong trình duyệt, không phải tự viết tay.

## Dùng để làm gì

- Xem nhanh một tier có những dạng bài nào mà không phải đọc 1.900+ dòng
  `question-bank.js`.
- Tra chủ đề/độ khó của một `type` cụ thể khi cần chỉnh sửa hoặc thêm bớt trọng số trong
  pool của `genQuestion()`.
- Tham khảo văn phong ra đề (câu hỏi + lời giải ngắn) khi muốn viết thêm dạng mới.

## Không dùng để làm gì

- **Không sửa các file này để đổi nội dung game** — mọi thay đổi ở đây không ảnh hưởng
  gì tới `genQuestion()`. Muốn đổi câu hỏi thật sự phải sửa hàm `gen*` tương ứng trong
  `assets/js/question-bank.js`.
- Không phải danh sách đầy đủ — mỗi dạng sinh vô số biến thể ngẫu nhiên, ví dụ trong đây
  chỉ là 1–3 lần "bốc thăm" tại thời điểm tạo tài liệu.

## Tier ≠ khối lớp thực tế

Tier trong code là **độ khó**, không phải khối lớp chương trình phổ thông. Tier 1–3 khá
sát lớp 1–4, nhưng **tier 4–5 trộn cả nội dung ôn thi học sinh giỏi/Olympic** (SASMO,
IMAS, AMC, trường chuyên...), khó hơn hẳn chương trình đại trà cùng khối lớp. Ánh xạ
`grade-N.md` ↔ tier N ở đây chỉ để đặt tên file cho dễ tra, không phải tuyên bố "đây
đúng là đề lớp N".

## Cập nhật lại catalog

Vì nội dung là *mẫu ngẫu nhiên*, muốn lấy bộ ví dụ mới (đa dạng hơn) thì chạy lại
`genQuestion(tier)` nhiều lần trong console DevTools (`npm run serve` rồi mở trang, gõ
`genQuestion(1)` — mỗi tier có sẵn trên `window`) và cập nhật tay vào file tương ứng.
Repo không có script cố định cho việc này vì đây là tài liệu tham khảo, không phải asset
được kiểm tra bởi `npm test`.

## Danh sách file

| File | Tier | Số dạng câu hỏi |
|---|---|---|
| [grade-1.md](grade-1.md) | 1 — Khởi Động | 20 |
| [grade-2.md](grade-2.md) | 2 — Thử Thách | 24 |
| [grade-3.md](grade-3.md) | 3 — Cao Thủ | 28 |
| [grade-4.md](grade-4.md) | 4 — Huyền Thoại | 31 |
| [grade-5.md](grade-5.md) | 5 — Bậc Thầy | 25 |
