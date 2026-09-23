> 2026-09-23：当前正式项目为 nebuluxe，已迁入仓库根目录。hero1 中央文案已移除，新的品牌及布局说明见 MIGRATION.md。以下保留融合实现及当时的验证记录。

# Current architecture

The active project now combines hero0 with Morningstar as hero1. See [FUSION.md](FUSION.md) for the current scroll, handoff and runtime ownership. The historical standalone hero0 teardown follows; its old 30vh fade-to-black endpoint and navigation no longer apply to the combined site.

---

# Hero runtime and source evidence

All rendering claims below are **SOURCE**, verified against the original repository at `7ccd2df359f844cc824e092ad65319b1ab1404a1`. The live site uses `main.78592f45.js` and was inspected at 1440×900, 768×1024 and 390×844.

## Rendering

| Layer | Evidence | Implementation |
|---|---|---|
| Star field | `src/utils/scenes/stars.js:24` | 2,000 additive points; radial glow texture; independent ignition delays and twinkle phases. |
| Galaxies | `src/utils/scenes/galaxies.js:5` | Ten galaxies, 10,000 points each; five spiral arms; original colors and positions. |
| Nebulae | `src/utils/scenes/nebulas.js:38` | Layered additive sprites, generated radial textures, embedded stars and drifting rotations. |
| Smoke | `src/utils/scenes/smoke.js:3` | 40 textured sprites in a 0.4–3.2 radius shell. Normal blending; original `public/png/smoke.png`; colors `#c48cd6` and `#0c0616`. This is textured smoke, not a replacement fluid shader. |
| Shooting star / text | `src/components/ShootingStarIntro.jsx:29`, `src/utils/shaders/shootingStar.js:1` | 160,000 trail-particle slots; original GLSL reveal, dissolve, gather and puff shaders. Name/subtitles are canvas textures rendered through WebGL. |
| Orbit captions | `src/components/CaptionGravity.jsx:27` | Individual glyph textures spiral and shrink toward the origin with staggered progress. |
| Camera | `src/scenes/Universe.jsx:14` | Original approach → half orbit → cubic plunge; radius shrinks to 0.08×; eased pointer look target. |
| Loader | `src/components/Preloader.jsx:4` | 1,700ms comet orbit, 250ms hold, 1,100ms iris reveal. |

## State ownership

| State | Owner | Consumers |
|---|---|---|
| Loader / reveal | `Preloader`, completed callbacks in `App` | Camera introduction and overlay visibility. |
| Scroll progress | `useHeroJourney` | Camera, captions, subtitles, smoke, blur, scale and blackout. |
| Camera damping / pointer look | `Universe` requestAnimationFrame loop | Main WebGL canvas. |
| Glyph/trail timing | Original React Three Fiber components and GSAP intro | Two transparent overlay canvases. |
| Navigation/menu | `SceneNav` | Native buttons/links, mobile expanded state, Escape focus return. |

## Deliberate cutoff

Upstream's Universe wrapper is 672vh; its camera travels over `672vh − 100vh = 572vh`. The next Projects scene begins entering the viewport as the old sticky section releases. In the reference screenshot at scrollY≈5410 / 900px viewport, the smoke is already almost black while the next star field is visible below it.

The extraction keeps the original 572vh camera distance, then pins the hero for the original 30vh smoke fade. `HERO_HEIGHT_VH = 702` produces a maximum scroll of 602vh. Exit progress drives `1 − smoothstep(0,1,p)` smoke opacity and linear blackout. The last frame is dark `#030308`; no next scene exists. Reverse scrolling restores the same camera, smoke and text owners.

Unlike the full source, no separate ScrollTrigger writes the atmosphere: all three CSS variables derive from the same hero scroll state. The scale 1→1.35 and blur 0→7px are unchanged. This removes competing lifecycle owners and preserves the same numeric envelope before the cutoff.

## Source preservation / differences

Galaxy, nebula, smoke, star generation, GLSL shaders, loader and text rendering are copied directly. The subset uses Vite instead of Create React App. Fonts and smoke are local. The application imports no Projects, constellations, contact page, analytics, cookie manager or remote runtime resource.

Changed integration: a single hero scroll hook, final sticky extension, navigation destinations for omitted sections, visually hidden heading, inaccessible hidden menus disabled with `inert`, and main-scene GPU disposal on unmount.

Random positions, sprite rotation and elapsed time are deliberately retained. Screenshot comparison assesses composition and behavior; it does not claim deterministic pixel equality.
