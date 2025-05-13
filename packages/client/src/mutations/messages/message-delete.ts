export type MessageDeleteMutationInput = {
  type: 'message_delete';
  accountId: string;
  workspaceId: string;
  messageId: string;
};

export type MessageDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    message_delete: {
      input: MessageDeleteMutationInput;
      output: MessageDeleteMutationOutput;
    };
  }
}
