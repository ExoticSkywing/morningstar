import { mkdir, writeFile } from 'node:fs/promises';
import { WORDMARK_GLYPHS, WORDMARK_WIDTH, WORDMARK_HEIGHT, WORDMARK_SKEW } from '../src/brand/nebuluxeWordmark.js';

const output = new URL('../public/brand/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [suffix, color] of [['', '#f2f1ee'], ['-dark', '#111216']]) {
  const paths = WORDMARK_GLYPHS.map(glyph => `    <path transform="translate(${glyph.x})" d="${glyph.path}"/>`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}" fill="${color}">
  <title>NEBULUXE</title>
  <g transform="translate(8 4) skewX(${WORDMARK_SKEW})" fill-rule="evenodd">
${paths}
  </g>
</svg>\n`;
  await writeFile(new URL(`nebuluxe-wordmark${suffix}.svg`, output), svg);
}
console.log('Generated NEBULUXE outlined wordmarks.');
