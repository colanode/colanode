export type PageDeleteMutationInput = {
  type: 'page_delete';
  userId: string;
  pageId: string;
};

export type PageDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    page_delete: {
      input: PageDeleteMutationInput;
      output: PageDeleteMutationOutput;
    };
  }
}
