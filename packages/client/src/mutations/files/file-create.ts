import { TempFile } from '@colanode/client/types';

export type FileCreateMutationInput = {
  type: 'file_create';
  accountId: string;
  workspaceId: string;
  parentId: string;
  file: TempFile;
};

export type FileCreateMutationOutput = {
  id: string | null;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    file_create: {
      input: FileCreateMutationInput;
      output: FileCreateMutationOutput;
    };
  }
}
