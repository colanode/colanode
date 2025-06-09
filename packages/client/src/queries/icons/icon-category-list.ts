import { IconCategory } from '@colanode/client/types/icons';

export type IconCategoryListQueryInput = {
  type: 'icon.category.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'icon.category.list': {
      input: IconCategoryListQueryInput;
      output: IconCategory[];
    };
  }
}
