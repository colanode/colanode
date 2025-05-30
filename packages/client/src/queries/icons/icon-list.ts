import { Icon } from '@colanode/client/types/icons';

export type IconListQueryInput = {
  type: 'icon_list';
  category: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    icon_list: {
      input: IconListQueryInput;
      output: Icon[];
    };
  }
}
