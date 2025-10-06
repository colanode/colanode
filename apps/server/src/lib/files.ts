import { FileAttributes } from '@colanode/core';
import { getStorage } from '@colanode/server/lib/storage';

export const buildFilePath = (
  workspaceId: string,
  fileId: string,
  fileAttributes: FileAttributes
) => {
  return `files/${workspaceId}/${fileId}_${fileAttributes.version}${fileAttributes.extension}`;
};

export const deleteFile = async (path: string) => {
  const storage = getStorage();
  await storage.delete(path);
};
