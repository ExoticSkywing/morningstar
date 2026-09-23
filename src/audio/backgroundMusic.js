export const BGM_SOURCES = [
  { src: '/audio/nebuluxe-bgm.m4a', type: 'audio/mp4' },
  { src: '/audio/nebuluxe-bgm.mp3', type: 'audio/mpeg' },
];

const PREFERENCE_KEY = 'nebuluxe:bgm';

// Keep one native audio element throughout the journey. In particular, Safari
// must receive play() directly inside a real gesture, before any await/timer.
export function createBackgroundMusic(audio, { document, window, onChange }) {
  let enabled = true;
  try { enabled = window.localStorage.getItem(PREFERENCE_KEY) !== 'off'; } catch { /* Private/storage-restricted browsing. */ }
  let state = { enabled, status: enabled ? 'loading' : 'off' };
  let revision = 0;
  let disposed = false;
  const cleanup = [];
  const publish = status => {
    if (disposed) return;
    state = { enabled, status };
    onChange(state);
  };
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  };
  const remember = () => {
    try { window.localStorage.setItem(PREFERENCE_KEY, enabled ? 'on' : 'off'); } catch { /* Playback still works without storage. */ }
  };
  const play = () => {
    if (disposed || !enabled || document.hidden || (!audio.paused && state.status === 'playing')) return;
    const attempt = ++revision;
    publish('loading');
    const failed = error => {
      if (disposed || attempt !== revision || !enabled || document.hidden) return;
      publish(error?.name === 'NotSupportedError' ? 'error' : 'blocked');
    };
    try {
      // Never gate this behind an older pending play promise: the next touchend
      // may be the first event that grants iOS a valid playback activation.
      Promise.resolve(audio.play()).catch(failed);
    } catch (error) { failed(error); }
  };
  const pause = () => {
    revision++;
    audio.pause();
    publish(enabled ? 'paused' : 'off');
  };

  listen(audio, 'playing', () => {
    if (!enabled || document.hidden) { pause(); return; }
    publish('playing');
  });
  listen(audio, 'pause', () => publish(enabled ? 'paused' : 'off'));
  listen(audio, 'error', () => { revision++; publish('error'); });

  const activate = event => {
    if (event.repeat || event.target?.closest?.('[data-bgm-control]') || state.status === 'error') return;
    play();
  };
  // Touchend is necessary on iOS; pointerdown alone is not sufficient.
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) {
    listen(document, type, activate, { capture: true, passive: true });
  }
  listen(document, 'visibilitychange', () => { if (document.hidden) pause(); else play(); });
  listen(window, 'pagehide', pause);
  listen(window, 'pageshow', play);

  publish(state.status);
  play();

  return {
    toggle() {
      if (disposed) return;
      if (enabled && ['playing', 'loading'].includes(state.status)) {
        enabled = false;
        remember();
        pause();
      } else {
        enabled = true;
        remember();
        if (audio.error || state.status === 'error') audio.load();
        play();
      }
    },
    dispose() {
      disposed = true;
      revision++;
      cleanup.forEach(remove => remove());
      audio.pause();
    },
  };
}
