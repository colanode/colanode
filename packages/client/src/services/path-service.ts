export interface PathService {
  app: string;
  appDatabase: string;
  avatars: string;
  temp: string;
  tempFile: (name: string) => string;
  avatar: (avatarId: string) => string;
  workspace: (userId: string) => string;
  workspaceDatabase: (userId: string) => string;
  workspaceFiles: (userId: string) => string;
  workspaceFile: (userId: string, fileId: string, extension: string) => string;
  dirname: (path: string) => string;
  filename: (path: string) => string;
  extension: (path: string) => string;
  assets: string;
  fonts: string;
  emojisDatabase: string;
  iconsDatabase: string;
  font: (name: string) => string;
}
