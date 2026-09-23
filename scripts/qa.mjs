#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import playwright from '/root/.local/share/camofox-browser/node_modules/playwright-core/index.js';
const { chromium } = playwright;

const url = process.argv[2] || 'http://127.0.0.1:44116/';
const out = path.resolve(process.argv[3] || 'RECON/qa');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/root/.hermes/cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  headless: true,
});
const results = [];

for (const spec of [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 900 },
]) {
  const context = await browser.newContext({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [], pageErrors = [], failedRequests = [], badResponses = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('requestfailed', r => failedRequests.push({ url: r.url(), error: r.failure()?.errorText || '' }));
  page.on('response', r => { if (r.status() >= 400) badResponses.push({ url: r.url(), status: r.status() }); });

  let gotoError = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    gotoError = e.message;
  }

  if (page.isClosed()) {
    results.push({ spec, gotoError: `${gotoError} [page closed]`, consoleErrors, pageErrors, failedRequests, badResponses });
    continue;
  }
  await page.waitForTimeout(2500).catch(() => {});
  if (page.isClosed()) {
    results.push({ spec, gotoError: `${gotoError} [page closed after load]`, consoleErrors, pageErrors, failedRequests, badResponses });
    continue;
  }

  const initial = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang,
    ready: document.readyState,
    scrollHeight: document.documentElement.scrollHeight,
    bodyTextChars: document.body?.innerText.length || 0,
    h1: Array.from(document.querySelectorAll('h1')).map(e => e.innerText.trim()).filter(Boolean),
    canvasCount: document.querySelectorAll('canvas').length,
    canvas: Array.from(document.querySelectorAll('canvas')).map(c => ({
      width: c.width,
      height: c.height,
      css: { width: Math.round(c.getBoundingClientRect().width), height: Math.round(c.getBoundingClientRect().height) },
      engine: c.getAttribute('data-engine') || '',
    })),
    formCount: document.forms.length,
    externalRuntimeRefs: Array.from(document.querySelectorAll('script[src],link[href]'))
      .map(e => e.src || e.href)
      .filter(x => /^https?:\/\//.test(x) && new URL(x).origin !== location.origin),
    fonts: document.fonts ? Array.from(document.fonts).map(f => ({ family: f.family, weight: f.weight, status: f.status })) : [],
  }));
  await page.screenshot({ path: path.join(out, `${spec.label}-initial.png`) });

  await page.evaluate(() => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * .5)));
  await page.waitForTimeout(600);
  const middleY = await page.evaluate(() => Math.round(scrollY));
  await page.screenshot({ path: path.join(out, `${spec.label}-middle.png`) });

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  const bottomY = await page.evaluate(() => Math.round(scrollY));
  await page.screenshot({ path: path.join(out, `${spec.label}-bottom.png`) });

  results.push({ spec, gotoError, initial, middleY, bottomY, consoleErrors, pageErrors, failedRequests, badResponses });
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'qa.json'), JSON.stringify({ url, capturedAt: new Date().toISOString(), results }, null, 2));
console.log(path.join(out, 'qa.json'));
console.log(JSON.stringify(results.map(r => ({
  viewport: r.spec.label,
  title: r.initial?.title || '',
  canvas: r.initial?.canvasCount ?? -1,
  height: r.initial?.scrollHeight ?? -1,
  consoleErrors: r.consoleErrors.length,
  pageErrors: r.pageErrors.length,
  failedRequests: r.failedRequests.length,
  badResponses: r.badResponses.length,
  externalRuntimeRefs: r.initial?.externalRuntimeRefs.length ?? -1,
  gotoError: r.gotoError,
})), null, 2));
