export type DocumentUpdateMutationInput = {
  type: 'document_update';
  accountId: string;
  workspaceId: string;
  documentId: string;
  update: Uint8Array;
};

export type DocumentUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    document_update: {
      input: DocumentUpdateMutationInput;
      output: DocumentUpdateMutationOutput;
    };
  }
}
