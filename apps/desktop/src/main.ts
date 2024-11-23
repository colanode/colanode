import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import path from 'path';
import { eventBus } from '@/shared/lib/event-bus';
import { avatarService } from '@/main/services/avatar-service';
import { fileService } from '@/main/services/file-service';
import { assetService } from '@/main/services/asset-service';
import { MutationMap } from '@/shared/mutations';
import { MutationInput } from '@/shared/mutations';
import { QueryMap } from '@/shared/queries';
import { mutationService } from '@/main/services/mutation-service';
import { queryService } from '@/main/services/query-service';
import { QueryInput } from '@/shared/queries';
import { CommandMap } from '@/shared/commands';
import { CommandInput } from '@/shared/commands';
import { commandService } from '@/main/services/command-service';
import { bootstrapper } from '@/main/bootstrapper';
import started from 'electron-squirrel-startup';
import { logService } from '@/main/services/log-service';
import { getAppIconPath } from '@/main/utils';

const logger = logService.createLogger('main');

app.setName('Colanode');
app.setAppUserModelId('com.colanode.desktop');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  bootstrapper.init();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  const subscriptionId = eventBus.subscribe((event) => {
    if (event.type === 'query_result_updated') {
      mainWindow.webContents.send('event', event);
    }
  });

  mainWindow.on('close', () => {
    eventBus.unsubscribe(subscriptionId);
  });

  if (!protocol.isProtocolHandled('avatar')) {
    protocol.handle('avatar', (request) => {
      return avatarService.handleAvatarRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('local-file')) {
    protocol.handle('local-file', (request) => {
      return fileService.handleFileRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('local-file-preview')) {
    protocol.handle('local-file-preview', (request) => {
      return fileService.handleFilePreviewRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('asset')) {
    protocol.handle('asset', (request) => {
      return assetService.handleAssetRequest(request);
    });
  }

  logger.info('Window created');
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }

  queryService.clearSubscriptions();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle('init', async () => {
  await bootstrapper.init();
});

ipcMain.handle(
  'execute-mutation',
  async <T extends MutationInput>(
    _: unknown,
    input: T
  ): Promise<MutationMap[T['type']]['output']> => {
    return mutationService.executeMutation(input);
  }
);

ipcMain.handle(
  'execute-query',
  async <T extends QueryInput>(
    _: unknown,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    return queryService.executeQuery(input);
  }
);

ipcMain.handle(
  'execute-query-and-subscribe',
  async <T extends QueryInput>(
    _: unknown,
    id: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    return queryService.executeQueryAndSubscribe(id, input);
  }
);

ipcMain.handle('unsubscribe-query', (_: unknown, id: string): void => {
  queryService.unsubscribeQuery(id);
});

ipcMain.handle(
  'execute-command',
  async <T extends CommandInput>(
    _: unknown,
    input: T
  ): Promise<CommandMap[T['type']]['output']> => {
    return commandService.executeCommand(input);
  }
);
