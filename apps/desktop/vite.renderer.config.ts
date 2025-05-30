import path from 'path';

import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig } from 'vite';

import { pluginExposeRenderer } from './vite.base.config';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'renderer'>;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@colanode/desktop': path.resolve(__dirname, './src'),
        '@colanode/core': path.resolve(__dirname, '../../packages/core/src'),
        '@colanode/crdt': path.resolve(__dirname, '../../packages/crdt/src'),
        '@colanode/client': path.resolve(
          __dirname,
          '../../packages/client/src'
        ),
        '@colanode/ui': path.resolve(__dirname, '../../packages/ui/src'),
      },
    },
    clearScreen: false,
  } as UserConfig;
});
