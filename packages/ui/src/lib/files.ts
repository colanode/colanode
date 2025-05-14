export const getFileUrl = (
  accountId: string,
  workspaceId: string,
  fileId: string,
  extension: string
) => {
  return `local-file://${accountId}/${workspaceId}/${fileId}${extension}`;
};

export const getFilePlaceholderUrl = (path: string) => {
  return `local-file-preview://${path}`;
};
