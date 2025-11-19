import { LocalDatabaseNode } from '@colanode/client/types/nodes';

export type DatabaseListQueryInput = {
  type: 'database.list';
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'database.list': {
      input: DatabaseListQueryInput;
      output: LocalDatabaseNode[];
    };
  }
}
