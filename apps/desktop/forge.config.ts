import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'fs/promises';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Colanode',
    asar: true,
    ignore: [
      /^\/src/,
      /^\/test/,
      /^\/tools/,
      /^\/release/,
      /^\/docs/,
      /^\/dist/,
      /\.git/,
      /\.vscode/,
      /\.idea/,
      /^\/\.env/,
      // Don't ignore node_modules
      // /^\/node_modules/,
    ],
    extraResource: ['assets'],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'colanode',
          name: 'colanode'
        },
        // Publishing options: 
        //    draft=true creates private release for review, 
        //    prerelease=true marks as beta, false=stable/production
        prerelease: false,
        draft: true
      }
    }
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    prePackage: async () => {
      // This is a temporary fix to be able to package the app
      // in a monorepo setup. When packaging the app, vite checks only in
      // the node_modules directory of the current package for dependencies needed in the main process.
      // This is why we need to copy the node_modules directory from the root to the build directory.

      // to be removed when forge supports monorepos

      const srcNodeModules = '../../node_modules';
      const destNodeModules = './node_modules';

      // Ensure the destination directory exists
      await fs.mkdir(destNodeModules, { recursive: true });

      // Copy the entire node_modules directory recursively
      await fs.cp(srcNodeModules, destNodeModules, {
        recursive: true,
        force: true,
      });
    },
    postPackage: async () => {
      // remove the node_modules directory
      await fs.rm('./node_modules', { recursive: true, force: true });
    },
  },
};

export default config;
