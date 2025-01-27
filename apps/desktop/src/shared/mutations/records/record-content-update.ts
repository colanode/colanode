import { JSONContent } from '@tiptap/core';

export type RecordContentUpdateMutationInput = {
  type: 'record_content_update';
  accountId: string;
  workspaceId: string;
  recordId: string;
  before: JSONContent;
  after: JSONContent;
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
