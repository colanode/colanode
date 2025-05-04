import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { FileAttributes } from '@colanode/core';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from '@/lib/config';
import { fileS3 } from '@/data/storage';

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
    Bucket: config.fileS3.bucketName,
    Key: path,
    ContentLength: size,
    ContentType: mimeType,
  });

  const expiresIn = 60 * 60 * 4; // 4 hours
  const presignedUrl = await getSignedUrl(fileS3, command, {
    expiresIn,
  });

  return presignedUrl;
};

export const buildDownloadUrl = async (path: string) => {
  const command = new GetObjectCommand({
    Bucket: config.fileS3.bucketName,
    Key: path,
  });

  const presignedUrl = await getSignedUrl(fileS3, command, {
    expiresIn: 60 * 60 * 4, // 4 hours
  });

  return presignedUrl;
};

export const fetchFileMetadata = async (path: string) => {
  const command = new HeadObjectCommand({
    Bucket: config.fileS3.bucketName,
    Key: path,
  });

  try {
    const headObject = await fileS3.send(command);
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
    Bucket: config.fileS3.bucketName,
    Key: path,
  });

  await fileS3.send(command);
};
