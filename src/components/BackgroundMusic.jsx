import { memo, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { BGM_SOURCES, createBackgroundMusic } from '../audio/backgroundMusic';
import styles from './BackgroundMusic.module.css';

export default memo(function BackgroundMusic() {
  const audioRef = useRef(null);
  const controllerRef = useRef(null);
  const [state, setState] = useState({ enabled: true, status: 'loading' });
  const playing = state.status === 'playing';
  const pending = state.status === 'loading';
  const label = playing || pending ? '关闭背景音乐' : state.status === 'error' ? '重新播放背景音乐' : '开启背景音乐';

  useEffect(() => {
    const controller = createBackgroundMusic(audioRef.current, { document, window, onChange: setState });
    controllerRef.current = controller;
    return () => { controllerRef.current = null; controller.dispose(); };
  }, []);

  return (
    <div className={styles.control} data-bgm-control>
      <audio id="nebuluxe-bgm" ref={audioRef} loop preload="auto" aria-hidden="true">
        {BGM_SOURCES.map(source => <source key={source.src} {...source} />)}
      </audio>
      <button type="button" className={styles.button} onClick={() => controllerRef.current?.toggle()}
        aria-label={label} aria-pressed={playing} aria-controls="nebuluxe-bgm" title={label}
        data-playing={playing}>
        {playing ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
      </button>
    </div>
  );
});
