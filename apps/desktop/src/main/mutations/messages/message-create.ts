import {
  Block,
  EditorNodeTypes,
  extractFileType,
  FileAttributes,
  generateId,
  IdType,
  MessageAttributes,
  NodeTypes,
} from '@colanode/core';

import { fileService } from '@/main/services/file-service';
import { CreateNodeInput, nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
} from '@/shared/mutations/messages/message-create';
import { MutationError } from '@/shared/mutations';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MessageCreateMutationOutput> {
    const inputs: CreateNodeInput[] = [];

    const messageContent = input.content.content ?? [];
    const messageId = generateId(IdType.Message);
    const createdAt = new Date().toISOString();
    const blocks = mapContentsToBlocks(messageId, messageContent, new Map());

    // check if there are nested nodes (files, pages, folders etc.)
    for (const block of blocks) {
      if (block.type === EditorNodeTypes.FilePlaceholder) {
        const path = block.attrs?.path;
        const metadata = fileService.getFileMetadata(path);
        if (!metadata) {
          throw new MutationError(
            'invalid_file',
            'File attachment is invalid or could not be read.'
          );
        }

        const fileId = generateId(IdType.File);
        const uploadId = generateId(IdType.Upload);

        block.id = fileId;
        block.type = NodeTypes.File;
        block.attrs = null;

        fileService.copyFileToWorkspace(
          path,
          fileId,
          uploadId,
          metadata.extension,
          input.userId
        );

        const fileAttributes: FileAttributes = {
          type: 'file',
          subtype: extractFileType(metadata.mimeType),
          parentId: messageId,
          name: metadata.name,
          fileName: metadata.name,
          mimeType: metadata.mimeType,
          size: metadata.size,
          extension: metadata.extension,
          uploadId,
          uploadStatus: 'pending',
        };

        inputs.push({
          id: fileId,
          attributes: fileAttributes,
          download: {
            node_id: fileId,
            upload_id: uploadId,
            created_at: createdAt,
            progress: 100,
            retry_count: 0,
            completed_at: new Date().toISOString(),
          },
          upload: {
            node_id: fileId,
            upload_id: uploadId,
            created_at: createdAt,
            progress: 0,
            retry_count: 0,
          },
        });
      }
    }

    const blocksRecord = blocks.reduce(
      (acc, block) => {
        acc[block.id] = block;
        return acc;
      },
      {} as Record<string, Block>
    );

    if (input.referenceId) {
      const reference = await nodeService.fetchNode(
        input.referenceId,
        input.userId
      );

      if (!reference || reference.type !== 'message') {
        throw new MutationError(
          'node_not_found',
          'Referenced message not found or has been deleted.'
        );
      }

      const messageAttributes: MessageAttributes = {
        type: 'message',
        subtype: 'reply',
        parentId: input.conversationId,
        referenceId: input.referenceId,
        content: blocksRecord,
        reactions: {},
      };

      inputs.unshift({ id: messageId, attributes: messageAttributes });
    } else {
      const messageAttributes: MessageAttributes = {
        type: 'message',
        subtype: 'standard',
        parentId: input.conversationId,
        content: blocksRecord,
        reactions: {},
      };

      inputs.unshift({ id: messageId, attributes: messageAttributes });
    }

    await nodeService.createNode(input.userId, inputs);

    return {
      id: messageId,
    };
  }
}