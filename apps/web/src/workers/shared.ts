/// <reference lib="webworker" />
declare const self: SharedWorkerGlobalScope;

import * as Comlink from 'comlink';
import { eventBus } from '@colanode/client/lib';

import { ColanodeWorkerApi } from '@/workers/types';
import { app } from '@/services/app-service';

const api: ColanodeWorkerApi = {
  async init() {
    await app.migrate();
    await app.init();
  },
  executeMutation(input) {
    return app.mediator.executeMutation(input);
  },
  executeQuery(input) {
    return app.mediator.executeQuery(input);
  },
  executeQueryAndSubscribe(id, input) {
    return app.mediator.executeQueryAndSubscribe(id, input);
  },
  unsubscribeQuery(id) {
    app.mediator.unsubscribeQuery(id);
    return Promise.resolve();
  },
  executeCommand(input) {
    return app.mediator.executeCommand(input);
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
  },
};

self.onconnect = (e) => {
  const port = e.ports[0];
  if (!port) return;

  Comlink.expose(api, port);

  port.addEventListener('close', () => {
    console.log('Connection closed');
  });
};
