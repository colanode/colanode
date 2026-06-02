import {
  app as electronApp,
  BrowserWindow,
  ipcMain,
  protocol,
  shell,
  globalShortcut,
  dialog,
  nativeTheme,
} from 'electron';
import fs from 'fs';
import path from 'path';

import started from 'electron-squirrel-startup';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';

import { eventBus } from '@colanode/client/lib';
import { MutationInput, MutationMap } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { AppMeta, AppService } from '@colanode/client/services';
import {
  BackupService,
  GitHubStorageProvider,
  LocalStorageProvider,
  S3StorageProvider,
} from '@colanode/client/services/backup';
import type {
  StorageProvider,
  GitHubProviderConfig,
  LocalProviderConfig,
  S3ProviderConfig,
} from '@colanode/client/services/backup';
import { AppInitOutput, TempFile, ThemeMode } from '@colanode/client/types';
import {
  build,
  createDebugger,
  extractFileSubtype,
  generateId,
  IdType,
  WorkspaceStatus,
} from '@colanode/core';
import { AppBadge } from '@colanode/desktop/main/app-badge';
import { BootstrapService } from '@colanode/desktop/main/bootstrap';
import { DesktopFileSystem } from '@colanode/desktop/main/file-system';
import { DesktopKyselyService } from '@colanode/desktop/main/kysely-service';
import { DesktopPathService } from '@colanode/desktop/main/path-service';
import { handleLocalRequest } from '@colanode/desktop/main/protocols';

const localOnlyMode = true;

const appMeta: AppMeta = {
  type: 'desktop',
  platform: process.platform,
  localOnly: localOnlyMode,
};

const LOCAL_ACCOUNT_EMAIL = 'local@colanode.local';
const LOCAL_ACCOUNT_NAME = 'Local User';
const LOCAL_WORKSPACE_NAME = 'My Workspace';
const STORAGE_DIR_ARG_PREFIX = '--colanode-storage-dir=';
const STORAGE_CONFIG_FILE = 'storage-config.json';
const STORAGE_ROOT_DIR_NAME = 'Colapp-Local';
const STORAGE_DIR_ENV_KEYS = [
  'COLANODE_STORAGE_DIR',
  'COLANODE_REPO_DIR',
  'COLANODE_DATA_DIR',
] as const;

const debug = createDebugger('desktop:main');

const toAbsoluteStoragePath = (value: string): string => {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
};

const resolveSudoUserHomePath = (): string | null => {
  if (process.platform !== 'darwin') {
    return null;
  }

  if (typeof process.getuid !== 'function' || process.getuid() !== 0) {
    return null;
  }

  const sudoUser = process.env.SUDO_USER?.trim();
  if (!sudoUser) {
    return null;
  }

  const homePath = path.join('/Users', sudoUser);
  if (!fs.existsSync(homePath)) {
    return null;
  }

  return homePath;
};

const resolvePreferredAppDataPath = (): string => {
  const sudoUserHomePath = resolveSudoUserHomePath();
  if (!sudoUserHomePath) {
    return electronApp.getPath('appData');
  }

  return path.join(sudoUserHomePath, 'Library', 'Application Support');
};

const resolveDefaultStoragePath = (): string => {
  return path.join(resolvePreferredAppDataPath(), STORAGE_ROOT_DIR_NAME);
};

const storageConfigPath = (): string => {
  return path.join(
    resolvePreferredAppDataPath(),
    STORAGE_ROOT_DIR_NAME,
    STORAGE_CONFIG_FILE
  );
};

const readPersistedStoragePath = (): string | null => {
  try {
    const configPath = storageConfigPath();
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
      path?: string;
    };

    if (!parsed.path || parsed.path.trim().length === 0) {
      return null;
    }

    return toAbsoluteStoragePath(parsed.path.trim());
  } catch {
    return null;
  }
};

const persistStoragePath = async (storagePath: string): Promise<void> => {
  const configPath = storageConfigPath();
  await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
  await fs.promises.writeFile(
    configPath,
    JSON.stringify({ path: storagePath }, null, 2),
    'utf-8'
  );
};

const resolveConfiguredStoragePath = (): string | null => {
  const arg = process.argv.find((value) =>
    value.startsWith(STORAGE_DIR_ARG_PREFIX)
  );

  const cliValue = arg?.slice(STORAGE_DIR_ARG_PREFIX.length).trim();
  const envValue = STORAGE_DIR_ENV_KEYS.map((key) => process.env[key])
    .find((value) => value && value.trim().length > 0)
    ?.trim();
  const persistedValue = readPersistedStoragePath();

  const value =
    (cliValue && cliValue.length > 0 ? cliValue : null) ??
    envValue ??
    persistedValue;
  if (!value) {
    return null;
  }

  return toAbsoluteStoragePath(value);
};

const configureStoragePath = (): void => {
  const configuredPath = resolveConfiguredStoragePath();
  const defaultStoragePath = resolveDefaultStoragePath();
  const finalPath = configuredPath ?? defaultStoragePath;

  try {
    fs.mkdirSync(finalPath, { recursive: true });
    electronApp.setPath('userData', finalPath);

    if (configuredPath) {
      debug(`Using custom storage directory: ${finalPath}`);
    } else {
      debug(`Using default storage directory for sudo session: ${finalPath}`);
    }
  } catch (error) {
    console.error('Failed to configure custom storage directory:', error);
  }
};

const ensureLocalOnlyBootstrap = async (app: AppService): Promise<void> => {
  const now = new Date().toISOString();

  let accountRow = await app.database
    .selectFrom('accounts')
    .selectAll()
    .orderBy('created_at', 'asc')
    .executeTakeFirst();

  if (!accountRow) {
    accountRow = await app.database
      .insertInto('accounts')
      .returningAll()
      .values({
        id: generateId(IdType.Account),
        name: LOCAL_ACCOUNT_NAME,
        email: LOCAL_ACCOUNT_EMAIL,
        avatar: null,
        token: 'local-only',
        device_id: generateId(IdType.Device),
        created_at: now,
        updated_at: now,
        synced_at: now,
      })
      .executeTakeFirst();
  }

  if (!accountRow) {
    throw new Error('Failed to initialize local-only account record');
  }

  await app.initAccount({
    id: accountRow.id,
    name: accountRow.name,
    email: accountRow.email,
    avatar: accountRow.avatar,
    token: accountRow.token,
    deviceId: accountRow.device_id,
    createdAt: accountRow.created_at,
    updatedAt: accountRow.updated_at,
    syncedAt: accountRow.synced_at,
  });

  let workspaces = await app.database
    .selectFrom('workspaces')
    .selectAll()
    .where('account_id', '=', accountRow.id)
    .execute();

  if (workspaces.length === 0) {
    const createdWorkspace = await app.database
      .insertInto('workspaces')
      .returningAll()
      .values({
        user_id: generateId(IdType.User),
        workspace_id: generateId(IdType.Workspace),
        account_id: accountRow.id,
        name: LOCAL_WORKSPACE_NAME,
        description: 'Local-only workspace',
        avatar: null,
        role: 'owner',
        max_file_size: null,
        created_at: now,
        updated_at: now,
        status: WorkspaceStatus.Active,
      })
      .executeTakeFirst();

    if (createdWorkspace) {
      workspaces = [createdWorkspace];
    }
  }

  for (const workspace of workspaces) {
    await app.initWorkspace(workspace);
  }

  const defaultWorkspace = workspaces[0];
  if (defaultWorkspace) {
    await app.metadata.set('app', 'workspace', defaultWorkspace.user_id);
  }

  debug(
    `LOCAL_ONLY mode ready with ${workspaces.length} local workspace(s) and account ${accountRow.id}`
  );
};

configureStoragePath();

const fileSystem = new DesktopFileSystem();
const pathService = new DesktopPathService();
const kyselyService = new DesktopKyselyService();
const bootstrap = new BootstrapService(pathService);

let app: AppService | null = null;
let appBadge: AppBadge | null = null;

electronApp.setName('Colapp');
electronApp.setAppUserModelId('com.colapp.desktop');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  electronApp.quit();
}

updateElectronApp({
  updateSource: {
    type: UpdateSourceType.ElectronPublicUpdateService,
    repo: 'colanode/colanode',
    host: 'https://update.electronjs.org',
  },
  updateInterval: '5 minutes',
  notifyUser: true,
});

const createWindow = async () => {
  nativeTheme.themeSource = bootstrap.theme ?? 'system';

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: bootstrap.window.width,
    height: bootstrap.window.height,
    fullscreen: bootstrap.window.fullscreen,
    x: bootstrap.window.x,
    y: bootstrap.window.y,
    fullscreenable: true,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(pathService.assets, 'colapp-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
  });

  mainWindow.setMenuBarVisibility(false);

  const updateWindowState = () => {
    bootstrap.updateWindow({
      fullscreen: mainWindow.isFullScreen(),
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height,
      x: mainWindow.getBounds().x,
      y: mainWindow.getBounds().y,
    });

    if (app) {
      app.metadata.set('app', 'window', bootstrap.window);
    }
  };

  mainWindow.on('resized', updateWindowState);
  mainWindow.on('enter-full-screen', updateWindowState);
  mainWindow.on('leave-full-screen', updateWindowState);
  mainWindow.on('moved', updateWindowState);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  const subscriptionId = eventBus.subscribe((event) => {
    mainWindow.webContents.send('event', event);
    if (
      event.type === 'metadata.updated' &&
      event.metadata.key === 'theme.mode'
    ) {
      const themeMode = JSON.parse(event.metadata.value) as ThemeMode;
      nativeTheme.themeSource = themeMode;
      bootstrap.updateTheme(themeMode);
    } else if (
      event.type === 'metadata.deleted' &&
      event.metadata.key === 'theme.mode'
    ) {
      nativeTheme.themeSource = 'system';
      bootstrap.updateTheme(null);
    }
  });

  if (!protocol.isProtocolHandled('local')) {
    protocol.handle('local', (request) => {
      if (!app) {
        throw new Error('App is not initialized');
      }

      return handleLocalRequest(pathService, app?.assets, request);
    });
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' }; // Prevent default new-window behavior
  });

  globalShortcut.register('CommandOrControl+Shift+V', () => {
    mainWindow.webContents.pasteAndMatchStyle();
  });

  mainWindow.on('close', () => {
    eventBus.unsubscribe(subscriptionId);
    globalShortcut.unregister('CommandOrControl+Shift+V');
  });

  debug('Window created');
};

const initApp = async (): Promise<AppInitOutput> => {
  if (bootstrap.needsFreshStart) {
    return 'reset';
  }

  app = new AppService(appMeta, fileSystem, kyselyService, pathService);
  appBadge = new AppBadge(app);

  await app.init();
  appBadge.init();

  await bootstrap.updateVersion(build.version);

  await app.metadata.set('app', 'version', bootstrap.version);
  await app.metadata.set('app', 'platform', appMeta.platform);
  await app.metadata.set('app', 'storage.path', pathService.app);
  await app.metadata.set('app', 'window', bootstrap.window);
  if (bootstrap.theme) {
    await app.metadata.set('app', 'theme.mode', bootstrap.theme);
  } else {
    await app.metadata.delete('app', 'theme.mode');
  }

  await app.metadata.set('app', 'mode.localOnly', localOnlyMode);

  debug('LOCAL_ONLY mode enabled: skipping default remote server bootstrap');
  await ensureLocalOnlyBootstrap(app);

  return 'success';
};

protocol.registerSchemesAsPrivileged([
  { scheme: 'local', privileges: { standard: true, stream: true } },
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electronApp.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electronApp.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }

  if (app) {
    app.mediator.clearSubscriptions();
  }
});

electronApp.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle('init', async () => {
  return initApp();
});

ipcMain.handle('reset', async () => {
  await fs.promises.rm(pathService.app, { recursive: true, force: true });
  electronApp.relaunch();
  electronApp.exit(0);
});

ipcMain.handle(
  'execute-mutation',
  async <T extends MutationInput>(
    _: unknown,
    input: T
  ): Promise<MutationMap[T['type']]['output']> => {
    if (!app) {
      throw new Error('App is not initialized');
    }

    return app.mediator.executeMutation(input);
  }
);

ipcMain.handle(
  'execute-query',
  async <T extends QueryInput>(
    _: unknown,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    if (!app) {
      throw new Error('App is not initialized');
    }

    return app.mediator.executeQuery(input);
  }
);

ipcMain.handle(
  'execute-query-and-subscribe',
  async <T extends QueryInput>(
    _: unknown,
    key: string,
    windowId: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    if (!app) {
      throw new Error('App is not initialized');
    }

    return app.mediator.executeQueryAndSubscribe(key, windowId, input);
  }
);

ipcMain.handle(
  'unsubscribe-query',
  (_: unknown, key: string, windowId: string): void => {
    if (!app) {
      throw new Error('App is not initialized');
    }

    app.mediator.unsubscribeQuery(key, windowId);
  }
);

ipcMain.handle(
  'save-temp-file',
  async (
    _: unknown,
    file: { name: string; size: number; type: string; buffer: Buffer }
  ): Promise<TempFile> => {
    const id = generateId(IdType.TempFile);
    if (!app) {
      throw new Error('App is not initialized');
    }

    const extension = app.path.extension(file.name);
    const mimeType = file.type;
    const subtype = extractFileSubtype(mimeType);
    const filePath = app.path.tempFile(id + extension);

    await app.fs.writeFile(filePath, file.buffer);
    await app.database
      .insertInto('temp_files')
      .values({
        id,
        name: file.name,
        size: file.size,
        mime_type: mimeType,
        subtype,
        path: filePath,
        extension,
        created_at: new Date().toISOString(),
        opened_at: new Date().toISOString(),
      })
      .execute();

    const url = await app.fs.url(filePath);
    if (!url) {
      await app.fs.delete(filePath);
      await app.database
        .deleteFrom('temp_files')
        .where('id', '=', id)
        .execute();

      throw new Error('Failed to save temp file');
    }

    return {
      id,
      name: file.name,
      size: file.size,
      mimeType,
      subtype,
      path: filePath,
      extension,
      url,
    };
  }
);

ipcMain.handle('open-external-url', (_, url: string) => {
  shell.openExternal(url);
});

ipcMain.handle('show-item-in-folder', (_, path: string) => {
  shell.showItemInFolder(path);
});

ipcMain.handle('get-storage-directory', async () => {
  return pathService.app;
});

ipcMain.handle('show-storage-directory-dialog', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select local storage directory',
    defaultPath: pathService.app,
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
  });

  if (result.canceled) {
    return undefined;
  }

  const selectedPath = result.filePaths[0];
  if (!selectedPath) {
    return undefined;
  }

  return toAbsoluteStoragePath(selectedPath);
});

ipcMain.handle('set-storage-directory', async (_, storagePath: string) => {
  const normalizedPath = toAbsoluteStoragePath(storagePath);

  await fs.promises.mkdir(normalizedPath, { recursive: true });
  await persistStoragePath(normalizedPath);

  if (app) {
    await app.metadata.set('app', 'storage.path', normalizedPath);
  }

  const relaunchArgs = [
    ...process.argv.filter((arg) => !arg.startsWith(STORAGE_DIR_ARG_PREFIX)),
    `${STORAGE_DIR_ARG_PREFIX}${normalizedPath}`,
  ];

  electronApp.relaunch({ args: relaunchArgs });
  electronApp.exit(0);
});

ipcMain.handle(
  'show-file-save-dialog',
  async (_, { name }: { name: string }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: name,
    });

    if (result.canceled) {
      return undefined;
    }

    return result.filePath;
  }
);

// ---- Backup / Restore IPC ----

function createStorageProvider(
  config: GitHubProviderConfig | S3ProviderConfig | LocalProviderConfig
): StorageProvider {
  switch (config.type) {
    case 'github':
      return new GitHubStorageProvider(config);
    case 's3':
      return new S3StorageProvider(config);
    case 'local':
      return new LocalStorageProvider(config);
    default:
      throw new Error(`Unknown storage provider type: ${(config as { type: string }).type}`);
  }
}

function createBackupService(
  config: GitHubProviderConfig | S3ProviderConfig | LocalProviderConfig
): BackupService {
  const provider = createStorageProvider(config);
  return new BackupService(pathService.app, provider, '1.0.0');
}

ipcMain.handle(
  'backup-create',
  async (
    _,
    config: GitHubProviderConfig | S3ProviderConfig | LocalProviderConfig
  ): Promise<{ backupId: string }> => {
    const service = createBackupService(config);
    const backupId = await service.backup((progress) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('backup-progress', progress);
    });
    return { backupId };
  }
);

ipcMain.handle(
  'backup-list',
  async (_, config: GitHubProviderConfig | S3ProviderConfig | LocalProviderConfig) => {
    const service = createBackupService(config);
    return service.listBackups();
  }
);

ipcMain.handle(
  'backup-restore',
  async (
    _,
    {
      config,
      backupId,
      targetPath,
    }: {
      config: GitHubProviderConfig | S3ProviderConfig | LocalProviderConfig;
      backupId: string;
      targetPath?: string;
    }
  ) => {
    const service = createBackupService(config);
    await service.restore(backupId, targetPath, (progress) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('backup-progress', progress);
    });
    // Relaunch after restore
    electronApp.relaunch();
    electronApp.exit(0);
  }
);
