import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseFragment } from 'parse5';
import { configurePortfolio } from './portfolio-content.mjs';

const source = readFileSync(new URL('../src/morningstar/content.html', import.meta.url), 'utf8');
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, value) => (attr(node, 'class') || '').split(/\s+/).includes(value);
function nodes(node) { return [node, ...(node.childNodes || []).flatMap(nodes)]; }
function inspect(html) {
  const all = nodes(parseFragment(html));
  const section = all.find(node => attr(node, 'id') === 'portfolio');
  return { all, section, portfolio: nodes(section) };
}
const text = node => nodes(node).filter(n => n.nodeName === '#text').map(n => n.value).join('').trim();

test('nebuluxe contains only the heading, copy and accessible search; no filters or works', () => {
  const { portfolio, section } = inspect(configurePortfolio(source, 'nebuluxe'));
  assert.equal(attr(section, 'aria-labelledby'), 'starfield-heading');
  assert.equal(text(portfolio.find(n => attr(n, 'id') === 'starfield-heading')), '探索星群');
  assert.equal(portfolio.filter(n => n.tagName === 'input').length, 1);
  assert.ok(portfolio.some(n => attr(n, 'role') === 'search'));
  assert.ok(portfolio.some(n => n.tagName === 'label' && attr(n, 'for') === 'nebuluxe-star-query'));
  assert.equal(portfolio.filter(n => ['button', 'form'].includes(n.tagName) || hasClass(n, 'port_item')).length, 0);
  assert.equal(portfolio.filter(n => n.attrs?.some(a => a.name.startsWith('fs-cmsfilter'))).length, 0);
  assert.ok(portfolio.some(n => attr(n, 'id') === 's_id--1'), 'keep the native scroll target');
});

test('origin restores the source cards and filters while identifying the module as 探索星群', () => {
  const original = inspect(source).portfolio;
  const { portfolio, all } = inspect(configurePortfolio(source, 'origin'));
  const cardCount = group => group.filter(n => hasClass(n, 'port_item')).length;
  const filterCount = group => group.filter(n => attr(n, 'type') === 'checkbox').length;
  assert.ok(cardCount(original) > 0);
  assert.ok(filterCount(original) > 0);
  assert.equal(cardCount(portfolio), cardCount(original));
  assert.equal(filterCount(portfolio), filterCount(original));
  assert.equal(text(portfolio.find(n => attr(n, 'id') === 'starfield-heading')), '探索星群');
  assert.ok(portfolio.some(n => attr(n, 'fs-cmsfilter-element') === 'filters'));
  assert.ok(all.some(n => attr(n, 'id') === 'viewport'), 'keep the native renderer mount');
});

test('invalid modes fail explicitly instead of silently publishing the wrong layout', () => {
  assert.throws(() => configurePortfolio(source, 'nebulux'), /portfolioMode/);
  assert.throws(() => configurePortfolio('<div></div>', 'nebuluxe'), /portfolio container/);
});
