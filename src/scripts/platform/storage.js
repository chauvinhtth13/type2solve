/* Persistent profile shared by every learning game. */
(function createGameStorage(root) {
  'use strict';

  const VERSION = 1;
  const STORAGE_KEY = 'dau-truong-tu-duy:save';
  const LEGACY_KEYS = ['dau-truong-tu-duy:v1', 'dttd-progress-v1'];
  const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  let memoryState = null;

  function nowIso() {
    return new Date().toISOString();
  }

  function defaultState() {
    const now = nowIso();
    return {
      version: VERSION,
      profile: {
        stars: 0,
        createdAt: now,
        lastPlayedAt: now,
      },
      adventure: {
        cleared: -1,
        bossIndex: 0,
      },
      records: {
        blitz: 0,
        survival: 0,
        typing: {
          bestScore: 0,
          bestWpm: 0,
          bestCombo: 0,
          campaignCleared: -1,
        },
        sudoku: {
          wins: 0,
          bestLevel: 0,
          bestTimes: {
            beginner: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            expert: 0,
            ultimate: 0,
          },
        },
        hanoi: {
          wins: 0,
          // Best move count per disk count (3..7); 0 means "no record yet".
          bestMoves: { 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        },
        nim: {
          wins: 0,
          // Wins against each computer opponent; beating "hard" is a real badge
          // because perfect play is required.
          aiWins: { easy: 0, medium: 0, hard: 0 },
        },
        duel: {
          // Hot-seat PvP has no personal record to keep, only how much was played.
          series: 0,
        },
      },
      settings: {
        sound: true,
        answerMode: 'mixed',
        typingLanguage: 'en',
        typingDifficulty: 'normal',
        accentAssist: false,
        sudokuDifficulty: 'medium',
      },
    };
  }

  function isPlainObject(value) {
    // The tag check also accepts safe plain objects passed from an iframe/test realm.
    return Boolean(value) && Object.prototype.toString.call(value) === '[object Object]';
  }

  function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (isPlainObject(value)) {
      const copy = {};
      Object.keys(value).forEach((key) => {
        if (!BLOCKED_KEYS.has(key)) copy[key] = cloneValue(value[key]);
      });
      return copy;
    }
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
    return null;
  }

  function mergeObjects(base, patch) {
    const output = isPlainObject(base) ? cloneValue(base) : {};
    if (!isPlainObject(patch)) return output;

    Object.keys(patch).forEach((key) => {
      if (BLOCKED_KEYS.has(key)) return;
      const value = patch[key];
      if (isPlainObject(value)) {
        output[key] = mergeObjects(isPlainObject(output[key]) ? output[key] : {}, value);
      } else {
        output[key] = cloneValue(value);
      }
    });
    return output;
  }

  function finiteNumber(value, fallback, minimum = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, number) : fallback;
  }

  function wholeNumber(value, fallback, minimum = 0) {
    return Math.floor(finiteNumber(value, fallback, minimum));
  }

  function validTimestamp(value, fallback = null) {
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return fallback;
    return new Date(value).toISOString();
  }

  function migrate(raw) {
    if (!isPlainObject(raw)) return {};
    const migrated = cloneValue(raw);

    // Very early prototypes stored a few counters at the top level.
    if (!isPlainObject(migrated.profile) && Number.isFinite(Number(migrated.stars))) {
      migrated.profile = { stars: Number(migrated.stars) };
    }
    if (!isPlainObject(migrated.records)) migrated.records = {};
    if (Number.isFinite(Number(migrated.records.surv)) && !Number.isFinite(Number(migrated.records.survival))) {
      migrated.records.survival = Number(migrated.records.surv);
    }
    if (Number.isFinite(Number(migrated.typingBest))) {
      migrated.records.typing = { bestScore: Number(migrated.typingBest) };
    }
    return migrated;
  }

  function normalize(raw) {
    const state = mergeObjects(defaultState(), migrate(raw));
    state.version = VERSION;

    state.profile.stars = wholeNumber(state.profile.stars, 0);
    state.profile.createdAt = validTimestamp(state.profile.createdAt, nowIso());
    state.profile.lastPlayedAt = validTimestamp(state.profile.lastPlayedAt, state.profile.createdAt);

    state.adventure.cleared = wholeNumber(state.adventure.cleared, -1, -1);
    state.adventure.bossIndex = wholeNumber(state.adventure.bossIndex, 0);

    state.records.blitz = wholeNumber(state.records.blitz, 0);
    state.records.survival = wholeNumber(state.records.survival, 0);
    state.records.typing.bestScore = wholeNumber(state.records.typing.bestScore, 0);
    state.records.typing.bestWpm = wholeNumber(state.records.typing.bestWpm, 0);
    state.records.typing.bestCombo = wholeNumber(state.records.typing.bestCombo, 0);
    state.records.typing.campaignCleared = Math.min(9, wholeNumber(state.records.typing.campaignCleared, -1, -1));
    if (!isPlainObject(state.records.sudoku)) state.records.sudoku = cloneValue(defaultState().records.sudoku);
    if (!isPlainObject(state.records.sudoku.bestTimes)) state.records.sudoku.bestTimes = cloneValue(defaultState().records.sudoku.bestTimes);
    state.records.sudoku.wins = wholeNumber(state.records.sudoku.wins, 0);
    state.records.sudoku.bestLevel = Math.min(6, wholeNumber(state.records.sudoku.bestLevel, 0));
    ['beginner', 'easy', 'medium', 'hard', 'expert', 'ultimate'].forEach((level) => {
      state.records.sudoku.bestTimes[level] = wholeNumber(state.records.sudoku.bestTimes[level], 0);
    });
    if (!isPlainObject(state.records.hanoi)) state.records.hanoi = cloneValue(defaultState().records.hanoi);
    if (!isPlainObject(state.records.hanoi.bestMoves)) state.records.hanoi.bestMoves = cloneValue(defaultState().records.hanoi.bestMoves);
    state.records.hanoi.wins = wholeNumber(state.records.hanoi.wins, 0);
    // Chi giu dung cac muc dia 3..7; khoa la khong bao gio duoc ghi vao ho so.
    const hanoiMoves = {};
    [3, 4, 5, 6, 7].forEach((disks) => {
      hanoiMoves[disks] = wholeNumber(state.records.hanoi.bestMoves[disks], 0);
    });
    state.records.hanoi.bestMoves = hanoiMoves;
    if (!isPlainObject(state.records.nim)) state.records.nim = cloneValue(defaultState().records.nim);
    if (!isPlainObject(state.records.nim.aiWins)) state.records.nim.aiWins = cloneValue(defaultState().records.nim.aiWins);
    state.records.nim.wins = wholeNumber(state.records.nim.wins, 0);
    const nimAiWins = {};
    ['easy', 'medium', 'hard'].forEach((level) => {
      nimAiWins[level] = wholeNumber(state.records.nim.aiWins[level], 0);
    });
    state.records.nim.aiWins = nimAiWins;
    if (!isPlainObject(state.records.duel)) state.records.duel = cloneValue(defaultState().records.duel);
    state.records.duel.series = wholeNumber(state.records.duel.series, 0);


    state.settings.sound = state.settings.sound !== false;
    state.settings.answerMode = ['mixed', 'choice', 'input'].includes(state.settings.answerMode)
      ? state.settings.answerMode
      : 'mixed';
    state.settings.typingLanguage = ['en', 'vi'].includes(state.settings.typingLanguage)
      ? state.settings.typingLanguage
      : 'en';
    state.settings.typingDifficulty = ['superslow', 'easy', 'normal', 'hard', 'superfast'].includes(state.settings.typingDifficulty)
      ? state.settings.typingDifficulty
      : 'normal';
    state.settings.accentAssist = state.settings.accentAssist === true;
    state.settings.sudokuDifficulty = ['beginner', 'easy', 'medium', 'hard', 'expert', 'ultimate'].includes(state.settings.sudokuDifficulty)
      ? state.settings.sudokuDifficulty
      : 'medium';

    // Read-only compatibility aliases for the first modular prototype.
    state.stars = state.profile.stars;
    state.records.surv = state.records.survival;
    state.records.typingEn = Math.max(
      wholeNumber(state.records.typingEn, 0),
      state.records.typing.bestScore,
    );
    state.records.typingVi = Math.max(
      wholeNumber(state.records.typingVi, 0),
      state.records.typing.bestScore,
    );
    return state;
  }

  function localStore() {
    try {
      return root.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function persist(state) {
    const normalized = normalize(state);
    memoryState = normalized;
    const store = localStore();
    if (store) {
      try {
        store.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch (error) {
        // Private browsing and full quotas still get a working in-memory profile.
      }
    }
    return cloneValue(normalized);
  }

  function readRaw() {
    const store = localStore();
    if (!store) return memoryState;

    let serialized = null;
    try {
      serialized = store.getItem(STORAGE_KEY);
      if (serialized === null) {
        for (const legacyKey of LEGACY_KEYS) {
          serialized = store.getItem(legacyKey);
          if (serialized !== null) break;
        }
      }
    } catch (error) {
      return memoryState;
    }

    if (serialized === null) return memoryState;
    try {
      return JSON.parse(serialized);
    } catch (error) {
      // Ignore damaged data instead of preventing the app from starting.
      return null;
    }
  }

  function emitChange(state) {
    if (typeof root.dispatchEvent !== 'function' || typeof root.CustomEvent !== 'function') return;
    root.dispatchEvent(new root.CustomEvent('game-storage:change', {
      detail: cloneValue(state),
    }));
  }

  function load() {
    const raw = readRaw();
    const state = normalize(raw || memoryState || defaultState());
    memoryState = state;

    // Silently upgrade old schemas and replace malformed serialized values.
    if (!raw || Number(raw.version) !== VERSION) persist(state);
    return cloneValue(state);
  }

  function commit(nextState) {
    const normalized = normalize(nextState);
    normalized.profile.lastPlayedAt = nowIso();
    const saved = persist(normalized);
    emitChange(saved);
    return saved;
  }

  function save(nextState) {
    const current = load();
    const merged = isPlainObject(nextState) ? mergeObjects(current, nextState) : current;
    return commit(merged);
  }

  function addStars(amount) {
    const delta = Number(amount);
    const state = load();
    if (!Number.isFinite(delta)) return state;
    state.profile.stars = Math.max(0, Math.floor(state.profile.stars + delta));
    return commit(state);
  }

  function updateRecords(partial) {
    const state = load();
    if (isPlainObject(partial)) {
      const compatible = cloneValue(partial);
      if (Number.isFinite(Number(compatible.surv)) && !Number.isFinite(Number(compatible.survival))) {
        compatible.survival = Number(compatible.surv);
      }
      state.records = mergeObjects(state.records, compatible);
    }
    return commit(state);
  }

  function setAdventure(partial) {
    const state = load();
    if (isPlainObject(partial)) state.adventure = mergeObjects(state.adventure, partial);
    return commit(state);
  }

  function updateSettings(partial) {
    const state = load();
    if (isPlainObject(partial)) state.settings = mergeObjects(state.settings, partial);
    return commit(state);
  }

  function reset() {
    const store = localStore();
    if (store) {
      try {
        store.removeItem(STORAGE_KEY);
      } catch (error) {
        // The fresh in-memory state below is enough when storage is unavailable.
      }
    }
    const state = persist(defaultState());
    emitChange(state);
    return state;
  }

  root.GameStorage = Object.freeze({
    VERSION,
    KEY: STORAGE_KEY,
    load,
    save,
    addStars,
    updateRecords,
    setAdventure,
    updateSettings,
    reset,
  });
})(typeof window !== 'undefined' ? window : globalThis);
