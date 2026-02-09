import { describe, expect, it, beforeEach } from 'vitest';

import { WebPathService } from '@colanode/web/services/path-service';

describe('services/path-service', () => {
  let pathService: WebPathService;

  beforeEach(() => {
    pathService = new WebPathService();
  });

  describe('basic paths', () => {
    it('returns empty string for app path', () => {
      expect(pathService.app).toBe('');
    });

    it('returns "assets" for assets source path', () => {
      expect(pathService.assets).toBe('assets');
    });

    it('returns "app.db" for app database path', () => {
      expect(pathService.appDatabase).toBe('app.db');
    });

    it('returns "bootstrap.json" for bootstrap path', () => {
      expect(pathService.bootstrap).toBe('bootstrap.json');
    });

    it('returns "avatars" for avatars path', () => {
      expect(pathService.avatars).toBe('avatars');
    });

    it('returns "temp" for temp path', () => {
      expect(pathService.temp).toBe('temp');
    });

    it('returns "assets/fonts" for fonts path', () => {
      expect(pathService.fonts).toBe('assets/fonts');
    });

    it('returns "assets/emojis.db" for emojis database path', () => {
      expect(pathService.emojisDatabase).toBe('assets/emojis.db');
    });

    it('returns "assets/icons.db" for icons database path', () => {
      expect(pathService.iconsDatabase).toBe('assets/icons.db');
    });
  });

  describe('tempFile', () => {
    it('builds temp file paths correctly', () => {
      expect(pathService.tempFile('test.txt')).toBe('temp/test.txt');
    });

    it('handles file names with special characters', () => {
      expect(pathService.tempFile('file-name_123.pdf')).toBe(
        'temp/file-name_123.pdf'
      );
    });
  });

  describe('avatar', () => {
    it('builds avatar paths with .jpeg extension', () => {
      expect(pathService.avatar('avatar-123')).toBe('avatars/avatar-123.jpeg');
    });

    it('handles UUID-like avatar IDs', () => {
      expect(pathService.avatar('550e8400-e29b-41d4-a716-446655440000')).toBe(
        'avatars/550e8400-e29b-41d4-a716-446655440000.jpeg'
      );
    });
  });

  describe('workspace paths', () => {
    const userId = 'user-123';

    it('builds workspace root path', () => {
      expect(pathService.workspace(userId)).toBe('workspaces/user-123');
    });

    it('builds workspace database path', () => {
      expect(pathService.workspaceDatabase(userId)).toBe(
        'workspaces/user-123/workspace.db'
      );
    });

    it('builds workspace files directory path', () => {
      expect(pathService.workspaceFiles(userId)).toBe(
        'workspaces/user-123/files'
      );
    });

    it('builds workspace file path with extension', () => {
      expect(pathService.workspaceFile(userId, 'file-456', '.pdf')).toBe(
        'workspaces/user-123/files/file-456.pdf'
      );
    });

    it('builds workspace file path with different extensions', () => {
      expect(pathService.workspaceFile(userId, 'doc-789', '.docx')).toBe(
        'workspaces/user-123/files/doc-789.docx'
      );
      expect(pathService.workspaceFile(userId, 'img-001', '.jpg')).toBe(
        'workspaces/user-123/files/img-001.jpg'
      );
    });
  });

  describe('join', () => {
    it('joins multiple path segments with forward slashes', () => {
      expect(pathService.join('a', 'b', 'c')).toBe('a/b/c');
    });

    it('filters out empty strings', () => {
      expect(pathService.join('a', '', 'b', '', 'c')).toBe('a/b/c');
    });

    it('filters out null and undefined values', () => {
      expect(
        pathService.join('a', null as any, 'b', undefined as any, 'c')
      ).toBe('a/b/c');
    });

    it('handles single path segment', () => {
      expect(pathService.join('path')).toBe('path');
    });

    it('handles empty inputs', () => {
      expect(pathService.join()).toBe('');
      expect(pathService.join('', '', '')).toBe('');
    });

    it('trims the result', () => {
      expect(pathService.join('  a', 'b  ')).toBe('a/b');
    });
  });

  describe('dirname', () => {
    it('returns parent directory for a nested path', () => {
      expect(pathService.dirname('foo/bar/baz.txt')).toBe('foo/bar');
    });

    it('returns parent for two-level path', () => {
      expect(pathService.dirname('foo/bar.txt')).toBe('foo');
    });

    it('returns empty string for single-level path', () => {
      expect(pathService.dirname('file.txt')).toBe('');
    });

    it('returns empty string for root path', () => {
      expect(pathService.dirname('')).toBe('');
    });

    it('handles paths without extensions', () => {
      expect(pathService.dirname('foo/bar/baz')).toBe('foo/bar');
    });

    it('handles deeply nested paths', () => {
      expect(pathService.dirname('a/b/c/d/e/f.txt')).toBe('a/b/c/d/e');
    });
  });

  describe('filename', () => {
    it('extracts filename without extension', () => {
      expect(pathService.filename('document.pdf')).toBe('document');
    });

    it('extracts filename from nested path', () => {
      expect(pathService.filename('path/to/file.txt')).toBe('file');
    });

    it('handles files with multiple dots', () => {
      expect(pathService.filename('archive.tar.gz')).toBe('archive.tar');
    });

    it('handles files without extension', () => {
      expect(pathService.filename('README')).toBe('README');
    });

    it('handles empty path', () => {
      expect(pathService.filename('')).toBe('');
    });

    it('handles path ending with slash', () => {
      expect(pathService.filename('path/to/')).toBe('');
    });

    it('handles deeply nested path', () => {
      expect(pathService.filename('a/b/c/d/e/file.txt')).toBe('file');
    });
  });

  describe('extension', () => {
    it('extracts file extension with dot', () => {
      expect(pathService.extension('file.txt')).toBe('.txt');
    });

    it('extracts extension from nested path', () => {
      expect(pathService.extension('path/to/document.pdf')).toBe('.pdf');
    });

    it('handles files with multiple dots', () => {
      expect(pathService.extension('archive.tar.gz')).toBe('.gz');
    });

    it('returns empty string for files without extension', () => {
      expect(pathService.extension('README')).toBe('');
    });

    it('returns empty string for empty path', () => {
      expect(pathService.extension('')).toBe('');
    });

    it('handles common file extensions', () => {
      expect(pathService.extension('file.js')).toBe('.js');
      expect(pathService.extension('file.ts')).toBe('.ts');
      expect(pathService.extension('file.jsx')).toBe('.jsx');
      expect(pathService.extension('file.tsx')).toBe('.tsx');
      expect(pathService.extension('file.json')).toBe('.json');
      expect(pathService.extension('file.md')).toBe('.md');
    });
  });

  describe('font', () => {
    it('builds font path with font name', () => {
      expect(pathService.font('antonio.ttf')).toBe('assets/fonts/antonio.ttf');
    });

    it('handles different font formats', () => {
      expect(pathService.font('satoshi-variable.woff2')).toBe(
        'assets/fonts/satoshi-variable.woff2'
      );
    });
  });

  describe('edge cases and special characters', () => {
    it('handles workspace with special user ID characters', () => {
      const specialUserId = 'user-123_abc-def';
      expect(pathService.workspace(specialUserId)).toBe(
        'workspaces/user-123_abc-def'
      );
    });

    it('handles file IDs with UUIDs', () => {
      const fileId = '550e8400-e29b-41d4-a716-446655440000';
      expect(pathService.workspaceFile('user', fileId, '.txt')).toBe(
        'workspaces/user/files/550e8400-e29b-41d4-a716-446655440000.txt'
      );
    });

    it('handles paths with trailing slashes in dirname', () => {
      expect(pathService.dirname('foo/bar/')).toBe('foo/bar');
    });
  });
});
