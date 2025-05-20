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

export type BroadcastMutationMessage = {
  type: 'mutation';
  mutationId: string;
  input: MutationInput;
};

export type BroadcastMutationResultMessage = {
  type: 'mutation_result';
  mutationId: string;
  result: MutationResult<MutationInput>;
};

export type BroadcastQueryMessage = {
  type: 'query';
  queryId: string;
  input: QueryInput;
};

export type BroadcastQueryResultMessage = {
  type: 'query_result';
  queryId: string;
  result: QueryMap[QueryInput['type']]['output'];
};

export type BroadcastQueryAndSubscribeMessage = {
  type: 'query_and_subscribe';
  queryId: string;
  id: string;
  input: QueryInput;
};

export type BroadcastQueryAndSubscribeResultMessage = {
  type: 'query_and_subscribe_result';
  id: string;
  queryId: string;
  result: QueryMap[QueryInput['type']]['output'];
};

export type BroadcastQueryUnsubscribeMessage = {
  type: 'query_unsubscribe';
  id: string;
};

export type BroadcastCommandMessage = {
  type: 'command';
  commandId: string;
  input: CommandInput;
};

export type BroadcastCommandResultMessage = {
  type: 'command_result';
  commandId: string;
  result: CommandMap[CommandInput['type']]['output'];
};

export type BroadcastEventMessage = {
  type: 'event';
  event: Event;
};

export type BroadcastMessage =
  | BroadcastMutationMessage
  | BroadcastMutationResultMessage
  | BroadcastQueryMessage
  | BroadcastQueryResultMessage
  | BroadcastQueryAndSubscribeMessage
  | BroadcastQueryAndSubscribeResultMessage
  | BroadcastQueryUnsubscribeMessage
  | BroadcastCommandMessage
  | BroadcastCommandResultMessage
  | BroadcastEventMessage;

export type PendingQuery = {
  type: 'query';
  queryId: string;
  input: QueryInput;
  resolve: (result: QueryMap[QueryInput['type']]['output']) => void;
  reject: (error: string) => void;
};

export type PendingQueryAndSubscribe = {
  type: 'query_and_subscribe';
  queryId: string;
  id: string;
  input: QueryInput;
  resolve: (result: QueryMap[QueryInput['type']]['output']) => void;
  reject: (error: string) => void;
};

export type PendingMutation = {
  type: 'mutation';
  mutationId: string;
  input: MutationInput;
  resolve: (result: MutationResult<MutationInput>) => void;
  reject: (error: string) => void;
};

export type PendingPromise =
  | PendingQuery
  | PendingQueryAndSubscribe
  | PendingMutation;
