# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Đấu Trường Tư Duy (Type2Solve) — a zero-backend, zero-framework Vietnamese educational PWA
(math boss battles, English–Vietnamese typing, Sudoku, Duel, Nim, Tower of Hanoi).
User-facing strings and most code comments are Vietnamese; keep it that way.

## Commands

```bash
npm run serve            # dev server on 127.0.0.1:4173 (DTTD_PORT to override), serves src/ directly
npm test                 # unit + static smoke
npm run test:unit        # node:test suites under tests/unit/
npm run test:browser     # Chrome DevTools-Protocol E2E against src/ via the dev server
npm run build            # assemble + bundle into dist/
npm run test:dist        # same E2E suite against the built dist/ (requires build first)
npm run verify           # test + build + test:dist — run before release
npm run build:dictionary # regenerate src/assets/data/english-vocabulary.json
```

Single unit file: `node tests/unit/storage.mjs` (or `node --test --test-name-pattern '<name>' tests/unit/game-rules.mjs`).
E2E needs Chrome; set `CHROME_PATH` if it isn't at the default Windows install path.
`tests/dist.mjs` splits the suite into two Chrome lifecycles via `DTTD_BROWSER_EARLY` / `DTTD_BROWSER_LATE`;
either flag also works directly on `tests/browser.mjs` to run half the suite.
Any test harness can be pointed at a different root with `DTTD_ROOT`.

There is no linter or formatter. `tests/smoke.mjs` is the static gate: `node --check` on every
`src/`, `scripts/`, `tests/` script, plus reference/asset integrity, duplicate-id detection,
manifest + service-worker asset coverage, dictionary schema, and a ban on direct `localStorage` use.

## Architecture

Browser scripts are **classic scripts, not modules**. `src/index.html` lists them in dependency
order and that ordering is the single source of truth: `scripts/build.mjs` reads the `<script>`/
`<link>` tags out of the assembled HTML and concatenates them in that order into
`dist/assets/app.js` + `app.css`. Adding a file means adding a tag in the right slot — there is no
second manifest of load order.

`src/index.html` and `src/views/**` are stitched by `<!-- @include path -->` directives resolved in
`scripts/lib/html.mjs` (`renderHtml`). The dev server, smoke test and build all call that one
function, so HTML never has three assembly paths. Includes may not escape the HTML root and cycles
throw.

Dependency direction: `views` / game `index.js` → game `rules.js` → pure data; engine and platform
sit underneath and own all DOM/Audio/Storage/SW access.

- `src/scripts/games/<game>/rules.js` — pure formulas, exposed frozen on `window` (`NimRules`,
  `DuelRules`, `HanoiRules`). No DOM, storage, audio, or screen state. Unit tests load these into a
  `vm` sandbox, so they must run standalone in a bare global.
- `src/scripts/games/<game>/index.js` — session state, render, input, and a `cleanup*Game()` global.
  Games talk to each other only through `engine/` or `platform/`.
- `src/scripts/platform/storage.js` — the only writer of `localStorage`. Versioned schema (`VERSION`,
  key `dau-truong-tu-duy:save`), migration + normalization of corrupt data, in-memory fallback, and a
  `game-storage:change` event that refreshes the HUD. Schema changes require bumping the version,
  writing migrations from every supported version, and tests for corrupt/missing/out-of-range data.
  Never change or drop the key.
- `src/scripts/engine/runtime.js` — shared helpers (`GameRuntime`, plus `$`, `ri`, `pick`, `shuffle`
  globals) including `createTimerRegistry()` and `reducedMotion()`.
- `src/scripts/app/bootstrap.js` — app-level composition only: art hydration, profile summary,
  modal focus trap, keyboard shortcuts, visibility handling, SW registration.

Game entry points are wired to HTML `onclick` handlers and asserted by the E2E suite, so the
`window.*` surface (`openXGame`, `startX`, `leaveXGame`, `cleanupXGame`, frozen `XGame` /`XRules`
objects) is a contract. Removing one requires proving no static reference, no browser-test use, and
no HTML handler — for previously public APIs, migrate callers first and delete the alias a release
later.

**Lifecycle:** every per-session timer, RAF and listener must be cancellable; `goHome()` in
`src/scripts/games/adventure/session.js` calls each game's cleanup before switching screens. Use a
token or the timer registry so stale callbacks cannot mutate fresh state.

**PWA/build:** `src/sw.js` is the readable dev version. The build rewrites `CACHE_VERSION`,
`CORE_ASSETS` and `DEFERRED_ASSETS` in `dist/sw.js` from the actual emitted files, hashing deferred
assets (dictionary, images — listed in `scripts/project.mjs`) too so a stale dictionary can't linger
in cache. Never hand-edit `dist/`; it is generated and gitignored. All runtime URLs are relative so
the app works under a GitHub Pages subpath.

`src/scripts/games/adventure/questions.js` generates questions from formulas at runtime;
`docs/question-bank/*.md` are lookup catalogs only and are never loaded.

Deeper notes: [docs/architecture.md](docs/architecture.md), [docs/audit.md](docs/audit.md).
