# Mây và Mười Mảnh Sao
The Star Tree connects ten lands. Mây restores it through guardian trials. Each guardian has dialogue, a landmark, a restoration moment and a collectible memory.

## Ownership
story-world.js owns chapter data, SVG scenery and journal presentation. story-world.css owns styles. Game controllers still own outcomes. Storage schema 3 retains the original key and migrates Adventure completion into fragments. Memories survive campaign restart. Costumes are validated against unlock thresholds.

## Progression
One fragment per completed chapter, without duplicate story currency. Cape colors unlock at 3, 6 and 10 fragments. Optional quests read existing records; Duel never gates solo progress. Players can keep increasing question difficulty or select a fixed tier for the next Adventure run.

## Graphics
Ten SVG landmarks extend Adventure and Typing. Sudoku, Duel, Nim and Hanoi have distinct illustrated settings. Existing rigs and cancellable effects remain. No new frame loop, external font, engine or bitmap dependency.

## Validation
Run npm run verify, npm run test:browser, npm run test:typing and npm run test:story. Physical-device frame rate, battery use and keyboard behavior require separate measurement.

## Interaction and rendering
The home tile opens a separate scrolling journal so the laptop game selector remains fully visible. Side-quest buttons launch the corresponding game. The journal preserves expanded chapter entries and costume focus when updating. It skips reconstruction when story and records have not changed.
Battle scenes are cached by chapter; decorative SVG has no event handlers or frame loop. Guardian projectiles reuse the combat scheduler. New gestures obey pause, hidden-document and reduced-motion states.

## Implemented presentation
- Adventure: ten landmarks, guardian dialogue, restoration text, distinct spell silhouettes and cape rewards.
- Blitz/Survival: beacon/moon settings and three progress lanterns.
- Typing: ten chapter landmarks within its existing layered forest.
- Sudoku: archive setting and compact row-constellation progress.
- Nim: SVG crystal pieces and a quiet themed board.
- Hanoi: scenery behind the disk board; readable sizes and move affordances remain.
- Duel: sun-festival setting and an active-player outline.

The release retains existing wave counts and combat stats. Physical-device profiling and player studies were not available in this workspace; no measured battery, retention or mobile FPS improvement is claimed.
