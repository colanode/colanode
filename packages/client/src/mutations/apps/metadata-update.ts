export type MetadataUpdateMutationInput = {
  type: 'metadata.update';
  namespace: string;
  key: string;
  value: string;
};

export type MetadataUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'metadata.update': {
      input: MetadataUpdateMutationInput;
      output: MetadataUpdateMutationOutput;
    };
  }
}
