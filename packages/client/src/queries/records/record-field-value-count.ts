import { DatabaseViewFilterAttributes } from '@colanode/core';

export type RecordFieldValueCountQueryInput = {
  type: 'record.field.value.count';
  databaseId: string;
  filters: DatabaseViewFilterAttributes[];
  fieldId: string;
  accountId: string;
  workspaceId: string;
};

export type RecordFieldValueCount = {
  value: string;
  count: number;
};

export type RecordFieldValueCountQueryOutput = {
  items: RecordFieldValueCount[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'record.field.value.count': {
      input: RecordFieldValueCountQueryInput;
      output: RecordFieldValueCountQueryOutput;
    };
  }
}
