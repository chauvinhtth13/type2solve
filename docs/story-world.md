# Mây và Mười Mảnh Sao
The Star Tree connects ten lands. Mây restores it through guardian trials. Each guardian has dialogue, a landmark, a restoration moment and a collectible memory.

## Ownership
story-world.js owns chapter data, SVG scenery and atlas presentation. story-world.css owns styles. Game controllers still own outcomes. Storage schema 3 retains the original key and migrates Adventure completion into fragments. Memories survive campaign restart. Costumes are validated against unlock thresholds.

## Progression
One fragment per completed chapter, without duplicate story currency. Cape colors unlock at 3, 6 and 10 fragments. The seven other game modes stay in the home library; Duel never gates solo progress. Players can keep increasing question difficulty or select a fixed tier for the next Adventure run.

## Graphics
Ten SVG landmarks extend Adventure and Typing. Sudoku, Duel, Nim and Hanoi have distinct illustrated settings. Existing rigs and cancellable effects remain. No new frame loop, external font, engine or bitmap dependency.

## Validation
Run npm run verify, npm run test:browser, npm run test:typing and npm run test:story. Physical-device frame rate, battery use and keyboard behavior require separate measurement.

## Interaction and rendering
The single campaign entrance opens a connected ten-guardian atlas. Selecting a guardian previews its landscape, dialogue and unlocked memory in one detail panel without changing progress. One play button resumes the actual saved campaign, even when another guardian is selected. Costume and question-tier controls live in the expandable equipment panel. The home library has exactly one entry per distinct game. State signatures avoid rebuilding unchanged presentation; costume focus survives updates.

The landscape uses layered vector mountains, a winding path, foreground trees and a chapter-specific landmark. The existing shared character artwork appears on the campaign cover, map and detail panel. All assets stay local and effects-off/reduced-motion behavior remains supported.
