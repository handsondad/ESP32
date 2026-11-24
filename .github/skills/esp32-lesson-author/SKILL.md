---
name: esp32-lesson-author
description: Author new ESP32 tutorial lessons (Lesson 16+) or expand existing lessons in lessons/*.md following the spiral curriculum template, hardware pinout invariants, CommonMark rules, and OUTLINE.md foreshadowing contracts.
---

# ESP32 Lesson Author Skill

Use this skill whenever creating a new lesson (`lessons/NN-<主题>.md`), adding a bonus project module, or editing existing lesson content in this repository.

## 1. Pre-Authoring Checklist

1. Read `OUTLINE.md` (especially §一 template, §二 stages, and §四 foreshadowing map) before writing.
2. **Never renumber Lessons `01`–`15`** or break cross-lesson promises embedded in published lessons.
3. Name new extension lessons sequentially starting at `lessons/16-<中文标题>.md` (two-digit zero-padded prefix, no spaces in filename).
   - `tools/render.js` automatically places Lesson `16+` into「阶段六 · 扩展专题与实战番外」on `site/index.html` and wires Prev/Next navigation with Lesson 15.
4. Plan at least **1 interactive widget** (`widgets/<slug>.html`, see `esp32-widget-builder` skill) and **1 hand-crafted SVG** (`assets/lessonNN-hero.svg`, see `esp32-svg-illustrator` skill) for every new lesson.

---

## 2. Canonical Lesson Markdown Template

Every lesson **must** follow this exact 8-section structure so `tools/render.js` and `tools/validate.js` parse metadata, stars, duration, and interactive checklists accurately:

```markdown
# 第 16 课：<主标题>——<副标题/核心痛点>

> **阶段六 · 扩展专题与实战番外** ｜ 难度：★★★★☆ ｜ 预计用时：50–60 分钟
>
> **本课材料**：ESP32 开发板 ×1、USB 线 ×1、LED（GPIO4 经 220Ω）×1、按钮（GPIO23）×1、<本课新增模块>
> **无硬件替代**：[Wokwi 在线仿真](https://wokwi.com) 替代方案说明（若某射频/传感器 Wokwi 不支持，提供串口模拟验证法）

---

## 🎬 先看效果（10 秒演示）

![第 16 课效果预告：<简述>](assets/lesson16-hero.svg)

> 你将做出：**一句话描述可见、可玩、有成就感的最终成品效果**。

**本课学习目标（完成后你将拥有）：**

1. ✅ <目标 1>
2. ✅ <目标 2>
3. ✅ <目标 3>
4. ✅ <目标 4>

---

## 🔁 开课先接棒：<衔接前序课程知识>

（用人话与物理比喻引入新概念，回收前课伏笔或对比旧方案痛点）

{{widget:your-widget-slug}}

---

## 🔌 硬件接线（如涉及新外设）

| 模块引脚 | 接 ESP32 引脚 | 说明 |
|---|---|---|
| VCC | 3V3 | 严禁接 5V 直连信号脚 |
| GND | GND | 共地是一切通信的前提（L5） |

---

## 💡 完整代码（直接复制）

```cpp
// ============================================
// 第 16 课：<标题>
// ============================================
// 必须包含全部 #include、引脚常量、辅助函数与完整 setup()/loop()
// 严禁留下 { /* 上节函数原样放这里 */ } 之类的残缺占位符！
```

---

## 🔍 逐行拆解（挑关键段讲人话）

（解释每一处核心 API 背后的物理或系统行为，不要只翻译函数名）

---

## ✅ 验收 Checklist（全部打勾才算过关）

- [ ] 接线核对无误（电源未反接、信号脚未误接 GPIO6–11 禁区）
- [ ] 代码一次编译上传通过，串口监视器（115200）输出正常
- [ ] <核心实验现象验证项 1>
- [ ] <核心实验现象验证项 2>
- [ ] <反向/边界验证项：亲手制造一次典型错误并观察现象>

---

## 🏆 课后挑战（10 分钟，做完再进下一课）

1. **基础巩固**：<改一个参数验证理解>
2. **组合联动**：<结合前序课程的 OLED / 按钮 / MQTT 联动>
3. **进阶思考（选做）**：<引出下一课或工程实战场景>

---

## 🐛 常见报错诊断（遇到怪现象先查这里）

| 现象 / 报错关键词 | 原因 | 解决办法 |
|---|---|---|
| <高频现象 1> | <物理/软件根因> | <一步到位的排查动作> |
| <高频现象 2> | <物理/软件根因> | <一步到位的排查动作> |

---

## 🔜 下一课预告

（总结本课收获，预告下一课主题或进阶方向）

---

*本课程系列：从点亮一盏灯，到设计一台会自己思考的机器。*
```

---

## 3. ESP32 Hardware & Code Accuracy Rules

- **Default Reusable Wiring**: Keep `LED_PIN = 4` (with `220Ω` series resistor) and `BTN_PIN = 23` (`INPUT_PULLUP`, active `LOW`) across lessons whenever an LED or button is needed.
- **Pin Restrictions (30-pin ESP32-WROOM-32)**:
  - Never use `GPIO6–11` (internal SPI Flash).
  - Never use `GPIO34, 35, 36, 39` as `OUTPUT` or with `INPUT_PULLUP` / `INPUT_PULLDOWN` (input-only, no internal pull resistors).
  - Never label Strapping pins (`0, 2, 5, 12, 15`) or UART0 (`1, 3`) as carefree general-purpose pins.
  - When Wi-Fi or Bluetooth is active, **never use ADC2**; always use **ADC1 (`GPIO32, 33, 34, 35, 36, 39`)**.
- **Non-Blocking Loop**: For any lesson from Lesson 10 onward, `loop()` must use `millis()` state machines rather than blocking `delay()`. Separate retry timers by subsystem (e.g., `lastWifiRetry` vs `lastMqttRetry`).
- **ESP-IDF Specifics**: In ESP-IDF (`framework = espidf`), `gpio_get_level()` returns `0` on pins configured as `GPIO_MODE_OUTPUT`; track output state in a variable or use `GPIO_MODE_INPUT_OUTPUT`, and always wrap millisecond delays in `pdMS_TO_TICKS(...)`.

---

## 4. Markdown / CommonMark Pitfalls (`marked`)

- **CJK + Fullwidth Parentheses inside Bold**: In CommonMark, `——**心跳（Heartbeat）**是` fails to parse `**` because `）` is punctuation followed immediately by a non-punctuation CJK character after `**` while preceded by `——`.
  - **Fix**: Add spaces around bold spans when adjacent to fullwidth punctuation/brackets, e.g. `—— **心跳（Heartbeat）** 是`, or put parentheses outside bold: `**心跳**（Heartbeat）是`.
- Always run `npm test` (`node tools/render.js && node tools/validate.js`) after editing—`tools/validate.js` automatically scans rendered HTML for any unrendered `**`, `` ` ``, or `[]()` leaks.
