import fs from 'node:fs/promises';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import postcss from 'postcss';
import { customizeHome } from './nebuluxe-home.mjs';

const root = process.cwd();
const source = path.resolve(process.argv[2] || path.join(root, 'site'));
// Keep the generated project self-contained; importing never writes to source.
await fs.mkdir(path.join(root, 'public/morningstar'), { recursive: true });
for (const entry of await fs.readdir(source, { withFileTypes: true })) {
  const destination = entry.name === 'vendor'
    ? path.join(root, 'public/vendor')
    : path.join(root, 'public/morningstar', entry.name);
  await fs.cp(path.join(source, entry.name), destination, { recursive: true });
}
const html = await fs.readFile(path.join(source, 'index.html'), 'utf8');
const document = parse(html);
const all = [];
function walk(node) { all.push(node); node.childNodes?.forEach(walk); }
walk(document);
const get = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const set = (node, name, value) => {
  const attr = node.attrs?.find(a => a.name === name);
  if (attr) attr.value = value;
  else (node.attrs ||= []).push({ name, value });
};
const hasClass = (node, name) => (get(node, 'class') || '').split(/\s+/).includes(name);
const remove = node => {
  const siblings = node.parentNode?.childNodes;
  const index = siblings?.indexOf(node) ?? -1;
  if (index >= 0) siblings.splice(index, 1);
};
const wrap = (node, className) => {
  const parent = node.parentNode;
  const wrapper = { nodeName: 'div', tagName: 'div', namespaceURI: node.namespaceURI,
    attrs: [{ name: 'class', value: className }], childNodes: [node], parentNode: parent };
  parent.childNodes.splice(parent.childNodes.indexOf(node), 1, wrapper);
  node.parentNode = wrapper;
};

const styles = all.filter(n => n.tagName === 'style').map(n => n.childNodes.map(c => c.value || '').join(''));
const stylesheet = all.find(n => n.tagName === 'link' && get(n, 'rel') === 'stylesheet');
const baseCss = await fs.readFile(path.join(source, get(stylesheet, 'href')), 'utf8');
const localCss = await fs.readFile(path.join(source, 'clone-runtime.css'), 'utf8');

function scopeCss(css, label) {
  // Two invalid declarations / an extra brace exist in the source's embed.
  const cleaned = css.replace(/^text-rendering: optimizeLegibility;\s*-webkit-font-smoothing: antialiased;/m, '')
    .replace('-webkit-line-clamp: 6;\n    -webkit-box-orient: vertical;}\n}', '-webkit-line-clamp: 6;\n    -webkit-box-orient: vertical;}');
  const tree = postcss.parse(cleaned, { from: label });
  tree.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.map(selector => {
      const s = selector.trim();
      if (/^html\b/.test(s)) {
        if (/^html(?:\s*$|[.#:\[])/.test(s)) return s.replace(/^html/, '#hero1').replace(/\bbody\b/g, '');
      }
      if (/^:root/.test(s)) return s.replace(/^:root/, '#hero1');
      if (/^body\b/.test(s)) return s.replace(/^body/, '#hero1');
      if (/^:lang\(zh-CN\)/.test(s)) return s.replace(/^:lang\(zh-CN\)\s*(?:body\b)?/, '#hero1 ');
      return `#hero1 ${s}`;
    });
  });
  return tree.toString();
}

await fs.mkdir(path.join(root, 'src/morningstar'), { recursive: true });
await fs.writeFile('src/morningstar/source.css', [scopeCss(baseCss, 'webflow.css'), ...styles.map((s,i) => scopeCss(s, `embed-${i}`)), scopeCss(localCss, 'clone-runtime.css')].join('\n'));

customizeHome(all, { get, set, hasClass, remove });
for (const node of all) {
  // Webflow's page-load timeline uses the preloader as its group carrier.
  // Keep that hidden node so the timeline can advance to the hero reveal.
  if (['script', 'style'].includes(node.tagName) || hasClass(node, 'page-trans-wrap')) {
    remove(node);
    continue;
  }
  // The mirror's pagination snapshots repeat the same 30 cards. All available
  // homepage cards are already present; loading snapshots duplicates them.
  if (hasClass(node, 'pag_load--wrap')) { remove(node); continue; }
  if (node.attrs) node.attrs = node.attrs.filter(attr => !attr.name.startsWith('fs-cmsload-'));
  if (hasClass(node, 'port_list')) set(node, 'class', get(node, 'class').replace('port_list-click', ''));
  if (node.tagName === 'a') {
    const href = get(node, 'href') || '';
    if (href === '/') set(node, 'href', '/#hero0');
    else if (href === '/#products') set(node, 'href', '/#projects');
    else if (/^\/(portfolio|products|brand|test)(\/|$)/.test(href)) set(node, 'href', `/morningstar${href.replace(/\/$/, '')}/index.html`);
    else if (/^\?180cd5c2_page=/.test(href)) set(node, 'href', `/morningstar/_queries/180cd5c2_page-${href.split('=')[1]}.html`);
  }
  if (hasClass(node, 'nav') || hasClass(node, 'hud_display') || hasClass(node, 'cursor')) wrap(node, 'ms-chrome-reveal');
  if (hasClass(node, 'hero_content--wrap')) wrap(node, 'ms-title-reveal');
  if (hasClass(node, 'hero_h1')) { node.tagName = 'h2'; node.nodeName = 'h2'; }
}
const body = all.find(n => n.tagName === 'body');
await fs.writeFile('src/morningstar/content.html', serialize(body));

const runtimePath = 'vendor/cdn.jsdelivr.net/gh/morningstar-ventures/msv-website@main/offbrand-morningstar.iife.007b.js';
let runtime = await fs.readFile(path.join(source, runtimePath), 'utf8');
function replaceOnce(text, from, to) {
  if (text.split(from).length !== 2) throw new Error(`Source contract changed: ${from}`);
  return text.replace(from, to);
}
runtime = replaceOnce(runtime,
  'null!=this.s&&"elrond"!==this.s||(this.r=new Zf(l),this.ah.add(this.r))',
  'l&&l.modelUrl&&(null!=this.s&&"elrond"!==this.s||(this.r=new Zf(l),this.ah.add(this.r)))');
runtime = replaceOnce(runtime,
  'e(){var t,e,n;window.requestAnimationFrame(this.e);const i=this.ax.getDelta()',
  'e(){if(this.__paused)return;var t,e,n;this.__frame=window.requestAnimationFrame(this.e);const i=this.ax.getDelta()');
await fs.writeFile(path.join(root, 'public', runtimePath), runtime);

const webflowPath = 'vendor/cdn.prod.website-files.com/6218b09ec1cd76c58f838521/js/webflow.819d3f41.90322e919fc2b125.js';
let webflow = await fs.readFile(path.join(source, webflowPath), 'utf8');
webflow = replaceOnce(webflow, 'l=i/(d-o);l=n?1-l:l', 'l=window.__morningstarBridge?window.__morningstarBridge.progress:i/(d-o);l=n?1-l:l');
await fs.writeFile(path.join(root, 'public', webflowPath), webflow);

// Preserve the mirror's standalone detail pages, with links back to this site.
async function rewritePages(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await rewritePages(file);
    else if (entry.name.endsWith('.html')) {
      let page = await fs.readFile(file, 'utf8');
      page = page.replaceAll('href="/clone-runtime.css"', 'href="/morningstar/clone-runtime.css"')
        .replaceAll('src="/clone-runtime.js"', 'src="/morningstar/clone-runtime.js"')
        .replaceAll('href="/"', 'href="/#hero1"')
        .replace(/href="\/(portfolio|products)\/([^"/#?]+)\/?"/g, 'href="/morningstar/$1/$2/index.html"')
        .replace(/href="\/#([^" ]+)"/g, 'href="/#$1"');
      await fs.writeFile(file, page);
    }
  }
}
await rewritePages(path.join(root, 'public/morningstar'));
console.log('Imported Morningstar DOM, scoped CSS and native runtime. Source project unchanged.');
