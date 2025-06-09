import fs from 'fs';
import path from 'path';

import AdmZip from 'adm-zip';
import SQLite from 'better-sqlite3';
import ky from 'ky';
import SvgSprite from 'svg-sprite';

import { generateId, IdType } from '@colanode/core';

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

const WORK_DIR_PATH = path.resolve('src', 'icons', 'temp');

const ASSETS_DIR_PATH = path.resolve('..', 'assets');
const ICONS_DIR_PATH = path.resolve(ASSETS_DIR_PATH, 'icons');

const DATABASE_PATH = path.resolve(ICONS_DIR_PATH, 'icons.db');
const MIN_DATABASE_PATH = path.resolve(ICONS_DIR_PATH, 'icons.min.db');
const SPRITE_PATH = path.resolve(ICONS_DIR_PATH, 'icons.svg');

const REMIX_ICON_REPO = 'Remix-Design/RemixIcon';
const REMIX_ICON_TAG = '4.6.0';
const REMIX_ICON_DIR_PATH = path.join(
  WORK_DIR_PATH,
  `RemixIcon-${REMIX_ICON_TAG}`
);
const REMIX_ICON_TAGS_FILE_PATH = path.join(REMIX_ICON_DIR_PATH, 'tags.json');
const REMIX_ICON_ICONS_DIR_PATH = path.join(REMIX_ICON_DIR_PATH, 'icons');

const SIMPLE_ICONS_REPO = 'simple-icons/simple-icons';
const SIMPLE_ICONS_TAG = '14.13.0';
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

const CREATE_CATEGORIES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    count INTEGER NOT NULL,
    display_order INTEGER NOT NULL
  );
`;

const CREATE_ICONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS icons (
    id TEXT PRIMARY KEY,
    category_id TEXT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    tags TEXT,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );
`;

const CREATE_ICON_SVGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS icon_svgs (
    id TEXT PRIMARY KEY,
    svg BLOB NOT NULL
  );
`;

const CREATE_ICON_SEARCH_TABLE_SQL = `
  CREATE VIRTUAL TABLE IF NOT EXISTS icon_search
  USING fts5(
    id UNINDEXED,
    text
  );
`;

const CREATE_ICON_CATEGORY_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_icons_category_id ON icons(category_id);
`;

const UPSERT_CATEGORY_SQL = `
  INSERT INTO categories (id, name, count, display_order)
  VALUES (@id, @name, @count, @display_order)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,
    count=excluded.count,
    display_order=excluded.display_order
`;

const UPSERT_ICON_SQL = `
  INSERT INTO icons (id, category_id, code, name, tags)
  VALUES (@id, @category_id, @code, @name, @tags)
  ON CONFLICT(id) DO UPDATE SET
    category_id=excluded.category_id,
    code=excluded.code,
    name=excluded.name,
    tags=excluded.tags
`;

const DELETE_SEARCH_SQL = `
  DELETE FROM icon_search WHERE id = @id
`;

const INSERT_SEARCH_SQL = `
  INSERT INTO icon_search (id, text)
  VALUES (@id, @text)
`;

const UPSERT_SVG_SQL = `
  INSERT OR REPLACE INTO icon_svgs (id, svg)
  VALUES (@id, @svg)
`;

const downloadZipAndExtract = async (url: string, dir: string) => {
  const response = await ky.get(url);
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

  db.exec(CREATE_CATEGORIES_TABLE_SQL);
  db.exec(CREATE_ICONS_TABLE_SQL);
  db.exec(CREATE_ICON_CATEGORY_INDEX_SQL);
  db.exec(CREATE_ICON_SVGS_TABLE_SQL);
  db.exec(CREATE_ICON_SEARCH_TABLE_SQL);

  return db;
};

const initMinDatabase = () => {
  if (fs.existsSync(MIN_DATABASE_PATH)) {
    fs.unlinkSync(MIN_DATABASE_PATH);
  }

  const db = new SQLite(MIN_DATABASE_PATH);

  db.exec(CREATE_CATEGORIES_TABLE_SQL);
  db.exec(CREATE_ICONS_TABLE_SQL);
  db.exec(CREATE_ICON_CATEGORY_INDEX_SQL);
  db.exec(CREATE_ICON_SEARCH_TABLE_SQL);

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

const processIcons = (
  database: SQLite.Database,
  minDatabase: SQLite.Database
) => {
  console.log('Processing icons...');

  const sprite = new SvgSprite({
    mode: {
      symbol: {
        dest: SPRITE_PATH,
      },
    },
  });

  const upsertCategory = database.prepare(UPSERT_CATEGORY_SQL);
  const upsertCategoryMin = minDatabase.prepare(UPSERT_CATEGORY_SQL);

  const upsertIcon = database.prepare(UPSERT_ICON_SQL);
  const upsertIconMin = minDatabase.prepare(UPSERT_ICON_SQL);

  const deleteSearch = database.prepare(DELETE_SEARCH_SQL);
  const deleteSearchMin = minDatabase.prepare(DELETE_SEARCH_SQL);

  const insertSearch = database.prepare(INSERT_SEARCH_SQL);
  const insertSearchMin = minDatabase.prepare(INSERT_SEARCH_SQL);

  const upsertSvg = database.prepare(UPSERT_SVG_SQL);

  const existing = readExistingMetadata(database);

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

    upsertCategory.run({
      id: catId,
      name: category,
      count: relevantFiles.length,
      display_order: displayOrder,
    });
    upsertCategoryMin.run({
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

      if (!existingIcon) {
        console.log(`New remix icon: ${iconCode} (${iconName})`);
      }

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

      upsertIcon.run({
        id: newIcon.id,
        category_id: catId,
        code: newIcon.code,
        name: newIcon.name,
        tags: JSON.stringify(newIcon.tags),
      });
      upsertIconMin.run({
        id: newIcon.id,
        category_id: catId,
        code: newIcon.code,
        name: newIcon.name,
        tags: JSON.stringify(newIcon.tags),
      });

      deleteSearch.run({ id: newIcon.id });
      deleteSearchMin.run({ id: newIcon.id });

      insertSearch.run({
        id: newIcon.id,
        text: [newIcon.name, ...newIcon.tags].join(' '),
      });
      insertSearchMin.run({
        id: newIcon.id,
        text: [newIcon.name, ...newIcon.tags].join(' '),
      });

      const svgPath = path.join(REMIX_ICON_ICONS_DIR_PATH, category, file);
      if (fs.existsSync(svgPath)) {
        const svgBuffer = fs.readFileSync(svgPath);

        upsertSvg.run({
          id: newIcon.id,
          svg: svgBuffer,
        });

        sprite.add(newIcon.id, null, svgBuffer.toString('utf-8'));
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

    if (!existingIcon) {
      console.log(`New simple icon: ${code} (${title})`);
    }

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

  upsertCategory.run({
    id: 'logos',
    name: 'Logos',
    count: logos.length,
    display_order: displayOrder,
  });
  upsertCategoryMin.run({
    id: 'logos',
    name: 'Logos',
    count: logos.length,
    display_order: displayOrder,
  });

  for (const logo of logos) {
    upsertIcon.run({
      id: logo.id,
      category_id: 'logos',
      code: logo.code,
      name: logo.name,
      tags: JSON.stringify(logo.tags),
    });
    upsertIconMin.run({
      id: logo.id,
      category_id: 'logos',
      code: logo.code,
      name: logo.name,
      tags: JSON.stringify(logo.tags),
    });

    deleteSearch.run({ id: logo.id });
    deleteSearchMin.run({ id: logo.id });

    insertSearch.run({
      id: logo.id,
      text: [logo.name, ...logo.tags].join(' '),
    });
    insertSearchMin.run({
      id: logo.id,
      text: [logo.name, ...logo.tags].join(' '),
    });

    const svgFile = path.join(
      SIMPLE_ICONS_ICONS_DIR_PATH,
      logo.code.replace('si-', '') + '.svg'
    );

    if (fs.existsSync(svgFile)) {
      const svgBuffer = fs.readFileSync(svgFile);

      upsertSvg.run({ id: logo.id, svg: svgBuffer });

      sprite.add(logo.id, null, svgBuffer.toString('utf-8'));
    }
  }

  console.log('Generating sprite...');
  sprite.compile((err, result) => {
    if (err) throw err;
    const sprite = result.symbol.sprite.contents.toString();
    fs.writeFileSync(SPRITE_PATH, sprite);
  });

  console.log('Done processing icons.');
};

const generateIcons = async () => {
  if (!fs.existsSync(WORK_DIR_PATH)) {
    fs.mkdirSync(WORK_DIR_PATH);
  }

  await downloadRemixIconRepo();
  await downloadSimpleIconsRepo();

  const db = initDatabase();
  const minDb = initMinDatabase();

  processIcons(db, minDb);

  console.log('Vacuuming databases...');
  db.exec('VACUUM');
  minDb.exec('VACUUM');

  console.log('Cleaning up...');
  fs.rmSync(WORK_DIR_PATH, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 1000,
  });

  console.log('All done.');
};

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
