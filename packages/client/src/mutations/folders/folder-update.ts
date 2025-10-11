export type FolderUpdateMutationInput = {
  type: 'folder.update';
  userId: string;
  folderId: string;
  name: string;
  avatar?: string | null;
};

export type FolderUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'folder.update': {
      input: FolderUpdateMutationInput;
      output: FolderUpdateMutationOutput;
    };
  }
}
