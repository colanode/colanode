import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@colanode/server': path.resolve(rootDir, 'src'),
      '@colanode/core': path.resolve(rootDir, '../../packages/core/src'),
      '@colanode/crdt': path.resolve(rootDir, '../../packages/crdt/src'),
    },
  },
  test: {
    environment: 'node',
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup-env.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
  },
});
