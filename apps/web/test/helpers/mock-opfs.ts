/**
 * Mock implementation of OPFS FileSystemDirectoryHandle and FileSystemFileHandle
 * for testing WebFileSystem without real browser APIs.
 *
 * Uses 'any' type assertions to avoid strict TypeScript interface conflicts
 * while maintaining the behavior needed for tests.
 */

export class MockFileSystemFileHandle {
  public readonly kind = 'file' as const;
  public readonly name: string;
  private data: Uint8Array;

  constructor(name: string, data: Uint8Array = new Uint8Array()) {
    this.name = name;
    this.data = data;
  }

  async getFile(): Promise<File> {
    // Create a proper File mock with arrayBuffer method
    const arrayBuffer: ArrayBuffer = this.data.buffer.slice(
      this.data.byteOffset,
      this.data.byteOffset + this.data.byteLength
    ) as ArrayBuffer;

    const file = new File([arrayBuffer], this.name);
    // Ensure arrayBuffer method exists for tests
    if (!file.arrayBuffer) {
      (file as any).arrayBuffer = async () => arrayBuffer;
    }
    return file;
  }

  async createWritable(): Promise<any> {
    const handle = this;
    let buffer: Uint8Array = new Uint8Array();

    return {
      async write(data: any) {
        let chunk: Uint8Array | null = null;
        if (data instanceof Uint8Array) {
          chunk = data;
        } else if (data instanceof ArrayBuffer) {
          chunk = new Uint8Array(data);
        } else if (typeof data === 'string') {
          chunk = new TextEncoder().encode(data);
        }

        if (!chunk) {
          return;
        }

        const next = new Uint8Array(buffer.length + chunk.length);
        next.set(buffer);
        next.set(chunk, buffer.length);
        buffer = next;
      },
      async close() {
        handle.data = buffer;
      },
      async abort() {
        buffer = new Uint8Array();
      },
    };
  }

  async isSameEntry(): Promise<boolean> {
    return false;
  }

  async queryPermission(): Promise<PermissionState> {
    return 'granted';
  }

  async requestPermission(): Promise<PermissionState> {
    return 'granted';
  }
}

export class MockFileSystemDirectoryHandle {
  public readonly kind = 'directory' as const;
  public readonly name: string;
  private _entries = new Map<
    string,
    MockFileSystemDirectoryHandle | MockFileSystemFileHandle
  >();

  constructor(name: string = '') {
    this.name = name;
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<any> {
    const entry = this._entries.get(name);

    if (entry) {
      if (entry.kind === 'directory') {
        return entry;
      }
      throw new DOMException('Entry is a file', 'TypeMismatchError');
    }

    if (!options?.create) {
      throw new DOMException('Directory not found', 'NotFoundError');
    }

    const newDir = new MockFileSystemDirectoryHandle(name);
    this._entries.set(name, newDir);
    return newDir;
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<any> {
    const entry = this._entries.get(name);

    if (entry) {
      if (entry.kind === 'file') {
        return entry;
      }
      throw new DOMException('Entry is a directory', 'TypeMismatchError');
    }

    if (!options?.create) {
      throw new DOMException('File not found', 'NotFoundError');
    }

    const newFile = new MockFileSystemFileHandle(name);
    this._entries.set(name, newFile);
    return newFile;
  }

  async removeEntry(name: string, options?: { recursive?: boolean }) {
    const entry = this._entries.get(name);

    if (!entry) {
      throw new DOMException('Entry not found', 'NotFoundError');
    }

    if (entry.kind === 'directory' && !options?.recursive) {
      const dirHandle = entry as MockFileSystemDirectoryHandle;
      if (dirHandle._entries.size > 0) {
        throw new DOMException(
          'Directory not empty',
          'InvalidModificationError'
        );
      }
    }

    this._entries.delete(name);
  }

  async resolve(): Promise<string[] | null> {
    return null;
  }

  async isSameEntry(): Promise<boolean> {
    return false;
  }

  async queryPermission(): Promise<PermissionState> {
    return 'granted';
  }

  async requestPermission(): Promise<PermissionState> {
    return 'granted';
  }

  async *entries(): AsyncIterableIterator<[string, any]> {
    for (const [name, handle] of this._entries) {
      yield [name, handle];
    }
  }

  async *keys(): AsyncIterableIterator<string> {
    for (const name of this._entries.keys()) {
      yield name;
    }
  }

  async *values(): AsyncIterableIterator<any> {
    for (const handle of this._entries.values()) {
      yield handle;
    }
  }

  // Helper methods for testing
  hasEntry(name: string): boolean {
    return this._entries.has(name);
  }

  getEntrySync(
    name: string
  ): MockFileSystemDirectoryHandle | MockFileSystemFileHandle | undefined {
    return this._entries.get(name);
  }

  clear(): void {
    this._entries.clear();
  }
}
