import { describe, expect, it, beforeEach, vi } from 'vitest';

import { build } from '@colanode/core';
import { WebBootstrapService } from '@colanode/web/services/bootstrap';
import { WebPathService } from '@colanode/web/services/path-service';
import { MockFileSystem } from '../helpers/mock-file-system';

describe('services/bootstrap', () => {
  let pathService: WebPathService;
  let fs: MockFileSystem;

  beforeEach(() => {
    pathService = new WebPathService();
    fs = new MockFileSystem();
  });

  describe('create', () => {
    it('creates a new service with default data when bootstrap file does not exist', async () => {
      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe(build.version);
      expect(service.needsFreshInstall).toBe(false);
    });

    it('loads existing bootstrap data when file exists', async () => {
      const bootstrapData = {
        version: '1.2.3',
      };

      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify(bootstrapData),
      });

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe('1.2.3');
      expect(service.needsFreshInstall).toBe(false);
    });

    it('detects fresh install when temp exists but bootstrap does not', async () => {
      fs = new MockFileSystem();
      await fs.makeDirectory('temp');

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.needsFreshInstall).toBe(true);
    });

    it('does not detect fresh install when both bootstrap and temp exist', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify({ version: '1.0.0' }),
      });
      await fs.makeDirectory('temp');

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.needsFreshInstall).toBe(false);
    });

    it('handles invalid JSON in bootstrap file gracefully', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': 'invalid{json}here',
      });

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe(build.version);
      expect(service.needsFreshInstall).toBe(false);
    });

    it('handles empty bootstrap file gracefully', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': '',
      });

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe(build.version);
      expect(service.needsFreshInstall).toBe(false);
    });

    it('handles bootstrap file with partial data', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify({}),
      });

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe(build.version);
    });

    it('handles bootstrap file with extra fields', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify({
          version: '2.0.0',
          extraField: 'should be ignored',
        }),
      });

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe('2.0.0');
    });
  });

  describe('updateVersion', () => {
    it('updates the version and persists to file system', async () => {
      const service = await WebBootstrapService.create(pathService, fs as any);

      await service.updateVersion('2.0.0');

      expect(service.version).toBe('2.0.0');
      expect(fs.hasFile('bootstrap.json')).toBe(true);

      const savedData = fs.getFileAsString('bootstrap.json');
      const parsed = JSON.parse(savedData);
      expect(parsed.version).toBe('2.0.0');
    });

    it('preserves proper JSON formatting', async () => {
      const service = await WebBootstrapService.create(pathService, fs as any);

      await service.updateVersion('3.1.0');

      const savedData = fs.getFileAsString('bootstrap.json');
      // Should be pretty-printed with 2 spaces
      expect(savedData).toContain('\n');
      expect(savedData).toContain('  ');

      const parsed = JSON.parse(savedData);
      expect(parsed.version).toBe('3.1.0');
    });

    it('overwrites existing bootstrap file', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify({ version: '1.0.0' }),
      });

      const service = await WebBootstrapService.create(pathService, fs as any);
      await service.updateVersion('4.0.0');

      const savedData = fs.getFileAsString('bootstrap.json');
      const parsed = JSON.parse(savedData);
      expect(parsed.version).toBe('4.0.0');
    });

    it('handles multiple version updates', async () => {
      const service = await WebBootstrapService.create(pathService, fs as any);

      await service.updateVersion('1.0.0');
      expect(service.version).toBe('1.0.0');

      await service.updateVersion('2.0.0');
      expect(service.version).toBe('2.0.0');

      await service.updateVersion('3.0.0');
      expect(service.version).toBe('3.0.0');

      const savedData = fs.getFileAsString('bootstrap.json');
      const parsed = JSON.parse(savedData);
      expect(parsed.version).toBe('3.0.0');
    });
  });

  describe('version getter', () => {
    it('returns the current version', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify({ version: '5.0.0' }),
      });

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe('5.0.0');
    });

    it('returns default version when no file exists', async () => {
      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.version).toBe(build.version);
    });
  });

  describe('needsFreshInstall getter', () => {
    it('returns true when temp directory exists without bootstrap file', async () => {
      await fs.makeDirectory('temp');

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.needsFreshInstall).toBe(true);
    });

    it('returns false when bootstrap file exists regardless of temp', async () => {
      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify({ version: '1.0.0' }),
      });
      await fs.makeDirectory('temp');

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.needsFreshInstall).toBe(false);
    });

    it('returns false when neither bootstrap nor temp exist', async () => {
      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.needsFreshInstall).toBe(false);
    });

    it('returns the same value on multiple calls', async () => {
      await fs.makeDirectory('temp');

      const service = await WebBootstrapService.create(pathService, fs as any);

      expect(service.needsFreshInstall).toBe(true);
      expect(service.needsFreshInstall).toBe(true);
      expect(service.needsFreshInstall).toBe(true);
    });
  });

  describe('file system error handling', () => {
    it('handles file system errors when reading bootstrap', async () => {
      const errorFs = {
        ...fs,
        exists: vi.fn().mockResolvedValue(true),
        readFile: vi.fn().mockRejectedValue(new Error('Read error')),
      } as any;

      const service = await WebBootstrapService.create(pathService, errorFs);

      // Should fall back to default values
      expect(service.version).toBe(build.version);
    });

    it('handles file system errors when checking directories', async () => {
      const errorFs = {
        ...fs,
        exists: vi.fn().mockRejectedValue(new Error('FS error')),
      } as any;

      // fs.exists errors will propagate - this is expected behavior
      await expect(
        WebBootstrapService.create(pathService, errorFs)
      ).rejects.toThrow('FS error');
    });
  });

  describe('integration scenarios', () => {
    it('handles a complete bootstrap lifecycle', async () => {
      // Initial creation
      const service1 = await WebBootstrapService.create(pathService, fs as any);
      expect(service1.version).toBe(build.version);

      // Update version
      await service1.updateVersion('1.0.0');

      // Create new service instance (simulating app restart)
      const service2 = await WebBootstrapService.create(pathService, fs as any);
      expect(service2.version).toBe('1.0.0');

      // Another update
      await service2.updateVersion('2.0.0');

      // Verify persistence
      const service3 = await WebBootstrapService.create(pathService, fs as any);
      expect(service3.version).toBe('2.0.0');
    });

    it('handles upgrade scenario from old version', async () => {
      // Simulate old installation
      fs = new MockFileSystem({
        'bootstrap.json': JSON.stringify({ version: '0.9.0' }),
      });

      const service = await WebBootstrapService.create(pathService, fs as any);
      expect(service.version).toBe('0.9.0');

      // Upgrade
      await service.updateVersion('1.0.0');
      expect(service.version).toBe('1.0.0');

      // Verify
      const savedData = fs.getFileAsString('bootstrap.json');
      const parsed = JSON.parse(savedData);
      expect(parsed.version).toBe('1.0.0');
    });
  });
});
