---
name: esp32-widget-builder
description: Build or update self-contained interactive HTML/CSS/SVG/JS widgets in widgets/*.html embedded via {{widget:name}} in ESP32 tutorial lessons.
---

# ESP32 Interactive Widget Builder Skill

Use this skill when creating a new interactive simulation widget (`widgets/<name>.html`) or fixing/enhancing an existing widget.

## 1. How Widgets Are Loaded

`tools/render.js` replaces `{{widget:<name>}}` in `lessons/*.md` with the raw contents of `widgets/<name>.html` during build.
- Widgets run directly inside the lesson HTML page (`site/*.html`), opened offline via `file://` in a browser.
- **Zero external dependencies**: Do NOT load external JS/CSS CDNs, modules, fonts, or images. Use vanilla HTML, scoped CSS, inline SVG, and an ES6 IIFE `<script>`.

---

## 2. Canonical Widget Skeleton

Use a unique short prefix (`wg-<slug>`) on **all** element `id`s and custom CSS classes so multiple widgets on the same lesson page never collide:

```html
<!-- 组件：<中文名称> · 用于第 NN 课 -->
<div class="wgt wgt-<slug>" id="wg-<slug>">
  <div class="wgt-head">
    <span>⚡ 交互演示：<标题></span>
    <span class="wgt-badge"><一句简短操作提示></span>
  </div>
  <div class="wgt-body">
    <div class="wg-<slug>-stage">
      <!-- 交互控件与内联 SVG 画布 -->
    </div>
    <p class="wgt-hint" style="text-align:center">
      在这里用 HTML 标签（如 <b>重点</b>、<code>API()</code>）写原理解释——<b>切勿使用 Markdown 的 **粗体** 或 `反引号`</b>！
    </p>
  </div>
</div>
<style>
.wgt-<slug> .wgt-badge { font-weight: 400; font-size: .8em; color: var(--muted); }
.wg-<slug>-stage { display: grid; grid-template-columns: 1fr 220px; gap: 16px; align-items: center; }
@media (max-width: 640px) {
  .wg-<slug>-stage { grid-template-columns: 1fr; }
}
</style>
<script>
(function () {
  const root = document.getElementById('wg-<slug>');
  if (!root || root.dataset.bound) return;
  root.dataset.bound = '1';

  // 绑定事件与更新逻辑...
})();
</script>
```

---

## 3. Host CSS Variables & Classes Provided by `tools/render.js`

You get these CSS variables and outer classes automatically—reuse them for visual consistency:
- Palette variables: `--bg` (`#faf9f7`), `--fg` (`#2b2b2b`), `--muted` (`#6b6b6b`), `--accent` (`#0b6e4f`), `--accent-soft` (`#e6f3ee`), `--border` (`#e5e2dc`), `--code-bg` (`#f4f2ee`), `--quote-bg` (`#fffdf5`).
- Host shell classes: `.wgt`, `.wgt-head`, `.wgt-body`, `.wgt-hint`, `.wgt button`, `.wgt button.active`.
- Note on `<pre>` inside widgets: `tools/render.js` sets `.wgt pre { background: transparent; padding: 0; border-radius: 0; }` and excludes `.wgt pre` from automatic "复制代码" buttons, so wrap dark code panels in your own styled container (e.g. `background: #1a1a2e; padding: .8em 1em; border-radius: 10px;`).

---

## 4. Critical Anti-Patterns (Learned from Real Bugs)

1. **Never write Markdown inside `widgets/*.html`**:
   `inlineWidgets()` runs *after* `marked.parse(md)`. Writing `**粗体**` or `` `code` `` inside widget HTML will display raw asterisks/backticks to the user! Always use `<b>...</b>` and `<code>...</code>`.
2. **Never use exact `!==` step loops for animations**:
   Avoid `for (let x = from; x !== to; x += step)` — if `(to - from)` is not an exact multiple of `step`, the `async` loop becomes an **infinite loop**! Always interpolate by normalized progress:
   ```js
   const steps = 24;
   for (let i = 0; i <= steps; i++) {
     const t = i / steps;
     const x = fromX + (toX - fromX) * t;
     // ...
   }
   ```
3. **SVG element geometry attributes**:
   `<circle>` uses `cx`/`cy`; `<rect>` uses `x`/`y` (setting `cx` on `<rect>` silently does nothing!).
4. **Keep interactive sweeps under ~5 seconds**:
   Learners lose patience if a simulation takes 40+ seconds (e.g., scanning 120 addresses at 350ms each). Animate a representative subset or use fast 25–40ms ticks while highlighting key events.
5. **Verify every `getElementById('...')` matches an existing `id="..."`** in the same widget file, and check Bit vs Byte (`1 Byte = 8 bits`, `1 KB = 1024 B`) unit math in throughput/frame-buffer calculators.
6. Run `npm test` after saving to verify `vm.Script` syntax and DOM ID bindings.
