import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { FileAttributes } from '@colanode/core';
import { s3Client } from '@colanode/server/data/storage';
import { config } from '@colanode/server/lib/config';

export const buildFilePath = (
  workspaceId: string,
  fileId: string,
  fileAttributes: FileAttributes
) => {
  return `files/${workspaceId}/${fileId}_${fileAttributes.version}${fileAttributes.extension}`;
};

export const deleteFile = async (path: string) => {
  const command = new DeleteObjectCommand({
    Bucket: config.storage.bucket,
    Key: path,
  });

  await s3Client.send(command);
};
