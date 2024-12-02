export type AvatarUploadMutationInput = {
  type: 'avatar_upload';
  accountId: string;
  filePath: string;
};

export type AvatarUploadMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    avatar_upload: {
      input: AvatarUploadMutationInput;
      output: AvatarUploadMutationOutput;
    };
  }
}
