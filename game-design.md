# Thiết kế nhân vật — Đấu Trường Tư Duy

Tài liệu này chỉ nói về **dàn nhân vật** (20 con) và cách vẽ chúng. Luật chơi,
số máu, số câu hỏi không đổi.

## 1. Vấn đề

Hai mươi nhân vật đều có **tên riêng rất cụ thể** — Ốc Sên, Zombie, Khủng Long,
Ma Cà Rồng, Rồng Băng, Vua Quái Vật, Pháp Sư, Bạch Tuộc, Sâu Chữ Cái, Dơi, Rắn,
Bọ Cạp, Mực… — nhưng **tất cả cùng một hình vẽ**: một khối tròn có sừng, chỉ khác
bảng màu. Tên hứa một đằng, hình vẽ một nẻo.

Khuôn `#tplBeast` đã có sẵn 10 nhóm bộ phận `<g class="bp bp-*">` và `main.css`
đã có sẵn luật `.p-wings .bp-wings{display:inline}`… **nhưng không dòng mã nào
gắn class `p-*` lên hình**. `applySkin()` chỉ đặt ba biến màu. Toàn bộ hệ bộ phận
là **mã chết** kể từ khi được thêm vào.

## 2. Nguyên tắc thiết kế

1. **MỘT khuôn vẽ duy nhất.** Không vẽ tay 20 con. Mỗi con = khuôn + bảng màu +
   danh sách bộ phận. Sửa khuôn một lần, cả 20 con cùng đẹp lên.
2. **Bóng dáng nói trước, chữ nói sau.** Nhìn bóng đen của nhân vật phải đoán
   được tên nó. Ốc sên có vỏ và mắt cuống; bạch tuộc có xúc tu; ma không có chân.
3. **Bóng dáng báo trước lối đánh.** Trẻ chưa đọc kịp `mechTxt` vẫn phải thấy
   nguy hiểm: giáp → vảy lưng, hút máu → nanh, cuồng nộ → sừng, hồi máu → mũ/gậy
   phù thuỷ.
4. **Độ khó tăng thì hình cũng "nặng" thêm.** Cấp 1–2 mềm, không sừng. Cấp 3–4
   mọc nanh, vảy, cánh. Cấp 5 đội vương miện, khoác áo choàng, cầm gậy.

## 3. Từ vựng bộ phận (18)

| Nhóm | Bộ phận | Dùng cho |
|---|---|---|
| Sau lưng | `cape` áo choàng | vua, phù thuỷ, ma cà rồng, chúa tể |
| | `wings` cánh | rồng, dơi, ma cà rồng |
| | `tail` đuôi | rồng, khủng long |
| | `shell` vỏ | ốc sên |
| | `plates` vảy lưng | giáp — khủng long, rồng băng |
| | `stinger` ngòi độc | bọ cạp |
| Trên đầu | `stalks` mắt cuống | ốc sên |
| | `antennae` râu | sâu, quái nhí, rô-bốt |
| | `ears` tai dơi | dơi, ma cà rồng |
| Thay chân | `tentacles` xúc tu | bạch tuộc, mực |
| | `ghost` tà áo ma | ma |
| | `coil` thân cuộn | rắn, sâu |
| Phía trước | `fangs` nanh | hút máu, quỷ, zombie |
| | `stitches` vết khâu | zombie |
| | `claws` càng | bọ cạp |
| | `crown` vương miện | vua, chúa tể |
| | `hat` mũ chóp | phù thuỷ |
| | `staff` gậy phép | phù thuỷ |

Quy tắc loại trừ (CSS lo): có `tentacles`/`ghost`/`coil` thì **giấu chân**; có
`fangs` thì giấu hai răng thường; có `hat` thì giấu sừng và gai; có
`stalks`/`ears`/`antennae` thì giấu gai lưng (chỗ trên đầu đã có người ngồi).

## 4. Dàn 10 boss Đấu Toán

| # | Tên | Bộ phận | Lối đánh → tín hiệu hình |
|---|---|---|---|
| 1 | Ốc Sên Chậm Chạp | `shell` `stalks` | thường — không sừng, mềm |
| 2 | Quái Nhí Tinh Nghịch | `antennae` | thường — nhỏ, râu ngọ nguậy |
| 3 | Zombie Lười Học | `stitches` `fangs` | hồi máu — vết khâu tự lành |
| 4 | Khủng Long Giáp Sắt | `plates` `tail` `fangs` | giáp — vảy lưng |
| 5 | Quỷ Đỏ Nóng Tính | `fangs` + sừng | cuồng nộ — sừng |
| 6 | Ma Cà Rồng Toán Học | `wings` `ears` `fangs` `cape` | hút máu — nanh dài |
| 7 | Rồng Băng Vĩnh Cửu | `wings` `tail` `plates` | giáp — vảy băng |
| 8 | Vua Quái Vật Tối Thượng | `crown` `cape` `fangs` + sừng | cuồng nộ — vương miện |
| 9 | Pháp Sư Phân Số | `hat` `staff` `cape` | hồi máu — gậy phép |
| 10 | Bạch Tuộc Vô Cực | `tentacles` `fangs` | hút máu — tám xúc tu |

## 5. Dàn 10 chặng Gõ Chữ

| # | Tên | Bộ phận |
|---|---|---|
| 1 | Sâu Chữ Cái | `antennae` `coil` |
| 2 | Ma Gõ Nhầm | `ghost` |
| 3 | Dơi Lạc Phím | `wings` `ears` `fangs` |
| 4 | Rắn Chính Tả | `coil` `fangs` |
| 5 | Bọ Cạp Dấu Thanh | `stinger` `claws` |
| 6 | Mực Ngữ Pháp | `tentacles` |
| 7 | Rồng Con Từ Vựng | `wings` `tail` |
| 8 | Quỷ Tốc Độ | `fangs` `plates` |
| 9 | Rồng Ngôn Ngữ | `wings` `tail` `plates` `fangs` |
| 10 | Chúa Tể Bàn Phím | `crown` `cape` `wings` `fangs` |

## 6. Quái thường Gõ Chữ (8)

Trước đây `emoji` và `skin` bốc ngẫu nhiên **độc lập nhau**, nên một con hiện
emoji 👻 mà hình lại là khối tím có sừng. Nay `skin` quyết định **cả hai**: 8 bộ
skin tương ứng đúng 8 loại 👾 👻 🦠 🤖 🧟 🦇 🐙 👹.

## 7. Miêu tả nhân vật

Mỗi boss thêm trường `desc` — một câu giới thiệu tính cách, hiện ở màn
"BOSS XUẤT HIỆN". Câu chữ phải nhắc đúng thứ trẻ **nhìn thấy** trên hình
(vỏ ốc, vết khâu, xúc tu…), nếu không lại rơi vào đúng lỗi cũ.

Mỗi chặng Gõ Chữ thêm `desc` đưa vào `title` + `aria-label` của thẻ chặng —
không thêm dòng chữ nào lên thẻ, để 5 chặng vẫn gói gọn trong khung 1366×768
(assertion của `browser-smoke.mjs`).

## 8. Kiến trúc

- **DOM + SVG**, không canvas: nhân vật nằm chung luồng bố cục với chữ, ăn theo
  `font-size`, và CSS animate được từng bộ phận (chớp mắt, đung đưa tay).
- **Không thêm tệp script** → không phải sửa thứ tự nạp trong `index.html` và
  `CORE_ASSETS` trong `sw.js`.
- **Không thêm trạng thái**: `parts` là dữ liệu vẽ thuần tuý.
- `applySkin(el, art)` là **cửa duy nhất** đặt màu + bộ phận. Bản đồ, màn giới
  thiệu, sàn đấu và Gõ Chữ đều đi qua nó, nên không thể lệch nhau.
