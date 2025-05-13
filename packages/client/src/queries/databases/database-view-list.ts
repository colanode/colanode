import { LocalDatabaseViewNode } from '../../types/nodes';

export type DatabaseViewListQueryInput = {
  type: 'database_view_list';
  accountId: string;
  workspaceId: string;
  databaseId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    database_view_list: {
      input: DatabaseViewListQueryInput;
      output: LocalDatabaseViewNode[];
    };
  }
}
