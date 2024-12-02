import archiver from 'archiver';
import fetch from 'node-fetch';
import { monotonicFactory } from 'ulid';
import unzipper from 'unzipper';

import fs from 'fs';

const ulid = monotonicFactory();

type EmojiMartI18n = {
  categories: Record<string, string>;
};

type EmojiMartEmoji = {
  id: string;
  name: string;
  keywords: string[];
  skins: EmojiMartSkin[];
  version: number;
  emoticons?: string[];
};

type EmojiMartSkin = {
  unified: string;
  native: string;
};

type EmojiMartCategory = {
  id: string;
  emojis: string[];
};

type EmojiMartData = {
  emojis: Record<string, EmojiMartEmoji>;
  categories: Record<string, EmojiMartCategory>;
};

const WORK_DIR_PATH = 'src/emojis/temp';
const EMOJIS_DIR_PATH = `${WORK_DIR_PATH}/emojis`;
const EMOJIS_METADATA_FILE_PATH = `${EMOJIS_DIR_PATH}/emojis.json`;
const EMOJIS_ZIP_FILE_PATH = 'src/emojis/emojis.zip';

const GITHUB_DOMAIN = 'https://github.com';

const EMOJI_MART_REPO = 'missive/emoji-mart';
const EMOJI_MART_TAG = '5.6.0';
const EMOJI_MART_DIR_PATH = `${WORK_DIR_PATH}/emoji-mart-${EMOJI_MART_TAG}`;
const EMOJI_MART_I18N_FILE_PATH = `${EMOJI_MART_DIR_PATH}/packages/emoji-mart-data/i18n/en.json`;
const EMOJI_MART_DATA_FILE_PATH = `${EMOJI_MART_DIR_PATH}/packages/emoji-mart-data/sets/15/twitter.json`;

const TWEEMOJI_REPO = 'jdecked/twemoji';
const TWEEMOJI_TAG = '15.1.0';
const TWEEMOJI_DIR_PATH = `${WORK_DIR_PATH}/twemoji-${TWEEMOJI_TAG}`;
const TWEEMOJI_SVG_DIR_PATH = `${TWEEMOJI_DIR_PATH}/assets/svg`;

type EmojiMetadata = {
  categories: EmojiCategory[];
  emojis: Record<string, Emoji>;
};

type Emoji = {
  id: string;
  code: string;
  name: string;
  tags: string[];
  emoticons: string[] | undefined;
  skins: EmojiSkin[];
};

type EmojiCategory = {
  id: string;
  name: string;
  emojis: string[];
};

type EmojiSkin = {
  id: string;
  unified: string;
};

const generateEmojiId = () => {
  return ulid().toLowerCase() + 'em';
};

const downloadEmojiMartRepo = async () => {
  console.log(`Downloading emoji-mart repo`);
  const url = `${GITHUB_DOMAIN}/${EMOJI_MART_REPO}/archive/refs/tags/v${EMOJI_MART_TAG}.zip`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }

  if (fs.existsSync(EMOJI_MART_DIR_PATH)) {
    fs.rmSync(EMOJI_MART_DIR_PATH, { recursive: true });
  }

  await new Promise((resolve, reject) => {
    if (response.body == null) {
      reject(new Error(`Failed to download ${url}`));
      return;
    }

    response.body
      .pipe(unzipper.Extract({ path: WORK_DIR_PATH }))
      .on('close', resolve)
      .on('error', reject);
  });
  console.log(`Downloaded emoji-mart repo`);
};

const downloadTweemojiRepo = async () => {
  console.log(`Downloading twemoji repo`);
  const url = `${GITHUB_DOMAIN}/${TWEEMOJI_REPO}/archive/refs/tags/v${TWEEMOJI_TAG}.zip`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }

  if (fs.existsSync(TWEEMOJI_DIR_PATH)) {
    fs.rmSync(TWEEMOJI_DIR_PATH, { recursive: true });
  }

  await new Promise((resolve, reject) => {
    if (response.body == null) {
      reject(new Error(`Failed to download ${url}`));
      return;
    }

    response.body
      .pipe(unzipper.Extract({ path: WORK_DIR_PATH }))
      .on('close', resolve)
      .on('error', reject);
  });
  console.log(`Downloaded twemoji repo`);
};

const getEmojiSkinFileName = (unified: string) => {
  let file = unified;

  if (file.substring(0, 2) == '00') {
    file = file.substring(2);

    // Fix for keycap emojis
    const regex = /-fe0f/i;
    file = file.replace(regex, '');
  }

  if (file.startsWith('1f441')) {
    const regex = /-fe0f/gi;
    file = file.replace(regex, '');
  }

  if (file.endsWith('-fe0f')) {
    const parts = file.split('-');
    if (parts.length === 2 && parts[0]) {
      file = parts[0];
    }
  }

  return `${file}.svg`;
};

const readMetadata = (): EmojiMetadata => {
  if (!fs.existsSync(EMOJIS_METADATA_FILE_PATH)) {
    return { emojis: {}, categories: [] };
  }

  return JSON.parse(
    fs.readFileSync(EMOJIS_METADATA_FILE_PATH, 'utf-8')
  ) as EmojiMetadata;
};

const generateEmojisDir = () => {
  console.log(`Generating emojis dir`);
  const existingMetadata: EmojiMetadata = readMetadata();

  const result: EmojiMetadata = {
    categories: [],
    emojis: {},
  };

  const idMap: Record<string, string> = {};

  const emojiMartData = JSON.parse(
    fs.readFileSync(EMOJI_MART_DATA_FILE_PATH, 'utf-8')
  ) as EmojiMartData;

  const i18nData = JSON.parse(
    fs.readFileSync(EMOJI_MART_I18N_FILE_PATH, 'utf-8')
  ) as EmojiMartI18n;

  console.log(`Processing emojis`);
  for (const emojiMartItem of Object.values(emojiMartData.emojis)) {
    const existingEmoji = Object.values(existingMetadata.emojis).find(
      (emoji) => emoji.code === emojiMartItem.id
    );

    const emojiId = existingEmoji ? existingEmoji.id : generateEmojiId();
    const emoji: Emoji = {
      id: emojiId,
      code: emojiMartItem.id,
      name: emojiMartItem.name,
      tags: emojiMartItem.keywords,
      emoticons: emojiMartItem.emoticons,
      skins: [],
    };

    for (const skin of emojiMartItem.skins) {
      const existingSkin = existingEmoji?.skins.find(
        (s) => s.unified === skin.unified
      );

      const skinId = existingSkin?.id ?? generateEmojiId();
      emoji.skins.push({
        id: skinId,
        unified: skin.unified,
      });

      const fileName = getEmojiSkinFileName(skin.unified);
      const sourceFilePath = `${TWEEMOJI_SVG_DIR_PATH}/${fileName}`;
      const targetFilePath = `${EMOJIS_DIR_PATH}/${fileName}`;
      if (!fs.existsSync(targetFilePath)) {
        fs.copyFileSync(sourceFilePath, targetFilePath);
      }
    }

    idMap[emoji.code] = emoji.id;
    result.emojis[emojiId] = emoji;
  }

  console.log(`Processing categories`);
  for (const emojiMartCategory of Object.values(emojiMartData.categories)) {
    const i18nCategory = i18nData.categories[emojiMartCategory.id];

    if (!i18nCategory) {
      throw new Error(
        `Category ${emojiMartCategory.id} not found in i18n data`
      );
    }

    const categoryEmojis: string[] = [];
    for (const emoji of emojiMartCategory.emojis) {
      if (!idMap[emoji]) {
        throw new Error(`Emoji ${emoji} not found in idMap`);
      }

      categoryEmojis.push(idMap[emoji]);
    }

    const category: EmojiCategory = {
      id: emojiMartCategory.id,
      name: i18nCategory,
      emojis: categoryEmojis,
    };

    result.categories.push(category);
  }

  fs.writeFileSync(EMOJIS_METADATA_FILE_PATH, JSON.stringify(result, null, 2));
  console.log(`Generated emojis dir`);
};

const zipEmojis = async () => {
  console.log(`Zipping emojis`);
  if (fs.existsSync(EMOJIS_ZIP_FILE_PATH)) {
    fs.rmSync(EMOJIS_ZIP_FILE_PATH);
  }

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(EMOJIS_ZIP_FILE_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zipped ${archive.pointer()} total bytes`);
      resolve(void 0);
    });

    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(EMOJIS_DIR_PATH, false);
    archive.finalize();
  });
  console.log(`Zipped emojis`);
};

const generateEmojis = async () => {
  if (!fs.existsSync(WORK_DIR_PATH)) {
    fs.mkdirSync(WORK_DIR_PATH);
  }

  if (!fs.existsSync(EMOJIS_DIR_PATH)) {
    fs.mkdirSync(EMOJIS_DIR_PATH);
  }

  await downloadEmojiMartRepo();
  await downloadTweemojiRepo();

  generateEmojisDir();
  await zipEmojis();

  console.log(`Cleaning up`);
  fs.rmSync(WORK_DIR_PATH, { recursive: true });
  console.log(`All done`);
};

generateEmojis();
