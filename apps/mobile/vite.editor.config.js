import { resolve } from 'node:path';

import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@colanode/core': resolve(__dirname, '../../packages/core/src'),
      '@colanode/crdt': resolve(__dirname, '../../packages/crdt/src'),
      '@colanode/client': resolve(__dirname, '../../packages/client/src'),
      '@colanode/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'assets/editor-dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'editor.html'),
    },
  },
  plugins: [viteReact(), viteSingleFile()],
});
