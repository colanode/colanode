import { LocalDatabaseViewNode } from '@colanode/client/types/nodes';

export type DatabaseViewListQueryInput = {
  type: 'database.view.list';
  userId: string;
  databaseId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'database.view.list': {
      input: DatabaseViewListQueryInput;
      output: LocalDatabaseViewNode[];
    };
  }
}
