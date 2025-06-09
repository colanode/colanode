import { Icon } from '@colanode/client/types/icons';

export type IconSearchQueryInput = {
  type: 'icon.search';
  query: string;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'icon.search': {
      input: IconSearchQueryInput;
      output: Icon[];
    };
  }
}
