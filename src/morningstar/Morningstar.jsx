import { memo, useEffect, useRef } from 'react';
import content, { portfolioMode } from 'virtual:morningstar-content';
import { initializeMorningstar } from './runtime';
import './source.css';
import './integration.css';

export default memo(function Morningstar({ onReady }) {
  const rootRef = useRef(null);
  useEffect(() => {
    let dispose;
    let gone = false;
    initializeMorningstar(rootRef.current, () => !gone && onReady(), portfolioMode)
      .then(cleanup => { if (gone) cleanup(); else dispose = cleanup; })
      .catch(error => {
        console.error('Morningstar initialization failed', error);
        rootRef.current.dataset.sceneReady = 'error';
      });
    return () => { gone = true; dispose?.(); };
  }, [onReady]);
  return <section ref={rootRef} id="hero1" className="morningstar" lang="zh-CN"
    aria-label="NEBULUXE — Beyond" data-before-entry="true" data-portfolio-mode={portfolioMode} inert
    dangerouslySetInnerHTML={{ __html: content }} />;
});
