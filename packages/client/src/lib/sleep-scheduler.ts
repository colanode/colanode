interface SleepState {
  timestamp: number;
  timeout: NodeJS.Timeout;
  resolve: () => void;
}

export class SleepScheduler {
  private sleepMap = new Map<string, SleepState>();

  public sleepUntil(id: string, timestamp: number): Promise<void> {
    if (this.sleepMap.has(id)) {
      throw new Error(`Sleep already exists for id: ${id}`);
    }

    return new Promise<void>((resolve) => {
      const delay = timestamp - Date.now();
      const timeout = setTimeout(() => {
        this.sleepMap.delete(id);
        resolve();
      }, delay);

      this.sleepMap.set(id, {
        timestamp,
        timeout,
        resolve,
      });
    });
  }

  public updateResolveTimeIfEarlier(id: string, timestamp: number): boolean {
    const existingSleep = this.sleepMap.get(id);
    if (!existingSleep) {
      return false;
    }

    if (timestamp >= existingSleep.timestamp) {
      return false;
    }

    clearTimeout(existingSleep.timeout);

    const delay = timestamp - Date.now();
    const newTimeout = setTimeout(() => {
      this.sleepMap.delete(id);
      existingSleep.resolve();
    }, delay);

    existingSleep.timestamp = timestamp;
    existingSleep.timeout = newTimeout;

    return true;
  }
}
