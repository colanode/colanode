export type UserStorageUpdateMutationInput = {
  type: 'user.storage.update';
  accountId: string;
  workspaceId: string;
  userId: string;
  storageLimit: string;
};

export type UserStorageUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'user.storage.update': {
      input: UserStorageUpdateMutationInput;
      output: UserStorageUpdateMutationOutput;
    };
  }
}
