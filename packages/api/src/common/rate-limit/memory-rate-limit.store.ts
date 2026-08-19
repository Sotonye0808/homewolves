import { Injectable } from '@nestjs/common';
import { RateLimitStore } from './rate-limit-store';

interface Bucket {
  timestamps: number[];
}

/**
 * In-memory sliding-window limiter (per-instance only). Used by default and as
 * the fallback when Redis is unavailable or not configured.
 */
@Injectable()
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly store = new Map<string, Bucket>();
  private readonly maxBuckets = 10_000;
  private lastCleanup = Date.now();

  async hit(key: string, limit: number, ttlMs: number): Promise<{ allowed: boolean; count: number }> {
    this.cleanup();
    const now = Date.now();
    const bucket = this.store.get(key) ?? { timestamps: [] };
    const windowStart = now - ttlMs;
    bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

    const count = bucket.timestamps.length;
    if (count >= limit) {
      this.store.set(key, bucket);
      return { allowed: false, count };
    }

    bucket.timestamps.push(now);
    this.store.set(key, bucket);
    return { allowed: true, count: count + 1 };
  }

  private cleanup() {
    if (Date.now() - this.lastCleanup < 60_000) return;
    this.lastCleanup = Date.now();
    const now = Date.now();
    for (const [key, bucket] of this.store.entries()) {
      bucket.timestamps = bucket.timestamps.filter((t) => t > now - 5 * 60_000);
      if (bucket.timestamps.length === 0) this.store.delete(key);
    }
    if (this.store.size > this.maxBuckets) {
      this.store.clear();
    }
  }
}