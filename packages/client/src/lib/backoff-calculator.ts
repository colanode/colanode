export class BackoffCalculator {
  private baseDelay: number = 5000; // Start at 5 seconds (5000 ms)
  private maxDelay: number = 600000; // Maximum delay is 10 minutes (600000 ms)
  private attempt: number = 0;
  private lastAttemptTime: number | null = null;

  constructor() {}

  // Increases the error count and sets the last attempt time
  public increaseError(): void {
    this.attempt += 1;
    this.lastAttemptTime = Date.now();
  }

  // Checks if the current time has passed the calculated backoff delay
  public canRetry(): boolean {
    if (this.attempt === 0 || this.lastAttemptTime === null) {
      return true; // Can retry immediately if no failures yet
    }
    const delay = this.getDelay();
    const timeSinceLastAttempt = Date.now() - this.lastAttemptTime;
    return timeSinceLastAttempt >= delay;
  }

  // Calculates the current backoff delay based on the number of attempts
  private getDelay(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempt - 1),
      this.maxDelay
    );
    return delay;
  }

  // Resets the calculator after a successful attempt
  public reset(): void {
    this.attempt = 0;
    this.lastAttemptTime = null;
  }

  // Returns the current delay time for informational purposes
  public getCurrentDelay(): number {
    return this.getDelay();
  }
}
