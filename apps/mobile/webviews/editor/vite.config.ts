import { resolve } from 'node:path';

import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const repoRoot = resolve(__dirname, '../../../..');
const packagesDir = resolve(repoRoot, 'packages');

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@colanode/core': resolve(packagesDir, 'core/src'),
      '@colanode/crdt': resolve(packagesDir, 'crdt/src'),
      '@colanode/client': resolve(packagesDir, 'client/src'),
      '@colanode/ui': resolve(packagesDir, 'ui/src'),
      // Force react and react-dom to the same version to avoid React
      // error #527 at runtime caused by mismatched copies.
      react: resolve(repoRoot, 'node_modules/react'),
      'react-dom': resolve(repoRoot, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'editor.html'),
    },
  },
  plugins: [viteReact(), viteSingleFile()],
});
