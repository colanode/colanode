export type AppMetadataDeleteMutationInput = {
  type: 'app.metadata.delete';
  key: string;
};

export type AppMetadataDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'app.metadata.delete': {
      input: AppMetadataDeleteMutationInput;
      output: AppMetadataDeleteMutationOutput;
    };
  }
}
