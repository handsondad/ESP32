---
name: esp32-tutorial-validator
description: Build, validate, and audit the ESP32 tutorial repository end-to-end (HTML generation, inline JS syntax, widget DOM IDs, SVG XML integrity, Markdown rendering leaks, and hardware accuracy).
---

# ESP32 Tutorial Validator Skill

Use this skill after modifying any lesson, widget, SVG illustration, or build script, or when asked to audit/review the tutorial for bugs and inconsistencies.

---

## 1. Automated Build & Validation Commands

Always execute both steps from the repository root:

```bash
# Step 1: Compile lessons/*.md + widgets/*.html + assets/*.svg -> site/
npm run build        # runs: node tools/render.js

# Step 2: Run full static & syntax validation suite
npm run validate     # runs: node tools/validate.js
```

Or run both in one step:

```bash
npm test
```

---

## 2. What `tools/validate.js` Verifies Automatically

1. **Build Sync**: Every `lessons/*.md` has a matching `site/*.html`, and every lesson is linked on `site/index.html`.
2. **Completeness**:
   - Zero `<div class="widget-missing">` or unreplaced `{{widget:...}}` placeholders.
   - Zero `<figure class="img-placeholder">` missing-image boxes.
   - Zero `{ /* ...原样放这里... */ }` incomplete function stubs in lesson code.
   - Interactive `.task-cb` checkboxes exist on every lesson page with zero `disabled` checkboxes.
3. **JavaScript & Widget Integrity**:
   - Compiles every inline `<script>` across all `site/*.html` pages with Node's `vm.Script` to catch any `SyntaxError`.
   - Verifies every `document.getElementById('...')` call in `widgets/*.html` matches an actual `id="..."` attribute inside that widget, and checks for `dataset.bound` idempotency guards.
4. **Asset & Link Integrity**:
   - Confirms every relative `href="..."` and `src="..."` in `site/*.html` resolves to an existing file in `site/`.
   - Parses tag stacks for every `.svg` in `assets/` and `site/assets/` to ensure balanced XML tags.
5. **Markdown Leak Detection**:
   - Strips `<pre>`, `<code>`, `<script>`, and `<style>` from rendered HTML and checks for unrendered `**bold**`, `` `code` ``, or `[text](url)` syntax leaks.

---

## 3. Manual Domain Audit Checklist (Hardware & Pedagogy)

Automated checks catch syntax/structural errors; perform these domain checks when reviewing new or edited content:

- **Header Includes & Symbols**: Does every `💡 完整代码（直接复制）` include all required headers (e.g., `#include <Wire.h>`, `#include <WiFi.h>`, `#include <WebServer.h>`) and define every helper called in `setup()` / `loop()`?
- **ESP32 Pin Safety**:
  - Are `GPIO6–11` avoided completely?
  - Are `GPIO34–39` used strictly as inputs without `INPUT_PULLUP` / `INPUT_PULLDOWN`?
  - Is ADC1 (`GPIO32–39`) used instead of ADC2 whenever Wi-Fi/BT is enabled?
  - In ESP-IDF code, is output toggling done via state variable rather than `gpio_get_level()` on `GPIO_MODE_OUTPUT`?
- **Timer Independence**: When multiple `millis()` intervals exist (e.g., heartbeat + Wi-Fi reconnect + MQTT reconnect + button debounce), does each state machine have its own `unsigned long lastXxx` timestamp variable?
- **Unit & Formula Sanity**: Check Bit vs Byte (`÷ 8`), kHz vs MHz, resistor Ohm's Law (`(3.3V - Vf) / R`), and sensor capabilities (e.g., `BMP280` = temperature + pressure only; `BME280` adds humidity).
