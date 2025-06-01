export type PageCreateMutationInput = {
  type: 'page_create';
  accountId: string;
  workspaceId: string;
  parentId: string;
  avatar?: string | null;
  name: string;
};

export type PageCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    page_create: {
      input: PageCreateMutationInput;
      output: PageCreateMutationOutput;
    };
  }
}
