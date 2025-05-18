import path from 'path';
import fs from 'fs';

const ASSETS_DIR = path.resolve('assets');
const EMOJIS_DB_PATH = path.resolve(ASSETS_DIR, 'emojis.db');
const EMOJIS_MIN_DB_PATH = path.resolve(ASSETS_DIR, 'emojis.min.db');
const EMOJI_SVG_PATH = path.resolve(ASSETS_DIR, 'emojis.svg');

const ICONS_DB_PATH = path.resolve(ASSETS_DIR, 'icons.db');
const ICONS_MIN_DB_PATH = path.resolve(ASSETS_DIR, 'icons.min.db');
const ICONS_SVG_PATH = path.resolve(ASSETS_DIR, 'icons.svg');

const NEOTRAX_FONT_NAME = 'neotrax.otf';
const FONTS_DIR = path.resolve(ASSETS_DIR, 'fonts');
const FONTS_OTF_PATH = path.resolve(FONTS_DIR, NEOTRAX_FONT_NAME);

const DESKTOP_ASSETS_DIR = path.resolve('apps', 'desktop', 'assets');
const WEB_ASSETS_DIR = path.resolve('apps', 'web', 'public', 'assets');

const copyFile = (source: string, target: string | string[]) => {
  if (!fs.existsSync(source)) {
    return;
  }

  const targets = Array.isArray(target) ? target : [target];

  targets.forEach((target) => {
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(source, target);
  });
};

const execute = () => {
  copyFile(EMOJIS_DB_PATH, path.resolve(DESKTOP_ASSETS_DIR, 'emojis.db'));
  copyFile(EMOJIS_MIN_DB_PATH, path.resolve(WEB_ASSETS_DIR, 'emojis.min.db'));

  copyFile(EMOJI_SVG_PATH, [
    path.resolve(DESKTOP_ASSETS_DIR, 'emojis.svg'),
    path.resolve(WEB_ASSETS_DIR, 'emojis.svg'),
  ]);

  copyFile(ICONS_DB_PATH, path.resolve(DESKTOP_ASSETS_DIR, 'icons.db'));
  copyFile(ICONS_MIN_DB_PATH, path.resolve(WEB_ASSETS_DIR, 'icons.min.db'));

  copyFile(ICONS_SVG_PATH, [
    path.resolve(DESKTOP_ASSETS_DIR, 'icons.svg'),
    path.resolve(WEB_ASSETS_DIR, 'icons.svg'),
  ]);

  copyFile(FONTS_OTF_PATH, [
    path.resolve(DESKTOP_ASSETS_DIR, 'fonts', NEOTRAX_FONT_NAME),
    path.resolve(WEB_ASSETS_DIR, 'fonts', NEOTRAX_FONT_NAME),
  ]);
};

execute();
