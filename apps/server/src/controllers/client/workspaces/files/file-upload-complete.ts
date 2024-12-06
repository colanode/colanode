import { Request, Response } from 'express';
import { extractFileType, UploadMetadata } from '@colanode/core';
import { HeadObjectCommand } from '@aws-sdk/client-s3';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';
import { redis } from '@/data/redis';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';
import { nodeService } from '@/services/node-service';

export const fileUploadCompleteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const uploadId = req.params.uploadId as string;

  const metadataJson = await redis.get(uploadId);
  if (!metadataJson) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Upload not found.',
    });
    return;
  }

  const metadata: UploadMetadata = JSON.parse(metadataJson);
  const file = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', metadata.fileId)
    .executeTakeFirst();

  if (!file) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'File not found.',
    });
    return;
  }

  if (file.attributes.type !== 'file') {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'File not found.',
    });
    return;
  }

  if (file.attributes.size !== metadata.size) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'Size mismatch.',
    });
    return;
  }

  const path = metadata.path;
  // check if the file exists in the bucket
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAMES.FILES,
    Key: path,
  });

  try {
    const headObject = await filesStorage.send(command);

    // Verify file size matches expected size
    if (headObject.ContentLength !== metadata.size) {
      res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Uploaded file size does not match expected size',
      });
      return;
    }

    // Verify mime type matches expected type
    if (headObject.ContentType !== metadata.mimeType) {
      res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Uploaded file type does not match expected type',
      });
      return;
    }
  } catch {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'File upload verification failed',
    });
    return;
  }

  await database
    .insertInto('uploads')
    .values({
      node_id: file.id,
      upload_id: uploadId,
      workspace_id: workspaceId,
      path: metadata.path,
      mime_type: metadata.mimeType,
      size: metadata.size,
      type: extractFileType(metadata.mimeType),
      created_by: res.locals.workspaceUser.id,
      created_at: new Date(metadata.createdAt),
      completed_at: new Date(),
    })
    .execute();

  await nodeService.updateNode({
    nodeId: file.id,
    userId: res.locals.workspaceUser.id,
    workspaceId: workspaceId,
    updater: (attributes) => ({
      ...attributes,
      uploadStatus: 'completed',
      uploadId: metadata.uploadId,
    }),
  });

  await redis.del(uploadId);
  res.status(200).json({ success: true });
};
