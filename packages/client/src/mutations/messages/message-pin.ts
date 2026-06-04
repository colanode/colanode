export type MessagePinMutationInput = {
    type: 'message.pin';
    userId: string;
    messageId: string;
    pinned: boolean;
};

export type MessagePinMutationOutput = {
    success: boolean;
};

declare module '@colanode/client/mutations' {
    interface MutationMap {
        'message.pin': {
            input: MessagePinMutationInput;
            output: MessagePinMutationOutput;
        };
    }
}
