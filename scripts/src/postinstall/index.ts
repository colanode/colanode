import path from 'path';
import fs from 'fs';

const ASSETS_DIR = path.resolve('assets');
const DESKTOP_ASSETS_DIR = path.resolve('apps', 'desktop', 'assets');
const WEB_ASSETS_DIR = path.resolve('apps', 'web', 'public', 'assets');

const copyFile = (source: string, targets: string[]) => {
  if (!fs.existsSync(source)) {
    return;
  }

  targets.forEach((target) => {
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(source, target);
  });
};

const copyEmojisDb = () => {
  const sourcePath = path.resolve(ASSETS_DIR, 'emojis.min.db');
  const desktopTargetDir = path.resolve(DESKTOP_ASSETS_DIR, 'emojis.db');
  const webTargetDir = path.resolve(WEB_ASSETS_DIR, 'emojis.db');

  copyFile(sourcePath, [desktopTargetDir, webTargetDir]);
};

const copyEmojisSvg = () => {
  const sourcePath = path.resolve(ASSETS_DIR, 'emojis.svg');
  const desktopTargetDir = path.resolve(DESKTOP_ASSETS_DIR, 'emojis.svg');
  const webTargetDir = path.resolve(WEB_ASSETS_DIR, 'emojis.svg');

  copyFile(sourcePath, [desktopTargetDir, webTargetDir]);
};

const copyIconsDb = () => {
  const sourcePath = path.resolve(ASSETS_DIR, 'icons.db');
  const desktopTargetDir = path.resolve(DESKTOP_ASSETS_DIR, 'icons.db');
  const webTargetDir = path.resolve(WEB_ASSETS_DIR, 'icons.db');

  copyFile(sourcePath, [desktopTargetDir, webTargetDir]);
};

const copyIconsSvg = () => {
  const sourcePath = path.resolve(ASSETS_DIR, 'icons.svg');
  const desktopTargetDir = path.resolve(DESKTOP_ASSETS_DIR, 'icons.svg');
  const webTargetDir = path.resolve(WEB_ASSETS_DIR, 'icons.svg');

  copyFile(sourcePath, [desktopTargetDir, webTargetDir]);
};

const copyFonts = () => {
  const sourcePath = path.resolve(ASSETS_DIR, 'fonts', 'neotrax.otf');
  const desktopTargetDir = path.resolve(
    DESKTOP_ASSETS_DIR,
    'fonts',
    'neotrax.otf'
  );
  const webTargetDir = path.resolve(WEB_ASSETS_DIR, 'fonts', 'neotrax.otf');

  copyFile(sourcePath, [desktopTargetDir, webTargetDir]);
};

const execute = () => {
  copyEmojisDb();
  copyEmojisSvg();
  copyIconsDb();
  copyIconsSvg();
  copyFonts();
};

execute();
