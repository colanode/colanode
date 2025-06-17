import fs from 'fs';
import os from 'os';
import { Writable } from 'stream';

import {
  FileMetadata,
  FileReadStream,
  FileSystem,
} from '@colanode/client/services';

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

  public async readStream(path: string): Promise<FileReadStream> {
    return fs.createReadStream(path);
  }

  public async writeStream(path: string): Promise<WritableStream<Uint8Array>> {
    const stream = fs.createWriteStream(path);
    return Writable.toWeb(stream) as WritableStream<Uint8Array>;
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

  public async delete(path: string): Promise<void> {
    await fs.promises.rm(path, { recursive: true, force: true });
  }

  public async metadata(filePath: string): Promise<FileMetadata> {
    const stats = await fs.promises.stat(filePath);
    return {
      lastModified: stats.mtime.getTime(),
      size: stats.size,
    };
  }

  public async url(path: string): Promise<string> {
    return `local-file://${DesktopFileSystem.win32PathPreUrl(path)}`;
  }

  public static win32PathPreUrl(path: string): string {
    if (os.platform() === 'win32') {
      let urlPath = path;
      let filePathPrefix = "";

      urlPath = urlPath.replace(/\\/g, '/');
      if (/^[a-zA-Z]:/.test(urlPath)) {
        filePathPrefix = '/';
      }

      return `${filePathPrefix}${urlPath}`;
    }

    return path;
  }
}
