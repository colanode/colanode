import { MutationHandler } from '@/main/types';
import { extractFileType, generateId, IdType } from '@colanode/core';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '@/shared/mutations/file-create';
import { fileService } from '@/main/services/file-service';
import { FileAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

export class FileCreateMutationHandler
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const metadata = fileService.getFileMetadata(input.filePath);
    if (!metadata) {
      throw new Error('Invalid file');
    }

    const fileId = generateId(IdType.File);
    const uploadId = generateId(IdType.Upload);
    fileService.copyFileToWorkspace(
      input.filePath,
      fileId,
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
