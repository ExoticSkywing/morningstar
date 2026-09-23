import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HERO_SCROLL_VH, HERO1_START_VH, HANDOFF_VH } from '../utils/scenes/universeTiming';
import { clamp01, smoothstep } from '../utils/math';
import { morningstarBridge } from '../morningstar/runtime';

gsap.registerPlugin(ScrollTrigger);

export default function useHeroJourney(ready) {
  const universeWrapperRef = useRef(null);
  const [journey, setJourney] = useState({ orbitProgress: 0, handoff: 0, hero0Active: true });

  useEffect(() => {
    const incoming = document.querySelector('#hero1');
    const titles = incoming.querySelectorAll('.ms-title-reveal');
    const chrome = incoming.querySelectorAll('.ms-chrome-reveal');
    let vh = window.innerHeight / 100;
    let incomingHeight = incoming.offsetHeight;
    let previousOrbit;
    let previousHandoff;
    let previousBeforeEntry;
    const measure = () => {
      vh = window.innerHeight / 100;
      incomingHeight = incoming.offsetHeight;
      const contentWidth = document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      incoming.style.setProperty('--journey-content-width', `${contentWidth}px`);
    };
    const render = self => {
      const y = self.scroll();
      const orbitProgress = clamp01(y / (HERO_SCROLL_VH * vh));
      const rawHandoff = clamp01((y / vh - HERO_SCROLL_VH) / HANDOFF_VH);
      const handoff = ready ? rawHandoff : 0;
      morningstarBridge.progress = clamp01((y - HERO1_START_VH * vh) / Math.max(1, incomingHeight - 100 * vh));
      morningstarBridge.setActive(rawHandoff > 0);
      const beforeEntry = y < HERO1_START_VH * vh;
      if (beforeEntry !== previousBeforeEntry) {
        incoming.dataset.beforeEntry = String(beforeEntry);
        previousBeforeEntry = beforeEntry;
      }
      if (handoff !== previousHandoff) {
        const titleOpacity = smoothstep(0.38, 0.94, handoff);
        const chromeOpacity = smoothstep(0.65, 1, handoff);
        incoming.dataset.handoff = handoff.toFixed(4);
        incoming.inert = handoff < 0.94;
        titles.forEach(element => {
          element.style.opacity = titleOpacity;
          element.style.transform = `translateY(${22 * (1 - titleOpacity)}px)`;
        });
        chrome.forEach(element => { element.style.opacity = chromeOpacity; });
      }
      // Hero1 keeps its native scroll timeline; React only needs updates while
      // hero0 or the handoff changes, including when scrolling back upward.
      if (orbitProgress !== previousOrbit || handoff !== previousHandoff) {
        setJourney({ orbitProgress, handoff, hero0Active: handoff < 1 });
        previousOrbit = orbitProgress;
        previousHandoff = handoff;
      }
    };
    measure();
    const trigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: render,
      onRefresh: self => { measure(); render(self); } });
    render(trigger);
    const observer = new ResizeObserver(() => {
      incomingHeight = incoming.offsetHeight;
      ScrollTrigger.refresh();
    });
    observer.observe(incoming);
    return () => { observer.disconnect(); trigger.kill(); };
  }, [ready]);

  return { universeWrapperRef, ...journey };
}
