// 从 human.user.js 里抽出判定段真跑，不手抄逻辑
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'human.user.js'), 'utf8');

const a = src.indexOf('/* ============ 判定');
const b = src.indexOf('/* ============ 已清计数');
if (a < 0 || b < 0) throw new Error('没找到判定段');

const body = src.slice(a, b);
const make = new Function('config', body + '\nreturn { isBlocked, isAILike };');

function judge(text, { tier = 'standard', uname = '路人甲', words = [] } = {}) {
  const j = make({ words });
  const r = { content: { message: text }, member: { uname } };
  return { blocked: j.isBlocked(r, tier), ai: j.isAILike(r, 'standard') };
}

// 反向版：原版判「像 AI」的留下，其余全删
const cases = [
  // [说明, 文本, 选项, 期望被删]
  ['名字带大肥鱼', '今天天气不错', { uname: '爱睡觉的大肥鱼' }, false],
  ['名字叫咸鱼不算', '今天天气不错', { uname: '一条咸鱼n' }, true],
  ['名字带肥鱼算', '今天天气不错', { uname: '蓝肥鱼' }, false],
  ['正文带关键词', '本鲸来了', {}, false],
  ['带@不再算AI', '@某某 我也这么觉得', {}, true],
  ['普通评论', '感谢UP主分享。', {}, true],
  ['短评', '6', {}, true],
  ['表情包', '哈哈哈哈😂', {}, true],
  ['规整长句', '这是一个关于人工智能的视频，讨论了大模型的能力边界。', {}, true],

  // 档位：杀戮=原小杯（留下最少），轻度=原杀戮（留下最多）
  ['杀戮档只留名字/关键词', '他说：「这件事值得讨论」。', { tier: 'kill' }, true],
  ['杀戮档正文关键词不算', '他说：「本鲸觉得可以」。', { tier: 'kill' }, true],
  ['杀戮档只留名字', '他说：「这件事值得讨论」。', { tier: 'kill', uname: '余子家的大肥鱼' }, false],
  ['轻度档留全角标点', '他说：「这件事值得讨论」。', { tier: 'cup' }, false],
  ['轻度档留单字鱼', '这条鱼真大', { tier: 'cup' }, false],
  ['标准档删全角标点', '他说：「这件事值得讨论」。', { tier: 'standard' }, true],


  // 保留词
  ['保留词命中', '随便说点什么', { words: ['随便'] }, false],

  // 系统前缀剥离：关键词仍看完整原文
  ['回复前缀关键词', '回复 @大肥鱼 :谢谢', {}, false],
  ['回复前缀无关键词仍删', '回复 @某某 :谢谢', {}, true],
];

let bad = 0;
for (const [name, text, opt, want] of cases) {
  const got = judge(text, opt);
  const ok = got.blocked === want;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(14)} 删=${got.blocked} 期望=${want} | ${text}`);
}
console.log(bad ? `\n${bad} 条没对` : '\n全部通过');
process.exit(bad ? 1 : 0);
