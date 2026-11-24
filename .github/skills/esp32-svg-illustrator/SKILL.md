---
name: esp32-svg-illustrator
description: Hand-craft clean, electrically accurate SVG hero banners and breadboard/wiring diagrams in assets/*.svg for ESP32 tutorial lessons.
---

# ESP32 Hand-Crafted SVG Illustrator Skill

Use this skill when creating or editing `assets/*.svg` illustrations (such as `lessonNN-hero.svg` or `lessonNN-wiring.svg`).

> **Hard Rule (`OUTLINE.md`)**: Never use AI raster/bitmap image generators for pinouts or wiring diagrams—AI images misspell pin numbers and draw dangerous short circuits. Always hand-craft clean vector SVGs.

---

## 1. Visual Language & Dimensions

- **Hero Banners (`assets/lessonNN-hero.svg`)**:
  - Standard `viewBox="0 0 1200 440"` (or `0 0 900 420`), `xmlns="http://www.w3.org/2000/svg"`.
  - Font stack: `font-family="Microsoft YaHei, PingFang SC, Segoe UI, sans-serif"`.
  - Background gradient: soft mint/warm paper (`#f7faf8` → `#e8f1ec` or `#faf9f7` → `#f0ede6`).
  - ESP32 Board visual motif: dark PCB green (`fill="#0f3d2e" stroke="#0a2c21"`), silver RF shield (`fill="#c9ccd1" stroke="#9aa0a6"`), gold/yellow pin pads (`#f5b041`).
- **Wire Color Convention**:
  - `3V3 / VCC`: Red (`#e74c3c` or `#d63031`)
  - `GND`: Dark charcoal / black (`#2c3e50` or `#1e272e`)
  - `GPIO / PWM / Data`: Teal / Green (`#0b6e4f` or `#27ae60`)
  - `SDA / MOSI / TX`: Blue (`#2980b9`)
  - `SCL / SCK / RX`: Orange or Purple (`#e67e22` or `#8e44ad`)
- Subtle native SVG `<animate>` pulses on signal buses are encouraged for hero diagrams, provided all `<animate>` tags are properly closed.

---

## 2. Electrical & Coordinate Invariants (Must Verify!)

1. **Local vs World Coordinate Math (`transform="translate(tx, ty)"`)**:
   - Inside `<g transform="translate(tx, ty)">`, every `<line>`, `<rect>`, and `<circle>` uses **local coordinates**!
   - If a horizontal bus is drawn in root coordinates at `y = 240`, and an ESP32 or sensor card is inside `<g transform="translate(60, 140)">`, a vertical wire reaching that bus **must** end at `y2 = 240 - 140 = 100` (NOT `y2="240"`, which overshoots to world `y = 380`!).
   - Explicitly calculate `worldX = tx + localX` and `worldY = ty + localY` for every wire junction dot (`<circle r="4.5"/>`) so no wire floats in mid-air or overshoots its target bus.

2. **Breadboard Internal Connectivity (No Visual Short Circuits!)**:
   - On a standard landscape breadboard:
     - Top/bottom power rails (`+` / `-`) run **horizontally**.
     - Middle terminal strips (`A–E` and `F–J`, separated by the center ravine) connect **5 holes vertically per numbered column**!
   - **Critical**: Two legs of a 2-pin component (resistor, LED, button active pair) **must span across two DIFFERENT columns** (or across the center groove), NEVER two holes in the same vertical 5-hole strip (which shorts both legs together!).
   - If drawing a dashed highlight box labeled「同组连通」, orient it **vertically** along a single column strip, never horizontally across a resistor's two legs.

3. **Bus Pull-Up Resistors (I2C, 1-Wire, etc.)**:
   - When drawing I2C pull-up resistors (`4.7kΩ` to `3.3V`), verify one resistor lands on `SDA` (with junction dot at `y = y_SDA`) and the second lands on `SCL` (with junction dot at `y = y_SCL`)—never attach both pull-ups to the same line.

4. **Text Bounds & Clipping**:
   - Leave adequate padding inside card `<rect>` boxes for Chinese characters (`~1em` per CJK character) so titles never clip or truncate.

---

## 3. Post-Edit Verification

1. Run `npm run build` (`node tools/render.js`) so updated `assets/*.svg` files are copied to `site/assets/*.svg`.
2. Run `npm run validate` (`node tools/validate.js`) to verify XML tag balance (`<svg>...</svg>`), zero unclosed tags, and valid `<img>` references from lesson pages.
