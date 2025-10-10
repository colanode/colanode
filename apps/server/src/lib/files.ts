import { FileAttributes } from '@colanode/core';
import { storage } from '@colanode/server/lib/storage';

export const buildFilePath = (
  workspaceId: string,
  fileId: string,
  fileAttributes: FileAttributes
) => {
  return `files/${workspaceId}/${fileId}_${fileAttributes.version}${fileAttributes.extension}`;
};
