import { createRoot } from 'react-dom/client';
import * as Comlink from 'comlink';
import { eventBus } from '@colanode/client/lib';

import { Root } from '@/root';
import { ColanodeWorkerApi } from '@/workers/types';
import DedicatedWorker from '@/workers/dedicated?worker';

const worker = new DedicatedWorker();
const workerApi = Comlink.wrap<ColanodeWorkerApi>(worker);
window.colanode = workerApi;
window.eventBus = eventBus;

workerApi.subscribe(
  Comlink.proxy((event) => {
    eventBus.publish(event);
  })
);

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
