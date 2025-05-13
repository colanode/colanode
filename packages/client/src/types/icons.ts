export type Icon = {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  tags: string[];
};

export type IconCategory = {
  id: string;
  name: string;
  count: number;
  display_order: number;
};

export type IconPickerRowData = IconPickerCategoryRow | IconPickerItemsRow;

export type IconPickerCategoryRow = {
  type: 'category';
  category: string;
};

export type IconPickerItemsRow = {
  type: 'items';
  category: string;
  page: number;
  count: number;
};
