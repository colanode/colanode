// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { CommandMap } from '@/shared/commands';
import { CommandInput } from '@/shared/commands';
import { MutationMap } from '@/shared/mutations';
import { MutationInput } from '@/shared/mutations';
import { QueryInput, QueryMap } from '@/shared/queries';
import { contextBridge, ipcRenderer } from 'electron';
import { eventBus } from '@/shared/lib/event-bus';
import { Event } from '@/shared/types/events';

contextBridge.exposeInMainWorld('colanode', {
  init: () => ipcRenderer.invoke('init'),
  logout: (accountId: string) => ipcRenderer.invoke('logout', accountId),

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
    id: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    return ipcRenderer.invoke('execute-query-and-subscribe', id, input);
  },

  unsubscribeQuery: (id: string): Promise<void> => {
    return ipcRenderer.invoke('unsubscribe-query', id);
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