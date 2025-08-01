import { EventBus } from '@colanode/client/lib';
import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { Event, TempFile } from '@colanode/client/types';
import { ColanodeWindowApi } from '@colanode/ui';

export interface ColanodeWorkerApi {
  init: () => Promise<void>;
  executeMutation: <T extends MutationInput>(
    input: T
  ) => Promise<MutationResult<T>>;
  executeQuery: <T extends QueryInput>(
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;
  executeQueryAndSubscribe: <T extends QueryInput>(
    key: string,
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;
  unsubscribeQuery: (key: string) => Promise<void>;
  subscribe: (callback: (event: Event) => void) => Promise<string>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
  publish: (event: Event) => void;
  saveTempFile: (file: File) => Promise<TempFile>;
}

declare global {
  interface Window {
    colanode: ColanodeWindowApi;
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
  key: string;
  windowId: string;
  input: QueryInput;
};

export type BroadcastQueryAndSubscribeResultMessage = {
  type: 'query_and_subscribe_result';
  key: string;
  windowId: string;
  queryId: string;
  result: QueryMap[QueryInput['type']]['output'];
};

export type BroadcastQueryUnsubscribeMessage = {
  type: 'query_unsubscribe';
  key: string;
  windowId: string;
};

export type BroadcastEventMessage = {
  type: 'event';
  windowId: string;
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
  key: string;
  windowId: string;
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
