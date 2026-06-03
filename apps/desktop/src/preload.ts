// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

import { eventBus } from '@colanode/client/lib';
import { MutationInput, MutationMap } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { Event, TempFile } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';

const windowId = generateId(IdType.Window);

contextBridge.exposeInMainWorld('colanode', {
  init: () => ipcRenderer.invoke('init'),
  reset: () => ipcRenderer.invoke('reset'),

  executeMutation: <T extends MutationInput>(
    input: T
  ): Promise<MutationMap[T['type']]['output']> => {
    return ipcRenderer.invoke('execute-mutation', input);
  },

  executeQuery: <T extends QueryInput>(
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    return ipcRenderer.invoke('execute-query', input);
  },

  executeQueryAndSubscribe: <T extends QueryInput>(
    key: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    return ipcRenderer.invoke(
      'execute-query-and-subscribe',
      key,
      windowId,
      input
    );
  },

  unsubscribeQuery: (key: string): Promise<void> => {
    return ipcRenderer.invoke('unsubscribe-query', key, windowId);
  },

  saveTempFile: async (file: File): Promise<TempFile> => {
    const arrayBuffer = await file.arrayBuffer();
    return ipcRenderer.invoke('save-temp-file', {
      buffer: Buffer.from(arrayBuffer),
      name: file.name,
      type: file.type,
      size: file.size,
    });
  },

  openExternalUrl: async (url: string) => {
    return ipcRenderer.invoke('open-external-url', url);
  },

  showItemInFolder: async (path: string) => {
    return ipcRenderer.invoke('show-item-in-folder', path);
  },

  showFileSaveDialog: async ({ name }: { name: string }) => {
    return ipcRenderer.invoke('show-file-save-dialog', { name });
  },

  getStorageDirectory: async () => {
    return ipcRenderer.invoke('get-storage-directory');
  },

  showStorageDirectoryDialog: async () => {
    return ipcRenderer.invoke('show-storage-directory-dialog');
  },

  setStorageDirectory: async (path: string) => {
    return ipcRenderer.invoke('set-storage-directory', path);
  },

  backupCreate: async (config: Record<string, unknown>) => {
    return ipcRenderer.invoke('backup-create', config);
  },

  backupList: async (config: Record<string, unknown>) => {
    return ipcRenderer.invoke('backup-list', config);
  },

  backupRestore: async (params: {
    config: Record<string, unknown>;
    backupId: string;
    targetPath?: string;
  }) => {
    return ipcRenderer.invoke('backup-restore', params);
  },

  onBackupProgress: (callback: (progress: Record<string, unknown>) => void) => {
    const handler = (_: unknown, progress: Record<string, unknown>) =>
      callback(progress);
    ipcRenderer.on('backup-progress', handler);
    return () => {
      ipcRenderer.removeListener('backup-progress', handler);
    };
  },
});

contextBridge.exposeInMainWorld('eventBus', {
  subscribe: (callback: (event: Event) => void) => eventBus.subscribe(callback),
  unsubscribe: (id: string) => eventBus.unsubscribe(id),
  publish: (event: Event) => eventBus.publish(event),
});

// Renderer-process event-loop lag monitor: reports >200ms stalls to main
(() => {
  const SAMPLE_MS = 100;
  const THRESHOLD_MS = 200;
  let last = Date.now();
  ipcRenderer.send('freeze-log-renderer', `=== renderer start ===`);
  setInterval(() => {
    const now = Date.now();
    const lag = now - last - SAMPLE_MS;
    last = now;
    if (lag >= THRESHOLD_MS) {
      const mem = (performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
      }).memory;
      const memStr = mem
        ? ` heap=${Math.round(mem.usedJSHeapSize / 1048576)}/${Math.round(mem.totalJSHeapSize / 1048576)}MB`
        : '';
      ipcRenderer.send('freeze-log-renderer', `lag=${lag}ms${memStr}`);
    }
  }, SAMPLE_MS);
})();

ipcRenderer.on('event', (_, event) => {
  eventBus.publish(event);
});
