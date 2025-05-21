/// <reference lib="webworker" />

// Service worker that intercepts requests with the path /asset
declare const self: ServiceWorkerGlobalScope;

import { paths } from '@colanode/web/services/app-paths';
import { WebFileSystem } from '@colanode/web/services/file-system';

const fs = new WebFileSystem();

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
    await fs.writeFile(paths.emojisDatabase, new Uint8Array(emojiData));
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
    await fs.writeFile(paths.iconsDatabase, new Uint8Array(iconData));
  } catch (error) {
    console.error('Failed to download icons:', error);
  }
};

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(downloadDbs());
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.url.includes('/assets/avatars')) {
    event.respondWith(
      (async () => {
        const path = event.request.url.split('/assets/avatars/')[1];
        const [accountId, avatarId] = path?.split('/') ?? [];

        if (!accountId || !avatarId) {
          return new Response('Not found', { status: 404 });
        }

        const avatarPath = paths.accountAvatar(accountId, avatarId);
        const exists = await fs.exists(avatarPath);

        if (!exists) {
          return new Response('Not found', { status: 404 });
        }

        const fileBuffer = await fs.readFile(avatarPath);
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });
      })()
    );
  }
});
