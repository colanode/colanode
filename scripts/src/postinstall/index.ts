import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.resolve('assets');
const IMAGES_DIR = path.resolve(ASSETS_DIR, 'images');

const EMOJIS_DIR = path.resolve(ASSETS_DIR, 'emojis');
const EMOJIS_DB_PATH = path.resolve(EMOJIS_DIR, 'emojis.db');
const EMOJIS_MIN_DB_PATH = path.resolve(EMOJIS_DIR, 'emojis.min.db');
const EMOJI_SVG_PATH = path.resolve(EMOJIS_DIR, 'emojis.svg');

const ICONS_DIR = path.resolve(ASSETS_DIR, 'icons');
const ICONS_DB_PATH = path.resolve(ICONS_DIR, 'icons.db');
const ICONS_MIN_DB_PATH = path.resolve(ICONS_DIR, 'icons.min.db');
const ICONS_SVG_PATH = path.resolve(ICONS_DIR, 'icons.svg');

const NEOTRAX_FONT_NAME = 'neotrax.otf';
const FONTS_DIR = path.resolve(ASSETS_DIR, 'fonts');
const FONTS_OTF_PATH = path.resolve(FONTS_DIR, NEOTRAX_FONT_NAME);

const DESKTOP_ASSETS_DIR = path.resolve('apps', 'desktop', 'assets');
const WEB_PUBLIC_DIR = path.resolve('apps', 'web', 'public');
const WEB_ASSETS_DIR = path.resolve(WEB_PUBLIC_DIR, 'assets');

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
  copyFile(EMOJIS_MIN_DB_PATH, path.resolve(WEB_ASSETS_DIR, 'emojis.db'));

  copyFile(EMOJI_SVG_PATH, [
    path.resolve(DESKTOP_ASSETS_DIR, 'emojis.svg'),
    path.resolve(WEB_ASSETS_DIR, 'emojis.svg'),
  ]);

  copyFile(ICONS_DB_PATH, path.resolve(DESKTOP_ASSETS_DIR, 'icons.db'));
  copyFile(ICONS_MIN_DB_PATH, path.resolve(WEB_ASSETS_DIR, 'icons.db'));

  copyFile(ICONS_SVG_PATH, [
    path.resolve(DESKTOP_ASSETS_DIR, 'icons.svg'),
    path.resolve(WEB_ASSETS_DIR, 'icons.svg'),
  ]);

  copyFile(FONTS_OTF_PATH, [
    path.resolve(DESKTOP_ASSETS_DIR, 'fonts', NEOTRAX_FONT_NAME),
    path.resolve(WEB_ASSETS_DIR, 'fonts', NEOTRAX_FONT_NAME),
  ]);

  copyFile(
    path.resolve(IMAGES_DIR, 'colanode-logo.ico'),
    path.resolve(WEB_PUBLIC_DIR, 'favicon.ico')
  );

  copyFile(
    path.resolve(IMAGES_DIR, 'colanode-logo-192.jpg'),
    path.resolve(WEB_ASSETS_DIR, 'colanode-logo-192.jpg')
  );

  copyFile(
    path.resolve(IMAGES_DIR, 'colanode-logo-512.jpg'),
    path.resolve(WEB_ASSETS_DIR, 'colanode-logo-512.jpg')
  );

  copyFile(
    path.resolve(IMAGES_DIR, 'colanode-logo.png'),
    path.resolve(DESKTOP_ASSETS_DIR, 'colanode-logo.png')
  );

  copyFile(
    path.resolve(IMAGES_DIR, 'colanode-logo.ico'),
    path.resolve(DESKTOP_ASSETS_DIR, 'colanode-logo.ico')
  );

  copyFile(
    path.resolve(IMAGES_DIR, 'colanode-logo.icns'),
    path.resolve(DESKTOP_ASSETS_DIR, 'colanode-logo.icns')
  );
};

execute();
