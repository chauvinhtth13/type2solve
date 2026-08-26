import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function loadClassicScript(relativePath, exportName) {
  const filename = resolve(projectRoot, relativePath);
  const source = await readFile(filename, 'utf8');
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  const script = new vm.Script(source, { filename: relative(projectRoot, filename) });
  script.runInContext(context, { timeout: 1_000 });
  assert.ok(context[exportName], `${relativePath} không export window.${exportName}`);
  return context[exportName];
}

function plain(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

const NimRules = await loadClassicScript('src/scripts/games/nim/rules.js', 'NimRules');
const DuelRules = await loadClassicScript('src/scripts/games/duel/rules.js', 'DuelRules');
const HanoiRules = await loadClassicScript('src/scripts/games/hanoi/rules.js', 'HanoiRules');

function winnerAfterOptimalPlay(initialPiles) {
  let piles = initialPiles.slice();
  let player = 0;
  while (NimRules.totalStones(piles) > 0) {
    const move = NimRules.bestMove(piles);
    assert.ok(move, `Không tìm thấy nước đi cho thế ${piles.join('-')}`);
    piles = plain(NimRules.applyTake(piles, move.pile, move.take));
    if (NimRules.totalStones(piles) === 0) return 1 - player;
    player = 1 - player;
  }
  return null;
}

test('NimRules export API bất biến cho classic script', () => {
  assert.ok(Object.isFrozen(NimRules));
  assert.deepEqual(Object.keys(NimRules).sort(), [
    'MAX_PILES', 'MAX_STONES', 'MEDIUM_OPTIMAL_RATE', 'MIN_PILES', 'MIN_STONES',
    'aiMove', 'applyTake', 'bestMove', 'isWinningPosition', 'legalMoves',
    'nimSum', 'randomMove', 'totalStones',
  ].sort());
});

test('Nim misère xác định đúng thế kết thúc và người thắng', () => {
  assert.equal(NimRules.totalStones([0, 0, 0]), 0);
  assert.equal(NimRules.bestMove([0, 0, 0]), null);
  assert.equal(NimRules.isWinningPosition([0, 0, 0]), false);

  assert.equal(NimRules.isWinningPosition([1]), false, 'Một viên là thế thua vì buộc bốc viên cuối');
  assert.equal(NimRules.isWinningPosition([1, 1]), true, 'Hai đống một viên là thế thắng');
  assert.equal(NimRules.isWinningPosition([1, 1, 1]), false, 'Ba đống một viên là thế thua');
  assert.equal(winnerAfterOptimalPlay([1]), 1);
  assert.equal(winnerAfterOptimalPlay([1, 1]), 0);
  assert.equal(winnerAfterOptimalPlay([1, 1, 1]), 1);
});

test('applyTake chỉ nhận nước hợp lệ và không sửa mảng đầu vào', () => {
  const piles = [3, 5, 1];
  assert.deepEqual(plain(NimRules.applyTake(piles, 1, 2)), [3, 3, 1]);
  assert.deepEqual(piles, [3, 5, 1]);

  for (const [pile, take] of [[-1, 1], [3, 1], [0, 0], [0, 4], [0, 1.5], [1.5, 1]]) {
    assert.equal(NimRules.applyTake(piles, pile, take), null, `Phải từ chối pile=${pile}, take=${take}`);
  }
});

test('nimSum tính XOR đúng cho các thế chuẩn', () => {
  assert.equal(NimRules.nimSum([]), 0);
  assert.equal(NimRules.nimSum([1, 2, 3]), 0);
  assert.equal(NimRules.nimSum([3, 4, 5]), 2);
  assert.equal(NimRules.nimSum([7, 7, 9, 9]), 0);
});

test('Máy khó chọn đúng nước tối ưu ở các thế misère kinh điển', () => {
  assert.deepEqual(plain(NimRules.bestMove([1, 1, 4])), { pile: 2, take: 3 });
  assert.deepEqual(plain(NimRules.bestMove([1, 4])), { pile: 1, take: 4 });

  const normalPosition = [3, 4, 5];
  const expected = { pile: 0, take: 2 };
  assert.deepEqual(plain(NimRules.bestMove(normalPosition)), expected);
  assert.deepEqual(plain(NimRules.aiMove(normalPosition, 'perfect', () => 0.999)), expected);
  const next = plain(NimRules.applyTake(normalPosition, expected.pile, expected.take));
  assert.equal(NimRules.nimSum(next), 0);
});

test('bestMove biến mọi thế thắng nhỏ thành thế thua hợp lệ cho đối thủ', () => {
  let checked = 0;
  for (let a = 0; a <= 4; a += 1) {
    for (let b = 0; b <= 4; b += 1) {
      for (let c = 0; c <= 4; c += 1) {
        const piles = [a, b, c];
        if (!NimRules.isWinningPosition(piles)) continue;
        const move = plain(NimRules.bestMove(piles));
        assert.ok(move, `Thiếu nước tối ưu cho ${piles.join('-')}`);
        assert.ok(
          NimRules.legalMoves(piles).some(({ pile, take }) => pile === move.pile && take === move.take),
          `Nước ${JSON.stringify(move)} không hợp lệ cho ${piles.join('-')}`,
        );
        const next = plain(NimRules.applyTake(piles, move.pile, move.take));
        assert.equal(
          NimRules.isWinningPosition(next),
          false,
          `${piles.join('-')} đi ${JSON.stringify(move)} phải để lại thế thua, nhận ${next.join('-')}`,
        );
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 50, `Số thế kiểm chứng quá ít: ${checked}`);
});

test('DuelRules khóa contract và quy đổi phân bổ chỉ số ổn định', () => {
  assert.ok(Object.isFrozen(DuelRules));
  assert.ok(Object.isFrozen(DuelRules.STAT_KEYS));
  assert.equal(DuelRules.TURN_DELAY, 1_000);

  const allocation = { atk: 34, def: 33, hp: 33 };
  assert.deepEqual(plain(DuelRules.validateAlloc(allocation, 100, 100)), { ok: true, reason: '' });
  assert.equal(DuelRules.maxPerStat(100), 50);
  assert.equal(DuelRules.maxPerStat(150), 75);
  assert.deepEqual(plain(DuelRules.statsFrom(allocation)), {
    atk: DuelRules.BASE.atk + 34 * DuelRules.PER_POINT.atk,
    def: DuelRules.BASE.def + 33 * DuelRules.PER_POINT.def,
    maxHp: Math.round(DuelRules.BASE.hp + 33 * DuelRules.PER_POINT.hp),
  });
});

test('DuelRules từ chối mọi phân bổ sai invariant', () => {
  const invalid = [
    [{ atk: 51, def: 49, hp: 0 }, 100, 100],
    [{ atk: 34, def: 33, hp: 32 }, 100, 100],
    [{ atk: 34, def: 33, hp: 34 }, 100, 100],
    [{ atk: -1, def: 50, hp: 51 }, 100, 200],
    [{ atk: 33.5, def: 33.5, hp: 33 }, 100, 100],
  ];
  invalid.forEach(([allocation, budget, granted]) => {
    const result = plain(DuelRules.validateAlloc(allocation, budget, granted));
    assert.equal(result.ok, false, JSON.stringify({ allocation, budget, granted }));
    assert.ok(result.reason.length > 0);
  });
});

test('DuelRules sát thương, khiên, chí mạng và tuyệt kỹ giữ đúng tương quan', () => {
  const attacker = plain(DuelRules.statsFrom({ atk: 50, def: 0, hp: 50 }));
  const defender = plain(DuelRules.statsFrom({ atk: 0, def: 50, hp: 50 }));
  const low = plain(DuelRules.attackDamage(attacker, defender, { roll: 0, critRoll: 1 }));
  const high = plain(DuelRules.attackDamage(attacker, defender, { roll: 1, critRoll: 1 }));
  const critical = plain(DuelRules.attackDamage(attacker, defender, { roll: 0, critRoll: 0 }));
  const shielded = plain(DuelRules.attackDamage(attacker, defender, {
    roll: 0, critRoll: 1, shielded: true,
  }));
  const ultimate = plain(DuelRules.ultimateDamage(attacker, defender));

  assert.ok(low.damage >= 1 && high.damage > low.damage);
  assert.equal(low.crit, false);
  assert.equal(critical.crit, true);
  assert.ok(critical.damage > low.damage);
  assert.ok(shielded.damage < low.damage);
  assert.ok(ultimate.damage > high.damage, 'Tuyệt kỹ phải mạnh hơn đòn thường không chí mạng');
});

test('DuelRules giới hạn hồi máu, nộ, phản đòn và thể thức BO', () => {
  assert.equal(DuelRules.addRage(90, 20), DuelRules.RAGE_MAX);
  assert.equal(DuelRules.addRage(5, -20), 0);
  assert.equal(DuelRules.healAmount(300), Math.round(300 * DuelRules.HEAL_SHARE));
  assert.equal(DuelRules.chargeGain(300, 300), DuelRules.RAGE.charge);
  assert.equal(
    DuelRules.chargeGain(0, 300),
    DuelRules.RAGE.charge + DuelRules.RAGE_DESPERATE,
  );
  assert.equal(DuelRules.riposteDamage(100), Math.round(100 * DuelRules.RIPOSTE_SHARE));
  assert.deepEqual([1, 3, 5].map(DuelRules.winsNeeded), [1, 2, 3]);
});

test('HanoiRules tạo bàn chuẩn và applyMove không sửa state cũ', () => {
  assert.ok(Object.isFrozen(HanoiRules));
  const towers = plain(HanoiRules.createTowers(3));
  assert.deepEqual(towers, [[3, 2, 1], [], []]);
  assert.equal(HanoiRules.topDisk(towers, 0), 1);
  assert.equal(HanoiRules.canMove(towers, 0, 2), true);
  const next = plain(HanoiRules.applyMove(towers, 0, 2));
  assert.deepEqual(next, [[3, 2], [], [1]]);
  assert.deepEqual(towers, [[3, 2, 1], [], []]);
  assert.equal(HanoiRules.applyMove(next, 0, 2), null, 'Không đặt đĩa 2 lên đĩa 1');
  assert.equal(HanoiRules.canMove(towers, 0, 0), false);
  assert.equal(HanoiRules.canMove(towers, -1, 2), false);
});

function applyHanoiSolution(initial, moves) {
  let towers = initial;
  moves.forEach(([from, to], index) => {
    const next = HanoiRules.applyMove(towers, from, to);
    assert.ok(next, `Nước Hanoi thứ ${index + 1} không hợp lệ: ${from} -> ${to}`);
    towers = plain(next);
  });
  return towers;
}

test('HanoiRules sinh lời giải tối ưu cho mọi cấu hình 3–7 đĩa', () => {
  for (let disks = HanoiRules.MIN_DISKS; disks <= HanoiRules.MAX_DISKS; disks += 1) {
    const initial = plain(HanoiRules.createTowers(disks));
    const moves = plain(HanoiRules.solveFrom(initial, disks));
    assert.equal(moves.length, HanoiRules.optimalMoves(disks), `${disks} đĩa`);
    const solved = applyHanoiSolution(initial, moves);
    assert.equal(HanoiRules.isSolved(solved, disks), true, `${disks} đĩa chưa về cọc C`);
  }
});

test('HanoiRules tiếp tục giải hợp lệ từ một thế cờ đang chơi dở', () => {
  let towers = plain(HanoiRules.createTowers(4));
  towers = plain(HanoiRules.applyMove(towers, 0, 1));
  towers = plain(HanoiRules.applyMove(towers, 0, 2));
  towers = plain(HanoiRules.applyMove(towers, 1, 2));
  const remaining = plain(HanoiRules.solveFrom(towers, 4));
  assert.ok(remaining.length > 0);
  const solved = applyHanoiSolution(towers, remaining);
  assert.equal(HanoiRules.isSolved(solved, 4), true);
});
