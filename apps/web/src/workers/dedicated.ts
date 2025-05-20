import * as Comlink from 'comlink';

import { eventBus } from '@colanode/client/lib';
import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { AppService } from '@colanode/client/services';
import { generateId, IdType } from '@colanode/core';
import { appBuild } from '@colanode/web/services/app-build';
import { paths } from '@colanode/web/services/app-paths';
import { WebFileSystem } from '@colanode/web/services/file-system';
import { WebKyselyService } from '@colanode/web/services/kysely-service';
import {
  BroadcastMessage,
  BroadcastMutationMessage,
  BroadcastQueryAndSubscribeMessage,
  BroadcastQueryMessage,
  BroadcastQueryUnsubscribeMessage,
  ColanodeWorkerApi,
  PendingPromise,
} from '@colanode/web/workers/types';

const pendingPromises = new Map<string, PendingPromise>();
let app: AppService | null = null;

const broadcast = new BroadcastChannel('colanode');
broadcast.onmessage = (event) => {
  handleMessage(event.data);
};

navigator.locks.request('colanode', async () => {
  app = new AppService(
    new WebFileSystem(),
    appBuild,
    new WebKyselyService(),
    paths
  );

  await app.migrate();
  await app.init();

  const ids = Array.from(pendingPromises.keys());
  for (const id of ids) {
    const promise = pendingPromises.get(id);
    if (!promise) {
      continue;
    }

    if (promise.type === 'query') {
      const result = await app.mediator.executeQuery(promise.input);
      promise.resolve(result);
    } else if (promise.type === 'query_and_subscribe') {
      const result = await app.mediator.executeQueryAndSubscribe(
        promise.id,
        promise.input
      );
      promise.resolve(result);
    } else if (promise.type === 'mutation') {
      const result = await app.mediator.executeMutation(promise.input);
      promise.resolve(result);
    }

    pendingPromises.delete(id);
  }

  await new Promise(() => {});
});

const broadcastMessage = (message: BroadcastMessage) => {
  broadcast.postMessage(message);
};

const handleMessage = async (message: BroadcastMessage) => {
  if (message.type === 'event') {
    eventBus.publish(message.event);
  } else if (message.type === 'mutation') {
    if (!app) {
      return;
    }

    const result = await app.mediator.executeMutation(message.input);
    broadcastMessage({
      type: 'mutation_result',
      mutationId: message.mutationId,
      result,
    });
  } else if (message.type === 'query') {
    if (!app) {
      return;
    }

    const result = await app.mediator.executeQuery(message.input);

    broadcastMessage({
      type: 'query_result',
      queryId: message.queryId,
      result,
    });
  } else if (message.type === 'query_and_subscribe') {
    if (!app) {
      return;
    }

    const result = await app.mediator.executeQueryAndSubscribe(
      message.id,
      message.input
    );

    broadcastMessage({
      type: 'query_and_subscribe_result',
      queryId: message.queryId,
      id: message.id,
      result,
    });
  } else if (message.type === 'query_unsubscribe') {
    if (!app) {
      return;
    }

    app.mediator.unsubscribeQuery(message.id);
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
  } else if (message.type === 'mutation_result') {
    const promise = pendingPromises.get(message.mutationId);
    if (!promise || promise.type !== 'mutation') {
      return;
    }

    promise.resolve(message.result);
    pendingPromises.delete(message.mutationId);
  }
};

const api: ColanodeWorkerApi = {
  async init() {},
  executeMutation(input) {
    if (app) {
      return app.mediator.executeMutation(input);
    }

    const mutationId = generateId(IdType.Mutation);
    const message: BroadcastMutationMessage = {
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

    broadcastMessage(message);
    return promise;
  },
  executeQuery(input) {
    if (app) {
      return app.mediator.executeQuery(input);
    }

    const queryId = generateId(IdType.Query);
    const message: BroadcastQueryMessage = {
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

    broadcastMessage(message);
    return promise;
  },
  executeQueryAndSubscribe(id, input) {
    if (app) {
      return app.mediator.executeQueryAndSubscribe(id, input);
    }

    const queryId = generateId(IdType.Query);
    const message: BroadcastQueryAndSubscribeMessage = {
      type: 'query_and_subscribe',
      queryId,
      id,
      input,
    };

    const promise = new Promise<QueryMap[QueryInput['type']]['output']>(
      (resolve, reject) => {
        pendingPromises.set(queryId, {
          type: 'query_and_subscribe',
          queryId,
          id,
          input,
          resolve,
          reject,
        });
      }
    );

    broadcastMessage(message);
    return promise;
  },
  unsubscribeQuery(id) {
    if (app) {
      app.mediator.unsubscribeQuery(id);
      return Promise.resolve();
    }

    const message: BroadcastQueryUnsubscribeMessage = {
      type: 'query_unsubscribe',
      id,
    };

    broadcastMessage(message);
    return Promise.resolve();
  },
  executeCommand(input) {
    if (app) {
      return app.mediator.executeCommand(input);
    }

    throw new Error('App not initialized');
  },
  subscribe(callback) {
    return Promise.resolve(eventBus.subscribe(callback));
  },
  unsubscribe(subscriptionId) {
    eventBus.unsubscribe(subscriptionId);
    return Promise.resolve();
  },
  publish(event) {
    eventBus.publish(event);
    broadcastMessage({
      type: 'event',
      event,
    });
  },
};

Comlink.expose(api);
