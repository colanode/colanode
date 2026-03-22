import {
  formatCountdownTime,
  formatFileSize,
  formatMessageTime,
  formatRelativeDate,
} from '@colanode/mobile/lib/format-utils';

describe('formatFileSize', () => {
  it('should return 0 B for null and undefined', () => {
    expect(formatFileSize(null)).toBe('0 B');
    expect(formatFileSize(undefined)).toBe('0 B');
  });

  it('should return 0 B for zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(5242880)).toBe('5.0 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });
});

describe('formatRelativeDate', () => {
  it('should return Today for today', () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe('Today');
  });

  it('should return Yesterday for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday.toISOString())).toBe('Yesterday');
  });

  it('should return formatted date for older dates', () => {
    const result = formatRelativeDate('2024-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});

describe('formatMessageTime', () => {
  it('should return a time string with hours and minutes', () => {
    const result = formatMessageTime('2024-06-15T14:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('formatCountdownTime', () => {
  it('should format seconds as m:ss', () => {
    expect(formatCountdownTime(0)).toBe('0:00');
    expect(formatCountdownTime(5)).toBe('0:05');
    expect(formatCountdownTime(65)).toBe('1:05');
    expect(formatCountdownTime(120)).toBe('2:00');
  });
});
