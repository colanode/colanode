import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

export const buildUploadUrl = async (
  path: string,
  size: number,
  mimeType: string
) => {
  const command = new PutObjectCommand({
    Bucket: config.storage.bucketName,
    Key: path,
    ContentLength: size,
    ContentType: mimeType,
  });

  const expiresIn = 60 * 60 * 4; // 4 hours
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn,
  });

  return presignedUrl;
};

export const buildDownloadUrl = async (path: string) => {
  const command = new GetObjectCommand({
    Bucket: config.storage.bucketName,
    Key: path,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60 * 4, // 4 hours
  });

  return presignedUrl;
};

export const fetchFileMetadata = async (path: string) => {
  const command = new HeadObjectCommand({
    Bucket: config.storage.bucketName,
    Key: path,
  });

  try {
    const headObject = await s3Client.send(command);
    return {
      size: headObject.ContentLength,
      mimeType: headObject.ContentType,
    };
  } catch {
    return null;
  }
};

export const deleteFile = async (path: string) => {
  const command = new DeleteObjectCommand({
    Bucket: config.storage.bucketName,
    Key: path,
  });

  await s3Client.send(command);
};
