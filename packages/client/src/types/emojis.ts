export type Emoji = {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  tags: string[];
  emoticons: string[] | undefined;
  skins: EmojiSkin[];
};

export type EmojiCategory = {
  id: string;
  name: string;
  count: number;
  display_order: number;
};

export type EmojiSkin = {
  id: string;
  unified: string;
};

export type EmojiPickerRowData = EmojiPickerCategoryRow | EmojiPickerItemsRow;

export type EmojiPickerCategoryRow = {
  type: 'category';
  category: string;
};

export type EmojiPickerItemsRow = {
  type: 'items';
  category: string;
  page: number;
  count: number;
};
