# Ghi công dữ liệu bên thứ ba

## Nguồn tham khảo chuyên đề toán

Danh mục công khai trên MathX được dùng
để tham khảo cách phân nhóm chuyên đề (quy luật, dãy số, trồng cây, đếm, tính
ngược và IQ):

- https://mathx.vn/

MathX chỉ được dùng để tham khảo cách phân nhóm chuyên đề; không có nội dung
MathX nào được sao chép vào game. Ứng dụng không phân phối video hoặc phần luyện
tập yêu cầu đăng nhập. Câu hỏi trong mã được biên soạn từ đề do người dùng cung
cấp hoặc là biến thể sinh mới, kèm lời giải được kiểm chứng độc lập.

## Kho từ Anh–Việt

`src/assets/data/english-vocabulary.json` là dữ liệu phái sinh đã được lọc, rút
gọn nghĩa, loại trùng và phân cấp từ mục từ tiếng Anh của **Wiktionary tiếng
Việt**, qua bản trích xuất máy đọc được của **Kaikki/Wiktextract**. Snapshot đang
đóng gói dựa trên dump ngày 2026-08-04.

- Wiktionary tiếng Việt: https://vi.wiktionary.org/
- Kaikki/Wiktextract: https://kaikki.org/viwiktionary/
- Giấy phép dữ liệu: Creative Commons Attribution-ShareAlike 4.0 và GNU Free
  Documentation License, theo thông báo giấy phép của Wiktionary/Kaikki.
- CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/

Phần dữ liệu từ điển đã chỉnh sửa và phân phối trong tệp JSON tiếp tục được cung
cấp theo CC BY-SA 4.0. Điều này không thay đổi giấy phép của mã nguồn ứng dụng.

## Phân cấp tần suất

Ba cấp độ được suy ra bằng `wordfreq` 3.1.1. Dữ liệu wordfreq được phân phối theo
CC BY-SA 4.0; mã thư viện theo Apache-2.0.

- Robyn Speer (2022), *rspeer/wordfreq v3.0*, DOI:
  https://doi.org/10.5281/zenodo.7199437
- Dự án và danh sách nguồn: https://github.com/rspeer/wordfreq
- SUBTLEX là dữ liệu được cung cấp miễn phí; ghi công Marc Brysbaert, Boris New
  và các tác giả SUBTLEX được liệt kê trong tài liệu wordfreq.
- wordfreq cũng tổng hợp Google Books Ngrams, Leeds Internet Corpus, Wikipedia,
  ParaCrawl và OPUS OpenSubtitles; thông tin chi tiết nằm tại liên kết dự án.

## Bộ lọc nội dung nhạy cảm

Pipeline dùng danh sách tiếng Anh của **List of Dirty, Naughty, Obscene, and
Otherwise Bad Words** để loại mục không phù hợp với trẻ em.

- Copyright © 2012–2020 Shutterstock, Inc.
- Nguồn: https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
- Giấy phép: Creative Commons Attribution 4.0 International —
  https://creativecommons.org/licenses/by/4.0/
