# nebuluxe 仓库迁移与首屏调整

2026-09-23。当前工作目录：D:/repo/morningstar。

## 项目迁移

合并版的 src、public、构建配置、依赖锁文件、导入脚本和文档已迁入仓库根目录。临时项目中的 RECON 完整归档到 RECON/behfar-fusion（不包含嵌套 .git 或依赖缓存）。原仓库 .git、site 镜像和历史脚本保留；旧文档归档到 RECON/morningstar-baseline-docs。

开发预览 5173 已由该仓库启动。Python 入口改为服务 dist，避免继续打开旧镜像。npm ci / npm run dev / npm run build 不需要临时目录。

## 首屏方向

- hero0 的粒子品牌名替换为 nebuluxe，字幕和环绕短句改为探索主题。
- hero1 移除两行大标题、引文、Token / Equity，把球体中心完整留出来。
- 顶部左侧采用小型 nebuluxe 字标；主导航不再显示原品牌社交入口。
- 底部保留一个“继续探索 ↓”，隐藏重复圆形滚动提示，桌面左侧章节导航继续可用。
- 烟雾、球体、共享滚动轴以及菜单动画继续沿用原实现。
- 下方 CMS 和详细内容延续已有镜像，未虚构 nebuluxe 的业务资料或社交账号。

首页结构定制由 scripts/nebuluxe-home.mjs 在导入时执行，避免重新导入覆盖品牌。集成 CSS 位于 src/morningstar/integration.css。

## 验证

npm ci 通过，审计 0 vulnerabilities。npm run build 通过，保留原重 WebGL 包的体积提示。浏览器截图和交互结果记录在 RECON/nebuluxe-qa。

响应式修复：原生球体时间线在创建时固定桌面 / 手机镜头距离。现在跨 850px 断点时，保留原时间线及滚动进度，更新镜头与景深的原生动画端点，避免窄屏沿用桌面尺寸。
