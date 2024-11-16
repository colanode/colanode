import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig(async () => {
  const { viteStaticCopy } = await import('vite-plugin-static-copy');
  return {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      rollupOptions: {
        external: [
          'better-sqlite3',
          'kysely',
          'unzipper',
          'mime-types',
          'node-gyp-build',
          'asynckit',
        ],
      },
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: 'assets/**/*',
            dest: 'assets',
          },
        ],
      }),
    ],
  };
});
