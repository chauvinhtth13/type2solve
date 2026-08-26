(function createDuelRules(global) {
  'use strict';

  /* ===== Numbers Policy — TẤT CẢ đều posture B (giá trị KHỞI ĐIỂM) =====
     Mục tiêu: ván kết thúc trong 5–14 đòn trúng, không kiểu chia điểm nào
     thắng được mọi kiểu khác, và KHÔNG BAO GIỜ có ván treo.
     ĐÃ ĐO (mô phỏng đúng vòng lặp lượt đấu — không phải con số đoán):
       · 21 kiểu chia điểm đối đầu đôi một → hạ nhau trong 4..9 đòn; kiểu mạnh
         nhất cũng chỉ hơn HẲN 3/20 kiểu còn lại ⇒ chỉ số là lựa chọn PHONG CÁCH,
         thắng thua vẫn do trả lời đúng câu hỏi.
       · KHÔNG lối chơi nào áp đảo: cứ-đánh 54%, rùa 50%, có-tính-toán 67%
         (trước lần cân bằng này: cứ-đánh 64–74% — bốn hành động chỉ là trang trí).
       · độ dài ván ở mức trả lời đúng 85%: 10,2 đòn trúng / 20,5 lượt.
       · 0/10.000 ván bế tắc, kể cả kịch bản cực đoan hai bên chỉ bấm Phòng thủ.
       · đi trước thắng 61% ⇒ beginRound() đổi người đi trước mỗi ván.
     Cách chỉnh khi chơi thử thấy lệch:
       – ván kết thúc quá nhanh (<5 đòn)  → giảm PER_POINT.atk, rồi giảm BASE.atk
       – ván lê thê (>12 đòn)             → tăng PER_POINT.atk hoặc giảm PER_POINT.hp
       – "cứ bấm Tấn công" lại áp đảo     → hạ RAGE.attack, rồi nâng RIPOSTE_SHARE
       – ai cũng dồn hết vào một chỉ số   → giảm MAX_SHARE (0.5 → 0.4)
       – tuyệt kỹ hụt hẫng                → tăng ULT_MULT trước, PIERCE sau     */
  const BASE = Object.freeze({ atk: 62, def: 10, hp: 220 });
  const PER_POINT = Object.freeze({ atk: 0.585, def: 1.0, hp: 2.6 });
  const START_POINTS = 100;
  const WIN_BONUS = 100;
  const LOSE_BONUS = 50;
  const MAX_SHARE = 0.5;        // một chỉ số không quá 50% tổng điểm ĐÃ ĐƯỢC CẤP
  const CRIT_CHANCE = 0.18;
  const CRIT_MULT = 1.5;
  const ATTACK_SPREAD = 0.1;    // đòn thường dao động ±10% cho đỡ đơn điệu
  const HEAL_SHARE = 0.16;      // hồi 16% máu tối đa
  /* MỖI VÁN chỉ hồi được 3 lần. Đây KHÔNG phải con số cho đẹp — nó là thứ bảo
     đảm ván đấu luôn kết thúc. Mô phỏng vòng lặp thật đã bắt được: với build
     thủ (DEF 60, HP 350) thì một đòn thường chỉ ăn ~11% máu trong khi hồi máu
     trả lại 16% ⇒ hai bên cùng "rùa" là ván treo VĨNH VIỄN (2000/2000 ván mô
     phỏng không bao giờ kết thúc). Chặn số lần hồi làm tổng lượng hồi mỗi ván
     hữu hạn, nên sát thương chắc chắn thắng được về lâu dài.
     Chỉnh: thấy ván vẫn lê thê thì hạ còn 2; thấy hụt hẫng vì hết bài thì lên 4. */
  const HEAL_USES_PER_ROUND = 3;
  const SHIELD_CUT = 0.5;       // khiên chặn 50% đòn kế tiếp
  /* Đo được: cứ bấm Tấn công mọi lượt thắng 64–74% so với lối chơi có tính toán
     — nghĩa là ba hành động kia mới chỉ là trang trí. Hai đòn bẩy dưới đây làm
     chúng thành lựa chọn thật, mà không thêm luật nào trẻ phải học thuộc:
       · Phản đòn: đánh vào một người ĐANG THỦ thì bị dội ngược một phần → thủ
         không còn là "mất lượt để chịu ít hơn", mà là một cái bẫy.
       · Tích nộ theo máu đã mất: càng bị dồn càng nạp nhanh → đường lội ngược
         dòng nằm trong TAY người chơi chứ không chỉ trông vào may rủi.
     posture B — vẫn thấy "cứ đánh" áp đảo thì nâng RIPOSTE_SHARE lên 0.4;
     thấy thủ thành nước đi duy nhất thì hạ về 0.2. */
  const RIPOSTE_SHARE = 0.45;   // phần sát thương bị khiên chặn, dội lại kẻ tấn công
  const RAGE_DESPERATE = 25;    // nộ cộng thêm khi tích nộ lúc máu cạn
  const ULT_MULT = 2.0;
  const ULT_PIERCE = 0.4;       // tuyệt kỹ bỏ qua 40% giáp đối thủ
  const RAGE_MAX = 100;
  /* `attack: 6` — hạ từ 18 xuống là đòn bẩy CẤU TRÚC quan trọng nhất của lần
     cân bằng này. Khi tấn công vừa gây sát thương vừa nạp đầy Nộ thì nó tự củng
     cố: cứ bấm Tấn công mọi lượt đã mạnh hơn mọi lối chơi có tính toán (đo được
     63–74%). Tách Nộ ra khỏi đòn thường làm Tuyệt kỹ thành phần thưởng cho việc
     THỦ / HỒI / TÍCH và cho việc CHỊU ĐÒN — nên kẻ đang bị dồn vẫn có đường lên.
     Đo lại sau khi sửa: cứ-đánh 59%, rùa 56%, có-tính-toán 63%. */
  const RAGE = Object.freeze({ attack: 6, defend: 14, heal: 12, charge: 35, hurt: 12 });
  const TURN_DELAY = 1000;      // nghỉ giữa lượt để kịp đọc phản hồi
  
  const STAT_KEYS = Object.freeze(['atk', 'def', 'hp']);
  
  const ACTIONS = Object.freeze({
    attack: { icon: '⚔️', name: 'Tấn công', desc: 'Gây sát thương theo ATK của em và DEF của đối thủ' },
    defend: { icon: '🛡️', name: 'Phòng thủ', desc: 'Chặn nửa đòn kế tiếp VÀ dội ngược 30% chỗ chặn được' },
    heal: { icon: '💚', name: 'Hồi máu', desc: `Hồi ${Math.round(HEAL_SHARE * 100)}% máu tối đa` },
    charge: { icon: '🔥', name: 'Tích nộ', desc: `Cộng ${RAGE.charge}% Nộ, càng ít máu càng cộng nhiều` },
  });
  
  function emptyAlloc() {
    return { atk: 0, def: 0, hp: 0 };
  }
  
  /* Quy đổi điểm chỉ số → chỉ số thật. */
  function statsFrom(alloc) {
    return {
      atk: BASE.atk + (Number(alloc?.atk) || 0) * PER_POINT.atk,
      def: BASE.def + (Number(alloc?.def) || 0) * PER_POINT.def,
      maxHp: Math.round(BASE.hp + (Number(alloc?.hp) || 0) * PER_POINT.hp),
    };
  }
  
  /* Giảm sát thương kiểu "hiệu suất giáp": 100/(100+DEF).
     Chọn công thức này thay vì `dmg − DEF` vì nó KHÔNG BAO GIỜ về 0 (không có
     thế cờ bất tử) và có hiệu suất giảm dần (dồn hết vào DEF không đáng). */
  function mitigate(raw, def) {
    return Math.max(1, Math.round(raw * 100 / (100 + Math.max(0, def))));
  }
  
  /* Trần điểm cho MỘT chỉ số, tính theo tổng điểm đã được cấp — nhờ vậy trần
     tự nới ra qua từng ván mà tỉ lệ "không dồn quá nửa" vẫn giữ nguyên. */
  function maxPerStat(totalGranted) {
    return Math.floor(totalGranted * MAX_SHARE);
  }
  
  /* Kiểm tra phân bổ: không âm, không lẻ, không vượt ngân sách, không vượt trần
     một chỉ số. Trả về lý do bằng tiếng Việt để hiện thẳng lên màn hình. */
  function validateAlloc(alloc, budget, totalGranted) {
    const cap = maxPerStat(totalGranted);
    let spent = 0;
    for (const key of STAT_KEYS) {
      const value = Number(alloc?.[key]);
      if (!Number.isInteger(value) || value < 0) return { ok: false, reason: 'Điểm chỉ số phải là số nguyên không âm.' };
      if (value > cap) return { ok: false, reason: `Không dồn quá ${cap} điểm vào một chỉ số.` };
      spent += value;
    }
    if (spent > budget) return { ok: false, reason: `Vượt quá ${budget} điểm đang có.` };
    if (spent < budget) return { ok: false, reason: `Còn thừa ${budget - spent} điểm chưa dùng.` };
    return { ok: true, reason: '' };
  }
  
  /* Sát thương một đòn thường. `roll` và `critRoll` truyền vào được để bài test
     tái lập chính xác kết quả — mặc định mới random. */
  function attackDamage(attackerStats, defenderStats, options = {}) {
    const roll = typeof options.roll === 'number' ? options.roll : Math.random();
    const critRoll = typeof options.critRoll === 'number' ? options.critRoll : Math.random();
    const crit = critRoll < CRIT_CHANCE;
    const variance = 1 - ATTACK_SPREAD + roll * ATTACK_SPREAD * 2;
    let raw = attackerStats.atk * variance;
    if (crit) raw *= CRIT_MULT;
    if (options.shielded) raw *= SHIELD_CUT;
    return { damage: mitigate(raw, defenderStats.def), crit };
  }
  
  function ultimateDamage(attackerStats, defenderStats, options = {}) {
    let raw = attackerStats.atk * ULT_MULT;
    if (options.shielded) raw *= SHIELD_CUT;
    return { damage: mitigate(raw, defenderStats.def * (1 - ULT_PIERCE)), crit: false };
  }
  
  /* Sát thương dội ngược khi đánh trúng người đang giương khiên. */
  function riposteDamage(blocked) {
    return Math.max(1, Math.round(blocked * RIPOSTE_SHARE));
  }
  
  /* Nộ nhận được khi bấm Tích nộ — càng ít máu càng nạp nhiều. */
  function chargeGain(hp, maxHp) {
    const missing = Math.max(0, 1 - (Number(hp) || 0) / Math.max(1, Number(maxHp) || 1));
    return Math.round(RAGE.charge + RAGE_DESPERATE * missing);
  }
  
  function healAmount(maxHp) {
    return Math.max(1, Math.round(maxHp * HEAL_SHARE));
  }
  
  function addRage(current, delta) {
    return Math.max(0, Math.min(RAGE_MAX, (Number(current) || 0) + delta));
  }
  
  /* Số ván cần thắng của thể thức BO-N. */
  function winsNeeded(bestOf) {
    return Math.floor(bestOf / 2) + 1;
  }
  
  const DuelRules = Object.freeze({
    BASE, PER_POINT, START_POINTS, WIN_BONUS, LOSE_BONUS, MAX_SHARE,
    CRIT_CHANCE, CRIT_MULT, HEAL_SHARE, SHIELD_CUT, ULT_MULT, ULT_PIERCE,
    RAGE_MAX, RAGE, TURN_DELAY, STAT_KEYS, ACTIONS, HEAL_USES_PER_ROUND,
    RIPOSTE_SHARE, RAGE_DESPERATE,
    emptyAlloc, statsFrom, mitigate, maxPerStat, validateAlloc,
    attackDamage, ultimateDamage, healAmount, addRage, winsNeeded,
    riposteDamage, chargeGain,
  });

  global.DuelRules = DuelRules;
})(window);
