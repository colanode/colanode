import { DocumentUpdate } from '@colanode/client/types/documents';

export type DocumentUpdatesListQueryInput = {
  type: 'document.updates.list';
  documentId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'document.updates.list': {
      input: DocumentUpdatesListQueryInput;
      output: DocumentUpdate[];
    };
  }
}
