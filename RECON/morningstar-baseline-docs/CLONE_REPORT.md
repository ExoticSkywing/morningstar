# Morningstar Ventures · 复刻评估报告

## 结论
- 复杂度: L5
- 模式: 忠实复刻 / 部署资产镜像
- 总体还原度: 当前证据为桌面/平板视觉 5/5、390px 4.5/5；WebGL、HUD、结构与页面高度对齐。
- 适用: 授权展示、内部学习、继续内容爆改；由于上游没有开源许可证，不建议未经授权原样公开商用。

## 对比
| 维度 | 原站 | 克隆站 | 结论 |
|---|---|---|---|
| 信息架构 | 首页 + brand/test + 110 个 portfolio + 5 个 products | sitemap 117 路由全镜像 | 对齐 |
| 视觉语言 | 暗色 WebGL、科技 HUD、Punta/Simplon | 同源字体、资源、Three.js bundle | 高保真 |
| 动效交互 | WebGL Canvas、滚动章节、筛选/加载 | 核心 runtime 本地化，hostname lock 已安全解除 | 运行 |
| 响应式 | 1440/768/390 | DOM/Canvas/scrollHeight 一致 | 对齐 |
| 内容 | 原站结构与专名；首页采用新的诗意叙事 | 本地化并完成首页编辑性改造 | 结构保真 / 文案重构 |
| 功能边界 | Webflow CMS/Analytics/Newsletter | CMS 展示镜像；追踪移除；Newsletter 本地成功态 | 安全隔离 |

## 数字证据
| 宽度 | Diff ratio | Mean abs diff | Visual score |
|---:|---:|---:|---:|
| 1440 | 0.004183 | 0.002871 | 5/5 |
| 768 | 0.003630 | 0.002838 | 5/5 |
| 390 | 0.021099 | 0.004652 | 4.5/5 |

## 已知缺口
- 原站当前也会为一个不存在/无效的 `elrond.glb` 输出 GLTF parse console error；克隆保留同样表现，核心 `sphere.glb` 和 `morningStar.glb` 均返回 200，Canvas 正常渲染。
- 通用 interaction-probe 的自动 safe-click 会触发此站的特殊全屏/菜单状态，导致 Chromium target 关闭，故未伪造 click probe 成功。
- 未获得本机 WebKit/Firefox browser binaries；Safari/Firefox 需要后续真机/真引擎验收。
- 原站公开 GitHub 仓库没有许可证声明。

## 中文版验收补充
- 120 个 HTML 文件全部标记 `lang="zh-CN"`。
- 已翻译：正文、导航、按钮、筛选、SEO、表单状态、placeholder、aria-label、alt。
- 专名门禁：从只读原始 HTML 自动生成 109 个项目、50 个人名、30 个卡片名及行业术语白名单；逐页集合一致性通过。
- 已修复机翻破坏：`James Zhang`、`Sergey Gorbunov`、`David Johansson`、`Simon Harman`、`Flavian Manea`、`Avalon`、`Cross The Ages` 等恢复英文。
- 已修复：109 页孤立 `s`、`Please wait...`、融资轮次、`Token / Equity` 与术语大小写/粘连。
- 有意保留：品牌、公司/项目/人名、Web3/DeFi/AI/NFT/Token/Equity 等标准专名。
- 语义硬门禁 `scripts/audit_zh_semantics.py`: PASS（0 issues）。
- 中文桌面/平板/移动端：Canvas 1、Page errors 0；控制台仍为原站同源 3 条 `elrond.glb` loader 错误。
- 1440/768 页面高度与英文基线一致；390 为 10404px，无横向溢出。
- 字体/断行修复后 1440 与 390 精确视口视觉检查通过，P0/P1 为 0。

## 人类验收
自动证据不能代替最终审美批准。请在 `http://45.8.22.65:44116/` 以你的真实设备最终验收首屏 WebGL、滚动节奏、菜单与移动端。
