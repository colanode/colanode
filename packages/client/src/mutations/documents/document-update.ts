export type DocumentUpdateMutationInput = {
  type: 'document.update';
  accountId: string;
  workspaceId: string;
  documentId: string;
  update: string;
};

export type DocumentUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'document.update': {
      input: DocumentUpdateMutationInput;
      output: DocumentUpdateMutationOutput;
    };
  }
}
