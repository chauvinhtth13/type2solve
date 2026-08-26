import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fromSource } from '../../scripts/project.mjs';

class MemoryStorage {
  #rows = new Map();

  getItem(key) {
    return this.#rows.has(String(key)) ? this.#rows.get(String(key)) : null;
  }

  setItem(key, value) {
    this.#rows.set(String(key), String(value));
  }

  removeItem(key) {
    this.#rows.delete(String(key));
  }
}

class FakeCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

async function createHarness() {
  const storage = new MemoryStorage();
  const events = [];
  const context = {
    console,
    CustomEvent: FakeCustomEvent,
    Date,
    JSON,
    localStorage: storage,
    dispatchEvent: (event) => events.push(event),
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  const source = await readFile(fromSource('scripts/platform/storage.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'storage.js' });
  return { api: context.GameStorage, context, events, storage };
}

{
  const { api, events, storage } = await createHarness();
  const initial = api.load();
  assert.equal(initial.version, 1);
  assert.equal(initial.profile.stars, 0);
  assert.ok(storage.getItem(api.KEY));

  const saved = api.addStars(3);
  assert.equal(saved.profile.stars, 3);
  assert.deepEqual(events.map((event) => event.type), ['game-storage:change']);

  saved.profile.stars = 99;
  assert.equal(api.load().profile.stars, 3, 'public results must be defensive clones');

  api.save(JSON.parse('{"__proto__":{"polluted":true},"profile":{"stars":4}}'));
  assert.equal(api.load().profile.stars, 4);
  assert.equal({}.polluted, undefined, 'prototype-pollution keys must be ignored');

  storage.setItem(api.KEY, '{damaged json');
  assert.doesNotThrow(() => api.load());
  assert.equal(api.load().version, 1);
}

{
  const { api, storage } = await createHarness();
  storage.setItem('dttd-progress-v1', JSON.stringify({ stars: 7, typingBest: 42 }));
  const migrated = api.load();
  assert.equal(migrated.profile.stars, 7);
  assert.equal(migrated.records.typing.bestScore, 42);
  assert.ok(storage.getItem(api.KEY), 'legacy data must be persisted under the current key');
}

console.log('✓ GameStorage: schema, migration, corruption fallback, cloning and one change event');
