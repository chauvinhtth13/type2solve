# Đấu Trường Tư Duy · Type2Solve
## HD-2D Art Prompt Pack

Ready-to-paste prompts for the key-art background, the hero character, and all 10 boss guardians — every value below is pulled straight from `BOSS_ART` and `config.js` in the game's own code, so the art stays traceable to what's actually on screen.

---

## 01. Style Bible

Paste this block — or its key phrases — at the start of every prompt below so the whole set stays visually coherent, regardless of which generator you use.

* **Style**: HD-2D painterly diorama (think Octopath Traveler): hand-painted 2.5D scene, thick soft outlines, gentle painterly brushwork — not flat vector, not photoreal.
* **Lighting**: One consistent light source, warm celestial-gold from upper-left, crossed by a cool arcane-cyan rim/bounce light from below. Soft bloom on every light source.
* **Depth**: Tilt-shift focus — sharp subject, softly blurred background — with a deep cosmic-violet night sky behind everything.
* **Palette**: Saturated but not neon; every image reads against the four accent colors below plus a near-black sky.
  * Sky: `#080b26`
  * Gold: `#ffd166`
  * Cyan: `#41d7ea`
  * Violet: `#9b7bff`
  * Boss Red: `#ff6d80`
* **Framing**: Square portrait crop for characters (drops into a circular UI frame), centered subject, no text, no watermark, no signature.

---

## 02. Background & Hero

The two non-boss assets. The background prompt matches the isometric floating-platform diorama already coded into the game (`src/views/shared/diorama.html`), so a real render can drop in behind it.

### Key-art Background
* **File**: `key_art_header.jpg`
* **Concept**: Floating diorama sky
* **Prompt**:
  > HD-2D painterly diorama, wide landscape key-art background. Several small floating stone platforms and islands of varying size drift at different depths against a deep cosmic-violet night sky, each platform lit by a warm celestial-gold glow from above and a cool arcane-cyan glow from below. Distant pixel-soft stars, faint nebula haze, gentle tilt-shift blur on the farthest platforms, crisp detail on the nearest one. No characters, no text, no logo. 16:9 landscape.

### Hero Character
* **File**: `hero_wizard.jpg`
* **Concept**: Player's battle-mage
* **Prompt**:
  > HD-2D painterly portrait of a young apprentice battle-mage, the player's hero character. Warm gold aura circle behind them, one hand raised mid-cast with a small arcane-cyan spark. Confident, determined expression. Simple traveling robes in deep blue and gold trim, no elaborate armor. Square portrait, centered, soft dark vignette background, thick painterly outline, soft bloom lighting, no text.

---

## 03. The 10 Bosses

One prompt per boss, generated from that boss's actual body/belly/horn colors, parts list and expression (`src/scripts/engine/art.js`), plus its name, mechanic and arena (`src/scripts/games/adventure/config.js`).

### 🐌 #1 Sora Ốc Sên Thời Gian
* **File**: `boss_01_sora.jpg`
* **Traits**: idle, watchful | no horns | arena: open platform
* **Prompt**:
  > A calm, watchful snail-like fantasy guardian, HD-2D painterly style. Primary shell color electric cyan (`#00f2fe`) with a pale cyan-white underbelly (`#e0f7fa`), gold (`#ffd700`) highlight trim, no horns. Features a large rounded shell on its back and two slender eye-stalks atop its head. Aura glows soft cyan. Set on a floating stone platform under a starry violet night sky. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 👾 #2 Sparky Quái Nhí Sấm Sét
* **File**: `boss_02_sparky.jpg`
* **Traits**: mischief, sly | no horns | arena: open platform
* **Prompt**:
  > A small, sly, playful fantasy imp, HD-2D painterly style. Primary body color violet-purple (`#9b51e0`) with a pale lilac underbelly (`#f3e5f5`), orange (`#ff9f43`) highlight trim, no horns. Features two thin antennae twitching above its head, mischievous grin. Aura glows soft violet. Set on a floating stone platform under a starry violet night sky. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 🧟 #3 Stitchwork Zombie Tri Thức
* **File**: `boss_03_stitchwork.jpg`
* **Traits**: scholar, bookish | no horns | 💚 self-heal | arena: night
* **Prompt**:
  > A studious, bookish patchwork zombie scholar, HD-2D painterly style. Primary body color emerald green (`#2ed573`) with a pale mint underbelly (`#e8f8f5`), teal (`#26de81`) highlight trim, no horns. Features visible stitched seams crossing its body and sharp fangs poking from its mouth, wears cracked round spectacles. Aura glows soft green. Set in a moonlit graveyard clearing under a magenta-tinted aurora sky. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 🦖 #4 Ignis Khủng Long Nham Thạch
* **File**: `boss_04_ignis.jpg`
* **Traits**: fierce, battle-ready | horns | 🛡️ armored | arena: open platform
* **Prompt**:
  > A fierce, battle-ready dinosaur-like fantasy guardian, HD-2D painterly style. Primary body color molten red (`#ff5252`) with a golden underbelly (`#ffda79`), burnt-orange (`#ff793f`) horns and highlight trim, single central head-horn. Features heavy armor plates running down its back and tail, sharp fangs. Aura glows soft red. Set on a floating stone platform under a starry violet night sky. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 👹 #5 Vex Quỷ Đỏ Cuồng Nộ
* **File**: `boss_05_vex.jpg`
* **Traits**: rage, furious | horns | 😡 enrages | arena: lava
* **Prompt**:
  > A furious, boiling-with-rage red oni demon, HD-2D painterly style. Primary body color deep crimson (`#ff3838`) with a pale pink underbelly (`#ffb8b8`), amber (`#ff9f1a`) horns and highlight trim, single central head-horn. Bares sharp fangs in a snarl. Aura glows intense red. Set in a cracked volcanic cavern glowing with molten orange light. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 🧛 #6 Nocturne Ma Cà Rồng Học Thuật
* **File**: `boss_06_nocturne.jpg`
* **Traits**: sanguine, theatrical | no horns | 🩸 lifesteal | arena: night
* **Prompt**:
  > A theatrical, seductive vampire scholar, HD-2D painterly style. Primary body color rich magenta (`#be2edd`) with a rose-pink underbelly (`#f8a5c2`), bright violet (`#e056fd`) highlight trim, no horns. Wears a flowing tattered cape and a pair of membranous bat-like wings, long pointed ears, sharp fangs. Aura glows soft magenta. Set in a moonlit graveyard clearing under a magenta-tinted aurora sky. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 🐉 #7 Glacius Rồng Băng Vĩnh Cửu
* **File**: `boss_07_glacius.jpg`
* **Traits**: frost, regal | horns | 🛡️ armored | arena: ice
* **Prompt**:
  > A cold, regal ice dragon, HD-2D painterly style. Primary scale color glacial blue (`#17c0eb`) with a frost-white underbelly (`#dff9fb`), bright cyan (`#18dcff`) horns and highlight trim, single central head-horn. Features a pair of crystalline wings, a long tail, and armored ice plates along its spine. Aura glows soft cyan. Set in a frozen glacial cavern lit by cool cyan light. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 👑 #8 Sol-Kahn Vua Quái Vật Thái Dương
* **File**: `boss_08_solkahn.jpg`
* **Traits**: royal, imperious | horns | 😡 enrages | arena: lava
* **Prompt**:
  > An imperious, majestic solar monster-king, HD-2D painterly style. Primary body color radiant yellow-gold (`#fffa65`) with a golden-yellow underbelly (`#fff200`), crimson (`#ff3838`) horns and highlight trim, single central head-horn. Wears a jagged royal crown and a flowing regal cape, sharp fangs beneath a proud expression. Aura glows brilliant gold. Set in a cracked volcanic cavern glowing with molten orange light. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 🧙 #9 Lumiel Pháp Sư Phân Số
* **File**: `boss_09_lumiel.jpg`
* **Traits**: arcane, mystic | horns | 💚 self-heal | arena: night
* **Prompt**:
  > A mysterious, scholarly-mystic sorcerer, HD-2D painterly style. Primary robe color deep indigo-violet (`#7d5fff`) with a rose-pink underlining (`#ef5777`), sky-blue (`#70a1ff`) horns and highlight trim, single central head-horn. Wears a wide pointed wizard's hat and a flowing cape, carries a glowing magic staff in one clawed hand. Aura glows soft violet. Set in a moonlit graveyard clearing under a magenta-tinted aurora sky. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

### 🐙 #10 Leviator Bạch Tuộc Vô Cực
* **File**: `boss_10_leviator.jpg`
* **Traits**: cosmic, unknowable | no horns | 🩸 lifesteal | arena: ice
* **Prompt**:
  > A vast, alien, unknowable cosmic kraken, HD-2D painterly style. Primary body color deep turquoise (`#33d9e2`) with a pale aqua underbelly (`#c7ecee`), coral-red (`#ff5252`) highlight trim, no horns. Features several thin, curling tentacles trailing behind it and rows of sharp fangs. Aura glows deep cyan, faintly starry. Set in a frozen glacial cavern lit by cool cyan light. Square portrait, centered, soft dark vignette, thick outline, soft bloom.

---

## 04. Dropping Images Back Into The Game

1. Save each generated file to `src/assets/images/hd2d/` using the filename listed above (`boss_01_sora.jpg` ... `boss_10_leviator.jpg`, `key_art_header.jpg`, `hero_wizard.jpg`).
2. Edit `BOSS_SPRITES` in `src/scripts/engine/art.js` to map to each asset path.
3. Update `deferredAssets` in `scripts/project.mjs` and `DEFERRED_ASSETS` in `src/sw.js` for offline caching.
4. Run `npm test` and `npm run build` to verify references and bundle.
