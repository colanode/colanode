import { Document } from '../../types/documents';

export type DocumentGetQueryInput = {
  type: 'document_get';
  documentId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    document_get: {
      input: DocumentGetQueryInput;
      output: Document | null;
    };
  }
}
