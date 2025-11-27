import { Directory, File as ExpoFile, Paths } from 'expo-file-system';

import { FileReadStream, FileSystem } from '@colanode/client/services';

export class MobileFileSystem implements FileSystem {
  private resolveDirectory(path: string): Directory | null {
    const directoryUri = Paths.dirname(path);

    if (!directoryUri || directoryUri === path) {
      return null;
    }

    return new Directory(directoryUri);
  }

  private async ensureDirectory(path: string): Promise<void> {
    const directory = new Directory(path);

    if (!directory.exists) {
      directory.create({ intermediates: true, idempotent: true });
    }
  }

  private async ensureParentDirectory(path: string): Promise<void> {
    const parentDirectory = this.resolveDirectory(path);

    if (!parentDirectory) {
      return;
    }

    await this.ensureDirectory(parentDirectory.uri);
  }

  public async makeDirectory(path: string): Promise<void> {
    await this.ensureDirectory(path);
  }

  public async exists(path: string): Promise<boolean> {
    try {
      return Paths.info(path).exists;
    } catch {
      return false;
    }
  }

  public async copy(source: string, destination: string): Promise<void> {
    await this.ensureParentDirectory(destination);

    const sourceFile = new ExpoFile(source);
    const destinationFile = new ExpoFile(destination);

    if (destinationFile.exists) {
      destinationFile.delete();
    }

    if (!sourceFile.exists) {
      throw new Error(`File not found: ${source}`);
    }

    sourceFile.copy(destinationFile);
  }

  public async readStream(path: string): Promise<FileReadStream> {
    const file = new ExpoFile(path);

    if (!file.exists) {
      throw new Error(`File not found: ${path}`);
    }

    return file as unknown as FileReadStream;
  }

  public async writeStream(path: string): Promise<WritableStream<Uint8Array>> {
    await this.ensureParentDirectory(path);

    const file = new ExpoFile(path);
    file.create({ intermediates: true, overwrite: true });

    return file.writableStream();
  }

  public async listFiles(path: string): Promise<string[]> {
    const directory = new Directory(path);

    if (!directory.exists) {
      return [];
    }

    return directory.list().map((entry) => entry.name);
  }

  public async readFile(path: string): Promise<Uint8Array> {
    const file = new ExpoFile(path);

    if (!file.exists) {
      throw new Error(`File not found: ${path}`);
    }

    const bytes = await file.bytes();
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  }

  public async writeFile(path: string, data: Uint8Array): Promise<void> {
    await this.ensureParentDirectory(path);

    const file = new ExpoFile(path);
    file.create({ intermediates: true, overwrite: true });
    file.write(data);
  }

  public async delete(path: string): Promise<void> {
    const pathInfo = Paths.info(path);

    if (!pathInfo.exists) {
      return;
    }

    if (pathInfo.isDirectory) {
      const directory = new Directory(path);
      directory.delete();
      return;
    }

    const file = new ExpoFile(path);
    file.delete();
  }

  public async url(path: string): Promise<string> {
    const file = new ExpoFile(path);

    if (!file.exists) {
      throw new Error(`File not found: ${path}`);
    }

    return file.uri;
  }
}
