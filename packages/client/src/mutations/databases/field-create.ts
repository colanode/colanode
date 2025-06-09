import { FieldType } from '@colanode/core';

export type FieldCreateMutationInput = {
  type: 'field.create';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  name: string;
  fieldType: FieldType;
  relationDatabaseId?: string | null;
};

export type FieldCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'field.create': {
      input: FieldCreateMutationInput;
      output: FieldCreateMutationOutput;
    };
  }
}
