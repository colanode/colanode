const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Modules that are never used at runtime on mobile — mock with empty export.
const EMPTY_MOCK_MODULES = [
  '@tiptap/core',
  '@tiptap/pm',
];

// Modules that need a functional mock (used by yjs/lib0 at runtime).
const CUSTOM_MOCKS = {
  'isomorphic-webcrypto': path.resolve(
    __dirname,
    'src/mocks/isomorphic-webcrypto.js'
  ),
};

const emptyModule = path.resolve(__dirname, 'src/mocks/empty-module.js');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Empty mocks for browser-only modules
  if (
    EMPTY_MOCK_MODULES.some(
      (m) => moduleName === m || moduleName.startsWith(m + '/')
    )
  ) {
    return {
      filePath: emptyModule,
      type: 'sourceFile',
    };
  }

  // Custom mocks for modules that need partial functionality
  for (const [prefix, mockPath] of Object.entries(CUSTOM_MOCKS)) {
    if (moduleName === prefix || moduleName.startsWith(prefix + '/')) {
      return {
        filePath: mockPath,
        type: 'sourceFile',
      };
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
