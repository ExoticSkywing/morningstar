import { parseFragment } from 'parse5';

// Run on the source DOM before wrapping it for the shared journey.
// Keeping branding here makes a fresh Morningstar import reproducible.
export function customizeHome(nodes, { get, set, hasClass, remove }) {
  const replaceContent = (node, html) => {
    node.childNodes = parseFragment(html).childNodes;
    node.childNodes.forEach(child => { child.parentNode = node; });
  };
  for (const node of nodes) {
    if (hasClass(node, 'hero_h1') || hasClass(node, 'hero_text--wrap')) {
      remove(node);
    }
    if (hasClass(node, 'brand_wrap') || hasClass(node, 'f_navlink')) {
      set(node, 'title', 'NEBULUXE');
      set(node, 'aria-label', 'NEBULUXE — 返回开头');
      if (hasClass(node, 'f_navlink')) set(node, 'href', '/#hero0');
      set(node, 'class', `${get(node, 'class')} nebuluxe-brand`);
      replaceContent(node, '<img class="nebuluxe-mark" src="/brand/nebuluxe-mark.svg" alt="" width="56" height="56" decoding="async"><img class="nebuluxe-wordmark" src="/brand/nebuluxe-wordmark.svg" alt="" width="418" height="48" decoding="async">');
    }
    if (hasClass(node, 'soc_link--1')) {
      const href = get(node, 'href') || '';
      const platform = [
        ['twitter.com', 'X (Twitter)'], ['t.me', 'Telegram'],
        ['instagram.com', 'Instagram'], ['linkedin.com', 'LinkedIn'],
        ['medium.com', 'Medium'],
      ].find(([domain]) => href.includes(domain))?.[1] || '社交平台';
      // An empty href still reloads the page; omit it while URLs are unset.
      node.attrs = node.attrs.filter(attr => !['href', 'target', 'rel'].includes(attr.name));
      set(node, 'role', 'link');
      set(node, 'aria-disabled', 'true');
      set(node, 'aria-label', `${platform}（链接暂未开放）`);
      set(node, 'tabindex', '-1');
      set(node, 'class', `${get(node, 'class')} nebuluxe-social-disabled`);
    }
    if (hasClass(node, 'nav_soc--list')) remove(node);
    if (hasClass(node, 'hero_content--wrap')) {
      set(node, 'class', `${get(node, 'class')} nebuluxe-explore`);
    }
    if (hasClass(node, 'btn_wrap') && hasClass(node, 'is--h')) {
      set(node, 'aria-label', '继续探索 NEBULUXE');
    }
    if (hasClass(node, 'btn_txt') && hasClass(node, 'is--h')) {
      replaceContent(node, '继续探索 <span class="nebuluxe-explore-arrow" aria-hidden="true">↓</span>');
    }
    if (hasClass(node, 'prog_link')) set(node, 'href', '#hero0');
  }
}
