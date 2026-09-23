import { loadPlaywright, launchChromium } from '/root/.hermes/profiles/frontend/skills/frontend/web-clone/web-clone/scripts/lib/playwright-loader.mjs';

const playwright = loadPlaywright();
const browser = await launchChromium(playwright.chromium);
const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
const page = await context.newPage();
await page.goto(process.env.MORNINGSTAR_URL || 'http://127.0.0.1:44116', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const result = await page.evaluate(() => {
  const headline = document.querySelector('.hero_h1');
  const poem = document.querySelector('.hero_poem');
  const headlineRect = headline.getBoundingClientRect();
  const poemRect = poem.getBoundingClientRect();
  const lineHeight = parseFloat(getComputedStyle(headline).lineHeight);
  return {
    title: headline.textContent,
    titleRect: { x: headlineRect.x, y: headlineRect.y, w: headlineRect.width, h: headlineRect.height },
    titleLines: Math.round(headlineRect.height / lineHeight),
    poem: poem.getAttribute('aria-label'),
    poemRect: { x: poemRect.x, y: poemRect.y, w: poemRect.width, h: poemRect.height },
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    canvas: document.querySelectorAll('canvas').length,
    visibleText: [...document.querySelectorAll('h1,h2,h3,p')]
      .filter((node) => { const rect = node.getBoundingClientRect(); return rect.width && rect.height; })
      .slice(0, 12)
      .map((node) => node.textContent.trim()),
  };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
