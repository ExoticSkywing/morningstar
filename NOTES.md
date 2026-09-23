# NEBULUXE · 维护说明

一个页面、同一条滚动轴：Behfar 的宇宙 / 烟雾为 hero0，Morningstar 的球体 / 中文内容为 hero1。

## 启动

```powershell
cd D:\repo\morningstar
npm ci
npm run dev
```

预览：http://127.0.0.1:5173/ 。生产构建：`npm run build`；构建预览：`npm run preview`（4173）。
发布静态产物时使用整个 `dist/` 目录，部署到站点根路径。

## 连续过渡

- hero0 保留原版 572vh 镜头旅程，包括加载、星系、文字粒子、环绕和进入烟雾。
- 接着用 120vh 让烟雾逐渐透明，露出预加载的 Morningstar 球体；底部探索入口随后出现，导航最后接入。
- 692vh 后进入 Morningstar 原版首页的滚动序列，继续展示介绍、投资组合、产品、团队等内容。
- 同一个 DOM 中运行，没有 iframe、页面跳转或第二次加载屏；向上滚动可以逆向返回。
- 顶部 NEBULUXE / Beyond / Explore 分别定位开头、hero1 和投资组合；NEBULUXE 标志返回 hero0。
- hero1 阶段只更新原生场景进度；已固定的 hero0 进度不会继续触发 React 更新或重复写入过渡样式。回滚时恢复更新。

## 修改位置

- 过渡长度：`src/utils/scenes/universeTiming.js` 中的 `HANDOFF_VH`。
- 滚动进度与标题、导航入场：`src/hooks/useHeroJourney.js`。
- 烟雾整体淡出：`src/App.jsx`。
- Morningstar 生命周期、菜单、原生 3D 桥接：`src/morningstar/runtime.js`。
- Morningstar 页面与样式：`src/morningstar/content.html`、`source.css`（生成文件），融合覆盖：`integration.css`。

## 来源与导入

hero0 源于 Behfar Behzad 的公开源码 https://github.com/Behfar90/behfar-dev ，提交 `7ccd2df359f844cc824e092ad65319b1ab1404a1`。
hero1 源于用户本地项目 `D:\repo\morningstar\site`。site/ 保留为镜像输入；融合应用、资源和详情页面现已全部纳入这个仓库。

重新导入 Morningstar：`node scripts/import-morningstar.mjs [源 site 目录]`。此命令同步本地素材、生成带作用域的页面和 CSS、修补原运行时，并覆盖生成文件。首页结构定制写在 scripts/nebuluxe-home.mjs；样式及运行时定制放在 integration.css / runtime.js 中。

模型、纹理、字体与脚本均本地提供；订阅表单只展示演示反馈。作者原项目未声明整体许可证；字体的 OFL 文件已保留。

完整融合说明与验证见 `FUSION.md`、`CLONE_REPORT.md`。融合前的独立 hero0 基线（源码、文档）保存在 `RECON/behfar-fusion/hero0-baseline/`。

## NEBULUXE 首屏设计

hero1 中央不放文字：移除两行大标题、引文及 Token / Equity；左上和页脚采用星云图形与全大写赛博艺术字，底部只保留继续探索。隐藏重复的圆形滚动提示，保留左侧章节导航。菜单和页脚社交图标保留，URL 暂未设置。

hero0 粒子标题直接绘制 `src/brand/nebuluxeWordmark.js` 中的矢量轮廓，与导航 SVG 一致；只为字幕预加载 Audiowide，旧 Monoton 字体不再加载。品牌内涵、素材位置和权利声明见 BRAND.md / BRAND-NOTICE.md。

## 整理与验证 · 2026-09-23

- 减少 hero1 阶段的 React 更新和过渡样式写入，保留原有可逆烟雾衔接。
- 补齐 7 张缺失的部署图片，并同步镜像输入；重新导入未改变已有生成文件。
- 菜单的 `aria-expanded` 与实际展开状态同步，`aria-controls` 指向真实菜单。
- Python 预览改用标准路径处理，默认只监听本机；4 项 HTTP 回归测试通过。
- `npm ci`、`npm run check`、`npm run build` 通过；123 份 HTML、253 个本地资源／路由引用无缺失，依赖审计无已知漏洞。
- 桌面 1440×900 和手机 390×844 的生产页面检查无横向溢出；验证正反向衔接、hero1 直达、品牌返回和键盘菜单。

构建仍提示 WebGL 主包较大（gzip 约 378 kB）；未测量真实移动设备帧率。
