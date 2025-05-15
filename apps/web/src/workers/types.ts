import { CommandInput, CommandMap } from '@colanode/client/commands';
import { EventBus } from '@colanode/client/lib';
import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { Event } from '@colanode/client/types';

export interface ColanodeWorkerApi {
  init: () => Promise<void>;
  executeMutation: <T extends MutationInput>(
    input: T
  ) => Promise<MutationResult<T>>;
  executeQuery: <T extends QueryInput>(
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;
  executeQueryAndSubscribe: <T extends QueryInput>(
    id: string,
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;
  unsubscribeQuery: (id: string) => Promise<void>;
  executeCommand: <T extends CommandInput>(
    input: T
  ) => Promise<CommandMap[T['type']]['output']>;
  subscribe: (callback: (event: Event) => void) => Promise<string>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
  publish: (event: Event) => void;
}

declare global {
  interface Window {
    colanode: ColanodeWorkerApi;
    eventBus: EventBus;
  }
}
