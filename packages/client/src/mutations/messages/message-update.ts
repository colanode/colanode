import { JSONContent } from '@tiptap/core';

export type MessageUpdateMutationInput = {
    type: 'message.update';
    userId: string;
    messageId: string;
    content: JSONContent;
};

export type MessageUpdateMutationOutput = {
    success: boolean;
};

declare module '@colanode/client/mutations' {
    interface MutationMap {
        'message.update': {
            input: MessageUpdateMutationInput;
            output: MessageUpdateMutationOutput;
        };
    }
}
