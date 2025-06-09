import { LocalRecordNode } from '@colanode/client/types/nodes';
import {
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
} from '@colanode/core';

export type RecordListQueryInput = {
  type: 'record.list';
  databaseId: string;
  filters: DatabaseViewFilterAttributes[];
  sorts: DatabaseViewSortAttributes[];
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'record.list': {
      input: RecordListQueryInput;
      output: LocalRecordNode[];
    };
  }
}
