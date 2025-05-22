import { app } from 'electron';
import path from 'path';

import { PathService } from '@colanode/client/services';

export class DesktopPathService implements PathService {
  private readonly nativePath = path;
  private readonly appPath = app.getPath('userData');
  private readonly appDatabasePath = this.nativePath.join(
    this.appPath,
    'app.db'
  );
  private readonly accountsDirectoryPath = this.nativePath.join(
    this.appPath,
    'accounts'
  );

  private getAccountDirectoryPath(accountId: string): string {
    return this.nativePath.join(this.accountsDirectoryPath, accountId);
  }

  private getWorkspaceDirectoryPath(
    accountId: string,
    workspaceId: string
  ): string {
    return this.nativePath.join(
      this.getAccountDirectoryPath(accountId),
      'workspaces',
      workspaceId
    );
  }

  private getWorkspaceFilesDirectoryPath(
    accountId: string,
    workspaceId: string
  ): string {
    return this.nativePath.join(
      this.getWorkspaceDirectoryPath(accountId, workspaceId),
      'files'
    );
  }

  private getAccountAvatarsDirectoryPath(accountId: string): string {
    return this.nativePath.join(
      this.getAccountDirectoryPath(accountId),
      'avatars'
    );
  }

  private getAssetsSourcePath(): string {
    if (app.isPackaged) {
      return this.nativePath.join(process.resourcesPath, 'assets');
    }
    return this.nativePath.resolve(__dirname, '../../assets');
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
    return this.nativePath.join(this.appPath, 'temp');
  }

  public tempFile(name: string): string {
    return this.nativePath.join(this.appPath, 'temp', name);
  }

  public account(accountId: string): string {
    return this.getAccountDirectoryPath(accountId);
  }

  public accountDatabase(accountId: string): string {
    return this.nativePath.join(
      this.getAccountDirectoryPath(accountId),
      'account.db'
    );
  }

  public workspace(accountId: string, workspaceId: string): string {
    return this.getWorkspaceDirectoryPath(accountId, workspaceId);
  }

  public workspaceDatabase(accountId: string, workspaceId: string): string {
    return this.nativePath.join(
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
    return this.nativePath.join(
      this.getWorkspaceFilesDirectoryPath(accountId, workspaceId),
      fileId + extension
    );
  }

  public accountAvatars(accountId: string): string {
    return this.getAccountAvatarsDirectoryPath(accountId);
  }

  public accountAvatar(accountId: string, avatarId: string): string {
    return this.nativePath.join(
      this.getAccountAvatarsDirectoryPath(accountId),
      avatarId + '.jpeg'
    );
  }

  public dirname(dir: string): string {
    return this.nativePath.dirname(dir);
  }

  public filename(file: string): string {
    return this.nativePath.basename(file, this.nativePath.extname(file));
  }

  public join(...paths: string[]): string {
    return this.nativePath.join(...paths);
  }

  public extension(name: string): string {
    return this.nativePath.extname(name);
  }

  public get assets(): string {
    return this.getAssetsSourcePath();
  }

  public get fonts(): string {
    return this.nativePath.join(this.getAssetsSourcePath(), 'fonts');
  }

  public get emojisDatabase(): string {
    return this.nativePath.join(this.getAssetsSourcePath(), 'emojis.db');
  }

  public get iconsDatabase(): string {
    return this.nativePath.join(this.getAssetsSourcePath(), 'icons.db');
  }
}
