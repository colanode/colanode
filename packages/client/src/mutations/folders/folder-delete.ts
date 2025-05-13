export type FolderDeleteMutationInput = {
  type: 'folder_delete';
  accountId: string;
  workspaceId: string;
  folderId: string;
};

export type FolderDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    folder_delete: {
      input: FolderDeleteMutationInput;
      output: FolderDeleteMutationOutput;
    };
  }
}
