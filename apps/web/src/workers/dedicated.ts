import * as Comlink from 'comlink';

import { eventBus } from '@colanode/client/lib';
import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { AppMeta, AppService } from '@colanode/client/services';
import { extractFileSubtype, generateId, IdType } from '@colanode/core';
import {
  BroadcastMessage,
  BroadcastMutationMessage,
  BroadcastQueryAndSubscribeMessage,
  BroadcastQueryMessage,
  BroadcastQueryUnsubscribeMessage,
  ColanodeWorkerApi,
  PendingPromise,
} from '@colanode/web/lib/types';
import { WebFileSystem } from '@colanode/web/services/file-system';
import { WebKyselyService } from '@colanode/web/services/kysely-service';
import { WebPathService } from '@colanode/web/services/path-service';

const windowId = generateId(IdType.Window);
const pendingPromises = new Map<string, PendingPromise>();

const fs = new WebFileSystem();
const path = new WebPathService();
let app: AppService | null = null;
let appInitialized = false;

const broadcast = new BroadcastChannel('colanode');
broadcast.onmessage = (event) => {
  handleMessage(event.data);
};

navigator.locks.request('colanode', async () => {
  const appMeta: AppMeta = {
    type: 'web',
    platform: navigator.userAgent,
  };

  app = new AppService(appMeta, fs, new WebKyselyService(), path);

  await app.migrate();
  await app.init();
  appInitialized = true;

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
        promise.key,
        promise.windowId,
        promise.input
      );
      promise.resolve(result);
    } else if (promise.type === 'mutation') {
      const result = await app.mediator.executeMutation(promise.input);
      promise.resolve(result);
    }

    pendingPromises.delete(id);
  }

  eventBus.subscribe((event) => {
    broadcastMessage({
      type: 'event',
      windowId,
      event,
    });
  });

  await new Promise(() => {});
});

const broadcastMessage = (message: BroadcastMessage) => {
  broadcast.postMessage(message);
};

const handleMessage = async (message: BroadcastMessage) => {
  if (message.type === 'event') {
    if (message.windowId === windowId) {
      return;
    }

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
      message.key,
      message.windowId,
      message.input
    );

    broadcastMessage({
      type: 'query_and_subscribe_result',
      queryId: message.queryId,
      key: message.key,
      windowId: message.windowId,
      result,
    });
  } else if (message.type === 'query_unsubscribe') {
    if (!app) {
      return;
    }

    app.mediator.unsubscribeQuery(message.key, message.windowId);
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
  async init() {
    if (!app) {
      return;
    }

    if (appInitialized) {
      return;
    }

    let count = 0;
    while (!appInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      count++;
      if (count > 100) {
        throw new Error('App initialization timed out');
      }
    }
  },
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
  executeQueryAndSubscribe(key, input) {
    if (app) {
      return app.mediator.executeQueryAndSubscribe(key, windowId, input);
    }

    const queryId = generateId(IdType.Query);
    const message: BroadcastQueryAndSubscribeMessage = {
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

    broadcastMessage(message);
    return promise;
  },
  unsubscribeQuery(key) {
    if (app) {
      app.mediator.unsubscribeQuery(key, windowId);
      return Promise.resolve();
    }

    const message: BroadcastQueryUnsubscribeMessage = {
      type: 'query_unsubscribe',
      key,
      windowId,
    };

    broadcastMessage(message);
    return Promise.resolve();
  },
  subscribe(callback) {
    const id = eventBus.subscribe(callback);
    return Promise.resolve(id);
  },
  unsubscribe(subscriptionId) {
    eventBus.unsubscribe(subscriptionId);
    return Promise.resolve();
  },
  publish(event) {
    eventBus.publish(event);
  },
  async saveTempFile(file) {
    const id = generateId(IdType.TempFile);
    const extension = path.extension(file.name);
    const mimeType = file.type;
    const subtype = extractFileSubtype(mimeType);
    const filePath = path.tempFile(file.name);

    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    await fs.writeFile(filePath, fileData);
    if (app) {
      await app.database
        .insertInto('temp_files')
        .values({
          id,
          name: file.name,
          size: file.size,
          mime_type: mimeType,
          subtype,
          path: filePath,
          extension,
          created_at: new Date().toISOString(),
          opened_at: new Date().toISOString(),
        })
        .execute();
    } else {
      const message: BroadcastMutationMessage = {
        type: 'mutation',
        mutationId: generateId(IdType.Mutation),
        input: {
          type: 'temp.file.create',
          id,
          name: file.name,
          size: file.size,
          mimeType,
          subtype,
          extension,
          path: filePath,
        },
      };

      broadcastMessage(message);
    }

    const url = await fs.url(filePath);
    return {
      id,
      name: file.name,
      size: file.size,
      mimeType,
      subtype,
      path: filePath,
      extension,
      url,
    };
  },
};

Comlink.expose(api);
