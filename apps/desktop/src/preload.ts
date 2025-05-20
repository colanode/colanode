// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

import { CommandInput, CommandMap } from '@colanode/client/commands';
import { eventBus } from '@colanode/client/lib';
import { MutationInput, MutationMap } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { Event } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';

const windowId = generateId(IdType.Window);

contextBridge.exposeInMainWorld('colanode', {
  init: () => ipcRenderer.invoke('init'),

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

  executeCommand: <T extends CommandInput>(
    input: T
  ): Promise<CommandMap[T['type']]['output']> => {
    return ipcRenderer.invoke('execute-command', input);
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
