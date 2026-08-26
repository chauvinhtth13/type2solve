import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const runtimeFile = resolve(projectRoot, 'src/scripts/engine/runtime.js');
const runtimeSource = await readFile(runtimeFile, 'utf8');

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    contains: (name) => values.has(name),
  };
}

function createElement(id, classes = []) {
  return { id, hidden: false, classList: createClassList(classes) };
}

function createFakeTimers() {
  let nextId = 1;
  const pending = new Map();
  const cleared = new Set();
  return {
    pending,
    cleared,
    setTimeout(callback, delay) {
      const id = nextId;
      nextId += 1;
      pending.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      cleared.add(id);
      pending.delete(id);
    },
    fire(id) {
      const timer = pending.get(id);
      if (!timer) return false;
      pending.delete(id);
      timer.callback();
      return true;
    },
  };
}

function loadRuntime({ elements = [], globals = {} } = {}) {
  const elementMap = new Map(elements.map((element) => [element.id, element]));
  const timers = createFakeTimers();
  const document = {
    getElementById: (id) => elementMap.get(id) || null,
    querySelectorAll: (selector) => (selector === '.screen'
      ? [...elementMap.values()].filter((element) => element.classList.contains('screen'))
      : []),
  };
  const sandbox = {
    document,
    setTimeout: timers.setTimeout.bind(timers),
    clearTimeout: timers.clearTimeout.bind(timers),
    ...globals,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  new vm.Script(runtimeSource, {
    filename: relative(projectRoot, runtimeFile),
  }).runInContext(context, { timeout: 1_000 });
  assert.ok(context.GameRuntime, 'runtime.js không export window.GameRuntime');
  return { context, document, elements: elementMap, runtime: context.GameRuntime, timers };
}

test('GameRuntime.safeSound không làm hỏng luồng khi âm thanh thiếu hoặc lỗi', () => {
  let calls = 0;
  const { context, runtime } = loadRuntime();
  assert.equal(runtime.safeSound('click'), false);

  context.SFX = {
    click() { calls += 1; },
    broken() { throw new Error('audio unavailable'); },
  };
  assert.equal(runtime.safeSound('missing'), false);
  assert.equal(runtime.safeSound('click'), true);
  assert.equal(calls, 1);
  assert.equal(runtime.safeSound('broken'), false);
});

test('GameRuntime.setExclusiveSections đặt hidden đúng cho một hoặc nhiều section', () => {
  const setup = createElement('nimSetup');
  const play = createElement('nimPlay');
  const result = createElement('nimResult');
  const { runtime } = loadRuntime({ elements: [setup, play, result] });
  const names = ['Setup', 'Play', 'Result'];

  runtime.setExclusiveSections('nim', names, 'Play');
  assert.equal(setup.hidden, true);
  assert.equal(play.hidden, false);
  assert.equal(result.hidden, true);

  runtime.setExclusiveSections('nim', names, ['Setup', 'Result']);
  assert.equal(setup.hidden, false);
  assert.equal(play.hidden, true);
  assert.equal(result.hidden, false);
});

test('GameRuntime.safeShowScreen fallback chỉ kích hoạt đúng màn đích', () => {
  const home = createElement('home', ['screen', 'active']);
  const battle = createElement('battle', ['screen']);
  const modal = createElement('modal', ['active']);
  const { runtime } = loadRuntime({ elements: [home, battle, modal] });

  assert.equal(runtime.safeShowScreen('battle'), true);
  assert.equal(home.classList.contains('active'), false);
  assert.equal(battle.classList.contains('active'), true);
  assert.equal(modal.classList.contains('active'), true, 'Phần tử ngoài .screen không được bị thay đổi');

  assert.equal(runtime.safeShowScreen('missing'), false);
  assert.equal(home.classList.contains('active'), false);
  assert.equal(battle.classList.contains('active'), false);
});

test('GameRuntime.safeShowScreen ưu tiên showScreen và nuốt lỗi tùy chọn', () => {
  const visited = [];
  const loaded = loadRuntime({ globals: { showScreen: (id) => visited.push(id) } });
  assert.equal(loaded.runtime.safeShowScreen('home'), true);
  assert.deepEqual(visited, ['home']);

  loaded.context.showScreen = () => { throw new Error('transition failed'); };
  assert.equal(loaded.runtime.safeShowScreen('battle'), false);
});

test('Timer registry tự xóa timer đã chạy khỏi Set', () => {
  const { runtime, timers } = loadRuntime();
  const registry = runtime.createTimerRegistry();
  let calls = 0;
  const handle = registry.later(() => { calls += 1; }, 75);

  assert.equal(registry.timers.has(handle), true);
  assert.equal(timers.pending.get(handle).delay, 75);
  assert.equal(timers.fire(handle), true);
  assert.equal(calls, 1);
  assert.equal(registry.timers.has(handle), false);
});

test('Timer registry clear hủy mọi callback còn chờ', () => {
  const { runtime, timers } = loadRuntime();
  const registry = runtime.createTimerRegistry();
  let calls = 0;
  const first = registry.later(() => { calls += 1; }, 10);
  const second = registry.later(() => { calls += 1; }, 20);

  registry.clear();
  assert.equal(registry.timers.size, 0);
  assert.equal(timers.pending.size, 0);
  assert.equal(timers.cleared.has(first), true);
  assert.equal(timers.cleared.has(second), true);
  assert.equal(timers.fire(first), false);
  assert.equal(timers.fire(second), false);
  assert.equal(calls, 0);
});

test('GameRuntime.reducedMotion dùng matchMedia fallback và ưu tiên REDUCED_MOTION', () => {
  const queries = [];
  const loaded = loadRuntime({
    globals: {
      matchMedia(query) {
        queries.push(query);
        return { matches: true };
      },
    },
  });
  assert.equal(loaded.runtime.reducedMotion(), true);
  assert.deepEqual(queries, ['(prefers-reduced-motion: reduce)']);

  loaded.context.REDUCED_MOTION = () => false;
  assert.equal(loaded.runtime.reducedMotion(), false);
  assert.equal(queries.length, 1, 'Có REDUCED_MOTION thì không gọi matchMedia fallback');

  assert.equal(loadRuntime().runtime.reducedMotion(), false);
});
