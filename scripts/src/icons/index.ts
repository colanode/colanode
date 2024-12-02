import archiver from 'archiver';
import fetch from 'node-fetch';
import { monotonicFactory } from 'ulid';
import unzipper from 'unzipper';

import fs from 'fs';

const ulid = monotonicFactory();

type SimpleIconsData = {
  icons: SimpleIconItem[];
};

type SimpleIconItem = {
  title: string;
  slug?: string;
};

const TITLE_TO_SLUG_REPLACEMENTS = {
  '+': 'plus',
  '.': 'dot',
  '&': 'and',
  đ: 'd',
  ħ: 'h',
  ı: 'i',
  ĸ: 'k',
  ŀ: 'l',
  ł: 'l',
  ß: 'ss',
  ŧ: 't',
};

const TITLE_TO_SLUG_CHARS_REGEX = new RegExp(
  `[${Object.keys(TITLE_TO_SLUG_REPLACEMENTS).join('')}]`,
  'g'
);

const TITLE_TO_SLUG_RANGE_REGEX = /[^a-z\d]/g;

const simpleIconTitleToSlug = (title: string) =>
  title
    .toLowerCase()
    .replaceAll(
      TITLE_TO_SLUG_CHARS_REGEX,
      (char) =>
        TITLE_TO_SLUG_REPLACEMENTS[
          char as keyof typeof TITLE_TO_SLUG_REPLACEMENTS
        ]
    )
    .normalize('NFD')
    .replaceAll(TITLE_TO_SLUG_RANGE_REGEX, '');

const WORK_DIR_PATH = 'src/icons/temp';
const ICONS_DIR_PATH = `${WORK_DIR_PATH}/icons`;
const ICONS_METADATA_FILE_PATH = `${ICONS_DIR_PATH}/icons.json`;
const ICONS_ZIP_FILE_PATH = 'src/icons/icons.zip';

const GITHUB_DOMAIN = 'https://github.com';

const REMIX_ICON_REPO = 'Remix-Design/RemixIcon';
const REMIX_ICON_TAG = '4.5.0';
const REMIX_ICON_DIR_PATH = `${WORK_DIR_PATH}/RemixIcon-${REMIX_ICON_TAG}`;
const REMIX_ICON_TAGS_FILE_PATH = `${REMIX_ICON_DIR_PATH}/tags.json`;
const REMIX_ICON_ICONS_DIR_PATH = `${REMIX_ICON_DIR_PATH}/icons`;

const SIMPLE_ICONS_REPO = 'simple-icons/simple-icons';
const SIMPLE_ICONS_TAG = '13.16.0';
const SIMPLE_ICONS_DIR_PATH = `${WORK_DIR_PATH}/simple-icons-${SIMPLE_ICONS_TAG}`;
const SIMPLE_ICONS_DATA_FILE_PATH = `${SIMPLE_ICONS_DIR_PATH}/_data/simple-icons.json`;
const SIMPLE_ICONS_ICONS_DIR_PATH = `${SIMPLE_ICONS_DIR_PATH}/icons`;

type IconMetadata = {
  categories: IconCategory[];
  icons: Record<string, Icon>;
};

type Icon = {
  id: string;
  name: string;
  code: string;
  tags: string[];
};

type IconCategory = {
  id: string;
  name: string;
  icons: string[];
};

const generateIconId = () => {
  return ulid().toLowerCase() + 'ic';
};

const downloadRemixIconRepo = async () => {
  console.log(`Downloading remix icon repo`);
  const url = `${GITHUB_DOMAIN}/${REMIX_ICON_REPO}/archive/refs/tags/v${REMIX_ICON_TAG}.zip`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }

  if (fs.existsSync(REMIX_ICON_DIR_PATH)) {
    fs.rmSync(REMIX_ICON_DIR_PATH, { recursive: true });
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
  console.log(`Downloaded remix icon repo`);
};

const downloadSimpleIconsRepo = async () => {
  console.log(`Downloading simple icons repo`);
  const url = `${GITHUB_DOMAIN}/${SIMPLE_ICONS_REPO}/archive/refs/tags/${SIMPLE_ICONS_TAG}.zip`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }

  if (fs.existsSync(SIMPLE_ICONS_DIR_PATH)) {
    fs.rmSync(SIMPLE_ICONS_DIR_PATH, { recursive: true });
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
  console.log(`Downloaded simple icons repo`);
};

const readMetadata = (): IconMetadata => {
  if (!fs.existsSync(ICONS_METADATA_FILE_PATH)) {
    return { categories: [], icons: {} };
  }

  return JSON.parse(
    fs.readFileSync(ICONS_METADATA_FILE_PATH, 'utf-8')
  ) as IconMetadata;
};

const generateIconsDir = async () => {
  console.log(`Generating icons dir`);
  const existingMetadata = readMetadata();

  const result: IconMetadata = {
    categories: [],
    icons: {},
  };

  console.log('Generating remix icons');
  const remixIconTags = JSON.parse(
    fs.readFileSync(REMIX_ICON_TAGS_FILE_PATH, 'utf-8')
  ) as Record<string, Record<string, string>>;

  const categoryDirs = fs.readdirSync(REMIX_ICON_ICONS_DIR_PATH);
  for (const categoryDir of categoryDirs) {
    const categoryId = categoryDir.toLowerCase().replace(/\s+/g, '-');
    const category: IconCategory = {
      id: categoryId,
      name: categoryDir,
      icons: [],
    };

    const categoryTags = remixIconTags[categoryDir] ?? {};

    const iconFiles = fs.readdirSync(
      `${REMIX_ICON_ICONS_DIR_PATH}/${categoryDir}`
    );
    for (const iconFile of iconFiles) {
      const fileName = iconFile.replace('.svg', '');
      if (fileName.endsWith('-fill')) {
        continue;
      }

      const iconName = fileName.replace('-line', '');
      const iconCode = `ri-${iconName}`;

      const existingIcon = Object.values(existingMetadata.icons).find(
        (icon) => icon.code === iconCode
      );

      const iconTags = new Set<string>(iconName.split('-'));
      if (categoryTags[iconName]) {
        const extraTags = categoryTags[iconName].split(',');
        for (const extraTag of extraTags) {
          // Only accept tags that contain English letters (a-z, A-Z)
          const isEnglish = /^[a-zA-Z]+$/.test(extraTag.trim());
          if (isEnglish) {
            iconTags.add(extraTag);
          }
        }
      }

      const iconId = existingIcon ? existingIcon.id : generateIconId();
      const icon: Icon = {
        id: iconId,
        name: iconName,
        code: iconCode,
        tags: Array.from(iconTags),
      };

      result.icons[iconId] = icon;
      category.icons.push(iconId);

      const sourceFilePath = `${REMIX_ICON_ICONS_DIR_PATH}/${categoryDir}/${iconFile}`;
      const targetFilePath = `${ICONS_DIR_PATH}/${iconId}.svg`;
      if (!fs.existsSync(targetFilePath)) {
        fs.copyFileSync(sourceFilePath, targetFilePath);
      }
    }

    result.categories.push(category);
  }

  const logosCategory: IconCategory = {
    id: 'logos',
    name: 'Logos',
    icons: [],
  };

  console.log('Generating simple icons');
  const simpleIconsData = JSON.parse(
    fs.readFileSync(SIMPLE_ICONS_DATA_FILE_PATH, 'utf-8')
  ) as SimpleIconsData;

  for (const simpleIcon of simpleIconsData.icons) {
    const simpleIconTitle = simpleIcon.title;
    const simpleIconSlug =
      simpleIcon.slug ?? simpleIconTitleToSlug(simpleIconTitle);

    const iconCode = `si-${simpleIconSlug}`;

    const existingIcon = Object.values(existingMetadata.icons).find(
      (icon) => icon.code === iconCode
    );

    const iconTags = new Set<string>([
      simpleIconTitle.toLowerCase(),
      simpleIconSlug,
    ]);

    const iconId = existingIcon ? existingIcon.id : generateIconId();
    const icon: Icon = {
      id: iconId,
      name: simpleIconTitle,
      code: iconCode,
      tags: Array.from(iconTags),
    };

    result.icons[iconId] = icon;
    logosCategory.icons.push(iconId);

    const sourceFilePath = `${SIMPLE_ICONS_ICONS_DIR_PATH}/${simpleIconSlug}.svg`;
    const targetFilePath = `${ICONS_DIR_PATH}/${iconId}.svg`;
    if (!fs.existsSync(targetFilePath)) {
      fs.copyFileSync(sourceFilePath, targetFilePath);
    }
  }

  result.categories.push(logosCategory);

  fs.writeFileSync(ICONS_METADATA_FILE_PATH, JSON.stringify(result, null, 2));
  console.log(`Generated icons dir`);
};

const zipIcons = async () => {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ICONS_ZIP_FILE_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zipped ${archive.pointer()} total bytes`);
      resolve(void 0);
    });

    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(ICONS_DIR_PATH, false);
    archive.finalize();
  });
  console.log(`Zipped icons`);
};

const generateIcons = async () => {
  if (!fs.existsSync(WORK_DIR_PATH)) {
    fs.mkdirSync(WORK_DIR_PATH);
  }

  if (!fs.existsSync(ICONS_DIR_PATH)) {
    fs.mkdirSync(ICONS_DIR_PATH);
  }

  await downloadRemixIconRepo();
  await downloadSimpleIconsRepo();

  generateIconsDir();
  await zipIcons();

  console.log(`Cleaning up`);
  fs.rmSync(WORK_DIR_PATH, { recursive: true });
  console.log(`All done`);
};

generateIcons();
