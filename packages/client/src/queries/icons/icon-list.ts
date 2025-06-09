import { Icon } from '@colanode/client/types/icons';

export type IconListQueryInput = {
  type: 'icon.list';
  category: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'icon.list': {
      input: IconListQueryInput;
      output: Icon[];
    };
  }
}
