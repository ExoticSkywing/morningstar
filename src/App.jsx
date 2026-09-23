import { useCallback, useEffect, useRef, useState } from 'react';
import Universe from './scenes/Universe';
import Preloader from './components/Preloader';
import SceneNav from './components/SceneNav';
import ScrollIdleHint from './components/ScrollIdleHint';
import useHeroJourney from './hooks/useHeroJourney';
import Morningstar from './morningstar/Morningstar';
import { HERO1_START_VH } from './utils/scenes/universeTiming';
import { smoothstep } from './utils/math';
import styles from './App.module.css';

export default function App() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [introRevealing, setIntroRevealing] = useState(false);
  const [showOverlays, setShowOverlays] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  const [morningstarReady, setMorningstarReady] = useState(false);
  const { universeWrapperRef, orbitProgress, handoff, hero0Active } = useHeroJourney(morningstarReady);
  const morningstarLoaded = useCallback(() => setMorningstarReady(true), []);
  const restoredHash = useRef(false);
  const reveal = useCallback(() => setIntroRevealing(true), []);
  const complete = useCallback(() => setPreloaderDone(true), []);

  useEffect(() => {
    document.fonts.load('1em Audiowide')
      .catch(() => {})
      .finally(() => setFontReady(true));
  }, []);

  useEffect(() => {
    if (!preloaderDone) return;
    const timer = setTimeout(() => setShowOverlays(true), 150);
    return () => clearTimeout(timer);
  }, [preloaderDone]);

  const navigate = useCallback(key => {
    const target = key === 'universe' ? 0
      : key === 'morningstar' ? HERO1_START_VH * window.innerHeight / 100
        : document.getElementById('portfolio')?.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: target || 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, []);

  useEffect(() => {
    if (!morningstarReady || !preloaderDone || restoredHash.current) return;
    restoredHash.current = true;
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* Ignore malformed URL escapes. */ }
    if (id && id !== 'hero0') document.getElementById(id)?.scrollIntoView();
  }, [morningstarReady, preloaderDone]);

  const hero0Opacity = 1 - smoothstep(0.05, 0.92, handoff);
  const hero0ChromeOpacity = 1 - smoothstep(0, 0.3, handoff);

  return (
    <main className={styles.app} aria-label="NEBULUXE — 穿过星云的旅程">
      <h1 className="sr-only">NEBULUXE</h1>
      <p className="sr-only">Scroll to travel through the galaxies and into the clouds.</p>
      {!preloaderDone && <Preloader onReveal={reveal} onComplete={complete} />}
      <section id="hero0" className={styles.hero0Track} style={{ height: `${HERO1_START_VH}vh` }} aria-label="My Universe — 启程">
        <div className={styles.hero0Stage} style={{ opacity: hero0Opacity, visibility: hero0Active ? 'visible' : 'hidden' }}>
          <Universe wrapperRef={universeWrapperRef} orbitProgress={orbitProgress}
            rendering={hero0Active} showOverlays={showOverlays}
            introRevealing={introRevealing} embedded />
        </div>
      </section>
      <Morningstar onReady={morningstarLoaded} />
      <div className={styles.hero0Chrome} style={{ opacity: hero0ChromeOpacity }} inert={handoff > 0.3}>
        <SceneNav visible={showOverlays && fontReady} activeSection="universe" onNavigate={navigate}
          sections={[
            { key: 'universe', label: 'NEBULUXE', icon: '/brand/nebuluxe-mark.svg', wordmark: '/brand/nebuluxe-wordmark.svg' },
            { key: 'morningstar', label: 'Beyond' },
            { key: 'portfolio', label: 'Explore' },
          ]} />
        {preloaderDone && <ScrollIdleHint />}
      </div>
    </main>
  );
}
