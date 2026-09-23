import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'morningstar-native-runtime-reload',
    handleHotUpdate({ file, server }) {
      // Webflow owns the imported DOM and cannot survive a partial React
      // refresh that replaces its nodes while preserving old event owners.
      if (file.replaceAll('\\', '/').includes('/src/morningstar/')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  }],
  optimizeDeps: { entries: ['index.html'] },
  server: { strictPort: true },
});
