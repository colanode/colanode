/// <reference types="./forge.env.d.ts" />

import path from 'path';

import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vite';

import { external, getBuildConfig, pluginHotRestart } from './vite.base.config';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'build'>;
  const { forgeConfigSelf } = forgeEnv;
  const config: UserConfig = {
    build: {
      rollupOptions: {
        external,
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry!,
        output: {
          format: 'cjs',
          // It should not be split chunks.
          inlineDynamicImports: true,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
    plugins: [pluginHotRestart('reload')],
    resolve: {
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
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});
