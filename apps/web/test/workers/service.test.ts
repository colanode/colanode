import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebFileSystem } from '@colanode/web/services/file-system';
import { WebPathService } from '@colanode/web/services/path-service';

import { MockFileSystemDirectoryHandle } from '../helpers/mock-opfs';

vi.mock('workbox-precaching', () => ({
  precacheAndRoute: vi.fn(),
}));

vi.mock('workbox-routing', () => ({
  registerRoute: vi.fn(),
}));

vi.mock('workbox-strategies', () => ({
  StaleWhileRevalidate: vi.fn(),
}));

describe('Service Worker', () => {
  let mockRoot: MockFileSystemDirectoryHandle;
  let path: WebPathService;
  let fs: WebFileSystem;
  let mockFetch: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let installHandler: ((event: ExtendableEvent) => void) | null = null;

  const importWorker = async () => {
    vi.resetModules();
    return import('@colanode/web/workers/service');
  };

  beforeEach(async () => {
    installHandler = null;
    mockRoot = new MockFileSystemDirectoryHandle('root');
    const mockGetDirectory = vi.fn().mockResolvedValue(mockRoot);
    vi.stubGlobal('navigator', {
      storage: {
        getDirectory: mockGetDirectory,
      },
    });

    path = new WebPathService();
    fs = new WebFileSystem();

    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.stubGlobal('self', {
      __WB_DISABLE_DEV_LOGS: false,
      __WB_MANIFEST: [],
      location: { origin: 'https://example.com' },
      addEventListener: vi.fn((type, handler) => {
        if (type === 'install') {
          installHandler = handler as (event: ExtendableEvent) => void;
        }
      }),
      skipWaiting: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it('downloads emojis database and writes to filesystem', async () => {
    const mockEmojiData = new Uint8Array([1, 2, 3, 4]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: vi.fn().mockResolvedValue(mockEmojiData.buffer),
    });

    const service = await importWorker();
    await service.downloadEmojis();

    expect(mockFetch).toHaveBeenCalledWith('/assets/emojis.db');
    const exists = await fs.exists(path.emojisDatabase);
    expect(exists).toBe(true);
    const content = await fs.readFile(path.emojisDatabase);
    expect(content).toEqual(mockEmojiData);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('logs an error when emoji download fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const service = await importWorker();
    await service.downloadEmojis();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to download emojis:',
      expect.any(Error)
    );
    const exists = await fs.exists(path.emojisDatabase);
    expect(exists).toBe(false);
  });

  it('downloads both databases in parallel', async () => {
    const mockEmojiData = new Uint8Array([1, 2, 3]);
    const mockIconData = new Uint8Array([4, 5, 6]);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(mockEmojiData.buffer),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(mockIconData.buffer),
      });

    const service = await importWorker();
    await service.downloadDbs();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const emojisExist = await fs.exists(path.emojisDatabase);
    const iconsExist = await fs.exists(path.iconsDatabase);
    expect(emojisExist).toBe(true);
    expect(iconsExist).toBe(true);
  });

  it('registers an install handler that runs downloadDbs and skipWaiting', async () => {
    const mockEmojiData = new Uint8Array([1, 2, 3]);
    const mockIconData = new Uint8Array([4, 5, 6]);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(mockEmojiData.buffer),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(mockIconData.buffer),
      });

    await importWorker();

    expect(installHandler).toBeTruthy();

    const waitUntil = vi.fn((promise: Promise<unknown>) => promise);
    const event = {
      waitUntil,
    } as unknown as ExtendableEvent;

    installHandler?.(event);

    expect(waitUntil).toHaveBeenCalledTimes(1);
    const waitPromise = waitUntil.mock.calls[0]?.[0] as Promise<unknown>;
    await waitPromise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith('/assets/emojis.db');
    expect(mockFetch).toHaveBeenCalledWith('/assets/icons.db');
    const worker = globalThis.self as unknown as {
      skipWaiting: ReturnType<typeof vi.fn>;
    };
    expect(worker.skipWaiting).toHaveBeenCalledTimes(1);
    const emojisExist = await fs.exists(path.emojisDatabase);
    const iconsExist = await fs.exists(path.iconsDatabase);
    expect(emojisExist).toBe(true);
    expect(iconsExist).toBe(true);
  });
});
