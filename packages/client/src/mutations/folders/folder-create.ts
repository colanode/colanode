export type FolderCreateMutationInput = {
  type: 'folder.create';
  accountId: string;
  workspaceId: string;
  parentId: string;
  name: string;
  avatar?: string | null;
  generateIndex: boolean;
};

export type FolderCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'folder.create': {
      input: FolderCreateMutationInput;
      output: FolderCreateMutationOutput;
    };
  }
}
