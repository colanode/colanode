interface SleepState {
  date: Date;
  timeout: NodeJS.Timeout;
  resolve: () => void;
}

export class SleepScheduler {
  private sleepMap = new Map<string, SleepState>();

  public sleepUntil(id: string, date: Date): Promise<void> {
    if (this.sleepMap.has(id)) {
      throw new Error(`Sleep already exists for id: ${id}`);
    }

    return new Promise<void>((resolve) => {
      const delay = date.getTime() - Date.now();
      const timeout = setTimeout(() => {
        this.sleepMap.delete(id);
        resolve();
      }, delay);

      this.sleepMap.set(id, {
        date,
        timeout,
        resolve,
      });
    });
  }

  public updateResolveTimeIfEarlier(id: string, date: Date): boolean {
    const existingSleep = this.sleepMap.get(id);
    if (!existingSleep) {
      return false;
    }

    if (date >= existingSleep.date) {
      return false;
    }

    clearTimeout(existingSleep.timeout);

    const delay = Math.max(0, date.getTime() - Date.now());
    if (delay === 0) {
      this.sleepMap.delete(id);
      existingSleep.resolve();
      return true;
    }

    const newTimeout = setTimeout(() => {
      this.sleepMap.delete(id);
      existingSleep.resolve();
    }, delay);

    existingSleep.date = date;
    existingSleep.timeout = newTimeout;

    return true;
  }
}
