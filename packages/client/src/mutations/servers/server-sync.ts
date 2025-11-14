export type ServerSyncMutationInput = {
  type: 'server.sync';
  domain: string;
};

export type ServerSyncMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'server.sync': {
      input: ServerSyncMutationInput;
      output: ServerSyncMutationOutput;
    };
  }
}
