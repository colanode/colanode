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

  localSyncGetConfig: async () => {
    return ipcRenderer.invoke('local-sync-get-config');
  },

  localSyncConfigure: async (storage: Record<string, unknown>) => {
    return ipcRenderer.invoke('local-sync-configure', storage);
  },

  localSyncClear: async () => {
    return ipcRenderer.invoke('local-sync-clear');
  },
});

contextBridge.exposeInMainWorld('eventBus', {
  subscribe: (callback: (event: Event) => void) => eventBus.subscribe(callback),
  unsubscribe: (id: string) => eventBus.unsubscribe(id),
  publish: (event: Event) => eventBus.publish(event),
});

ipcRenderer.on('event', (_, event) => {
  eventBus.publish(event);
});
