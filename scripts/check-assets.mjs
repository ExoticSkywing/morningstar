import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { BGM_SOURCES } from '../src/audio/backgroundMusic.js';
import siteConfig from '../site.config.js';
import { configurePortfolio } from './portfolio-content.mjs';
import { configureEmotionboard } from './emotionboard-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(root, 'public');
const checked = new Set();
const failures = new Set();
let pages = 0;

async function checkUrl(value, base, source) {
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return;
  const url = new URL(value, `https://local.invalid${base}`);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') return; // Vite owns the application entry.
  if (checked.has(pathname)) return;
  checked.add(pathname);
  let file = path.join(publicRoot, pathname);
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    assert.ok((await stat(file)).isFile());
  } catch {
    failures.add(`${source}: missing ${pathname}`);
  }
}

async function checkHtml(file, base, transform = html => html) {
  const html = transform(await readFile(file, 'utf8'));
  const nodes = [];
  function visit(node) { nodes.push(node); node.childNodes?.forEach(visit); }
  visit(parse(html));
  const source = path.relative(root, file);
  for (const node of nodes) {
    const rel = node.attrs?.find(attr => attr.name === 'rel')?.value;
    if (node.tagName === 'link' && ['preconnect', 'dns-prefetch'].includes(rel)) continue;
    for (const { name, value } of node.attrs || []) {
      if (['src', 'poster', 'data-src'].includes(name) || (name === 'href' && ['a', 'link'].includes(node.tagName))) {
        // The root entry's module source is handled by the Vite build.
        if (value.startsWith('/src/')) continue;
        await checkUrl(value, base, source);
      } else if (name === 'srcset' && !value.startsWith('data:')) {
        for (const candidate of value.split(',')) await checkUrl(candidate.trim().split(/\s+/)[0], base, source);
      }
    }
  }
  pages++;
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) {
      await checkHtml(file, `/${path.relative(publicRoot, file).replaceAll('\\', '/')}`);
    } else if (entry.name.endsWith('.css')) {
      await checkCss(file, `/${path.relative(publicRoot, file).replaceAll('\\', '/')}`);
    }
  }
}

async function checkCss(file, base) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*['"]?([^'"\)]+?)['"]?\s*\)/g)) {
    await checkUrl(match[1], base, path.relative(root, file));
  }
}

await checkHtml(path.join(root, 'index.html'), '/');
await checkHtml(path.join(root, 'src/morningstar/content.html'), '/');
await checkHtml(path.join(root, 'src/morningstar/content.html'), '/', html => configureEmotionboard(configurePortfolio(html, siteConfig.portfolioMode)));
await checkCss(path.join(root, 'src/morningstar/source.css'), '/');
await walk(publicRoot);
for (const { src } of BGM_SOURCES) await checkUrl(src, '/', 'BGM');
if (failures.size) {
  console.error([...failures].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages} HTML documents and ${checked.size} local asset/route references; no missing files.`);
}
