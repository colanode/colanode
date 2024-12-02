export type NodeCollaboratorUpdateMutationInput = {
  type: 'node_collaborator_update';
  userId: string;
  nodeId: string;
  collaboratorId: string;
  role: string;
};

export type NodeCollaboratorUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    node_collaborator_update: {
      input: NodeCollaboratorUpdateMutationInput;
      output: NodeCollaboratorUpdateMutationOutput;
    };
  }
}
