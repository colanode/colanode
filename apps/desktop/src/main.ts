import {
  app as electronApp,
  BrowserWindow,
  ipcMain,
  protocol,
  shell,
  globalShortcut,
  dialog,
} from 'electron';

import started from 'electron-squirrel-startup';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';

import { eventBus } from '@colanode/client/lib';
import { MutationInput, MutationMap } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { TempFile } from '@colanode/client/types';
import {
  createDebugger,
  extractFileSubtype,
  generateId,
  IdType,
} from '@colanode/core';
import { app, appBadge } from '@colanode/desktop/main/app-service';
import { handleLocalRequest } from '@colanode/desktop/main/protocols';

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
  await app.migrate();

  // Create the browser window.
  let windowSize = (await app.metadata.get('window.size'))?.value;
  const mainWindow = new BrowserWindow({
    width: windowSize?.width ?? 1200,
    height: windowSize?.height ?? 800,
    fullscreen: windowSize?.fullscreen ?? false,
    fullscreenable: true,
    minWidth: 800,
    minHeight: 600,
    icon: app.path.join(app.path.assets, 'colanode-logo-black.png'),
    webPreferences: {
      preload: app.path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 5, y: 5 },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('resized', () => {
    windowSize = {
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height,
      fullscreen: false,
    };

    app.metadata.set('window.size', windowSize);
  });

  mainWindow.on('enter-full-screen', () => {
    windowSize = {
      width: windowSize?.width ?? mainWindow.getBounds().width,
      height: windowSize?.height ?? mainWindow.getBounds().height,
      fullscreen: true,
    };

    app.metadata.set('window.size', windowSize);
  });

  mainWindow.on('leave-full-screen', () => {
    windowSize = {
      width: windowSize?.width ?? mainWindow.getBounds().width,
      height: windowSize?.height ?? mainWindow.getBounds().height,
      fullscreen: false,
    };

    app.metadata.set('window.size', windowSize);
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      app.path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
      )
    );
  }

  const subscriptionId = eventBus.subscribe((event) => {
    if (event.type === 'query.result.updated') {
      mainWindow.webContents.send('event', event);
    }
  });

  if (!protocol.isProtocolHandled('local')) {
    protocol.handle('local', (request) => {
      return handleLocalRequest(request);
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

  app.mediator.clearSubscriptions();
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
  await app.init();
  appBadge.init();
});

ipcMain.handle(
  'execute-mutation',
  async <T extends MutationInput>(
    _: unknown,
    input: T
  ): Promise<MutationMap[T['type']]['output']> => {
    return app.mediator.executeMutation(input);
  }
);

ipcMain.handle(
  'execute-query',
  async <T extends QueryInput>(
    _: unknown,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
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
    return app.mediator.executeQueryAndSubscribe(key, windowId, input);
  }
);

ipcMain.handle(
  'unsubscribe-query',
  (_: unknown, key: string, windowId: string): void => {
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
