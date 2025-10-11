export type MetadataDeleteMutationInput = {
  type: 'metadata.delete';
  namespace: string;
  key: string;
};

export type MetadataDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'metadata.delete': {
      input: MetadataDeleteMutationInput;
      output: MetadataDeleteMutationOutput;
    };
  }
}
