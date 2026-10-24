// 启动冒烟：最小 DOM stub 里真跑一遍脚本，验 fetch hook 装上了、数据真被过滤
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'human.user.js'), 'utf8');

// ---- 最小环境 ----
globalThis.window = globalThis;
globalThis.document = {
  readyState: 'loading',
  addEventListener() {},
  createElement() {
    return {
      style: {},
      classList: { toggle() {}, add() {}, remove() {} },
      appendChild() {},
      attachShadow() { return { appendChild() {} }; },
      dataset: {},
    };
  },
  documentElement: { className: '', getAttribute() { return null; } },
  body: null,
  querySelector() { return null; },
};
globalThis.localStorage = { getItem() { return null; }, setItem() {} };

// ---- 假接口 ----
const payload = {
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

globalThis.fetch = async () => new Response(JSON.stringify(payload), {
  status: 200,
  headers: { 'content-type': 'application/json' },
});

// ---- 跑脚本 ----
eval(src);

let fail = 0;
const check = (name, cond, extra = '') => {
  if (!cond) fail++;
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`);
};

check('注入标记 window.__hbl', globalThis.__hbl === 1);
check('fetch 被包装', typeof globalThis.fetch === 'function' && globalThis.fetch.__hbl === 1);

const res = await globalThis.fetch('https://api.bilibili.com/x/v2/reply/main?pn=1');
const body = await res.json();
const ids = body.data.replies.map(r => r.rpid);

check('普通评论被删', !ids.includes(1), '剩余 ' + JSON.stringify(ids));
check('规整评论也被删', !ids.includes(2), '剩余 ' + JSON.stringify(ids));
check('带鱼号被保留', ids.includes(3), '剩余 ' + JSON.stringify(ids));

// 非评论接口原样放行
const other = await globalThis.fetch('https://api.bilibili.com/x/v2/reply/add');
check('非目标接口放行', other instanceof Response);

console.log(fail ? `\n${fail} 条没对` : '\n冒烟通过');
process.exit(fail ? 1 : 0);
