import { Paths } from 'expo-file-system';

import { PathService } from '@colanode/client/services';

export class MobilePathService implements PathService {
  private readonly appPath = Paths.document.uri;
  private readonly appDatabasePath = this.join(this.appPath, 'app.db');
  private readonly accountsDirectoryPath = this.join(this.appPath, 'accounts');

  private getAccountDirectoryPath(accountId: string): string {
    return this.join(this.accountsDirectoryPath, accountId);
  }

  private getWorkspaceDirectoryPath(
    accountId: string,
    workspaceId: string
  ): string {
    return this.join(
      this.getAccountDirectoryPath(accountId),
      'workspaces',
      workspaceId
    );
  }

  private getWorkspaceFilesDirectoryPath(
    accountId: string,
    workspaceId: string
  ): string {
    return this.join(
      this.getWorkspaceDirectoryPath(accountId, workspaceId),
      'files'
    );
  }

  private getAccountAvatarsDirectoryPath(accountId: string): string {
    return this.join(this.getAccountDirectoryPath(accountId), 'avatars');
  }

  private getAssetsSourcePath(): string {
    // In React Native/Expo, we should copy bundled assets to document directory
    // for file system access, or use Asset.fromModule for bundled assets
    // For now, we'll use a path in the document directory where assets will be copied
    return this.join(this.appPath, 'bundled-assets');
  }

  public get app(): string {
    return this.appPath;
  }

  public get appDatabase(): string {
    return this.appDatabasePath;
  }

  public get accounts(): string {
    return this.accountsDirectoryPath;
  }

  public get temp(): string {
    return this.join(this.appPath, 'temp');
  }

  public tempFile(name: string): string {
    return this.join(this.appPath, 'temp', name);
  }

  public account(accountId: string): string {
    return this.getAccountDirectoryPath(accountId);
  }

  public accountDatabase(accountId: string): string {
    return this.join(this.getAccountDirectoryPath(accountId), 'account.db');
  }

  public workspace(accountId: string, workspaceId: string): string {
    return this.getWorkspaceDirectoryPath(accountId, workspaceId);
  }

  public workspaceDatabase(accountId: string, workspaceId: string): string {
    return this.join(
      this.getWorkspaceDirectoryPath(accountId, workspaceId),
      'workspace.db'
    );
  }

  public workspaceFiles(accountId: string, workspaceId: string): string {
    return this.getWorkspaceFilesDirectoryPath(accountId, workspaceId);
  }

  public workspaceFile(
    accountId: string,
    workspaceId: string,
    fileId: string,
    extension: string
  ): string {
    return this.join(
      this.getWorkspaceFilesDirectoryPath(accountId, workspaceId),
      fileId + extension
    );
  }

  public accountAvatars(accountId: string): string {
    return this.getAccountAvatarsDirectoryPath(accountId);
  }

  public accountAvatar(accountId: string, avatarId: string): string {
    return this.join(
      this.getAccountAvatarsDirectoryPath(accountId),
      avatarId + '.jpeg'
    );
  }

  public dirname(dir: string): string {
    // Remove trailing slash if present
    const normalizedPath = dir.replace(/\/+$/, '');
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      return '.';
    }
    if (lastSlashIndex === 0) {
      return '/';
    }
    return normalizedPath.substring(0, lastSlashIndex);
  }

  public filename(file: string): string {
    const basename = file.substring(file.lastIndexOf('/') + 1);
    const lastDotIndex = basename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return basename;
    }
    return basename.substring(0, lastDotIndex);
  }

  public join(...paths: string[]): string {
    if (paths.length === 0) return '.';

    // Filter out empty strings and normalize paths
    const normalizedPaths = paths
      .filter((path) => path && path.length > 0)
      .map((path) => path.replace(/\/+$/, '')); // Remove trailing slashes

    if (normalizedPaths.length === 0) return '.';

    // Join with single slashes
    const result = normalizedPaths.join('/');

    // Handle absolute paths (starting with /)
    if (paths[0] && paths[0].startsWith('/')) {
      return '/' + result.replace(/^\/+/, '');
    }

    return result.replace(/\/+/g, '/'); // Replace multiple slashes with single slash
  }

  public extension(name: string): string {
    const basename = name.substring(name.lastIndexOf('/') + 1);
    const lastDotIndex = basename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return '';
    }
    return basename.substring(lastDotIndex);
  }

  public get assets(): string {
    return this.getAssetsSourcePath();
  }

  public get fonts(): string {
    return this.join(this.getAssetsSourcePath(), 'fonts');
  }

  public get emojisDatabase(): string {
    return this.join(this.getAssetsSourcePath(), 'emojis.db');
  }

  public get iconsDatabase(): string {
    return this.join(this.getAssetsSourcePath(), 'icons.db');
  }
}
