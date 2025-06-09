export type NodeCollaboratorDeleteMutationInput = {
  type: 'node.collaborator.delete';
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
    'node.collaborator.delete': {
      input: NodeCollaboratorDeleteMutationInput;
      output: NodeCollaboratorDeleteMutationOutput;
    };
  }
}
