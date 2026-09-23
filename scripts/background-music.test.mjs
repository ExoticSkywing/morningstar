import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackgroundMusic } from '../src/audio/backgroundMusic.js';

class AudioStub extends EventTarget {
  paused = true;
  calls = 0;
  error = null;
  behavior = () => { this.start(); return Promise.resolve(); };
  play() { this.calls++; return this.behavior(); }
  start() { this.paused = false; this.dispatchEvent(new Event('playing')); }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  load() { this.error = null; }
}

function setup({ off = false, behavior, restrictedStorage = false } = {}) {
  const audio = new AudioStub();
  if (behavior) audio.behavior = behavior;
  const document = new EventTarget();
  document.hidden = false;
  const window = new EventTarget();
  const preferences = new Map(off ? [['nebuluxe:bgm', 'off']] : []);
  window.localStorage = {
    getItem(key) { if (restrictedStorage) throw Error('Storage unavailable'); return preferences.get(key); },
    setItem(key, value) { if (restrictedStorage) throw Error('Storage unavailable'); preferences.set(key, value); },
  };
  let state;
  const controller = createBackgroundMusic(audio, { document, window, onChange: next => { state = next; } });
  return { audio, document, window, preferences, controller, state: () => state };
}

const blocked = () => Promise.reject(new DOMException('Gesture required', 'NotAllowedError'));

test('tries audible playback on mount and retries synchronously on touchend', async () => {
  const app = setup({ behavior: blocked });
  await Promise.resolve();
  assert.equal(app.state().status, 'blocked');
  app.audio.behavior = () => { app.audio.start(); return Promise.resolve(); };
  app.document.dispatchEvent(new Event('touchend'));
  assert.equal(app.audio.calls, 2);
  assert.equal(app.state().status, 'playing');
  app.controller.dispose();
});

test('a pending initial request never suppresses a later iOS gesture', async () => {
  let rejectInitial;
  const app = setup({ behavior: () => new Promise((_, reject) => { rejectInitial = reject; }) });
  app.audio.behavior = () => { app.audio.start(); return Promise.resolve(); };
  app.document.dispatchEvent(new Event('touchend'));
  assert.equal(app.audio.calls, 2);
  rejectInitial(new DOMException('Old request', 'NotAllowedError'));
  await Promise.resolve();
  assert.equal(app.state().status, 'playing');
  app.controller.dispose();
});

test('turning sound off persists and prevents gesture/foreground restart', () => {
  const app = setup();
  app.controller.toggle();
  app.document.dispatchEvent(new Event('click'));
  app.window.dispatchEvent(new Event('pageshow'));
  assert.equal(app.audio.calls, 1);
  assert.equal(app.state().status, 'off');
  assert.equal(app.preferences.get('nebuluxe:bgm'), 'off');
  app.controller.dispose();
  const nextVisit = setup({ off: true });
  assert.equal(nextVisit.audio.calls, 0);
  nextVisit.document.dispatchEvent(new Event('touchend'));
  assert.equal(nextVisit.audio.calls, 0);
  nextVisit.controller.toggle();
  assert.equal(nextVisit.state().status, 'playing');
  nextVisit.controller.dispose();
});

test('sound control gestures are handled once by the button', () => {
  const app = setup({ off: true });
  const buttonEvent = new Event('touchend');
  Object.defineProperty(buttonEvent, 'target', { value: { closest: () => ({}) } });
  app.document.dispatchEvent(buttonEvent);
  assert.equal(app.audio.calls, 0);
  app.controller.toggle();
  assert.equal(app.audio.calls, 1);
  app.controller.dispose();
});

test('backgrounding pauses; foregrounding resumes only the enabled track', () => {
  const app = setup();
  app.document.hidden = true;
  app.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(app.audio.paused, true);
  app.document.dispatchEvent(new Event('touchend'));
  assert.equal(app.audio.calls, 1);
  app.document.hidden = false;
  app.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(app.state().status, 'playing');
  app.controller.dispose();
  app.document.dispatchEvent(new Event('touchend'));
  app.window.dispatchEvent(new Event('pageshow'));
  assert.equal(app.audio.calls, 2);
  assert.equal(app.audio.paused, true);
});

test('restricted storage and interrupted playback remain recoverable', () => {
  const app = setup({ restrictedStorage: true });
  app.audio.pause();
  assert.equal(app.state().status, 'paused');
  app.document.dispatchEvent(new Event('pointerup'));
  assert.equal(app.state().status, 'playing');
  app.controller.toggle();
  assert.equal(app.state().status, 'off');
  app.controller.dispose();
});

test('media failures require explicit retry rather than every page gesture', () => {
  const app = setup();
  app.audio.error = { code: 3 };
  app.audio.dispatchEvent(new Event('error'));
  app.document.dispatchEvent(new Event('touchend'));
  assert.equal(app.audio.calls, 1);
  app.controller.toggle();
  assert.equal(app.audio.error, null);
  assert.equal(app.state().status, 'playing');
  app.controller.dispose();
});
