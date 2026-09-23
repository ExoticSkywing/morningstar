// Videos stay silent, load only near the viewport and pause out of sight.
export function initializeEmotionboard(root) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  const pieces = [...root.querySelectorAll('[data-emotion-video]')].map(video => {
    const figure = video.closest('.emotion-piece');
    const button = figure.querySelector('[data-emotion-toggle]');
    const state = { video, visible: false, userPaused: false, userStarted: false };
    const listen = (target, event, fn) => {
      target.addEventListener(event, fn);
      cleanups.push(() => target.removeEventListener(event, fn));
    };
    const render = () => {
      const playing = !video.paused;
      button.dataset.playing = String(playing);
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', `${playing ? '暂停' : '播放'}：${figure.dataset.emotionTitle}`);
    };
    const load = () => {
      const source = video.querySelector('source');
      if (source.hasAttribute('src')) return;
      source.src = source.dataset.src;
      video.load();
    };
    state.sync = () => {
      const allowed = state.visible && !document.hidden && !state.userPaused && (!reduceMotion.matches || state.userStarted);
      if (!allowed) { video.pause(); return; }
      load();
      video.muted = true;
      if (video.paused) video.play().catch(render);
    };
    listen(button, 'click', () => {
      state.userPaused = !video.paused;
      state.userStarted = !state.userPaused;
      state.sync();
    });
    listen(video, 'playing', () => { state.sync(); render(); });
    listen(video, 'pause', render);
    listen(video, 'error', render);
    render();
    return state;
  });
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = pieces.find(piece => piece.video === entry.target);
      state.visible = entry.isIntersecting;
      state.sync();
    }
  }, { threshold: 0.08 });
  pieces.forEach(({ video }) => observer.observe(video));
  const sync = () => pieces.forEach(piece => piece.sync());
  document.addEventListener('visibilitychange', sync);
  reduceMotion.addEventListener('change', sync);
  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
    reduceMotion.removeEventListener('change', sync);
    cleanups.forEach(cleanup => cleanup());
    pieces.forEach(({ video }) => video.pause());
  };
}
