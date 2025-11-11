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
import { AppInitOutput, TempFile, ThemeMode } from '@colanode/client/types';
import {
  build,
  createDebugger,
  extractFileSubtype,
  generateId,
  IdType,
} from '@colanode/core';
import { AppBadge } from '@colanode/desktop/main/app-badge';
import { BootstrapService } from '@colanode/desktop/main/bootstrap';
import { DesktopFileSystem } from '@colanode/desktop/main/file-system';
import { DesktopKyselyService } from '@colanode/desktop/main/kysely-service';
import { DesktopPathService } from '@colanode/desktop/main/path-service';
import { handleLocalRequest } from '@colanode/desktop/main/protocols';

const appMeta: AppMeta = {
  type: 'desktop',
  platform: process.platform,
};

const fileSystem = new DesktopFileSystem();
const pathService = new DesktopPathService();
const kyselyService = new DesktopKyselyService();
const bootstrap = new BootstrapService(pathService);

let app: AppService | null = null;
let appBadge: AppBadge | null = null;

const debug = createDebugger('desktop:main');

electronApp.setName('Colanode');
electronApp.setAppUserModelId('com.colanode.desktop');

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
    icon: path.join(pathService.assets, 'colanode-logo.png'),
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
  await app.metadata.set('app', 'window', bootstrap.window);
  if (bootstrap.theme) {
    await app.metadata.set('app', 'theme.mode', bootstrap.theme);
  } else {
    await app.metadata.delete('app', 'theme.mode');
  }

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
    const filePath = app.path.tempFile(file.name);

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
