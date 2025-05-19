import * as Comlink from 'comlink';

import { eventBus } from '@colanode/client/lib';
import { app } from '@colanode/web/services/app-service';
import { ColanodeWorkerApi } from '@colanode/web/workers/types';

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

Comlink.expose(api);
