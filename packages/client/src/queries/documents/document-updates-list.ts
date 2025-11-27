import { DocumentUpdate } from '@colanode/client/types/documents';

export type DocumentUpdatesListQueryInput = {
  type: 'document.updates.list';
  documentId: string;
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'document.updates.list': {
      input: DocumentUpdatesListQueryInput;
      output: DocumentUpdate[];
    };
  }
}
