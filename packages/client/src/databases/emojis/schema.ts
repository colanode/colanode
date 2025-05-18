import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface EmojiCategoriesTable {
  id: ColumnType<string, never, never>;
  name: ColumnType<string, never, never>;
  count: ColumnType<number, never, never>;
  display_order: ColumnType<number, never, never>;
}

export type SelectEmojiCategory = Selectable<EmojiCategoriesTable>;
export type CreateEmojiCategory = Insertable<EmojiCategoriesTable>;
export type UpdateEmojiCategory = Updateable<EmojiCategoriesTable>;

interface EmojisTable {
  id: ColumnType<string, never, never>;
  category_id: ColumnType<string, never, never>;
  code: ColumnType<string, never, never>;
  name: ColumnType<string, never, never>;
  tags: ColumnType<string, never, never>;
  emoticons: ColumnType<string, never, never>;
  skins: ColumnType<string, never, never>;
}

export type SelectEmoji = Selectable<EmojisTable>;
export type CreateEmoji = Insertable<EmojisTable>;
export type UpdateEmoji = Updateable<EmojisTable>;

interface EmojiSkinsTable {
  skin_id: ColumnType<string, never, never>;
  emoji_id: ColumnType<string, never, never>;
}

export type SelectEmojiSkin = Selectable<EmojiSkinsTable>;
export type CreateEmojiSkin = Insertable<EmojiSkinsTable>;
export type UpdateEmojiSkin = Updateable<EmojiSkinsTable>;

interface EmojiSearchTable {
  id: ColumnType<string, never, never>;
  text: ColumnType<string, never, never>;
}

export type SelectEmojiSearch = Selectable<EmojiSearchTable>;
export type CreateEmojiSearch = Insertable<EmojiSearchTable>;
export type UpdateEmojiSearch = Updateable<EmojiSearchTable>;

export interface EmojiDatabaseSchema {
  emojis: EmojisTable;
  emoji_skins: EmojiSkinsTable;
  categories: EmojiCategoriesTable;
  emoji_search: EmojiSearchTable;
}
