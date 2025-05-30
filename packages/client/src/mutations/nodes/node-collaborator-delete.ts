export type NodeCollaboratorDeleteMutationInput = {
  type: 'node_collaborator_delete';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  collaboratorId: string;
};

export type NodeCollaboratorDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    node_collaborator_delete: {
      input: NodeCollaboratorDeleteMutationInput;
      output: NodeCollaboratorDeleteMutationOutput;
    };
  }
}
