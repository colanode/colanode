import * as Comlink from 'comlink';
import { createRoot } from 'react-dom/client';

import { eventBus } from '@colanode/client/lib';
import { BrowserNotSupported } from '@colanode/web/components/browser-not-supported';
import { MobileNotSupported } from '@colanode/web/components/mobile-not-supported';
import { ColanodeWorkerApi } from '@colanode/web/lib/types';
import { isMobileDevice, isOpfsSupported } from '@colanode/web/lib/utils';
import { Root } from '@colanode/web/root';
import DedicatedWorker from '@colanode/web/workers/dedicated?worker';

const initializeApp = async () => {
  const isMobile = isMobileDevice();
  if (isMobile) {
    const root = createRoot(document.getElementById('root') as HTMLElement);
    root.render(<MobileNotSupported />);
    return;
  }

  const hasOpfsSupport = await isOpfsSupported();
  if (!hasOpfsSupport) {
    const root = createRoot(document.getElementById('root') as HTMLElement);
    root.render(<BrowserNotSupported />);
    return;
  }

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
    showItemInFolder: async () => {
      // No-op on web
    },
    showFileSaveDialog: async () => undefined,
  };

  window.eventBus = eventBus;

  workerApi.subscribe(
    Comlink.proxy((event) => {
      eventBus.publish(event);
    })
  );

  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(<Root />);
};

initializeApp().catch(() => {
  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(<BrowserNotSupported />);
});
