export type PageCreateMutationInput = {
  type: 'page_create';
  userId: string;
  parentId: string;
  avatar?: string | null;
  name: string;
  generateIndex: boolean;
};

export type PageCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    page_create: {
      input: PageCreateMutationInput;
      output: PageCreateMutationOutput;
    };
  }
}
