# NEBULUXE

React + Vite 承载同一页面里的宇宙 hero0、烟雾过渡和球体 hero1。正式工作目录为 `D:\repo\morningstar`；运行和构建不依赖之前的临时项目。

## 开发

使用 Node.js 22.12+（已在 22.23.2 验证），从仓库根目录执行：

```powershell
cd D:\repo\morningstar
npm ci
npm run dev
```

打开 [开发预览](http://127.0.0.1:5173/)；[直接查看 hero1](http://127.0.0.1:5173/#hero1)。

## 检查与构建

```powershell
npm run check
npm run build
npm run preview
```

`npm run check` 检查首页、详情页、品牌预览及 CSS 引用的本地文件。`npm run preview` 在 4173 端口预览构建结果。部署整个 `dist/` 到站点根路径。

可选 Python 3 入口：构建后运行 `python server.py 44116`，仅监听本机；有局域网预览需求时可设置 `HOST`。修改该服务后运行 `python scripts/test_server.py`，覆盖首页、查询参数、详情页、二进制文件和目录穿越请求。

WebGL 场景的 JS 体积较大，构建保留体积提示。hero0 和原生 hero1 使用隔离的 Three.js 版本，不共享场景对象；离屏及隐藏标签页时暂停渲染。当前构建仍是展示版本，订阅只提供本地反馈，主页保留 `noindex`。

## 文件位置

- `src/`：正式应用源码；`public/`：网站直接使用的本地模型、字体、纹理和详情页。
- `src/morningstar/integration.css`：球体首屏留白、图形标志与字标、底部探索入口。
- `public/brand/`：NEBULUXE 网站展示素材；设计说明见 [BRAND.md](BRAND.md)，素材使用范围见 [BRAND-NOTICE.md](BRAND-NOTICE.md)。完整品牌包在 [nebuluxe-brand-kit](https://github.com/ExoticSkywing/nebuluxe-brand-kit) 独立维护，已从本项目移出；本项目继续忽略 `brand-kit/`。
- `scripts/nebuluxe-home.mjs`：可重复执行的品牌及首页结构定制。
- `site/`：原 Morningstar 镜像输入；不是当前应用的启动目录。
- `scripts/README.md`：生成命令、检查脚本及历史镜像工具的用途。
- `RECON/behfar-fusion/`：临时项目迁入的源码证据、截图、基线和验证记录。
- `RECON/morningstar-baseline-docs/`：迁移前仓库文档。

## 修改与重新生成

### 背景音乐

`public/audio/nebuluxe-bgm.m4a`（AAC，优先用于 iOS）与 MP3 后备为用户提供音乐的前 210 秒（3 分半），循环播放；1.5 秒淡入、末尾 3 秒淡出，响度约 -22 LUFS。播放地址带版本参数以更新旧音频缓存。保留源文件的 CHINA LAK 署名，音乐不属于 NEBULUXE 品牌素材权利声明的范围。

首页加载后尝试有声播放；受浏览器限制时，在首次真实触摸结束、点击或按键中同步重试。iOS Safari 无法保证在用户完全不交互时有声自动播放，静音自动播放也不能保证稍后自动解除静音。右上角可手动开启／关闭，记住关闭选择；切换后台会暂停，返回后尝试接续。该播放器贯穿 hero0 和 hero1，不随滚动重新创建。

播放器位于 `src/components/BackgroundMusic.jsx`，播放与恢复逻辑位于 `src/audio/backgroundMusic.js`。运行 `npm run test:audio` 检查自动播放被拒、触摸解锁、请求竞争、静音记忆及后台恢复。iOS 最终验收需真机 Safari，桌面手机尺寸预览不能替代。

iOS 音频测试使用 Vite 开发／预览服务或支持字节范围请求的静态托管，服务端应返回正确的音频 MIME 与 `206 Partial Content`；已验证 Vite 的 AAC 范围请求。可选 `server.py` 使用 Python 标准静态服务，不作为 iOS 音频验收入口。

### 页面与品牌

情绪板位于 `#projects`，素材来自 `public/emotionboard/`。`scripts/emotionboard-content.mjs` 维护素材、文案和构建时模板，`src/morningstar/emotionboard.css` 维护错落排版。三个动态片段使用静音 H.264 视频及 WebP 封面；只在进入视野时加载／播放，离屏、后台暂停，减少动态效果偏好下默认展示封面，播放按钮仍可手动开启。它与探索星群的模式独立。

更换原始视频后运行 `npm run media:emotionboard`（需要 FFmpeg）生成 `loops/` 和 `posters/`。原文件保留，网站仅播放去除音轨的版本，避免与 BGM 混音。

探索星群模块由根目录 `site.config.js` 配置：

```js
export default {
  portfolioMode: 'nebuluxe', // 'nebuluxe' 或 'origin'
};
```

`nebuluxe` 为默认模式，居中显示“探索星群”、原短句和搜索输入框，移除分类、更多、重置及作品列表，不加载 CMS 筛选脚本。该模式暂不接入作品数据或搜索结果服务；输入不会提交到外部。`origin` 恢复完整作品和原有搜索／分类筛选，标题同样标识为“探索星群”。这项配置只控制该模块，其他页面和品牌保持当前设计。

开发时修改配置会重启 Vite 并刷新页面；发布时重新运行 `npm run build`。模式在构建时应用于原始生成模板，重新导入镜像也不会覆盖配置。运行 `npm run test:portfolio` 检查两种模式及原生滚动节点的保留。

日常修改 React 源码、`src/morningstar/runtime.js` 和 `integration.css`。首页 DOM 定制写入 `scripts/nebuluxe-home.mjs`，不要直接修改生成的 `src/morningstar/content.html` 或 `source.css`。

更新镜像输入后，运行 `npm run import:morningstar`，再运行 `npm run check` 和 `npm run build`。导入会覆盖 `public/morningstar/`、`public/vendor/` 及上述生成文件，并重新应用 NEBULUXE 标志、留白布局和禁用社交链接。`site/` 是原始镜像输入，`public/` 是当前可部署副本，两者有意同时保留。

更新艺术字轮廓后运行 `npm run brand:generate`。完整品牌包在独立私有仓库维护，网站的 `brand-kit/` 和品牌 ZIP 均被忽略。

每次改动过渡、渲染或菜单后，浏览器复核桌面及手机的正反向过渡、`#hero1` 直达、菜单开关、品牌返回、搜索和一个详情页。[NOTES.md](NOTES.md) 记录当前维护要点；[FUSION.md](FUSION.md)、[MIGRATION.md](MIGRATION.md)、`CLONE_*.md` 和 `TEARDOWN.md` 保留历史实现、来源与验证背景。
