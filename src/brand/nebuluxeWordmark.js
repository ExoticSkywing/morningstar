// Original outlined lettering, shared by the SVG assets and the WebGL title.
// Keeping the contours here avoids font-loading differences between scenes.
export const WORDMARK_WIDTH = 418;
export const WORDMARK_HEIGHT = 48;
export const WORDMARK_SKEW = -8;

const n = 'M0 40V0H7L34 27V0H42V40H35L8 13V40Z';
const e = 'M0 0H42L35 7H0ZM0 16H34L27 23H0ZM0 33H42L35 40H0Z';
const b = 'M0 0H33L41 8V16L36 20L42 26V32L34 40H0ZM8 7V16H30L33 13V10L30 7ZM8 23V33H31L34 30V26L31 23Z';
const u = 'M0 0H8V29L12 33H30L34 29V0H42V33L35 40H7L0 33Z';
const l = 'M0 0H8V33H39L32 40H0Z';
const x = 'M0 0H10L21 14L32 0H42L26 20L42 40H32L21 26L10 40H0L16 20Z';

export const WORDMARK_GLYPHS = [
  { x: 0, path: n }, { x: 54, path: e },
  { x: 106, path: b }, { x: 160, path: u },
  { x: 214, path: l }, { x: 260, path: u },
  { x: 314, path: x }, { x: 366, path: e },
];

export function drawNebuluxeWordmark(ctx, x, y, width, color = '#ffffff') {
  const scale = width / WORDMARK_WIDTH;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(8, 4);
  ctx.transform(1, 0, Math.tan(WORDMARK_SKEW * Math.PI / 180), 1, 0, 0);
  ctx.fillStyle = color;
  for (const glyph of WORDMARK_GLYPHS) {
    ctx.save();
    ctx.translate(glyph.x, 0);
    ctx.fill(new Path2D(glyph.path), 'evenodd');
    ctx.restore();
  }
  ctx.restore();
}
