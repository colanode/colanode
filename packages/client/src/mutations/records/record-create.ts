import { FieldValue } from '@colanode/core';

export type RecordCreateMutationInput = {
  type: 'record.create';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  name?: string;
  fields?: Record<string, FieldValue>;
};

export type RecordCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'record.create': {
      input: RecordCreateMutationInput;
      output: RecordCreateMutationOutput;
    };
  }
}
