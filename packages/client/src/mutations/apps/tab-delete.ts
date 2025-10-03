export type TabDeleteMutationInput = {
  type: 'tab.delete';
  id: string;
};

export type TabDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'tab.delete': {
      input: TabDeleteMutationInput;
      output: TabDeleteMutationOutput;
    };
  }
}
