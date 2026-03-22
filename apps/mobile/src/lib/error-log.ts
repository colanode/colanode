type ErrorEntry = {
  timestamp: string;
  source: string;
  message: string;
  stack?: string;
};

const MAX_ENTRIES = 100;
const entries: ErrorEntry[] = [];

export const errorLog = {
  capture(source: string, error: unknown): void {
    const entry: ErrorEntry = {
      timestamp: new Date().toISOString(),
      source,
      message:
        error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    entries.push(entry);

    if (entries.length > MAX_ENTRIES) {
      entries.splice(0, entries.length - MAX_ENTRIES);
    }

    if (__DEV__) {
      console.warn(`[${entry.source}]`, entry.message);
    }
  },

  getEntries(): readonly ErrorEntry[] {
    return entries;
  },

  getRecent(count = 20): readonly ErrorEntry[] {
    return entries.slice(-count);
  },

  clear(): void {
    entries.length = 0;
  },

  format(): string {
    return entries
      .map(
        (e) =>
          `[${e.timestamp}] ${e.source}: ${e.message}${e.stack ? '\n' + e.stack : ''}`
      )
      .join('\n\n');
  },
};
