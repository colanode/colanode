import { LocalRecordNode } from '../../types/nodes';

export type RecordSearchQueryInput = {
  type: 'record_search';
  searchQuery: string;
  accountId: string;
  workspaceId: string;
  databaseId: string;
  exclude?: string[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    record_search: {
      input: RecordSearchQueryInput;
      output: LocalRecordNode[];
    };
  }
}
