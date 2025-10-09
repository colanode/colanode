import { Readable } from 'stream';

import { RedisClientType } from '@redis/client';
import { DataStore } from '@tus/server';

export interface Storage {
  download(path: string): Promise<{ stream: Readable; contentType?: string }>;
  delete(path: string): Promise<void>;
  upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    contentLength?: bigint
  ): Promise<void>;
  tusDataStore(): DataStore;
}
