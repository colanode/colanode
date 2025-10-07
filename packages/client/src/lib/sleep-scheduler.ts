interface SleepState {
  timestamp: number;
  timeout: NodeJS.Timeout;
  resolve: () => void;
  promise: Promise<void>;
}

export class SleepScheduler {
  private sleepMap = new Map<string, SleepState>();

  public sleepUntil(id: string, timestamp: number): Promise<void> {
    const now = Date.now();
    if (timestamp <= now) {
      return Promise.resolve();
    }

    const existing = this.sleepMap.get(id);
    if (existing) {
      this.updateResolveTimeIfEarlier(id, timestamp);
      return existing.promise;
    }

    let resolve!: () => void;
    const promise = new Promise<void>((res) => (resolve = res));

    const state: SleepState = {
      timestamp,
      timeout: undefined as unknown as NodeJS.Timeout,
      resolve,
      promise,
    };

    const delay = Math.max(0, timestamp - Date.now());
    if (delay === 0) {
      state.resolve();
      return promise;
    }

    state.timeout = setTimeout(() => {
      this.sleepMap.delete(id);
      state.resolve();
    }, delay);

    this.sleepMap.set(id, state);
    return promise;
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

    const delay = Math.max(0, timestamp - Date.now());
    if (delay === 0) {
      this.sleepMap.delete(id);
      existingSleep.resolve();
      return true;
    }

    const newTimeout = setTimeout(() => {
      this.sleepMap.delete(id);
      existingSleep.resolve();
    }, delay);

    existingSleep.timestamp = timestamp;
    existingSleep.timeout = newTimeout;

    return true;
  }
}
