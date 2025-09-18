import { Paths, File, Directory } from 'expo-file-system';

import { PathService } from '@colanode/client/services';

export class MobilePathService implements PathService {
  private readonly accountsDirectoryPath = new Directory(
    Paths.document,
    'accounts'
  );

  private getAccountDirectoryPath(accountId: string): string {
    return new Directory(this.accountsDirectoryPath, accountId).uri;
  }

  private getWorkspaceDirectoryPath(
    accountId: string,
    workspaceId: string
  ): string {
    return new Directory(
      this.getAccountDirectoryPath(accountId),
      'workspaces',
      workspaceId
    ).uri;
  }

  private getWorkspaceFilesDirectoryPath(
    accountId: string,
    workspaceId: string
  ): string {
    return new Directory(
      this.getWorkspaceDirectoryPath(accountId, workspaceId),
      'files'
    ).uri;
  }

  private getAccountAvatarsDirectoryPath(accountId: string): string {
    return new Directory(this.getAccountDirectoryPath(accountId), 'avatars')
      .uri;
  }

  private getAssetsSourcePath(): string {
    return new Directory(Paths.document, 'assets').uri;
  }

  public get app(): string {
    return Paths.document.uri;
  }

  public get appDatabase(): string {
    return new File(Paths.document, 'app.db').uri;
  }

  public get accounts(): string {
    return this.accountsDirectoryPath.uri;
  }

  public get temp(): string {
    return new Directory(Paths.document, 'temp').uri;
  }

  public tempFile(name: string): string {
    return new File(Paths.document, 'temp', name).uri;
  }

  public account(accountId: string): string {
    return this.getAccountDirectoryPath(accountId);
  }

  public accountDatabase(accountId: string): string {
    return new File(this.getAccountDirectoryPath(accountId), 'account.db').uri;
  }

  public workspace(accountId: string, workspaceId: string): string {
    return this.getWorkspaceDirectoryPath(accountId, workspaceId);
  }

  public workspaceDatabase(accountId: string, workspaceId: string): string {
    return new File(
      this.getWorkspaceDirectoryPath(accountId, workspaceId),
      'workspace.db'
    ).uri;
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
    return new File(
      this.getWorkspaceFilesDirectoryPath(accountId, workspaceId),
      fileId + extension
    ).uri;
  }

  public accountAvatars(accountId: string): string {
    return this.getAccountAvatarsDirectoryPath(accountId);
  }

  public accountAvatar(accountId: string, avatarId: string): string {
    return new File(
      this.getAccountAvatarsDirectoryPath(accountId),
      avatarId + '.jpeg'
    ).uri;
  }

  public dirname(path: string): string {
    const info = Paths.info(path);
    if (info.isDirectory) {
      return path;
    }

    const file = new File(path);
    return file.parentDirectory.uri;
  }

  public filename(path: string): string {
    const file = new File(path);
    return file.name;
  }

  public extension(name: string): string {
    const file = new File(name);
    return file.extension;
  }

  public get assets(): string {
    return this.getAssetsSourcePath();
  }

  public get fonts(): string {
    return new Directory(this.getAssetsSourcePath(), 'fonts').uri;
  }

  public get emojisDatabase(): string {
    return new File(this.getAssetsSourcePath(), 'emojis.db').uri;
  }

  public get iconsDatabase(): string {
    return new File(this.getAssetsSourcePath(), 'icons.db').uri;
  }

  public font(name: string): string {
    return new File(this.getAssetsSourcePath(), 'fonts', name).uri;
  }
}
