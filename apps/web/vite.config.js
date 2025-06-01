import { resolve } from 'node:path';

import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@colanode/web': resolve(__dirname, './src'),
      '@colanode/core': resolve(__dirname, '../../packages/core/src'),
      '@colanode/crdt': resolve(__dirname, '../../packages/crdt/src'),
      '@colanode/client': resolve(__dirname, '../../packages/client/src'),
      '@colanode/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  plugins: [
    viteReact(),
    VitePWA({
      mode: 'development',
      base: '/',
      includeAssets: ['favicon.ico'],
      devOptions: {
        enabled: true,
        type: 'module',
      },
      srcDir: 'src/workers',
      filename: 'service.ts',
      strategies: 'injectManifest',
      registerType: 'autoUpdate',
      injectManifest: {
        minify: false,
        enableWorkboxModulesLogs: true,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
});
