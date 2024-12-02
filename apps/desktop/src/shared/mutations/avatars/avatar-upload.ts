export type AvatarUploadMutationInput = {
  type: 'avatar_upload';
  accountId: string;
  filePath: string;
};

export type AvatarUploadMutationOutput = {
  status: 'success' | 'error' | 'canceled';
  id: string | null;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    avatar_upload: {
      input: AvatarUploadMutationInput;
      output: AvatarUploadMutationOutput;
    };
  }
}
