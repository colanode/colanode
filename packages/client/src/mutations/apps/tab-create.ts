export type TabCreateMutationInput = {
  type: 'tab.create';
  id: string;
  location: string;
  index: string;
};

export type TabCreateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'tab.create': {
      input: TabCreateMutationInput;
      output: TabCreateMutationOutput;
    };
  }
}
