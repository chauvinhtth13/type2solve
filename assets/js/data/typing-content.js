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
      { emoji: '🐛', name: 'Sâu Chữ Cái',      waves: 3,  perWave: CAMPAIGN_PER_WAVE, gap: 2600, speed: 2.6, level: 1, armor: 2 },
      { emoji: '👻', name: 'Ma Gõ Nhầm',       waves: 5,  perWave: CAMPAIGN_PER_WAVE, gap: 2450, speed: 3.0, level: 1, armor: 2 },
      { emoji: '🦇', name: 'Dơi Lạc Phím',     waves: 7,  perWave: CAMPAIGN_PER_WAVE, gap: 2300, speed: 3.4, level: 1, armor: 3 },
      { emoji: '🐍', name: 'Rắn Chính Tả',     waves: 9,  perWave: CAMPAIGN_PER_WAVE, gap: 2150, speed: 3.8, level: 2, armor: 3 },
      { emoji: '🦂', name: 'Bọ Cạp Dấu Thanh', waves: 11, perWave: CAMPAIGN_PER_WAVE, gap: 2000, speed: 4.2, level: 2, armor: 3 },
      { emoji: '🦑', name: 'Mực Ngữ Pháp',     waves: 13, perWave: CAMPAIGN_PER_WAVE, gap: 1850, speed: 4.6, level: 2, armor: 4 },
      { emoji: '🐲', name: 'Rồng Con Từ Vựng', waves: 15, perWave: CAMPAIGN_PER_WAVE, gap: 1700, speed: 5.0, level: 3, armor: 4 },
      { emoji: '👹', name: 'Quỷ Tốc Độ',       waves: 17, perWave: CAMPAIGN_PER_WAVE, gap: 1550, speed: 5.4, level: 3, armor: 4 },
      { emoji: '🐉', name: 'Rồng Ngôn Ngữ',    waves: 19, perWave: CAMPAIGN_PER_WAVE, gap: 1400, speed: 5.8, level: 3, armor: 5 },
      { emoji: '🌌', name: 'Chúa Tể Bàn Phím', waves: 21, perWave: CAMPAIGN_PER_WAVE, gap: 1300, speed: 6.3, level: 3, armor: 5 }
    ]
  };

  global.TYPING_CONTENT = content;
})(window);
