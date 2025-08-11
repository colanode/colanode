import { FileReadStream, FileSystem } from '@colanode/client/services';

export class WebFileSystem implements FileSystem {
  private root: FileSystemDirectoryHandle | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Get access to the origin private file system
      this.root = await navigator.storage.getDirectory();
    } catch (error) {
      console.error('Failed to initialize OPFS:', error);
    }
  }

  private async ensureInitialized(): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      await this.initialize();
      if (!this.root) {
        throw new Error('File system not initialized');
      }
    }
    return this.root;
  }

  // Get a directory handle, creating parent directories as needed
  private async getDirectoryHandle(
    path: string,
    create = false
  ): Promise<FileSystemDirectoryHandle> {
    const root = await this.ensureInitialized();

    if (path === '' || path === '/' || path === '.') {
      return root;
    }

    const parts = path.split('/').filter((p) => p && p !== '.');
    let currentDir = root;

    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part, { create });
      } catch {
        throw new Error(`Failed to access directory: ${path}`);
      }
    }

    return currentDir;
  }

  // Get the parent directory and file name from a path
  private async getFileLocation(
    path: string,
    create = false
  ): Promise<{ parent: FileSystemDirectoryHandle; name: string }> {
    const parts = path.split('/').filter((p) => p && p !== '.');
    const fileName = parts.pop();

    if (!fileName) {
      throw new Error(`Invalid file path: ${path}`);
    }

    const dirPath = parts.join('/');
    const parent = await this.getDirectoryHandle(dirPath, create);

    return { parent, name: fileName };
  }

  public async makeDirectory(path: string): Promise<void> {
    await this.getDirectoryHandle(path, true);
  }

  public async exists(path: string): Promise<boolean> {
    try {
      const parts = path.split('/').filter((p) => p && p !== '.');
      const name = parts.pop();

      if (!name) {
        // Root directory always exists
        return true;
      }

      const dirPath = parts.join('/');
      const parent = await this.getDirectoryHandle(dirPath, false);

      try {
        // Try to get as file first
        await parent.getFileHandle(name);
        return true;
      } catch {
        // If not a file, try as directory
        try {
          await parent.getDirectoryHandle(name);
          return true;
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
  }

  public async delete(path: string): Promise<void> {
    try {
      const { parent, name } = await this.getFileLocation(path);
      await parent.removeEntry(name, { recursive: true });
    } catch (error) {
      // If the file doesn't exist, consider it already deleted
      if (!(await this.exists(path))) {
        return;
      }
      throw error;
    }
  }

  public async copy(source: string, destination: string): Promise<void> {
    // Read the source file
    const data = await this.readFile(source);

    // Write to the destination
    await this.writeFile(destination, data);
  }

  public async readStream(path: string): Promise<FileReadStream> {
    const { parent, name } = await this.getFileLocation(path, false);
    const fileHandle = await parent.getFileHandle(name);
    const file = await fileHandle.getFile();
    return file;
  }

  public async writeStream(path: string): Promise<WritableStream<Uint8Array>> {
    const { parent, name } = await this.getFileLocation(path, /*create*/ true);
    const fileHandle = await parent.getFileHandle(name, { create: true });
    const file = await fileHandle.createWritable({ keepExistingData: false });

    return new WritableStream<Uint8Array>({
      async write(chunk) {
        // write each chunk directly to disk
        await file.write(chunk);
      },
      async close() {
        await file.close(); // makes the data durable
      },
      abort(reason) {
        // tidy up on error
        file.abort?.(reason);
      },
    });
  }

  public async listFiles(path: string): Promise<string[]> {
    const directory = await this.getDirectoryHandle(path, false);
    const files: string[] = [];

    // TypeScript's DOM lib might not have the latest FileSystem API types
    // Use type assertion to handle this
    const dirHandle = directory as unknown as {
      values(): AsyncIterableIterator<FileSystemHandle>;
    };

    // Iterate through all entries in the directory
    for await (const entry of dirHandle.values()) {
      files.push(entry.name);
    }

    return files;
  }

  public async readFile(path: string): Promise<Uint8Array> {
    const { parent, name } = await this.getFileLocation(path);
    const fileHandle = await parent.getFileHandle(name);
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  public async writeFile(path: string, data: Uint8Array): Promise<void> {
    const { parent, name } = await this.getFileLocation(path, true);

    // Create or open the file
    const fileHandle = await parent.getFileHandle(name, { create: true });

    // Create a writable stream and write the data
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  public async url(path: string): Promise<string> {
    const { parent, name } = await this.getFileLocation(path, false);
    const fileHandle = await parent.getFileHandle(name);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  }
}
