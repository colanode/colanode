export type FileSaveTempMutationInput = {
  type: 'file.save.temp';
  accountId: string;
  workspaceId: string;
  name: string;
  buffer: ArrayBuffer;
};

export type FileSaveTempMutationOutput = {
  path: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'file.save.temp': {
      input: FileSaveTempMutationInput;
      output: FileSaveTempMutationOutput;
    };
  }
}
