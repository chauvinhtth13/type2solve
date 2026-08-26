/*
 * Nội dung cho Gõ Chữ Diệt Quái.
 *
 * `level` dùng để mở dần từ/cụm từ khó hơn qua từng đợt. Tách dữ liệu khỏi
 * engine giúp giáo viên hoặc phụ huynh có thể bổ sung bài mới mà không phải
 * đụng vào cơ chế trò chơi.
 */
(function exposeTypingContent(global) {
  'use strict';

  const CAMPAIGN_PER_WAVE = Object.freeze({ min: 10, max: 50 });

  const content = {
    englishDictionary: {
      url: 'assets/data/english-vocabulary.json',
      minimumEntries: 80000
    },

    en: [
      { text: 'book', meaning: 'quyển sách', level: 1, topic: 'Đồ vật' },
      { text: 'pen', meaning: 'bút mực', level: 1, topic: 'Đồ vật' },
      { text: 'desk', meaning: 'bàn học', level: 1, topic: 'Đồ vật' },
      { text: 'school', meaning: 'trường học', level: 1, topic: 'Trường lớp' },
      { text: 'friend', meaning: 'người bạn', level: 1, topic: 'Con người' },
      { text: 'teacher', meaning: 'giáo viên', level: 1, topic: 'Trường lớp' },
      { text: 'family', meaning: 'gia đình', level: 1, topic: 'Con người' },
      { text: 'water', meaning: 'nước', level: 1, topic: 'Thiên nhiên' },
      { text: 'green', meaning: 'màu xanh lá', level: 1, topic: 'Màu sắc' },
      { text: 'happy', meaning: 'vui vẻ', level: 1, topic: 'Cảm xúc' },
      { text: 'music', meaning: 'âm nhạc', level: 1, topic: 'Nghệ thuật' },
      { text: 'planet', meaning: 'hành tinh', level: 1, topic: 'Khoa học' },
      { text: 'rabbit', meaning: 'con thỏ', level: 1, topic: 'Động vật' },
      { text: 'garden', meaning: 'khu vườn', level: 1, topic: 'Thiên nhiên' },
      { text: 'window', meaning: 'cửa sổ', level: 1, topic: 'Đồ vật' },
      { text: 'morning', meaning: 'buổi sáng', level: 2, topic: 'Thời gian' },
      { text: 'language', meaning: 'ngôn ngữ', level: 2, topic: 'Học tập' },
      { text: 'question', meaning: 'câu hỏi', level: 2, topic: 'Học tập' },
      { text: 'answer', meaning: 'câu trả lời', level: 2, topic: 'Học tập' },
      { text: 'science', meaning: 'khoa học', level: 2, topic: 'Học tập' },
      { text: 'discover', meaning: 'khám phá', level: 2, topic: 'Kỹ năng' },
      { text: 'imagine', meaning: 'tưởng tượng', level: 2, topic: 'Kỹ năng' },
      { text: 'practice', meaning: 'luyện tập', level: 2, topic: 'Kỹ năng' },
      { text: 'careful', meaning: 'cẩn thận', level: 2, topic: 'Phẩm chất' },
      { text: 'brave', meaning: 'dũng cảm', level: 2, topic: 'Phẩm chất' },
      { text: 'curious', meaning: 'ham tìm hiểu', level: 2, topic: 'Phẩm chất' },
      { text: 'healthy', meaning: 'khỏe mạnh', level: 2, topic: 'Sức khỏe' },
      { text: 'library', meaning: 'thư viện', level: 2, topic: 'Trường lớp' },
      { text: 'computer', meaning: 'máy tính', level: 2, topic: 'Công nghệ' },
      { text: 'adventure', meaning: 'cuộc phiêu lưu', level: 2, topic: 'Khám phá' },
      { text: 'knowledge', meaning: 'kiến thức', level: 3, topic: 'Học tập' },
      { text: 'challenge', meaning: 'thử thách', level: 3, topic: 'Kỹ năng' },
      { text: 'creative', meaning: 'sáng tạo', level: 3, topic: 'Phẩm chất' },
      { text: 'excellent', meaning: 'xuất sắc', level: 3, topic: 'Phẩm chất' },
      { text: 'remember', meaning: 'ghi nhớ', level: 3, topic: 'Kỹ năng' },
      { text: 'solution', meaning: 'giải pháp', level: 3, topic: 'Tư duy' },
      { text: 'keyboard', meaning: 'bàn phím', level: 3, topic: 'Công nghệ' },
      { text: 'important', meaning: 'quan trọng', level: 3, topic: 'Từ vựng' },
      { text: 'wonderful', meaning: 'tuyệt vời', level: 3, topic: 'Cảm xúc' },
      { text: 'education', meaning: 'giáo dục', level: 3, topic: 'Học tập' },
      { text: 'confidence', meaning: 'sự tự tin', level: 3, topic: 'Phẩm chất' },
      { text: 'environment', meaning: 'môi trường', level: 3, topic: 'Thiên nhiên' },
      { text: 'experiment', meaning: 'thí nghiệm', level: 3, topic: 'Khoa học' },
      { text: 'perseverance', meaning: 'sự kiên trì', level: 3, topic: 'Phẩm chất' },
      { text: 'responsibility', meaning: 'trách nhiệm', level: 3, topic: 'Phẩm chất' }
    ],

    vi: [
      { text: 'chăm học', meaning: 'Giữ nhịp đều và gõ đúng dấu.', level: 1, topic: 'Phẩm chất' },
      { text: 'vui vẻ', meaning: 'Chú ý hai dấu hỏi trong cụm từ.', level: 1, topic: 'Cảm xúc' },
      { text: 'bạn tốt', meaning: 'Gõ khoảng trắng như một ký tự.', level: 1, topic: 'Tình bạn' },
      { text: 'đọc sách', meaning: 'Phân biệt chữ đ và chữ d.', level: 1, topic: 'Học tập' },
      { text: 'lớp học', meaning: 'Chú ý dấu sắc và dấu nặng.', level: 1, topic: 'Trường lớp' },
      { text: 'mùa hè', meaning: 'Một cụm từ về thời gian.', level: 1, topic: 'Thời gian' },
      { text: 'bầu trời', meaning: 'Gõ đúng â, ơ và dấu huyền.', level: 1, topic: 'Thiên nhiên' },
      { text: 'cây xanh', meaning: 'Bảo vệ cây xanh mỗi ngày.', level: 1, topic: 'Thiên nhiên' },
      { text: 'quê hương', meaning: 'Chú ý ê và ươ.', level: 1, topic: 'Đất nước' },
      { text: 'gia đình', meaning: 'Cụm từ thân thuộc và ấm áp.', level: 1, topic: 'Gia đình' },
      { text: 'ước mơ', meaning: 'Gõ đúng ươ và ơ.', level: 1, topic: 'Tương lai' },
      { text: 'cảm ơn', meaning: 'Một lời nói lịch sự.', level: 1, topic: 'Giao tiếp' },
      { text: 'xin lỗi', meaning: 'Một lời nói có trách nhiệm.', level: 1, topic: 'Giao tiếp' },
      { text: 'dũng cảm', meaning: 'Bình tĩnh trước thử thách.', level: 1, topic: 'Phẩm chất' },
      { text: 'khỏe mạnh', meaning: 'Tập thể dục và ngủ đủ giấc.', level: 1, topic: 'Sức khỏe' },
      { text: 'siêng năng', meaning: 'Luyện một chút mỗi ngày.', level: 2, topic: 'Phẩm chất' },
      { text: 'kiên nhẫn', meaning: 'Không vội khi gặp từ khó.', level: 2, topic: 'Phẩm chất' },
      { text: 'sáng tạo', meaning: 'Thử nhiều cách giải khác nhau.', level: 2, topic: 'Tư duy' },
      { text: 'tò mò học hỏi', meaning: 'Luôn đặt câu hỏi vì sao.', level: 2, topic: 'Học tập' },
      { text: 'giữ lời hứa', meaning: 'Một hành động đáng tin cậy.', level: 2, topic: 'Phẩm chất' },
      { text: 'bảo vệ môi trường', meaning: 'Tiết kiệm nước và giảm rác thải.', level: 2, topic: 'Thiên nhiên' },
      { text: 'tư duy logic', meaning: 'Sắp xếp dữ kiện theo thứ tự.', level: 2, topic: 'Tư duy' },
      { text: 'luyện gõ mỗi ngày', meaning: 'Ưu tiên chính xác trước tốc độ.', level: 2, topic: 'Kỹ năng' },
      { text: 'khám phá khoa học', meaning: 'Quan sát, dự đoán rồi kiểm chứng.', level: 2, topic: 'Khoa học' },
      { text: 'đoàn kết giúp đỡ', meaning: 'Cùng nhau sẽ đi xa hơn.', level: 2, topic: 'Tình bạn' },
      { text: 'tập trung cao độ', meaning: 'Nhìn mục tiêu, giữ tay đúng vị trí.', level: 2, topic: 'Kỹ năng' },
      { text: 'học đi đôi với hành', meaning: 'Biến kiến thức thành kỹ năng.', level: 2, topic: 'Học tập' },
      { text: 'mỗi ngày một tiến bộ', meaning: 'Tiến bộ nhỏ tạo kết quả lớn.', level: 2, topic: 'Phẩm chất' },
      { text: 'đọc kỹ đề bài', meaning: 'Tìm dữ kiện trước khi trả lời.', level: 2, topic: 'Kỹ năng' },
      { text: 'bình tĩnh suy nghĩ', meaning: 'Chậm một nhịp để chọn đúng.', level: 2, topic: 'Tư duy' },
      { text: 'kiến thức là sức mạnh', meaning: 'Học tập mở ra nhiều lựa chọn.', level: 3, topic: 'Học tập' },
      { text: 'thất bại là bài học', meaning: 'Sai để biết cách làm tốt hơn.', level: 3, topic: 'Phẩm chất' },
      { text: 'kiên trì tạo nên kỳ tích', meaning: 'Đừng bỏ cuộc trước từ dài.', level: 3, topic: 'Phẩm chất' },
      { text: 'tự tin chinh phục thử thách', meaning: 'Tin vào quá trình luyện tập.', level: 3, topic: 'Phẩm chất' },
      { text: 'chính xác trước nhanh chóng', meaning: 'Tốc độ sẽ đến sau độ chính xác.', level: 3, topic: 'Kỹ năng' },
      { text: 'quan sát tìm ra quy luật', meaning: 'Nhìn điểm giống và khác nhau.', level: 3, topic: 'Tư duy' },
      { text: 'đặt câu hỏi để hiểu sâu', meaning: 'Câu hỏi tốt dẫn tới khám phá mới.', level: 3, topic: 'Học tập' },
      { text: 'chia nhỏ vấn đề phức tạp', meaning: 'Giải từng phần rồi ghép kết quả.', level: 3, topic: 'Tư duy' },
      { text: 'rèn luyện trí nhớ chủ động', meaning: 'Tự nhắc lại thay vì chỉ đọc.', level: 3, topic: 'Kỹ năng' },
      { text: 'hợp tác để cùng tiến bộ', meaning: 'Lắng nghe và chia sẻ ý tưởng.', level: 3, topic: 'Tình bạn' },
      { text: 'trách nhiệm với lựa chọn', meaning: 'Dám làm và dám sửa sai.', level: 3, topic: 'Phẩm chất' },
      { text: 'bảo mật thông tin cá nhân', meaning: 'Không chia sẻ mật khẩu cho người khác.', level: 3, topic: 'Công nghệ' },
      { text: 'sử dụng internet an toàn', meaning: 'Kiểm tra nguồn tin trước khi tin.', level: 3, topic: 'Công nghệ' },
      { text: 'tôn trọng sự khác biệt', meaning: 'Mỗi người đều có điểm mạnh riêng.', level: 3, topic: 'Kỹ năng sống' },
      { text: 'nuôi dưỡng trí tưởng tượng', meaning: 'Ý tưởng mới bắt đầu từ tò mò.', level: 3, topic: 'Sáng tạo' }
    ],

    code: [
      { text: 'console.log("Hello World");', meaning: 'In thông điệp ra console trong JS', level: 1, topic: 'JavaScript' },
      { text: 'const wpm = 100;', meaning: 'Khai báo hằng số tốc độ gõ', level: 1, topic: 'JavaScript' },
      { text: 'let score = 0;', meaning: 'Khai báo biến điểm số', level: 1, topic: 'JavaScript' },
      { text: 'print("Hello Python")', meaning: 'In chuỗi ký tự trong Python', level: 1, topic: 'Python' },
      { text: 'def solve():', meaning: 'Định nghĩa hàm trong Python', level: 1, topic: 'Python' },
      { text: 'div.container { display: flex; }', meaning: 'Căn chỉnh bố cục Flexbox CSS', level: 1, topic: 'CSS' },
      { text: 'color: #00ffcc;', meaning: 'Màu neon cyan trong CSS', level: 1, topic: 'CSS' },
      { text: 'function checkWpm(speed) { return speed > 60; }', meaning: 'Hàm kiểm tra tốc độ gõ', level: 2, topic: 'JavaScript' },
      { text: 'document.querySelector("#app").innerHTML = "Ready!";', meaning: 'Cập nhật nội dung HTML qua DOM', level: 2, topic: 'JavaScript' },
      { text: 'numbers = [i for i in range(10)]', meaning: 'Tạo list comprehension trong Python', level: 2, topic: 'Python' },
      { text: 'if __name__ == "__main__":', meaning: 'Khối thực thi chính trong Python', level: 2, topic: 'Python' },
      { text: 'async function fetchData(url) { return await fetch(url); }', meaning: 'Gọi API bất đồng bộ với Async/Await', level: 3, topic: 'JavaScript' },
      { text: 'const [state, setState] = useState(initialValue);', meaning: 'Hook lưu trữ trạng thái React JS', level: 3, topic: 'React' },
      { text: 'import { useEffect, useCallback } from "react";', meaning: 'Import hooks quản lý side-effects', level: 3, topic: 'React' }
    ],

    riddle: [
      { text: 'Cái gì càng rửa càng bẩn?', meaning: 'Đáp án: Nước', level: 1, topic: 'Đố mẹo' },
      { text: 'Con gì có cánh mà không biết bay?', meaning: 'Đáp án: Con chim cánh cụt', level: 1, topic: 'Đố vui' },
      { text: 'Nắng lửa mưa dầu tôi đâu có sợ', meaning: 'Đáp án: Cái ô / Cái dù', level: 1, topic: 'Đố dân gian' },
      { text: 'Lịch nào dài nhất?', meaning: 'Đáp án: Lịch sử', level: 1, topic: 'Đố chữ' },
      { text: 'Bệnh gì bác sĩ bó tay?', meaning: 'Đáp án: Bệnh gãy tay', level: 2, topic: 'Đố mẹo' },
      { text: 'Cái gì không ăn được mà vẫn chín?', meaning: 'Đáp án: Quả trứng / Trứng chín (hoặc suy nghĩ chín)', level: 2, topic: 'Đố mẹo' },
      { text: 'Quần rộng nhất là quần gì?', meaning: 'Đáp án: Quần đảo', level: 2, topic: 'Đố chữ' },
      { text: 'Con đường ngắn nhất đến trái tim là gì?', meaning: 'Đáp án: Đường truyền Internet siêu tốc!', level: 3, topic: 'Đố vui modern' },
      { text: 'Vật gì có mặt nhưng không có miệng?', meaning: 'Đáp án: Đồng hồ hoặc con tem', level: 3, topic: 'Đố dân gian' }
    ],

    science: [
      { text: 'Trái Đất quay quanh Mặt Trời', meaning: 'Chu kỳ quỹ đạo 365,25 ngày', level: 1, topic: 'Thiên văn' },
      { text: 'Nước sôi ở 100 độ C', meaning: 'Nhiệt độ sôi ở áp suất tiêu chuẩn', level: 1, topic: 'Vật lý' },
      { text: 'Oxy duy trì sự sống', meaning: 'Khí chiếm 21% bầu khí quyển', level: 1, topic: 'Sinh học' },
      { text: 'Ánh sáng truyền nhanh nhất', meaning: 'Tốc độ xấp xỉ 300.000 km/s', level: 2, topic: 'Vật lý' },
      { text: 'Quang hợp tạo ra O2', meaning: 'Cây xanh hấp thụ CO2 và nhả Oxy', level: 2, topic: 'Sinh học' },
      { text: 'Lực hấp dẫn của Trái Đất', meaning: 'Giữ bầu khí quyển và mọi vật trên mặt đất', level: 2, topic: 'Vật lý' },
      { text: 'DNA chứa mã di truyền', meaning: 'Cấu trúc xoắn đôi mang thông tin di truyền', level: 3, topic: 'Sinh học' },
      { text: 'Thần kinh trung ương', meaning: 'Gồm não bộ và tủy sống điều khiển hành vi', level: 3, topic: 'Y học' }
    ],

    bosses: {
      en: {
        easy: {
          name: 'Lexi Dragon', emoji: '🐲',
          stages: [
            { text: 'learn', meaning: 'học hỏi' },
            { text: 'focus', meaning: 'tập trung' },
            { text: 'victory', meaning: 'chiến thắng' }
          ]
        },
        normal: {
          name: 'Lexicon Dragon', emoji: '🐉',
          stages: [
            { text: 'practice', meaning: 'luyện tập' },
            { text: 'knowledge', meaning: 'kiến thức' },
            { text: 'confidence', meaning: 'sự tự tin' },
            { text: 'achievement', meaning: 'thành tựu' }
          ]
        },
        hard: {
          name: 'Ancient Word Dragon', emoji: '🐉',
          stages: [
            { text: 'concentration', meaning: 'sự tập trung' },
            { text: 'imagination', meaning: 'trí tưởng tượng' },
            { text: 'determination', meaning: 'sự quyết tâm' },
            { text: 'responsibility', meaning: 'trách nhiệm' },
            { text: 'perseverance', meaning: 'sự kiên trì' }
          ]
        }
      },
      vi: {
        easy: {
          name: 'Rồng Dấu Thanh', emoji: '🐲',
          stages: [
            { text: 'gõ đúng dấu', meaning: 'Nhìn kỹ rồi gõ chính xác.' },
            { text: 'giữ bình tĩnh', meaning: 'Nhịp đều quan trọng hơn vội vàng.' },
            { text: 'em làm được', meaning: 'Tự tin tung đòn cuối!' }
          ]
        },
        normal: {
          name: 'Rồng Chính Tả', emoji: '🐉',
          stages: [
            { text: 'luyện tập chăm chỉ', meaning: 'Kỹ năng lớn lên qua từng lần thử.' },
            { text: 'chú ý từng dấu thanh', meaning: 'Mỗi dấu tạo nên một tiếng đúng.' },
            { text: 'kiên trì không bỏ cuộc', meaning: 'Sửa lỗi rồi tiếp tục tiến lên.' },
            { text: 'chiến thắng chính mình', meaning: 'Em đã nhanh và chính xác hơn.' }
          ]
        },
        hard: {
          name: 'Thần Long Ngôn Ngữ', emoji: '🐉',
          stages: [
            { text: 'tập trung vào từng ký tự', meaning: 'Giữ mắt ở mục tiêu đang khóa.' },
            { text: 'chính xác tạo nên tốc độ', meaning: 'Đúng trước, nhanh sau.' },
            { text: 'kiến thức mở cánh cửa tương lai', meaning: 'Học hỏi đem lại nhiều cơ hội.' },
            { text: 'bền bỉ vượt qua mọi thử thách', meaning: 'Không bỏ cuộc khi gặp câu dài.' },
            { text: 'tư duy sáng tạo dẫn tới thành công', meaning: 'Đòn quyết định của em!' }
          ]
        }
      }
    },

    monsterEmojis: ['👾', '👻', '🦠', '🤖', '🧟', '🦇', '🐙', '👹'],

    /*
     * Chiến dịch 10 chặng, tăng dần giống hành trình 10 boss của phần toán.
     *   waves   số đợt quái phải dọn trước khi boss xuất hiện
     *   perWave khoảng số quái mỗi đợt; mỗi wave lấy ngẫu nhiên một số nguyên
     *   gap     khoảng cách giữa hai lần sinh quái (ms) — càng nhỏ càng dồn dập
     *   speed   tốc độ nền của quái
     *   level   trần độ khó của từ (1 dễ → 3 khó)
     *   armor   số lớp giáp của boss, mỗi lớp là một cụm từ phải gõ đúng
     *
     * Muốn chặng dài/ngắn hay khó/dễ hơn thì sửa thẳng các con số ở đây,
     * engine tự đọc theo và không cần đổi dòng code nào.
     */
    campaign: [
      { emoji: '🐛', name: 'Sâu Tri Thức Arcane',    desc: 'Linh vật phát sáng ma thuật bò qua dãy phím ngọc. Nhịp chuyển động chậm rãi — khởi đầu lý tưởng để em làm quen vị trí ngón tay.',
        waves: 3,  perWave: CAMPAIGN_PER_WAVE, gap: 2600, speed: 2.6, level: 1, armor: 2 },
      { emoji: '👻', name: 'Bóng Ma Ảo Ảnh Starlight', desc: 'Lạc lối trong dải ngân hà, rình rập lúc em nhập phím vội vã để biến hóa từ ngữ.',
        waves: 5,  perWave: CAMPAIGN_PER_WAVE, gap: 2450, speed: 3.0, level: 1, armor: 2 },
      { emoji: '🦇', name: 'Dơi Âm Thanh Tinh Tú',   desc: 'Đôi cánh ma thuật đập sóng âm vũ trụ, làm rung chuyển nhịp gõ của em.',
        waves: 7,  perWave: CAMPAIGN_PER_WAVE, gap: 2300, speed: 3.4, level: 1, armor: 3 },
      { emoji: '🐍', name: 'Xà Thần Ngôn Ngữ',       desc: 'Thần xà ngọc bích trườn qua ký tự rune, kiểm tra độ chính xác của từng dấu thanh.',
        waves: 9,  perWave: CAMPAIGN_PER_WAVE, gap: 2150, speed: 3.8, level: 2, armor: 3 },
      { emoji: '🦂', name: 'Bọ Cạp Khắc Dấu Hào Quang', desc: 'Càng vàng rực rỡ và ngòi bộc phát hào quang, thử thách bản lĩnh gõ đúng chính tả.',
        waves: 11, perWave: CAMPAIGN_PER_WAVE, gap: 2000, speed: 4.2, level: 2, armor: 3 },
      { emoji: '🦑', name: 'Mực Thần Cổ Đại',         desc: 'Xúc tu ma thuật ngọc bích quấn quanh cú pháp, thử thách tư duy sắp xếp từ ngữ.',
        waves: 13, perWave: CAMPAIGN_PER_WAVE, gap: 1850, speed: 4.6, level: 2, armor: 4 },
      { emoji: '🐲', name: 'Hỏa Long Từ Vựng',       desc: 'Long tinh rực lửa bảo hộ kho tàng từ vựng cao cấp. Múa cánh bộc phá hào quang!',
        waves: 15, perWave: CAMPAIGN_PER_WAVE, gap: 1700, speed: 5.0, level: 3, armor: 4 },
      { emoji: '👹', name: 'Quỷ Thần Tốc Độ Sol',    desc: 'Bộc phát năng lượng mặt trời, thách thức em đạt tốc độ gõ kỷ lục mà vẫn giữ vững độ chính xác.',
        waves: 17, perWave: CAMPAIGN_PER_WAVE, gap: 1550, speed: 5.4, level: 3, armor: 4 },
      { emoji: '🐉', name: 'Thần Long Thái Dương',   desc: 'Thần long vũ trụ uy nghi. Mỗi lớp giáp rune là một thử thách gõ câu trường kỳ trọn vẹn.',
        waves: 19, perWave: CAMPAIGN_PER_WAVE, gap: 1400, speed: 5.8, level: 3, armor: 5 },
      { emoji: '🌌', name: 'Chúa Tể Bàn Phím Vũ Trụ', desc: 'Kẻ trị vì vương quốc tư duy ngôn ngữ. Hạ gục hắn để khẳng định ngôi vị Huyền Thoại Bàn Phím!',
        waves: 21, perWave: CAMPAIGN_PER_WAVE, gap: 1300, speed: 6.3, level: 3, armor: 5 }
    ]
  };

  global.TYPING_CONTENT = content;
})(window);
