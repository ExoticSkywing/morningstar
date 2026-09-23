import { memo, useEffect, useRef } from 'react';
import content from './content.html?raw';
import { initializeMorningstar } from './runtime';
import './source.css';
import './integration.css';

export default memo(function Morningstar({ onReady }) {
  const rootRef = useRef(null);
  useEffect(() => {
    let dispose;
    let gone = false;
    initializeMorningstar(rootRef.current, () => !gone && onReady())
      .then(cleanup => { if (gone) cleanup(); else dispose = cleanup; })
      .catch(error => {
        console.error('Morningstar initialization failed', error);
        rootRef.current.dataset.sceneReady = 'error';
      });
    return () => { gone = true; dispose?.(); };
  }, [onReady]);
  return <section ref={rootRef} id="hero1" className="morningstar" lang="zh-CN"
    aria-label="NEBULUXE — Beyond" data-before-entry="true" inert
    dangerouslySetInnerHTML={{ __html: content }} />;
});
