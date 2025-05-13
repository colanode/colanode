export type AvatarUploadMutationInput = {
  type: 'avatar_upload';
  accountId: string;
  filePath: string;
};

export type AvatarUploadMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    avatar_upload: {
      input: AvatarUploadMutationInput;
      output: AvatarUploadMutationOutput;
    };
  }
}
