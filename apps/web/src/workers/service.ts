/// <reference lib="webworker" />

// Service worker that intercepts requests with the path /asset
declare const self: ServiceWorkerGlobalScope & {
  __WB_DISABLE_DEV_LOGS: boolean;
};

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

import { WebFileSystem } from '@colanode/web/services/file-system';
import { WebPathService } from '@colanode/web/services/path-service';

const path = new WebPathService();
const fs = new WebFileSystem();

self.__WB_DISABLE_DEV_LOGS = true;
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin === self.location.origin,
  new StaleWhileRevalidate({
    cacheName: 'same-origin-assets',
  })
);

const downloadDbs = async () => {
  await Promise.all([downloadEmojis(), downloadIcons()]);
};

const downloadEmojis = async () => {
  try {
    const emojiResponse = await fetch('/assets/emojis.db');
    if (!emojiResponse.ok) {
      throw new Error(
        `Failed to download emoji database: ${emojiResponse.status}`
      );
    }
    const emojiData = await emojiResponse.arrayBuffer();
    await fs.writeFile(path.emojisDatabase, new Uint8Array(emojiData));
  } catch (error) {
    console.error('Failed to download emojis:', error);
  }
};

const downloadIcons = async () => {
  try {
    const iconResponse = await fetch('/assets/icons.db');
    if (!iconResponse.ok) {
      throw new Error(
        `Failed to download icon database: ${iconResponse.status}`
      );
    }
    const iconData = await iconResponse.arrayBuffer();
    await fs.writeFile(path.iconsDatabase, new Uint8Array(iconData));
  } catch (error) {
    console.error('Failed to download icons:', error);
  }
};

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(Promise.all([downloadDbs(), self.skipWaiting()]));
});
