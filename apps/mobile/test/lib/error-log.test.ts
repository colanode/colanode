import { errorLog } from '@colanode/mobile/lib/error-log';

beforeEach(() => {
  errorLog.clear();
});

describe('errorLog', () => {
  it('should capture and retrieve errors', () => {
    errorLog.capture('test', new Error('something broke'));
    const entries = errorLog.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.source).toBe('test');
    expect(entries[0]!.message).toBe('something broke');
    expect(entries[0]!.stack).toBeDefined();
  });

  it('should capture non-Error values as strings', () => {
    errorLog.capture('test', 'plain string error');
    expect(errorLog.getEntries()[0]!.message).toBe('plain string error');
    expect(errorLog.getEntries()[0]!.stack).toBeUndefined();
  });

  it('should limit to MAX_ENTRIES', () => {
    for (let i = 0; i < 120; i++) {
      errorLog.capture('bulk', `error ${i}`);
    }
    expect(errorLog.getEntries()).toHaveLength(100);
    expect(errorLog.getEntries()[0]!.message).toBe('error 20');
  });

  it('should return recent entries', () => {
    for (let i = 0; i < 10; i++) {
      errorLog.capture('test', `error ${i}`);
    }
    const recent = errorLog.getRecent(3);
    expect(recent).toHaveLength(3);
    expect(recent[0]!.message).toBe('error 7');
  });

  it('should clear all entries', () => {
    errorLog.capture('test', 'will be cleared');
    errorLog.clear();
    expect(errorLog.getEntries()).toHaveLength(0);
  });

  it('should format entries for display', () => {
    errorLog.capture('auth', 'token expired');
    const formatted = errorLog.format();
    expect(formatted).toContain('auth: token expired');
  });
});
