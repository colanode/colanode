import { Document } from '@colanode/client/types/documents';

export type DocumentGetQueryInput = {
  type: 'document.get';
  documentId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'document.get': {
      input: DocumentGetQueryInput;
      output: Document | null;
    };
  }
}
