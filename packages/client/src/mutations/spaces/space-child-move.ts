export type SpaceChildMoveMutationInput = {
  type: 'space.child.move';
  accountId: string;
  workspaceId: string;
  spaceId: string;
  childId: string;
  after: string | null;
};

export type SpaceChildMoveMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'space.child.move': {
      input: SpaceChildMoveMutationInput;
      output: SpaceChildMoveMutationOutput;
    };
  }
}
