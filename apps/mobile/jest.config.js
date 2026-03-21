/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@colanode/mobile/(.*)$': '<rootDir>/src/$1',
    '^@colanode/core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@colanode/crdt/(.*)$': '<rootDir>/../../packages/crdt/src/$1',
    '^@colanode/client/(.*)$': '<rootDir>/../../packages/client/src/$1',
  },
};
