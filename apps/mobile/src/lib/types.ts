import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { Event } from '@colanode/client/types';

declare global {
  interface Window {
    ReactNativeWebView: {
      postMessage: (message: string) => void;
    };
  }
}

export type InitMessage = {
  type: 'init';
};

export type InitResultMessage = {
  type: 'init_result';
};

export type MutationMessage = {
  type: 'mutation';
  mutationId: string;
  input: MutationInput;
};

export type MutationResultMessage = {
  type: 'mutation_result';
  mutationId: string;
  result: MutationResult<MutationInput>;
};

export type QueryMessage = {
  type: 'query';
  queryId: string;
  input: QueryInput;
};

export type QueryResultMessage = {
  type: 'query_result';
  queryId: string;
  result: QueryMap[QueryInput['type']]['output'];
};

export type QueryAndSubscribeMessage = {
  type: 'query_and_subscribe';
  queryId: string;
  key: string;
  windowId: string;
  input: QueryInput;
};

export type QueryAndSubscribeResultMessage = {
  type: 'query_and_subscribe_result';
  key: string;
  windowId: string;
  queryId: string;
  result: QueryMap[QueryInput['type']]['output'];
};

export type QueryUnsubscribeMessage = {
  type: 'query_unsubscribe';
  key: string;
  windowId: string;
};

export type EventMessage = {
  type: 'event';
  windowId: string;
  event: Event;
};

export type ConsoleMessage = {
  type: 'console';
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: string;
};

export type Message =
  | InitMessage
  | InitResultMessage
  | MutationMessage
  | MutationResultMessage
  | QueryMessage
  | QueryResultMessage
  | QueryAndSubscribeMessage
  | QueryAndSubscribeResultMessage
  | QueryUnsubscribeMessage
  | EventMessage
  | ConsoleMessage;

export type PendingInit = {
  type: 'init';
  resolve: () => void;
  reject: (error: string) => void;
};

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
  | PendingInit
  | PendingQuery
  | PendingQueryAndSubscribe
  | PendingMutation;
