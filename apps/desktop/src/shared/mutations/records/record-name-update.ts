export type RecordNameUpdateMutationInput = {
  type: 'record_name_update';
  userId: string;
  recordId: string;
  name: string;
};

export type RecordNameUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    record_name_update: {
      input: RecordNameUpdateMutationInput;
      output: RecordNameUpdateMutationOutput;
    };
  }
}
