import { Paths, File, Directory } from 'expo-file-system';

import { PathService } from '@colanode/client/services';

export class MobilePathService implements PathService {
  private readonly avatarsDirectoryPath = new Directory(
    Paths.document,
    'avatars'
  );

  private readonly workspacesDirectoryPath = new Directory(
    Paths.document,
    'workspaces'
  );

  private getWorkspaceDirectoryPath(userId: string): string {
    return new Directory(this.workspacesDirectoryPath, userId).uri;
  }

  private getWorkspaceFilesDirectoryPath(userId: string): string {
    return new Directory(this.getWorkspaceDirectoryPath(userId), 'files').uri;
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

  public get avatars(): string {
    return this.avatarsDirectoryPath.uri;
  }

  public get temp(): string {
    return new Directory(Paths.document, 'temp').uri;
  }

  public avatar(avatarId: string): string {
    return new File(this.avatarsDirectoryPath, avatarId + '.jpeg').uri;
  }

  public tempFile(name: string): string {
    return new File(Paths.document, 'temp', name).uri;
  }

  public workspace(userId: string): string {
    return this.getWorkspaceDirectoryPath(userId);
  }

  public workspaceDatabase(userId: string): string {
    return new File(this.getWorkspaceDirectoryPath(userId), 'workspace.db').uri;
  }

  public workspaceFiles(userId: string): string {
    return this.getWorkspaceFilesDirectoryPath(userId);
  }

  public workspaceFile(
    userId: string,
    fileId: string,
    extension: string
  ): string {
    return new File(
      this.getWorkspaceFilesDirectoryPath(userId),
      fileId + extension
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
