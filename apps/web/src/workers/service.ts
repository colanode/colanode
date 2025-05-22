/// <reference lib="webworker" />

// Service worker that intercepts requests with the path /asset
declare const self: ServiceWorkerGlobalScope;

import { fileTypeFromBuffer } from 'file-type';

import { WebFileSystem } from '@colanode/web/services/file-system';
import { WebPathService } from '@colanode/web/services/path-service';

const path = new WebPathService();
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
  event.waitUntil(downloadDbs());
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/assets/avatars')) {
    event.respondWith(
      (async () => {
        const urlPath = url.pathname.split('/assets/avatars/')[1];
        const [accountId, avatarId] = urlPath?.split('/') ?? [];

        if (!accountId || !avatarId) {
          return new Response('Not found', { status: 404 });
        }

        const avatarPath = path.accountAvatar(accountId, avatarId);
        const exists = await fs.exists(avatarPath);

        if (!exists) {
          return new Response('Not found', { status: 404 });
        }

        const fileBuffer = await fs.readFile(avatarPath);
        const fileType = await fileTypeFromBuffer(fileBuffer);

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': fileType?.mime ?? 'image/jpeg',
          },
        });
      })()
    );
  } else if (url.pathname.startsWith('/files')) {
    event.respondWith(
      (async () => {
        const urlPath = url.pathname.split('/files/')[1];
        const [accountId, workspaceId, file] = urlPath?.split('/') ?? [];

        if (!accountId || !workspaceId || !file) {
          return new Response('Not found', { status: 404 });
        }

        const filePath = path.workspaceFile(accountId, workspaceId, file);
        const exists = await fs.exists(filePath);

        if (!exists) {
          return new Response('Not found', { status: 404 });
        }

        const fileBuffer = await fs.readFile(filePath);
        const fileType = await fileTypeFromBuffer(fileBuffer);

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': fileType?.mime ?? 'application/octet-stream',
          },
        });
      })()
    );
  } else if (url.pathname.startsWith('/temp')) {
    event.respondWith(
      (async () => {
        const name = url.pathname.split('/temp/')[1];
        if (!name) {
          return new Response('Not found', { status: 404 });
        }

        const filePath = path.tempFile(name);
        const exists = await fs.exists(filePath);

        if (!exists) {
          return new Response('Not found', { status: 404 });
        }

        const fileBuffer = await fs.readFile(filePath);
        const fileType = await fileTypeFromBuffer(fileBuffer);

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': fileType?.mime ?? 'application/octet-stream',
          },
        });
      })()
    );
  }
});
