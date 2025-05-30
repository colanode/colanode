export interface PathService {
  app: string;
  appDatabase: string;
  accounts: string;
  temp: string;
  tempFile: (name: string) => string;
  account: (accountId: string) => string;
  accountDatabase: (accountId: string) => string;
  workspace: (accountId: string, workspaceId: string) => string;
  workspaceDatabase: (accountId: string, workspaceId: string) => string;
  workspaceFiles: (accountId: string, workspaceId: string) => string;
  workspaceFile: (
    accountId: string,
    workspaceId: string,
    fileId: string,
    extension: string
  ) => string;
  accountAvatars: (accountId: string) => string;
  accountAvatar: (accountId: string, avatarId: string) => string;
  dirname: (path: string) => string;
  filename: (path: string) => string;
  join: (...paths: string[]) => string;
  extension: (path: string) => string;
  assets: string;
  fonts: string;
  emojisDatabase: string;
  iconsDatabase: string;
}
