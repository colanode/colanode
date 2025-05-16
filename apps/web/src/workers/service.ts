// Service worker that intercepts requests with the path /asset
declare const self: ServiceWorkerGlobalScope;

import { AssetService } from '@colanode/client/services';

import { WebKyselyService } from '../services/kysely-service';
import { WebFileSystem } from '../services/file-system';
import { paths } from '../services/app-paths';

// Initialize asset service
const fs = new WebFileSystem();
const kysely = new WebKyselyService();
const assetService = new AssetService(kysely, fs, paths);

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(assetService.init());
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event: FetchEvent) => {
  const url = new URL(event.request.url);
  const segments = url.pathname.split('/').filter(Boolean);

  if (segments[0] !== 'asset') {
    return;
  }

  const assetType = segments[1];
  const assetId = segments[2];

  if (!assetType || !assetId) {
    event.respondWith(new Response('Invalid asset path', { status: 404 }));
    return;
  }

  if (assetType === 'emojis') {
    const emoji = await assetService.fetchEmoji(assetId);

    if (!emoji) {
      event.respondWith(new Response('Emoji not found', { status: 404 }));
      return;
    }

    event.respondWith(
      new Response(emoji, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );
  } else if (assetType === 'icons') {
    const icon = await assetService.fetchIcon(assetId);

    if (!icon) {
      event.respondWith(new Response('Icon not found', { status: 404 }));
      return;
    }

    event.respondWith(
      new Response(icon, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );
  } else {
    event.respondWith(new Response('Invalid asset type', { status: 404 }));
  }
});
