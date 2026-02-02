import { FileSystem } from '@colanode/client/services';

/**
 * Mock implementation of the FileSystem interface for testing.
 * Stores files in memory using a Map.
 */
export class MockFileSystem implements FileSystem {
  private files = new Map<string, Uint8Array>();
  private directories = new Set<string>();

  constructor(initialFiles?: Record<string, Uint8Array | string>) {
    if (initialFiles) {
      for (const [path, content] of Object.entries(initialFiles)) {
        if (typeof content === 'string') {
          this.files.set(path, new TextEncoder().encode(content));
        } else {
          this.files.set(path, content);
        }
        this.ensureParentDirectories(path);
      }
    }
  }

  private ensureParentDirectories(path: string): void {
    const parts = path.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join('/');
      if (dirPath) {
        this.directories.add(dirPath);
      }
    }
  }

  async reset(): Promise<void> {
    this.files.clear();
    this.directories.clear();
  }

  async makeDirectory(path: string): Promise<void> {
    this.directories.add(path);
    this.ensureParentDirectories(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }

  async delete(path: string): Promise<void> {
    this.files.delete(path);
    this.directories.delete(path);
  }

  async copy(source: string, destination: string): Promise<void> {
    const data = this.files.get(source);
    if (!data) {
      throw new Error(`Source file not found: ${source}`);
    }
    this.files.set(destination, data);
    this.ensureParentDirectories(destination);
  }

  async readStream(_path: string): Promise<any> {
    throw new Error('readStream not implemented in MockFileSystem');
  }

  async writeStream(_path: string): Promise<WritableStream<Uint8Array>> {
    throw new Error('writeStream not implemented in MockFileSystem');
  }

  async listFiles(path: string): Promise<string[]> {
    const files: string[] = [];
    const prefix = path ? `${path}/` : '';

    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix)) {
        const relativePath = filePath.substring(prefix.length);
        if (!relativePath.includes('/')) {
          files.push(relativePath);
        }
      }
    }

    for (const dirPath of this.directories) {
      if (dirPath.startsWith(prefix) && dirPath !== path) {
        const relativePath = dirPath.substring(prefix.length);
        if (!relativePath.includes('/')) {
          files.push(relativePath);
        }
      }
    }

    return files;
  }

  async readFile(path: string): Promise<Uint8Array> {
    const data = this.files.get(path);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return data;
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    this.files.set(path, data);
    this.ensureParentDirectories(path);
  }

  async url(): Promise<string | null> {
    return null;
  }

  // Helper methods for testing
  getFileAsString(path: string): string {
    const data = this.files.get(path);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return new TextDecoder().decode(data);
  }

  hasFile(path: string): boolean {
    return this.files.has(path);
  }

  hasDirectory(path: string): boolean {
    return this.directories.has(path);
  }

  getAllFiles(): string[] {
    return Array.from(this.files.keys());
  }

  getAllDirectories(): string[] {
    return Array.from(this.directories);
  }
}
