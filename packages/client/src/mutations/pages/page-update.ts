export type PageUpdateMutationInput = {
  type: 'page_update';
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
    page_update: {
      input: PageUpdateMutationInput;
      output: PageUpdateMutationOutput;
    };
  }
}
