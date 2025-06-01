export type FolderUpdateMutationInput = {
  type: 'folder_update';
  accountId: string;
  workspaceId: string;
  folderId: string;
  name: string;
  avatar?: string | null;
};

export type FolderUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    folder_update: {
      input: FolderUpdateMutationInput;
      output: FolderUpdateMutationOutput;
    };
  }
}
