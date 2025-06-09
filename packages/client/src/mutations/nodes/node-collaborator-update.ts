export type NodeCollaboratorUpdateMutationInput = {
  type: 'node.collaborator.update';
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
    'node.collaborator.update': {
      input: NodeCollaboratorUpdateMutationInput;
      output: NodeCollaboratorUpdateMutationOutput;
    };
  }
}
