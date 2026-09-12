# Cute fantasy characters

The game uses one lightweight SVG rig for Mây, the bunny star mage, and ten distinct creature forms. The artwork is shared by math battles, boss introductions, typing monsters and character selection.

| Character | Visual identity |
| --- | --- |
| Mây | Cream bunny, periwinkle hat and cape, star wand |
| Sora | Mint snail, biscuit-colored spiral shell, pocket watch |
| Sparky | Violet sprite, lightning ears and tail |
| Stitchwork | Peach plush bear, stitched patch, storybook |
| Ignis | Honey-colored baby dragon, tiny horns and spiked tail |
| Vex | Candy-pink imp, small wings, heart charm |
| Nocturne | Blue moon bat, oversized ears, moon collar |
| Glacius | Ice-blue dragon, crystal wings, snowflake |
| Sol-Kahn | Golden sun lion, warm mane, little crown |
| Lumiel | Forest mage, lavender mushroom cap, sprouting staff |
| Leviator | Teal octopus, soft tentacles, pearl crown |

All art fits a 120×120 viewBox. Dark oval eyes, two-point highlights, blush cheeks and rounded contact shadows keep the family consistent. Character details stay in named groups so existing casting, hit and victory animations continue to work. Phase changes retain the silhouette and add determined brows; switching skins resets the expression.

Owners: `src/views/shared/art.html`, `src/scripts/engine/art.js`, and the fantasy-character section of `src/styles/theme-playful.css`. Names and descriptions live in adventure configuration; combat stats and progression are unchanged by this art pass.

Run `node scripts/preview-characters.mjs` to render the lineup and a battle screenshot under `artifacts/characters/`. Run `npm run verify` for release checks.
