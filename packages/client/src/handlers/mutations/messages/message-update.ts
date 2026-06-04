import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib';
import { mapContentsToBlocks } from '@colanode/client/lib/editor';
import {
    MessageUpdateMutationInput,
    MessageUpdateMutationOutput,
    MutationError,
    MutationErrorCode,
} from '@colanode/client/mutations';
import {
    EditorNodeTypes,
    generateId,
    IdType,
    MessageAttributes,
} from '@colanode/core';

interface MessageFile {
    id: string;
    tempFileId: string;
}

export class MessageUpdateMutationHandler
    extends WorkspaceMutationHandlerBase
    implements MutationHandler<MessageUpdateMutationInput> {
    async handleMutation(
        input: MessageUpdateMutationInput
    ): Promise<MessageUpdateMutationOutput> {
        const workspace = this.getWorkspace(input.userId);

        const editorContent = input.content.content ?? [];
        const filesToCreate: MessageFile[] = [];

        const result = await workspace.nodes.updateNode<MessageAttributes>(
            input.messageId,
            (attributes) => {
                if (attributes.type !== 'message') {
                    throw new MutationError(
                        MutationErrorCode.MessageUpdateForbidden,
                        'Node is not a message.'
                    );
                }

                const indexMap = new Map<string, string>();
                if (attributes.content) {
                    for (const block of Object.values(attributes.content)) {
                        indexMap.set(block.id, block.index);
                    }
                }

                const blocks = mapContentsToBlocks(
                    input.messageId,
                    editorContent,
                    indexMap
                );

                for (const block of Object.values(blocks)) {
                    if (block.type === EditorNodeTypes.TempFile) {
                        const tempFileId = block.id;
                        if (!tempFileId) {
                            throw new MutationError(
                                MutationErrorCode.FileInvalid,
                                'File is invalid or could not be read.'
                            );
                        }

                        const fileId = generateId(IdType.File);

                        filesToCreate.push({
                            id: fileId,
                            tempFileId,
                        });

                        block.id = fileId;
                        block.type = 'file';
                        block.attrs = null;
                    }
                }

                return {
                    ...attributes,
                    content: blocks,
                };
            }
        );

        if (result !== 'success') {
            throw new MutationError(
                result === 'unauthorized'
                    ? MutationErrorCode.MessageUpdateForbidden
                    : MutationErrorCode.MessageUpdateFailed,
                'Failed to update message.'
            );
        }

        for (const file of filesToCreate) {
            await workspace.files.createFile(
                file.id,
                file.tempFileId,
                input.messageId
            );
        }

        return {
            success: true,
        };
    }
}
