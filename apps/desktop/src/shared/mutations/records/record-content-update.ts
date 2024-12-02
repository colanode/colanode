import { JSONContent } from '@tiptap/core';

export type RecordContentUpdateMutationInput = {
  type: 'record_content_update';
  userId: string;
  recordId: string;
  content: JSONContent;
};

export type RecordContentUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    record_content_update: {
      input: RecordContentUpdateMutationInput;
      output: RecordContentUpdateMutationOutput;
    };
  }
}
