# 脚本用途

从仓库根目录运行日常命令：

| 命令 | 作用 |
| --- | --- |
| `npm run import:morningstar` | 读取 `site/`，同步 `public/`，生成首页 DOM 和作用域 CSS，应用原生运行时补丁及 NEBULUXE 定制。 |
| `npm run brand:generate` | 从共用字形数据生成网站暖白、深墨色艺术字 SVG。 |
| `npm run check` | 检查首页、详情页及样式引用的本地资源与链接是否存在。 |
| `npm run test:audio` | 检查 BGM 自动播放受限后的恢复、触摸触发、静音记忆及生命周期；使用 Node.js 标准测试工具。 |
| `python scripts/test_server.py` | 验证可选 Python 预览服务的路由和路径边界；仅使用标准库。 |

`nebuluxe-home.mjs` 由导入脚本调用，维护首页标志、留白布局和社交链接状态。

以下文件保留为原 Morningstar 镜像的历史工具，不参与当前 Vite 启动、构建或检查流程：

- `mirror.py`、`localize_zh.py`、`update_home_editorial.py`：抓取、翻译与镜像文案处理；输入/输出是 `site/`。
- `audit_zh_*.py`、`build_zh_protected_manifest.py`：原镜像中文审校。
- `qa.mjs`、`hero-layout-probe.mjs`、`editorial-visual-probe.mjs`、`glb-probe.mjs`：原 Linux 环境的浏览器取证脚本，包含当时的绝对运行时路径，不能直接作为 Windows 下的当前测试入口。

浏览器回归范围见根目录 README.md；原取证结果保存在 `RECON/`。
