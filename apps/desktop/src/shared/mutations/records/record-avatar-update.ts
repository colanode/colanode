export type RecordAvatarUpdateMutationInput = {
  type: 'record_avatar_update';
  userId: string;
  recordId: string;
  avatar: string;
};

export type RecordAvatarUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    record_avatar_update: {
      input: RecordAvatarUpdateMutationInput;
      output: RecordAvatarUpdateMutationOutput;
    };
  }
}
