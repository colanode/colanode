import fs from 'fs/promises';
import path from 'path';

import { defineConfig } from 'tsup';

const copyTemplates = async () => {
  const srcDir = path.resolve(__dirname, 'src/templates');
  const destDir = path.resolve(__dirname, 'dist');

  await fs.mkdir(destDir, { recursive: true });

  const files = await fs.readdir(srcDir);
  for (const file of files) {
    if (!file.endsWith('.html')) {
      continue;
    }

    await fs.copyFile(path.join(srcDir, file), path.join(destDir, file));
  }
};

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  sourcemap: true,
  /**
   * The common package is using the internal packages approach, so it needs to
   * be transpiled / bundled together with the deployed code.
   */
  noExternal: ['@colanode/core', '@colanode/crdt'],
  /**
   * Do not use tsup for generating d.ts files because it can not generate type
   * the definition maps required for go-to-definition to work in our IDE. We
   * use tsc for that.
   */
  onSuccess: async () => {
    await copyTemplates();
  },
});
