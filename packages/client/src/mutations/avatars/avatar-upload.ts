import { TempFile } from '@colanode/client/types';

export type AvatarUploadMutationInput = {
  type: 'avatar.upload';
  accountId: string;
  file: TempFile;
};

export type AvatarUploadMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'avatar.upload': {
      input: AvatarUploadMutationInput;
      output: AvatarUploadMutationOutput;
    };
  }
}
