import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib';
import {
    MessagePinMutationInput,
    MessagePinMutationOutput,
    MutationError,
    MutationErrorCode,
} from '@colanode/client/mutations';
import { MessageAttributes } from '@colanode/core';

export class MessagePinMutationHandler
    extends WorkspaceMutationHandlerBase
    implements MutationHandler<MessagePinMutationInput> {
    async handleMutation(
        input: MessagePinMutationInput
    ): Promise<MessagePinMutationOutput> {
        const workspace = this.getWorkspace(input.userId);

        const result = await workspace.nodes.updateNode<MessageAttributes>(
            input.messageId,
            (attributes) => {
                if (attributes.type !== 'message') {
                    throw new MutationError(
                        MutationErrorCode.MessagePinForbidden,
                        'Node is not a message.'
                    );
                }

                return {
                    ...attributes,
                    pinnedAt: input.pinned ? new Date().toISOString() : null,
                    pinnedBy: input.pinned ? input.userId : null,
                };
            }
        );

        if (result !== 'success') {
            throw new MutationError(
                result === 'unauthorized'
                    ? MutationErrorCode.MessagePinForbidden
                    : MutationErrorCode.MessagePinFailed,
                'Failed to pin message.'
            );
        }

        return {
            success: true,
        };
    }
}
