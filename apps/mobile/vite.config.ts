import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(__dirname), // the 'ui/' folder
  plugins: [react(), viteSingleFile()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@assets': resolve(__dirname, './assets'),
      '@colanode/mobile': resolve(__dirname, './src'),
      '@colanode/core': resolve(__dirname, '../../packages/core/src'),
      '@colanode/crdt': resolve(__dirname, '../../packages/crdt/src'),
      '@colanode/client': resolve(__dirname, '../../packages/client/src'),
      '@colanode/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'assets/ui'),
    emptyOutDir: true,
    assetsInlineLimit: 100000000, // inline assets
    sourcemap: false,
  },
});
