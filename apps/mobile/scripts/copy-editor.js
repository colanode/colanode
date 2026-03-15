/**
 * Copies the built editor HTML from apps/mobile/webviews/editor into the
 * mobile app's assets directory so Metro can bundle it.
 *
 * Always rebuilds when the source is newer than the copied asset, so that
 * stale assets cannot sneak through.
 */

const { cpSync, existsSync, mkdirSync, statSync } = require('node:fs');
const { resolve } = require('node:path');
const { execSync } = require('node:child_process');

const editorDir = resolve(__dirname, '../webviews/editor');
const srcFile = resolve(editorDir, 'dist/editor.html');
const destDir = resolve(__dirname, '../assets/editor-dist');
const destFile = resolve(destDir, 'editor.html');

function needsBuild() {
  if (!existsSync(srcFile)) return true;
  if (!existsSync(destFile)) return true;
  // Rebuild when source is newer than the copied asset
  return statSync(srcFile).mtimeMs > statSync(destFile).mtimeMs;
}

if (needsBuild()) {
  if (!existsSync(srcFile)) {
    console.log('[copy-editor] Building @colanode/mobile-editor...');
    execSync('npm run build', { cwd: editorDir, stdio: 'inherit' });
  }
  mkdirSync(destDir, { recursive: true });
  cpSync(srcFile, destFile);
  console.log('[copy-editor] Copied editor.html to assets/editor-dist/');
} else {
  console.log('[copy-editor] Asset up to date, skipping copy.');
}
