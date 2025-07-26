import { FileSubtype } from '@colanode/core';

export type TempFileCreateMutationInput = {
  type: 'temp.file.create';
  id: string;
  name: string;
  size: number;
  mimeType: string;
  subtype: FileSubtype;
  extension: string;
  path: string;
};

export type TempFileCreateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'temp.file.create': {
      input: TempFileCreateMutationInput;
      output: TempFileCreateMutationOutput;
    };
  }
}
