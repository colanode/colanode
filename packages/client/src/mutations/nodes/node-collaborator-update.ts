export type NodeCollaboratorUpdateMutationInput = {
  type: 'node_collaborator_update';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  collaboratorId: string;
  role: string;
};

export type NodeCollaboratorUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    node_collaborator_update: {
      input: NodeCollaboratorUpdateMutationInput;
      output: NodeCollaboratorUpdateMutationOutput;
    };
  }
}
