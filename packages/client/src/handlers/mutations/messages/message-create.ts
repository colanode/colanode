import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib';
import { mapContentsToBlocks } from '@colanode/client/lib/editor';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
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

export class MessageCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MessageCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const messageId = generateId(IdType.Message);
    const editorContent = input.content.content ?? [];
    const blocks = mapContentsToBlocks(messageId, editorContent, new Map());
    const filesToCreate: MessageFile[] = [];

    // check if there are nested nodes (files, pages, folders etc.)
    for (const block of Object.values(blocks)) {
      if (block.type === EditorNodeTypes.TempFile) {
        const tempFileId = block.attrs?.id;
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

    const messageAttributes: MessageAttributes = {
      type: 'message',
      subtype: 'standard',
      parentId: input.parentId,
      content: blocks,
      referenceId: input.referenceId,
    };

    await workspace.nodes.createNode({
      id: messageId,
      attributes: messageAttributes,
      parentId: input.parentId,
    });

    for (const file of filesToCreate) {
      await workspace.files.createFile(file.id, file.tempFileId, messageId);
    }

    return {
      id: messageId,
    };
  }
}
