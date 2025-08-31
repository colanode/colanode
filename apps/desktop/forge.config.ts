import fs from 'fs/promises';
import path from 'path';

import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'colanode',
    executableName: 'colanode',
    icon: 'assets/colanode-logo-black',
    appBundleId: 'com.colanode.desktop',
    overwrite: true,
    ...(process.platform === 'win32' && {
      certificateFile: process.env.CERTIFICATE_PATH,
      certificatePassword: process.env.CERTIFICATE_PASSWORD,
    }),
    asar: true,
    prune: true,
    ignore: (path) => {
      if (!path) {
        return false;
      }

      if (path === '/package.json') {
        return false;
      }

      if (path === '/node_modules') {
        return false;
      }

      // there are the only native modules that are needed in the main process as external dependencies
      if (
        path.startsWith('/node_modules/better-sqlite3') ||
        path.startsWith('/node_modules/bindings') ||
        path.startsWith('/node_modules/file-uri-to-path')
      ) {
        return false;
      }

      if (path.startsWith('/.vite')) {
        return false;
      }

      return true;
    },
    extraResource: ['assets'],
    osxSign: {
      type: 'distribution',
      keychain: process.env.KEYCHAIN!,
      optionsForFile: (_) => {
        return {
          hardenedRuntime: true,
          entitlements: 'entitlements.mac.plist',
          entitlementsInherit: 'entitlements.mac.plist',
        };
      },
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID!,
      appleIdPassword: process.env.APPLE_ID_PASSWORD!,
      teamId: process.env.APPLE_TEAM_ID!,
      keychain: process.env.KEYCHAIN!,
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'colanode',
      ...(process.platform === 'win32' && {
        certificateFile: process.env.CERTIFICATE_PATH,
        certificatePassword: process.env.CERTIFICATE_PASSWORD,
      }),
    }),
    new MakerDMG({
      icon: 'assets/colanode-logo-black.png',
      title: 'Colanode',
    }),
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: 'assets/colanode-logo-black.png',
          categories: ['Development', 'Utility'],
          maintainer: 'Colanode',
          homepage: 'https://github.com/colanode/colanode',
          license: 'MIT',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: 'assets/colanode-logo-black.png',
          categories: ['Development', 'Utility'],
          maintainer: 'Colanode',
          homepage: 'https://github.com/colanode/colanode',
          license: 'MIT',
          description: 'Colanode desktop application',
          productName: 'Colanode',
        },
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'colanode',
          name: 'colanode',
        },
        prerelease: false,
        draft: true,
      },
    },
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

      // First clear the node_modules directory
      await fs.rm(destNodeModules, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 1000,
      });

      // Ensure the destination directory exists
      await fs.mkdir(destNodeModules, { recursive: true });

      // Copy the entire node_modules directory recursively
      await fs.cp(srcNodeModules, destNodeModules, {
        recursive: true,
        force: true,
      });
    },
    postPackage: async (forgeConfig, buildPath) => {
      console.log('🔧 postPackage hook called');
      console.log('📁 buildPath:', buildPath);
      console.log('📋 forgeConfig:', typeof forgeConfig);
      
      // Ensure the built package.json has the required license field
      if (buildPath && typeof buildPath === 'string') {
        const packageJsonPath = path.join(buildPath, 'package.json');
        try {
          const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
          const content = JSON.parse(packageJson);
          
          // Ensure required fields are present for RPM/DEB makers
          if (!content.license) {
            content.license = 'MIT';
          }
          if (!content.description) {
            content.description = 'Colanode desktop application';
          }
          if (!content.maintainer) {
            content.maintainer = 'Colanode';
          }
          
          await fs.writeFile(packageJsonPath, JSON.stringify(content, null, 2));
          console.log('✅ Updated built package.json with required fields');
        } catch (error) {
          console.error('❌ Failed to update built package.json:', error);
        }
      } else {
        console.log('⚠️ buildPath is not a string, skipping package.json update');
      }
      
      // Remove the node_modules directory
      try {
        await fs.rm('./node_modules', {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 1000,
        });
      } catch (error) {
        console.error(error);
      }
    },
    packageAfterPrune: async (_, buildPath) => {
      // Remove empty node_modules folders that are left behind
      // after the package and prune process. We also delete all non-necessary
      // files, for example md files, license files, development config files etc.
      const nodeModulesPath = path.join(buildPath, 'node_modules');
      const nodeModules = await fs.readdir(nodeModulesPath, {
        withFileTypes: true,
      });

      for (const nodeModule of nodeModules) {
        if (!nodeModule.isDirectory()) {
          continue;
        }

        if (nodeModule.name === 'node_modules') {
          continue;
        }

        const files = await fs.readdir(
          path.join(nodeModulesPath, nodeModule.name),
          {
            withFileTypes: true,
          }
        );

        if (files.length === 0) {
          await fs.rmdir(path.join(nodeModulesPath, nodeModule.name));
        } else {
          for (const file of files) {
            if (!file.isFile()) {
              continue;
            }

            const shouldDelete =
              file.name === 'LICENSE' ||
              file.name.endsWith('.md') ||
              file.name.endsWith('.txt') ||
              file.name.endsWith('.lock') ||
              file.name.endsWith('.yaml') ||
              file.name.endsWith('.yml') ||
              file.name.endsWith('.gitignore') ||
              file.name.endsWith('.npmignore') ||
              file.name.endsWith('.npmrc') ||
              file.name.endsWith('.npm');

            if (shouldDelete) {
              await fs.rm(
                path.join(nodeModulesPath, nodeModule.name, file.name)
              );
            }
          }
        }
      }

      // Clean up the package.json file and remove all fields that are not needed
      const packageJsonPath = path.join(buildPath, 'package.json');
      const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
      const content = JSON.parse(packageJson);
      const allowedKeys = [
        'name',
        'productName',
        'version',
        'description',
        'main',
        'author',
        'license',
      ];

      const result = Object.fromEntries(
        Object.entries(content).filter(([key]) => allowedKeys.includes(key))
      );
      await fs.writeFile(packageJsonPath, JSON.stringify(result, null, 2));
    },
  },
};

export default config;
