import {
  extractFileType,
  FileAttributes,
  generateId,
  IdType,
} from '@colanode/core';

import { fileService } from '@/main/services/file-service';
import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '@/shared/mutations/files/file-create';
import { MutationError } from '@/shared/mutations';

export class FileCreateMutationHandler
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const metadata = fileService.getFileMetadata(input.filePath);
    if (!metadata) {
      throw new MutationError(
        'invalid_file',
        'File is invalid or could not be read.'
      );
    }

    const fileId = generateId(IdType.File);
    const uploadId = generateId(IdType.Upload);

    fileService.copyFileToWorkspace(
      input.filePath,
      fileId,
      uploadId,
      metadata.extension,
      input.userId
    );

    const attributes: FileAttributes = {
      type: 'file',
      subtype: extractFileType(metadata.mimeType),
      parentId: input.parentId,
      name: metadata.name,
      fileName: metadata.name,
      extension: metadata.extension,
      size: metadata.size,
      mimeType: metadata.mimeType,
      uploadId,
      uploadStatus: 'pending',
    };

    await nodeService.createNode(input.userId, {
      id: fileId,
      attributes,
      upload: {
        node_id: fileId,
        created_at: new Date().toISOString(),
        progress: 0,
        retry_count: 0,
        upload_id: uploadId,
      },
      download: {
        node_id: fileId,
        upload_id: uploadId,
        created_at: new Date().toISOString(),
        progress: 100,
        retry_count: 0,
        completed_at: new Date().toISOString(),
      },
    });

    return {
      id: fileId,
    };
  }
}