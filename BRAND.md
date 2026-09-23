# NEBULUXE · 自由星云

**NEBULUXE = nebula + luxe。中文寓意：浪漫宇宙。品牌内涵：浪漫、美好、自由。**

图形以舒展的四角星芒和一条未闭合的星云弧线组成。斜向星芒延续最初参考标志的轻盈感，重新绘制的曲线、比例和开放轨迹形成 NEBULUXE 自己的轮廓。星芒表达美好，星云表达浪漫，向外伸展的尖端和未闭合弧线表达自由。

视觉采用暖白与深墨色，通过精细的曲线和留白表达 luxe。标志本身不依赖渐变、发光或动效。

## 资产

完整素材及导出源文件独立保存在 `D:\nebuluxe\NEBULUXE-Brand-Kit`，远程仓库为 [ExoticSkywing/nebuluxe-brand-kit](https://github.com/ExoticSkywing/nebuluxe-brand-kit)。打开独立目录中的 `START-HERE.html` 即可离线浏览。

网站中的完整品牌包及 ZIP 副本已移出到项目外的可恢复备份目录 `D:\nebuluxe\brand-kit-backups\morningstar-copy-20260923`。本项目保留 `brand-kit/` 的 Git 忽略规则，避免未来误提交完整素材包。

网站继续保留运行需要的 SVG 和字形数据；这些已部署的文件可被网站访问者读取。独立私有仓库用于管理完整源稿、导出文件和版本记录，不用于隐藏页面中展示的标志。品牌素材采用独立的保留权利声明，见 [BRAND-NOTICE.md](BRAND-NOTICE.md)。

- `public/brand/nebuluxe-mark.svg`：暖白图形，透明背景，纯矢量路径。
- `public/brand/nebuluxe-mark-dark.svg`：深墨色图形，用于浅色背景。
- `public/brand/nebuluxe-wordmark.svg`、`nebuluxe-wordmark-dark.svg`：暖白与深墨色的全大写赛博字标，纯矢量轮廓，不依赖字体。
- `public/nebuluxe.svg`：深色底浏览器图标。
- `public/brand/preview.html`：品牌展示与尺寸对照，可访问 `/brand/preview.html`。

## 页面使用

品牌名称统一使用全大写 **NEBULUXE**，不加句点。字形为定制的宽体几何轮廓，略微前倾，E 使用三段断笔，B / U 使用切角，呼应图形的斜向星芒。

hero1 导航使用 56px 图形与 172px 宽字标；移动端分别为 48px 和 138px 宽。hero0 导航和粒子标题采用同一套字形，页面中央仍保留原有画面空间。

字形源数据位于 `src/brand/nebuluxeWordmark.js`，Canvas 标题直接绘制相同路径。修改轮廓后运行 `npm run brand:generate` 重新生成 SVG。

常规界面建议图形不小于 24px；16px 仅用于紧凑图标场景。四周建议留出至少图形宽度的 1/4 空间，不拉伸、不旋转、不添加描边或投影。

首页标志通过 `scripts/nebuluxe-home.mjs` 注入；重新运行 `npm run import:morningstar` 会保留这套品牌设计。
