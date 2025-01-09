export type FileSaveTempMutationInput = {
  type: 'file_save_temp';
  userId: string;
  name: string;
  buffer: ArrayBuffer;
};

export type FileSaveTempMutationOutput = {
  path: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    file_save_temp: {
      input: FileSaveTempMutationInput;
      output: FileSaveTempMutationOutput;
    };
  }
}