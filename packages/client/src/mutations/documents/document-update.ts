export type DocumentUpdateMutationInput = {
  type: 'document.update';
  userId: string;
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
