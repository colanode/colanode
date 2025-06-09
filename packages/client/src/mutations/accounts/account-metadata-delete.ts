export type AccountMetadataDeleteMutationInput = {
  type: 'account.metadata.delete';
  accountId: string;
  key: string;
};

export type AccountMetadataDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'account.metadata.delete': {
      input: AccountMetadataDeleteMutationInput;
      output: AccountMetadataDeleteMutationOutput;
    };
  }
}
