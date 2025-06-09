import { LocalRecordNode } from '@colanode/client/types/nodes';

export type RecordSearchQueryInput = {
  type: 'record.search';
  searchQuery: string;
  accountId: string;
  workspaceId: string;
  databaseId: string;
  exclude?: string[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'record.search': {
      input: RecordSearchQueryInput;
      output: LocalRecordNode[];
    };
  }
}
