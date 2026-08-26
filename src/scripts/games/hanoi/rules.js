(function createHanoiRules(global) {
  'use strict';

  const MIN_DISKS = 3;
  const MAX_DISKS = 7;
  const PEGS = 3;
  
  /* Cọc là mảng đĩa xếp từ ĐÁY lên NGỌN: [5,4,3,2,1] ⇒ đĩa 1 nằm trên cùng.
     Số đĩa = kích cỡ đĩa, nên so sánh kích cỡ chỉ là so sánh số. */
  function createTowers(diskCount) {
    const first = [];
    for (let size = diskCount; size >= 1; size -= 1) first.push(size);
    return [first, [], []];
  }
  
  function topDisk(towers, peg) {
    const stack = towers[peg];
    return stack.length ? stack[stack.length - 1] : null;
  }
  
  /* Một nước đi hợp lệ khi: hai cọc có thật, khác nhau, cọc nguồn còn đĩa,
     và đĩa đang bốc NHỎ HƠN đĩa trên ngọn cọc đích (cọc trống thì luôn được). */
  function canMove(towers, from, to) {
    if (!Number.isInteger(from) || !Number.isInteger(to)) return false;
    if (from < 0 || to < 0 || from >= PEGS || to >= PEGS || from === to) return false;
    const moving = topDisk(towers, from);
    if (moving === null) return false;
    const landing = topDisk(towers, to);
    return landing === null || moving < landing;
  }
  
  /* Trả về bàn cờ MỚI, không sửa bàn cũ — nhờ vậy tầng trạng thái lưu được
     lịch sử để hoàn tác mà không phải sao chép thủ công ở từng chỗ gọi. */
  function applyMove(towers, from, to) {
    if (!canMove(towers, from, to)) return null;
    const next = towers.map((stack) => stack.slice());
    next[to].push(next[from].pop());
    return next;
  }
  
  function isSolved(towers, diskCount, targetPeg = 2) {
    return towers[targetPeg].length === diskCount;
  }
  
  /* Số bước tối ưu của bài toán n đĩa: 2^n − 1. */
  function optimalMoves(diskCount) {
    return Math.pow(2, diskCount) - 1;
  }
  
  /* Giải TỪ MỘT THẾ CỜ BẤT KỲ (không bắt người chơi chơi lại từ đầu mới được
     trợ giúp). Luật đệ quy kinh điển vẫn đúng với thế cờ dở dang: muốn chuyển
     đĩa k về cọc đích thì dồn toàn bộ đĩa nhỏ hơn sang cọc còn lại trước; nếu
     đĩa k đã nằm đúng chỗ thì bỏ qua nó và xét tiếp đĩa k−1. */
  function solveFrom(towers, diskCount, targetPeg = 2) {
    const work = towers.map((stack) => stack.slice());
    const moves = [];
    const pegOf = (disk) => work.findIndex((stack) => stack.includes(disk));
  
    function relocate(disk, to) {
      if (disk < 1) return;
      const from = pegOf(disk);
      if (from === to) { relocate(disk - 1, to); return; }
      const spare = 3 - from - to;   // ba cọc đánh số 0,1,2 nên cọc còn lại = 3 − from − to
      relocate(disk - 1, spare);
      work[from].pop();
      work[to].push(disk);
      moves.push([from, to]);
      relocate(disk - 1, to);
    }
  
    relocate(diskCount, targetPeg);
    return moves;
  }
  
  const HanoiRules = Object.freeze({
    MIN_DISKS, MAX_DISKS, PEGS,
    createTowers, topDisk, canMove, applyMove, isSolved, optimalMoves, solveFrom,
  });

  global.HanoiRules = HanoiRules;
})(window);
