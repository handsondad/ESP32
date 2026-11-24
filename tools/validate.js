// 全量自动化校验脚本：供扩展课程/组件/插画后快速自检
// 用法: node tools/validate.js （或 npm run validate）
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const LESSONS_DIR = path.join(ROOT, 'lessons');
const WIDGETS_DIR = path.join(ROOT, 'widgets');
const ASSETS_DIR = path.join(ROOT, 'assets');
const SITE_DIR = path.join(ROOT, 'site');

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error('❌ [ERROR]', msg);
  errors++;
}
function warn(msg) {
  console.warn('⚠️  [WARN]', msg);
  warnings++;
}

// 1. 检查 lessons/*.md 与 site/*.html 数量对应关系
if (!fs.existsSync(SITE_DIR)) {
  fail('site/ 目录不存在，请先执行: node tools/render.js');
  process.exit(1);
}

const lessonFiles = fs.readdirSync(LESSONS_DIR).filter(f => f.endsWith('.md')).sort();
const siteHtmlFiles = fs.readdirSync(SITE_DIR).filter(f => f.endsWith('.html')).sort();

if (lessonFiles.length === 0) fail('lessons/ 下未找到任何 .md 课程文件');
for (const lf of lessonFiles) {
  const expectedHtml = lf.replace(/\.md$/, '.html');
  if (!siteHtmlFiles.includes(expectedHtml)) {
    fail(`lessons/${lf} 未生成对应的 site/${expectedHtml}（请重新运行 node tools/render.js）`);
  }
  const md = fs.readFileSync(path.join(LESSONS_DIR, lf), 'utf8');
  if (!/^#\s+第\s*\d+\s*课[：:]/m.test(md)) {
    warn(`lessons/${lf}: 一级标题未使用标准格式 "# 第 N 课：..."`);
  }
  if (!/^-\s*\[[ xX]\]\s+/m.test(md)) {
    fail(`lessons/${lf}: 缺少 "- [ ] ..." 验收 Checklist 条目`);
  }
  if (/\{\s*\/\*[^*]*原样放这里[^*]*\*\/\s*\}/.test(md)) {
    fail(`lessons/${lf}: 存在未补全的占位空函数 "{ /* ...原样放这里... */ }"，完整代码必须可直接复制编译`);
  }
}

if (!siteHtmlFiles.includes('index.html')) {
  fail('缺少首页 site/index.html');
}

// 检查 index.html 是否收录了所有课程卡片
const indexHtml = fs.existsSync(path.join(SITE_DIR, 'index.html'))
  ? fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8')
  : '';
for (const lf of lessonFiles) {
  const outName = lf.replace(/\.md$/, '.html');
  if (!indexHtml.includes(encodeURI(outName)) && !indexHtml.includes(outName)) {
    fail(`site/index.html 未收录课程链接: ${outName}`);
  }
}

// 2. 逐页检查 site/*.html：占位符、JS 语法、本地链接、Markdown 残留
for (const hf of siteHtmlFiles) {
  const html = fs.readFileSync(path.join(SITE_DIR, hf), 'utf8');

  if (html.includes('<div class="widget-missing">')) {
    fail(`site/${hf}: 存在缺失的交互组件 (widget-missing)`);
  }
  if (html.includes('<figure class="img-placeholder">')) {
    fail(`site/${hf}: 存在缺失的插画占位框 (img-placeholder)`);
  }
  if (/\{\{widget:/.test(html)) {
    fail(`site/${hf}: 存在未替换的 {{widget:...}} 标签`);
  }
  if (hf !== 'index.html' && !html.includes('class="task-cb"')) {
    fail(`site/${hf}: 缺少可交互验收复选框 (.task-cb)`);
  }
  if (/<input[^>]*disabled[^>]*type="checkbox"/i.test(html)) {
    fail(`site/${hf}: 仍存在 disabled 状态的复选框`);
  }

  // 校验所有内联 <script> 语法
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m, sIdx = 0;
  while ((m = scriptRe.exec(html)) !== null) {
    sIdx++;
    try {
      new vm.Script(m[1], { filename: `site/${hf}#script${sIdx}` });
    } catch (e) {
      fail(`site/${hf}#script${sIdx} JS 语法错误: ${e.message}`);
    }
  }

  // 校验本地相对路径链接与图片资源存在性
  const linkRe = /\b(?:href|src)="([^"#?]+)"/gi;
  while ((m = linkRe.exec(html)) !== null) {
    const raw = m[1];
    if (/^(?:https?:|mailto:|javascript:|data:)/i.test(raw) || raw.startsWith('/')) continue;
    const target = path.join(SITE_DIR, decodeURI(raw));
    if (!fs.existsSync(target)) {
      fail(`site/${hf}: 本地资源或链接不存在 "${raw}"`);
    }
  }

  // 剥离代码/脚本/样式后检查未渲染的 Markdown 语法残留
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<pre[\s\S]*?<\/pre>/gi, '')
    .replace(/<code[\s\S]*?<\/code>/gi, 'CODE');

  for (const [label, re] of [
    ['未渲染粗体 **', /\*\*/],
    ['未渲染反引号 `', /`/],
    ['未渲染链接 []()', /\[[^\]]+\]\([^)]+\)/]
  ]) {
    if (re.test(stripped)) {
      const sample = stripped.split('\n').find(l => re.test(l)) || '';
      fail(`site/${hf}: 检测到 ${label} 残留 -> ${sample.trim().slice(0, 100)}`);
    }
  }
}

// 3. 检查 widgets/*.html 内部 DOM ID 绑定与幂等保护
const widgetFiles = fs.readdirSync(WIDGETS_DIR).filter(f => f.endsWith('.html')).sort();
for (const wf of widgetFiles) {
  const whtml = fs.readFileSync(path.join(WIDGETS_DIR, wf), 'utf8');
  if (!/dataset\.bound/.test(whtml)) {
    warn(`widgets/${wf}: 建议在顶层 IIFE 中添加 root.dataset.bound = '1' 幂等绑定保护`);
  }
  const ids = new Set();
  let m;
  const idRe = /\bid="([^"]+)"/g;
  while ((m = idRe.exec(whtml)) !== null) ids.add(m[1]);

  const getRe = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = getRe.exec(whtml)) !== null) {
    if (!ids.has(m[1])) {
      fail(`widgets/${wf}: getElementById('${m[1]}') 在本组件 HTML 中找不到对应 id`);
    }
  }
}

// 4. 检查 assets/*.svg 与 site/assets/*.svg 的 XML 标签闭合性
for (const dir of [ASSETS_DIR, path.join(SITE_DIR, 'assets')]) {
  if (!fs.existsSync(dir)) continue;
  const relDir = path.relative(ROOT, dir);
  for (const sf of fs.readdirSync(dir).filter(f => f.endsWith('.svg')).sort()) {
    const svg = fs.readFileSync(path.join(dir, sf), 'utf8').trim();
    if (!svg.startsWith('<svg') && !svg.startsWith('<?xml')) {
      fail(`${relDir}/${sf}: 未以 <svg 或 <?xml 开头`);
    }
    if (!svg.endsWith('</svg>')) {
      fail(`${relDir}/${sf}: 未以 </svg> 结尾`);
    }
    const clean = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '');
    const tagRe = /<\/?([a-zA-Z][\w:-]*)[^>]*?(\/?)>/g;
    const stack = [];
    let tm;
    while ((tm = tagRe.exec(clean)) !== null) {
      const fullTag = tm[0], name = tm[1], selfClose = tm[2] === '/';
      if (fullTag.startsWith('</')) {
        const top = stack.pop();
        if (top !== name) {
          fail(`${relDir}/${sf}: XML 标签不匹配，遇到 </${name}>，期望 </${top}>`);
          break;
        }
      } else if (!selfClose) {
        stack.push(name);
      }
    }
    if (stack.length > 0) {
      fail(`${relDir}/${sf}: 存在未闭合标签: ${stack.join(', ')}`);
    }
  }
}

if (errors === 0) {
  console.log(`✅ 校验全部通过：${lessonFiles.length} 节课程 · ${siteHtmlFiles.length} 个页面 · ${widgetFiles.length} 个组件 · 0 错误${warnings ? `（${warnings} 条提示）` : ''}`);
} else {
  console.error(`\n❌ 校验失败：共发现 ${errors} 个错误${warnings ? `、${warnings} 条提示` : ''}`);
  process.exit(1);
}
