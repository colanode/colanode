import AdmZip from 'adm-zip';
import fetch from 'node-fetch';
import SQLite from 'better-sqlite3';
import { generateId, IdType } from '@colanode/core';

import fs from 'fs';
import path from 'path';

type SimpleIconsItem = {
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

type Icon = {
  id: string;
  code: string;
  name: string;
  tags: string[];
};

type IconRow = {
  id: string;
  code: string;
  name: string;
  tags: string;
};

type IconCategory = {
  id: string;
  name: string;
  count: number;
  display_order: number;
};

const GITHUB_DOMAIN = 'https://github.com';

const WORK_DIR_PATH = 'src/icons/temp';
const DATABASE_PATH = 'src/icons/icons.db';

const REMIX_ICON_REPO = 'Remix-Design/RemixIcon';
const REMIX_ICON_TAG = '4.6.0';
const REMIX_ICON_DIR_PATH = path.join(
  WORK_DIR_PATH,
  `RemixIcon-${REMIX_ICON_TAG}`
);
const REMIX_ICON_TAGS_FILE_PATH = path.join(REMIX_ICON_DIR_PATH, 'tags.json');
const REMIX_ICON_ICONS_DIR_PATH = path.join(REMIX_ICON_DIR_PATH, 'icons');

const SIMPLE_ICONS_REPO = 'simple-icons/simple-icons';
const SIMPLE_ICONS_TAG = '14.3.0';
const SIMPLE_ICONS_DIR_PATH = path.join(
  WORK_DIR_PATH,
  `simple-icons-${SIMPLE_ICONS_TAG}`
);
const SIMPLE_ICONS_DATA_FILE_PATH = path.join(
  SIMPLE_ICONS_DIR_PATH,
  Number(SIMPLE_ICONS_TAG.split('.').at(0)) >= 15 ? 'data' : '_data',
  'simple-icons.json'
);
const SIMPLE_ICONS_ICONS_DIR_PATH = path.join(SIMPLE_ICONS_DIR_PATH, 'icons');

const downloadZipAndExtract = async (url: string, dir: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}`);

  const buffer = await response.arrayBuffer();
  const zip = new AdmZip(Buffer.from(buffer));
  zip.extractAllTo(dir, true);
};

const downloadRemixIconRepo = async () => {
  console.log('Downloading remix icon repo...');
  const url = `${GITHUB_DOMAIN}/${REMIX_ICON_REPO}/archive/refs/tags/v${REMIX_ICON_TAG}.zip`;

  await downloadZipAndExtract(url, WORK_DIR_PATH);
  console.log('Downloaded remix icon repo.');
};

const downloadSimpleIconsRepo = async () => {
  console.log('Downloading simple icons repo...');
  const url = `${GITHUB_DOMAIN}/${SIMPLE_ICONS_REPO}/archive/refs/tags/${SIMPLE_ICONS_TAG}.zip`;

  await downloadZipAndExtract(url, WORK_DIR_PATH);
  console.log('Downloaded simple icons repo.');
};

const initDatabase = () => {
  const db = new SQLite(DATABASE_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      count INTEGER NOT NULL,
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS icons (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      tags TEXT,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_icons_category_id ON icons(category_id);

    CREATE TABLE IF NOT EXISTS icon_svgs (
      id TEXT PRIMARY KEY,
      svg BLOB NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS icon_search
    USING fts5(
      id UNINDEXED,
      text
    );
  `);
  return db;
};

const readExistingMetadata = (db: SQLite.Database) => {
  const rows = db.prepare<unknown[], IconRow>('SELECT * FROM icons').all();

  const icons: Record<string, Icon> = {};

  for (const row of rows) {
    icons[row.id] = {
      id: row.id,
      code: row.code,
      name: row.name,
      tags: row.tags ? JSON.parse(row.tags) : [],
    };
  }

  const categoryRows = db
    .prepare<unknown[], IconCategory>('SELECT * FROM categories')
    .all();

  const categories: IconCategory[] = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    count: c.count,
    display_order: c.display_order,
  }));

  return { icons, categories };
};

const processIconsIntoDb = (db: SQLite.Database) => {
  console.log('Processing icons into database...');

  const insertOrUpdateCategory = db.prepare(`
    INSERT INTO categories (id, name, count, display_order)
    VALUES (@id, @name, @count, @display_order)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      count=excluded.count,
      display_order=excluded.display_order
  `);

  const insertOrUpdateIcon = db.prepare(`
    INSERT INTO icons (id, category_id, code, name, tags)
    VALUES (@id, @category_id, @code, @name, @tags)
    ON CONFLICT(id) DO UPDATE SET
      category_id=excluded.category_id,
      code=excluded.code,
      name=excluded.name,
      tags=excluded.tags
  `);

  const deleteSearch = db.prepare('DELETE FROM icon_search WHERE id = @id');

  const insertSearch = db.prepare(`
    INSERT INTO icon_search (id, text)
    VALUES (@id, @text)
  `);

  const insertOrReplaceSVG = db.prepare(`
    INSERT OR REPLACE INTO icon_svgs (id, svg)
    VALUES (@id, @svg)
  `);

  const existing = readExistingMetadata(db);

  const remixTags = JSON.parse(
    fs.readFileSync(REMIX_ICON_TAGS_FILE_PATH, 'utf-8')
  ) as Record<string, Record<string, string>>;

  const categories = fs.readdirSync(REMIX_ICON_ICONS_DIR_PATH);
  let maxDisplayOrder = 0;

  for (const category of categories) {
    const catId = category.toLowerCase().replace(/\s+/g, '-');
    const iconFiles = fs.readdirSync(
      path.join(REMIX_ICON_ICONS_DIR_PATH, category)
    );
    const relevantFiles = iconFiles.filter((f) => !f.endsWith('-fill.svg'));

    console.log(
      `Processing remix icon category: ${category} (${relevantFiles.length} icons)`
    );

    const existingCategory = existing.categories.find((c) => c.id === catId);
    const displayOrder = existingCategory
      ? existingCategory.display_order
      : maxDisplayOrder + 1;

    insertOrUpdateCategory.run({
      id: catId,
      name: category,
      count: relevantFiles.length,
      display_order: displayOrder,
    });

    if (displayOrder > maxDisplayOrder) {
      maxDisplayOrder = displayOrder;
    }

    for (const file of relevantFiles) {
      const iconName = file.replace('-line.svg', '').replace('.svg', '');
      const iconCode = `ri-${iconName}`;
      const existingIcon = Object.values(existing.icons).find(
        (i) => i.code === iconCode
      );

      const setOfTags = new Set<string>(iconName.split('-'));
      if (remixTags[category] && remixTags[category][iconName]) {
        const extra = remixTags[category][iconName].split(',');
        for (const t of extra) {
          if (/^[a-zA-Z]+$/.test(t.trim())) setOfTags.add(t);
        }
      }

      const iconId = existingIcon ? existingIcon.id : generateId(IdType.Icon);
      const newIcon: Icon = {
        id: iconId,
        code: iconCode,
        name: iconName,
        tags: Array.from(setOfTags),
      };

      insertOrUpdateIcon.run({
        id: newIcon.id,
        category_id: catId,
        code: newIcon.code,
        name: newIcon.name,
        tags: JSON.stringify(newIcon.tags),
      });

      deleteSearch.run({ id: newIcon.id });

      insertSearch.run({
        id: newIcon.id,
        text: [newIcon.name, ...newIcon.tags].join(' '),
      });

      const svgPath = path.join(REMIX_ICON_ICONS_DIR_PATH, category, file);
      if (fs.existsSync(svgPath)) {
        const svgBuffer = fs.readFileSync(svgPath);
        insertOrReplaceSVG.run({
          id: newIcon.id,
          svg: svgBuffer,
        });
      }
    }
  }

  console.log('Processing simple icons...');
  const simpleData = JSON.parse(
    fs.readFileSync(SIMPLE_ICONS_DATA_FILE_PATH, 'utf-8')
  ) as SimpleIconsItem[];

  const logos: Icon[] = [];
  for (const item of simpleData) {
    const title = item.title;
    const slug = item.slug || simpleIconTitleToSlug(title);
    const code = `si-${slug}`;
    const existingIcon = Object.values(existing.icons).find(
      (i) => i.code === code
    );

    const setOfTags = new Set<string>([title.toLowerCase(), slug]);

    const iconId = existingIcon ? existingIcon.id : generateId(IdType.Icon);
    const newIcon: Icon = {
      id: iconId,
      code,
      name: title,
      tags: Array.from(setOfTags),
    };
    logos.push(newIcon);
  }

  const existingCategory = existing.categories.find((c) => c.id === 'logos');
  const displayOrder = existingCategory
    ? existingCategory.display_order
    : maxDisplayOrder + 1;

  insertOrUpdateCategory.run({
    id: 'logos',
    name: 'Logos',
    count: logos.length,
    display_order: displayOrder,
  });

  for (const logo of logos) {
    insertOrUpdateIcon.run({
      id: logo.id,
      category_id: 'logos',
      code: logo.code,
      name: logo.name,
      tags: JSON.stringify(logo.tags),
    });

    deleteSearch.run({ id: logo.id });

    insertSearch.run({
      id: logo.id,
      text: [logo.name, ...logo.tags].join(' '),
    });

    const svgFile = path.join(
      SIMPLE_ICONS_ICONS_DIR_PATH,
      logo.code.replace('si-', '') + '.svg'
    );

    if (fs.existsSync(svgFile)) {
      const svgBuffer = fs.readFileSync(svgFile);
      insertOrReplaceSVG.run({ id: logo.id, svg: svgBuffer });
    }
  }
  console.log('Done processing icons into database.');
};

const generateIcons = async () => {
  if (!fs.existsSync(WORK_DIR_PATH)) {
    fs.mkdirSync(WORK_DIR_PATH);
  }

  await downloadRemixIconRepo();
  await downloadSimpleIconsRepo();

  const db = initDatabase();
  processIconsIntoDb(db);

  console.log('Cleaning up...');
  fs.rmSync(WORK_DIR_PATH, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 1000,
  });

  console.log("All done. The 'icons.db' file now contains everything!");
};

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
