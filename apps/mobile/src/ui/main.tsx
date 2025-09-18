import React from 'react';
import ReactDOM from 'react-dom/client';

import { eventBus } from '@colanode/client/lib';
import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { generateId, IdType } from '@colanode/core/lib/id';
import {
  InitMessage,
  Message,
  MutationMessage,
  PendingPromise,
  QueryAndSubscribeMessage,
  QueryMessage,
  QueryUnsubscribeMessage,
} from '@colanode/mobile/lib/types';
import { Root } from '@colanode/mobile/ui/root';

const windowId = generateId(IdType.Window);
const pendingPromises = new Map<string, PendingPromise>();

const postMessage = (message: Message) => {
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
};

window.colanode = {
  init: async () => {
    const message: InitMessage = {
      type: 'init',
    };

    const promise = new Promise<void>((resolve, reject) => {
      pendingPromises.set('init', {
        type: 'init',
        resolve,
        reject,
      });
    });

    postMessage(message);
    return promise;
  },
  executeMutation: async (input) => {
    const mutationId = generateId(IdType.Mutation);
    const message: MutationMessage = {
      type: 'mutation',
      mutationId,
      input,
    };

    const promise = new Promise<MutationResult<MutationInput>>(
      (resolve, reject) => {
        pendingPromises.set(mutationId, {
          type: 'mutation',
          mutationId,
          input,
          resolve,
          reject,
        });
      }
    );

    postMessage(message);
    return promise;
  },
  executeQuery: async (input) => {
    const queryId = generateId(IdType.Query);
    const message: QueryMessage = {
      type: 'query',
      queryId,
      input,
    };

    const promise = new Promise<QueryMap[QueryInput['type']]['output']>(
      (resolve, reject) => {
        pendingPromises.set(queryId, {
          type: 'query',
          queryId,
          input,
          resolve,
          reject,
        });
      }
    );

    postMessage(message);
    return promise;
  },
  executeQueryAndSubscribe: async (key, input) => {
    const queryId = generateId(IdType.Query);
    const message: QueryAndSubscribeMessage = {
      type: 'query_and_subscribe',
      queryId,
      key,
      windowId,
      input,
    };

    const promise = new Promise<QueryMap[QueryInput['type']]['output']>(
      (resolve, reject) => {
        pendingPromises.set(queryId, {
          type: 'query_and_subscribe',
          queryId,
          key,
          windowId,
          input,
          resolve,
          reject,
        });
      }
    );

    postMessage(message);
    return promise;
  },
  saveTempFile: async () => {
    throw new Error('Not implemented');
  },
  unsubscribeQuery: async (key) => {
    const message: QueryUnsubscribeMessage = {
      type: 'query_unsubscribe',
      key,
      windowId,
    };

    postMessage(message);
    return Promise.resolve();
  },
  openExternalUrl: async (url) => {
    window.open(url, '_blank');
  },
  showItemInFolder: async () => {
    // No-op on web
  },
  showFileSaveDialog: async () => undefined,
};

const handleMessage = (message: Message) => {
  if (message.type === 'init_result') {
    const promise = pendingPromises.get('init');
    if (!promise || promise.type !== 'init') {
      return;
    }

    promise.resolve();
    pendingPromises.delete('init');
  } else if (message.type === 'mutation_result') {
    const promise = pendingPromises.get(message.mutationId);
    if (!promise || promise.type !== 'mutation') {
      return;
    }

    promise.resolve(message.result);
    pendingPromises.delete(message.mutationId);
  } else if (message.type === 'query_result') {
    const promise = pendingPromises.get(message.queryId);
    if (!promise || promise.type !== 'query') {
      return;
    }

    promise.resolve(message.result);
    pendingPromises.delete(message.queryId);
  } else if (message.type === 'query_and_subscribe_result') {
    const promise = pendingPromises.get(message.queryId);
    if (!promise || promise.type !== 'query_and_subscribe') {
      return;
    }

    promise.resolve(message.result);
    pendingPromises.delete(message.queryId);
  } else if (message.type === 'event') {
    eventBus.publish(message.event);
  }
};

window.addEventListener('message', (event) => {
  const message = JSON.parse(event.data) as Message;
  handleMessage(message);
});

window.eventBus = eventBus;

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalInfo = console.info;
const originalDebug = console.debug;

console.log = (...args) => {
  originalLog(...args);
  postMessage({
    type: 'console',
    level: 'log',
    message: args.join(' '),
    timestamp: new Date().toISOString(),
  });
};

console.warn = (...args) => {
  originalWarn(...args);
  postMessage({
    type: 'console',
    level: 'warn',
    message: args.join(' '),
    timestamp: new Date().toISOString(),
  });
};

console.error = (...args) => {
  originalError(...args);
  postMessage({
    type: 'console',
    level: 'error',
    message: args.join(' '),
    timestamp: new Date().toISOString(),
  });
};

console.info = (...args) => {
  originalInfo(...args);
  postMessage({
    type: 'console',
    level: 'info',
    message: args.join(' '),
    timestamp: new Date().toISOString(),
  });
};

console.debug = (...args) => {
  originalDebug(...args);
  postMessage({
    type: 'console',
    level: 'debug',
    message: args.join(' '),
    timestamp: new Date().toISOString(),
  });
};

window.addEventListener('error', (event) => {
  postMessage({
    type: 'console',
    level: 'error',
    message: event.message,
    timestamp: new Date().toISOString(),
  });
});

window.addEventListener('unhandledrejection', (event) => {
  postMessage({
    type: 'console',
    level: 'error',
    message: event.reason,
    timestamp: new Date().toISOString(),
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
