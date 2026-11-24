// 把 lessons/*.md 渲染成带样式与交互组件的静态 HTML 站点，双击 site/index.html 即可在浏览器离线学习
// 用法: node tools/render.js （或 npm run build）
const fs = require('fs');
const path = require('path');

function loadMarked() {
  const fallback = path.join(process.env.TEMP || '', 'opencode', 'esp32-tools', 'node_modules', 'marked');
  for (const mod of ['marked', fallback]) {
    try {
      return require(mod);
    } catch (_) {}
  }
  console.error('❌ 未找到 marked 依赖，请先在项目根目录执行: npm install');
  process.exit(1);
}

const { marked } = loadMarked();

const ROOT = path.join(__dirname, '..');
const LESSONS_DIR = path.join(ROOT, 'lessons');
const OUT_DIR = path.join(ROOT, 'site');

const STAGES = [
  {
    id: 1,
    name: '阶段一 · 破冰与建立信心',
    desc: '点灯、按键、PWM：建立"代码 → 物理世界"的第一性直觉，迈出扔掉 delay 的第一步',
    range: [1, 3]
  },
  {
    id: 2,
    name: '阶段二 · 输入与输出',
    desc: '模拟量采集、双机串口共地、GPIO 引脚大清算：彻底摸清 ESP32 引脚的全部脾气与禁区',
    range: [4, 6]
  },
  {
    id: 3,
    name: '阶段三 · 通信',
    desc: 'I2C 挂多模块、传感器校准融合、SPI 高速刷彩屏：掌握芯片与外设对话的两大王牌总线',
    range: [7, 9]
  },
  {
    id: 4,
    name: '阶段四 · 无线物联',
    desc: '蓝牙串口与 millis 完全体、Wi-Fi Web 服务器、MQTT 上云：打通端到云完整闭环',
    range: [10, 12]
  },
  {
    id: 5,
    name: '阶段五 · 进阶专家',
    desc: 'PlatformIO 模块化工程、ESP-IDF 与 FreeRTOS 多任务、AI 边缘智能：走向职业级工程开发',
    range: [13, 15]
  }
];

const CSS = `
:root {
  --bg: #faf9f7; --fg: #2b2b2b; --muted: #6b6b6b;
  --accent: #0b6e4f; --accent-soft: #e6f3ee;
  --border: #e5e2dc; --code-bg: #f4f2ee; --quote-bg: #fffdf5;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  font-size: 16.5px; line-height: 1.85;
}
.wrap { max-width: 860px; margin: 0 auto; padding: 32px 28px 96px; }
h1 { font-size: 1.9em; line-height: 1.35; border-bottom: 3px solid var(--accent); padding-bottom: .4em; margin-top: .6em; }
h2 { font-size: 1.4em; margin-top: 2.2em; padding: .35em .7em; background: var(--accent-soft);
     border-left: 5px solid var(--accent); border-radius: 0 6px 6px 0; }
h3 { font-size: 1.15em; margin-top: 1.8em; }
h4 { font-size: 1.05em; }
a { color: var(--accent); }
blockquote {
  margin: 1.2em 0; padding: .8em 1.1em; background: var(--quote-bg);
  border-left: 4px solid #e0b84b; border-radius: 0 6px 6px 0; color: #4a4a4a;
}
blockquote p { margin: .35em 0; }
code {
  font-family: "Cascadia Code", Consolas, "Courier New", monospace;
  font-size: .88em; background: var(--code-bg); padding: .15em .4em; border-radius: 4px;
}
pre {
  position: relative;
  background: #282c34; color: #abb2bf; padding: 16px 18px; border-radius: 8px;
  overflow-x: auto; line-height: 1.6; font-size: .86em;
}
pre code { background: none; padding: 0; color: inherit; font-size: 1em; }
.copy-btn {
  position: absolute; top: 8px; right: 8px;
  font-family: inherit; font-size: 12px; padding: 3px 10px;
  border-radius: 6px; border: 1px solid rgba(255,255,255,.22);
  background: rgba(255,255,255,.08); color: #d5dae3; cursor: pointer;
  opacity: .75; transition: .15s;
}
.copy-btn:hover { opacity: 1; background: rgba(255,255,255,.18); color: #fff; }
.copy-btn.copied { background: var(--accent); border-color: var(--accent); color: #fff; opacity: 1; }
table { border-collapse: collapse; width: 100%; margin: 1.2em 0; font-size: .95em; }
th, td { border: 1px solid var(--border); padding: .55em .8em; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); }
tr:nth-child(even) td { background: #f6f5f2; }
ul, ol { padding-left: 1.6em; }
li { margin: .3em 0; }
li.task-item { list-style: none; margin-left: -1.2em; padding: .28em .55em; border-radius: 6px; transition: background .15s; }
li.task-item:hover { background: #f3f1ec; }
li.task-item.done { background: #edf7f3; color: #3c6e5b; }
li input[type="checkbox"] { margin-right: .55em; transform: scale(1.2); cursor: pointer; accent-color: var(--accent); vertical-align: middle; }
.check-progress {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: .55em .9em; margin: .8em 0 .6em; background: #fff; border: 1px solid var(--border);
  border-radius: 8px; font-size: .88em; color: var(--muted);
}
.check-bar-wrap { flex: 1; height: 8px; background: #ece9e2; border-radius: 99px; overflow: hidden; }
.check-bar-fill { height: 100%; width: 0%; background: var(--accent); border-radius: 99px; transition: width .25s ease; }
hr { border: none; border-top: 1px dashed var(--border); margin: 2.5em 0; }
em { color: var(--muted); }
strong { color: #1a1a1a; }
img { max-width: 100%; border-radius: 10px; border: 1px solid var(--border); }
figure { margin: 1.6em 0; text-align: center; }
figure img { max-width: 100%; border-radius: 10px; border: 1px solid var(--border); }
figcaption { font-size: .88em; color: var(--muted); margin-top: .5em; }
.img-placeholder .ph-box {
  border: 2px dashed var(--border); border-radius: 10px; padding: 42px 20px;
  color: var(--muted); background: #fff; font-size: .95em;
}
.widget-missing { border: 1px dashed #d00; padding: 1em; color: #d00; }
/* ---- 顶部与底部课程导航 ---- */
.top-nav {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  padding: .55em .9em; margin-bottom: 1.2em; background: #fff; border: 1px solid var(--border);
  border-radius: 10px; font-size: .88em; box-shadow: 0 1px 4px rgba(0,0,0,.03);
}
.top-nav a { text-decoration: none; font-weight: 600; color: var(--accent); }
.top-nav a:hover { text-decoration: underline; }
.top-nav .meta-pill { color: var(--muted); font-size: .92em; }
.top-nav .quick-jump { display: flex; gap: 10px; align-items: center; }
.top-nav .quick-jump a {
  padding: .2em .65em; border: 1px solid var(--border); border-radius: 6px;
  background: var(--bg); color: var(--fg); font-weight: 500; font-size: .9em;
}
.top-nav .quick-jump a:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
.pager {
  display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: stretch;
  margin-top: 3em; padding-top: 1.6em; border-top: 2px solid var(--border);
}
.pager a, .pager .pager-empty {
  display: flex; flex-direction: column; justify-content: center;
  padding: .85em 1.1em; border-radius: 10px; border: 1px solid var(--border);
  background: #fff; text-decoration: none; color: var(--fg); transition: .15s;
}
.pager a:hover { border-color: var(--accent); background: var(--accent-soft); }
.pager .pager-empty { background: transparent; border-style: dashed; color: var(--muted); font-size: .88em; align-items: center; }
.pager .dir { font-size: .8em; color: var(--muted); margin-bottom: .2em; }
.pager .ttl { font-weight: 600; color: var(--accent); font-size: .95em; line-height: 1.4; }
.pager .next { text-align: right; }
.pager .home-btn { align-items: center; font-weight: 600; color: var(--accent); font-size: .9em; white-space: nowrap; }
/* ---- 交互动画组件通用外壳 ---- */
.wgt {
  margin: 1.8em 0; border: 1px solid var(--border); border-radius: 12px;
  background: #fff; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.04);
}
.wgt pre { background: transparent; padding: 0; border-radius: 0; }
.wgt-head {
  padding: .6em 1em; background: var(--accent-soft); border-bottom: 1px solid var(--border);
  font-size: .9em; font-weight: 600; color: var(--accent); display: flex;
  justify-content: space-between; align-items: center; gap: .5em; flex-wrap: wrap;
}
.wgt-body { padding: 1em; }
.wgt-hint { font-size: .82em; color: var(--muted); margin-top: .6em; }
.wgt button {
  font-family: inherit; font-size: .9em; padding: .45em 1em; border-radius: 8px;
  border: 1px solid var(--border); background: #fff; cursor: pointer; transition: .15s;
}
.wgt button:hover { border-color: var(--accent); color: var(--accent); }
.wgt button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
@media (max-width: 640px) {
  .wrap { padding: 20px 16px 64px; }
  body { font-size: 15.5px; }
  .pager { grid-template-columns: 1fr; }
  .pager .next { text-align: left; }
}
`;

// 将 {{widget:name}} 占位符替换为 widgets/name.html 的内容
function inlineWidgets(html) {
  return html.replace(/\{\{widget:([\w-]+)\}\}/g, (_, name) => {
    const p = path.join(ROOT, 'widgets', name + '.html');
    if (!fs.existsSync(p)) return `<div class="widget-missing">⚠️ 组件未找到：${name}</div>`;
    return fs.readFileSync(p, 'utf8');
  });
}

// 启用验收 Checklist 复选框（移除 marked 默认生成的 disabled 属性）
function enableCheckboxes(html) {
  let idx = 0;
  return html.replace(/<li>\s*<input\s+([^>]*type="checkbox"[^>]*)>/gi, (_, attrs) => {
    const checked = /\bchecked\b/i.test(attrs) ? ' checked' : '';
    const i = idx++;
    return `<li class="task-item"><input type="checkbox" class="task-cb" data-cb-idx="${i}"${checked}>`;
  });
}

// 图片缺失时用占位框替代
function placeholderMissingImages(html, baseDir) {
  return html.replace(/<img\s+src="([^"]+)"[^>]*>/g, (m, src) => {
    if (/^https?:/.test(src)) return m;
    const candidates = [path.join(baseDir, src), path.join(OUT_DIR, src), path.join(ROOT, src)];
    if (candidates.some(c => fs.existsSync(c))) return m;
    return `<figure class="img-placeholder"><div class="ph-box">🖼️<br><small>插画占位<br>${src}</small></div></figure>`;
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractMeta(md, filename) {
  const num = parseInt(filename, 10);
  const key = String(num).padStart(2, '0');
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '');
  const shortTitle = title.replace(/^第\s*\d+\s*课[：:]\s*/, '');

  const metaLine = md.match(/^>\s*\*\*(阶段[^*]+)\*\*\s*｜\s*难度：([^｜\n]+?)(?:\s*｜\s*预计用时：([^\n]+))?$/m);
  const stageText = metaLine ? metaLine[1].trim() : '';
  const starsMatch = metaLine ? metaLine[2].match(/[★☆]+/) : null;
  const stars = starsMatch ? starsMatch[0] : (metaLine ? metaLine[2].trim() : '');
  const durationRaw = metaLine && metaLine[3] ? metaLine[3].trim() : '';
  const durationShort = durationRaw.replace(/（.*$/, '').trim();

  const totalChecks = (md.match(/^- \[[ xX]\] /gm) || []).length;
  return { num, key, title, shortTitle, stageText, stars, durationShort, totalChecks };
}

function buildLessonEnhancementScript(lessonKey, totalChecks) {
  return `<script>
(function () {
  var STORAGE_KEY = 'esp32_tutorial_progress_v1';
  var LESSON_KEY = ${JSON.stringify(lessonKey)};
  var TOTAL = ${Number(totalChecks)};

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  function saveStore(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  // 1. 代码块一键复制按钮（排除交互组件内部的 <pre>）
  document.querySelectorAll('pre').forEach(function (pre) {
    if (pre.closest('.wgt')) return;
    var code = pre.querySelector('code');
    if (!code) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = '复制代码';
    btn.addEventListener('click', function () {
      var text = code.innerText || code.textContent || '';
      function done() {
        btn.textContent = '✓ 已复制';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = '复制代码'; btn.classList.remove('copied'); }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (_) {}
        document.body.removeChild(ta);
      }
    });
    pre.appendChild(btn);
  });

  // 2. 验收 Checklist 持久化打勾与进度条
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input.task-cb'));
  if (!boxes.length) return;

  var store = loadStore();
  var saved = Array.isArray(store[LESSON_KEY]) ? store[LESSON_KEY] : [];

  var firstUl = boxes[0].closest('ul');
  var barFill = null, barLabel = null;
  if (firstUl && firstUl.parentNode) {
    var wrap = document.createElement('div');
    wrap.className = 'check-progress';
    wrap.innerHTML = '<span>📋 本课验收进度</span><div class="check-bar-wrap"><div class="check-bar-fill"></div></div><strong class="check-count"></strong>';
    firstUl.parentNode.insertBefore(wrap, firstUl);
    barFill = wrap.querySelector('.check-bar-fill');
    barLabel = wrap.querySelector('.check-count');
  }

  function refreshUI() {
    var checkedIdx = [];
    boxes.forEach(function (cb, i) {
      var li = cb.closest('li.task-item');
      if (cb.checked) {
        checkedIdx.push(i);
        if (li) li.classList.add('done');
      } else if (li) {
        li.classList.remove('done');
      }
    });
    if (barFill && barLabel) {
      var pct = Math.round((checkedIdx.length / boxes.length) * 100);
      barFill.style.width = pct + '%';
      barLabel.textContent = checkedIdx.length + ' / ' + boxes.length + (checkedIdx.length === boxes.length ? ' 🎉 已通关' : '');
    }
    var cur = loadStore();
    cur[LESSON_KEY] = { checked: checkedIdx, total: TOTAL || boxes.length };
    saveStore(cur);
  }

  var initChecked = Array.isArray(saved) ? saved : (saved && Array.isArray(saved.checked) ? saved.checked : []);
  boxes.forEach(function (cb, i) {
    if (initChecked.indexOf(i) !== -1) cb.checked = true;
    cb.addEventListener('change', refreshUI);
    var li = cb.closest('li.task-item');
    if (li) {
      li.addEventListener('click', function (e) {
        if (e.target === cb || e.target.tagName === 'A' || e.target.tagName === 'CODE') return;
        cb.checked = !cb.checked;
        refreshUI();
      });
    }
  });
  refreshUI();
})();
</script>`;
}

function render() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '', 'utf8');
  const files = fs.readdirSync(LESSONS_DIR).filter(f => f.endsWith('.md')).sort();

  // 复制 assets 到 site/assets
  const assetsSrc = path.join(ROOT, 'assets');
  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, path.join(OUT_DIR, 'assets'), { recursive: true });
  }

  const pages = files.map(f => {
    const md = fs.readFileSync(path.join(LESSONS_DIR, f), 'utf8');
    const meta = extractMeta(md, f);
    const outName = f.replace(/\.md$/, '.html');
    return { ...meta, file: f, outName, md };
  });

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const prev = i > 0 ? pages[i - 1] : null;
    const next = i < pages.length - 1 ? pages[i + 1] : null;

    const rawHtml = marked.parse(p.md);
    const bodyHtml = placeholderMissingImages(
      enableCheckboxes(inlineWidgets(rawHtml)),
      path.join(ROOT, 'lessons')
    );

    const topNav = `<nav class="top-nav">
  <a href="index.html">← 课程总目录</a>
  <span class="meta-pill">${escapeHtml(p.stageText || 'ESP32 实战教程')} · 第 ${p.num} / ${pages.length} 课</span>
  <span class="quick-jump">
    ${prev ? `<a href="${encodeURI(prev.outName)}" title="${escapeHtml(prev.title)}">‹ 上一课</a>` : ''}
    ${next ? `<a href="${encodeURI(next.outName)}" title="${escapeHtml(next.title)}">下一课 ›</a>` : ''}
  </span>
</nav>`;

    const bottomPager = `<nav class="pager">
  ${prev
    ? `<a class="prev" href="${encodeURI(prev.outName)}"><span class="dir">← 上一课</span><span class="ttl">第 ${prev.num} 课：${escapeHtml(prev.shortTitle)}</span></a>`
    : `<div class="pager-empty">已经是第一课啦</div>`}
  <a class="home-btn" href="index.html">📚 课程总目录</a>
  ${next
    ? `<a class="next" href="${encodeURI(next.outName)}"><span class="dir">下一课 →</span><span class="ttl">第 ${next.num} 课：${escapeHtml(next.shortTitle)}</span></a>`
    : `<div class="pager-empty">🎓 恭喜完成全部 15 课！</div>`}
</nav>`;

    const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(p.title)} · ESP32 从零到专家</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
${topNav}
${bodyHtml}
${bottomPager}
</div>
${buildLessonEnhancementScript(p.key, p.totalChecks)}
</body>
</html>`;
    fs.writeFileSync(path.join(OUT_DIR, p.outName), page, 'utf8');
    console.log('rendered:', p.outName);
  }

  // 首页：五阶段完整课程目录 + 自动收纳第 16 课及以后的扩展专题
  const coveredNums = new Set();
  const activeStages = STAGES.map(st => {
    const stagePages = pages.filter(p => p.num >= st.range[0] && p.num <= st.range[1]);
    stagePages.forEach(p => coveredNums.add(p.num));
    return { ...st, stagePages };
  });

  const extraPages = pages.filter(p => !coveredNums.has(p.num));
  if (extraPages.length > 0) {
    activeStages.push({
      id: 6,
      name: '阶段六 · 扩展专题与实战番外',
      desc: '在 15 课主线之外持续扩展的传感器、低功耗、组网与综合项目模块',
      stagePages: extraPages
    });
  }

  const stageSections = activeStages.filter(st => st.stagePages.length > 0).map(st => {
    const items = st.stagePages.map(p => `
      <a class="lesson-card" href="${encodeURI(p.outName)}" data-lesson-key="${p.key}" data-total-checks="${p.totalChecks}">
        <div class="lc-num">L${p.key}</div>
        <div class="lc-main">
          <div class="lc-title">${escapeHtml(p.shortTitle)}</div>
          <div class="lc-meta">难度 ${escapeHtml(p.stars)} ${p.durationShort ? '· ⏱ ' + escapeHtml(p.durationShort) : ''}</div>
        </div>
        <div class="lc-status" id="st-${p.key}">0 / ${p.totalChecks}</div>
      </a>`).join('');
    return `
    <section class="stage-block">
      <div class="stage-head">
        <h2>${escapeHtml(st.name)}</h2>
        <p>${escapeHtml(st.desc)}</p>
      </div>
      <div class="lesson-list">${items}
      </div>
    </section>`;
  }).join('\n');

  const totalCheckCount = pages.reduce((sum, p) => sum + p.totalChecks, 0);

  const index = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ESP32 从零到专家 · 15 课交互式实战教程</title>
<style>${CSS}
.hero-sub { color: var(--muted); margin-top: -.4em; margin-bottom: 1.4em; font-size: .98em; }
.highlights {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 10px;
  margin: 1.2em 0 1.6em;
}
.hl-card {
  background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: .75em .95em;
  font-size: .88em; line-height: 1.55;
}
.hl-card b { display: block; color: var(--accent); font-size: 1.02em; margin-bottom: .2em; }
.overall-progress {
  background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: .95em 1.15em;
  margin: 1.4em 0 2em; box-shadow: 0 2px 8px rgba(0,0,0,.03);
}
.op-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; font-size: .92em; margin-bottom: .55em; }
.op-reset {
  font-family: inherit; font-size: .82em; color: var(--muted); background: transparent;
  border: 1px solid var(--border); border-radius: 6px; padding: 2px 8px; cursor: pointer;
}
.op-reset:hover { color: #c0392b; border-color: #e6b0aa; }
.stage-block { margin-top: 2.2em; }
.stage-head h2 { margin-top: 0; margin-bottom: .35em; }
.stage-head p { margin: 0 0 .85em .2em; color: var(--muted); font-size: .92em; }
.lesson-list { display: flex; flex-direction: column; gap: 8px; }
.lesson-card {
  display: flex; align-items: center; gap: 14px; padding: .8em 1.05em;
  background: #fff; border: 1px solid var(--border); border-radius: 10px;
  text-decoration: none; color: var(--fg); transition: .15s;
}
.lesson-card:hover { border-color: var(--accent); background: var(--accent-soft); transform: translateX(2px); }
.lc-num {
  font-family: "Cascadia Code", Consolas, monospace; font-weight: 700; font-size: .95em;
  color: var(--accent); background: var(--accent-soft); border-radius: 8px;
  padding: .35em .65em; min-width: 48px; text-align: center;
}
.lc-main { flex: 1; min-width: 0; }
.lc-title { font-weight: 600; font-size: 1.02em; line-height: 1.4; }
.lc-meta { font-size: .82em; color: var(--muted); margin-top: .15em; }
.lc-status {
  font-size: .82em; padding: .25em .7em; border-radius: 99px; white-space: nowrap;
  background: #f3f1ec; color: var(--muted); font-weight: 500;
}
.lc-status.partial { background: #fff6db; color: #9c6e00; }
.lc-status.done { background: var(--accent); color: #fff; }
.footer-note { text-align: center; color: var(--muted); font-size: .88em; margin-top: 3em; }
</style>
</head>
<body><div class="wrap">
<img src="assets/cover.svg" alt="ESP32 从零到专家 · 封面" style="width:100%;border-radius:12px;border:1px solid var(--border);display:block">
<h1>ESP32 从零到专家 · 实战教程</h1>
<p class="hero-sub">15 课螺旋式闯关 · 20 个浏览器内嵌交互实验台 · 有开发板或纯浏览器（Wokwi 仿真）皆可通关</p>

<div class="highlights">
  <div class="hl-card"><b>🔌 零硬件也能学</b>每课均提供 Wokwi 在线仿真替代方案与内置可交互电路/波形组件</div>
  <div class="hl-card"><b>🧵 螺旋伏笔设计</b>第 1 课埋下的引脚禁区、按键抖动与 delay 隐患，在后续课程逐一破案回收</div>
  <div class="hl-card"><b>🛠️ 直通工程实战</b>从 Arduino 点灯一路进阶到 I2C/SPI、Wi-Fi/MQTT、PlatformIO、ESP-IDF 与边缘 AI</div>
</div>

<div class="overall-progress">
  <div class="op-top">
    <strong id="op-summary">📊 学习进度：已完成 0 / ${pages.length} 课（验收清单 0 / ${totalCheckCount}）</strong>
    <button type="button" class="op-reset" id="op-reset" title="清空本地保存的打勾记录">重置进度</button>
  </div>
  <div class="check-bar-wrap"><div class="check-bar-fill" id="op-bar"></div></div>
</div>

${stageSections}

<p class="footer-note">本课程系列：从点亮一盏灯，到设计一台会自己思考的机器。</p>
</div>
<script>
(function () {
  var STORAGE_KEY = 'esp32_tutorial_progress_v1';
  var TOTAL_LESSONS = ${pages.length};
  var TOTAL_CHECKS = ${totalCheckCount};

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function renderProgress() {
    var store = loadStore();
    var doneLessons = 0;
    var doneChecks = 0;
    document.querySelectorAll('.lesson-card').forEach(function (card) {
      var key = card.getAttribute('data-lesson-key');
      var total = parseInt(card.getAttribute('data-total-checks'), 10) || 0;
      var badge = document.getElementById('st-' + key);
      var entry = store[key];
      var checked = Array.isArray(entry) ? entry.length : (entry && Array.isArray(entry.checked) ? entry.checked.length : 0);
      if (checked > total) checked = total;
      doneChecks += checked;
      if (total > 0 && checked === total) {
        doneLessons++;
        if (badge) { badge.textContent = '✓ 已通关'; badge.className = 'lc-status done'; }
      } else if (checked > 0) {
        if (badge) { badge.textContent = checked + ' / ' + total; badge.className = 'lc-status partial'; }
      } else {
        if (badge) { badge.textContent = '0 / ' + total; badge.className = 'lc-status'; }
      }
    });
    var sumEl = document.getElementById('op-summary');
    var barEl = document.getElementById('op-bar');
    if (sumEl) {
      sumEl.textContent = '📊 学习进度：已通关 ' + doneLessons + ' / ' + TOTAL_LESSONS + ' 课（验收项 ' + doneChecks + ' / ' + TOTAL_CHECKS + '）';
    }
    if (barEl && TOTAL_CHECKS > 0) {
      barEl.style.width = Math.round((doneChecks / TOTAL_CHECKS) * 100) + '%';
    }
  }

  var resetBtn = document.getElementById('op-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!confirm('确定要清空所有课程的验收打勾记录吗？')) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      renderProgress();
    });
  }

  renderProgress();
  window.addEventListener('pageshow', renderProgress);
})();
</script>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), index, 'utf8');
  console.log('rendered: index.html');
}

render();
