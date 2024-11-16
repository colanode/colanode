import { CommandMap } from '@/shared/commands';
import { QueryInput } from '@/shared/queries';
import { MutationInput, MutationMap } from '@/shared/mutations';
import { QueryMap } from '@/shared/queries';
import { CommandInput } from '@/shared/commands';
import { EventBus } from '@/shared/lib/event-bus';

export interface ColanodeApi {
  init: () => Promise<void>;
  executeMutation: <T extends MutationInput>(
    input: T
  ) => Promise<MutationMap[T['type']]['output']>;
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
