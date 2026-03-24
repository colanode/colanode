/**
 * Copies the built editor HTML from apps/mobile/webviews/editor into the
 * mobile app's assets directory so Metro can bundle it.
 *
 * Always rebuilds when the source is newer than the copied asset, so that
 * stale assets cannot sneak through.
 */

const {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} = require('node:fs');
const { resolve } = require('node:path');
const { execSync } = require('node:child_process');

const editorDir = resolve(__dirname, '../webviews/editor');
const editorSrcDir = resolve(editorDir, 'src');
const editorHtmlFile = resolve(editorDir, 'editor.html');
const editorPackageFile = resolve(editorDir, 'package.json');
const editorTsConfigFile = resolve(editorDir, 'tsconfig.json');
const editorViteConfigFile = resolve(editorDir, 'vite.config.ts');
const srcFile = resolve(editorDir, 'dist/editor.html');
const destDir = resolve(__dirname, '../assets/editor-dist');
const destFile = resolve(destDir, 'editor.html');

function getLatestMtimeMs(path) {
  const stats = statSync(path);
  if (!stats.isDirectory()) {
    return stats.mtimeMs;
  }

  let latest = stats.mtimeMs;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    latest = Math.max(latest, getLatestMtimeMs(resolve(path, entry.name)));
  }

  return latest;
}

function editorSourceMtimeMs() {
  return Math.max(
    getLatestMtimeMs(editorSrcDir),
    getLatestMtimeMs(editorHtmlFile),
    getLatestMtimeMs(editorPackageFile),
    getLatestMtimeMs(editorTsConfigFile),
    getLatestMtimeMs(editorViteConfigFile)
  );
}

function needsBuild() {
  if (!existsSync(srcFile)) return true;
  return editorSourceMtimeMs() > statSync(srcFile).mtimeMs;
}

function needsCopy() {
  if (!existsSync(srcFile)) return false;
  if (!existsSync(destFile)) return true;
  return statSync(srcFile).mtimeMs > statSync(destFile).mtimeMs;
}

if (needsBuild()) {
  console.log('[copy-editor] Building @colanode/mobile-editor...');
  execSync('npm run build', { cwd: editorDir, stdio: 'inherit' });
}

if (needsCopy()) {
  mkdirSync(destDir, { recursive: true });
  cpSync(srcFile, destFile);
  console.log('[copy-editor] Copied editor.html to assets/editor-dist/');
} else {
  console.log('[copy-editor] Asset up to date, skipping copy.');
}
