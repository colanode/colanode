import { Request, Response } from 'express';
import {
  CreateUploadInput,
  CreateUploadOutput,
  UploadMetadata,
} from '@colanode/core';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';
import { redis } from '@/data/redis';

export const fileUploadInitHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input = req.body as CreateUploadInput;

  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', input.fileId)
    .executeTakeFirst();

  if (!node) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'File not found.',
    });
    return;
  }

  if (node.attributes.type !== 'file') {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'File not found.',
    });
    return;
  }

  if (node.created_by !== res.locals.workspaceUser.id) {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  //generate presigned url for upload
  const path = `files/${workspaceId}/${input.fileId}_${input.uploadId}${node.attributes.extension}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAMES.FILES,
    Key: path,
    ContentLength: node.attributes.size,
    ContentType: node.attributes.mimeType,
  });

  const expiresIn = 60 * 60 * 4; // 4 hours
  const presignedUrl = await getSignedUrl(filesStorage, command, {
    expiresIn,
  });

  const data: UploadMetadata = {
    fileId: input.fileId,
    path,
    mimeType: node.attributes.mimeType,
    size: node.attributes.size,
    uploadId: input.uploadId,
    createdAt: new Date().toISOString(),
  };

  await redis.set(input.uploadId, JSON.stringify(data), {
    EX: expiresIn,
  });

  const output: CreateUploadOutput = {
    uploadId: input.uploadId,
    url: presignedUrl,
  };

  res.status(200).json(output);
};
