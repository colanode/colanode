export type PageUpdateMutationInput = {
  type: 'page.update';
  accountId: string;
  workspaceId: string;
  pageId: string;
  avatar?: string | null;
  name: string;
};

export type PageUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'page.update': {
      input: PageUpdateMutationInput;
      output: PageUpdateMutationOutput;
    };
  }
}
