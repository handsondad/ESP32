// 把 lessons/*.md 渲染成带样式的 HTML 页面，双击即可在浏览器查看
// 用法: node tools/render.js
const fs = require('fs');
const path = require('path');
const { marked } = require(path.join(process.env.TEMP, 'opencode', 'esp32-tools', 'node_modules', 'marked'));

const ROOT = path.join(__dirname, '..');
const LESSONS_DIR = path.join(ROOT, 'lessons');
const OUT_DIR = path.join(ROOT, 'site');

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
.wrap { max-width: 860px; margin: 0 auto; padding: 48px 28px 96px; }
h1 { font-size: 1.9em; line-height: 1.35; border-bottom: 3px solid var(--accent); padding-bottom: .4em; }
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
  background: #282c34; color: #abb2bf; padding: 16px 18px; border-radius: 8px;
  overflow-x: auto; line-height: 1.6; font-size: .86em;
}
pre code { background: none; padding: 0; color: inherit; font-size: 1em; }
table { border-collapse: collapse; width: 100%; margin: 1.2em 0; font-size: .95em; }
th, td { border: 1px solid var(--border); padding: .55em .8em; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); }
tr:nth-child(even) td { background: #f6f5f2; }
ul, ol { padding-left: 1.6em; }
li { margin: .3em 0; }
li input[type="checkbox"] { margin-right: .5em; transform: scale(1.15); }
hr { border: none; border-top: 1px dashed var(--border); margin: 2.5em 0; }
em { color: var(--muted); }
strong { color: #1a1a1a; }
figure { margin: 1.6em 0; text-align: center; }
figure img { max-width: 100%; border-radius: 10px; border: 1px solid var(--border); }
figcaption { font-size: .88em; color: var(--muted); margin-top: .5em; }
.img-placeholder .ph-box {
  border: 2px dashed var(--border); border-radius: 10px; padding: 42px 20px;
  color: var(--muted); background: #fff; font-size: .95em;
}
.widget-missing { border: 1px dashed #d00; padding: 1em; color: #d00; }
/* ---- 交互动画组件通用外壳 ---- */
.wgt {
  margin: 1.8em 0; border: 1px solid var(--border); border-radius: 12px;
  background: #fff; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.04);
}
.wgt-head {
  padding: .6em 1em; background: var(--accent-soft); border-bottom: 1px solid var(--border);
  font-size: .9em; font-weight: 600; color: var(--accent); display: flex;
  justify-content: space-between; align-items: center; gap: .5em;
}
.wgt-body { padding: 1em; }
.wgt-hint { font-size: .82em; color: var(--muted); margin-top: .6em; }
.wgt button {
  font-family: inherit; font-size: .9em; padding: .45em 1em; border-radius: 8px;
  border: 1px solid var(--border); background: #fff; cursor: pointer; transition: .15s;
}
.wgt button:hover { border-color: var(--accent); color: var(--accent); }
.wgt button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
@media (max-width: 640px) { .wrap { padding: 28px 16px 64px; } body { font-size: 15.5px; } }
`;

// 将 {{widget:name}} 占位符替换为 widgets/name.html 的内容
function inlineWidgets(html) {
  return html.replace(/\{\{widget:([\w-]+)\}\}/g, (_, name) => {
    const p = path.join(ROOT, 'widgets', name + '.html');
    if (!fs.existsSync(p)) return `<div class="widget-missing">⚠️ 组件未找到：${name}</div>`;
    return fs.readFileSync(p, 'utf8');
  });
}

// 图片缺失时用占位框替代（图片服务凭据修复后重新生成即自动替换）
function placeholderMissingImages(html, baseDir) {
  return html.replace(/<img\s+src="([^"]+)"[^>]*>/g, (m, src) => {
    if (/^https?:/.test(src)) return m;
    const candidates = [path.join(baseDir, src), path.join(OUT_DIR, src), path.join(ROOT, src)];
    if (candidates.some(c => fs.existsSync(c))) return m;
    return `<figure class="img-placeholder"><div class="ph-box">🖼️<br><small>插画占位<br>${src}</small></div></figure>`;
  });
}

function render() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(LESSONS_DIR).filter(f => f.endsWith('.md')).sort();
  const pages = [];

  // 复制 assets 到 site/assets（图片存在时）
  const assetsSrc = path.join(ROOT, 'assets');
  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, path.join(OUT_DIR, 'assets'), { recursive: true });
  }

  for (const f of files) {
    const md = fs.readFileSync(path.join(LESSONS_DIR, f), 'utf8');
    const html = placeholderMissingImages(inlineWidgets(marked.parse(md)), path.join(ROOT, 'lessons'));
    const titleMatch = md.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : f;
    const outName = f.replace(/\.md$/, '.html');
    pages.push({ title, outName });

    const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, '&lt;')}</title>
<style>${CSS}</style>
</head>
<body><div class="wrap">${html}</div></body>
</html>`;
    fs.writeFileSync(path.join(OUT_DIR, outName), page, 'utf8');
    console.log('rendered:', outName);
  }

  // 首页：课程目录
  const index = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ESP32 从零到专家 · 教程目录</title>
<style>${CSS}
.nav { margin-top: 2em; }
.nav a { display: block; padding: .7em 1em; margin: .5em 0; background: #fff;
         border: 1px solid var(--border); border-radius: 8px; text-decoration: none;
         color: var(--fg); transition: .15s; }
.nav a:hover { border-color: var(--accent); background: var(--accent-soft); }
.nav .tag { float: right; color: var(--muted); font-size: .85em; }
</style>
</head>
<body><div class="wrap">
<h1>ESP32 从零到专家 · 实战教程</h1>
<p>阶段一 · 破冰与建立信心 —— 从点亮一盏灯开始。点击进入各课：</p>
<div class="nav">
${pages.map(p => `<a href="${p.outName}">${p.title}<span class="tag">第 1 课</span></a>`).join('\n')}
</div>
<hr>
<p><em>其余各课持续更新中……</em></p>
</div></body>
</html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), index, 'utf8');
  console.log('rendered: index.html');
}

render();
