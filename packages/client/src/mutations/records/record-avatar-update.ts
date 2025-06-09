export type RecordAvatarUpdateMutationInput = {
  type: 'record.avatar.update';
  accountId: string;
  workspaceId: string;
  recordId: string;
  avatar: string;
};

export type RecordAvatarUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'record.avatar.update': {
      input: RecordAvatarUpdateMutationInput;
      output: RecordAvatarUpdateMutationOutput;
    };
  }
}
