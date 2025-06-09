export type PageCreateMutationInput = {
  type: 'page.create';
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
    'page.create': {
      input: PageCreateMutationInput;
      output: PageCreateMutationOutput;
    };
  }
}
