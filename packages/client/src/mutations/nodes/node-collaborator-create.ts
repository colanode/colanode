export type NodeCollaboratorCreateMutationInput = {
  type: 'node.collaborator.create';
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
    'node.collaborator.create': {
      input: NodeCollaboratorCreateMutationInput;
      output: NodeCollaboratorCreateMutationOutput;
    };
  }
}
