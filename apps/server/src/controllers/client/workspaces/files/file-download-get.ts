import { Request, Response } from 'express';
import { CreateDownloadOutput, hasCollaboratorAccess } from '@colanode/core';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';
import { fetchNodeRole } from '@/lib/nodes';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';

export const fileDownloadGetHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fileId = req.params.fileId as string;

  const role = await fetchNodeRole(fileId, res.locals.workspaceUser.id);
  if (role === null || !hasCollaboratorAccess(role)) {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', fileId)
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

  // check if the upload is completed
  const upload = await database
    .selectFrom('uploads')
    .selectAll()
    .where('node_id', '=', fileId)
    .executeTakeFirst();

  if (!upload) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'Upload not completed.',
    });
    return;
  }

  //generate presigned url for download
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAMES.FILES,
    Key: upload.path,
  });

  const presignedUrl = await getSignedUrl(filesStorage, command, {
    expiresIn: 60 * 60 * 4, // 4 hours
  });

  const output: CreateDownloadOutput = {
    url: presignedUrl,
  };

  res.status(200).json(output);
};
