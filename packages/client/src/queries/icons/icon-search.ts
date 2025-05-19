import { Icon } from '@colanode/client/types/icons';

export type IconSearchQueryInput = {
  type: 'icon_search';
  query: string;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    icon_search: {
      input: IconSearchQueryInput;
      output: Icon[];
    };
  }
}
