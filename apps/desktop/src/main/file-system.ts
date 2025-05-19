import fs from 'fs';

import { FileMetadata, FileSystem } from '@colanode/client/services';

export class DesktopFileSystem implements FileSystem {
  public async makeDirectory(path: string): Promise<void> {
    await fs.promises.mkdir(path, { recursive: true });
  }
  public async exists(path: string): Promise<boolean> {
    return fs.promises
      .access(path)
      .then(() => true)
      .catch(() => false);
  }
  public async copy(source: string, destination: string): Promise<void> {
    await fs.promises.copyFile(source, destination);
  }
  public createReadStream(path: string): Promise<ReadableStream<Uint8Array>> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(path);
      stream.on('open', () =>
        resolve(stream as unknown as ReadableStream<Uint8Array>)
      );
      stream.on('error', reject);
    });
  }
  public createWriteStream(path: string): Promise<WritableStream<Uint8Array>> {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(path);
      stream.on('open', () =>
        resolve(stream as unknown as WritableStream<Uint8Array>)
      );
      stream.on('error', reject);
    });
  }
  public listFiles(path: string): Promise<string[]> {
    return fs.promises.readdir(path);
  }
  public readFile(path: string): Promise<Buffer> {
    return fs.promises.readFile(path);
  }
  public writeFile(path: string, data: Buffer): Promise<void> {
    return fs.promises.writeFile(path, data);
  }
  public statSync(path: string): { mtimeMs: number } {
    const stats = fs.statSync(path);
    return { mtimeMs: stats.mtime.getTime() };
  }
  public async delete(path: string): Promise<void> {
    await fs.promises.rm(path, { recursive: true, force: true });
  }
  public async metadata(path: string): Promise<FileMetadata> {
    const stats = await fs.promises.stat(path);
    return {
      lastModified: stats.mtime.getTime(),
      size: stats.size,
    };
  }
}
