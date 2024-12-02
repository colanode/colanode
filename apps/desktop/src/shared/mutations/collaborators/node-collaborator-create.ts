export type NodeCollaboratorCreateMutationInput = {
  type: 'node_collaborator_create';
  userId: string;
  nodeId: string;
  collaboratorIds: string[];
  role: string;
};

export type NodeCollaboratorCreateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    node_collaborator_create: {
      input: NodeCollaboratorCreateMutationInput;
      output: NodeCollaboratorCreateMutationOutput;
    };
  }
}
