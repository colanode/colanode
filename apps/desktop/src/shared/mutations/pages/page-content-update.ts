import { JSONContent } from '@tiptap/core';

export type PageContentUpdateMutationInput = {
  type: 'page_content_update';
  userId: string;
  pageId: string;
  content: JSONContent;
};

export type PageContentUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    page_content_update: {
      input: PageContentUpdateMutationInput;
      output: PageContentUpdateMutationOutput;
    };
  }
}
