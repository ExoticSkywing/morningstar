#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import playwright from '/root/.local/share/camofox-browser/node_modules/playwright-core/index.js';
const { chromium } = playwright;

const url = process.argv[2] || 'http://127.0.0.1:44116/';
const out = path.resolve(process.argv[3] || 'RECON/editorial-visual');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/root/.hermes/cache/ms-playwright/chromium-1234/chrome-linux64/chrome', headless: true });
const specs = [
  { label: 'desktop-1280x720', width: 1280, height: 720 },
  { label: 'desktop-1440x900', width: 1440, height: 900 },
  { label: 'mobile-390x844', width: 390, height: 844 },
];
const results = [];

for (const spec of specs) {
  const context = await browser.newContext({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [], pageErrors = [], badResponses = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() }); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2200);

  const initial = await page.evaluate(() => {
    const rect = selector => { const element = document.querySelector(selector); if (!element) return null; const box = element.getBoundingClientRect(); const style = getComputedStyle(element); return { text: element.textContent.trim(), x: box.x, y: box.y, width: box.width, height: box.height, display: style.display, opacity: style.opacity, filter: style.filter, font: style.font, lineHeight: style.lineHeight, zIndex: style.zIndex }; };
    const hero = document.querySelector('#hero');
    return {
      title: document.title,
      lang: document.documentElement.lang,
      ready: document.readyState,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      canvasCount: document.querySelectorAll('canvas').length,
      heroTitle: rect('.hero_h1'),
      poem: rect('.hero_poem'),
      token: rect('.paragraph.is--hero'),
      explore: rect('.btn_wrap.is--h'),
      about: rect('#about h2'),
      portfolio: rect('#portfolio h3'),
      projects: rect('#projects h3'),
      mission: rect('#mission h3'),
      events: rect('#events h3'),
      newsletter: rect('.cta_heading'),
      heroText: hero?.innerText || '',
      externalRuntimeRefs: [...document.querySelectorAll('script[src], link[href]')].map(el => el.src || el.href).filter(value => value.startsWith('http://') || value.startsWith('https://')).filter(value => new URL(value).origin !== location.origin),
    };
  });
  await page.screenshot({ path: path.join(out, `${spec.label}-initial.png`), fullPage: false });
  const startBefore = await page.evaluate(() => scrollY);
  await page.locator('.btn_wrap.is--h').click();
  await page.waitForTimeout(700);
  const afterExplore = await page.evaluate(() => ({ scrollY, hash: location.hash }));
  await page.screenshot({ path: path.join(out, `${spec.label}-about.png`), fullPage: false });
  await page.evaluate(() => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * .5)));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `${spec.label}-middle.png`), fullPage: false });
  const changed = await page.evaluate(() => ({ scrollY, scrollWidth: document.documentElement.scrollWidth, innerWidth }));
  results.push({ spec, initial, startBefore, afterExplore, changed, consoleErrors, pageErrors, badResponses });
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'editorial-visual.json'), JSON.stringify({ url, results }, null, 2));
console.log(JSON.stringify(results.map(({ spec, initial, afterExplore, changed, consoleErrors, pageErrors, badResponses }) => ({
  viewport: `${spec.width}x${spec.height}`,
  title: initial.title,
  lang: initial.lang,
  canvas: initial.canvasCount,
  overflow: changed.scrollWidth > changed.innerWidth,
  exploreHash: afterExplore.hash,
  exploreScrollY: afterExplore.scrollY,
  consoleErrors: consoleErrors.length,
  pageErrors: pageErrors.length,
  badResponses: badResponses.length,
})), null, 2));
