import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface IconCategoriesTable {
  id: ColumnType<string, never, never>;
  name: ColumnType<string, never, never>;
  count: ColumnType<number, never, never>;
  display_order: ColumnType<number, never, never>;
}

export type SelectIconCategory = Selectable<IconCategoriesTable>;
export type CreateIconCategory = Insertable<IconCategoriesTable>;
export type UpdateIconCategory = Updateable<IconCategoriesTable>;

interface IconsTable {
  id: ColumnType<string, never, never>;
  category_id: ColumnType<string, never, never>;
  code: ColumnType<string, never, never>;
  name: ColumnType<string, never, never>;
  tags: ColumnType<string, never, never>;
}

export type SelectIcon = Selectable<IconsTable>;
export type CreateIcon = Insertable<IconsTable>;
export type UpdateIcon = Updateable<IconsTable>;

interface IconSvgsTable {
  id: ColumnType<string, never, never>;
  svg: ColumnType<Buffer, never, never>;
}

export type SelectIconSvg = Selectable<IconSvgsTable>;
export type CreateIconSvg = Insertable<IconSvgsTable>;
export type UpdateIconSvg = Updateable<IconSvgsTable>;

interface IconSearchTable {
  id: ColumnType<string, never, never>;
  text: ColumnType<string, never, never>;
}

export type SelectIconSearch = Selectable<IconSearchTable>;
export type CreateIconSearch = Insertable<IconSearchTable>;
export type UpdateIconSearch = Updateable<IconSearchTable>;

export interface IconDatabaseSchema {
  icons: IconsTable;
  icon_svgs: IconSvgsTable;
  categories: IconCategoriesTable;
  icon_search: IconSearchTable;
}
