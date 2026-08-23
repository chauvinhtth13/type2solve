# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Đấu Trường Tư Duy" — a Vietnamese-language educational browser game (math boss battles, English/Vietnamese typing game, 9×9 Sudoku). Static site, zero dependencies, no build step, no bundler. All UI text, comments, and test messages are in Vietnamese; keep new strings Vietnamese.

## Commands

```bash
npm run serve            # static server on http://127.0.0.1:4173 (override: DTTD_PORT=8080)
npm test                 # smoke test: reference integrity + `node --check` on every .js/.mjs
npm run test:browser     # end-to-end via headless Chrome + CDP
npm run build:dictionary # regenerate assets/data/english-vocabulary.json (needs: python -m pip install wordfreq)
```

`tools/browser-smoke.mjs` defaults to a **Windows** Chrome path; on macOS run it as:

```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:browser
```

Neither test runner supports selecting a single case — both are single scripts that assert top to bottom and stop at the first failure. To iterate on one behavior, run `npm run serve` and evaluate the same expression the test uses in the DevTools console (every game API is a global). Do not open `index.html` over `file://`; the service worker only registers on http(s)/localhost.

## Architecture

### Load order is the module system

There is no bundler and no ES modules. [index.html:451-458](index.html#L451-L458) loads eight scripts in a fixed order, and each later file depends on globals defined by earlier ones:

```
storage.js → core.js → question-bank.js → arena.js
           → data/typing-content.js → games/typing.js → games/sudoku.js → bootstrap.js
```

That same list is mirrored in `CORE_ASSETS` in [sw.js:7-23](sw.js#L7-L23). **Any new script must be added to both**, before `bootstrap.js`, and `CACHE_VERSION` in `sw.js` must be bumped or returning users keep the stale shell.

### Layers

- [assets/js/storage.js](assets/js/storage.js) — `window.GameStorage`, a frozen API (`load/save/addStars/updateRecords/setAdventure/updateSettings/reset`). The **only** writer of `localStorage`. Every read runs through `migrate()` + `normalize()`, which whitelists each field (settings use `includes()` allow-lists, records are clamped integers). Adding a setting or record means editing `defaultState()` **and** `normalize()`, otherwise it is silently dropped on the next load. Falls back to an in-memory profile when storage is blocked or corrupt. Writes emit both `game-storage:change` and `learning-progress` on `window`; `bootstrap.js` listens and refreshes the home-screen profile strip.
- [assets/js/core.js](assets/js/core.js) — shared helpers (`$`, `ri`, `pick`, `shuffle`), `SFX` (WebAudio), boss/shop tables, the mutable adventure state `G`, screen routing, and the blitz/survival run modes.
- [assets/js/question-bank.js](assets/js/question-bank.js) — pure generators only, no DOM. `genQuestion(tier)` picks a type from a per-tier weighted array (tiers 1–5; repeating a name in the array raises its odds) and dispatches to a `gen*` function. Each returns `{q, ans, choices, exp, small?, svg?, type}`. Distractors come from `numChoices()`/`errPool()`, which model realistic mistakes (off-by-one, forgotten carry, digit swap, double/halve) and shuffle the answer's position; `CHOICE_TIER` decides 4 vs 5 options. Singapore-grade-3 items carry `sgKind` and may declare `acceptedAnswers`.
- [assets/js/arena.js](assets/js/arena.js) — the battle loop: question rotation with `makeFreshQuestion()` (avoids the last 40 signatures and back-to-back same type), timers, answer checking, combat FX. `isCorrectAnswer()` normalizes typed input (`0,5` ≡ `0.5`, fractions), and answers stay locked for a "read the question" delay via `scheduleAnswerUnlock()`. Async combat callbacks go through `battleLater()`, which drops work from a stale `battleRunId` so leaving the screen cannot resurrect an old animation.
- [assets/js/games/](assets/js/games/) and [assets/js/data/](assets/js/data/) — self-contained IIFEs of the form `(function name(global){ 'use strict'; … global.X = …; })(window)`, exporting their public functions at the bottom (`SudokuGame`, `TYPING_CONTENT`, `openTypingGame`, `startSudoku`, …). They reach back into the shell only through optional globals (`global.showScreen`, `global.confetti`).
- [assets/js/bootstrap.js](assets/js/bootstrap.js) — startup wiring: hydrates in-memory state from `GameStorage`, global keyboard shortcuts (1–5 to answer, Escape), modal focus trap, visibility-change auto-pause, service worker registration.

### Screens and cleanup

Every view is a `.screen` div in `index.html`; `showScreen(id)` toggles `.active` and moves focus to the heading. Games must register a cleanup global — `goHome()` in [core.js:220-234](assets/js/core.js#L220-L234) calls `cleanupTypingGame()` and `cleanupSudokuGame()` to stop rAF loops, timers, and stray FX nodes. A new game needs the same hook wired in there.

`index.html` calls globals directly from ~50 inline `onclick=` attributes, so anything the markup invokes must be assigned onto `window`/`global`.

### Content data

- Typing: base word lists live in [assets/js/data/typing-content.js](assets/js/data/typing-content.js) alongside the 10-stage `campaign` table (waves/gap/speed/level/armor are the tuning knobs — the engine reads them, no code change needed). At runtime `typing.js` lazily fetches `assets/data/english-vocabulary.json` (~4.6 MB, three level buckets of `[word, meaning, posCode]`) and appends it to `TYPING_CONTENT.en`.
- Sudoku: fixed `SEEDS` per level, permuted by row/column/digit symmetries so boards look fresh while provably keeping a unique solution; `SudokuGame.validateSeeds()` re-proves uniqueness and is asserted by the browser test.
- The dictionary pipeline ([tools/build-english-vocabulary.mjs](tools/build-english-vocabulary.mjs)) streams Kaikki/Wiktextract Vietnamese Wiktionary, ranks by `wordfreq`, and strips proper nouns, inflected forms, and flagged/unsafe entries. Attribution lives in [third_party_notices.md](third_party_notices.md) and must stay in sync.

## Tests assert exact values

Both suites hardcode numbers that ordinary-looking edits will break — check them before changing content:

- `npm test` requires `index.html` to still contain the author credit "Châu Vinh", the `coffee-qr-placeholder` block, the MathX source link, and the Sudoku screen/script; and requires the vocabulary file to hold ≥80,000 unique entries in exactly 3 levels with meanings ≤110 chars and `counts` matching the level lengths.
- `npm run test:browser` asserts 6 Sudoku levels with `ultimate` at 17 clues, the beginner board at 50 clues / 31 editable / 5 hints, 10 campaign stages with `perWave` 10–50, 500 valid `genBrainChallenge` questions across 5 tiers, 1,800 valid Singapore questions across 18 kinds plus 12 exact verified answers, typing words never clipped by the field or overlapping each other, no horizontal overflow at 390 px, service worker active with the dictionary cached, and **zero runtime JS errors**.

## Conventions

Two styles coexist; match the file you are editing rather than reformatting.

- Legacy compact style in `core.js`, `arena.js`, `question-bank.js`: minimal whitespace, `function f(x){…}` one-liners, semicolon-dense, Vietnamese block comments explaining game-design intent.
- Modern style in `storage.js`, `games/*`, `data/*`, `tools/*`: 2-space indent, named IIFE with `'use strict'`, descriptive variable names, exports collected at the end.

Persist records only through `GameStorage.updateRecords(...)` (never `localStorage` directly) so the HUD refresh event fires. Keep keyboard operability, visible focus, `aria-live` feedback regions, and `prefers-reduced-motion` handling for anything animated — the browser test and the existing CSS both depend on them.
