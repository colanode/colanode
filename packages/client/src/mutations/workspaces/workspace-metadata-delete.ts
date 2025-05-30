export type WorkspaceMetadataDeleteMutationInput = {
  type: 'workspace_metadata_delete';
  accountId: string;
  workspaceId: string;
  key: string;
};

export type WorkspaceMetadataDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    workspace_metadata_delete: {
      input: WorkspaceMetadataDeleteMutationInput;
      output: WorkspaceMetadataDeleteMutationOutput;
    };
  }
}
