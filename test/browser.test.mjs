// 真浏览器测试：本地起服务模拟 B站评论接口，Chromium 里注入脚本，验过滤/面板/无报错
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('D:/DeepseekHarness-Data/workspaces_blue/pond/tools/videokit/node_modules/playwright-core');

const CHROME = 'C:/Users/Gaia/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const here = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(here, '..', 'human.user.js');

const PAYLOAD = {
  code: 0,
  data: {
    replies: [
      { rpid: 1, member: { uname: '路人甲' }, content: { message: '哈哈哈哈哈哈' }, rcount: 0, replies: [] },
      { rpid: 2, member: { uname: '另一个路人' }, content: { message: '我觉得这个观点有道理，但需要更多证据支撑。' }, rcount: 0, replies: [] },
      { rpid: 3, member: { uname: '爱睡觉的大肥鱼' }, content: { message: '草' }, rcount: 0, replies: [] },
    ],
    top_replies: [],
  },
};

const PAGE_FETCH = `<!doctype html><meta charset="utf-8"><body><div id="app"></div>
<script>
fetch('/x/v2/reply/main?pn=1').then(r => r.json()).then(j => {
  window.__got = j.data.replies.map(r => r.rpid);
  document.getElementById('app').textContent = JSON.stringify(window.__got);
}).catch(e => { window.__err = String(e); });
</script>`;

const PAGE_XHR = `<!doctype html><meta charset="utf-8"><body><div id="app"></div>
<script>
var x = new XMLHttpRequest();
x.open('GET', '/x/v2/reply/main?pn=1');
x.onload = function () {
  var j = JSON.parse(x.responseText);
  window.__got = j.data.replies.map(r => r.rpid);
  document.getElementById('app').textContent = JSON.stringify(window.__got);
};
x.send();
</script>`;

const server = createServer((req, res) => {
  if (req.url.startsWith('/x/v2/reply')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(PAYLOAD));
    return;
  }
  if (req.url.startsWith('/xhr')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE_XHR);
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(PAGE_FETCH);
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let fail = 0;
const check = (name, cond, extra = '') => {
  if (!cond) fail++;
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`);
};

async function open(path, inject) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (inject) {
    // 先给个假的菜单注册钩子，好让面板能被打开
    await page.addInitScript(`window.GM_registerMenuCommand = function (n, f) { window.__menu = f; };`);
    await page.addInitScript({ path: SCRIPT });
  }
  await page.goto(base + path);
  await page.waitForFunction('window.__got || window.__err', null, { timeout: 8000 });
  return { page, errors };
}

// 1) 对照组：不注入，接口原样
{
  const { page } = await open('/', false);
  const got = await page.evaluate(() => window.__got);
  check('对照组拿到 3 条', Array.isArray(got) && got.length === 3, JSON.stringify(got));
  await page.close();
}

// 2) fetch 路径
{
  const { page, errors } = await open('/', true);
  const got = await page.evaluate(() => window.__got);
  check('注入标记 window.__hbl', await page.evaluate(() => window.__hbl) === 1);
  check('fetch 路径过滤', JSON.stringify(got) === '[3]', JSON.stringify(got));
  check('页面无报错', errors.length === 0, errors.slice(0, 2).join(' / '));

  // 面板能打开
  await page.evaluate(() => window.__menu && window.__menu());
  const panelOK = await page.evaluate(() => {
    const host = [...document.body.children].find(e => e.shadowRoot && e.shadowRoot.querySelector('.p'));
    return !!(host && host.shadowRoot.querySelector('.t') && host.shadowRoot.querySelector('.o'));
  });
  check('设置面板渲染', panelOK);
  await page.waitForTimeout(400);   // 等 pop 动画走完再截
  await page.screenshot({ path: join(here, 'shot-panel.png') });
  await page.close();
}

// 3) XHR 路径
{
  const { page, errors } = await open('/xhr', true);
  const got = await page.evaluate(() => window.__got);
  check('XHR 路径过滤', JSON.stringify(got) === '[3]', JSON.stringify(got));
  check('XHR 页面无报错', errors.length === 0, errors.slice(0, 2).join(' / '));
  await page.close();
}

await browser.close();
server.close();
console.log(fail ? `\n${fail} 条没对` : '\n浏览器测试通过');
process.exit(fail ? 1 : 0);
