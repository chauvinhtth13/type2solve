# Campaign atlas cleanup

The game library has eight unique entries: Adventure, Blitz, Survival, Typing, Sudoku, Hanoi, Duel and Nim. These are distinct live modes, not duplicate implementations.

Removed:
- The obsolete root index.html, which referenced missing assets and was not used by the source server or production build.
- The tracked .DS_Store file.
- The second Adventure entry and seven repeated story-screen game launch buttons.
- The old story-home partial, ten accordion panels, and their renderer.
- Unused projEase/shootBeam helpers and the bootstrap branch for the missing homeBigEmoji element.
- Superseded home selector branches in app.css and theme-playful.css, and obsolete story presentation styles.

The home and atlas presentation now lives in story-world.css. Shared game styles and controllers remain in place. The service-worker cache version changes so offline clients receive the new shell.

The atlas previews guardian stories without modifying campaign progress. Its single play action resumes the saved campaign. Existing save data, costumes, question tiers and all eight game modes are preserved.
