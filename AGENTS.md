# AGENTS.md — AI Agent 协作与扩展指南

> 本文档面向所有在此仓库工作的 AI Coding Agents（GitHub Copilot、Claude Code、Codex、OpenCode、Cursor 等）。人类读者请阅读 [`README.md`](README.md)。

---

## 1. 仓库架构与单一数据源（Single Source of Truth）

本仓库是一套**零外部运行时依赖、支持 `file://` 双击离线浏览**的交互式嵌入式实战教程《ESP32 从零到专家》。

```text
OUTLINE.md               ← 课程体系总纲 + 跨课螺旋伏笔表（改课序/伏笔前必读）
lessons/NN-标题.md        ← 课程 Markdown 源文件（通过 {{widget:name}} 引用交互组件）
widgets/<name>.html      ← 自包含原生 HTML + CSS + SVG + IIFE JS 交互实验组件
assets/*.svg             ← 手绘矢量原理图与面包板接线图（严禁 AI 位图生成）
tools/render.js          ← 静态构建器：将 lessons + widgets + assets 编译到 site/
tools/validate.js        ← 自动化全量校验器：检查 HTML/JS/DOM/SVG/链接/Markdown 残留
site/                    ← 构建产物目录（严禁直接手改 site/ 下的任何文件！）
.github/skills/          ← 面向 Agent 的专项扩展技能包（见第 2 节）
.github/workflows/       ← GitHub Actions 自动构建、校验并部署 ./site 到 GitHub Pages
```

**铁律**：任何内容、样式、组件或插画修改，**必须改源文件**（`lessons/`、`widgets/`、`assets/`、`tools/render.js`），随后执行 `npm test`（即 `node tools/render.js && node tools/validate.js`）同步重新生成并验证 `site/`。

---

## 2. 专项 Skills 路由表（按任务按需加载）

在执行扩展或重构前，请优先加载 `.github/skills/` 中对应的专项技能（若当前 Agent 运行时未自动注入 Skill，请直接用文件读取工具阅读对应路径的 `SKILL.md`）：

| 任务场景 | Skill 名称 | 文件路径 |
|---|---|---|
| 新增第 16+ 课、扩写现有课程、设计实战项目或伏笔 | `esp32-lesson-author` | `.github/skills/esp32-lesson-author/SKILL.md` |
| 新增或修改 `widgets/*.html` 交互仿真实验台 | `esp32-widget-builder` | `.github/skills/esp32-widget-builder/SKILL.md` |
| 绘制或修改 `assets/*.svg` 课程头图与面包板接线图 | `esp32-svg-illustrator` | `.github/skills/esp32-svg-illustrator/SKILL.md` |
| 构建站点、排查渲染/语法/接线错误、提交前全量验收 | `esp32-tutorial-validator` | `.github/skills/esp32-tutorial-validator/SKILL.md` |

---

## 3. 全局不可违背的硬约束（Hard Invariants）

### 3.1 课程结构与伏笔连续性
1. **禁止改动第 `01`–`15` 课的文件编号与跨课伏笔承诺**：`OUTLINE.md` 第四节记录了跨课埋雷与回收映射（如 L1 埋下的 GPIO34 仅输入、Strapping 脚、`delay` 断蓝牙等分别在 L6、L10 回收）。
2. **新增扩展课规范**：新课请从 `lessons/16-<主题>.md` 起递增命名。`tools/render.js` 会自动将 `16+` 课归入首页「阶段六 · 扩展专题与实战番外」，并自动打通 L15 ↔ L16 上下课导航；若调整阶段划分，同步更新 `OUTLINE.md`、`README.md` 与 `tools/render.js` 中的 `STAGES`。
3. **每课标配产物**：每新增一课，必须至少配套 **1 个专属交互组件**（`widgets/<slug>.html`）+ **1 张手绘矢量头图**（`assets/lessonNN-hero.svg`）+ **可勾选验收 Checklist**（`- [ ] ...`）。

### 3.2 ESP32 硬件与嵌入式代码铁律（基准板型：30 脚 `ESP32-WROOM-32 DevKit`）
编写课程代码、接线表、测验题与 SVG 图时，必须严格遵守真实硬件物理特性：
- **全系列统一默认安全引脚**：外接 LED 统一用 `GPIO4`（串联 `220Ω` 限流电阻），按键统一用 `GPIO23`（配 `INPUT_PULLUP`，按下读 `LOW`），避免学习者每课拆线重插。
- **绝对禁区引脚**：`GPIO6–11` 连接内部 SPI Flash，严禁在任何示例代码中用作普通 IO。
- **仅输入引脚（Input-Only）**：`GPIO34 / 35 / 36(VP) / 39(VN)` **无输出驱动电路，且无内部上下拉电阻**——严禁对其调用 `pinMode(pin, OUTPUT)` 或 `INPUT_PULLUP` / `INPUT_PULLDOWN`。
- **Strapping 启动配置脚**：`GPIO0, 2, 5, 12, 15` 严禁归入「无坑通用首选 GPIO」；外接强上拉到 `GPIO12` 会因闪存电压选错导致死机循环。
- **ADC 与 Wi-Fi 冲突**：开启 Wi-Fi 或蓝牙期间 **ADC2 完全不可用**，模拟采样一律使用 **ADC1（`GPIO32, 33, 34, 35, 36, 39`）**。
- **常用外设默认硬件引脚**：I2C 默认 `SDA = GPIO21, SCL = GPIO22`；VSPI 默认 `SCK = GPIO18, MISO = GPIO19, MOSI = GPIO23, CS = GPIO5`。
- **传感器与外设型号准确**：`BMP280` 仅测**温度 + 气压**（`BME280` 才含湿度）；`INMP441` 走 **I2S** 音频总线（非 I2C）；ESP32 IO 为 **3.3V 电平，不耐受 5V 直连**。
- **蓝牙平台边界**：`BluetoothSerial`（经典蓝牙 SPP）仅限经典 ESP32 + Android/PC；**iPhone（iOS）及 ESP32-C3 / ESP32-S3 仅支持 BLE（`BLEDevice`）**，涉及蓝牙必须注明。
- **ESP-IDF 细节**：`GPIO_MODE_OUTPUT` 模式下 `gpio_get_level()` 恒返回 `0`，翻转输出必须使用状态变量或 `GPIO_MODE_INPUT_OUTPUT`；延时必须用 `vTaskDelay(pdMS_TO_TICKS(ms))`。

### 3.3 代码块与离线运行铁律
- **「完整代码（直接复制）」零占位符**：严禁出现 `{ /* 上节防抖函数原样放这里 */ }` 或漏写 `#include <WebServer.h>` 等残缺片段——读者复制进 Arduino IDE / Wokwi / PlatformIO 必须一次编译通过。
- **非阻塞规范**：第 10 课及之后的所有业务 `loop()` 严禁使用阻塞式 `delay()`（仅允许 `setup()` 初始化阶段短暂等待），重连计时器必须按职责独立命名（如 `lastWifiRetry` 与 `lastMqttRetry` 分离，防止互相清零）。
- **100% 离线可用**：`site/` 下的页面通过双击 `file://` 打开，严禁在 `widgets/` 或 `tools/render.js` 中引入任何外部 CDN 脚本、字体或远程图片。

---

## 4. 标准构建与验收流水线

完成任何修改后，必须在仓库根目录执行以下命令并确保零报错退出：

```bash
# 1. 重新编译生成 site/*.html 并同步复制 assets/*.svg -> site/assets/
npm run build        # 等价于 node tools/render.js

# 2. 运行全量静态与语法校验（HTML / 内联 JS / Widget DOM ID / SVG XML / Markdown 残留）
npm run validate     # 等价于 node tools/validate.js

# 或一键执行构建 + 校验：
npm test
```
