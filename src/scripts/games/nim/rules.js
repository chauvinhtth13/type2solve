(function createNimRules(global) {
  'use strict';

  const MIN_PILES = 2;
  const MAX_PILES = 6;
  const MIN_STONES = 1;
  const MAX_STONES = 15;

  function nimSum(piles) {
    return piles.reduce((acc, count) => acc ^ count, 0);
  }

  function totalStones(piles) {
    return piles.reduce((sum, count) => sum + count, 0);
  }

  function legalMoves(piles) {
    const moves = [];
    piles.forEach((count, pile) => {
      for (let take = 1; take <= count; take += 1) moves.push({ pile, take });
    });
    return moves;
  }

  function randomMove(piles, rng = Math.random) {
    const moves = legalMoves(piles);
    if (!moves.length) return null;
    return moves[Math.floor(rng() * moves.length)];
  }

  /* Nước đi TỐI ƯU của Nim Misère.
     Nim thường: để lại nim-sum = 0 là thắng. Misère (bốc viên cuối thì THUA)
     chỉ khác ở đúng một chỗ — GIAI ĐOẠN CUỐI, khi không còn đống nào ≥ 2 viên:
     lúc đó ai đối mặt với một SỐ LẺ đống-1-viên là người thua, nên ta luôn cố
     để lại cho đối thủ số lẻ đống 1 viên.
       • Không còn đống ≥2  → thế cờ đã định đoạt, cứ bốc 1 viên.
       • Đúng MỘT đống ≥2   → ta nắm quyền: hạ đống đó xuống 0 hoặc 1 sao cho
                              số đống-1-viên còn lại là LẺ.
       • Từ HAI đống ≥2 trở lên → chơi y như Nim thường (đưa nim-sum về 0);
                              giai đoạn cuối còn xa nên chưa cần đổi luật.
     Nim-sum ≠ 0 ⇒ luôn tồn tại nước về 0 ⇒ đi trước ở thế này là thắng chắc. */
  function bestMove(piles) {
    if (!totalStones(piles)) return null;
    const big = [];
    let ones = 0;
    piles.forEach((count, index) => {
      if (count >= 2) big.push(index);
      else if (count === 1) ones += 1;
    });

    if (big.length === 0) {
      // Toàn đống 1 viên: thế cờ đã định đoạt bởi tính chẵn lẻ, bốc 1 viên.
      const pile = piles.findIndex((count) => count === 1);
      return pile < 0 ? null : { pile, take: 1 };
    }

    if (big.length === 1) {
      const pile = big[0];
      // Muốn để lại SỐ LẺ đống 1 viên cho đối thủ.
      const leave = ones % 2 === 0 ? 1 : 0;
      return { pile, take: piles[pile] - leave };
    }

    const x = nimSum(piles);
    if (x === 0) {
      // Thế thua: không có nước tối ưu, cầm cự bằng cách bốc 1 viên ở đống lớn nhất.
      let pile = 0;
      piles.forEach((count, index) => { if (count > piles[pile]) pile = index; });
      return { pile, take: 1 };
    }
    for (let pile = 0; pile < piles.length; pile += 1) {
      const target = piles[pile] ^ x;
      if (target < piles[pile]) return { pile, take: piles[pile] - target };
    }
    return randomMove(piles);
  }

  /* Người ĐANG tới lượt có thắng được không (nếu chơi tối ưu)? Dùng để hiện
     gợi ý "thế cờ này em đang thắng/thua" chứ không chỉ để máy tính nước. */
  function isWinningPosition(piles) {
    const total = totalStones(piles);
    if (!total) return false;
    const big = piles.filter((count) => count >= 2).length;
    const ones = piles.filter((count) => count === 1).length;
    if (big === 0) return ones % 2 === 0;   // để lại số lẻ cho đối thủ ⇒ thắng
    return nimSum(piles) !== 0 || big === 1;
  }

  /* Máy Vừa đi ĐÚNG nước tối ưu với xác suất này, còn lại bốc ngẫu nhiên.
     posture B — mục tiêu: trẻ chơi khá thắng được khoảng 30–50% số ván.
     Thấy trẻ thắng gần như mọi ván thì nâng lên 0.85; thấy nản vì thua mãi thì
     hạ xuống 0.55. (Máy Dễ = 0%, Máy Khó = 100%, đây là bậc thang ở giữa.) */
  const MEDIUM_OPTIMAL_RATE = 0.7;

  /* Nước đi của máy theo từng mức. Để ở tầng LUẬT (thuần, nhận rng vào) nên bài
     test tái lập được chính xác thay vì phải chạy thử vài nghìn ván. */
  function aiMove(piles, level, rng = Math.random) {
    if (level === 'perfect') return bestMove(piles);
    if (level === 'mixed') return rng() < MEDIUM_OPTIMAL_RATE ? bestMove(piles) : randomMove(piles, rng);
    return randomMove(piles, rng);
  }

  function applyTake(piles, pile, take) {
    if (!Number.isInteger(pile) || pile < 0 || pile >= piles.length) return null;
    if (!Number.isInteger(take) || take < 1 || take > piles[pile]) return null;
    const next = piles.slice();
    next[pile] -= take;
    return next;
  }

  global.NimRules = Object.freeze({
    MIN_PILES, MAX_PILES, MIN_STONES, MAX_STONES,
    MEDIUM_OPTIMAL_RATE,
    nimSum, totalStones, legalMoves, randomMove, bestMove, aiMove, isWinningPosition, applyTake,
  });
})(window);
