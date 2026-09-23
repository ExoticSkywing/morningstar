# Hero verification

Verified 2026-09-23 in the Codex Chromium browser. Reference: https://behfar.dev/.

## Result

The hero reproduces the original loading iris, galaxy composition, title reveal, subtitle particles, scroll-driven orbit, bottom captions, mouse parallax and textured smoke. It ends on a dark frame after smoke; the next star field and constellation scene are absent.

## Checks

| Check | Result / evidence |
|---|---|
| Production build | `npm run build` passes. Vite 7.3.6; main JS 1,202.41 kB / gzip 344.60 kB. |
| Production browser | Built site opened at `127.0.0.1:4173`; first scene and loader handoff render correctly; zero console errors. `RECON/screenshots/production-1440.png`. |
| Dependency audit | 0 vulnerabilities; `RECON/npm-audit.json`. |
| Original rendering source | SHA-256 matches for all 11 checked render modules/assets; `RECON/source-integrity.json`. |
| Desktop 1440×900 | Initial layout, subtitle dissolve, orbit caption, smoke, final dark frame and reverse smoke verified. |
| Tablet 768×1024 | Initial composition and terminal cutoff verified. |
| Phone 390×844 | Initial composition, menu, smoke, terminal cutoff and return to top verified. |
| Horizontal overflow | None at all three tested widths. |
| Loader handoff | Loader removed; three scene/overlay canvases remain; navigation becomes usable. |
| Endpoint | Blackout = 1, blur = 0, scale = 1; no Projects/Constellation DOM. |
| Reverse journey | Endpoint → smoke → My Universe → scrollY 0; blackout and blur reset to 0. |
| Mobile keyboard/menu | Menu opens, Escape closes and returns focus to its trigger; closed dropdown is `inert`. |
| Console | No JavaScript errors or WebGL shader errors. Two `THREE.Clock` deprecation warnings per mount originate in React Three Fiber; the live reference has the same warnings. |
| Tracking/assets | No analytics or cookie scripts in application source. Fonts and smoke served locally. |

State observations are stored in `RECON/runtime-checks.json`. Screenshots are in `RECON/screenshots/`: `original-*`, `clone-1440`, `clone-768`, `clone-390`, `clone-subtitle`, `clone-orbit`, `clone-smoke`, `clone-end`, and reverse/mobile checkpoints.

## Fidelity / scope

| Dimension | Score | Basis |
|---|---|---|
| Source evidence | 5/5 | Public author source, matching shader/asset hashes, live screenshots. |
| Structure within requested hero | 5/5 | Original component layers and sequence retained; later scenes deliberately excluded. |
| Visual | 4.5/5 | Same rendering, fonts and textures; randomized particles/rotation prevent pixel-identical captures. |
| Motion/interaction | 4.5/5 | Original camera, particle timing and smoke retained; final sticky exit intentionally extended to avoid revealing the next scene. |
| Responsive | 4/5 | Three Chromium viewport sizes pass; no real iOS/Android device test. |
| Function within scope | 5/5 | Local build/run, scroll journey and menu verified; out-of-scope links retain useful destinations. |
| Content replacement | N/A | User requested original content, not rebranding. |

## Known differences and limits

- Projects opens the original portfolio; Contact Me uses the original author's email. No out-of-scope sections were rebuilt.
- Final smoke stays pinned during its fade, instead of exposing the following section from underneath.
- Runtime rendering is randomized as in the reference. No deterministic frame/pixel match is claimed.
- The original 3D payload remains large; Vite reports its advisory chunk-size warning. The baseline was preserved rather than reducing particle counts or changing the effect.
- Upstream declares no project license; attribution and local-study context are in `NOTES.md`. Font OFL licenses are retained.
