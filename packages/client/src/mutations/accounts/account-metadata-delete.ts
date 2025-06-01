export type AccountMetadataDeleteMutationInput = {
  type: 'account_metadata_delete';
  accountId: string;
  key: string;
};

export type AccountMetadataDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    account_metadata_delete: {
      input: AccountMetadataDeleteMutationInput;
      output: AccountMetadataDeleteMutationOutput;
    };
  }
}
