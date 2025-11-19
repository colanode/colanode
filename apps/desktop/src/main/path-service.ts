import { app } from 'electron';
import path from 'path';

import { PathService } from '@colanode/client/services';

export class DesktopPathService implements PathService {
  private readonly nativePath = path;

  private readonly appPath = app.getPath('userData');
  private readonly bootstrapPath = this.nativePath.join(
    this.appPath,
    'bootstrap.json'
  );
  private readonly appDatabasePath = this.nativePath.join(
    this.appPath,
    'app.db'
  );
  private readonly avatarsPath = this.nativePath.join(this.appPath, 'avatars');
  private readonly workspacesPath = this.nativePath.join(
    this.appPath,
    'workspaces'
  );

  private getWorkspaceDirectoryPath(userId: string): string {
    return this.nativePath.join(this.workspacesPath, userId);
  }

  private getWorkspaceFilesDirectoryPath(userId: string): string {
    return this.nativePath.join(
      this.getWorkspaceDirectoryPath(userId),
      'files'
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

  public get bootstrap(): string {
    return this.bootstrapPath;
  }

  public get appDatabase(): string {
    return this.appDatabasePath;
  }

  public get temp(): string {
    return this.nativePath.join(this.appPath, 'temp');
  }

  public get avatars(): string {
    return this.avatarsPath;
  }

  public tempFile(name: string): string {
    return this.nativePath.join(this.appPath, 'temp', name);
  }

  public avatar(avatarId: string): string {
    return this.nativePath.join(this.avatarsPath, avatarId + '.jpeg');
  }

  public workspace(userId: string): string {
    return this.getWorkspaceDirectoryPath(userId);
  }

  public workspaceDatabase(userId: string): string {
    return this.nativePath.join(
      this.getWorkspaceDirectoryPath(userId),
      'workspace.db'
    );
  }

  public workspaceFiles(userId: string): string {
    return this.getWorkspaceFilesDirectoryPath(userId);
  }

  public workspaceFile(
    userId: string,
    fileId: string,
    extension: string
  ): string {
    return this.nativePath.join(
      this.getWorkspaceFilesDirectoryPath(userId),
      fileId + extension
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

  public font(name: string): string {
    return this.nativePath.join(this.getAssetsSourcePath(), 'fonts', name);
  }
}
