const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Allow .db and .html files to be imported as assets
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'html'];

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

// Files containing syntax Hermes cannot compile (e.g. dynamic import with
// webpack magic comments). Matched against the resolved file path.
const BLOCKED_FILE_PATTERNS = [
  /kysely[/\\]dist[/\\].*file-migration-provider/,
];

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

  // Resolve normally first, then check if the result should be blocked
  const resolution = originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);

  if (
    resolution?.type === 'sourceFile' &&
    BLOCKED_FILE_PATTERNS.some((re) => re.test(resolution.filePath))
  ) {
    return { filePath: emptyModule, type: 'sourceFile' };
  }

  return resolution;
};

module.exports = config;
