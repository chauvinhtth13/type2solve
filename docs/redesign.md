# Type2Solve experience update

## Implemented

- Home groups Hanoi with solo practice and uses a consistent set of eight inline SVG mode icons.
- The adventure tile shows all ten stages and a saved-progress continuation label.
- Profile summaries show earned star badges and independent correct answers for the most-practiced question type.
- Boss introductions lead with the objective; biography and numeric details are available through a native disclosure.
- The battle layout gives more width to the question. Its timer sits above the question, mobile controls wrap explicitly, and virtual-keyboard handling compresses decorative content.
- Boss results offer direct continuation, optional shopping, and untimed review of up to five recent difficult questions.
- Review does not grant currency, stars, or mastery credit. Original answer attempts are saved by question type; hint-assisted answers are counted separately.
- Character skins vary their silhouette as well as color. Existing SVG rigs, offline fonts and synthesized sound remain in use.
- Shared automatic/light/off effects preferences apply across the game, with OS reduced-motion taking precedence. Typing reports sustained slow frames to the automatic quality setting.
- Health, energy and timer fills animate with transforms. Combat effects use bounded particle counts and a cancellable, pausable scheduler.
- Damage, revival, boss rewards and survival progression resolve independently of presentation callbacks. Duplicate boss completion and rapid continuation are guarded.

## Ownership and invariants

- `src/scripts/engine/runtime.js`: `createSessionScheduler()` owns delayed combat tasks, pause/resume and cancellation. Existing timer-registry callers remain compatible.
- `src/scripts/engine/experience.js`: shared effect preferences and the bounded in-memory review queue. Storage remains exclusively behind `GameStorage`.
- `src/scripts/games/adventure/session.js`: navigation, explicit battle phases and cleanup. Screen activation is synchronous; CSS provides the transition.
- `src/scripts/games/adventure/combat.js`: resolve outcomes before presenting effects; all delayed effects must be cancellable.
- `src/scripts/platform/storage.js`: schema version 2 adds normalized learning counters and the effect setting. The save key and existing adventure, inventory and records are preserved during migration.
- `src/styles/theme-playful.css`: the final experience section owns the refined layout and visual states. It retains existing responsive width scaling through 8K.

States are `idle`, `question`, `resolving`, `feedback`, `paused`, and `results`. Pausing stores the previous phase and remaining delay. Leaving cancels callbacks, removes transient effects and saves already-earned progress.

## Validation

Run `npm run verify` for unit tests, static checks, a production build, production browser tests, and the focused source browser suite. `npm run test:experience` also captures six screenshots in the ignored `artifacts/redesign/` directory.

The focused suite exercises immediate damage, pause/resume, reward idempotence, practice completion, optional shop continuation, rapid navigation, mobile overflow and control overlap, survival progression, and motion preferences. Existing browser coverage retains keyboard/IME, offline caching, all game modes, and HD through 8K layout checks.

## Performance decisions

Keep the current DOM/SVG/Canvas architecture. The existing 4.63 MB vocabulary file remains deferred and offline-cached. No new runtime dependencies, webfonts, bitmap downloads, or recorded audio were introduced.

A local gzip comparison before the final mobile CSS adjustment measured JavaScript at 106,492 → 110,172 bytes and CSS at 28,359 → 30,511 bytes. These are compression measurements, not deployed transfer sizes or a frame-rate benchmark. Confirm response compression on the production host.

## Follow-up requiring real player/device evidence

The proposal's renderer migration, vocabulary splitting, new raster asset pipeline, daily challenges, and adaptive difficulty were conditional options. They have not been introduced without evidence that they improve this game. Validate reading comprehension and replay intent with children, and profile actual low-end phones before tuning frame budgets or expanding the reward system. Headless desktop tests cannot establish mobile battery usage, sustained 60fps, retention improvement, or real software-keyboard behavior.


## Game setup layout audit — September 12, 2026

Reviewed all eight modes: Adventure, Blitz, Survival, Typing, Sudoku, Duel, Nim, and Hanoi. Browser survey covers 19 screen states at 1366×768, 768×1024, 390×844, and 320×740, including expanded instructions, the typing campaign map, Duel allocation and gameplay, and six-pile Nim settings.

Verified issues and changes:
- Duel and Nim previously centered overflowing flex content, clipping the beginning of setup screens. Game cards now own vertical scrolling; sections use natural document flow.
- Fixed mobile select and record-grid overflow in Duel, Nim, Hanoi, and Typing.
- Duel and Nim separate character selection from match settings. Character buttons and player-name fields retain usable touch sizes.
- Hanoi separates its character and instructions from disk selection, records, and the launch action.
- Detailed Duel/Hanoi instructions use native keyboard-accessible disclosures. Essential game rules remain visible before starting.
- Typing prioritizes language, difficulty, campaign and free-practice launch. Reset management and the campaign map have separate expandable sections.
- Mobile topbars keep home navigation and game controls together. Sudoku difficulty cards and Duel allocation controls adapt to narrow widths.

Validation: `npm run verify` passed, including unit/static checks, production browser gameplay tests, and experience checks. The layout survey passed 76 screen/viewport combinations without horizontal overflow or runtime errors. Default setup screens fit the 1366×768 laptop viewport. Longer content on phones and expanded instructions intentionally scroll vertically; this is not a claim that every game fits without scrolling.

Reproduce the visual survey with `LAYOUT_PHASE=after node scripts/audit-layouts.mjs` (PowerShell: `$env:LAYOUT_PHASE='after'; node scripts/audit-layouts.mjs`). Screenshots and geometry reports are saved under `artifacts/layouts/after/`; release output is in `artifacts/layout-release-check.log`. Browser emulation does not replace physical-device testing.
