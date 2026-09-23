import { parseFragment, serialize } from 'parse5';

// Keep the supplied originals alongside the silent, web-ready video copies.
export const emotionboard = [
  { id: 'moonlight', title: '月光织物', note: '柔软，也有自己的形状', file: 'photo_2026-09-23_20-36-34.jpg', width: 1440, height: 1920, alt: '灰色光影中，身着编织服饰、银白长发的侧身人像' },
  { id: 'solitone', title: '秩序的回声', note: '在留白里，听见节奏', file: 'Solitone-Prop-Trading-Company-Logo-Brand-Identity.mp4', posterTime: 3, alt: 'Solitone 黑白字体与几何标志的动态视觉实验' },
  { id: 'winter', title: '极境实验', note: '冷冽之中，生长出异想', file: '09-is-a-concept-winter-performance-brand-built-aro.mp4', posterTime: 2, alt: '09 冬季运动概念视觉，深色画面中的荧光装置与字体' },
  { id: 'starflow', title: '星流之间', note: '让时间从身旁经过', file: 'photo_2026-09-23_20-37-46.jpg', width: 1080, height: 1347, alt: '漫天光线如星流划过雪地，两位滑雪者置身其中' },
  { id: 'freedom', title: '不设边界', note: '沿着自己的方向，自由生长', file: 'photo_2026-09-23_20-37-50.jpg', width: 1080, height: 1347, alt: '滑雪者张开双臂，在开阔雪地留下蜿蜒轨迹' },
  { id: 'matchcut', title: '光的形状', note: '每次转场，都是另一个可能', file: 'The-match-cut-Scenes-transform-into-one-another-th.mp4', posterTime: 2, alt: '深色空间中，玻璃、光线与几何形态交替变化' },
];

export const boardMedia = item => item.file.endsWith('.mp4')
  ? { src: `/emotionboard/loops/${item.id}.mp4`, poster: `/emotionboard/posters/${item.id}.webp` }
  : { src: `/emotionboard/${item.file}` };

function figure(item, index) {
  const { src, poster } = boardMedia(item);
  const media = poster
    ? `<video data-emotion-video muted loop playsinline preload="none" poster="${poster}" aria-label="${item.alt}" width="720" height="1280"><source data-src="${src}" type="video/mp4"></video>
       <button class="emotion-play" type="button" aria-label="播放：${item.title}" aria-pressed="false" data-emotion-toggle>
         <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path class="emotion-play-glyph" d="m9 5 10 7-10 7Z" fill="currentColor"/><path class="emotion-pause-glyph" d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="3"/></svg>
       </button>`
    : `<img src="${src}" alt="${item.alt}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async">`;
  return `<figure class="emotion-piece" data-emotion-title="${item.title}">
    <div class="emotion-frame">${media}</div>
    <figcaption><span class="emotion-index" aria-hidden="true">${String(index + 1).padStart(2, '0')} <span>✦</span></span>
      <div><h3>${item.title}</h3><p>${item.note}</p></div>
    </figcaption>
  </figure>`;
}

export function configureEmotionboard(html) {
  const document = parseFragment(html);
  const nodes = [];
  function walk(node) { nodes.push(node); node.childNodes?.forEach(walk); }
  walk(document);
  const get = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
  const section = nodes.find(node => get(node, 'id') === 'projects');
  const container = section?.childNodes.find(node => get(node, 'class')?.split(/\s+/).includes('container'));
  if (!container) throw new Error('Morningstar content is missing the projects container.');
  section.attrs.push({ name: 'aria-labelledby', value: 'emotionboard-heading' });
  container.attrs.find(attr => attr.name === 'class').value = 'container emotion-board';
  container.childNodes = parseFragment(`
    <header class="emotion-heading">
      <div><span class="emotion-eyebrow">NEBULUXE / DRIFT</span><h2 id="emotionboard-heading">游离</h2><p>把喜欢的瞬间，留在自己的宇宙。</p></div>
      <div class="emotion-seal" aria-hidden="true"><img src="/brand/nebuluxe-mark.svg" width="40" height="40" alt=""><span>浪漫 · 美好 · 自由</span></div>
    </header>
    <div class="emotion-grid">${[0, 2, 4].map(start => `<div class="emotion-column">${emotionboard.slice(start, start + 2).map((item, index) => figure(item, start + index)).join('')}</div>`).join('')}</div>
    <div class="emotion-footnote"><span>不定义风格，只收藏心动。</span><span aria-hidden="true">✦</span></div>
  `).childNodes;
  container.childNodes.forEach(child => { child.parentNode = container; });
  // Keep the native section / scroll target; only its inner content changes.
  for (const node of nodes.filter(node => node.tagName === 'a' && ['#projects', '/#projects'].includes(get(node, 'href')))) {
    const rename = child => {
      if (child.nodeName === '#text' && ['产品', '项目'].includes(child.value.trim())) child.value = '游离';
      child.childNodes?.forEach(rename);
    };
    rename(node);
  }
  return serialize(document);
}
