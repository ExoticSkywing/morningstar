> 2026-09-23：当前正式项目为 nebuluxe，已迁入仓库根目录。hero1 中央文案已移除，新的品牌及布局说明见 MIGRATION.md。以下保留融合实现及当时的验证记录。

# Combined site verification

Verified on 2026-09-23 in the Codex Chromium browser. This report describes the active hero0 + hero1 integration. The earlier standalone hero0 report is archived in RECON/behfar-fusion/hero0-baseline/CLONE_REPORT.md.

| Check | Observed result |
| --- | --- |
| Production build | npm run build passes. Main JS 1,344.77 kB / gzip 377.75 kB; CSS 100.49 kB / gzip 20.42 kB. Vite emits its expected chunk-size advisory. |
| Single page | Both scenes share one DOM, one document scroll axis, four canvas elements and zero iframes. |
| Desktop 1440×900 | hero1 top at scrollY 6228; smoke/title/chrome overlap, original Morningstar sticky hero, return to hero0 and continued About section verified. |
| Tablet 768×1024 | hero1 top near 7086; title, sphere, navigation and subsequent layout visible; canvas height synchronized to 1024. |
| Phone 390×844 | Production build: hero1 top near 5840; title and sphere visible; chapter menu, Morningstar menu, Escape and reverse handoff verified. |
| Horizontal overflow | None at the three tested viewport sizes. |
| Handoff geometry | Incoming hero container remains at viewport top while changing from fixed to sticky. Title rises by at most 22px while fading in. No second loading screen. |
| Reverse and round trip | hero1 → purple smoke → hero0 → top; hero0 opacity and interaction restore, Morningstar hides and pauses behind it. |
| Page-load lifecycle | Cached production load reveals Morningstar heading and nav to opacity 1 / blur 0. Native IX2_PAGE_UPDATE resolves late script initialization. |
| Main navigation | Direct #hero1, My Universe / Morningstar chapter buttons, logo return, Start Exploring and About → Portfolio validated. |
| Menu | Original 3D / Webflow menu opens; Escape closes and returns focus to menu-toggle on desktop and phone. |
| Portfolio | Search for MultiversX produces one matching card. Local detail page opens and renders its Chinese description. Original 30 homepage cards are retained without repeated pagination copies. |
| Local routes | All 35 main-page local content links have matching files; RECON/behfar-fusion/fusion-link-checks.json. |
| Resize | Render canvas matches viewport container after resize; no stale GPU buffer height. |
| Runtime errors | No JavaScript errors or WebGL shader errors in the checked final pages. Native Three duplicate-instance and R3F Clock deprecation warnings remain. |
| Source project | D:/repo/morningstar git status remains clean. |

Screenshots: RECON/behfar-fusion/screenshots/fusion-*.png. Runtime DOM observations: RECON/behfar-fusion/fusion-checks.json (includes explicitly labeled development checkpoints as well as final production checks).

## Scope and limitations

The user's requested transition is a new composition built from the two original runtimes. Original Behfar camera, galaxies, particle text and smoke remain; the previous standalone fade-to-black ending is replaced by the Morningstar reveal. No Behfar constellation section is mounted.

Responsive verification uses Chromium viewport emulation, not physical iOS/Android devices. No hardware frame-rate target is claimed. The author scenes use randomized particles, rotations and elapsed-time effects, so screenshots vary over time. Existing Morningstar external destinations remain external; newsletter behavior is a local demonstration.

| Dimension | Assessment | Evidence |
| --- | --- | --- |
| Structure | 5/5 | Native shared DOM and chapter-relative scroll ownership. |
| Visual preservation | 4.5/5 | Original shaders, models, textures and source content; intentional new handoff. |
| Transition and interaction | 4.5/5 | Production forward / reverse checks, menu, chapter navigation and search. |
| Responsive | 4/5 | Three Chromium sizes pass; physical device verification remains outside this run. |
| Content replacement | N/A | Existing content preserved. |

Final asset audit: 46 homepage media URLs checked. Three images absent from the source mirror were recovered from their original CDN URLs and saved locally in public/ and dist/. All three return HTTP 200 as image/png from the combined preview. Provenance: RECON/behfar-fusion/recovered-morningstar-assets.json.
