export type TabUpdateMutationInput = {
  type: 'tab.update';
  id: string;
  location?: string;
  index?: string;
};

export type TabUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'tab.update': {
      input: TabUpdateMutationInput;
      output: TabUpdateMutationOutput;
    };
  }
}
