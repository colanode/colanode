import { IconCategory } from '@colanode/client/types/icons';

export type IconCategoryListQueryInput = {
  type: 'icon_category_list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    icon_category_list: {
      input: IconCategoryListQueryInput;
      output: IconCategory[];
    };
  }
}
