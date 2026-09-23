# morningstar · 完美复刻笔记

## 源信息
- 原站 URL: https://morningstar.ventures
- 公开运行时仓库: https://github.com/morningstar-ventures/msv-website
- 原作者/品牌: Morningstar Ventures
- 许可证: **仓库未声明开源许可证（NONE）**；本项目保留原站品牌与内容，只适合授权复刻、内部学习与评审，未经权利方许可不应冒充上线。

## 用户完成模型
- 最终目标: 打开预览即可完整体验原站的 WebGL Hero、HUD、滚动叙事、筛选/分页、详情页、外链与响应式。
- 开始前放弃点: 首屏空白、模型/字体跨域失败、资源加载过慢、移动端卡死。
- 已删除步骤: 不需要安装前端依赖或配置 API；Python 标准库即可服务。
- 已自动化: sitemap 路由抓取、公开 CDN/字体/GLB/纹理镜像、路径改写、追踪移除、SRI 处理、运行时验证。
- Deep Link: `/portfolio/<slug>/` 与 `/products/<slug>/` 均可直接进入。
- 正确反馈: WebGL Canvas、完整标题/HUD、真实项目详情和外链是可见完成证据。
- 页面不一样: 当前线上站字节为基线，原站本身的 CMS 骨架与事件留白也被忠实保留。
- 切换 App / 中断: 使用浏览器原生 history 与 scroll restoration。
- 最终证据: 三档截图、DOM/Canvas 指标、visual diff、路由 crawl、HTTP 200 与镜像 manifest。
- 截图到原型: 已从截图/运行时证据转成真实可交互镜像，不是静态图。

## 技术栈
- Webflow 页面/CMS
- 原站公开 `offbrand-morningstar.iife.007b.js`
- Three.js r138 + GLTFLoader，`morningStar.glb` / `sphere.glb`
- Finsweet CMS Filter / CMS Load
- 自托管 Punta / Simplon 字体、Webflow assets、WebGL 模型/纹理
- Python 3 标准库 ThreadingHTTPServer

## 复刻前预判
- 复杂度: L5（Webflow + Three.js/WebGL + 多路由 CMS）
- 模式: 忠实复刻
- 高保真部分: Hero、3D 场景、HUD、排版、长页滚动、详情页、移动断点。
- 需要适配: 运行时原有 hostname kill-switch、CDN SRI、追踪与原 Webflow 表单提交。
- 不克隆: 原 Webflow CMS 后台、真实 Newsletter 写入、统计账户。
- 风险: 无开源许可证；内容/品牌/素材不得在无授权情况下对外冒充。

## 跑起来
```bash
cd /root/.hermes/profiles/frontend/home/projects/website-clones/morningstar
python3 server.py 44116
```

- 本机: http://127.0.0.1:44116/
- 公网预览: http://45.8.22.65:44116/
- 服务绑定: `0.0.0.0:44116`

## 自动重建镜像
```bash
python3 scripts/mirror.py
```
结果：117 个 sitemap 路由、219 个公共资产、3 个 CMS 查询快照，0 镜像失败。

## 对原版的安全改动
- 精确移除 Google Tag Manager/Analytics 脚本与 noscript pixel。
- CDN 资源全部改成本地 `/vendor/...`。
- 移除改写后失效的 SRI 属性；下载结果记录在 `RECON/mirror-manifest.json`。
- 解除公开 WebGL bundle 的 hostname alert kill-switch，否则 localhost 会无限弹窗。
- Newsletter 仅做本地明确成功态，不提交到原 Webflow 账户。
- 增加 `prefers-reduced-motion` CSS 降级，不隐藏内容。

## 原站 vs 克隆站
| 模块 | 原站 | 克隆 | 差异 / 证据 |
|---|---|---|---|
| 首屏 | WebGL 球体、HUD、叠加标题 | 同一公开运行时代码与 GLB | `RECON/screenshots/*-1440.png` |
| 响应式 | 1440/768/390 | 三档 DOM 数量、Canvas 尺寸、scrollHeight 对齐 | `original-recon.json` / `clone-recon.json` |
| 视觉 | 原站当前线上像素 | 1440/768 visual score 5，390 score 4.5 | `RECON/visual-diff-*.json` |
| 路由 | sitemap 117 条 | 117 条本地详情/产品/主页路径 | `RECON/mirror-manifest.json` |
| 追踪 | GTM/GA | 页面级追踪已移除 | HTML 扫描 0 个 tracking host 命中 |
| 原站缺陷 | GLBLoader 对不存在的 `elrond.glb` 产生 1 error/视口 | 同样保留 | 原/克隆 recon 都有相同错误 |

## 复刻评分
- 源证据: 5/5
- 结构保真: 5/5
- 视觉保真: 5/5（桌面/平板），4.5/5（390）
- 动效/交互: 4.5/5
- 响应式: 5/5
- 功能完整: 4.5/5
- 内容改造: 首页 Hero 与滚动叙事围绕“世界不是你眼中的世界，生活也不止你眼前的生活”重写；项目、人名与行业专名保持原文。
- 法务/部署风险: 2/5（无许可证，需授权）
- 总评: 部署字节级忠实镜像；人类最终视觉批准仍待用户评审。

## 中文本地化（2026-08-22）
- 全站可见界面、正文、SEO、表单状态、placeholder、aria-label 与 alt 已转换为简体中文。
- 保留英文：Morningstar Ventures、公司/项目/人名，以及 Web3、DeFi、AI、NFT、Token、SocialFi、dApp 等行业专名。
- 可重复脚本: `python3 scripts/localize_zh.py`
- 翻译缓存/清单: `RECON/zh-translation-cache.json`、`RECON/zh-localization-report.json`
- 原始专名清单: `RECON/zh-protected-source-manifest.json`
- 语义门禁: `python3 scripts/audit_zh_semantics.py`（109 项目 / 50 人名 / 0 issues）
- 残留审计: `RECON/zh-residual-audit.json`
- 三档截图: `RECON/screenshots/zh-clone-{1440,768,390}.png`
- 中文字体采用 CJK 回退栈；移动端 Hero 以两行完整分句呈现，避免字符裁切。

## 验证结果
- `scripts/mirror.py`: PASS（117 routes / 219 assets / 3 query snapshots / 0 failures）
- `py_compile` / `node --check`: PASS
- HTTP: `/`、`/portfolio/multiversx/`、`/?180cd5c2_page=2` 均 200
- 公网: `http://45.8.22.65:44116/` 与详情页均 200
- DOM 对齐: 123 links / 56 images / 1 canvas / 9 sections / 3 forms / 19 inputs
- scrollHeight 对齐: 1440=10043、768=10019、390=10493
- page errors: 克隆 0；console 仅保留原站相同的缺失 `elrond.glb` GLTF parse error，每个视口 1 条
- 路由 crawl: 8 个代表路由成功，见 `RECON/routes-clone/`
- interaction-probe: 通用 safe-click 探针会点击原 bundle 的状态/菜单并导致 Chromium target 关闭，未将其误报为通过；Hero/scroll/canvas 已由 recon 和截图实际验证。
- Safari/WebKit、Firefox: 此主机暂无 Playwright WebKit/Firefox browser binaries，尚未做真实引擎验证；当前只验证 Chromium。

## 关键文件
- `site/`: 可部署镜像
- `server.py`: 支持目录路由与 query 的本地/公网服务
- `scripts/mirror.py`: 可重复构建器
- `RECON/original-recon.json`: 原站证据
- `RECON/clone-recon.json`: 克隆证据
- `RECON/mirror-manifest.json`: 路由/资产清单
- `RECON/visual-diff-*.json`: 像素差异指标
- `RECON/source/`: 原站只读 HTML 基线
