import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { RATE_LIMIT_STORE, RateLimitStore } from './rate-limit-store';
import { MemoryRateLimitStore } from './memory-rate-limit.store';
import { RedisRateLimitStore } from './redis-rate-limit.store';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: RATE_LIMIT_STORE,
      useFactory: async (): Promise<RateLimitStore> => {
        const url = process.env.REDIS_URL;
        if (!url) return new MemoryRateLimitStore();

        try {
          const store = new RedisRateLimitStore(url);
          await store.connect();
          new Logger('RateLimitModule').log('Redis-backed rate limiting enabled');
          return store;
        } catch (err) {
          new Logger('RateLimitModule').warn(
            `Redis unavailable — falling back to in-memory rate limiting: ${(err as Error).message}`,
          );
          return new MemoryRateLimitStore();
        }
      },
    },
  ],
  exports: [RATE_LIMIT_STORE],
})
export class RateLimitModule {}

export { RATE_LIMIT_STORE } from './rate-limit-store';