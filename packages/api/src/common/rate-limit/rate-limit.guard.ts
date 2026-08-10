import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { THROTTLE_KEY, DEFAULT_THROTTLE, ThrottleOptions } from './throttle.decorator';

interface Bucket {
  timestamps: number[];
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, Bucket>();
  private readonly maxBuckets = 10_000;
  private lastCleanup = Date.now();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? DEFAULT_THROTTLE;

    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);

    this.cleanup();
    const now = Date.now();
    const bucket = this.store.get(key) ?? { timestamps: [] };
    const windowStart = now - options.ttlMs;
    bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

    if (bucket.timestamps.length >= options.limit) {
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.timestamps.push(now);
    this.store.set(key, bucket);
    return true;
  }

  private getKey(request: { ip?: string }): string {
    return request.ip ?? 'unknown';
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
