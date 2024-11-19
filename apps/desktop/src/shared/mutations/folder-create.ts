export type FolderCreateMutationInput = {
  type: 'folder_create';
  userId: string;
  parentId: string;
  name: string;
  avatar: string | null;
  generateIndex: boolean;
};

export type FolderCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    folder_create: {
      input: FolderCreateMutationInput;
      output: FolderCreateMutationOutput;
    };
  }
}
