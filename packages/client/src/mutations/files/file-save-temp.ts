export type FileSaveTempMutationInput = {
  type: 'file_save_temp';
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
    file_save_temp: {
      input: FileSaveTempMutationInput;
      output: FileSaveTempMutationOutput;
    };
  }
}
