export type PageUpdateMutationInput = {
  type: 'page_update';
  userId: string;
  pageId: string;
  avatar?: string | null;
  name: string;
};

export type PageUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    page_update: {
      input: PageUpdateMutationInput;
      output: PageUpdateMutationOutput;
    };
  }
}
