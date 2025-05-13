export type RecordNameUpdateMutationInput = {
  type: 'record_name_update';
  accountId: string;
  workspaceId: string;
  recordId: string;
  name: string;
};

export type RecordNameUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    record_name_update: {
      input: RecordNameUpdateMutationInput;
      output: RecordNameUpdateMutationOutput;
    };
  }
}
