import { CommandInput, CommandMap } from '@/shared/commands';
import { EventBus } from '@/shared/lib/event-bus';
import { MutationInput, MutationResult } from '@/shared/mutations';
import { QueryInput, QueryMap } from '@/shared/queries';

export interface ColanodeApi {
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
}

declare global {
  interface Window {
    colanode: ColanodeApi;
    eventBus: EventBus;
  }
}
