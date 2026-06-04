export type MessageForwardMutationInput = {
    type: 'message.forward';
    userId: string;
    sourceMessageId: string;
    targetParentId: string;
};

export type MessageForwardMutationOutput = {
    id: string;
};

declare module '@colanode/client/mutations' {
    interface MutationMap {
        'message.forward': {
            input: MessageForwardMutationInput;
            output: MessageForwardMutationOutput;
        };
    }
}
