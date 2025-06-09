export type RecordDeleteMutationInput = {
  type: 'record.delete';
  accountId: string;
  workspaceId: string;
  recordId: string;
};

export type RecordDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'record.delete': {
      input: RecordDeleteMutationInput;
      output: RecordDeleteMutationOutput;
    };
  }
}
