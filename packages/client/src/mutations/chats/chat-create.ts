export type ChatCreateMutationInput = {
  type: 'chat.create';
  userId: string;
  collaboratorId: string;
};

export type ChatCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'chat.create': {
      input: ChatCreateMutationInput;
      output: ChatCreateMutationOutput;
    };
  }
}
