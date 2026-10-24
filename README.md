# 屏蔽人类

反向整活版 [屏蔽大肥鱼](https://github.com/ybyz2/bilibili-dafeiyu-blocker)

不另造一套「人类特征」，直接把原版的判据拿来取反：原版认为「像 AI」该删的，这里留下；原版认为「正常」该留的，这里删掉

![屏蔽前 / 屏蔽后](demo-BV1KMnw6ME1Z.png)

## 安装

需要篡改猴 Tampermonkey / 脚本猫 / 暴力猴。Chrome、Edge 138+ 要去扩展设置里打开「允许运行用户脚本」

一键安装：[点这里](https://raw.githubusercontent.com/Gaia-coder/bilibili-human-blocker/main/human.user.js)

国内打不开就走 jsDelivr：[cdn.jsdelivr.net/gh/Gaia-coder/bilibili-human-blocker@main/human.user.js](https://cdn.jsdelivr.net/gh/Gaia-coder/bilibili-human-blocker@main/human.user.js)

也可以手动装：下载 `human.user.js`，在脚本管理器里新建脚本，粘贴全文保存

## 用法

脚本管理器图标 → **屏蔽人类** → 设置。Esc 关闭

## 判据（原样搬自原版）

- 账号名含 `大肥鱼` `肥鱼` `鲸鱼` `大肥鲸` `鲸鱼娘`（单看「鱼/鲸」会把咸鱼、池鱼也当成 AI）
- 正文含 `大肥鱼` `肥鱼` `鲸鱼` `大肥鲸` `鲸鱼娘` `本鲸` `本鱼` `本肥鱼` `主人`
- 单字 `鱼` `鲸`、全角 `：；`、破折号、直角引号 `「」`

## 反向规则

命中上面任意一条 → **保留**；一条都没命中 → **删除**

## 档位

反向之后档位是倒着对应的，「杀戮」删得最多，「轻度」删得最少。@ 不参与判定，真人发 @ 太常见

| 档位 | 判据 | 留下什么 |
|---|---|---|
| 轻度 | 最宽 | 名字/关键词/标点/单字鱼鲸，全都留 |
| **标准**（默认） | 居中 | 名字/关键词 |
| 杀戮 | 最窄 | 只有名字/关键词 |

## 保留词

自定义词命中就留下，不分大小写，所有档位生效，最多 100 个

## 沿用原版的

楼中楼三档、置顶保留、已删计数、响应层拦截所以无闪烁、跟随 B站夜间模式

## 已知

正常评论区基本会被清空，最后只剩带 AI 特征的评论。这就是整活的点

## 自测

```
node test/judge.test.mjs    # 判定逻辑，从脚本里抽源码真跑
node test/smoke.test.mjs    # 最小 DOM 环境里跑启动，验 fetch hook 和过滤
node test/browser.test.mjs  # 真 Chromium 打开本地模拟页，验 fetch/XHR/面板
```

## 许可

MIT，改自 [ybyz2/bilibili-dafeiyu-blocker](https://github.com/ybyz2/bilibili-dafeiyu-blocker)

原版版权声明保留在 LICENSE 里。这个反向版只为整活，真要屏蔽 AI 评论请去用原版
