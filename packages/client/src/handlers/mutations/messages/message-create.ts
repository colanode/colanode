import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib';
import { mapContentsToBlocks } from '@colanode/client/lib/editor';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
} from '@colanode/client/mutations';
import {
  EditorNodeTypes,
  generateId,
  IdType,
  MessageAttributes,
} from '@colanode/core';

interface MessageFile {
  id: string;
  path: string;
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
      if (block.type === EditorNodeTypes.FilePlaceholder) {
        const path = block.attrs?.path;
        const fileId = generateId(IdType.File);

        filesToCreate.push({
          id: fileId,
          path: path,
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
      await workspace.files.createFile(file.id, messageId, file.path);
    }

    return {
      id: messageId,
    };
  }
}
