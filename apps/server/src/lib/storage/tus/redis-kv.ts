import type { RedisClientType } from '@redis/client';
import type { Upload } from '@tus/server';
import type { KvStore } from '@tus/utils';
import { sha256 } from 'js-sha256';

/**
 * Redis based configstore.
 * Based on the Tus RedisKvStore, but with a custom prefix and a sha256 hash of the key.
 *
 * Original source: https://github.com/tus/tus-node-server/blob/main/packages/utils/src/kvstores/RedisKvStore.ts
 * Original author: Mitja Puzigaća <mitjap@gmail.com>
 */

export class RedisKvStore<T = Upload> implements KvStore<T> {
  private readonly redis: RedisClientType;
  private readonly prefix: string;

  constructor(redis: RedisClientType, prefix: string) {
    this.redis = redis;
    this.prefix = prefix;
  }

  public async get(key: string): Promise<T | undefined> {
    const redisKey = this.buildRedisKey(key);
    const redisValue = await this.redis.get(redisKey);
    return this.deserializeValue(redisValue);
  }

  public async set(key: string, value: T): Promise<void> {
    const redisKey = this.buildRedisKey(key);
    const redisValue = this.serializeValue(value);
    await this.redis.set(redisKey, redisValue);
  }

  public async delete(key: string): Promise<void> {
    const redisKey = this.buildRedisKey(key);
    await this.redis.del(redisKey);
  }

  public async list(): Promise<Array<string>> {
    const keys = new Set<string>();
    let cursor = '0';
    do {
      const result = await this.redis.scan(cursor, {
        MATCH: `${this.prefix}*`,
        COUNT: 20,
      });
      cursor = result.cursor;
      for (const key of result.keys) keys.add(key);
    } while (cursor !== '0');
    return Array.from(keys);
  }

  private buildRedisKey(key: string): string {
    const hash = sha256(key);
    return `${this.prefix}:${hash}`;
  }

  private serializeValue(value: T): string {
    return JSON.stringify(value);
  }

  private deserializeValue(buffer: string | null): T | undefined {
    return buffer ? JSON.parse(buffer) : undefined;
  }
}
