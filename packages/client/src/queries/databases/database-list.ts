import { LocalDatabaseNode } from '@colanode/client/types/nodes';

export type DatabaseListQueryInput = {
  type: 'database_list';
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    database_list: {
      input: DatabaseListQueryInput;
      output: LocalDatabaseNode[];
    };
  }
}
