import * as Comlink from 'comlink';
import { createRoot } from 'react-dom/client';

import { eventBus } from '@colanode/client/lib';
import { Root } from '@colanode/web/root';
import DedicatedWorker from '@colanode/web/workers/dedicated?worker';
import { ColanodeWorkerApi } from '@colanode/web/workers/types';

const worker = new DedicatedWorker();
const workerApi = Comlink.wrap<ColanodeWorkerApi>(worker);

window.colanode = {
  init: async () => {},
  executeMutation: async (input) => {
    return workerApi.executeMutation(input);
  },
  executeQuery: async (input) => {
    return workerApi.executeQuery(input);
  },
  executeQueryAndSubscribe: async (key, input) => {
    return workerApi.executeQueryAndSubscribe(key, input);
  },
  saveTempFile: async (file) => {
    return workerApi.saveTempFile(file);
  },
  unsubscribeQuery: async (queryId) => {
    return workerApi.unsubscribeQuery(queryId);
  },
  openExternalUrl: async (url) => {
    window.open(url, '_blank');
  },
};

window.eventBus = eventBus;

workerApi.subscribe(
  Comlink.proxy((event) => {
    eventBus.publish(event);
  })
);

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
