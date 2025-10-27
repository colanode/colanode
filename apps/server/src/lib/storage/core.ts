import { Readable } from 'stream';

import { DataStore } from '@tus/server';

export interface Storage {
  readonly tusStore: DataStore;
  download(path: string): Promise<{ stream: Readable; contentType?: string }>;
  delete(path: string): Promise<void>;
  upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    contentLength?: bigint
  ): Promise<void>;
}
