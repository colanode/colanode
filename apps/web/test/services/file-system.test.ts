import { describe, expect, it, beforeEach, vi } from 'vitest';

import { WebFileSystem } from '@colanode/web/services/file-system';
import { MockFileSystemDirectoryHandle } from '../helpers/mock-opfs';

describe('services/file-system', () => {
  let fs: WebFileSystem;
  let mockRoot: MockFileSystemDirectoryHandle;

  beforeEach(() => {
    mockRoot = new MockFileSystemDirectoryHandle();

    // Mock navigator.storage.getDirectory
    vi.stubGlobal('navigator', {
      storage: {
        getDirectory: vi.fn().mockResolvedValue(mockRoot),
      },
    });

    // Mock URL.createObjectURL for url() tests
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => `blob:mock-${Date.now()}`);
    }

    fs = new WebFileSystem();
  });

  describe('makeDirectory', () => {
    it('creates a simple directory', async () => {
      await fs.makeDirectory('test');

      expect(mockRoot.hasEntry('test')).toBe(true);
      const entry = mockRoot.getEntrySync('test');
      expect(entry?.kind).toBe('directory');
    });

    it('creates nested directories', async () => {
      await fs.makeDirectory('a/b/c');

      const dirA = mockRoot.getEntrySync('a');
      expect(dirA?.kind).toBe('directory');

      if (dirA?.kind === 'directory') {
        const dirB = dirA.getEntrySync('b');
        expect(dirB?.kind).toBe('directory');

        if (dirB?.kind === 'directory') {
          const dirC = dirB.getEntrySync('c');
          expect(dirC?.kind).toBe('directory');
        }
      }
    });

    it('handles existing directories without error', async () => {
      await fs.makeDirectory('test');
      await expect(fs.makeDirectory('test')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('returns false for non-existent files', async () => {
      const result = await fs.exists('nonexistent.txt');
      expect(result).toBe(false);
    });

    it('returns true for existing files', async () => {
      await fs.writeFile('test.txt', new Uint8Array([1, 2, 3]));

      const result = await fs.exists('test.txt');
      expect(result).toBe(true);
    });

    it('returns true for existing directories', async () => {
      await fs.makeDirectory('test');

      const result = await fs.exists('test');
      expect(result).toBe(true);
    });

    it('returns true for root directory', async () => {
      const result = await fs.exists('');
      expect(result).toBe(true);
    });

    it('returns false for files in non-existent directories', async () => {
      const result = await fs.exists('nonexistent/file.txt');
      expect(result).toBe(false);
    });
  });

  describe('writeFile and readFile', () => {
    it('writes and reads a file', async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      await fs.writeFile('test.txt', data);
      const result = await fs.readFile('test.txt');

      expect(result).toEqual(data);
    });

    it('creates parent directories automatically', async () => {
      const data = new Uint8Array([1, 2, 3]);

      await fs.writeFile('a/b/c/file.txt', data);

      expect(await fs.exists('a')).toBe(true);
      expect(await fs.exists('a/b')).toBe(true);
      expect(await fs.exists('a/b/c')).toBe(true);
      expect(await fs.exists('a/b/c/file.txt')).toBe(true);
    });

    it('overwrites existing files', async () => {
      await fs.writeFile('test.txt', new Uint8Array([1, 2, 3]));
      await fs.writeFile('test.txt', new Uint8Array([4, 5, 6]));

      const result = await fs.readFile('test.txt');
      expect(result).toEqual(new Uint8Array([4, 5, 6]));
    });

    it('throws error when reading non-existent file', async () => {
      await expect(fs.readFile('nonexistent.txt')).rejects.toThrow();
    });

    it('handles empty files', async () => {
      await fs.writeFile('empty.txt', new Uint8Array([]));

      const result = await fs.readFile('empty.txt');
      expect(result).toEqual(new Uint8Array([]));
    });

    it('handles large files', async () => {
      const largeData = new Uint8Array(1024 * 1024); // 1MB
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }

      await fs.writeFile('large.bin', largeData);
      const result = await fs.readFile('large.bin');

      expect(result.length).toBe(largeData.length);
      expect(result).toEqual(largeData);
    });
  });

  describe('delete', () => {
    it('deletes an existing file', async () => {
      await fs.writeFile('test.txt', new Uint8Array([1, 2, 3]));

      await fs.delete('test.txt');

      expect(await fs.exists('test.txt')).toBe(false);
    });

    it('deletes an existing directory recursively', async () => {
      await fs.makeDirectory('test/nested');
      await fs.writeFile('test/nested/file.txt', new Uint8Array([1, 2, 3]));

      await fs.delete('test');

      expect(await fs.exists('test')).toBe(false);
    });

    it('handles deleting non-existent files gracefully', async () => {
      await expect(fs.delete('nonexistent.txt')).resolves.not.toThrow();
    });

    it('deletes nested files', async () => {
      await fs.writeFile('a/b/c/file.txt', new Uint8Array([1, 2, 3]));

      await fs.delete('a/b/c/file.txt');

      expect(await fs.exists('a/b/c/file.txt')).toBe(false);
      expect(await fs.exists('a/b/c')).toBe(true); // parent dir still exists
    });
  });

  describe('copy', () => {
    it('copies a file to a new location', async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      await fs.writeFile('source.txt', data);

      await fs.copy('source.txt', 'dest.txt');

      const result = await fs.readFile('dest.txt');
      expect(result).toEqual(data);
      expect(await fs.exists('source.txt')).toBe(true); // original still exists
    });

    it('copies a file to a nested directory', async () => {
      await fs.writeFile('source.txt', new Uint8Array([1, 2, 3]));

      await fs.copy('source.txt', 'a/b/dest.txt');

      expect(await fs.exists('a/b/dest.txt')).toBe(true);
      const result = await fs.readFile('a/b/dest.txt');
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('overwrites destination if it exists', async () => {
      await fs.writeFile('source.txt', new Uint8Array([1, 2, 3]));
      await fs.writeFile('dest.txt', new Uint8Array([4, 5, 6]));

      await fs.copy('source.txt', 'dest.txt');

      const result = await fs.readFile('dest.txt');
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('throws error when source does not exist', async () => {
      await expect(fs.copy('nonexistent.txt', 'dest.txt')).rejects.toThrow();
    });
  });

  describe('listFiles', () => {
    it('lists files in a directory', async () => {
      await fs.writeFile('dir/file1.txt', new Uint8Array([1]));
      await fs.writeFile('dir/file2.txt', new Uint8Array([2]));
      await fs.makeDirectory('dir/subdir');

      const files = await fs.listFiles('dir');

      expect(files).toHaveLength(3);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toContain('subdir');
    });

    it('returns empty array for empty directory', async () => {
      await fs.makeDirectory('empty');

      const files = await fs.listFiles('empty');

      expect(files).toEqual([]);
    });

    it('only lists direct children', async () => {
      await fs.writeFile('dir/file.txt', new Uint8Array([1]));
      await fs.writeFile('dir/sub/nested.txt', new Uint8Array([2]));

      const files = await fs.listFiles('dir');

      expect(files).toContain('file.txt');
      expect(files).toContain('sub');
      expect(files).not.toContain('nested.txt');
    });

    it('throws error for non-existent directory', async () => {
      await expect(fs.listFiles('nonexistent')).rejects.toThrow();
    });
  });

  describe('reset', () => {
    it('deletes all files and directories', async () => {
      await fs.writeFile('file1.txt', new Uint8Array([1]));
      await fs.writeFile('dir/file2.txt', new Uint8Array([2]));
      await fs.makeDirectory('emptydir');

      await fs.reset();

      expect(await fs.exists('file1.txt')).toBe(false);
      expect(await fs.exists('dir')).toBe(false);
      expect(await fs.exists('emptydir')).toBe(false);
    });

    it('allows creating new files after reset', async () => {
      await fs.writeFile('test.txt', new Uint8Array([1]));
      await fs.reset();

      await fs.writeFile('new.txt', new Uint8Array([2]));

      expect(await fs.exists('new.txt')).toBe(true);
      const data = await fs.readFile('new.txt');
      expect(data).toEqual(new Uint8Array([2]));
    });
  });

  describe('url', () => {
    it('returns null for non-existent files', async () => {
      const url = await fs.url('nonexistent.txt');
      expect(url).toBeNull();
    });

    it('returns a blob URL for existing files', async () => {
      await fs.writeFile('test.txt', new Uint8Array([1, 2, 3]));

      const url = await fs.url('test.txt');

      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
      // Blob URLs start with 'blob:'
      if (url) {
        expect(url.startsWith('blob:')).toBe(true);
      }
    });
  });

  describe('writeStream and readStream', () => {
    it('writes data via stream', async () => {
      const stream = await fs.writeStream('stream.txt');
      const writer = stream.getWriter();

      await writer.write(new Uint8Array([1, 2, 3]));
      await writer.write(new Uint8Array([4, 5, 6]));
      await writer.close();

      const data = await fs.readFile('stream.txt');
      expect(data).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
    });

    it('reads data via stream', async () => {
      await fs.writeFile('test.txt', new Uint8Array([1, 2, 3]));

      const fileStream = await fs.readStream('test.txt');

      expect(fileStream).toBeTruthy();
      // FileReadStream is a File or Blob-like object
      expect(fileStream).toBeInstanceOf(File);
    });

    it('creates parent directories for writeStream', async () => {
      const stream = await fs.writeStream('a/b/c/stream.txt');
      const writer = stream.getWriter();

      await writer.write(new Uint8Array([1, 2, 3]));
      await writer.close();

      expect(await fs.exists('a/b/c')).toBe(true);
      expect(await fs.exists('a/b/c/stream.txt')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles paths with dots correctly', async () => {
      await fs.writeFile('file.with.dots.txt', new Uint8Array([1]));

      expect(await fs.exists('file.with.dots.txt')).toBe(true);
    });

    it('handles paths with special characters', async () => {
      await fs.writeFile('file_with-special.txt', new Uint8Array([1]));

      expect(await fs.exists('file_with-special.txt')).toBe(true);
    });

    it('handles deeply nested paths', async () => {
      const deepPath = 'a/b/c/d/e/f/g/h/i/j/file.txt';
      await fs.writeFile(deepPath, new Uint8Array([1]));

      expect(await fs.exists(deepPath)).toBe(true);
    });

    it('normalizes empty path segments', async () => {
      await fs.writeFile('dir/./file.txt', new Uint8Array([1]));

      expect(await fs.exists('dir/file.txt')).toBe(true);
    });
  });
});
