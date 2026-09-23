import { parseFragment, serialize } from 'parse5';

const get = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
const hasClass = (node, name) => (get(node, 'class') || '').split(/\s+/).includes(name);
function walk(node, visit) { visit(node); node.childNodes?.forEach(child => walk(child, visit)); }
function find(node, predicate) {
  let match;
  walk(node, candidate => { if (!match && predicate(candidate)) match = candidate; });
  return match;
}
function set(node, name, value) {
  const attr = node.attrs.find(item => item.name === name);
  if (attr) attr.value = value;
  else node.attrs.push({ name, value });
}
function replaceChildren(node, html) {
  node.childNodes = parseFragment(html).childNodes;
  node.childNodes.forEach(child => { child.parentNode = node; });
}

// Applied at build time, before Webflow can bind to the imported DOM.
// The original generated mirror remains intact for the 'origin' mode.
export function configurePortfolio(html, mode) {
  if (!['origin', 'nebuluxe'].includes(mode)) {
    throw new Error('site.config.js: portfolioMode must be "origin" or "nebuluxe".');
  }
  const document = parseFragment(html);
  const section = find(document, node => get(node, 'id') === 'portfolio');
  const container = section && find(section, node => hasClass(node, 'is--port'));
  if (!container) throw new Error('Morningstar content is missing the portfolio container.');
  set(section, 'aria-labelledby', 'starfield-heading');

  if (mode === 'nebuluxe') {
    replaceChildren(container, `
      <div class="nebuluxe-star-search">
        <h2 id="starfield-heading">探索星群</h2>
        <p>每一颗星，都在改写远方</p>
        <div class="nebuluxe-search" role="search" aria-label="探索星群">
          <label class="sr-only" for="nebuluxe-star-query">搜索星群</label>
          <input id="nebuluxe-star-query" class="p_filter--search w-input" type="search"
            name="q" placeholder="搜索星群" maxlength="256" autocomplete="off">
        </div>
      </div>`);
  } else {
    const heading = find(container, node => hasClass(node, 'body_heading'));
    if (!heading) throw new Error('Morningstar content is missing the portfolio heading.');
    set(heading, 'id', 'starfield-heading');
    replaceChildren(heading, '探索星群');
    const tagline = parseFragment('<p class="portfolio-tagline">每一颗星，都在改写远方</p>').childNodes[0];
    tagline.parentNode = heading.parentNode;
    heading.parentNode.childNodes.push(tagline);
  }

  walk(document, node => {
    if (node.tagName !== 'a' || !['#portfolio', '/#portfolio'].includes(get(node, 'href'))) return;
    walk(node, child => {
      if (child.nodeName === '#text' && child.value.trim() === '投资组合') child.value = '探索星群';
    });
  });
  return serialize(document);
}
