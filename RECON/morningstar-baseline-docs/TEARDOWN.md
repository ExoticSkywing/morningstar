# Morningstar WebGL 技术拆解

## 0. 一句话本质
Webflow/CMS 负责页面与内容，公开 IIFE bundle 内置 Three.js r138 场景、GLTFLoader、相机/材质/滚动状态，Canvas 固定铺满视口；Hero 的真实几何来自公开 GLB 与 Webflow 纹理资产。

## A. 真实技术拆解
- `[SOURCE]` Canvas 属性：`data-engine="three.js r138"`，原/克隆三档均为 1 个满视口 Canvas。
- `[SOURCE]` 运行时仓库：`morningstar-ventures/msv-website`，线上引用 `offbrand-morningstar.iife.007b.js`。
- `[SOURCE]` 模型：`sphere.glb`、`morningStar.glb`；运行时浏览器请求均 200。
- `[SOURCE]` 渲染资源：Webflow CDN 上的 sphere normal、smoke diffuse 等纹理已镜像到 `site/vendor/`。
- `[SOURCE]` 交互桥：Webflow DOM 层提供 Hero 标题、HUD、章节与筛选；Three.js Canvas 固定为背景层，滚动驱动场景状态。
- `[SOURCE]` 宿主限制：bundle 首句包含仅允许原站/Webflow host 的无限 alert kill-switch；本地镜像只将该条件替换为 `if(false)`，不改场景逻辑。
- `[SOURCE]` GLTF 错误：原站当前也会对一个响应为 HTML/无效 JSON 的旧 `elrond.glb` 请求输出 parse error；不影响 Hero 两个主要 GLB。

## B. 复刻方式
1. 从 sitemap 获取 117 个公开路由。
2. 保存原 HTML 到 `SOURCE/`，生成去追踪的 `site/`。
3. 递归提取并镜像 Webflow/jsDelivr/Cloudfront 公开资产。
4. 改写 CDN URL，处理 SRI、host kill-switch 与 Finsweet 动态模块。
5. 用自定义标准库 server 支持 `/route/` 与 query 请求。
6. 三档 recon + visual diff 验证结构/Canvas/像素。

## C. 可迁移方法论
- Webflow + WebGL 站应优先镜像真 bundle 和真 GLB，不要凭截图重写 shader/模型。
- 本地化 CDN 后必须检查 SRI；HTTP 200 不代表资源被浏览器执行。
- 先查 bundle 首部是否存在 host lock/alert lock，否则自动化会表现为 target 被关闭或无限弹窗。
- 动态 `import()` 的 Finsweet 子模块不会被静态 HTML 直接发现，需要根据浏览器 pageerror 补齐。
- 原站本身的错误必须与克隆差异分开记录，不能把“原样错误”误报成新增回归。
