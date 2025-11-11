export type FolderDeleteMutationInput = {
  type: 'folder.delete';
  userId: string;
  folderId: string;
};

export type FolderDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'folder.delete': {
      input: FolderDeleteMutationInput;
      output: FolderDeleteMutationOutput;
    };
  }
}
