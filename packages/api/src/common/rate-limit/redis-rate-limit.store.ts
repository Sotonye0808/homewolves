import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RateLimitStore } from './rate-limit-store';

/**
 * Redis-backed sliding-window limiter (shared across instances). Uses a sorted
 * set per key: timestamps are members (with unique suffixes) and the window is
 * trimmed with ZREMRANGEBYSCORE before ZCARD counts the hits.
 */
@Injectable()
export class RedisRateLimitStore implements RateLimitStore {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.client.ping();
  }

  async hit(key: string, limit: number, ttlMs: number): Promise<{ allowed: boolean; count: number }> {
    const redisKey = `rl:${key}`;
    const now = Date.now();
    const min = now - ttlMs;
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;

    const results = await this.client
      .multi()
      .zremrangebyscore(redisKey, 0, min)
      .zcard(redisKey)
      .zadd(redisKey, now, member)
      .expire(redisKey, Math.ceil(ttlMs / 1000) + 5)
      .exec();

    if (!results) throw new Error('Redis rate-limit exec returned null');

    const count = Number(results[1]?.[1] ?? 0);
    if (count >= limit) {
      // Remove the member we just added so the count reflects real hits.
      await this.client.zrem(redisKey, member);
      return { allowed: false, count };
    }

    return { allowed: true, count: count + 1 };
  }

  async dispose(): Promise<void> {
    await this.client.quit();
  }
}