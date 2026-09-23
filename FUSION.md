> 2026-09-23：当前正式项目为 nebuluxe，已迁入仓库根目录。hero1 中央文案已移除，新的品牌及布局说明见 MIGRATION.md。以下保留融合实现及当时的验证记录。

# Hero0 → Hero1 integration

## Architecture and evidence

This is a native DOM integration. React owns hero0 and the shared journey state; Morningstar retains its Webflow interactions and original private Three r138 renderer. The two Three versions do not share scene objects.

| State | Owner | Mapping |
| --- | --- | --- |
| Shared scroll and dimensions | useHeroJourney / one GSAP ScrollTrigger | Original hero0 progress = scroll / 572vh. |
| Smoke crossfade | App | Smoothstep from handoff 0.05 to 0.92; opacity only. |
| Morningstar title reveal | useHeroJourney | Smoothstep over handoff 0.38–0.94, with 22px upward settle. |
| Morningstar chrome reveal | useHeroJourney | Smoothstep over handoff 0.65–1.0. |
| Morningstar own scroll | morningstarBridge | (scroll − 692vh) / (hero1 height − viewport height), clamped. |
| Native WebGL timeline | MorningStarScene.m and a | Native scroll reader m.j reads the bridge; native damping stays intact. |
| Native Webflow page scroll | Source PAGE_SCROLL handler | Uses the same chapter-relative bridge; element-in-view animations retain original DOM geometry. |
| Menu | Native click interactions and scene.toggleMenu | Keyboard Enter/Space/Escape route through the same click owner. |

Before hero1's real top arrives, its existing sticky hero container is fixed at viewport top. At 692vh it returns to its original sticky positioning at the same visual position. Its source section remains 200vh tall, so releasing it does not change document height.

All source models, fonts, textures, local detail pages and scripts are bundled in public/. There is no iframe and no request to the old local server at runtime.

## Runtime repairs

1. Keep the invisible Morningstar preloader node: Webflow action list a-75 uses it as a timeline carrier. Removing it leaves subsequent titles at opacity zero. Its display is suppressed with a scoped rule so the user sees only hero0's loader.
2. Dispatch native IX2_PAGE_UPDATE after Webflow.ready. The scripts are mounted asynchronously by React; a cached production document may already have passed readystatechange.
3. Guard the source's empty Elrond model URL, which otherwise tries to parse homepage HTML as a GLTF file.
4. Add a pause guard and stored animation-frame handle to the source IIFE; preload/render once, pause behind hero0, resume during the handoff. Hero0's main RAF and both R3F overlays pause after its exit.
5. Observe the actual Morningstar viewport size. Its source resize handler can run before the shared viewport CSS unit updates; ResizeObserver keeps the GPU buffer and camera aspect synchronized afterward.
6. Local pagination snapshots contain the same 30 cards. Keep that complete available set, remove the duplicate-load path, retain the original CMS filter. Local detail links are rewritten under /morningstar/.
7. Source menu /#products maps to the actual #projects section. Navigation to hero0/hero1 stays within the combined page.
8. Vite performs a full reload when imported Morningstar files change, since replacing Webflow-owned nodes through a partial React refresh would retain stale listeners.

Native runtime evidence: RECON/behfar-fusion/morningstar-runtime.pretty.js, especially em around line 18495, MorningStarScene resize/tick around 18558, and toggleMenu around 18824. Webflow evidence: RECON/behfar-fusion/morningstar-webflow.pretty.js PAGE_FINISH around 4719, event e-583 around 17260, and a-75 around 21067. These are readable copies of the delivered source, not new implementations.

The importer makes exact single-occurrence replacements and fails if the upstream byte contracts change. Run from the project root. The repository-local site/ directory is read-only input to this importer.

## Validation boundaries

Browser checks cover Chromium desktop, tablet and phone viewport sizes, both directions through the handoff, menu controls, main chapter navigation, portfolio search and a representative local detail page. Real iOS/Android hardware and frame-rate profiling were not performed. The original randomized WebGL scenes do not produce pixel-identical frames on every load.

The original source payload remains large; Vite's bundle-size advisory and the two independently bundled Three versions' warning are expected. They are not shader/runtime failures. See CLONE_REPORT.md and RECON/behfar-fusion/fusion-checks.json for observed results.
