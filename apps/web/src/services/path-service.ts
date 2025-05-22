import { PathService } from '@colanode/client/services';

export class WebPathService implements PathService {
  private readonly appPath = '';
  private readonly appDatabasePath = this.join(this.appPath, 'app.db');
  private readonly accountsDirectoryPath = this.join(this.appPath, 'accounts');
  private readonly assetsSourcePath = 'assets';

  public get app() {
    return this.appPath;
  }

  public get appDatabase() {
    return this.appDatabasePath;
  }

  public get accounts() {
    return this.accountsDirectoryPath;
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

  public account(accountId: string): string {
    return this.join(this.accountsDirectoryPath, accountId);
  }

  public accountDatabase(accountId: string): string {
    return this.join(this.account(accountId), 'account.db');
  }

  public workspace(accountId: string, workspaceId: string): string {
    return this.join(this.account(accountId), 'workspaces', workspaceId);
  }

  public workspaceDatabase(accountId: string, workspaceId: string): string {
    return this.join(this.workspace(accountId, workspaceId), 'workspace.db');
  }

  public workspaceFiles(accountId: string, workspaceId: string): string {
    return this.join(this.workspace(accountId, workspaceId), 'files');
  }

  public workspaceFile(
    accountId: string,
    workspaceId: string,
    fileId: string,
    extension: string
  ): string {
    return this.join(
      this.workspaceFiles(accountId, workspaceId),
      fileId + extension
    );
  }

  public accountAvatars(accountId: string): string {
    return this.join(this.account(accountId), 'avatars');
  }

  public accountAvatar(accountId: string, avatarId: string): string {
    return this.join(this.accountAvatars(accountId), avatarId + '.jpeg');
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
}
