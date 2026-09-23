import { useCallback, useEffect, useState } from 'react';
import Universe from './scenes/Universe';
import Preloader from './components/Preloader';
import SceneNav from './components/SceneNav';
import ScrollIdleHint from './components/ScrollIdleHint';
import useHeroJourney from './hooks/useHeroJourney';
import styles from './App.module.css';

export default function App() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [introRevealing, setIntroRevealing] = useState(false);
  const [showOverlays, setShowOverlays] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  const { universeWrapperRef, orbitProgress, smokeExitProgress } = useHeroJourney();
  const reveal = useCallback(() => setIntroRevealing(true), []);
  const complete = useCallback(() => setPreloaderDone(true), []);

  useEffect(() => {
    Promise.all([document.fonts.load('1em Monoton'), document.fonts.load('1em Audiowide')])
      .catch(() => {})
      .finally(() => setFontReady(true));
  }, []);

  useEffect(() => {
    if (!preloaderDone) return;
    const timer = setTimeout(() => setShowOverlays(true), 150);
    return () => clearTimeout(timer);
  }, [preloaderDone]);

  return (
    <main className={styles.app} aria-label="Behfar Behzad interactive hero">
      <h1 className="sr-only">Behfar Behzad</h1>
      <p className="sr-only">A software developer who loves to build. Scroll to travel through the galaxies and into the clouds.</p>
      {!preloaderDone && <Preloader onReveal={reveal} onComplete={complete} />}
      <SceneNav
        visible={showOverlays && fontReady}
        activeSection="universe"
        onNavigate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
      <Universe
        wrapperRef={universeWrapperRef}
        orbitProgress={orbitProgress}
        smokeExitProgress={smokeExitProgress}
        rendering
        showOverlays={showOverlays}
        introRevealing={introRevealing}
      />
      {preloaderDone && <ScrollIdleHint />}
    </main>
  );
}
