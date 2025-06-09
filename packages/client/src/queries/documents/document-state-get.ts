import { DocumentState } from '@colanode/client/types/documents';

export type DocumentStateGetQueryInput = {
  type: 'document.state.get';
  documentId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'document.state.get': {
      input: DocumentStateGetQueryInput;
      output: DocumentState | null;
    };
  }
}
