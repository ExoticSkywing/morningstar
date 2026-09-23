# behfar.dev — Hero study

Source: https://behfar.dev/ · https://github.com/Behfar90/behfar-dev

Author: Behfar Behzad. Upstream commit: `7ccd2df359f844cc824e092ad65319b1ab1404a1`.

## Scope

L5 / faithful source-based reconstruction. Keep the opening loader, galaxy scene, shooting-star name reveal, dissolving subtitles, orbit captions, pointer parallax, and smoke plunge. End as the smoke fades to dark, before the following night-sky/constellation scene. No Projects or Contact scene is mounted.

Preserve the original 572vh camera travel. A final 30vh keeps the scene pinned while smoke fades, ending at 702vh total page height. The final scene cannot continue to the constellation background. Scrolling back reverses the journey.

## Run

```powershell
cd D:\nebuluxe\websites\clone\behfar.dev-hero
npm install
npm run dev
```

Open http://127.0.0.1:5173. Production: `npm run build`; preview: `npm run preview`.

## Provenance

The original repository declares no project license. This is an attributed local study, not a grant of public redistribution rights. Fonts retain their original OFL notices in `public/fonts/`. Analytics and cookie-consent code are omitted.

## Editing map

- Name and subtitle: `src/components/ShootingStarIntro.jsx`.
- Orbit captions and camera: `src/scenes/Universe.jsx`.
- Galaxy particles / nebulae / smoke: `src/utils/scenes/`.
- Shader source: `src/utils/shaders/shootingStar.js`.
- Scroll boundaries: `src/utils/scenes/universeTiming.js`, `src/hooks/useHeroJourney.js`.
- Original reference: `RECON/upstream/`; screenshots: `RECON/screenshots/`.

The top navigation keeps the original appearance: My Universe returns to the top; Projects opens the original portfolio; Contact Me is the original author's email link. This avoids mounting out-of-scope scenes.

## Validation

Browser and build results are recorded in `CLONE_REPORT.md` when verification is complete. Randomized particles and elapsed-time smoke motion mean screenshots are not expected to match pixel for pixel even between two loads of the original.
