export type PageDeleteMutationInput = {
  type: 'page.delete';
  accountId: string;
  workspaceId: string;
  pageId: string;
};

export type PageDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'page.delete': {
      input: PageDeleteMutationInput;
      output: PageDeleteMutationOutput;
    };
  }
}
