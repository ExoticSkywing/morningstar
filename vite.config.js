import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import siteConfig from './site.config.js';
import { configurePortfolio } from './scripts/portfolio-content.mjs';
import { configureEmotionboard } from './scripts/emotionboard-content.mjs';

const contentPath = fileURLToPath(new URL('./src/morningstar/content.html', import.meta.url));
const contentModule = '\0virtual:morningstar-content';

export default defineConfig({
  plugins: [react(), {
    name: 'morningstar-native-runtime-reload',
    resolveId(id) {
      if (id === 'virtual:morningstar-content') return contentModule;
    },
    load(id) {
      if (id !== contentModule) return;
      this.addWatchFile(contentPath);
      const html = configureEmotionboard(configurePortfolio(readFileSync(contentPath, 'utf8'), siteConfig.portfolioMode));
      return `export const portfolioMode = ${JSON.stringify(siteConfig.portfolioMode)};\nexport default ${JSON.stringify(html)};`;
    },
    handleHotUpdate({ file, server }) {
      // Webflow owns the imported DOM and cannot survive a partial React
      // refresh that replaces its nodes while preserving old event owners.
      if (file.replaceAll('\\', '/').includes('/src/morningstar/')) {
        const module = server.moduleGraph.getModuleById(contentModule);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  }],
  optimizeDeps: { entries: ['index.html'] },
  server: { strictPort: true },
});
