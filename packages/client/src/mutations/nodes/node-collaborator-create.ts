export type NodeCollaboratorCreateMutationInput = {
  type: 'node_collaborator_create';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  collaboratorIds: string[];
  role: string;
};

export type NodeCollaboratorCreateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    node_collaborator_create: {
      input: NodeCollaboratorCreateMutationInput;
      output: NodeCollaboratorCreateMutationOutput;
    };
  }
}
