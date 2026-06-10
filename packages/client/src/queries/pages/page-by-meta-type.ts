import { LocalPageNode } from '@colanode/client/types/nodes';

export type PageByMetaTypeQueryInput = {
  type: 'page.byMetaType';
  userId: string;
  metaTypeId: string;
  searchQuery?: string;
  exclude?: string[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'page.byMetaType': {
      input: PageByMetaTypeQueryInput;
      output: LocalPageNode[];
    };
  }
}
