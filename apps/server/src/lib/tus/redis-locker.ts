import { RedisClientType } from '@redis/client';
import {
  ERRORS,
  type Lock,
  type Locker,
  type RequestRelease,
} from '@tus/utils';
import { sha256 } from 'js-sha256';
import ms from 'ms';

/**
 * RedisLocker is an implementation of the Locker interface that manages locks using Redis.
 * This class is designed for distributed systems where multiple instances need to coordinate access to shared resources.
 *
 * Key Features:
 * - Uses Redis for centralized lock management, ensuring consistency across multiple server instances.
 * - Implements a polling mechanism with a timeout for lock acquisition.
 * - Leverages Redis's atomic operations and TTL (Time To Live) for reliable lock handling.
 * - Provides a fail-proof design by ensuring that only the lock owner can release a lock.
 *
 * Locking Behavior:
 * - The `lock` method attempts to acquire a lock by setting a key in Redis with a unique value.
 * - If the lock is already held, it polls Redis periodically until the lock is released or the timeout is reached.
 * - The `unlock` method ensures that only the process that acquired the lock can release it, preventing accidental releases.
 *
 * Edge Case Handling:
 * - **Process Crashes:** If a process crashes after acquiring a lock, Redis's TTL feature ensures that the lock is automatically released after a specified time, preventing deadlocks.
 * - **Network Issues:** The implementation is designed to handle transient network issues by retrying lock acquisition.
 * - **Race Conditions:** Atomic operations in Redis (SET with NX and PX options) are used to prevent race conditions during lock acquisition.
 */

const DELAY = ms('100 milliseconds');
const TIMEOUT = ms('30 seconds');
const UNLOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
` as const;

export class RedisLocker implements Locker {
  public readonly redis: RedisClientType;
  public readonly prefix: string;

  constructor(redis: RedisClientType, prefix: string) {
    this.redis = redis;
    this.prefix = prefix;
  }

  public newLock(id: string): Lock {
    return new RedisLock(id, this);
  }
}

class RedisLock implements Lock {
  private lockValue: string | null = null;

  constructor(
    private readonly id: string,
    private readonly locker: RedisLocker
  ) {}

  public async lock(
    stopSignal: AbortSignal,
    requestRelease?: RequestRelease
  ): Promise<void> {
    const abortController = new AbortController();
    const onAbort = () => {
      abortController.abort();
    };
    stopSignal.addEventListener('abort', onAbort);

    try {
      this.lockValue = crypto.randomUUID();
      const lockAcquired = await Promise.race([
        this.waitTimeout(abortController.signal),
        this.acquireLock(
          this.id,
          this.lockValue,
          requestRelease,
          abortController.signal
        ),
      ]);

      if (!lockAcquired) {
        throw ERRORS.ERR_LOCK_TIMEOUT;
      }
    } finally {
      stopSignal.removeEventListener('abort', onAbort);
      abortController.abort();
    }
  }

  private async acquireLock(
    id: string,
    lockValue: string,
    requestRelease: RequestRelease | undefined,
    signal: AbortSignal
  ): Promise<boolean> {
    if (signal.aborted) {
      return false;
    }

    const result = await this.locker.redis.set(
      this.buildRedisKey(id),
      lockValue,
      {
        expiration: {
          type: 'EX',
          value: Math.floor(TIMEOUT / 1000),
        },
        condition: 'NX',
      }
    );

    if (result === 'OK') {
      return true;
    }

    await requestRelease?.();

    await this.wait(DELAY);
    return this.acquireLock(id, lockValue, requestRelease, signal);
  }

  async unlock(): Promise<void> {
    if (!this.lockValue) {
      return;
    }

    await this.locker.redis.eval(UNLOCK_SCRIPT, {
      arguments: [this.lockValue],
      keys: [this.buildRedisKey(this.id)],
    });

    this.lockValue = null;
  }

  private waitTimeout(signal: AbortSignal): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, TIMEOUT);

      const abortListener = () => {
        clearTimeout(timeout);
        signal.removeEventListener('abort', abortListener);
        resolve(false);
      };
      signal.addEventListener('abort', abortListener);
    });
  }

  private buildRedisKey(id: string): string {
    const hash = sha256(id);
    return `${this.locker.prefix}:${hash}`;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
