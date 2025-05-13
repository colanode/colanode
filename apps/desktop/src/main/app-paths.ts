import { AppPaths } from '@colanode/client/services';

import { app } from 'electron';
import path from 'path';

export const appPath = app.getPath('userData');

export const appDatabasePath = path.join(appPath, 'app.db');

export const accountsDirectoryPath = path.join(appPath, 'accounts');

export const getAccountDirectoryPath = (accountId: string): string => {
  return path.join(accountsDirectoryPath, accountId);
};

export const getWorkspaceDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(
    getAccountDirectoryPath(accountId),
    'workspaces',
    workspaceId
  );
};

export const getWorkspaceFilesDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(getWorkspaceDirectoryPath(accountId, workspaceId), 'files');
};

export const getWorkspaceTempFilesDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(getWorkspaceDirectoryPath(accountId, workspaceId), 'temp');
};

export const getAccountAvatarsDirectoryPath = (accountId: string): string => {
  return path.join(getAccountDirectoryPath(accountId), 'avatars');
};

export const getAssetsSourcePath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets');
  }

  return path.resolve(__dirname, '../../assets');
};

export const getAppIconPath = (): string => {
  return path.join(getAssetsSourcePath(), 'colanode-logo-black.png');
};

export const paths: AppPaths = {
  app: appPath,
  appDatabase: appDatabasePath,
  accounts: accountsDirectoryPath,
  account: (accountId: string) => getAccountDirectoryPath(accountId),
  accountDatabase: (accountId: string) =>
    path.join(getAccountDirectoryPath(accountId), 'account.db'),
  workspace: (accountId: string, workspaceId: string) =>
    getWorkspaceDirectoryPath(accountId, workspaceId),
  workspaceDatabase: (accountId: string, workspaceId: string) =>
    path.join(
      getWorkspaceDirectoryPath(accountId, workspaceId),
      'workspace.db'
    ),
  workspaceFiles: (accountId: string, workspaceId: string) =>
    getWorkspaceFilesDirectoryPath(accountId, workspaceId),
  workspaceTempFiles: (accountId: string, workspaceId: string) =>
    getWorkspaceTempFilesDirectoryPath(accountId, workspaceId),
  accountAvatars: (accountId: string) =>
    getAccountAvatarsDirectoryPath(accountId),
  assets: getAssetsSourcePath(),
  fonts: path.join(getAssetsSourcePath(), 'fonts'),
  emojisDatabase: path.join(getAssetsSourcePath(), 'emojis.db'),
  iconsDatabase: path.join(getAssetsSourcePath(), 'icons.db'),
};
