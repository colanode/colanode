import { isEqual } from 'lodash-es';
import AdmZip from 'adm-zip';

import path from 'path';
import fs from 'fs';

const fileJsonEquals = (source: string, target: string) => {
  if (!fs.existsSync(target)) {
    return false;
  }

  const sourceData = JSON.parse(fs.readFileSync(source, 'utf8'));
  const targetData = JSON.parse(fs.readFileSync(target, 'utf8'));
  return isEqual(sourceData, targetData);
};

const extractEmojis = async () => {
  const sourceEmojiMetadataFilePath = path.resolve(
    'scripts',
    'src',
    'emojis',
    'emojis.json'
  );
  const targetEmojiMetadataFilePath = path.resolve(
    'apps',
    'desktop',
    'assets',
    'emojis',
    'emojis.json'
  );

  if (
    fileJsonEquals(sourceEmojiMetadataFilePath, targetEmojiMetadataFilePath)
  ) {
    console.log('Emojis are up to date');
    return;
  }

  fs.mkdirSync(path.dirname(targetEmojiMetadataFilePath), { recursive: true });

  console.log('Extracting emojis into desktop assets');
  fs.copyFileSync(sourceEmojiMetadataFilePath, targetEmojiMetadataFilePath);

  const emojisZipFilePath = path.resolve(
    'scripts',
    'src',
    'emojis',
    'emojis.zip'
  );
  const emojisDirPath = path.resolve('apps', 'desktop', 'assets', 'emojis');
  fs.mkdirSync(emojisDirPath, { recursive: true });

  const zip = new AdmZip(emojisZipFilePath);
  zip.extractAllTo(emojisDirPath, true);
};

const extractIcons = async () => {
  const sourceIconsMetadataFilePath = path.resolve(
    'scripts',
    'src',
    'icons',
    'icons.json'
  );
  const targetIconsMetadataFilePath = path.resolve(
    'apps',
    'desktop',
    'assets',
    'icons',
    'icons.json'
  );

  if (
    fileJsonEquals(sourceIconsMetadataFilePath, targetIconsMetadataFilePath)
  ) {
    console.log('Icons are up to date');
    return;
  }

  fs.mkdirSync(path.dirname(targetIconsMetadataFilePath), { recursive: true });

  console.log('Extracting icons into desktop assets');
  fs.copyFileSync(sourceIconsMetadataFilePath, targetIconsMetadataFilePath);

  const iconsZipFilePath = path.resolve('scripts', 'src', 'icons', 'icons.zip');
  const iconsDirPath = path.resolve('apps', 'desktop', 'assets', 'icons');
  fs.mkdirSync(iconsDirPath, { recursive: true });

  const zip = new AdmZip(iconsZipFilePath);
  zip.extractAllTo(iconsDirPath, true);
};

const execute = async () => {
  await extractEmojis();
  await extractIcons();
};

execute().catch(console.error);
