import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib';
import { mapBlocksToContents, mapContentsToBlocks } from '@colanode/client/lib/editor';
import { mapNode } from '@colanode/client/lib/mappers';
import {
    MessageForwardMutationInput,
    MessageForwardMutationOutput,
    MutationError,
    MutationErrorCode,
} from '@colanode/client/mutations';
import {
    generateId,
    IdType,
    MessageAttributes,
    Block,
} from '@colanode/core';

export class MessageForwardMutationHandler
    extends WorkspaceMutationHandlerBase
    implements MutationHandler<MessageForwardMutationInput> {
    async handleMutation(
        input: MessageForwardMutationInput
    ): Promise<MessageForwardMutationOutput> {
        const workspace = this.getWorkspace(input.userId);

        const row = await workspace.database
            .selectFrom('nodes')
            .where('nodes.id', '=', input.sourceMessageId)
            .where('nodes.type', '=', 'message')
            .selectAll('nodes')
            .executeTakeFirst();

        if (!row) {
            throw new MutationError(
                MutationErrorCode.MessageForwardFailed,
                'Source message not found.'
            );
        }

        const sourceNode = mapNode(row);
        if (sourceNode.type !== 'message') {
            throw new MutationError(
                MutationErrorCode.MessageForwardFailed,
                'Source node is not a message.'
            );
        }

        const newMessageId = generateId(IdType.Message);

        let newBlocks: Record<string, Block> = {};
        if (sourceNode.content) {
            const sourceBlocks = Object.values(sourceNode.content);
            // Drop file blocks — attachments are owned by the original message
            // and cannot be safely transferred in v1.
            const textOnlyBlocks = sourceBlocks.filter(
                (block) => block.type !== 'file'
            );
            const contents = mapBlocksToContents(
                input.sourceMessageId,
                textOnlyBlocks
            );
            newBlocks = mapContentsToBlocks(newMessageId, contents, new Map());
        }

        const attributes: MessageAttributes = {
            type: 'message',
            subtype: 'standard',
            parentId: input.targetParentId,
            content: newBlocks,
        };

        try {
            await workspace.nodes.createNode({
                id: newMessageId,
                attributes,
                parentId: input.targetParentId,
            });
        } catch {
            throw new MutationError(
                MutationErrorCode.MessageForwardFailed,
                'Failed to forward message.'
            );
        }

        return {
            id: newMessageId,
        };
    }
}
