import { useEffect, useRef, useState } from 'react';
import { HERO_SCROLL_VH, SMOKE_EXIT_VH } from '../utils/scenes/universeTiming';
import { clamp01 } from '../utils/math';

// One scroll owner supplies the camera, smoke and final blackout.
// The original 572vh travel stays intact; only the following scene is cut.
export default function useHeroJourney() {
  const universeWrapperRef = useRef(null);
  const [journey, setJourney] = useState({ orbitProgress: 0, smokeExitProgress: 0 });

  useEffect(() => {
    const update = () => {
      const wrapper = universeWrapperRef.current;
      if (!wrapper) return;
      const vh = window.innerHeight / 100;
      const distance = window.scrollY - wrapper.offsetTop;
      const atEnd = window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 1;
      setJourney({
        orbitProgress: clamp01(distance / (HERO_SCROLL_VH * vh)),
        smokeExitProgress: atEnd ? 1 : clamp01((distance - HERO_SCROLL_VH * vh) / (SMOKE_EXIT_VH * vh)),
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { universeWrapperRef, ...journey };
}
