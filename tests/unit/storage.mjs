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
  assert.equal(initial.version, 3);
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
  assert.equal(api.load().version, 3);
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

{
  const { api, storage } = await createHarness();
  storage.setItem(api.KEY, JSON.stringify({ version: 1, profile: { stars: 42 }, adventure: { cleared: 4, coins: 99, inv: { hint: 2 } }, settings: { sound: false }, records: { hanoi: { wins: 3 } } }));
  const state = api.load();
  assert.equal(state.version, 3);
  assert.equal(state.profile.stars, 42);
  assert.equal(state.adventure.coins, 99);
  assert.equal(state.adventure.inv.hint, 2);
  assert.equal(state.records.hanoi.wins, 3);
  assert.equal(state.settings.sound, false);
  assert.equal(state.settings.effects, 'auto');
  assert.deepEqual(JSON.parse(JSON.stringify(state.learning.skills)), {});
  const normalized = api.save({ learning: { skills: { arith: { attempts: 3, correct: 20, assisted: -1 }, geo: null, bad_key: { attempts: 9 } } }, settings: { effects: 'invalid' } });
  assert.equal(normalized.learning.skills.arith.correct, 3);
  assert.equal(normalized.learning.skills.arith.assisted, 0);
  assert.equal(normalized.learning.skills.geo, undefined);
  assert.equal(normalized.learning.skills.bad_key, undefined);
  assert.equal(normalized.settings.effects, 'auto');
}

{
 const {api,storage}=await createHarness();
 storage.setItem(api.KEY,JSON.stringify({version:2,profile:{stars:19},adventure:{cleared:5},records:{typing:{bestScore:321}}}));
 assert.equal(api.load().story.fragments,6);
 assert.equal(api.load().profile.stars,19);
 assert.equal(api.load().records.typing.bestScore,321);
 api.save({story:{costume:'moon'}});
 api.setAdventure({cleared:-1,bossIndex:0});
 assert.equal(api.load().story.fragments,6,'campaign restart preserves memories');
 assert.equal(api.load().story.costume,'moon');
 api.setAdventure({cleared:6});api.setAdventure({cleared:6});
 assert.equal(api.load().story.fragments,7,'replay cannot duplicate fragments');
 assert.equal(api.load().profile.stars,19,'story never duplicates currency');
 api.save({story:{fragments:'bad',costume:'sun',questionTier:999}});
 assert.equal(api.load().story.costume,'cloud');
 assert.equal(api.load().story.questionTier,5);
 api.save({story:null});
 assert.equal(api.load().story.fragments,7,'malformed story recovers');
}
