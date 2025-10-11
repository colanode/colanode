import { PathService } from '@colanode/client/services';

export class WebPathService implements PathService {
  private readonly appPath = '';
  private readonly assetsSourcePath = 'assets';
  private readonly appDatabasePath = this.join(this.appPath, 'app.db');
  private readonly avatarsPath = this.join(this.appPath, 'avatars');
  private readonly workspacesPath = this.join(this.appPath, 'workspaces');

  public get app() {
    return this.appPath;
  }

  public get appDatabase() {
    return this.appDatabasePath;
  }

  public get avatars() {
    return this.avatarsPath;
  }

  public get temp() {
    return this.join(this.appPath, 'temp');
  }

  public get assets() {
    return this.assetsSourcePath;
  }

  public get fonts() {
    return this.join(this.assetsSourcePath, 'fonts');
  }

  public get emojisDatabase() {
    return this.join(this.assetsSourcePath, 'emojis.db');
  }

  public get iconsDatabase() {
    return this.join(this.assetsSourcePath, 'icons.db');
  }

  public tempFile(name: string): string {
    return this.join(this.appPath, 'temp', name);
  }

  public avatar(avatarId: string): string {
    return this.join(this.avatarsPath, avatarId + '.jpeg');
  }

  public workspace(userId: string): string {
    return this.join(this.workspacesPath, userId);
  }

  public workspaceDatabase(userId: string): string {
    return this.join(this.workspace(userId), 'workspace.db');
  }

  public workspaceFiles(userId: string): string {
    return this.join(this.workspace(userId), 'files');
  }

  public workspaceFile(
    userId: string,
    fileId: string,
    extension: string
  ): string {
    return this.join(this.workspaceFiles(userId), fileId + extension);
  }

  public dirname(path: string): string {
    return path.split('/').slice(0, -1).join('/') || '';
  }

  public filename(path: string): string {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1] || '';
    const fileParts = lastPart.split('.');
    return fileParts.length > 1 ? fileParts.slice(0, -1).join('.') : lastPart;
  }

  public join(...paths: string[]): string {
    return paths.filter(Boolean).join('/').trim();
  }

  public extension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
  }

  public font(name: string): string {
    return this.join(this.assetsSourcePath, 'fonts', name);
  }
}
