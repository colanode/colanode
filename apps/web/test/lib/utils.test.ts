import { describe, expect, it, vi } from 'vitest';

import { isOpfsSupported, isMobileDevice } from '@colanode/web/lib/utils';

describe('lib/utils', () => {
  describe('isMobileDevice', () => {
    it('returns true for Android devices', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true for iPhone devices', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true for iPad devices', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true for iPod devices', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (iPod; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true for Opera Mini', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Opera/9.80 (J2ME/MIDP; Opera Mini/9.80 (S60; SymbOS)',
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns true for IEMobile', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0)',
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('returns false for desktop Chrome', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });
      expect(isMobileDevice()).toBe(false);
    });

    it('returns false for desktop Firefox', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      });
      expect(isMobileDevice()).toBe(false);
    });

    it('returns false for desktop Safari (Mac)', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isOpfsSupported', () => {
    it('returns false when navigator.storage is undefined', async () => {
      vi.stubGlobal('navigator', {});
      const result = await isOpfsSupported();
      expect(result).toBe(false);
    });

    it('returns false when navigator.storage.getDirectory is undefined', async () => {
      vi.stubGlobal('navigator', {
        storage: {},
      });
      const result = await isOpfsSupported();
      expect(result).toBe(false);
    });

    it('returns false when getDirectory returns null', async () => {
      vi.stubGlobal('navigator', {
        storage: {
          getDirectory: vi.fn().mockResolvedValue(null),
        },
      });
      const result = await isOpfsSupported();
      expect(result).toBe(false);
    });

    it('returns false when getDirectory throws an error', async () => {
      vi.stubGlobal('navigator', {
        storage: {
          getDirectory: vi.fn().mockRejectedValue(new Error('Not supported')),
        },
      });
      const result = await isOpfsSupported();
      expect(result).toBe(false);
    });

    it('returns true when getDirectory returns a valid directory handle', async () => {
      const mockDirectoryHandle = {
        kind: 'directory',
        name: 'root',
      };
      vi.stubGlobal('navigator', {
        storage: {
          getDirectory: vi.fn().mockResolvedValue(mockDirectoryHandle),
        },
      });
      const result = await isOpfsSupported();
      expect(result).toBe(true);
    });

    it('calls getDirectory to verify OPFS functionality', async () => {
      const getDirectoryMock = vi.fn().mockResolvedValue({ kind: 'directory' });
      vi.stubGlobal('navigator', {
        storage: {
          getDirectory: getDirectoryMock,
        },
      });
      await isOpfsSupported();
      expect(getDirectoryMock).toHaveBeenCalledOnce();
    });
  });
});
